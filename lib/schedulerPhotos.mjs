export const PHOTO_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }
export const PHOTO_ACCEPT = Object.keys(PHOTO_TYPES).join(",")
export const MAX_PHOTOS = 8
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const MAX_CAPTION_LENGTH = 500
export const MAX_DEMO_PHOTO_LENGTH = 350000
export const MAX_DEMO_STORAGE_LENGTH = 3000000

export function validatePhotoSelection(files, existingCount = 0) {
  if (files.length + existingCount > MAX_PHOTOS) throw new Error(`Add up to ${MAX_PHOTOS} photos per event.`)
  for (const file of files) {
    if (!Object.hasOwn(PHOTO_TYPES, file.type)) throw new Error("Choose JPEG, PNG, or WebP photos.")
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_PHOTO_BYTES) throw new Error("Each photo must be between 1 byte and 5 MB.")
  }
}

export async function validatePhotoFiles(files, existingCount = 0) {
  validatePhotoSelection(files, existingCount)
  for (const file of files) {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
    const matches = file.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : file.type === "image/png" ? [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
      : [82, 73, 70, 70].every((byte, index) => bytes[index] === byte) && [87, 69, 66, 80].every((byte, index) => bytes[index + 8] === byte)
    if (!matches) throw new Error(`"${file.name || "Photo"}" is not a valid ${PHOTO_TYPES[file.type]} photo.`)
  }
}

export function demoPhotosAreValid(images) {
  if (images === undefined) return true
  return Array.isArray(images) && images.length <= MAX_PHOTOS && new Set(images.map(image => image?.id)).size === images.length && images.every(image =>
    image && typeof image.id === "string" && image.id.length > 0 && image.id.length <= 100 &&
    typeof image.message === "string" && image.message.length <= MAX_CAPTION_LENGTH &&
    typeof image.fileName === "string" && image.fileName.length <= 255 &&
    typeof image.url === "string" && image.url.length <= MAX_DEMO_PHOTO_LENGTH && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(image.url)
  )
}

export function serializeDemoEvents(events) {
  if (!events.every(event => demoPhotosAreValid(event.images))) throw new Error("One or more event photos are invalid.")
  const serialized = JSON.stringify(events)
  if (serialized.length > MAX_DEMO_STORAGE_LENGTH) throw new Error("Browser photo storage is full. Remove some photos before saving.")
  return serialized
}

export async function makeDemoPhoto(file) {
  const preview = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = preview
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 32000000) throw new Error("Choose a photo smaller than 32 megapixels.")
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Photo processing is unavailable in this browser.")
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    let url = canvas.toDataURL("image/jpeg", 0.82)
    if (url.length > MAX_DEMO_PHOTO_LENGTH) url = canvas.toDataURL("image/jpeg", 0.55)
    if (url.length > MAX_DEMO_PHOTO_LENGTH) throw new Error("This photo is too detailed for browser storage. Choose a smaller photo.")
    return { id: crypto.randomUUID(), url, message: "", fileName: file.name.slice(0, 255) }
  } finally {
    URL.revokeObjectURL(preview)
  }
}

export function isEventPhotoPath(path, eventId) {
  if (typeof path !== "string" || !eventId || eventId.includes("/")) return false
  const prefix = `scheduleEvents/${eventId}/`
  return path.startsWith(prefix) && /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(path.slice(prefix.length))
}

export function validateEventPhotos(existingImages = [], newImages = []) {
  validatePhotoSelection(newImages.map(image => image.file), existingImages.length)
  if ([...existingImages, ...newImages].some(image => typeof image.message !== "string" || image.message.length > MAX_CAPTION_LENGTH)) throw new Error(`Captions must be ${MAX_CAPTION_LENGTH} characters or fewer.`)
}

// Commit metadata before removing old files; roll back only uploads from this save.
export async function persistEventPhotos({ existingImages = [], newImages = [], removedImages = [], upload, commit, remove }) {
  validateEventPhotos(existingImages, newImages)
  const uploaded = []
  try {
    for (const image of newImages) uploaded.push(await upload(image))
    const images = [...existingImages, ...uploaded]
    await commit(images)
  } catch (error) {
    await Promise.allSettled(uploaded.map(image => remove(image)))
    throw error
  }
  await Promise.allSettled(removedImages.map(image => remove(image)))
}
