const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const path = require("node:path")
const babel = require("next/dist/compiled/babel/core")
const photos = require("../lib/schedulerPhotos.mjs")
const filename = path.resolve(__dirname, "../lib/schedulerPhotoStorage.js")
const { code } = babel.transformSync(fs.readFileSync(filename, "utf8"), {
  filename, babelrc: false, configFile: false,
  presets: [[require.resolve("next/babel"), { "preset-env": { modules: "commonjs", targets: { node: "current" } } }]],
})

function harness({ failURL = false, failWrite = false, failCreate = false, failUploadAt = 0, failDelete = false, requireOwnerDocument = false } = {}) {
  const calls = []
  const documents = new Map([["existing", { title: "Original event" }]])
  let uploadCount = 0, photoCount = 0
  const firestore = {
    collection: () => ({}),
    doc: (...args) => ({ id: args.length === 1 ? "allocated-event" : args[2] }),
    Timestamp: { now: () => "timestamp" },
    setDoc: async (ref, payload) => { calls.push(["create", ref.id, payload]); if (failCreate) throw new Error("Create denied"); documents.set(ref.id, payload) },
    updateDoc: async (ref, payload) => { calls.push(["update", ref.id, payload]); if (failWrite) throw new Error("Write denied"); documents.set(ref.id, { ...documents.get(ref.id), ...payload }) },
    deleteDoc: async ref => { calls.push(["delete-event", ref.id]); if (failDelete) throw new Error("Delete denied"); documents.delete(ref.id) },
  }
  const storage = {
    ref: (_, objectPath) => objectPath,
    uploadBytes: async (ref, file, metadata) => {
      calls.push(["upload", ref, metadata])
      if (requireOwnerDocument) assert.equal(documents.get(ref.split("/")[1])?.ownerUid, "existing-owner")
      if (++uploadCount === failUploadAt) throw new Error("Upload failed")
    },
    getDownloadURL: async ref => { calls.push(["url", ref]); if (failURL) throw new Error("URL unavailable"); return "https://example.com/photo" },
    deleteObject: async ref => {
      calls.push(["delete-photo", ref])
      if (requireOwnerDocument) assert.equal(documents.get(ref.split("/")[1])?.ownerUid, "existing-owner")
    },
  }
  const exports = {}
  const requireMock = name => {
    if (name.startsWith("@babel/runtime/")) return require(name)
    if (name === "firebase/firestore") return firestore
    if (name === "firebase/storage") return storage
    if (name === "../Firebase/FirebaseInit") return { db: {}, storage: {} }
    if (name === "./schedulerPhotos.mjs") return photos
    throw new Error("Unexpected module: " + name)
  }
  vm.runInNewContext(code, { exports, require: requireMock, crypto: { randomUUID: () => ++photoCount === 1 ? "unique-photo" : "unique-photo-" + photoCount } }, { filename })
  return { ...exports, calls, documents }
}

const newPhoto = () => ({
  message: "Event caption",
  file: new File([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], "photo.png", { type: "image/png" }),
})

