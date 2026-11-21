import { OpenAI, toFile } from "openai"
import { logAiQuestion } from "../../lib/aiQuestionLogger"
import {
  assertAssistantRateLimit,
  isAnonymousFirebaseUser,
  isAssistantRateLimitError,
  sendAssistantRateLimitError,
} from "../../lib/assistantRateLimit"
import { getAdminAuth, getFirestore } from "../../lib/firebaseAdmin"

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

const MAX_REFERENCE_IMAGES = 3
const MAX_REFERENCE_BYTES = 25 * 1024 * 1024

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "what",
  "where",
  "when",
  "from",
  "about",
  "have",
  "need",
  "want",
  "can",
  "you",
  "please",
  "generate",
  "create",
  "make",
  "design",
  "image",
  "picture",
  "mockup",
  "mock-up",
  "using",
  "use",
  "saved",
  "stored",
])

function tokenize(text) {
  return Array.from(
    new Set(
      String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s/-]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 1 && !stopWords.has(token))
    )
  )
}

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

function normalizeConversationHistory(value) {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => ({
      role: entry?.role === "assistant" ? "assistant" : "user",
      content: String(entry?.content || "").trim().slice(0, 900),
    }))
    .filter((entry) => entry.content)
    .slice(-12)
}

function conversationContext(history) {
  if (!history.length) {
    return "No prior homepage assistant conversation is available."
  }

  return `Recent homepage assistant conversation:\n${history
    .map((entry) => `${entry.role}: ${entry.content}`)
    .join("\n")}`
}

async function getUserFromBody(req) {
  const idToken = String(req.body?.idToken || "").trim()
  if (!idToken) return null

  try {
    return await getAdminAuth().verifyIdToken(idToken)
  } catch (error) {
    console.warn("Ignoring invalid image generation token", error?.message || error)
    return null
  }
}

function isSupportedReferenceContentType(contentType) {
  return ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
    String(contentType || "").toLowerCase()
  )
}

function safeFileName(name = "reference.png") {
  return String(name)
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120)
}

function parseImageDataUrl(dataUrl) {
  const match = String(dataUrl || "").match(
    /^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/
  )

  if (!match) return null

  const contentType =
    match[1] === "image/jpg" ? "image/jpeg" : match[1]
  const buffer = Buffer.from(match[2], "base64")

  if (!buffer.length || buffer.length > MAX_REFERENCE_BYTES) {
    return null
  }

  return { buffer, contentType }
}

function referenceFromMedia(item, index) {
  const source =
    item?.kind === "video" ? item?.thumbnailDataUrl : item?.dataUrl
  const parsed = parseImageDataUrl(source)

  if (!parsed) return null

  const extension = parsed.contentType === "image/png"
    ? "png"
    : parsed.contentType === "image/webp"
      ? "webp"
      : "jpg"

  return {
    ...parsed,
    name: safeFileName(item?.name || `reference-${index + 1}.${extension}`),
    note: String(item?.note || "").trim().slice(0, 300),
    kind: item?.kind === "video" ? "video thumbnail" : "image",
    metadata: item?.metadata || {},
  }
}

function serializeSavedMedia(doc) {
  const data = doc.data() || {}
  const media = Array.isArray(data.media)
    ? data.media
    : Array.isArray(data.images)
      ? data.images
      : []

  return media
    .filter((item) => item?.downloadURL && item?.kind !== "video")
    .filter((item) => isSupportedReferenceContentType(item.contentType))
    .map((item) => ({
      entryId: doc.id,
      entryTitle: String(data.title || "Saved item"),
      entrySummary: String(data.summary || ""),
      categories: Array.isArray(data.categories) ? data.categories : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      searchableFields: Array.isArray(data.searchableFields)
        ? data.searchableFields
        : [],
      searchIndex: Array.isArray(data.searchIndex) ? data.searchIndex : [],
      name: item.name || "saved-image",
      note: item.note || "",
      kind: item.kind || "image",
      contentType: item.contentType || "",
      downloadURL: item.downloadURL,
      metadata: item.metadata || {},
    }))
}

function scoreSavedMedia(item, terms) {
  const haystack = [
    item.entryTitle,
    item.entrySummary,
    ...(item.categories || []),
    ...(item.tags || []),
    ...(item.searchableFields || []),
    ...(item.searchIndex || []),
    item.name,
    item.note,
    item.kind,
    item.contentType,
    item.metadata?.width,
    item.metadata?.height,
  ]
    .join(" ")
    .toLowerCase()

  return terms.reduce((score, term) => {
    if (haystack.includes(term)) return score + (term.length > 4 ? 3 : 2)
    return score
  }, 0)
}

