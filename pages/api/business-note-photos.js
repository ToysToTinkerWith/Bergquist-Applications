import { getFirestore, getStorageBucket } from "../../lib/firebaseAdmin"
import { requireBusinessNotesAccess, sendBusinessNotesAccessError } from "../../lib/businessNotesAccess"
import { validNote } from "../../lib/businessNotes.mjs"
import { BusinessNotePhotoError, MAX_NOTE_PHOTO_BYTES, businessNotePhotoPath, normalizePhotoInputs, photoMetadata, validPhotoId, validPhotoNoteId } from "../../lib/businessNotePhotoServer"

export const config = { api: { bodyParser: { sizeLimit: "9mb" } } }

export default async function businessNotePhotos(req, res) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0")
  res.setHeader("Vary", "Authorization")
  res.setHeader("X-Content-Type-Options", "nosniff")
  if (!["GET", "POST"].includes(req.method)) { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "Method not allowed." }) }
  let user
  try { user = await requireBusinessNotesAccess(req) }
  catch (error) {
    if (!sendBusinessNotesAccessError(res, error)) res.status(503).json({ error: "Account verification is temporarily unavailable." })
    return
  }
  const noteId = req.method === "GET" ? req.query?.noteId : req.body?.noteId
  if (!validPhotoNoteId(noteId)) return res.status(400).json({ error: "Choose a valid note." })

  try {
    if (req.method === "POST") {
      const photos = await normalizePhotoInputs(req.body?.photos)
      const bucket = getStorageBucket()
      // Uploading before the note commit is intentional. Reads still require the
      // photo ID to belong to an approved owner's saved note document.
      for (const photo of photos) {
        await bucket.file(businessNotePhotoPath(user.uid, noteId, photo.id)).save(photo.buffer, {
          resumable: false,
          metadata: {
            contentType: "image/jpeg", cacheControl: "private, no-store, max-age=0",
            metadata: { ownerUid: user.uid, noteId, photoId: photo.id },
          },
        })
      }
      return res.status(200).json({ photos: photos.map(photoMetadata) })
    }

    const photoId = req.query?.photoId
    if (!validPhotoId(photoId)) return res.status(400).json({ error: "Choose a valid photo." })
    const noteSnapshot = await getFirestore().collection("users").doc(user.uid).collection("businessNotes").doc(noteId).get()
    const note = noteSnapshot.exists ? noteSnapshot.data() : null
    if (!note || note.id !== noteId || !validNote(note) || !note.photos?.some(photo => photo.id === photoId)) return res.status(404).json({ error: "This photo is not available in your saved note." })
    const file = getStorageBucket().file(businessNotePhotoPath(user.uid, noteId, photoId))
    const [metadata] = await file.getMetadata()
    if (metadata.contentType !== "image/jpeg" || !Number.isFinite(Number(metadata.size)) || Number(metadata.size) < 1 || Number(metadata.size) > MAX_NOTE_PHOTO_BYTES) return res.status(404).json({ error: "This photo is not available." })
    const [buffer] = await file.download()
    if (!buffer.length || buffer.length > MAX_NOTE_PHOTO_BYTES || buffer[0] !== 0xff || buffer[1] !== 0xd8) return res.status(404).json({ error: "This photo is not available." })
    res.setHeader("Content-Type", "image/jpeg")
    res.setHeader("Content-Length", String(buffer.length))
    res.setHeader("Content-Disposition", `inline; filename="note-photo-${photoId}.jpg"`)
    return res.status(200).send(buffer)
  } catch (error) {
    if (error instanceof BusinessNotePhotoError) return res.status(error.statusCode).json({ error: error.message, code: error.code })
    if (Number(error?.code) === 404) return res.status(404).json({ error: "This photo is still being saved or is no longer available." })
    return res.status(503).json({ error: "Private photo storage is temporarily unavailable. Your note and draft photos are unchanged." })
  }
}
