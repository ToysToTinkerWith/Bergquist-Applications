import test from "node:test"
import assert from "node:assert/strict"
import { MAX_NOTE_LENGTH, MAX_NOTES, MAX_NOTE_PHOTO_BYTES, emptyWorkspace, validWorkspace, validNote, validDate, validAnalysis, makeNote, makeExampleNote, upsertNote, removeNote, updateItem, workspaceItems, normalizeAnalysis } from "../lib/businessNotes.mjs"

const stamp = "2026-11-10T01:00:00.000Z"
const example = () => makeExampleNote(new Date(stamp), "America/Los_Angeles")
const clone = value => JSON.parse(JSON.stringify(value))

test("sample is honest, normalized and uses the local date across UTC midnight", () => {
  const note = example()
  assert.equal(note.source, "sample")
  assert.match(note.summary, /not an AI extraction/)
  assert.equal(note.items.find(item => item.kind === "event").date, "2026-11-10")
  assert.equal(note.items.find(item => item.kind === "expense").date, "2026-11-09")
  assert.ok(note.items.every(item => note.text.includes(item.sourceQuote)))
  assert.ok(validNote(note))
  assert.deepEqual(example(), note)
})

test("invalid dates, clock times, reversed events and fractional cents cannot be stored", () => {
  assert.equal(validDate("2026-02-30"), false)
  assert.equal(validDate("2024-02-29"), true)
  for (const patch of [{ date: "2026-02-30" }, { time: "24:15" }, { endTime: "09:00" }, { amountCents: 12.5 }, { amountCents: -4 }]) {
    const note = clone(example()); Object.assign(note.items[0], patch)
    assert.equal(validNote(note), false, JSON.stringify(patch))
  }
})

test("partial events and missing expense amounts stay reviewable", () => {
  const sample = example()
  const items = sample.items.map(({ id, noteId, status, ...item }) => item)
  items[0].time = null; items[0].endTime = null
  items[3].amountCents = null
  const analysis = normalizeAnalysis({ title: sample.title, summary: sample.summary, items, questions: [] })
  assert.match(analysis.items[0].reviewReason, /Confirm/)
  assert.match(analysis.items[3].reviewReason, /amount/)
})

test("plain notes require no invented tasks or appointments", () => {
  const note = makeNote({ id: "plain-note", text: "Keep the blue design direction.", timeZone: "UTC", createdAt: stamp, source: "manual", analysis: { title: "Design direction", summary: "Use the blue design direction.", items: [], questions: [] } })
  assert.equal(note.items.length, 0)
  assert.ok(validWorkspace(upsertNote(emptyWorkspace(), note)))
})

test("original relative-date anchor survives timestamps changing and old caches remain valid", () => {
  const note = example()
  assert.equal(note.referenceDate, stamp)
  const savedLater = { ...note, createdAt: "2026-11-11T10:00:00.000Z", updatedAt: "2026-11-11T10:00:00.000Z" }
  assert.ok(validNote(savedLater))
  assert.equal(savedLater.referenceDate, stamp)
  const old = { ...note }; delete old.referenceDate
  assert.ok(validNote(old))
  assert.equal(validNote({ ...note, referenceDate: "2026-02-30" }), false)
})

test("task status and edits preserve source and identity without mutating previous state", () => {
  const original = upsertNote(emptyWorkspace(), example())
  const before = clone(original)
  const id = original.notes[0].items[1].id
  const next = updateItem(original, id, { status: "done", details: "Sent draft for review" }, "2026-11-10T02:00:00.000Z")
  assert.deepEqual(original, before)
  const item = workspaceItems(next).find(item => item.id === id)
  assert.equal(item.status, "done")
  assert.equal(item.sourceQuote, before.notes[0].items[1].sourceQuote)
  assert.equal(item.timeZone, "America/Los_Angeles")
  assert.throws(() => updateItem(next, id, { noteId: "someone-else" }), /Only item/)
  assert.throws(() => updateItem(next, id, { status: "invalid" }), /invalid/)
})

test("upsert and delete are coherent with embedded items", () => {
  const note = example()
  const workspace = upsertNote(upsertNote(emptyWorkspace(), note), { ...note, title: "Edited sample" })
  assert.equal(workspace.notes.length, 1)
  assert.equal(workspaceItems(workspace).length, 4)
  assert.equal(workspace.notes[0].title, "Edited sample")
  assert.deepEqual(removeNote(workspace, note.id), emptyWorkspace())
})

test("rejects unknown fields, spoofed cross-note identities and duplicate IDs", () => {
  const note = example()
  assert.equal(validNote({ ...note, ownerUid: "other-person" }), false)
  const spoofed = clone(note); spoofed.items[0].noteId = "other-note"
  assert.equal(validNote(spoofed), false)
  const duplicate = clone(note); duplicate.items[1].id = duplicate.items[0].id
  assert.equal(validNote(duplicate), false)
  assert.equal(validWorkspace({ version: 1, notes: [note, note] }), false)
  assert.equal(validWorkspace({ version: 2, notes: [] }), false)
})

