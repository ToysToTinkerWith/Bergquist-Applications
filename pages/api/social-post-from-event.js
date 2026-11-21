// pages/api/social-post-from-event.js
// Full replacement
// Fixes: converts every selected image and logo into a clean PNG before sending it to OpenAI.
// Requires: npm install openai sharp
// Environment: OPENAI_API_KEY=your_openai_api_key

import OpenAI, { toFile } from "openai"
import fs from "fs/promises"
import path from "path"
import sharp from "sharp"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SOCIAL_POST_COPY_MODEL =
  process.env.SOCIAL_POST_COPY_MODEL || "gpt-4o-mini"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
    responseLimit: "12mb",
  },
}

function badRequest(res, message, status = 400) {
  return res.status(status).json({ error: message })
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function extractJsonObject(text) {
  if (!text) return null
  const direct = safeJsonParse(text)
  if (direct && typeof direct === "object") return direct
  const match = String(text).match(/\{[\s\S]*\}/)
  if (!match) return null
  return safeJsonParse(match[0])
}

function normalizeHashtags(hashtags) {
  if (!Array.isArray(hashtags)) return []
  const cleaned = hashtags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean)
    .map((tag) => {
      const noHash = tag.replace(/^#+/, "").replace(/\s+/g, "")
      return noHash ? `#${noHash}` : ""
    })
    .filter(Boolean)
  return Array.from(new Set(cleaned)).slice(0, 10)
}

function getRequestOrigin(req) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
  if (configured) return configured.replace(/\/$/, "")
  const proto = req.headers["x-forwarded-proto"] || "https"
  const host = req.headers["x-forwarded-host"] || req.headers.host
  if (!host) return ""
  return `${proto}://${host}`
}

function toAbsoluteUrl(value, req) {
  const clean = String(value || "").trim()
  if (!clean) return ""
  if (/^https?:\/\//i.test(clean)) return clean
  if (clean.startsWith("data:")) return clean
  const origin = getRequestOrigin(req)
  if (!origin) return clean
  return `${origin}${clean.startsWith("/") ? clean : `/${clean}`}`
}

async function fetchImageBuffer(url) {
  if (!url) return null
  try {
    if (String(url).startsWith("data:")) {
      const match = String(url).match(/^data:([^;]+);base64,(.+)$/)
      if (!match) return null
      return {
        buffer: Buffer.from(match[2], "base64"),
        contentType: match[1] || "image/png",
      }
    }

    const response = await fetch(url)
    if (!response.ok) return null
    const contentType = response.headers.get("content-type") || "image/jpeg"
    if (!contentType.toLowerCase().startsWith("image/")) return null
    const arrayBuffer = await response.arrayBuffer()
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    }
  } catch {
    return null
  }
}

async function normalizeImageForOpenAI({ buffer, label, maxEdge = 1800 }) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error(`${label || "Image"} could not be read as a valid file buffer.`)
  }

  let image
  try {
    image = sharp(buffer, {
      animated: false,
      limitInputPixels: 80_000_000,
    }).rotate()
  } catch {
    throw new Error(`${label || "Image"} is not a supported image file.`)
  }

  let meta
  try {
    meta = await image.metadata()
  } catch {
    throw new Error(`${label || "Image"} is not readable. Try uploading a PNG or JPG.`)
  }

  if (!meta.width || !meta.height) {
    throw new Error(`${label || "Image"} does not have valid dimensions.`)
  }

  const needsResize = Math.max(meta.width, meta.height) > maxEdge

  try {
    // Convert all inputs to a plain RGB JPEG.
    // This avoids alpha channels, indexed PNG modes, animated formats,
    // CMYK profiles, HEIC/WebP quirks, and other image modes that can
    // trigger "Invalid image file or mode" in image edit requests.
    const jpegBuffer = await image
      .resize(
        needsResize
          ? {
              width: maxEdge,
              height: maxEdge,
              fit: "inside",
              withoutEnlargement: true,
            }
          : undefined
      )
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({
        quality: 90,
        mozjpeg: true,
      })
      .toBuffer()

    return {
      buffer: jpegBuffer,
      contentType: "image/jpeg",
      fileName: `${
        String(label || "image")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") || "image"
      }.jpg`,
    }
  } catch {
    throw new Error(`${label || "Image"} could not be converted into a valid JPEG for OpenAI.`)
  }
}

async function loadFallbackLogoBuffer() {
  const configuredPath = process.env.SOCIAL_POST_DEFAULT_LOGO_PATH || "/postLogo.png"
  const relativePath = configuredPath.replace(/^\/+/, "")
  const logoPath = path.join(process.cwd(), "public", relativePath)
  try {
    const buffer = await fs.readFile(logoPath)
    return { buffer, contentType: "image/png" }
  } catch {
    return null
  }
}

async function imageBufferToOpenAIFile({ buffer, fileName }) {
  return toFile(buffer, fileName || "image.jpg", { type: "image/jpeg" })
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return []
  return images
    .map((img, index) => ({
      id: String(img?.id || `image_${index + 1}`),
      url: String(img?.url || "").trim(),
      fileName: String(img?.fileName || `Selected image ${index + 1}`),
      message: String(img?.message || "").trim(),
      contentType: String(img?.contentType || ""),
    }))
    .filter((img) => img.url)
    .slice(0, 8)
}

