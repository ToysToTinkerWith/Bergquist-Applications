const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const { pathToFileURL } = require("node:url")
const path = require("node:path")

const modelPromise = import(pathToFileURL(path.join(__dirname, "../lib/businessNotes.mjs")).href)
function loadHandler(file, names, dependencies) {
  let source = fs.readFileSync(path.join(__dirname, "../pages/api/", file), "utf8")
  source = source.replace(/^import .*$/gm, "").replace(/export default async function /g, "async function ").replace(/export (const|function) /g, "$1 ")
  source += `\nmodule.exports = {${names.join(",")}}`
  const sandbox = { module: { exports: {} }, process: { env: { OPENAI_API_KEY: "test-only-key" } }, Date, Intl, ...dependencies }
  vm.runInNewContext(source, sandbox, { filename: file })
  return { ...sandbox.module.exports, env: sandbox.process.env }
}
function response() { return { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v }, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } } }
function req(method, body = {}, authorization) { return { method, body, headers: authorization ? { authorization } : {}, socket: { remoteAddress: "test-ip" } } }
const accessMocks = {
  requireBusinessNotesAccess: async request => {
    const token = request.headers?.authorization?.replace(/^Bearer /, "") || request.body?.idToken
    if (["valid", "alice"].includes(token)) return { uid: "alice", firebase: { sign_in_provider: "google.com" } }
    throw Object.assign(new Error("Access denied"), { statusCode: ["anon", "denied"].includes(token) ? 403 : 401, code: ["anon", "denied"].includes(token) ? "business_notes_forbidden" : "business_notes_auth_required" })
  },
  sendBusinessNotesAccessError: (res, error) => { res.status(error.statusCode).json({ allowed: false, code: error.code, error: "Access denied" }); return true },
}

async function captureFixture() {
  const model = await modelPromise
  const note = model.makeExampleNote(new Date("2026-11-10T01:00:00.000Z"), "America/Los_Angeles")
  const analysis = { title: note.title, summary: note.summary, questions: [], items: note.items.map(({ id, noteId, status, ...item }) => item) }
  const state = { calls: 0, rateCalls: 0, photoCalls: 0, analysis }
  const api = loadHandler("business-capture.js", ["businessCapture", "localReference"], {
    ...model, ...accessMocks,
    normalizePhotoInputs: async photos => { state.photoCalls++; if (state.photoError) throw state.photoError; return photos },
    OpenAI: class { constructor() { this.chat = { completions: { create: async request => { state.calls++; state.request = request; return state.completion || { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(state.analysis) } }] } } } } } },
    getAdminAuth: () => ({ verifyIdToken: async token => { if (token === "valid") return { uid: "alice" }; throw Object.assign(new Error("expired"), { code: "auth/id-token-expired" }) } }),
    assertAssistantRateLimit: async () => { state.rateCalls++; if (state.rateError) throw state.rateError },
    isAnonymousFirebaseUser: user => user?.firebase?.sign_in_provider === "anonymous",
    isAssistantRateLimitError: error => error?.statusCode === 429,
    sendAssistantRateLimitError: (res, error) => res.status(429).json({ error: "Wait", retryAfterSeconds: error.retryAfterSeconds }),
  })
  return { api, state, note }
}

test("approved capture proposes grounded items and uses local date", async () => {
  const { api, state, note } = await captureFixture(), res = response()
  await api.businessCapture(req("POST", { idToken: "valid", text: note.text, timeZone: note.timeZone, referenceDate: "2026-11-10T01:00:00.000Z" }), res)
  assert.equal(res.statusCode, 200)
  assert.equal(state.calls, 1); assert.equal(state.rateCalls, 1)
  assert.match(state.request.messages[0].content, /2026-11-09 17:00/)
  assert.equal(state.request.response_format.type, "json_schema")
  assert.match(state.request.messages[0].content, /hundredths of the displayed currency unit for EVERY currency/)
  assert.match(state.request.messages[0].content, /JPY 1000 -> 100000/)
  assert.match(state.request.messages[0].content, /Do not perform currency conversion/)
  assert.match(state.request.response_format.json_schema.schema.properties.items.items.properties.amountCents.description, /hundredths of the displayed currency unit/)
  assert.equal(res.body.analysis.items.length, 4)
  assert.equal(res.headers["Cache-Control"], "private, no-store")
})

test("bad auth and invalid reference dates fail before AI", async () => {
  const { api, state, note } = await captureFixture()
  const badAuth = response()
  await api.businessCapture(req("POST", { text: note.text, timeZone: note.timeZone, idToken: "bad" }), badAuth)
  assert.equal(badAuth.statusCode, 401)
  const badDate = response()
  await api.businessCapture(req("POST", { idToken: "valid", text: note.text, timeZone: note.timeZone, referenceDate: "2026-02-30T01:00:00.000Z" }), badDate)
  assert.equal(badDate.statusCode, 400)
  assert.equal(state.calls, 0)
})