test("oversized notes and workspaces fail without truncating user data", () => {
  assert.throws(() => makeNote({ id: "too-long", text: "x".repeat(MAX_NOTE_LENGTH + 1), timeZone: "UTC", createdAt: stamp, analysis: { title: "Long", summary: "", items: [], questions: [] } }), /too long/)
  const notes = Array.from({ length: MAX_NOTES }, (_, index) => makeNote({ id: `note-${index}`, text: "Original", timeZone: "UTC", createdAt: stamp, analysis: { title: "Original", summary: "", items: [], questions: [] } }))
  assert.ok(validWorkspace({ version: 1, notes }))
  assert.throws(() => upsertNote({ version: 1, notes }, example()), /supports up to/)
})

const photo = { id: "photo-1", name: "site.jpg", contentType: "image/jpeg", width: 1200, height: 800, size: 12345, caption: "Work to review", description: "" }
function photoNote() {
  const { id, noteId, status, ...base } = example().items[0]
  const items = [
    { ...base, kind: "job", title: "Review pictured work", date: null, time: null, endDate: null, endTime: null, sourceQuote: "", sourcePhotoIds: [photo.id], stage: "new" },
    { ...base, kind: "social", title: "LinkedIn draft", date: null, time: null, endDate: null, endTime: null, sourceQuote: "", sourcePhotoIds: [photo.id], platform: "LinkedIn", postText: "A look at our latest project planning. Get in touch to discuss your next project." },
  ]
  return makeNote({ id: "photo-note", text: "", photos: [{ ...photo, dataUrl: "data:image/jpeg;base64,transport-only" }], timeZone: "UTC", createdAt: stamp, analysis: { title: "Pictured work", summary: "Photo observations to review.", items, questions: ["What scope should be included?"], photoDescriptions: [{ id: photo.id, description: "Visible project materials for review." }] } })
}

test("photo-only notes preserve provenance without persisting image transport data", () => {
  const note = photoNote()
  assert.ok(validNote(note))
  assert.equal(note.text, "")
  assert.equal(note.photos[0].description, "Visible project materials for review.")
  assert.equal(note.photos[0].dataUrl, undefined)
  assert.equal(note.items[0].stage, "new")
  assert.equal(note.items[1].postText.startsWith("A look"), true)
  assert.equal(note.items[0].sourcePhotoIds[0], note.photos[0].id)
  assert.ok(validWorkspace(upsertNote(emptyWorkspace(), note)))
})

test("old notes/items remain valid while normalization adds new optional fields", () => {
  const note = clone(example()); delete note.photos
  note.items.forEach(item => { delete item.sourcePhotoIds; delete item.stage; delete item.platform; delete item.postText })
  assert.ok(validNote(note))
  const analysis = { title: note.title, summary: note.summary, items: note.items.map(({ id, noteId, status, ...item }) => item), questions: [] }
  assert.ok(validAnalysis(analysis))
  const normalized = normalizeAnalysis(analysis)
  assert.deepEqual(normalized.photoDescriptions, [])
  assert.deepEqual(normalized.items[0].sourcePhotoIds, [])
  assert.equal(normalized.items[0].stage, null)
})

test("photo bounds, unmatched evidence, invalid stages and oversized drafts cannot enter stored notes", () => {
  const note = photoNote()
  const invalid = [
    { ...note, photos: [{ ...note.photos[0], size: MAX_NOTE_PHOTO_BYTES + 1 }] },
    { ...note, photos: [{ ...note.photos[0], url: "https://example.test/private-photo" }] },
    { ...note, photos: [] },
    { ...note, items: note.items.map(item => ({ ...item, sourcePhotoIds: ["missing-photo"] })) },
    { ...note, items: note.items.map(item => ({ ...item, stage: "invented" })) },
    { ...note, items: note.items.map(item => ({ ...item, postText: "x".repeat(3001) })) },
  ]
  invalid.forEach(value => assert.equal(validNote(value), false))
  const done = updateItem(upsertNote(emptyWorkspace(), note), note.items[0].id, { stage: "completed", status: "done" }, "2026-11-10T02:00:00.000Z")
  assert.equal(workspaceItems(done)[0].stage, "completed")
})

test("a job explicitly extracted as completed is counted as done on first save", () => {
  const original = photoNote()
  const analysis = { title: original.title, summary: original.summary, questions: [], items: original.items.map(({ id, noteId, status, ...item }) => item.kind === "job" ? { ...item, stage: "completed" } : item) }
  const note = makeNote({ id: original.id, text: original.text, photos: original.photos, timeZone: original.timeZone, createdAt: stamp, analysis })
  assert.equal(note.items[0].stage, "completed")
  assert.equal(note.items[0].status, "done")
  assert.equal(note.items[1].status, "open")
  const unknownStage = { ...analysis, items: analysis.items.map(item => ({ ...item, stage: null })) }
  assert.equal(normalizeAnalysis(unknownStage).items[0].stage, null)
  const fresh = makeNote({ id: original.id, photos: original.photos, timeZone: original.timeZone, createdAt: stamp, analysis: unknownStage })
  assert.equal(fresh.items[0].stage, "new")
  assert.equal(fresh.items[0].status, "open")
})
