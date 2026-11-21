export const NOTE_STORAGE_KEY = "bergquist-business-notes-v1"
export const MAX_NOTE_LENGTH = 12000
export const MAX_NOTES = 100
export const MAX_NOTE_ITEMS = 30
export const MAX_NOTE_PHOTOS = 6
export const MAX_NOTE_PHOTO_BYTES = 900 * 1024
export const ITEM_KINDS = Object.freeze(["event", "task", "followup", "expense", "job", "social"])

const baseItemFields = ["kind", "title", "details", "date", "time", "endDate", "endTime", "person", "location", "amountCents", "currency", "sourceQuote", "reviewReason"]
const itemFields = [...baseItemFields, "sourcePhotoIds", "stage", "platform", "postText"]
const storedItemFields = [...itemFields, "id", "noteId", "status"]
const noteFields = ["id", "text", "title", "summary", "timeZone", "createdAt", "updatedAt", "referenceDate", "items", "questions", "source", "photos"]
const photoFields = ["id", "name", "contentType", "width", "height", "size", "caption", "description"]
const isObject = value => Boolean(value && typeof value === "object" && !Array.isArray(value))
const only = (value, fields) => Object.keys(value).every(key => fields.includes(key))
const textWithin = (value, max, required = false) => typeof value === "string" && value.length <= max && (!required || Boolean(value.trim()))
const nullableText = (value, max) => value === null || textWithin(value, max, true)
const validId = value => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,159}$/.test(value)
const validNoteId = value => validId(value) && value.length <= 80
const validPhotoId = value => typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
const isoTimestamp = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value

export function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export const validTime = value => typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
export function validTimeZone(value) {
  if (typeof value !== "string" || !value || value.length > 80) return false
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return true } catch { return false }
}

function validItem(item, stored = false) {
  if (!isObject(item) || !only(item, stored ? storedItemFields : itemFields) || !baseItemFields.every(key => Object.hasOwn(item, key))) return false
  if (!ITEM_KINDS.includes(item.kind) || !textWithin(item.title, 180, true) || !textWithin(item.details, 2500)) return false
  if (![item.date, item.endDate].every(value => value === null || validDate(value)) || ![item.time, item.endTime].every(value => value === null || validTime(value))) return false
  if (!nullableText(item.person, 180) || !nullableText(item.location, 500) || !nullableText(item.reviewReason, 500) || !textWithin(item.sourceQuote, 1500)) return false
  if (!(item.amountCents === null || (Number.isSafeInteger(item.amountCents) && item.amountCents >= 0 && item.amountCents <= 10000000000)) || typeof item.currency !== "string" || !/^[A-Z]{3}$/.test(item.currency)) return false
  if (Object.hasOwn(item, "sourcePhotoIds") && (!Array.isArray(item.sourcePhotoIds) || item.sourcePhotoIds.length > MAX_NOTE_PHOTOS || !item.sourcePhotoIds.every(validPhotoId) || new Set(item.sourcePhotoIds).size !== item.sourcePhotoIds.length)) return false
  if (Object.hasOwn(item, "stage") && item.stage !== null && !["new", "planned", "in-progress", "completed"].includes(item.stage)) return false
  if (Object.hasOwn(item, "platform") && item.platform !== null && !["Facebook", "Instagram", "LinkedIn"].includes(item.platform)) return false
  if (Object.hasOwn(item, "postText") && !nullableText(item.postText, 3000)) return false
  if (item.date && item.endDate && item.endDate < item.date) return false
  if (item.date && item.time && item.endTime && `${item.endDate || item.date}T${item.endTime}` <= `${item.date}T${item.time}`) return false
  return !stored || (validId(item.id) && validNoteId(item.noteId) && ["open", "done"].includes(item.status))
}

export function validAnalysis(value) {
  return isObject(value) && only(value, ["title", "summary", "items", "questions", "photoDescriptions"])
    && textWithin(value.title, 180, true) && textWithin(value.summary, 1200)
    && Array.isArray(value.items) && value.items.length <= MAX_NOTE_ITEMS && value.items.every(item => validItem(item))
    && Array.isArray(value.questions) && value.questions.length <= 10 && value.questions.every(question => textWithin(question, 300, true))
    && (!Object.hasOwn(value, "photoDescriptions") || (Array.isArray(value.photoDescriptions) && value.photoDescriptions.length <= MAX_NOTE_PHOTOS && value.photoDescriptions.every(photo => isObject(photo) && only(photo, ["id", "description"]) && validPhotoId(photo.id) && textWithin(photo.description, 1500)) && new Set(value.photoDescriptions.map(photo => photo.id)).size === value.photoDescriptions.length))
}

function cleanText(value, max, required = false) {
  if (typeof value !== "string") throw new TypeError("A note contains an invalid text field.")
  const result = value.trim()
  if (!textWithin(result, max, required)) throw new TypeError("A note field is empty or too long.")
  return result
}
const cleanOptional = (value, max) => value == null || value === "" ? null : cleanText(value, max, true)

