const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { pathToFileURL } = require("node:url")

async function fixture() {
  const { BusinessLocationError } = await import(pathToFileURL(path.join(__dirname, "../lib/businessLocation.mjs")).href)
  const state = { calls: 0 }
  let source = fs.readFileSync(path.join(__dirname, "../pages/api/business-location.js"), "utf8").replace(/^import .*$/gm, "").replace(/export const /g, "const ").replace(/export default async function /g, "async function ")
  source += "\nmodule.exports=businessLocation"
  const sandbox = { module: { exports: {} }, BusinessLocationError,
    requireBusinessNotesAccess: async req => { if (req.headers?.authorization === "Bearer approved") return { uid: "owner" }; throw Object.assign(new Error("Access denied"), { statusCode: req.headers?.authorization ? 403 : 401 }) },
    sendBusinessNotesAccessError: (res, error) => { res.status(error.statusCode).json({ allowed: false, error: "Access denied" }); return true },
    lookupBusinessLocation: async input => { state.calls++; state.input = input; if (state.error) throw state.error; return { location: { label: "Freeland, WA", lat: 48, lng: -122 }, weather: { mode: "current", tempC: 10 } } },
  }
  vm.runInNewContext(source, sandbox)
  return { handler: sandbox.module.exports, state, BusinessLocationError }
}
const response = () => ({ headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v }, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } })

test("location/weather API authorizes approved bearer before any Google call", async () => {
  const { handler, state } = await fixture()
  for (const authorization of [undefined, "Bearer unapproved"]) {
    const res = response()
    await handler({ method: "POST", headers: { authorization }, body: { location: "Freeland" } }, res)
    assert.equal(res.statusCode, authorization ? 403 : 401)
  }
  assert.equal(state.calls, 0)
  const res = response()
  await handler({ method: "POST", headers: { authorization: "Bearer approved" }, body: { location: "Freeland", date: "2026-11-11", timeZone: "America/Los_Angeles" } }, res)
  assert.equal(state.calls, 1); assert.equal(res.statusCode, 200)
  assert.equal(state.input.location, "Freeland")
  assert.equal(res.headers["Cache-Control"], "private, no-store")
})

test("upstream API failures expose clean errors without raw URLs or keys", async () => {
  const { handler, state, BusinessLocationError } = await fixture()
  state.error = new BusinessLocationError("google_permission_denied", "Google weather is unavailable.")
  const res = response()
  await handler({ method: "GET", headers: { authorization: "Bearer approved" }, query: { location: "Freeland" } }, res)
  assert.equal(res.statusCode, 503)
  assert.equal(res.body.code, "google_permission_denied")
  assert.deepEqual(Object.keys(res.body).sort(), ["code", "error"])
})
