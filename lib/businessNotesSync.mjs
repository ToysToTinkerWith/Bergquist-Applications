import { MAX_NOTES, emptyWorkspace, validNote, validWorkspace, upsertNote, removeNote } from "./businessNotes.mjs"

const isRecord = value => Boolean(value && typeof value === "object" && !Array.isArray(value))
const validId = (value, max) => typeof value === "string" && value.length <= max && /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(value)
export const emptyOutbox = () => ({ version: 1, operations: [] })
export const operationNoteId = operation => operation.action === "save" ? operation.note.id : operation.noteId

export function validOperation(operation) {
  if (!isRecord(operation) || !validId(operation.mutationId, 160)) return false
  if (operation.action === "save") return Object.keys(operation).every(key => ["action", "mutationId", "note"].includes(key)) && validNote(operation.note)
  return operation.action === "delete" && Object.keys(operation).every(key => ["action", "mutationId", "noteId"].includes(key)) && validId(operation.noteId, 80)
}

export function validOutbox(value) {
  return isRecord(value) && Object.keys(value).every(key => ["version", "operations"].includes(key)) && value.version === 1
    && Array.isArray(value.operations) && value.operations.length <= MAX_NOTES * 10 && value.operations.every(validOperation)
    && new Set(value.operations.map(operationNoteId)).size === value.operations.length
}

export function queueOperation(outbox, operation) {
  if (!validOutbox(outbox) || !validOperation(operation)) throw new TypeError("A pending note change is invalid.")
  const next = { version: 1, operations: [...outbox.operations.filter(item => operationNoteId(item) !== operationNoteId(operation)), operation] }
  if (!validOutbox(next)) throw new TypeError("Too many note changes are waiting to sync. Retry account sync before adding more.")
  return next
}

export function acknowledgeOperation(outbox, operation) {
  if (!validOutbox(outbox) || !validOperation(operation)) throw new TypeError("A pending note change is invalid.")
  return { version: 1, operations: outbox.operations.filter(item => item.mutationId !== operation.mutationId || operationNoteId(item) !== operationNoteId(operation)) }
}

// Only explicitly queued changes override cloud records. A stale browser cache
// cannot bring back a record that was deleted on another device.
export function mergeCloudWorkspace(remote, outbox) {
  if (!validWorkspace(remote) || !validOutbox(outbox)) throw new TypeError("The account workspace could not be read safely.")
  let merged = { version: 1, notes: [...remote.notes] }
  for (const operation of outbox.operations.filter(item => item.action === "delete")) merged = removeNote(merged, operation.noteId)
  for (const operation of outbox.operations.filter(item => item.action === "save")) {
    const remoteNote = merged.notes.find(note => note.id === operation.note.id)
    // A first save may have succeeded even when its response was lost. The
    // server's creation timestamp can then be later than the pending browser
    // timestamp; retain that canonical origin without invalidating the edit.
    const pending = remoteNote ? { ...operation.note, createdAt: remoteNote.createdAt, updatedAt: operation.note.updatedAt < remoteNote.createdAt ? remoteNote.createdAt : operation.note.updatedAt } : operation.note
    merged = upsertNote(merged, pending)
  }
  return merged
}

export function applyCanonicalResponse(workspace, outbox, operation, canonicalNote) {
  if (!validWorkspace(workspace) || !validOutbox(outbox) || !validOperation(operation)) throw new TypeError("The note response could not be applied safely.")
  const current = outbox.operations.find(item => operationNoteId(item) === operationNoteId(operation))
  if (!current || current.mutationId !== operation.mutationId) return { workspace, outbox, applied: false }
  let next = workspace
  if (operation.action === "save") {
    if (!validNote(canonicalNote) || canonicalNote.id !== operation.note.id) throw new TypeError("The account returned an invalid note.")
    // Unlike a user edit, this is the authoritative server record, including
    // its creation/update timestamps. Do not retain a client clock's timestamp.
    next = { version: 1, notes: [canonicalNote, ...workspace.notes.filter(note => note.id !== canonicalNote.id)] }
    if (!validWorkspace(next)) throw new TypeError("The account note could not be applied safely.")
  } else next = removeNote(workspace, operation.noteId)
  return { workspace: next, outbox: acknowledgeOperation(outbox, operation), applied: true }
}

export function cachedWorkspace(raw) {
  if (raw === null) return emptyWorkspace()
  const value = JSON.parse(raw)
  if (!validWorkspace(value)) throw new TypeError("The saved browser workspace is invalid.")
  return value
}

export function cachedOutbox(raw) {
  if (raw === null) return emptyOutbox()
  const value = JSON.parse(raw)
  if (!validOutbox(value)) throw new TypeError("The pending browser changes are invalid.")
  return value
}