// Normalization is shared by AI responses, browser review, and private saves.
export function normalizeAnalysis(value) {
  if (!isObject(value) || !Array.isArray(value.items) || !Array.isArray(value.questions)) throw new TypeError("The organized note is invalid.")
  const analysis = {
    title: cleanText(value.title, 180, true), summary: cleanText(value.summary, 1200),
    items: value.items.map(item => {
      if (!isObject(item)) throw new TypeError("An organized item is invalid.")
      const result = {
        kind: item.kind, title: cleanText(item.title, 180, true), details: cleanText(item.details ?? "", 2500),
        date: item.date || null, time: item.time || null, endDate: item.endDate || null, endTime: item.endTime || null,
        person: cleanOptional(item.person, 180), location: cleanOptional(item.location, 500),
        amountCents: item.amountCents ?? null, currency: item.currency || "USD",
        sourceQuote: cleanText(item.sourceQuote ?? "", 1500), reviewReason: cleanOptional(item.reviewReason, 500),
        sourcePhotoIds: item.sourcePhotoIds ?? [], stage: item.stage ?? null,
        platform: item.platform ?? null, postText: cleanOptional(item.postText, 3000),
      }
      if (result.kind === "event" && (!result.date || !result.time)) result.reviewReason ||= "Confirm the event date and time before scheduling."
      if (result.kind === "expense" && result.amountCents === null) result.reviewReason ||= "Confirm the expense amount."
      return result
    }),
    questions: value.questions.map(question => cleanText(question, 300, true)),
    photoDescriptions: value.photoDescriptions == null ? [] : value.photoDescriptions.map(photo => ({ id: photo.id, description: cleanText(photo.description, 1500) })),
  }
  if (!validAnalysis(analysis)) throw new TypeError("The organized note contains invalid or oversized fields.")
  return analysis
}

export const emptyWorkspace = () => ({ version: 1, notes: [] })

export function validNotePhoto(photo) {
  return isObject(photo) && only(photo, photoFields) && photoFields.every(key => Object.hasOwn(photo, key))
    && validPhotoId(photo.id) && textWithin(photo.name, 180, true) && photo.contentType === "image/jpeg"
    && Number.isInteger(photo.width) && photo.width > 0 && photo.width <= 4096 && Number.isInteger(photo.height) && photo.height > 0 && photo.height <= 4096
    && Number.isInteger(photo.size) && photo.size > 0 && photo.size <= MAX_NOTE_PHOTO_BYTES
    && textWithin(photo.caption, 500) && textWithin(photo.description, 1500)
}

function normalizedPhotos(photos, descriptions) {
  if (!Array.isArray(photos) || photos.length > MAX_NOTE_PHOTOS) throw new TypeError("Attach up to six photos.")
  const results = photos.map(photo => ({
    id: photo.id, name: cleanText(photo.name, 180, true), contentType: photo.contentType,
    width: photo.width, height: photo.height, size: photo.size,
    caption: cleanText(photo.caption ?? "", 500), description: cleanText(descriptions.find(item => item.id === photo.id)?.description ?? photo.description ?? "", 1500),
  }))
  if (!results.every(validNotePhoto) || new Set(results.map(photo => photo.id)).size !== results.length || descriptions.some(item => !results.some(photo => photo.id === item.id))) throw new TypeError("The photo metadata is invalid.")
  return results
}

export function validNote(note) {
  const photos = note?.photos ?? []
  return isObject(note) && only(note, noteFields) && validNoteId(note.id)
    && Array.isArray(photos) && photos.length <= MAX_NOTE_PHOTOS && photos.every(validNotePhoto) && new Set(photos.map(photo => photo.id)).size === photos.length
    && (!Object.hasOwn(note, "photos") || Array.isArray(note.photos))
    && textWithin(note.text, MAX_NOTE_LENGTH, photos.length === 0) && textWithin(note.title, 180, true) && textWithin(note.summary, 1200)
    && validTimeZone(note.timeZone) && isoTimestamp(note.createdAt) && isoTimestamp(note.updatedAt) && note.updatedAt >= note.createdAt
    && (!Object.hasOwn(note, "referenceDate") || isoTimestamp(note.referenceDate))
    && (!Object.hasOwn(note, "source") || ["sample", "ai", "manual"].includes(note.source))
    && Array.isArray(note.items) && note.items.length <= MAX_NOTE_ITEMS && note.items.every(item => validItem(item, true) && item.noteId === note.id && new RegExp(`^${note.id}-item-[1-9]\\d*$`).test(item.id) && (item.sourcePhotoIds || []).every(id => photos.some(photo => photo.id === id)))
    && new Set(note.items.map(item => item.id)).size === note.items.length
    && Array.isArray(note.questions) && note.questions.length <= 10 && note.questions.every(question => textWithin(question, 300, true))
}