test("Firebase validates before creating the owner document, then uploads and updates photos", async () => {
  for (const image of [
    { ...newPhoto(), message: "x".repeat(photos.MAX_CAPTION_LENGTH + 1) },
    { ...newPhoto(), file: new File(["fake"], "fake.png", { type: "image/png" }) },
    { ...newPhoto(), file: new File(["<svg/>"], "image.svg", { type: "image/svg+xml" }) },
    { ...newPhoto(), file: { type: "image/png", size: photos.MAX_PHOTO_BYTES + 1 } },
  ]) {
    const invalid = harness()
    await assert.rejects(invalid.saveSchedulerEvent({ payload: {}, newImages: [image] }))
    assert.deepEqual(invalid.calls, [])
  }
  const tooMany = harness()
  await assert.rejects(tooMany.saveSchedulerEvent({ payload: {}, newImages: Array.from({ length: 9 }, newPhoto) }), /8 photos/)
  assert.deepEqual(tooMany.calls, [])
  const denied = harness({ failCreate: true })
  await assert.rejects(denied.saveSchedulerEvent({ payload: {}, newImages: [newPhoto()] }), /Create denied/)
  assert.deepEqual(denied.calls.map(call => call[0]), ["create"])

  const api = harness({ requireOwnerDocument: true })
  const id = await api.saveSchedulerEvent({ payload: { ownerUid: "existing-owner", title: "Event" }, newImages: [newPhoto()] })
  assert.equal(id, "allocated-event")
  assert.deepEqual(api.calls.map(call => call[0]), ["create", "upload", "url", "update"])
  assert.equal(api.calls[0][2].ownerUid, "existing-owner")
  assert.equal(api.calls[0][2].images.length, 0)
  assert.equal(api.calls[3][2].images[0].message, "Event caption")
  assert.equal(api.calls[3][2].images[0].path, "scheduleEvents/allocated-event/unique-photo.png")
  assert.equal(api.documents.get(id).ownerUid, "existing-owner")
  const withoutPhotos = harness()
  await withoutPhotos.saveSchedulerEvent({ payload: { title: "No photos" } })
  assert.deepEqual(withoutPhotos.calls.map(call => call[0]), ["create"])
})

test("new-event failures clean uploaded files while the document exists, then roll back the document", async () => {
  for (const [failure, expected] of [
    [{ failURL: true }, ["create", "upload", "url", "delete-photo", "delete-event"]],
    [{ failUploadAt: 2 }, ["create", "upload", "url", "upload", "delete-photo", "delete-photo", "delete-event"]],
    [{ failWrite: true }, ["create", "upload", "url", "upload", "url", "update", "delete-photo", "delete-photo", "delete-event"]],
  ]) {
    const api = harness({ ...failure, requireOwnerDocument: true })
    await assert.rejects(api.saveSchedulerEvent({ payload: { ownerUid: "existing-owner" }, newImages: [newPhoto(), newPhoto()] }))
    assert.deepEqual(api.calls.map(call => call[0]), expected)
    assert.equal(api.documents.has("allocated-event"), false)
  }
  const rollbackDenied = harness({ failWrite: true, failDelete: true, requireOwnerDocument: true })
  await assert.rejects(rollbackDenied.saveSchedulerEvent({ payload: { ownerUid: "existing-owner" }, newImages: [newPhoto()] }), /new event could not be removed/)
  assert.deepEqual(rollbackDenied.calls.map(call => call[0]), ["create", "upload", "url", "update", "delete-photo", "delete-event"])
})

test("write failure removes new objects while preserving removed existing photos", async () => {
  const api = harness({ failWrite: true })
  await assert.rejects(api.saveSchedulerEvent({ eventId: "existing", payload: {}, newImages: [newPhoto()], removedImages: [{ path: "scheduleEvents/existing/old.jpg" }] }), /Write denied/)
  assert.deepEqual(api.calls.map(call => call[0]), ["upload", "url", "update", "delete-photo"])
  assert.equal(api.calls[3][1], "scheduleEvents/existing/unique-photo.png")
  assert.deepEqual(api.documents.get("existing"), { title: "Original event" })
})

test("event deletion succeeds before removing photos and ignores another event's paths", async () => {
  const api = harness()
  await api.deleteSchedulerEvent("existing", [{ path: "scheduleEvents/existing/old.jpg" }, { path: "scheduleEvents/other/private.jpg" }])
  assert.deepEqual(api.calls, [["delete-event", "existing"], ["delete-photo", "scheduleEvents/existing/old.jpg"]])
})

test("denied event deletion leaves photos intact", async () => {
  const api = harness({ failDelete: true })
  await assert.rejects(api.deleteSchedulerEvent("existing", [{ path: "scheduleEvents/existing/old.jpg" }]), /Delete denied/)
  assert.deepEqual(api.calls, [["delete-event", "existing"]])
})
