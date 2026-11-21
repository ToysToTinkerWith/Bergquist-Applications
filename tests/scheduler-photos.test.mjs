import test from "node:test"
import assert from "node:assert/strict"
import { eventIsValid } from "../lib/componentDemos.js"
import {
  MAX_PHOTO_BYTES, MAX_PHOTOS, MAX_CAPTION_LENGTH, MAX_DEMO_STORAGE_LENGTH,
  validatePhotoSelection, validatePhotoFiles, demoPhotosAreValid, serializeDemoEvents,
  isEventPhotoPath, persistEventPhotos, makeDemoPhoto,
} from "../lib/schedulerPhotos.mjs"

const photo = { id: "photo-1", url: "data:image/jpeg;base64,/9j/AA==", message: "Finished work", fileName: "work.jpg" }
const event = { id: "legacy", title: "Legacy event", category: "Meeting", notes: "", allDay: false, start: "2026-09-27T09:00", end: "2026-09-27T10:00" }
const pending = id => ({ id, message: "Caption", file: { type: "image/png", size: 100 } })

test("existing saved events without photos remain valid", () => {
  assert.equal(eventIsValid(event), true)
  assert.equal(demoPhotosAreValid(event.images), true)
  assert.deepEqual(JSON.parse(serializeDemoEvents([event])), [event])
})

test("valid photos and captions survive serialization", () => {
  const value = [{ ...event, images: [{ ...photo, message: "<script>literal text</script> & caption" }] }]
  assert.deepEqual(JSON.parse(serializeDemoEvents(value)), value)
})

test("file selection enforces MIME type, nonempty size, 5 MB and eight-photo limits", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) validatePhotoSelection([{ type, size: MAX_PHOTO_BYTES }], MAX_PHOTOS - 1)
  for (const type of ["image/svg+xml", "text/html", "image/gif", "", "toString"]) assert.throws(() => validatePhotoSelection([{ type, size: 10 }]), /JPEG/)
  for (const size of [0, -1, NaN, Infinity, MAX_PHOTO_BYTES + 1]) assert.throws(() => validatePhotoSelection([{ type: "image/png", size }]), /5 MB/)
  assert.throws(() => validatePhotoSelection([pending("1").file], MAX_PHOTOS), /8 photos/)
  assert.throws(() => validatePhotoSelection([pending("1").file, { type: "text/plain", size: 5 }]), /JPEG/)
})

test("file signatures must match JPEG, PNG or WebP MIME types", async () => {
  const files = [
    new File([Uint8Array.from([255, 216, 255, 0])], "a.jpg", { type: "image/jpeg" }),
    new File([Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])], "b.png", { type: "image/png" }),
    new File(["RIFF1234WEBP"], "c.webp", { type: "image/webp" }),
  ]
  await validatePhotoFiles(files)
  await assert.rejects(validatePhotoFiles([new File(["<svg/>"], "fake.png", { type: "image/png" })]), /not a valid/)
})

test("persisted demo photos reject unsafe URLs, malformed metadata and duplicate IDs", () => {
  assert.equal(demoPhotosAreValid([photo]), true)
  for (const url of ["javascript:alert(1)", "https://untrusted.example/photo", "blob:expired", "data:image/svg+xml;base64,PHN2Zy8+"]) assert.equal(demoPhotosAreValid([{ ...photo, url }]), false)
  assert.equal(demoPhotosAreValid([{ ...photo, message: "x".repeat(MAX_CAPTION_LENGTH + 1) }]), false)
  assert.equal(demoPhotosAreValid([photo, photo]), false)
  assert.equal(demoPhotosAreValid([null]), false)
  assert.equal(demoPhotosAreValid({}), false)
})

test("demo storage budget fails before replacing persisted events", () => {
  assert.throws(() => serializeDemoEvents([{ ...event, notes: "x".repeat(MAX_DEMO_STORAGE_LENGTH) }]), /storage is full/)
  assert.throws(() => serializeDemoEvents([{ ...event, images: [{ ...photo, url: "blob:expired" }] }]), /invalid/)
})

test("storage deletion is restricted to direct children of this event", () => {
  assert.equal(isEventPhotoPath("scheduleEvents/event-1/photo_1.jpg", "event-1"), true)
  for (const path of ["scheduleEvents/event-2/photo.jpg", "scheduleEvents/event-1/../other.jpg", "scheduleEvents/event-1/nested/file.jpg", "users/private.jpg", "https://bucket/file.jpg", "scheduleEvents/event-1/"]) assert.equal(isEventPhotoPath(path, "event-1"), false)
})

test("successful saves commit all photos and captions before removing old objects", async () => {
  const calls = []
  await persistEventPhotos({
    existingImages: [photo], newImages: [pending("new")], removedImages: [{ id: "old" }],
    upload: async image => { calls.push("upload"); return { ...photo, id: image.id, message: image.message } },
    commit: async images => { calls.push("commit"); assert.deepEqual(images.map(image => image.message), ["Finished work", "Caption"]) },
    remove: async image => { calls.push("remove:" + image.id) },
  })
  assert.deepEqual(calls, ["upload", "commit", "remove:old"])
})

test("partial upload failure rolls back new uploads without touching saved photos", async () => {
  const removed = []
  let committed = false
  await assert.rejects(persistEventPhotos({
    existingImages: [photo], newImages: [pending("new-1"), pending("new-2")], removedImages: [{ id: "old" }],
    upload: async image => { if (image.id === "new-2") throw new Error("Upload failed"); return { id: image.id } },
    commit: async () => { committed = true },
    remove: async image => { removed.push(image.id) },
  }), /Upload failed/)
  assert.equal(committed, false)
  assert.deepEqual(removed, ["new-1"])
})

test("database failure rolls back uploads and preserves existing objects", async () => {
  const removed = []
  await assert.rejects(persistEventPhotos({
    existingImages: [photo], newImages: [pending("new")], removedImages: [{ id: "old" }],
    upload: async image => ({ id: image.id }),
    commit: async () => { throw new Error("Permission denied") },
    remove: async image => { removed.push(image.id) },
  }), /Permission denied/)
  assert.deepEqual(removed, ["new"])
})

test("cleanup failure after commit does not turn a saved event into a failed save", async () => {
  let committed = false
  await persistEventPhotos({
    removedImages: [photo],
    upload: async () => assert.fail("No upload expected"),
    commit: async () => { committed = true },
    remove: async () => { throw new Error("Cleanup unavailable") },
  })
  assert.equal(committed, true)
})

test("caption and count validation occurs before uploading or committing", async () => {
  await assert.rejects(persistEventPhotos({
    newImages: [{ ...pending("new"), message: "x".repeat(MAX_CAPTION_LENGTH + 1) }],
    upload: async () => assert.fail("Unexpected upload"),
    commit: async () => assert.fail("Unexpected write"),
    remove: async () => {},
  }), /Captions/)
})

test("failed image decoding always releases its object URL", async () => {
  const OriginalImage = globalThis.Image
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL
  const revoked = []
  globalThis.Image = class { async decode() { throw new Error("Bad image") } }
  URL.createObjectURL = () => "blob:pending-photo"
  URL.revokeObjectURL = url => revoked.push(url)
  try {
    await assert.rejects(makeDemoPhoto({}), /Bad image/)
    assert.deepEqual(revoked, ["blob:pending-photo"])
  } finally {
    globalThis.Image = OriginalImage
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
  }
})