export function validWorkspace(value) {
  return isObject(value) && only(value, ["version", "notes"]) && value.version === 1 && Array.isArray(value.notes) && value.notes.length <= MAX_NOTES
    && value.notes.every(validNote) && new Set(value.notes.map(note => note.id)).size === value.notes.length
    && new Set(value.notes.flatMap(note => note.items.map(item => item.id))).size === value.notes.reduce((sum, note) => sum + note.items.length, 0)
}

export function makeNote({ id, text = "", photos = [], timeZone, analysis, createdAt = new Date().toISOString(), referenceDate = createdAt, source = "ai" }) {
  const normalized = normalizeAnalysis(analysis)
  const notePhotos = normalizedPhotos(photos, normalized.photoDescriptions)
  const stamp = createdAt instanceof Date ? createdAt.toISOString() : createdAt
  const note = {
    id, text: cleanText(text, MAX_NOTE_LENGTH, notePhotos.length === 0), title: normalized.title, summary: normalized.summary, timeZone, photos: notePhotos,
    createdAt: stamp, updatedAt: stamp, referenceDate: referenceDate instanceof Date ? referenceDate.toISOString() : referenceDate, source,
    items: normalized.items.map((item, index) => ({ ...item, stage: item.kind === "job" ? item.stage ?? "new" : item.stage, id: `${id}-item-${index + 1}`, noteId: id, status: item.kind === "job" && item.stage === "completed" ? "done" : "open" })),
    questions: normalized.questions,
  }
  if (!validNote(note)) throw new TypeError("The note could not be saved because its data is invalid.")
  return note
}

function requireWorkspace(workspace) { if (!validWorkspace(workspace)) throw new TypeError("The saved workspace is invalid.") }
export function upsertNote(workspace, note) {
  requireWorkspace(workspace)
  if (!validNote(note)) throw new TypeError("The note is invalid.")
  const previous = workspace.notes.find(item => item.id === note.id)
  const next = { version: 1, notes: [{ ...note, createdAt: previous?.createdAt || note.createdAt }, ...workspace.notes.filter(item => item.id !== note.id)] }
  if (!validWorkspace(next)) throw new TypeError(`The workspace supports up to ${MAX_NOTES} notes with unique item IDs.`)
  return next
}

export function removeNote(workspace, id) {
  requireWorkspace(workspace)
  return { version: 1, notes: workspace.notes.filter(note => note.id !== id) }
}

export function updateItem(workspace, itemId, patch, now = new Date().toISOString()) {
  requireWorkspace(workspace)
  if (!isObject(patch) || !only(patch, [...itemFields, "status"])) throw new TypeError("Only item details and status can be updated.")
  const next = { version: 1, notes: workspace.notes.map(note => note.items.some(item => item.id === itemId)
    ? { ...note, updatedAt: now instanceof Date ? now.toISOString() : now, items: note.items.map(item => item.id === itemId ? { ...item, ...patch } : item) }
    : note) }
  if (!validWorkspace(next)) throw new TypeError("The item update is invalid.")
  return next
}

export function workspaceItems(workspace) {
  if (!validWorkspace(workspace)) return []
  return workspace.notes.flatMap(note => note.items.map(item => ({ ...item, noteTitle: note.title, timeZone: note.timeZone })))
}

export function makeExampleNote(now = new Date(), timeZone = "America/Los_Angeles") {
  if (!validTimeZone(timeZone)) throw new TypeError("Choose a valid timezone.")
  const instant = now instanceof Date ? now : new Date(now)
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant)
  const part = type => parts.find(value => value.type === type).value
  const today = `${part("year")}-${part("month")}-${part("day")}`
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + 86400000).toISOString().slice(0, 10)
  const quotes = [
    `Meet Maya in Freeland on ${tomorrow} from 10:00 to 11:00 to discuss her new website.`,
    `Prepare the revised quote by ${tomorrow}.`,
    `Follow up with Maya on ${tomorrow} at 15:00.`,
    `Spent $48.25 USD on printing on ${today}.`,
  ]
  const base = { details: "", date: null, time: null, endDate: null, endTime: null, person: null, location: null, amountCents: null, currency: "USD", reviewReason: null }
  return makeNote({ id: "sample-business-note", text: `Sample note for trying this workspace.\n${quotes.join("\n")}`, timeZone, createdAt: instant.toISOString(), referenceDate: instant.toISOString(), source: "sample", analysis: {
    title: "Sample: website project for Maya", summary: "Prepared example data. These are sample items, not an AI extraction or real appointments.", questions: [],
    items: [
      { ...base, kind: "event", title: "Discuss Maya's website", date: tomorrow, time: "10:00", endDate: tomorrow, endTime: "11:00", person: "Maya", location: "Freeland, WA", sourceQuote: quotes[0] },
      { ...base, kind: "task", title: "Prepare revised quote", date: tomorrow, sourceQuote: quotes[1] },
      { ...base, kind: "followup", title: "Follow up with Maya", date: tomorrow, time: "15:00", person: "Maya", sourceQuote: quotes[2] },
      { ...base, kind: "expense", title: "Printing", date: today, amountCents: 4825, sourceQuote: quotes[3] },
    ],
  } })
}
