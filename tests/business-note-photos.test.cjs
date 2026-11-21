const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { pathToFileURL } = require("node:url")
const sharp = require("sharp")

function load(file, names, dependencies) {
  let source = fs.readFileSync(path.resolve(__dirname, "..", file), "utf8")
  source = source.replace(/^import .*$/gm, "").replace(/export default async function /g, "async function ").replace(/export (async function|function|const|class) /g, "$1 ")
  source += `\nmodule.exports = { ${names.join(",")} }`
  const sandbox = { module: { exports: {} }, Buffer, encodeURIComponent, ...dependencies }
  vm.runInNewContext(source, sandbox, { filename: file })
  return sandbox.module.exports
}
const helper = load("lib/businessNotePhotoServer.js", ["normalizePhotoInputs", "photoMetadata", "businessNotePhotoPath", "BusinessNotePhotoError", "validPhotoId", "validPhotoNoteId", "MAX_NOTE_PHOTO_BYTES"], { sharp })
const modelPromise = import(pathToFileURL(path.resolve(__dirname, "../lib/businessNotes.mjs")).href)
const raw = (buffer, type = "png", extra = {}) => ({ id: "photo_1", name: "Job photo.png", caption: "Front entry before work", description: "", dataUrl: `data:image/${type};base64,${buffer.toString("base64")}`, ...extra })
const plain = value => JSON.parse(JSON.stringify(value))
const image = () => sharp({ create: { width: 2200, height: 1100, channels: 4, background: { r: 80, g: 40, b: 120, alpha: .6 } } }).png().withMetadata({ exif: { IFD0: { Artist: "Photo validation test" } } }).toBuffer()

test("real images become bounded JPEGs with orientation handled and EXIF stripped", async () => {
  const [photo] = await helper.normalizePhotoInputs([raw(await image())])
  const metadata = await sharp(photo.buffer).metadata()
  assert.equal(photo.contentType, "image/jpeg")
  assert.equal(metadata.format, "jpeg")
  assert.equal(photo.width, 1600); assert.equal(photo.height, 800)
  assert.ok(photo.size <= 900 * 1024)
  assert.equal(photo.size, photo.buffer.length)
  assert.equal(metadata.exif, undefined)
  assert.equal(metadata.xmp, undefined)
  assert.equal(metadata.orientation, undefined)
  assert.equal(photo.dataUrl, "data:image/jpeg;base64," + photo.buffer.toString("base64"))
  assert.deepEqual(Object.keys(helper.photoMetadata(photo)).sort(), ["id", "name", "contentType", "width", "height", "size", "caption", "description"].sort())
  const rotated = await sharp({ create: { width: 120, height: 80, channels: 3, background: "red" } }).jpeg().withMetadata({ orientation: 6 }).toBuffer()
  const [portrait] = await helper.normalizePhotoInputs([raw(rotated, "jpeg")])
  assert.equal(portrait.width, 80); assert.equal(portrait.height, 120)
})

test("SVG, GIF, spoofed, corrupt, remote, oversized and ambiguous inputs are rejected", async () => {
  const png = await image()
  for (const photo of [
    raw(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'), "jpeg"),
    raw(Buffer.from("GIF89a"), "gif"), raw(png, "jpeg"), raw(Buffer.from([255, 216, 255, 1]), "jpeg"),
    { ...raw(png), dataUrl: "https://example.test/image.jpg" },
    { ...raw(png), caption: "x".repeat(501) }, { ...raw(png), description: "x".repeat(1501) },
    { ...raw(png), id: "../other-photo" }, { ...raw(png), name: "x".repeat(181) },
  ]) await assert.rejects(helper.normalizePhotoInputs([photo]), error => error.statusCode === 400)
  await assert.rejects(helper.normalizePhotoInputs([raw(png), raw(png)]), /unique/)
  await assert.rejects(helper.normalizePhotoInputs(Array.from({ length: 7 }, (_, index) => raw(png, "png", { id: "photo" + index }))), /6/)
  const hugeWidth = await sharp({ create: { width: 12001, height: 1, channels: 3, background: "red" } }).png().toBuffer()
  await assert.rejects(helper.normalizePhotoInputs([raw(hugeWidth)]), /dimensions/)
  assert.throws(() => helper.businessNotePhotoPath("alice", "../bob", "photo_1"), /valid/)
  assert.throws(() => helper.businessNotePhotoPath("alice", "note1", "../photo"), /valid/)
  assert.equal(helper.businessNotePhotoPath("alice/../bob", "note1", "photo_1"), "businessNotes/alice%2F..%2Fbob/note1/photo_1.jpg")
})

function response() {
  return { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value }, status(value) { this.statusCode = value; return this }, json(value) { this.body = value; return this }, send(value) { this.body = value; return this } }
}
async function fixture() {
  const model = await modelPromise, objects = new Map(), notes = new Map()
  const state = { auth: 0, normalize: 0, bucket: 0, reads: [], writes: [], dbReads: [], download: 0 }
  const bucket = { file(filePath) {
    state.reads.push(filePath)
    return {
      async save(buffer, options) { state.writes.push({ filePath, options }); objects.set(filePath, { buffer, metadata: { ...options.metadata, size: String(buffer.length) } }) },
      async getMetadata() { if (!objects.has(filePath)) throw Object.assign(new Error("Missing"), { code: 404 }); return [objects.get(filePath).metadata] },
      async download() { state.download++; return [objects.get(filePath).buffer] },
    }
  } }
  const api = load("pages/api/business-note-photos.js", ["businessNotePhotos"], {
    ...helper, validNote: model.validNote,
    normalizePhotoInputs: async photos => { state.normalize++; return helper.normalizePhotoInputs(photos) },
    requireBusinessNotesAccess: async req => { state.auth++; const token = req.headers?.authorization; if (!["Bearer alice", "Bearer bob"].includes(token)) throw Object.assign(new Error("Denied"), { statusCode: 403 }); return { uid: token.slice(7) } },
    sendBusinessNotesAccessError: (res, error) => { res.status(error.statusCode).json({ allowed: false, error: "Denied" }); return true },
    getStorageBucket: () => { state.bucket++; return bucket },
    getFirestore: () => ({ collection(name) { assert.equal(name, "users"); return { doc(uid) { return { collection(collection) { assert.equal(collection, "businessNotes"); return { doc(noteId) { return { async get() { state.dbReads.push([uid, noteId]); const note = notes.get(uid + "/" + noteId); return { exists: Boolean(note), data: () => note } } } } } } } } } } }),
  })
  return { ...api, model, notes, objects, state }
}
const request = (method, fields = {}, token = "alice") => ({ method, headers: { authorization: "Bearer " + token }, ...(method === "GET" ? { query: fields } : { body: fields }) })