test("signed-out, anonymous and unapproved accounts cannot invoke extraction or its rate limiter", async () => {
  const { api, state, note } = await captureFixture()
  for (const [idToken, expected] of [[undefined, 401], ["anon", 403], ["denied", 403]]) {
    const res = response()
    await api.businessCapture(req("POST", { idToken, text: note.text, timeZone: note.timeZone }), res)
    assert.equal(res.statusCode, expected)
  }
  assert.equal(state.calls, 0)
  assert.equal(state.rateCalls, 0)
  assert.equal(state.photoCalls, 0)
})

test("photo-only capture sends actual images and returns grounded job and private social drafts", async () => {
  const { api, state } = await captureFixture()
  const photo = { id: "photo-1", name: "project.jpg", contentType: "image/jpeg", width: 1200, height: 800, size: 1234, caption: "Project scope", dataUrl: "data:image/jpeg;base64,test-image" }
  const base = { ...state.analysis.items[0], date: null, time: null, endDate: null, endTime: null, person: null, location: null, sourceQuote: "", sourcePhotoIds: [photo.id] }
  state.analysis = { title: "Project photos", summary: "Observed work to review.", questions: [], photoDescriptions: [{ id: photo.id, description: "Visible project materials." }], items: [
    { ...base, kind: "job", stage: "new" },
    { ...base, kind: "social", stage: null, platform: "LinkedIn", postText: "A look at a project in planning. Get in touch to discuss your next idea." },
  ] }
  const res = response()
  await api.businessCapture(req("POST", { idToken: "valid", photos: [photo], createJob: true, createSocialDraft: true, socialPlatform: "LinkedIn", timeZone: "America/Los_Angeles" }), res)
  assert.equal(res.statusCode, 200)
  assert.equal(state.request.messages[1].content.find(part => part.type === "image_url").image_url.url, photo.dataUrl)
  assert.match(state.request.messages[0].content, /Do not identify faces/)
  assert.match(state.request.messages[0].content, /Omit private customer names\/contact details and exact street addresses/)
  assert.equal(res.body.analysis.items[0].sourcePhotoIds[0], photo.id)
  assert.equal(res.body.analysis.items[1].platform, "LinkedIn")
  assert.equal(res.body.analysis.photoDescriptions[0].id, photo.id)
})

test("photo validation, invented evidence and unrequested social records fail honestly", async () => {
  const { api, state, note } = await captureFixture()
  const input = req("POST", { idToken: "valid", text: note.text, timeZone: note.timeZone })
  state.photoError = Object.assign(new Error("Choose valid photos"), { statusCode: 400 })
  let res = response(); await api.businessCapture(input, res); assert.equal(res.statusCode, 400)
  assert.equal(state.calls, 0)
  state.photoError = null
  state.analysis.items[0].sourcePhotoIds = ["not-attached"]
  res = response(); await api.businessCapture(input, res); assert.equal(res.statusCode, 503)
  state.analysis.items[0].sourcePhotoIds = []; state.analysis.items[0].kind = "social"; state.analysis.items[0].platform = "Facebook"; state.analysis.items[0].postText = "A draft"
  res = response(); await api.businessCapture(input, res); assert.equal(res.statusCode, 503)
})

test("unconfigured service, rate limits, partial output and fabricated evidence never return fake success", async () => {
  const { api, state, note } = await captureFixture()
  const input = req("POST", { idToken: "valid", text: note.text, timeZone: note.timeZone })
  delete api.env.OPENAI_API_KEY
  let res = response(); await api.businessCapture(input, res); assert.equal(res.statusCode, 503)
  api.env.OPENAI_API_KEY = "test-only-key"
  state.rateError = { statusCode: 429, retryAfterSeconds: 45 }
  res = response(); await api.businessCapture(input, res); assert.equal(res.statusCode, 429)
  state.rateError = null; state.completion = { choices: [{ finish_reason: "length", message: { content: "{}" } }] }
  res = response(); await api.businessCapture(input, res); assert.equal(res.statusCode, 503)
  state.completion = null; state.analysis.items[0].sourceQuote = "An invented meeting at a different business"
  res = response(); await api.businessCapture(input, res); assert.equal(res.statusCode, 503)
  assert.equal(res.body.analysis, undefined)
})