async function savedMediaToReference(item) {
  try {
    const response = await fetch(item.downloadURL)
    if (!response.ok) return null

    const contentType = String(
      item.contentType || response.headers.get("content-type") || ""
    ).toLowerCase()

    if (!isSupportedReferenceContentType(contentType)) return null

    const buffer = Buffer.from(await response.arrayBuffer())
    if (!buffer.length || buffer.length > MAX_REFERENCE_BYTES) return null

    return {
      buffer,
      contentType: contentType === "image/jpg" ? "image/jpeg" : contentType,
      name: safeFileName(item.name || "saved-reference.jpg"),
      note: [item.entryTitle, item.note].filter(Boolean).join(" | "),
      kind: "saved image",
      metadata: item.metadata || {},
      savedEntryId: item.entryId,
      savedEntryTitle: item.entryTitle,
    }
  } catch (error) {
    console.warn("Could not load saved image reference", error?.message || error)
    return null
  }
}

async function findSavedImageReferences({ uid, prompt, limit }) {
  if (!uid || limit <= 0) return []

  const terms = tokenize(prompt)
  if (!terms.length) return []

  const snap = await getFirestore()
    .collection("users")
    .doc(uid)
    .collection("organizedItems")
    .orderBy("createdAt", "desc")
    .limit(80)
    .get()

  const matches = snap.docs
    .flatMap(serializeSavedMedia)
    .map((item) => ({
      ...item,
      score: scoreSavedMedia(item, terms),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit * 2)

  const references = []

  for (const item of matches) {
    if (references.length >= limit) break
    const reference = await savedMediaToReference(item)
    if (reference) references.push(reference)
  }

  return references
}

async function loadStoredAssistantHistory(uid) {
  if (!uid) return []

  try {
    const snap = await getFirestore()
      .collection("users")
      .doc(uid)
      .collection("assistantHistory")
      .orderBy("createdAt", "desc")
      .limit(12)
      .get()

    return snap.docs
      .reverse()
      .flatMap((doc) => {
        const data = doc.data() || {}
        return [
          { role: "user", content: String(data.prompt || "") },
          {
            role: "assistant",
            content: String(data.answerPreview || ""),
          },
        ]
      })
      .filter((entry) => entry.content)
  } catch (error) {
    console.warn("Could not load assistant history", error?.message || error)
    return []
  }
}

function chooseImageSize(prompt) {
  const text = String(prompt || "").toLowerCase()

  if (/\b(phone|mobile|portrait|story|reel|tiktok|vertical)\b/.test(text)) {
    return "1024x1536"
  }

  if (/\b(square|avatar|profile|icon)\b/.test(text)) {
    return "1024x1024"
  }

  return "1536x1024"
}

function buildImagePrompt({ prompt, references }) {
  const referenceText = references.length
    ? references
        .map((item, index) => {
          const dimensions =
            item.metadata?.width && item.metadata?.height
              ? `${item.metadata.width}x${item.metadata.height}`
              : ""

          return [
            `${index + 1}. ${item.name}`,
            `source: ${item.kind}`,
            item.savedEntryTitle ? `saved entry: ${item.savedEntryTitle}` : "",
            dimensions ? `dimensions: ${dimensions}` : "",
            item.note ? `note: ${item.note}` : "",
          ]
            .filter(Boolean)
            .join(" | ")
        })
        .join("\n")
    : "No reference images were provided."

  return `
Create one polished generated image for the user's request.

User request:
${prompt}

Reference material:
${referenceText}

Creative requirements:
- If the user asks for a webpage, app, landing page, product, or brand mockup, create a realistic polished visual mockup rather than code.
- If reference images include a logo or brand asset, use it tastefully and preserve the recognizable visual identity.
- Make the composition professional, useful, and ready to review.
- Avoid clutter and keep text readable.
- Do not invent contact information, prices, dates, awards, or legal claims unless the user explicitly provides them.
- Do not include a fake browser URL, fake phone number, or fake address unless requested.
  `.trim()
}

async function assessImageRequest({ prompt, references, history }) {
  const referenceSummary = references.length
    ? references
        .map((item, index) =>
          [
            `${index + 1}. ${item.name}`,
            `source: ${item.kind}`,
            item.savedEntryTitle ? `saved entry: ${item.savedEntryTitle}` : "",
            item.note ? `note: ${item.note}` : "",
          ]
            .filter(Boolean)
            .join(" | ")
        )
        .join("\n")
    : "No reference images are available."

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_HERO_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You decide whether an image-generation request is specific enough to generate a useful first draft. Be realistic about what the user is trying to achieve. Use conversation history to resolve follow-ups. Return only valid JSON.",
      },
      {
        role: "system",
        content:
          'Return JSON in this exact shape: {"ready":true|false,"clarifyingQuestion":"one specific question if not ready","brief":"a concise realistic image-generation brief if ready"}. Ask for clarification only when the request is too vague to generate a useful image, such as missing the kind of page/product, audience, brand goal, or key content. If there is enough context for a rough first draft, set ready true and write a practical brief. Do not ask multiple questions.',
      },
      {
        role: "system",
        content: conversationContext(history),
      },
      {
        role: "system",
        content: `Available reference images:\n${referenceSummary}`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.15,
    max_tokens: 260,
  })

  const parsed = parseModelJson(completion.choices?.[0]?.message?.content)

  if (!parsed) {
    return {
      ready: true,
      brief: prompt,
      clarifyingQuestion: "",
    }
  }

  return {
    ready: parsed.ready !== false,
    brief: String(parsed.brief || prompt).trim(),
    clarifyingQuestion: String(parsed.clarifyingQuestion || "").trim(),
  }
}

