import { randomUUID } from "crypto"
import OpenAI from "openai"
import {
  adminFieldValue,
  getAdminAuth,
  getFirestore,
  getStorageBucket,
} from "../../lib/firebaseAdmin"
import { logAiQuestion } from "../../lib/aiQuestionLogger"
import {
  assertAssistantRateLimit,
  isAnonymousFirebaseUser,
  isAssistantRateLimitError,
  sendAssistantRateLimitError,
} from "../../lib/assistantRateLimit"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "40mb",
    },
  },
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DALLE_KEY,
})

const MAX_MEDIA = 3
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 25 * 1024 * 1024
const MAX_TOTAL_MEDIA_BYTES = 28 * 1024 * 1024

function parseModelJson(text) {
  const raw = String(text || "").trim()

  try {
    return JSON.parse(raw)
  } catch {}

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function dataUrlToMedia(item) {
  const dataUrl = String(item?.dataUrl || "")
  const match = dataUrl.match(
    /^data:((?:image|video)\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/
  )

  if (!match) {
    throw new Error("Media must be sent as image or video data URLs.")
  }

  const contentType = match[1]
  const kind = contentType.startsWith("video/") ? "video" : "image"
  const buffer = Buffer.from(match[2], "base64")

  if (!buffer.length) {
    throw new Error("One of the media files was empty.")
  }

  const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES

  if (buffer.length > maxBytes) {
    throw new Error(
      `${kind === "video" ? "Videos" : "Images"} must be ${
        kind === "video" ? "25MB" : "5MB"
      } or smaller.`
    )
  }

  return {
    buffer,
    contentType,
    dataUrl,
    kind,
    name: String(item?.name || kind).slice(0, 120),
    note: String(item?.note || "").trim().slice(0, 500),
    lastModified: item?.lastModified || null,
    metadata: compactMediaMetadata(item?.metadata),
    thumbnailDataUrl: String(item?.thumbnailDataUrl || "").startsWith("data:image/")
      ? String(item.thumbnailDataUrl)
      : "",
    size: buffer.length,
  }
}

function extensionForContentType(contentType) {
  if (contentType === "image/png") return "png"
  if (contentType === "image/webp") return "webp"
  if (contentType === "image/gif") return "gif"
  if (contentType === "video/mp4") return "mp4"
  if (contentType === "video/webm") return "webm"
  if (contentType === "video/quicktime") return "mov"
  return "jpg"
}

function asStringArray(value, max = 18) {
  if (!Array.isArray(value)) return []

  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, max)
    )
  )
}

function compactString(value, fallback = "") {
  return String(value || fallback).trim()
}

function cleanClientId(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80)
}

function compactMediaMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") return {}

  return Object.fromEntries(
    [
      ["width", Number(metadata.width || 0) || null],
      ["height", Number(metadata.height || 0) || null],
      ["durationSeconds", Number(metadata.durationSeconds || 0) || null],
    ].filter(([, value]) => value != null)
  )
}

function normalizeAnalysis(analysis, prompt, storedMedia) {
  const rawDescriptions = Array.isArray(analysis?.mediaDescriptions)
    ? analysis.mediaDescriptions
    : Array.isArray(analysis?.imageDescriptions)
      ? analysis.imageDescriptions
      : []

  const mediaDescriptions = rawDescriptions.length
    ? rawDescriptions
        .map((item, index) => ({
          fileName: compactString(item?.fileName, storedMedia[index]?.name || ""),
          kind: compactString(item?.kind, storedMedia[index]?.kind || "image"),
          description: compactString(item?.description),
          visibleText: compactString(item?.visibleText),
          colors: asStringArray(item?.colors, 12),
          objects: asStringArray(item?.objects, 14),
          people: asStringArray(item?.people, 10),
          locations: asStringArray(item?.locations, 10),
          brands: asStringArray(item?.brands, 10),
          dates: asStringArray(item?.dates, 10),
          amounts: asStringArray(item?.amounts, 10),
          actions: asStringArray(item?.actions, 10),
          documentType: compactString(item?.documentType),
        }))
        .filter(
          (item) =>
            item.description ||
            item.objects.length ||
            item.visibleText ||
            item.colors.length ||
            item.brands.length
        )
    : []

  const event = analysis?.event && typeof analysis.event === "object"
    ? {
        isEvent: !!analysis.event.isEvent,
        title: compactString(analysis.event.title),
        startDate: compactString(analysis.event.startDate),
        startTime: compactString(analysis.event.startTime),
        timezone: compactString(analysis.event.timezone),
        location: compactString(analysis.event.location),
        description: compactString(analysis.event.description),
      }
    : {
        isEvent: false,
        title: "",
        startDate: "",
        startTime: "",
        timezone: "",
        location: "",
        description: "",
      }

  const title =
    compactString(analysis?.title) ||
    compactString(event.title) ||
    compactString(prompt).slice(0, 80) ||
    (storedMedia.length ? "Saved media entry" : "Saved note")

  const summary =
    compactString(analysis?.summary) ||
    compactString(prompt) ||
    "Saved organizer entry."

  return {
    title,
    summary,
    itemType: compactString(analysis?.itemType, storedMedia.length ? "media" : "note"),
    categories: asStringArray(analysis?.categories),
    tags: asStringArray(analysis?.tags, 24),
    searchableFields: asStringArray(analysis?.searchableFields, 32),
    retrievalHints: asStringArray(analysis?.retrievalHints, 16),
    mediaDescriptions,
    event,
  }
}