test("photo uploads require approval before decoding and never publish URLs or tokens", async () => {
  const f = await fixture(), denied = response()
  await f.businessNotePhotos(request("POST", { noteId: "note1", photos: [{ dataUrl: "bad" }] }, "denied"), denied)
  assert.equal(denied.statusCode, 403); assert.equal(f.state.normalize, 0); assert.equal(f.state.bucket, 0)
  const uploaded = response()
  await f.businessNotePhotos(request("POST", { noteId: "note1", uid: "bob", photos: [raw(await image())] }), uploaded)
  assert.equal(uploaded.statusCode, 200)
  assert.equal(uploaded.body.photos.length, 1)
  assert.equal(f.state.writes[0].filePath, "businessNotes/alice/note1/photo_1.jpg")
  assert.deepEqual(f.state.dbReads, [], "upload before note creation does not read or write Firestore")
  assert.equal(f.state.writes[0].options.metadata.metadata.ownerUid, "alice")
  assert.equal(f.state.writes[0].options.metadata.metadata.firebaseStorageDownloadTokens, undefined)
  assert.equal(f.state.writes[0].options.public, undefined)
  assert.equal(uploaded.body.photos[0].dataUrl, undefined)
  assert.equal(uploaded.body.photos[0].buffer, undefined)
  assert.equal(uploaded.body.photos[0].url, undefined)
})

test("private GET requires membership in the approved owner's actual saved note", async () => {
  const f = await fixture(), upload = response()
  await f.businessNotePhotos(request("POST", { noteId: "note1", photos: [raw(await image())] }), upload)
  const premature = response()
  await f.businessNotePhotos(request("GET", { noteId: "note1", photoId: "photo_1" }), premature)
  assert.equal(premature.statusCode, 404)
  const note = { ...f.model.makeExampleNote(new Date("2026-11-10T01:00:00.000Z"), "America/Los_Angeles"), id: "note1", items: [], photos: plain(upload.body.photos) }
  assert.equal(f.model.validNote(note), true)
  f.notes.set("alice/note1", note)
  const unauthorized = response(), bucketBefore = f.state.bucket
  await f.businessNotePhotos(request("GET", { noteId: "note1", photoId: "photo_1", uid: "alice" }, "bob"), unauthorized)
  assert.equal(unauthorized.statusCode, 404); assert.equal(f.state.bucket, bucketBefore)
  assert.deepEqual(f.state.dbReads.at(-1), ["bob", "note1"])
  const otherPhoto = response()
  await f.businessNotePhotos(request("GET", { noteId: "note1", photoId: "not-in-note" }), otherPhoto)
  assert.equal(otherPhoto.statusCode, 404)
  const okay = response()
  await f.businessNotePhotos(request("GET", { noteId: "note1", photoId: "photo_1", path: "businessNotes/bob/stolen.jpg" }), okay)
  assert.equal(okay.statusCode, 200)
  assert.ok(Buffer.isBuffer(okay.body)); assert.equal(okay.body[0], 255); assert.equal(okay.body[1], 216)
  assert.equal(okay.headers["Content-Type"], "image/jpeg")
  assert.match(okay.headers["Cache-Control"], /private, no-store/)
  assert.equal(okay.headers.Vary, "Authorization")
  assert.equal(okay.headers["X-Content-Type-Options"], "nosniff")
  const traversed = response()
  await f.businessNotePhotos(request("GET", { noteId: "../bob", photoId: "photo_1" }), traversed)
  assert.equal(traversed.statusCode, 400)
})