async function workspaceFixture() {
  const model = await modelPromise
  const stores = new Map(), cleanupStores = new Map(), touched = [], removedPhotos = [], storageState = { failDeletes: false }
  let nextId = 0
  const storeFor = uid => { if (!stores.has(uid)) stores.set(uid, new Map()); return stores.get(uid) }
  const dataFor = (uid, name) => { if (name === "businessNotes") return storeFor(uid); if (!cleanupStores.has(uid)) cleanupStores.set(uid, new Map()); return cleanupStores.get(uid) }
  function snapshot(uid, id, name) { const value = dataFor(uid, name).get(id); return { id, exists: Boolean(value), data: () => value } }
  function query(uid, name, count = Infinity) { return { type: "query", uid, name, limit: size => query(uid, name, size), get: async () => { const docs = [...dataFor(uid, name)].slice(0, count).map(([id]) => snapshot(uid, id, name)); return { docs, size: docs.length } } } }
  function collection(uid, name) { return { doc: (id = `generated-${++nextId}`) => ({ type: "doc", uid, name, id, get: async () => snapshot(uid, id, name), delete: async () => { if (name === "businessNotes") touched.push(`${uid}/${id}`); dataFor(uid, name).delete(id) } }), orderBy: () => query(uid, name), limit: count => query(uid, name, count) } }
  const db = { collection: name => { assert.equal(name, "users"); return { doc: uid => ({ collection: name => { assert.ok(["businessNotes", "businessNotePhotoCleanup"].includes(name)); return collection(uid, name) } }) } }, runTransaction: async action => { const writes = []; await action({ get: ref => ref.type === "doc" ? Promise.resolve(snapshot(ref.uid, ref.id, ref.name)) : ref.get(), set: (ref, value) => writes.push([ref, value]), delete: ref => writes.push([ref, null]) }); for (const [ref, value] of writes) { if (ref.name === "businessNotes") touched.push(`${ref.uid}/${ref.id}`); if (value === null) dataFor(ref.uid, ref.name).delete(ref.id); else dataFor(ref.uid, ref.name).set(ref.id, value) } } }
  const api = loadHandler("business-workspace.js", ["businessWorkspace"], { ...model, ...accessMocks,
    getFirestore: () => db,
    getStorageBucket: () => ({ file: photoPath => ({ delete: async () => { if (storageState.failDeletes) throw new Error("Storage unavailable"); removedPhotos.push(photoPath) } }) }),
    businessNotePhotoPath: (uid, noteId, photoId) => `businessNotes/${uid}/${noteId}/${photoId}.jpg`,
    getAdminAuth: () => ({ verifyIdToken: async token => token === "alice" ? { uid: "alice" } : token === "anon" ? { uid: "guest", firebase: { sign_in_provider: "anonymous" } } : Promise.reject(Object.assign(new Error("expired"), { code: "auth/id-token-expired" })) }),
  })
  return { api, stores, touched, model, storeFor, removedPhotos, cleanupStores, storageState }
}

test("cloud requires a real account and ignores client supplied owner scope", async () => {
  const { api, touched, model, storeFor } = await workspaceFixture()
  let res = response(); await api.businessWorkspace(req("GET"), res); assert.equal(res.statusCode, 401)
  res = response(); await api.businessWorkspace(req("POST", { idToken: "anon", action: "delete", noteId: "sample-business-note" }), res); assert.equal(res.statusCode, 403)
  const note = model.makeExampleNote(new Date("2026-11-10T01:00:00.000Z"), "UTC")
  storeFor("bob").set(note.id, note)
  res = response(); await api.businessWorkspace(req("POST", { idToken: "alice", action: "save", ownerUid: "bob", note }), res)
  assert.equal(res.statusCode, 200)
  assert.deepEqual(touched, [`alice/${note.id}`])
  assert.notEqual(res.body.note.createdAt, note.createdAt)
  assert.equal(res.body.note.referenceDate, note.referenceDate)
  res = response(); await api.businessWorkspace(req("GET", {}, "Bearer alice"), res)
  assert.equal(res.body.workspace.notes.length, 1)
  assert.equal(res.body.workspace.notes[0].id, note.id)
  assert.equal(res.headers["Cache-Control"], "private, no-store")
  res = response(); await api.businessWorkspace(req("POST", { idToken: "alice", action: "delete", noteId: note.id, ownerUid: "bob" }), res)
  assert.equal(res.statusCode, 200)
  assert.equal(storeFor("alice").size, 0)
  assert.equal(storeFor("bob").size, 1)
})

