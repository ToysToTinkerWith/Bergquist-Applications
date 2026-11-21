// Server-only: image bytes are decoded and normalized before storage or AI use.
import sharp from "sharp"

export const MAX_NOTE_PHOTOS = 6
export const MAX_NOTE_PHOTO_BYTES = 900 * 1024
export const MAX_NOTE_PHOTO_SOURCE_BYTES = 10 * 1024 * 1024
export const MAX_NOTE_PHOTO_EDGE = 1600
const MAX_PIXELS = 40000000
const formats = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }
export const validPhotoId = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(value)
export const validPhotoNoteId = value => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value)

export class BusinessNotePhotoError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.name = "BusinessNotePhotoError"
    this.statusCode = statusCode
    this.status = statusCode
    this.code = "invalid_photo"
  }
}
const fail = message => { throw new BusinessNotePhotoError(message) }

function text(value, maximum, label) {
  if (value == null) return ""
  if (typeof value !== "string" || value.length > maximum || /\u0000/.test(value)) fail(`${label} is invalid or too long.`)
  return value.trim()
}

export function photoMetadata(photo) {
  return {
    id: photo.id, name: photo.name, contentType: "image/jpeg", width: photo.width, height: photo.height,
    size: photo.size, caption: photo.caption || "", description: photo.description || "",
  }
}

export function businessNotePhotoPath(uid, noteId, photoId) {
  if (typeof uid !== "string" || !uid || uid.length > 128 || !validPhotoNoteId(noteId) || !validPhotoId(photoId)) fail("Choose a valid note and photo.")
  return `businessNotes/${encodeURIComponent(uid)}/${noteId}/${photoId}.jpg`
}

export async function normalizePhotoInputs(raw = []) {
  if (!Array.isArray(raw) || raw.length > MAX_NOTE_PHOTOS) fail(`Add up to ${MAX_NOTE_PHOTOS} photos to a note.`)
  const ids = new Set()
  for (const photo of raw) {
    if (!photo || typeof photo !== "object" || !validPhotoId(photo.id) || ids.has(photo.id)) fail("Every photo needs a unique valid ID.")
    ids.add(photo.id)
  }
  const output = []
  for (const photo of raw) {
    const name = text(photo.name, 180, "Photo name") || "Business photo.jpg"
    const caption = text(photo.caption, 500, "Photo caption")
    const description = text(photo.description, 1500, "Photo description")
    if (typeof photo.dataUrl !== "string" || photo.dataUrl.length > Math.ceil(MAX_NOTE_PHOTO_SOURCE_BYTES * 4 / 3) + 100) fail("The photo is too large. Choose a photo under 10 MB.")
    const match = photo.dataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/)
    if (!match || match[2].length % 4 !== 0) fail("Choose a JPEG, PNG, or WebP photo.")
    const input = Buffer.from(match[2], "base64")
    if (!input.length || input.length > MAX_NOTE_PHOTO_SOURCE_BYTES || input.toString("base64") !== match[2]) fail("The photo data is invalid or too large.")
    const jpeg = input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).equals(input.subarray(0, 8))
    const webp = input.toString("ascii", 0, 4) === "RIFF" && input.toString("ascii", 8, 12) === "WEBP"
    if (!(match[1] === "jpeg" && jpeg || match[1] === "png" && png || match[1] === "webp" && webp)) fail("The photo bytes do not match a JPEG, PNG, or WebP image.")
    let metadata
    try { metadata = await sharp(input, { failOn: "error", limitInputPixels: MAX_PIXELS }).metadata() }
    catch { fail("This photo could not be read. Choose a valid JPEG, PNG, or WebP image.") }
    if (!formats[metadata.format] || formats[metadata.format] !== `image/${match[1]}` || (metadata.pages || 1) > 1) fail("Choose a still JPEG, PNG, or WebP photo.")
    if (!metadata.width || !metadata.height || metadata.width > 12000 || metadata.height > 12000 || metadata.width * metadata.height > MAX_PIXELS) fail("The photo dimensions are too large.")
    let buffer = null, normalized
    try {
      for (const edge of [MAX_NOTE_PHOTO_EDGE, 1400, 1200, 1000]) {
        for (const quality of [86, 76, 66, 56]) {
          const candidate = await sharp(input, { failOn: "error", limitInputPixels: MAX_PIXELS })
            .rotate().resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true })
            .flatten({ background: "#ffffff" }).jpeg({ quality, mozjpeg: true }).toBuffer({ resolveWithObject: true })
          if (candidate.data.length <= MAX_NOTE_PHOTO_BYTES) { buffer = candidate.data; normalized = candidate.info; break }
        }
        if (buffer) break
      }
    } catch { fail("This photo could not be prepared. Choose another JPEG, PNG, or WebP image.") }
    if (!buffer) fail("This photo is too detailed to save. Try a smaller image.")
    output.push({
      id: photo.id, name, contentType: "image/jpeg", width: normalized.width, height: normalized.height,
      size: buffer.length, caption, description, buffer, dataUrl: `data:image/jpeg;base64,${buffer.toString("base64")}`,
    })
  }
  return output
}
