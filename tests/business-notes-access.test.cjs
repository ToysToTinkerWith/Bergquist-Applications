const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")

function fixture(env = {}) {
  const source = fs.readFileSync(path.join(__dirname, "../lib/businessNotesAccess.js"), "utf8").replace(/^import .*$/gm, "").replace(/export (async function|function) /g, "$1 ") + "\nmodule.exports={businessNotesAccessDecision,requireBusinessNotesAccess,sendBusinessNotesAccessError}"
  const state = { user: { uid: "owner", email: "owner@example.test", email_verified: true, firebase: { sign_in_provider: "google.com" } } }
  const sandbox = { module: { exports: {} }, process: { env }, getAdminAuth: () => ({ verifyIdToken: async () => { if (state.error) throw state.error; return state.user } }) }
  vm.runInNewContext(source, sandbox)
  return { ...sandbox.module.exports, state }
}
const request = token => ({ method: "GET", headers: token ? { authorization: `Bearer ${token}` } : {} })

test("workspace access fails closed without server configuration and never leaks identities", async () => {
  const access = fixture()
  await assert.rejects(access.requireBusinessNotesAccess(request()), error => error.statusCode === 401)
  await assert.rejects(access.requireBusinessNotesAccess(request("signed-in")), error => error.code === "business_notes_unconfigured" && error.statusCode === 503)
  let result
  access.sendBusinessNotesAccessError({ status: status => ({ json: body => { result = { status, body } } }) }, { code: "business_notes_forbidden" })
  assert.equal(result.status, 403)
  assert.deepEqual(Object.keys(result.body).sort(), ["allowed", "code", "error"])
  assert.doesNotMatch(JSON.stringify(result), /owner@example|owner"/)
})

test("only approved verified Google email or approved Google UID is allowed", async () => {
  const access = fixture({ BUSINESS_NOTES_ALLOWED_EMAILS: " OWNER@EXAMPLE.TEST , second@example.test" })
  assert.equal((await access.requireBusinessNotesAccess(request("signed-in"))).uid, "owner")
  access.state.user.email_verified = false
  await assert.rejects(access.requireBusinessNotesAccess(request("signed-in")), error => error.statusCode === 403)
  access.state.user.email_verified = true; access.state.user.firebase.sign_in_provider = "password"
  await assert.rejects(access.requireBusinessNotesAccess(request("signed-in")), error => error.statusCode === 403)
  access.state.user.firebase.sign_in_provider = "anonymous"
  await assert.rejects(access.requireBusinessNotesAccess(request("signed-in")), error => error.statusCode === 403)
  access.state.user.firebase.sign_in_provider = "google.com"; access.state.user.email = "unapproved@example.test"
  await assert.rejects(access.requireBusinessNotesAccess(request("signed-in")), error => error.statusCode === 403)
  const byUid = fixture({ BUSINESS_NOTES_ALLOWED_UIDS: "other, owner" })
  assert.equal((await byUid.requireBusinessNotesAccess(request("signed-in"))).uid, "owner")
})

test("expired tokens are distinct from unavailable verification and malformed bearer cannot fall back", async () => {
  const access = fixture({ BUSINESS_NOTES_ALLOWED_UIDS: "owner" })
  access.state.error = { code: "auth/id-token-expired" }
  await assert.rejects(access.requireBusinessNotesAccess(request("expired")), error => error.statusCode === 401)
  access.state.error = new Error("Private internal configuration details")
  await assert.rejects(access.requireBusinessNotesAccess(request("signed-in")), error => error.statusCode === 503 && !error.message.includes("Private"))
  await assert.rejects(access.requireBusinessNotesAccess({ method: "POST", headers: { authorization: "invalid" }, body: { idToken: "valid" } }), error => error.statusCode === 401)
})
