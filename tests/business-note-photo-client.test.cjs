const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { File } = require("node:buffer")

function client(fetch) {
  let source = fs.readFileSync(path.resolve(__dirname, "../components/business-notes/notePhotoClient.js"), "utf8")
  source = source.replace(/export (async function|function|const) /g, "$1 ")
  source += "\nmodule.exports={prepareNotePhoto,fetchNotePhotoBlob,materializeNotePhotos}"
  class FileReader {
    readAsDataURL(blob) { blob.arrayBuffer().then(value => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString("base64")}`; this.onload?.() }, () => this.onerror?.()) }
  }
  const sandbox = {
    module: { exports: {} }, fetch, FileReader, DOMException, AbortController, Uint8Array, URL,
    setTimeout: (fn, ms) => ms < 3000 ? setTimeout(fn, 0) : setTimeout(fn, ms), clearTimeout,
  }
  vm.runInNewContext(source, sandbox, { filename: "notePhotoClient.js" })
  return sandbox.module.exports
}
const photo = { id: "photo_1", name: "Job.jpg", caption: "Entry door", description: "Before the repair", contentType: "image/jpeg", width: 100, height: 80, size: 4 }
const jpeg = new Blob([Uint8Array.from([255, 216, 255, 217])], { type: "image/jpeg" })
const okay = blob => ({ ok: true, status: 200, headers: { get: () => "image/jpeg" }, blob: async () => blob })

test("saved photo reads use Bearer headers, bounded save-race retry, and no token URLs", async () => {
  const calls = [], user = { getIdToken: async () => "private-test-token" }
  const c = client(async (url, options) => { calls.push([url, options]); return calls.length < 3 ? { ok: false, status: 404 } : okay(jpeg) })
  const blob = await c.fetchNotePhotoBlob(photo, { noteId: "note_1", user })
  assert.equal(blob.size, 4); assert.equal(calls.length, 3)
  for (const [url, options] of calls) {
    assert.equal(url, "/api/business-note-photos?noteId=note_1&photoId=photo_1")
    assert.equal(url.includes("token"), false)
    assert.equal(options.headers.Authorization, "Bearer private-test-token")
    assert.equal(options.cache, "no-store")
  }
  const deniedCalls = []
  const denied = client(async (...args) => { deniedCalls.push(args); return { ok: false, status: 403, json: async () => ({ error: "Not approved" }) } })
  await assert.rejects(denied.fetchNotePhotoBlob(photo, { noteId: "note_1", user }), /Not approved/)
  assert.equal(deniedCalls.length, 1, "does not retry an authorization failure")
})

test("materialization preserves selected photo context without fetching draft or external URLs", async () => {
  let tokens = 0
  const calls = [], c = client(async (url, options) => { calls.push([url, options]); return okay(jpeg) })
  const draft = { ...photo, id: "draft_2", dataUrl: "data:image/jpeg;base64,/9j/2Q==" }
  const materialized = await c.materializeNotePhotos([photo, draft], { noteId: "note_1", user: { getIdToken: async () => { tokens++; return "token" } } })
  assert.equal(tokens, 1); assert.equal(calls.length, 1)
  assert.equal(materialized[0].dataUrl, "data:image/jpeg;base64,/9j/2Q==")
  assert.equal(materialized[0].description, "Before the repair")
  assert.equal(materialized[0].caption, "Entry door")
  assert.equal(materialized[1].dataUrl, draft.dataUrl)
  await assert.rejects(c.materializeNotePhotos([{ ...draft, dataUrl: "https://example.test/untrusted.jpg" }]), /invalid image/)
  assert.equal(calls.length, 1)
})

test("private photo loading aborts and traversal is rejected before requesting a token", async () => {
  let tokenCalls = 0, fetchCalls = 0
  const c = client((url, options) => { fetchCalls++; return new Promise((resolve, reject) => options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })) })
  const user = { getIdToken: async () => { tokenCalls++; return "token" } }
  await assert.rejects(c.fetchNotePhotoBlob(photo, { noteId: "../other", user }), /valid saved note/)
  assert.equal(tokenCalls, 0); assert.equal(fetchCalls, 0)
  const controller = new AbortController()
  const pending = c.fetchNotePhotoBlob(photo, { noteId: "note_1", user, signal: controller.signal })
  await new Promise(resolve => setImmediate(resolve))
  controller.abort()
  await assert.rejects(pending, error => error.name === "AbortError")
  assert.equal(fetchCalls, 1)
})

test("camera/upload validation rejects unsupported or spoofed files before browser image decoding", async () => {
  const c = client(() => { throw new Error("No request should happen") })
  await assert.rejects(c.prepareNotePhoto(new File(["<svg/>"], "image.svg", { type: "image/svg+xml" })), /JPEG, PNG, or WebP/)
  await assert.rejects(c.prepareNotePhoto(new File(["<svg/>"], "image.jpg", { type: "image/jpeg" })), /not a valid/)
  await assert.rejects(c.prepareNotePhoto(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" })), /under 10 MB/)
})