function buildImagePrompt({ event, company, selectedImages }) {
  const imageNotes = selectedImages
    .map((img, index) => {
      const pieces = [
        `Reference image ${index + 1}: ${img.fileName || img.id}`,
        img.message ? `User note: ${img.message}` : "",
      ].filter(Boolean)
      return pieces.join(" — ")
    })
    .join("\n")

  return [
    `Create a professional social media promo image for ${company.name}.`,
    "Edit and use the selected project/work images as visual evidence of the completed work.",
    "Use the provided company logo as a brand reference and include the logo clearly in the final image.",
    "Infer what kind of work was done from the selected images, then make a polished promotional image that shows that work in a clean, brand-aligned way.",
    "The image should look like a finished social media promo for a real company, not a messy collage.",
    "Keep the design professional, minimal, and not too busy.",
    "Preserve the real-world subject matter from the selected images. Do not invent a different job site or unrelated service.",
    "Use brand colors, visual cues, and overall tone from the company logo.",
    "Include tasteful spacing, subtle overlays, and a clean composition suitable for Instagram, Facebook, and website posting.",
    "If a company phone number is provided, include only that phone number clearly and accurately in the final post image.",
    "Do not include a website, email address, street address, QR code, or any other contact detail in the image.",
    "Include a clear call to action on the image, such as 'Call Today', 'Get a Free Quote', or 'Call for a Free Estimate', paired with the phone number.",
    "Place the phone number and call to action together in a clean footer bar at the bottom of the image.",
    "Make the footer bar polished, readable, and aligned with the brand, with enough contrast to read clearly over the image.",
    "Keep the footer simple and professional, not too tall, and do not let it make the design feel busy.",
    "Do not add fake phone numbers, fake addresses, fake emails, fake dates, review stars, QR codes, or unverifiable claims.",
    "Avoid dense text. If text is included, keep it short and readable.",
    "Output one finished landscape promo image.",
    "",
    "Company info:",
    JSON.stringify(
      {
        name: company.name,
        website: company.website,
        phone: company.phone,
        logoProvided: true,
      },
      null,
      2
    ),
    "",
    "Event / project info:",
    JSON.stringify(
      {
        title: event.title || "",
        notes: event.notes || "",
        dateLabel: event.dateLabel || "",
      },
      null,
      2
    ),
    "",
    imageNotes ? `Selected image notes:\n${imageNotes}` : "Selected image notes: none",
  ].join("\n")
}

function buildCaptionPrompt({ event, company, selectedImages }) {
  const imageNotes = selectedImages.map((img, index) => ({
    imageNumber: index + 1,
    fileName: img.fileName || "",
    userNote: img.message || "",
  }))

  return [
    "You are writing a social media post for a company that wants to show completed work from selected project images.",
    "Analyze the event/project details and image notes. The generated image will already be a branded promo image using the selected images and company logo.",
    "Write copy that describes what appears to have happened in the selected images without overstating details you cannot verify.",
    "Keep the tone professional, confident, and concise.",
    "If the company phone number is provided, include a brief call to action near the end of the main caption using only the phone number.",
    "Do not include the website or email in the main caption or shortCaption.",
    "Make sure the shortCaption also includes the phone number or a short call-to-action to call.",
    "Do not mention AI or image generation.",
    "Return valid JSON only with this exact shape:",
    `{`,
    `  "headline": "string",`,
    `  "caption": "string",`,
    `  "shortCaption": "string",`,
    `  "hashtags": ["#tag1", "#tag2"],`,
    `  "altText": "string"`,
    `}`,
    "",
    "Company:",
    JSON.stringify(company, null, 2),
    "",
    "Project/event:",
    JSON.stringify(
      {
        title: event.title || "",
        notes: event.notes || "",
        dateLabel: event.dateLabel || "",
        imageCount: selectedImages.length,
      },
      null,
      2
    ),
    "",
    "Image notes:",
    JSON.stringify(imageNotes, null, 2),
  ].join("\n")
}

function getGeneratedImageBase64(response) {
  const direct = response?.data?.[0]?.b64_json
  if (direct) return direct

  const output = response?.output || []
  const imageCall = output.find((item) => item?.type === "image_generation_call")
  if (imageCall?.result) return imageCall.result
  return ""
}