async function referencesToOpenAIImages(references) {
  return Promise.all(
    references.map((item) =>
      toFile(item.buffer, item.name, {
        type: item.contentType,
      })
    )
  )
}

export default async function generateHomeImage(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  if (!process.env.OPENAI_API_KEY && !process.env.DALLE_KEY) {
    res.status(500).json({ error: "OpenAI API key is not configured" })
    return
  }

  const prompt = String(req.body?.prompt || "").trim()

  if (!prompt) {
    res.status(400).json({ error: "Describe the image to generate." })
    return
  }

  let user = null

  try {
    user = await getUserFromBody(req)
    await assertAssistantRateLimit({
      req,
      uid: user?.uid || null,
      isAnonymous: isAnonymousFirebaseUser(user),
      prompt,
      action: "image-generation",
    })

    const clientHistory = normalizeConversationHistory(req.body?.history)
    const storedHistory = user ? await loadStoredAssistantHistory(user.uid) : []
    const history = normalizeConversationHistory([
      ...storedHistory,
      ...clientHistory,
    ])
    const rawMedia = Array.isArray(req.body?.media)
      ? req.body.media.slice(0, MAX_REFERENCE_IMAGES)
      : []
    const attachedReferences = rawMedia
      .map(referenceFromMedia)
      .filter(Boolean)

    if (rawMedia.length && !attachedReferences.length) {
      res.status(400).json({
        error:
          "Reference media for image generation needs a PNG, JPG, WebP, or video thumbnail.",
      })
      return
    }

    const savedReferences = user
      ? await findSavedImageReferences({
          uid: user.uid,
          prompt,
          limit: MAX_REFERENCE_IMAGES - attachedReferences.length,
        })
      : []
    const references = [...attachedReferences, ...savedReferences].slice(
      0,
      MAX_REFERENCE_IMAGES
    )
    const assessment = await assessImageRequest({ prompt, references, history })

    if (!assessment.ready) {
      const answer =
        assessment.clarifyingQuestion ||
        "What kind of image or mockup should I generate, and who is it for?"

      await logAiQuestion({
        uid: user?.uid || null,
        isAnonymous: isAnonymousFirebaseUser(user),
        prompt,
        source: req.body?.source || "home-image-generator",
        mode: "clarify",
        answer,
      })

      res.json({
        answer,
        needsClarification: true,
        clarificationFor: "image_generation",
        images: [],
      })
      return
    }

    const imagePrompt = buildImagePrompt({
      prompt: assessment.brief || prompt,
      references,
    })
    const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2"
    const size = chooseImageSize(`${prompt} ${assessment.brief || ""}`)

    let imageResult

    if (references.length) {
      imageResult = await openai.images.edit({
        model: imageModel,
        image: await referencesToOpenAIImages(references),
        prompt: imagePrompt,
        size,
        quality: "low",
        output_format: "png",
      })
    } else {
      imageResult = await openai.images.generate({
        model: imageModel,
        prompt: imagePrompt,
        size,
        quality: "low",
        output_format: "png",
      })
    }

    const image = imageResult?.data?.[0]
    const b64 = image?.b64_json

    if (!b64) {
      throw new Error("OpenAI did not return image data.")
    }

    const dataUrl = `data:image/png;base64,${b64}`
    const answer = references.length
      ? savedReferences.length
        ? "Generated an image using your reference media and relevant saved images."
        : "Generated an image using your reference media."
      : "Generated an image from your request."

    await logAiQuestion({
      uid: user?.uid || null,
      isAnonymous: isAnonymousFirebaseUser(user),
      prompt,
      source: req.body?.source || "home-image-generator",
      mode: "image",
      answer,
    })

    res.json({
      answer,
      images: [
        {
          id: `generated-${Date.now()}`,
          name: "generated-image.png",
          kind: "image",
          contentType: "image/png",
          dataUrl,
          prompt,
          size: Buffer.byteLength(b64, "base64"),
          metadata: {
            generated: true,
            model: imageModel,
            outputSize: size,
            brief: assessment.brief || prompt,
            referenceCount: references.length,
            attachedReferenceCount: attachedReferences.length,
            savedReferenceCount: savedReferences.length,
            savedReferenceTitles: savedReferences
              .map((item) => item.savedEntryTitle)
              .filter(Boolean),
          },
        },
      ],
      usage: imageResult?.usage || null,
    })
  } catch (error) {
    if (isAssistantRateLimitError(error)) {
      sendAssistantRateLimitError(res, error)
      return
    }

    console.error(error)
    await logAiQuestion({
      uid: user?.uid || null,
      isAnonymous: isAnonymousFirebaseUser(user),
      prompt,
      source: req.body?.source || "home-image-generator",
      mode: "error",
      answer: "Failed to generate image",
    })
    res.status(500).json({
      error: error?.message || "Failed to generate image.",
    })
  }
}