test("malformed private saves are rejected atomically and do not touch storage", async () => {
  const { api, touched, model } = await workspaceFixture()
  const note = model.makeExampleNote(new Date("2026-11-10T01:00:00.000Z"), "UTC")
  let res = response(); await api.businessWorkspace(req("POST", { idToken: "alice", action: "save", note: { ...note, ownerUid: "bob" } }), res)
  assert.equal(res.statusCode, 400)
  res = response(); await api.businessWorkspace(req("POST", { idToken: "alice", action: "delete", noteId: "../bob/private" }), res)
  assert.equal(res.statusCode, 400)
  assert.equal(touched.length, 0)
})

test("cloud photo metadata stays private and removing/deleting notes cleans only the verified owner's photo path", async () => {
  const { api, model, storeFor, removedPhotos } = await workspaceFixture()
  const photo = { id: "photo-1", name: "site.jpg", contentType: "image/jpeg", width: 100, height: 100, size: 1234, caption: "", description: "Visible materials" }
  const note = model.makeNote({ id: "photo-note", photos: [photo], timeZone: "UTC", analysis: { title: "Site photo", summary: "Review the pictured work.", items: [], questions: [] } })
  let res = response(); await api.businessWorkspace(req("POST", { idToken: "alice", action: "save", note }), res)
  assert.equal(res.statusCode, 200)
  assert.equal(storeFor("alice").get(note.id).photos[0].id, photo.id)
  const textOnly = { ...res.body.note, text: "Photo removed after review", photos: [] }
  res = response(); await api.businessWorkspace(req("POST", { idToken: "alice", action: "save", note: textOnly, ownerUid: "bob" }), res)
  assert.equal(res.statusCode, 200)
  assert.deepEqual(removedPhotos, ["businessNotes/alice/photo-note/photo-1.jpg"])
  res = response(); await api.businessWorkspace(req("POST", { idToken: "alice", action: "save", note }), res)
  storeFor("bob").set(note.id, note)
  res = response(); await api.businessWorkspace(req("POST", { idToken: "alice", action: "delete", noteId: note.id, ownerUid: "bob" }), res)
  assert.equal(res.statusCode, 200)
  assert.equal(removedPhotos.length, 2)
  assert.equal(storeFor("bob").has(note.id), true)
})

test("photo cleanup references survive storage failure and retry after a deleted note is gone", async () => {
  const { api, model, storeFor, removedPhotos, cleanupStores, storageState } = await workspaceFixture()
  const photo = { id: "photo-1", name: "site.jpg", contentType: "image/jpeg", width: 100, height: 100, size: 1234, caption: "", description: "Visible materials" }
  const note = model.makeNote({ id: "photo-note", photos: [photo], timeZone: "UTC", analysis: { title: "Site photo", summary: "Review work.", items: [], questions: [] } })
  storeFor("alice").set(note.id, note); storageState.failDeletes = true
  let res = response(); await api.businessWorkspace(req("POST", { idToken: "alice", action: "delete", noteId: note.id }), res)
  assert.equal(res.statusCode, 200); assert.equal(res.body.photoCleanupPending, true)
  assert.equal(storeFor("alice").has(note.id), false)
  assert.equal(cleanupStores.get("alice").size, 1)
  storageState.failDeletes = false
  res = response(); await api.businessWorkspace(req("GET", {}, "Bearer alice"), res)
  assert.equal(res.statusCode, 200); assert.equal(res.body.workspace.notes.length, 0)
  assert.equal(cleanupStores.get("alice").size, 0)
  assert.deepEqual(removedPhotos, ["businessNotes/alice/photo-note/photo-1.jpg"])
})

test("a photo reattached by a later save survives stale cleanup and its queue record is cleared", async () => {
  const { api, model, storeFor, removedPhotos, cleanupStores, storageState } = await workspaceFixture()
  const photo = { id: "photo-1", name: "site.jpg", contentType: "image/jpeg", width: 100, height: 100, size: 1234, caption: "", description: "Visible materials" }
  const note = model.makeNote({ id: "photo-note", photos: [photo], timeZone: "UTC", analysis: { title: "Site photo", summary: "Review work.", items: [], questions: [] } })
  storeFor("alice").set(note.id, note); storageState.failDeletes = true
  let res = response(); await api.businessWorkspace(req("POST", { idToken: "alice", action: "delete", noteId: note.id }), res)
  assert.equal(res.body.photoCleanupPending, true)
  assert.equal(cleanupStores.get("alice").size, 1)
  // Simulate another tab restoring the same note/photo while cleanup is pending.
  storeFor("alice").set(note.id, note); storageState.failDeletes = false
  res = response(); await api.businessWorkspace(req("GET", {}, "Bearer alice"), res)
  assert.equal(res.statusCode, 200)
  assert.equal(res.body.workspace.notes[0].photos[0].id, photo.id)
  assert.equal(removedPhotos.length, 0)
  assert.equal(cleanupStores.get("alice").size, 0)
})
