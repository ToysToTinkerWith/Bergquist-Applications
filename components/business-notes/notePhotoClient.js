export const MAX_NOTE_PHOTOS = 6
export const MAX_NOTE_PHOTO_BYTES = 900 * 1024
export const MAX_SOURCE_PHOTO_BYTES = 10 * 1024 * 1024
const validId = value => typeof value === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(value)
const validNoteId = value => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value)
const allowed = new Set(["image/jpeg", "image/png", "image/webp"])

const abortError = () => new DOMException("Photo loading cancelled", "AbortError")
function checkAbort(signal) { if (signal?.aborted) throw abortError() }

function readDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("The photo could not be read."))
    reader.readAsDataURL(blob)
  })
}

async function decodePhoto(file) {
  if (typeof createImageBitmap === "function") {
    try { return await createImageBitmap(file, { imageOrientation: "from-image" }) } catch {}
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error("This image could not be opened. Choose another JPEG, PNG, or WebP photo."))
    })
    return image
  } finally { URL.revokeObjectURL(url) }
}

function canvasBlob(canvas, quality) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("This photo could not be prepared.")), "image/jpeg", quality))
}

export async function prepareNotePhoto(file) {
  if (!file || !allowed.has(file.type)) throw new Error("Choose a JPEG, PNG, or WebP photo.")
  if (!file.size || file.size > MAX_SOURCE_PHOTO_BYTES) throw new Error("Choose a photo under 10 MB.")
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => header[index] === byte)
  const webp = String.fromCharCode(...header.slice(0, 4)) === "RIFF" && String.fromCharCode(...header.slice(8, 12)) === "WEBP"
  if (!(file.type === "image/jpeg" && jpeg || file.type === "image/png" && png || file.type === "image/webp" && webp)) throw new Error("The file is not a valid JPEG, PNG, or WebP photo.")
  const image = await decodePhoto(file)
  try {
    const width = image.width || image.naturalWidth, height = image.height || image.naturalHeight
    if (!width || !height || width > 20000 || height > 20000 || width * height > 80000000) throw new Error("This photo has very large dimensions. Choose a smaller image.")
    const canvas = document.createElement("canvas"), context = canvas.getContext("2d")
    if (!context) throw new Error("This browser could not prepare the photo.")
    for (const edge of [1600, 1400, 1200, 1000]) {
      const ratio = Math.min(1, edge / Math.max(width, height))
      canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio))
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      for (const quality of [.86, .76, .66, .56]) {
        const blob = await canvasBlob(canvas, quality)
        if (blob.size <= MAX_NOTE_PHOTO_BYTES) {
          const id = `photo-${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2)}`
          return { id, name: String(file.name || "Business photo.jpg").slice(0, 180), contentType: "image/jpeg", width: canvas.width, height: canvas.height, size: blob.size, caption: "", description: "", dataUrl: await readDataUrl(blob) }
        }
      }
    }
    throw new Error("This photo is too detailed to save. Choose a smaller image.")
  } finally { image.close?.() }
}

function wait(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    checkAbort(signal)
    const finish = () => { signal?.removeEventListener("abort", stop); resolve() }
    const timer = setTimeout(finish, milliseconds)
    const stop = () => { clearTimeout(timer); signal?.removeEventListener("abort", stop); reject(abortError()) }
    signal?.addEventListener("abort", stop, { once: true })
  })
}

export async function fetchNotePhotoBlob(photo, { noteId, user, signal, retries = 2, token: suppliedToken } = {}) {
  checkAbort(signal)
  if (!validNoteId(noteId) || !validId(photo?.id)) throw new Error("This photo does not belong to a valid saved note.")
  if (!user?.getIdToken && !suppliedToken) throw new Error("Sign in to load saved photos.")
  const token = suppliedToken || await user.getIdToken()
  checkAbort(signal)
  const controller = new AbortController(), stop = () => controller.abort()
  signal?.addEventListener("abort", stop, { once: true })
  const timer = setTimeout(stop, 25000)
  try {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const response = await fetch(`/api/business-note-photos?noteId=${encodeURIComponent(noteId)}&photoId=${encodeURIComponent(photo.id)}`, {
        headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, cache: "no-store",
      })
      if (response.status === 404 && attempt < retries) { await wait(650 * (attempt + 1), controller.signal); continue }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        const error = new Error(response.status === 404 ? "This photo may still be saving. Try loading photos again." : payload.error || "The private photo could not be loaded.")
        error.status = response.status
        throw error
      }
      if (!String(response.headers.get("content-type") || "").startsWith("image/jpeg")) throw new Error("The photo response is not a JPEG image.")
      const blob = await response.blob()
      checkAbort(controller.signal)
      if (!blob.size || blob.size > MAX_NOTE_PHOTO_BYTES) throw new Error("The saved photo has an invalid size.")
      return blob
    }
    throw new Error("The private photo could not be loaded.")
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) throw new Error("Loading this photo took too long. Try again.")
    throw error
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", stop) }
}

export async function materializeNotePhotos(photos = [], { noteId, user, signal } = {}) {
  if (!Array.isArray(photos) || photos.length > MAX_NOTE_PHOTOS) throw new Error(`Add up to ${MAX_NOTE_PHOTOS} photos to a note.`)
  checkAbort(signal)
  let token = null
  if (photos.some(photo => !photo.dataUrl)) {
    if (!user?.getIdToken) throw new Error("Sign in to load saved photos.")
    token = await user.getIdToken()
  }
  return Promise.all(photos.map(async photo => {
    checkAbort(signal)
    if (!validId(photo?.id)) throw new Error("A photo has an invalid ID.")
    if (photo.dataUrl && (typeof photo.dataUrl !== "string" || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.dataUrl) || photo.dataUrl.length > Math.ceil(MAX_NOTE_PHOTO_BYTES * 4 / 3) + 100)) throw new Error("A draft photo has invalid image data.")
    const dataUrl = photo.dataUrl || await readDataUrl(await fetchNotePhotoBlob(photo, { noteId, user, signal, token }))
    checkAbort(signal)
    return { id: photo.id, name: photo.name || "Business photo.jpg", contentType: "image/jpeg", width: photo.width, height: photo.height, size: photo.size, caption: photo.caption || "", description: photo.description || "", dataUrl }
  }))
}
