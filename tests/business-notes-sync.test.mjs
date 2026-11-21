import test from "node:test"
import assert from "node:assert/strict"
import { emptyWorkspace, makeNote } from "../lib/businessNotes.mjs"
import { emptyOutbox, validOutbox, queueOperation, cachedOutbox, cachedWorkspace, mergeCloudWorkspace, acknowledgeOperation, applyCanonicalResponse } from "../lib/businessNotesSync.mjs"

const stamp = "2026-11-10T18:00:00.000Z"
const note = (id = "note-a", text = "Original note") => makeNote({ id, text, timeZone: "UTC", createdAt: stamp, source: "manual", analysis: { title: text, summary: "", items: [], questions: [] } })
const save = (value, mutationId = "save-one") => ({ action: "save", mutationId, note: value })
const deletion = (noteId, mutationId = "delete-one") => ({ action: "delete", mutationId, noteId })

test("a durable deletion hides a still-present remote note after reload", () => {
  const remote = { version: 1, notes: [note()] }
  const persisted = JSON.stringify(queueOperation(emptyOutbox(), deletion("note-a")))
  assert.deepEqual(mergeCloudWorkspace(remote, cachedOutbox(persisted)), emptyWorkspace())
})

test("cloud authority does not resurrect a remotely deleted stale cached note", () => {
  const staleCache = cachedWorkspace(JSON.stringify({ version: 1, notes: [note()] }))
  assert.equal(staleCache.notes.length, 1)
  assert.deepEqual(mergeCloudWorkspace(emptyWorkspace(), emptyOutbox()), emptyWorkspace())
})

test("a pending edit overrides cloud text even with an older device timestamp", () => {
  const remote = { version: 1, notes: [{ ...note(), updatedAt: "2026-11-10T19:00:00.000Z" }] }
  const edited = note("note-a", "Edited offline")
  const pending = queueOperation(emptyOutbox(), save(edited))
  assert.equal(mergeCloudWorkspace(remote, cachedOutbox(JSON.stringify(pending))).notes[0].text, "Edited offline")
})

test("retrying an unacknowledged first save accepts the server's later creation timestamp", () => {
  const pending = note()
  const canonical = { ...pending, createdAt: "2026-11-10T18:00:01.000Z", updatedAt: "2026-11-10T18:00:01.000Z" }
  const merged = mergeCloudWorkspace({ version: 1, notes: [canonical] }, queueOperation(emptyOutbox(), save(pending)))
  assert.equal(merged.notes[0].createdAt, canonical.createdAt)
  assert.equal(merged.notes[0].text, pending.text)
})

test("only the newest mutation per note remains queued", () => {
  let outbox = queueOperation(emptyOutbox(), save(note(), "save-old"))
  outbox = queueOperation(outbox, save(note("note-a", "New text"), "save-new"))
  assert.equal(outbox.operations.length, 1)
  assert.equal(outbox.operations[0].mutationId, "save-new")
  outbox = queueOperation(outbox, deletion("note-a"))
  assert.equal(outbox.operations[0].action, "delete")
  assert.equal(validOutbox(outbox), true)
})

test("an earlier server response cannot overwrite a later queued edit or acknowledge it", () => {
  const old = save(note(), "save-old")
  const latest = note("note-a", "Later edit")
  const outbox = queueOperation(queueOperation(emptyOutbox(), old), save(latest, "save-new"))
  const workspace = { version: 1, notes: [latest] }
  const result = applyCanonicalResponse(workspace, outbox, old, { ...note(), updatedAt: "2026-11-10T20:00:00.000Z" })
  assert.equal(result.applied, false)
  assert.equal(result.workspace, workspace)
  assert.equal(result.outbox, outbox)
  assert.deepEqual(acknowledgeOperation(outbox, old), outbox)
})

test("the latest save adopts canonical timestamps without disturbing another note", () => {
  const incoming = note(), other = note("note-b", "Another note")
  const operation = save(incoming)
  const canonical = { ...incoming, createdAt: "2026-11-10T18:00:01.000Z", updatedAt: "2026-11-10T18:00:02.000Z" }
  const result = applyCanonicalResponse({ version: 1, notes: [incoming, other] }, queueOperation(emptyOutbox(), operation), operation, canonical)
  assert.deepEqual(result.workspace.notes.find(entry => entry.id === incoming.id), canonical)
  assert.deepEqual(result.workspace.notes.find(entry => entry.id === other.id), other)
  assert.deepEqual(result.outbox, emptyOutbox())
})

test("a queued deletion remains in effect until its matching acknowledgement", () => {
  const operation = deletion("note-a")
  const outbox = queueOperation(emptyOutbox(), operation)
  const result = applyCanonicalResponse(emptyWorkspace(), outbox, operation)
  assert.deepEqual(result.workspace, emptyWorkspace())
  assert.deepEqual(result.outbox, emptyOutbox())
})

test("unreadable or forged browser records are rejected instead of trusted", () => {
  assert.throws(() => cachedWorkspace("{not-json"))
  assert.throws(() => cachedOutbox(JSON.stringify({ version: 1, operations: [{ action: "delete", mutationId: "one", noteId: "../another-account" }] })))
  assert.throws(() => cachedOutbox(JSON.stringify({ version: 1, operations: [save(note()), save(note())] })))
  assert.throws(() => applyCanonicalResponse({ version: 1, notes: [note()] }, queueOperation(emptyOutbox(), save(note())), save(note()), note("different-id")))
})