function buildSearchIndex({ prompt, analysis, media }) {
  const parts = [
    prompt,
    analysis.title,
    analysis.summary,
    analysis.itemType,
    ...analysis.categories,
    ...analysis.tags,
    ...analysis.searchableFields,
    ...analysis.retrievalHints,
    analysis.event?.title,
    analysis.event?.startDate,
    analysis.event?.startTime,
    analysis.event?.location,
    analysis.event?.description,
    ...media.flatMap((item) => [
      item.name,
      item.note,
      item.kind,
      item.contentType,
      item.metadata?.width,
      item.metadata?.height,
      item.metadata?.durationSeconds,
    ]),
    ...analysis.mediaDescriptions.flatMap((item) => [
      item.fileName,
      item.kind,
      item.description,
      item.visibleText,
      item.documentType,
      ...item.colors,
      ...item.objects,
      ...item.people,
      ...item.locations,
      ...item.brands,
      ...item.dates,
      ...item.amounts,
      ...item.actions,
    ]),
  ]

  return Array.from(
    new Set(
      parts
        .join(" ")
        .toLowerCase()
        .replace(/[^a-z0-9\s/-]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 1)
        .slice(0, 600)
    )
  )
}

async function uploadMedia({ uid, entryId, item, index }) {
  const bucket = getStorageBucket()
  const extension = extensionForContentType(item.contentType)
  const token = randomUUID()
  const storagePath = `users/${uid}/organizedMedia/${entryId}/${index + 1}.${extension}`
  const file = bucket.file(storagePath)
  const customMetadata = {
    firebaseStorageDownloadTokens: token,
    organizerKind: item.kind,
    ...(item.note ? { organizerNote: item.note } : {}),
  }

  await file.save(item.buffer, {
    resumable: false,
    contentType: item.contentType,
    metadata: {
      contentType: item.contentType,
      metadata: customMetadata,
    },
  })

  return {
    name: item.name,
    kind: item.kind,
    ...(item.note ? { note: item.note } : {}),
    contentType: item.contentType,
    size: item.size,
    ...(item.lastModified ? { lastModified: item.lastModified } : {}),
    ...(Object.keys(item.metadata || {}).length ? { metadata: item.metadata } : {}),
    storagePath,
    downloadURL: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      storagePath
    )}?alt=media&token=${token}`,
  }
}

async function analyzeEntry({ prompt, media }) {
  const content = [
    {
      type: "text",
      text:
        `Current date: ${new Date().toISOString().slice(0, 10)}.\n` +
        `User text/description:\n${prompt || "(none provided)"}\n\n` +
        `Attached media:\n${media
          .map((item, index) => {
            const dimensions =
              item.metadata?.width && item.metadata?.height
                ? `${item.metadata.width}x${item.metadata.height}`
                : ""
            const duration = item.metadata?.durationSeconds
              ? `${item.metadata.durationSeconds}s`
              : ""

            return [
              `${index + 1}. ${item.name}`,
              `kind: ${item.kind}`,
              `type: ${item.contentType}`,
              dimensions ? `dimensions: ${dimensions}` : "",
              duration ? `duration: ${duration}` : "",
              item.note ? `user note: ${item.note}` : "",
            ]
              .filter(Boolean)
              .join(" | ")
          })
          .join("\n")}`,
    },
  ]

  for (const item of media) {
    if (item.kind === "video") {
      content.push({
        type: "text",
        text: `The next image is a thumbnail frame extracted from the video file "${item.name}". Use it with the filename, note, duration, and dimensions to classify the video.`,
      })
    }

    const imageUrl =
      item.kind === "video" ? item.thumbnailDataUrl : item.dataUrl

    if (!imageUrl) continue

    content.push({
      type: "image_url",
      image_url: {
        url: imageUrl,
        detail: "auto",
      },
    })
  }

  const completion = await openai.chat.completions.create({
    model:
      process.env.OPENAI_ORGANIZER_MODEL ||
      process.env.OPENAI_VISION_MODEL ||
      "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You organize saved user data, media, notes, and future events. Read every image carefully, including visible text. For videos, use the thumbnail frame, filename, user note, duration, and dimensions. Classify the entry so it can be found later by related natural-language searches. Return only valid JSON.",
      },
      {
        role: "system",
        content:
          'Return JSON with this shape: {"title":"short title","summary":"1-2 sentence summary","itemType":"image|video|event|note|document|receipt|place|person|task|other","categories":["broad categories"],"tags":["specific tags"],"searchableFields":["words or phrases someone might search later"],"retrievalHints":["natural phrases useful for finding this later"],"mediaDescriptions":[{"fileName":"optional","kind":"image|video","description":"what is visible or represented","visibleText":"any readable text","colors":["dominant colors"],"objects":["objects"],"people":["people or roles if knowable"],"locations":["places or setting"],"brands":["logos or brands"],"dates":["visible or implied dates"],"amounts":["prices, measurements, quantities"],"actions":["activities or verbs"],"documentType":"receipt|flyer|screenshot|menu|ticket|note|other if applicable"}],"event":{"isEvent":true|false,"title":"event title if any","startDate":"YYYY-MM-DD if inferable","startTime":"HH:mm if inferable","timezone":"timezone if known","location":"where if known","description":"event details"}}. Extract as many concrete searchable values as you can without guessing sensitive identity. If a future event, appointment, meeting, trip, deadline, or scheduled activity is described, set event.isEvent true and infer date/time only when the user, media, or visible text provides enough information.',
      },
      {
        role: "user",
        content,
      },
    ],
    temperature: 0.15,
    max_tokens: 1200,
  })

  return parseModelJson(completion.choices?.[0]?.message?.content) || {}
}

export default async function organizeEntry(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  if (!process.env.OPENAI_API_KEY && !process.env.DALLE_KEY) {
    res.status(500).json({ error: "OpenAI API key is not configured" })
    return
  }

  try {
    const idToken = String(req.body?.idToken || "").trim()
    if (!idToken) {
      res.status(401).json({ error: "Sign in is required to save organizer entries." })
      return
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken)
    const uid = decoded.uid
    const ownerIsAnonymous = isAnonymousFirebaseUser(decoded)
    const clientId = cleanClientId(req.body?.clientId)
    const prompt = String(req.body?.prompt || "").trim()
    const rawMedia = Array.isArray(req.body?.media)
      ? req.body.media.slice(0, MAX_MEDIA)
      : Array.isArray(req.body?.images)
        ? req.body.images.slice(0, MAX_MEDIA)
      : []

    if (!prompt && !rawMedia.length) {
      res.status(400).json({ error: "Add text, media, or both before saving." })
      return
    }

    await assertAssistantRateLimit({
      req,
      uid,
      isAnonymous: isAnonymousFirebaseUser(decoded),
      prompt:
        prompt ||
        rawMedia
          .map((item) => String(item?.name || "").trim())
          .filter(Boolean)
          .join(" ") ||
        "media upload",
      action: "organizer",
    })

    const media = rawMedia.map(dataUrlToMedia)
    const totalBytes = media.reduce((total, item) => total + item.size, 0)

    if (totalBytes > MAX_TOTAL_MEDIA_BYTES) {
      res.status(400).json({ error: "Uploads must be 28MB or smaller total." })
      return
    }

    const entryId = randomUUID()
    const storedMedia = await Promise.all(
      media.map((item, index) => uploadMedia({ uid, entryId, item, index }))
    )

    const rawAnalysis = await analyzeEntry({ prompt, media })
    const analysis = normalizeAnalysis(rawAnalysis, prompt, storedMedia)
    const searchIndex = buildSearchIndex({ prompt, analysis, media: storedMedia })

    const item = {
      source: req.body?.source || "home-hero-organizer",
      ownerUid: uid,
      ownerIsAnonymous,
      ...(clientId ? { clientId } : {}),
      prompt,
      ...analysis,
      ...(storedMedia.length ? { media: storedMedia } : {}),
      searchIndex,
      createdAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
    }

    const db = getFirestore()
    await db
      .collection("users")
      .doc(uid)
      .collection("organizedItems")
      .doc(entryId)
      .set(item)

    await logAiQuestion({
      uid,
      isAnonymous: isAnonymousFirebaseUser(decoded),
      prompt,
      source: req.body?.source || "home-hero-organizer",
      mode: "organize",
      answer: `Saved ${item.title || "organizer entry"}.`,
    })

    res.json({
      item: {
        id: entryId,
        ...item,
        images: storedMedia,
        createdAt: null,
        updatedAt: null,
      },
    })
  } catch (error) {
    if (isAssistantRateLimitError(error)) {
      sendAssistantRateLimitError(res, error)
      return
    }

    console.error(error)
    res.status(500).json({
      error: error?.message || "Failed to organize this entry.",
    })
  }
}