export default async function handler(req, res) {
  if (req.method !== "POST") return badRequest(res, "Method not allowed.", 405)
  if (!process.env.OPENAI_API_KEY) {
    return badRequest(res, "OPENAI_API_KEY is not set on the server.", 500)
  }

  const event = req.body?.event
  if (!event || typeof event !== "object") return badRequest(res, "Missing event payload.")

  const companyPayload = req.body?.company || {}
  const company = {
    name: String(companyPayload.name || process.env.SOCIAL_POST_COMPANY_NAME || "the company").trim(),
    website: String(companyPayload.website || "").trim(),
    logoUrl: String(companyPayload.logoUrl || process.env.SOCIAL_POST_DEFAULT_LOGO_PATH || "/postLogo.png").trim(),
    phone: String(companyPayload.phone || process.env.SOCIAL_POST_COMPANY_PHONE || "").trim(),
  }

  const selectedImages = normalizeImages(event.images)
  const normalizedEvent = {
    id: String(event.id || ""),
    title: String(event.title || "").trim(),
    notes: String(event.notes || "").trim(),
    allDay: !!event.allDay,
    start: event.start || null,
    end: event.end || null,
    dateLabel: String(event.dateLabel || "").trim(),
  }

  if (!company.name) return badRequest(res, "Company name is required.")
  if (!selectedImages.length) {
    return badRequest(res, "Select at least one saved image before generating a post.")
  }
  if (!normalizedEvent.title && !normalizedEvent.notes && !selectedImages.some((img) => img.message)) {
    return badRequest(res, "Add an event title, event notes, or image notes so the post has context.")
  }

  try {
    const fetchedSelectedImages = (
      await Promise.all(
        selectedImages.map(async (img, index) => {
          const fetched = await fetchImageBuffer(img.url)
          if (!fetched) return null
          const normalized = await normalizeImageForOpenAI({
            buffer: fetched.buffer,
            label: `Selected image ${index + 1}`,
          })
          return {
            ...img,
            buffer: normalized.buffer,
            fetchedContentType: normalized.contentType,
            openAIFileName: `selected-work-${index + 1}.jpg`,
          }
        })
      )
    ).filter(Boolean)

    if (!fetchedSelectedImages.length) {
      return badRequest(res, "Could not load the selected saved images.", 502)
    }

    let logoImage = null
    const absoluteLogoUrl = toAbsoluteUrl(company.logoUrl, req)
    if (absoluteLogoUrl) logoImage = await fetchImageBuffer(absoluteLogoUrl)
    if (!logoImage) logoImage = await loadFallbackLogoBuffer()
    if (!logoImage) {
      return badRequest(res, "Could not load the company logo. Pass company.logoUrl or add public/postLogo.png.", 400)
    }

    const normalizedLogo = await normalizeImageForOpenAI({
      buffer: logoImage.buffer,
      label: "Company logo",
      maxEdge: 1200,
    })

    const editImages = await Promise.all([
      ...fetchedSelectedImages.map((img, index) =>
        imageBufferToOpenAIFile({
          buffer: img.buffer,
          fileName: img.openAIFileName || `selected-work-${index + 1}.png`,
        })
      ),
      imageBufferToOpenAIFile({
        buffer: normalizedLogo.buffer,
        fileName: "company-logo.jpg",
      }),
    ])

    const imageResponse = await openai.images.edit({
      model: "gpt-image-2",
      image: editImages,
      prompt: buildImagePrompt({
        event: normalizedEvent,
        company,
        selectedImages: fetchedSelectedImages,
      }),
      size: "1536x1024",
      output_format: "png",
    })

    const generatedImageBase64 = getGeneratedImageBase64(imageResponse)
    if (!generatedImageBase64) return badRequest(res, "The image model did not return an image.", 502)

    const imagePartsForCopy = fetchedSelectedImages.map((img) => ({
      type: "input_image",
      image_url: `data:${img.fetchedContentType};base64,${img.buffer.toString("base64")}`,
      detail: "high",
    }))

    const copyResponse = await openai.responses.create({
      model: SOCIAL_POST_COPY_MODEL,
      store: false,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildCaptionPrompt({
                event: normalizedEvent,
                company,
                selectedImages: fetchedSelectedImages,
              }),
            },
            ...imagePartsForCopy,
          ],
        },
      ],
    })

    const analysis = extractJsonObject(copyResponse.output_text || "") || {}
    const caption = String(analysis.caption || "").trim()
    const shortCaption = String(analysis.shortCaption || "").trim()
    const headline = String(analysis.headline || normalizedEvent.title || "Recent Project Highlight").trim()
    const hashtags = normalizeHashtags(analysis.hashtags)
    const altText = String(analysis.altText || "").trim()

    if (!caption) return badRequest(res, "The model did not return the required caption.", 502)

    return res.status(200).json({
      headline,
      caption,
      shortCaption,
      hashtags,
      altText:
        altText ||
        `A branded social media promo image for ${company.name}, based on ${fetchedSelectedImages.length} selected project image${
          fetchedSelectedImages.length === 1 ? "" : "s"
        } and the company logo.`,
      imageDataUrl: `data:image/png;base64,${generatedImageBase64}`,
      imageMimeType: "image/png",
      imageSource: "gpt-image-2-branded-promo",
      selectedImageIds: fetchedSelectedImages.map((img) => img.id),
      company: {
        name: company.name,
        website: company.website,
        logoUrl: company.logoUrl,
        phone: company.phone,
      },
      model: {
        image: "gpt-image-2",
        copy: SOCIAL_POST_COPY_MODEL,
      },
    })
  } catch (error) {
    const message =
      error?.response?.data?.error?.message ||
      error?.error?.message ||
      error?.message ||
      "Failed to generate the social post."

    return res.status(500).json({ error: message })
  }
}
