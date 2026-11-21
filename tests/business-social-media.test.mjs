import test from "node:test"
import assert from "node:assert/strict"
import { containRect, isExampleSource, mediaPair, videoScene } from "../components/business-notes/socialMediaCanvas.mjs"
import { labelShowcase, SHOWCASE_NOTE } from "../components/business-notes/photoShowcase.mjs"

test("portrait and landscape original photos fit without cropping or distortion", () => {
  assert.deepEqual(containRect(1500, 1000, 0, 0, 600, 600), { x: 0, y: 100, width: 600, height: 400 })
  assert.deepEqual(containRect(1000, 1500, 10, 20, 600, 600), { x: 110, y: 20, width: 400, height: 600 })
  assert.throws(() => containRect(0, 100, 0, 0, 600, 600))
})
test("before/after roles use actual selected source records and cannot duplicate or invent a photo", () => {
  const photos = [{ id: "after", name: "original-after.jpg" }, { id: "before", name: "original-before.jpg" }]
  assert.deepEqual(mediaPair(photos, "before", "after"), [photos[1], photos[0]])
  assert.throws(() => mediaPair(photos, "before", "before"))
  assert.throws(() => mediaPair(photos, "missing", "after"))
})
test("synthetic showcase remains labeled from source note or source filename; real photos are distinct", () => {
  assert.equal(isExampleSource({ text: SHOWCASE_NOTE }), true)
  assert.equal(isExampleSource({ text: "", photos: [{ name: "example-before-ai-generated.png" }] }), true)
  assert.equal(isExampleSource({ text: "Real deck job", photos: [{ name: "before.jpg" }] }), false)
  const note = { text: SHOWCASE_NOTE, title: "Deck refresh", items: [{ title: "Deck refresh job" }, { title: "EXAMPLE — Social draft" }] }
  assert.deepEqual(labelShowcase(labelShowcase(note)), labelShowcase(note))
  assert.ok(labelShowcase(note).items.every(item => item.title.startsWith("EXAMPLE — ")))
})
test("the compilation contains the original before/after, comparison, and closing sections", () => {
  assert.deepEqual([0, 2.9, 3, 6.9, 7, 9.9, 10, 12].map(videoScene), ["before", "before", "after", "after", "comparison", "comparison", "closing", "closing"])
})
