// pages/api/generate-social-post.js
import fs from "fs"
import formidable from "formidable"
import { OpenAI, toFile } from "openai"
import { v4 as uuidv4 } from "uuid"
import {
  getAdminAuth,
  getFirestore,
  getStorageBucket,
  adminFieldValue,
} from "../../lib/firebaseAdmin"

export const config = {
  api: {
    bodyParser: false,
  },
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: true,
      keepExtensions: true,
      maxFileSize: 20 * 1024 * 1024,
      maxTotalFileSize: 100 * 1024 * 1024,
    })

    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

function asArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function getField(fields, key) {
  const value = fields[key]
  if (Array.isArray(value)) return value[0] || ""
  return value || ""
}

async function verifyFirebaseUser(req) {
  const authHeader = req.headers.authorization || ""

  if (!authHeader.startsWith("Bearer ")) {
    const err = new Error("Missing Firebase auth token.")
    err.statusCode = 401
    throw err
  }

  const token = authHeader.replace("Bearer ", "").trim()
  return getAdminAuth().verifyIdToken(token)
}

function safeFileName(name = "image") {
  return String(name)
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120)
}

async function formidableFileToOpenAIFile(file) {
  return toFile(
    fs.createReadStream(file.filepath),
    safeFileName(file.originalFilename || "reference.png"),
    {
      type: file.mimetype || "image/png",
    }
  )
}

async function generateTitleAndDescription({ prompt, referenceImageCount, hasLogo }) {
  const response = await openai.responses.create({
    model: process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You create polished social media post copy. Return only valid JSON. Do not use markdown.",
      },
      {
        role: "user",
        content: `
Create a social media title and description.

The user wants this post:
${prompt}

Reference images provided: ${referenceImageCount}
Logo provided: ${hasLogo ? "yes" : "no"}

Return exactly this JSON shape:
{
  "title": "short title, maximum 12 words",
  "description": "caption, 1 to 3 sentences"
}
        `.trim(),
      },
    ],
  })

  const raw = response.output_text || "{}"

  try {
    const parsed = JSON.parse(raw)

    return {
      title: String(parsed.title || "Generated Social Post").trim(),
      description: String(parsed.description || "").trim(),
    }
  } catch {
    return {
      title: "Generated Social Post",
      description: raw.trim().slice(0, 600),
    }
  }
}

async function saveImageToStorage({ uid, postId, imageBuffer }) {
  const bucket = getStorageBucket()

  const imagePath = `users/${uid}/socialPosts/${postId}/generated-post.png`
  const downloadToken = uuidv4()

  await bucket.file(imagePath).save(imageBuffer, {
    resumable: false,
    metadata: {
      contentType: "image/png",
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  })

  const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
    imagePath
  )}?alt=media&token=${downloadToken}`

  return {
    imagePath,
    imageUrl,
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed.",
    })
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY.",
      })
    }

    const decodedUser = await verifyFirebaseUser(req)
    const uid = decodedUser.uid

    const { fields, files } = await parseForm(req)

    const prompt = getField(fields, "prompt").trim()

    if (!prompt) {
      return res.status(400).json({
        error: "Enter what you want the social media post to be.",
      })
    }

    const referenceImages = asArray(files.referenceImages).filter((file) =>
      file?.mimetype?.startsWith("image/")
    )

    const logoFiles = asArray(files.logo).filter((file) =>
      file?.mimetype?.startsWith("image/")
    )

    const logo = logoFiles[0] || null

    if (referenceImages.length > 8) {
      return res.status(400).json({
        error: "Maximum of 8 reference images allowed.",
      })
    }

    const { title, description } = await generateTitleAndDescription({
      prompt,
      referenceImageCount: referenceImages.length,
      hasLogo: Boolean(logo),
    })

    const imagePrompt = `
Create a finished social media post image.

User request:
${prompt}

Generated title:
${title}

Generated description:
${description}

Composition requirements:
- Create a single finished promotional graphic.
- Use the uploaded reference images as visual source material and inspiration.
- If a logo is provided, include it tastefully as brand identity.
- Make the layout clean, readable, and high contrast.
- Leave enough breathing room around text and important subjects.
- Make the post feel ready to publish on Instagram, Discord, Facebook, and LinkedIn.
- Do not make the design cluttered.
- Do not add fake contact info, fake prices, fake dates, or fake social handles unless the user explicitly requested them.
    `.trim()

    const sourceFiles = [...referenceImages, ...(logo ? [logo] : [])]
    const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2"

    let imageResult

    if (sourceFiles.length > 0) {
      const openAIImages = await Promise.all(
        sourceFiles.map(formidableFileToOpenAIFile)
      )

      imageResult = await openai.images.edit({
        model: imageModel,
        image: openAIImages,
        prompt: imagePrompt,
        size: "1536x1024",
        quality: "medium",
        output_format: "png",
      })
    } else {
      imageResult = await openai.images.generate({
        model: imageModel,
        prompt: imagePrompt,
        size: "1536x1024",
        quality: "medium",
        output_format: "png",
      })
    }

    const b64 = imageResult?.data?.[0]?.b64_json

    if (!b64) {
      throw new Error("OpenAI did not return image data.")
    }

    const imageBuffer = Buffer.from(b64, "base64")

    const db = getFirestore()
    const postRef = db.collection("users").doc(uid).collection("socialPosts").doc()
    const postId = postRef.id

    const { imagePath, imageUrl } = await saveImageToStorage({
      uid,
      postId,
      imageBuffer,
    })

    const postObject = {
      prompt,
      title,
      description,
      imageUrl,
      imagePath,
      imageModel,
      textModel: process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini",
      ...(referenceImages.length
        ? {
            referenceImageCount: referenceImages.length,
            referenceImageNames: referenceImages.map((file) =>
              safeFileName(file.originalFilename || "reference-image")
            ),
          }
        : {}),
      ...(logo
        ? {
            hasLogo: true,
            logoName: safeFileName(logo.originalFilename || "logo"),
          }
        : {}),
      createdAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
    }

    await postRef.set(postObject)

    return res.status(200).json({
      post: {
        id: postId,
        ...postObject,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    })
  } catch (err) {
    console.error("generate-social-post error:", err)

    return res.status(err.statusCode || 500).json({
      error: err.message || "Failed to generate social media post.",
    })
  }
}
