import { getFirestore, getStorageBucket } from "../../lib/firebaseAdmin"
import { requireBusinessNotesAccess, sendBusinessNotesAccessError } from "../../lib/businessNotesAccess"
import { MAX_NOTES, validNote, validWorkspace } from "../../lib/businessNotes.mjs"
import { businessNotePhotoPath } from "../../lib/businessNotePhotoServer"

export const config = { api: { bodyParser: { sizeLimit: "768kb" } } }

const validId = value => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(value)

async function removePrivatePhotos(uid, noteId, photos) {
  if (!photos.length) return true
  try {
    const bucket = getStorageBucket()
    const results = await Promise.allSettled(photos.map(photo => bucket.file(businessNotePhotoPath(uid, noteId, photo.id)).delete({ ignoreNotFound: true })))
    return results.every(result => result.status === "fulfilled")
  } catch { return false }
}

async function drainPhotoCleanup(db, uid) {
  try {
    const cleanup = db.collection("users").doc(uid).collection("businessNotePhotoCleanup")
    const pending = await cleanup.limit(5).get()
    let complete = true
    for (const doc of pending.docs) {
      const task = doc.data()
      if (!validId(task?.noteId) || !Array.isArray(task?.photoIds) || task.photoIds.length > 6) { complete = false; continue }
      // A later save can reattach an ID while an earlier cleanup is waiting.
      // Re-check the current owner note before removing any queued object.
      const currentNote = await db.collection("users").doc(uid).collection("businessNotes").doc(task.noteId).get()
      const currentPhotos = currentNote.exists && Array.isArray(currentNote.data().photos) ? currentNote.data().photos : []
      const obsoleteIds = task.photoIds.filter(id => !currentPhotos.some(photo => photo.id === id))
      if (await removePrivatePhotos(uid, task.noteId, obsoleteIds.map(id => ({ id })))) await cleanup.doc(doc.id).delete()
      else complete = false
    }
    return complete && pending.docs.length < 5
  } catch { return false }
}

export default async function businessWorkspace(req, res) {
  res.setHeader("Cache-Control", "private, no-store")
  if (!["GET", "POST"].includes(req.method)) { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "Method not allowed." }) }
  let user
  try { user = await requireBusinessNotesAccess(req) }
  catch (error) {
    if (!sendBusinessNotesAccessError(res, error)) res.status(503).json({ error: "Account verification is temporarily unavailable." })
    return
  }
  if (req.method === "POST") {
    if (!["save", "delete"].includes(req.body?.action)) return res.status(400).json({ error: "Choose save or delete." })
    if (req.body.action === "save" && !validNote(req.body.note)) return res.status(400).json({ error: "The note has invalid or oversized fields. Review it before saving." })
    if (req.body.action === "delete" && !validId(req.body.noteId)) return res.status(400).json({ error: "Choose a valid note to delete." })
  }
  try {
    // All reads and writes derive their scope from the verified token only.
    const db = getFirestore()
    const notes = db.collection("users").doc(user.uid).collection("businessNotes")
    const cleanup = db.collection("users").doc(user.uid).collection("businessNotePhotoCleanup")
    if (req.method === "GET") {
      const snapshot = await notes.orderBy("updatedAt", "desc").limit(MAX_NOTES + 1).get()
      const workspace = { version: 1, notes: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) }
      if (!validWorkspace(workspace)) return res.status(503).json({ error: "Some cloud notes could not be loaded safely. Browser notes are unchanged." })
      const cleaned = await drainPhotoCleanup(db, user.uid)
      return res.status(200).json({ workspace, ...(!cleaned ? { photoCleanupPending: true } : {}) })
    }
    if (req.body.action === "delete") {
      const noteRef = notes.doc(req.body.noteId)
      const cleanupRef = cleanup.doc()
      let photos = []
      await db.runTransaction(async transaction => {
        const previous = await transaction.get(noteRef)
        photos = previous.exists && Array.isArray(previous.data().photos) ? previous.data().photos : []
        if (photos.length) transaction.set(cleanupRef, { noteId: req.body.noteId, photoIds: photos.map(photo => photo.id), createdAt: new Date().toISOString() })
        transaction.delete(noteRef)
      })
      const cleaned = await drainPhotoCleanup(db, user.uid)
      return res.status(200).json({ deleted: req.body.noteId, ...(!cleaned ? { photoCleanupPending: true } : {}) })
    }
    const incoming = req.body.note
    const noteRef = notes.doc(incoming.id)
    const cleanupRef = cleanup.doc()
    let saved, removedPhotos = []
    await db.runTransaction(async transaction => {
      const previous = await transaction.get(noteRef)
      if (!previous.exists) {
        const current = await transaction.get(notes.limit(MAX_NOTES))
        if (current.size >= MAX_NOTES) { const error = new Error("Workspace full"); error.code = "workspace_full"; throw error }
      }
      const now = new Date().toISOString()
      saved = { ...incoming, createdAt: previous.exists ? previous.data().createdAt : now, updatedAt: now }
      if (!validNote(saved)) { const error = new Error("Invalid stored note"); error.code = "invalid_note"; throw error }
      const previousPhotos = previous.exists && Array.isArray(previous.data().photos) ? previous.data().photos : []
      removedPhotos = previousPhotos.filter(photo => !(saved.photos || []).some(next => next.id === photo.id))
      if (removedPhotos.length) transaction.set(cleanupRef, { noteId: saved.id, photoIds: removedPhotos.map(photo => photo.id), createdAt: now })
      transaction.set(noteRef, saved)
    })
    const cleaned = await drainPhotoCleanup(db, user.uid)
    return res.status(200).json({ note: saved, ...(!cleaned ? { photoCleanupPending: true } : {}) })
  } catch (error) {
    if (error?.code === "workspace_full") return res.status(400).json({ error: `Cloud storage supports up to ${MAX_NOTES} notes. Remove an older note before adding another.` })
    if (error?.code === "invalid_note") return res.status(400).json({ error: "The note could not be saved safely. Your browser copy is unchanged." })
    return res.status(503).json({ error: "Cloud storage is temporarily unavailable. Your browser copy has not been removed." })
  }
}
