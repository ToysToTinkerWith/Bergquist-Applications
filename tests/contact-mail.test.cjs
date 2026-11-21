const test = require("node:test")
const assert = require("node:assert/strict")
const fs = require("node:fs")
const vm = require("node:vm")
const path = require("node:path")
const { Readable } = require("node:stream")
const babel = require("next/dist/compiled/babel/core")

const EMAIL = "abergquist96@gmail.com"
const valid = { name: "Visitor Name", email: "visitor@example.com", company: "Example Co", project: "A new website", message: "First line\nSecond line" }
const configured = { NODE_ENV: "production", CONTACT_SMTP_HOST: "smtp.example.com", CONTACT_SMTP_USER: "sender@example.com", CONTACT_SMTP_PASSWORD: "private-password" }
const compiled = new Map()

function harness(options = {}) {
  const env = { ...configured, ...options.env }
  const calls = { messages: [], transports: [], firestore: 0, logs: [], resend: [] }
  const store = options.store || { documents: new Map(), queue: Promise.resolve() }
  let now = Date.UTC(2026, 8, 27, 12)
  class Clock extends Date { static now() { return now } }
  const modules = new Map()
  const db = {
    collection(name) {
      assert.equal(name, "contactMailRateLimits")
      return { doc: id => `${name}/${id}` }
    },
    runTransaction(callback) {
      const result = store.queue.then(async () => {
        if (options.firestoreFails) throw new Error("private database error")
        const writes = []
        const value = await callback({
          get: async ref => {
            assert.equal(writes.length, 0, "all reads must precede writes")
            return { exists: store.documents.has(ref), data: () => store.documents.get(ref) }
          },
          set: (ref, value) => writes.push([ref, value]),
        })
        writes.forEach(([ref, value]) => store.documents.set(ref, value))
        return value
      })
      store.queue = result.catch(() => {})
      return result
    },
  }
  function load(relative) {
    const filename = path.resolve(__dirname, "..", relative)
    if (modules.has(filename)) return modules.get(filename)
    if (!compiled.has(filename)) {
      compiled.set(filename, babel.transformSync(fs.readFileSync(filename, "utf8"), {
        filename, babelrc: false, configFile: false,
        presets: [[require.resolve("next/babel"), { "preset-env": { modules: "commonjs", targets: { node: "current" } } }]],
      }).code)
    }
    const exports = {}
    modules.set(filename, exports)
    const requireMock = name => {
      if (name === "nodemailer") return {
        createTransport(config) {
          calls.transports.push(config)
          return { sendMail: async message => {
            calls.messages.push(message)
            if (options.smtpFails) throw new Error("private-password and private message content")
            return options.smtpResult === undefined ? { accepted: [EMAIL] } : options.smtpResult
          } }
        },
      }
      if (name.endsWith("/firebaseAdmin")) return { getFirestore: () => { calls.firestore++; return db } }
      if (name.startsWith(".")) return load(path.relative(path.resolve(__dirname, ".."), path.resolve(path.dirname(filename), name + ".js")))
      if (["crypto", "net", "raw-body"].includes(name) || name.startsWith("@babel/runtime/")) return require(name)
      throw new Error("Unexpected import: " + name)
    }
    vm.runInNewContext(compiled.get(filename), {
      exports, require: requireMock, process: { env }, Buffer, URL, Date: Clock, AbortSignal,
      fetch: async (url, options_) => {
        calls.resend.push({ url, ...options_, payload: JSON.parse(options_.body) })
        if (options.resendFails) throw new Error("private-resend-key provider error")
        return { ok: options.resendOk !== false, json: async () => options.resendResult === undefined ? { id: "email-id" } : options.resendResult }
      },
      ...(options.browser ? { window: {} } : {}),
      console: { log: (...args) => calls.logs.push(args), error: (...args) => calls.logs.push(args), warn: (...args) => calls.logs.push(args) },
    }, { filename })
    return exports
  }
  async function request(body = valid, options = {}) {
    const bytes = Buffer.from(options.raw === undefined ? JSON.stringify(body) : options.raw)
    const req = Readable.from([bytes])
    req.method = options.method || "POST"
    req.headers = { origin: "https://bergquistapplications.com", "content-type": "application/json", ...options.headers }
    req.ip = Object.hasOwn(options, "ip") ? options.ip : "8.8.8.8"
    req.socket = { remoteAddress: "10.0.0.1" }
    if (options.firebase) req.rawBody = bytes
    const res = {
      statusCode: 200, headers: {},
      setHeader(name, value) { this.headers[name] = value },
      status(code) { this.statusCode = code; return this },
      json(value) { this.body = JSON.parse(JSON.stringify(value)); return this },
    }
    await load("pages/api/contact.js").default(req, res)
    assert.equal(res.headers["Cache-Control"], "no-store")
    if (res.statusCode !== 200) {
      assert.deepEqual(Object.keys(res.body).sort(), ["code", "error"])
      assert.equal(typeof res.body.error, "string")
      assert.ok(!res.body.error.includes("not_sent:"))
      assert.equal(res.body.code, res.statusCode === 502 ? "delivery_unconfirmed" : "not_sent")
    }
    return res
  }
  return { load, request, calls, store, env, advance: ms => { now += ms } }
}

test("config is lazy, server-only, nullable, and requires safe SMTP settings", () => {
  const h = harness()
  const mail = h.load("lib/contactMail.js")
  assert.equal(mail.isContactMailConfigured(), true)
  assert.equal(mail.getContactMailConfig().from, "sender@example.com")
  assert.equal(h.calls.firestore, 0)
  assert.equal(h.calls.transports.length, 0)
  for (const env of [
    { CONTACT_SMTP_HOST: "" }, { CONTACT_SMTP_USER: "" }, { CONTACT_SMTP_PASSWORD: "" },
    { CONTACT_SMTP_PORT: "25" }, { CONTACT_SMTP_PORT: "465junk" },
    { CONTACT_SMTP_FROM: "visitor@example.com\r\nBcc: attacker@example.com" },
    { CONTACT_SMTP_HOST: "smtp://host.example" }, { CONTACT_SMTP_USER: "sender\nsecret" },
  ]) {
    const module = harness({ env }).load("lib/contactMail.js")
    assert.equal(module.getContactMailConfig(), null)
    assert.equal(module.isContactMailConfigured(), false)
  }
  assert.throws(() => harness({ browser: true }).load("lib/contactMail.js"), /server-only/)
})

const resendEnv = { RESEND_API_KEY: "re_private-test-key", RESEND_FROM_EMAIL: "Bergquist Applications <hello@bergquistapplications.com>" }

test("Resend supports a named verified sender and takes precedence over SMTP", async () => {
  const h = harness({ env: resendEnv })
  assert.equal(h.load("lib/contactMail.js").isContactMailConfigured(), true)
  assert.equal((await h.request({ ...valid, to: "attacker@example.com", from: "attacker@example.com" }, { firebase: true })).statusCode, 200)
  assert.equal(h.calls.transports.length, 0)
  const request = h.calls.resend[0]
  assert.equal(request.url, "https://api.resend.com/emails")
  assert.equal(request.method, "POST")
  assert.equal(request.redirect, "error")
  assert.equal(request.headers.Authorization, `Bearer ${resendEnv.RESEND_API_KEY}`)
  assert.match(request.headers["Idempotency-Key"], /^contact-[a-f0-9-]{36}$/)
  assert.ok(request.signal instanceof AbortSignal)
  assert.deepEqual(request.payload.to, [EMAIL])
  assert.equal(request.payload.from, resendEnv.RESEND_FROM_EMAIL)
  assert.equal(request.payload.reply_to, valid.email)
  for (const value of Object.values(valid)) assert.ok(request.payload.text.includes(value))
  assert.equal(request.payload.html, undefined)
  assert.deepEqual(h.calls.logs, [])
})

test("Resend rejects partial config, malformed addresses, lists and header injection", () => {
  for (const change of [
    { RESEND_API_KEY: "" }, { RESEND_FROM_EMAIL: "" }, { RESEND_API_KEY: "re_bad\r\nheader" },
    { RESEND_FROM_EMAIL: "Bergquist Applications hello@example.com" },
    { RESEND_FROM_EMAIL: "hello@example.com,other@example.com" },
    { RESEND_FROM_EMAIL: "Name\r\nBcc: victim@example.com <hello@example.com>" },
  ]) assert.equal(harness({ env: { ...resendEnv, ...change } }).load("lib/contactMail.js").isContactMailConfigured(), false)
  assert.equal(harness({ env: { ...resendEnv, RESEND_FROM_EMAIL: "hello@example.com" } }).load("lib/contactMail.js").isContactMailConfigured(), true)
})

test("Resend errors, timeouts and missing IDs never claim success or leak provider details", async () => {
  for (const options of [{ resendFails: true }, { resendOk: false, resendResult: { message: "private-resend-key" } }, { resendResult: {} }, { resendResult: { id: "" } }]) {
    const h = harness({ env: resendEnv, ...options })
    const result = await h.request()
    assert.equal(result.statusCode, 502)
    assert.equal(h.calls.resend.length, 1)
    assert.ok(!JSON.stringify(result).includes("private-resend-key"))
    assert.equal(h.calls.transports.length, 0)
  }
})

test("Resend retains validation and durable quota before sending", async () => {
  const h = harness({ env: resendEnv })
  assert.equal((await h.request({ ...valid, website: "spam" })).statusCode, 400)
  assert.equal(h.calls.resend.length, 0)
  for (let i = 0; i < 3; i++) assert.equal((await h.request()).statusCode, 200)
  assert.equal((await h.request()).statusCode, 429)
  assert.equal(h.calls.resend.length, 3)
  const unavailable = harness({ env: resendEnv, firestoreFails: true })
  assert.equal((await unavailable.request()).statusCode, 503)
  assert.equal(unavailable.calls.resend.length, 0)
})

test("fixed recipient, provider from, visitor replyTo, and all form fields reach SMTP", async () => {
  const h = harness({ env: { CONTACT_EMAIL: "attacker@example.com" } })
  const response = await h.request({ ...valid, to: "attacker@example.com", from: "attacker@example.com", bcc: "attacker@example.com" }, { firebase: true })
  assert.deepEqual(response.body, { ok: true })
  assert.equal(response.statusCode, 200)
  const message = h.calls.messages[0]
  assert.equal(message.to, EMAIL)
  assert.deepEqual(Array.from(message.envelope.to), [EMAIL])
  assert.equal(message.from, "sender@example.com")
  assert.equal(message.envelope.from, message.from)
  assert.equal(message.replyTo.address, valid.email)
  assert.equal(message.replyTo.name, valid.name)
  assert.equal(message.bcc, undefined)
  for (const value of Object.values(valid)) assert.ok(message.text.includes(value))
  assert.equal(message.subject, "Project inquiry: A new website")
  const transport = h.calls.transports[0]
  assert.equal(transport.port, 465)
  assert.equal(transport.secure, true)
  assert.equal(transport.requireTLS, true)
  assert.equal(transport.tls.rejectUnauthorized, true)
  for (const key of ["dnsTimeout", "connectionTimeout", "greetingTimeout", "socketTimeout"]) assert.ok(transport[key] > 0 && transport[key] <= 20000)
  for (const key of ["debug", "logger", "transactionLog"]) assert.equal(transport[key], false)
  assert.deepEqual(h.calls.logs, [])
  const persisted = JSON.stringify(Array.from(h.store.documents))
  for (const privateValue of [valid.email, valid.name, valid.company, valid.message, "8.8.8.8"]) assert.ok(!persisted.includes(privateValue))
})

test("587 requires STARTTLS, explicit provider from supports non-email SMTP users", async () => {
  const h = harness({ env: { CONTACT_SMTP_PORT: "587", CONTACT_SMTP_USER: "apikey", CONTACT_SMTP_FROM: "verified@example.com" } })
  assert.equal((await h.request()).statusCode, 200)
  assert.equal(h.calls.transports[0].secure, false)
  assert.equal(h.calls.transports[0].requireTLS, true)
  assert.equal(h.calls.messages[0].from, "verified@example.com")
})

test("missing configuration reports explicit not_sent without any service calls", async () => {
  const h = harness({ env: { CONTACT_SMTP_PASSWORD: "" } })
  const result = await h.request()
  assert.equal(result.statusCode, 503)
  assert.match(result.body.error, /not configured/)
  assert.equal(result.body.code, "not_sent")
  assert.equal(h.calls.firestore, 0)
  assert.equal(h.calls.messages.length, 0)
})

test("validates types, required values, exact projects, field limits, injection and honeypot before quota", async () => {
  const invalid = [null, [], "text", {}, ...["name", "email", "message"].map(key => ({ ...valid, [key]: "  " })),
    ...["name", "email", "company", "message", "project"].flatMap(key => [null, {}, 1].map(value => ({ ...valid, [key]: value }))),
    ...Object.entries({ name: 100, email: 200, company: 120, message: 1200 }).map(([key, max]) => ({ ...valid, [key]: "x".repeat(max + 1) })),
    ...["name", "email", "company"].map(key => ({ ...valid, [key]: "visitor@example.com\r\nBcc: attacker@example.com" })),
    ...["unknown", "a new website", "A new website "].map(project => ({ ...valid, project })),
    ...["a@", "a@example.com,attacker@example.com", "Name <a@example.com>", ".a@example.com", "a..b@example.com"].map(email => ({ ...valid, email })),
    { ...valid, website: "spam" }, { ...valid, website: null }, { ...valid, message: "bad\x00body" },
  ]
  for (const body of invalid) {
    const h = harness()
    assert.equal((await h.request(body)).statusCode, 400, JSON.stringify(body))
    assert.equal(h.calls.firestore, 0)
    assert.equal(h.calls.messages.length, 0)
  }
  const h = harness()
  const submission = h.load("lib/contactSubmission.js")
  assert.deepEqual(Array.from(submission.projectTypes), ["A new website", "An application", "Web components", "An existing website", "Let's explore"])
  for (const project of submission.projectTypes) {
    assert.equal(submission.validateContactSubmission({ ...valid, project, website: "", company: undefined }).error, undefined)
  }
  const email = "v".repeat(60) + "@" + "d".repeat(60) + "." + "e".repeat(60) + "." + "f".repeat(17)
  assert.equal(email.length, 200)
  assert.equal((await h.request({ ...valid, name: "n".repeat(100), email, company: "c".repeat(120), message: "m".repeat(1200) })).statusCode, 200)
})

test("method, strict origins and JSON gates reject before SMTP or Firestore", async () => {
  for (const method of ["GET", "PUT", "OPTIONS", "DELETE"]) {
    const h = harness()
    const result = await h.request(valid, { method })
    assert.equal(result.statusCode, 405)
    assert.equal(result.headers.Allow, "POST")
    assert.equal(h.calls.firestore, 0)
  }
  for (const origin of [undefined, "null", "https://evil.example", "https://bergquistapplications.com.evil.example", "http://bergquistapplications.com", "https://bergquistapplications.com/", "http://localhost:3000"]) {
    const h = harness()
    assert.equal((await h.request(valid, { headers: { origin, host: "bergquistapplications.com" } })).statusCode, 403)
    assert.equal(h.calls.firestore, 0)
  }
  for (const origin of ["https://bergquistapplications.com", "https://www.bergquistapplications.com", "https://cleaning-7852d.web.app", "https://cleaning-7852d.firebaseapp.com"]) {
    assert.equal((await harness().request(valid, { headers: { origin } })).statusCode, 200)
  }
  for (const origin of ["http://localhost:3000", "http://127.0.0.1:3001", "http://[::1]:3000"]) {
    assert.equal((await harness({ env: { NODE_ENV: "development" } }).request(valid, { headers: { origin } })).statusCode, 200)
  }
  for (const headers of [{ "content-type": "text/plain" }, { "content-type": "application/x-www-form-urlencoded" }, { "content-encoding": "gzip" }]) {
    const h = harness()
    assert.equal((await h.request(valid, { headers })).statusCode, 415)
    assert.equal(h.calls.firestore, 0)
  }
  assert.equal((await harness().request(valid, { headers: { "content-type": "application/json; charset=utf-8" } })).statusCode, 200)
})

test("8 KB raw limit covers stream and Firebase rawBody, malformed JSON returns JSON error", async () => {
  for (const firebase of [false, true]) {
    for (const [raw, status] of [["{broken", 400], ["", 400], [JSON.stringify({ ...valid, padding: "x".repeat(8192) }), 413]]) {
      const h = harness()
      assert.equal((await h.request(valid, { raw, firebase })).statusCode, status)
      assert.equal(h.calls.firestore, 0)
    }
  }
  const raw = JSON.stringify(valid).padEnd(8192, " ")
  assert.equal((await harness().request(valid, { raw })).statusCode, 200)
  assert.equal((await harness().request(valid, { raw: raw + " " })).statusCode, 413)
})

test("SMTP failure, empty acceptance or wrong recipient cannot return success or leak details", async () => {
  for (const options of [{ smtpFails: true }, { smtpResult: {} }, { smtpResult: { accepted: [] } }, { smtpResult: { accepted: ["attacker@example.com"] } }]) {
    const h = harness(options)
    const response = await h.request()
    assert.equal(response.statusCode, 502)
    assert.match(response.body.error, /could not be confirmed/)
    assert.ok(!JSON.stringify(response).includes("private-password"))
    assert.deepEqual(h.calls.logs, [])
    assert.equal(h.store.documents.get("contactMailRateLimits/global-daily").count, 1)
  }
  assert.equal((await harness({ smtpResult: { accepted: [{ address: EMAIL.toUpperCase() }] } }).request()).statusCode, 200)
  const unavailable = harness({ firestoreFails: true })
  assert.equal((await unavailable.request()).statusCode, 503)
  assert.equal(unavailable.calls.messages.length, 0)
})

test("sender quota persists across instances and concurrent reservations, then expires", async () => {
  const h = harness()
  const peers = Array.from({ length: 5 }, () => harness({ store: h.store }))
  const results = await Promise.all(peers.map((peer, index) => peer.request({ ...valid, email: index % 2 ? valid.email.toUpperCase() : valid.email }, { ip: `8.8.8.${index + 1}` })))
  assert.equal(results.filter(response => response.statusCode === 200).length, 3)
  assert.equal(results.filter(response => response.statusCode === 429).length, 2)
  assert.equal(h.store.documents.get("contactMailRateLimits/global-daily").count, 3)
  assert.equal((await h.request()).headers["Retry-After"], "3600")
  h.advance(3600000)
  assert.equal((await h.request()).statusCode, 200)
})

test("IP quota ignores spoofed forwarded headers and normalizes IPv4 mapped IPv6", async () => {
  const h = harness()
  for (let index = 0; index < 5; index++) {
    assert.equal((await h.request({ ...valid, email: `visitor${index}@example.com` }, { ip: index % 2 ? "::ffff:8.8.8.8" : "8.8.8.8" })).statusCode, 200)
  }
  const result = await h.request({ ...valid, email: "different@example.com" }, { headers: { "x-forwarded-for": "198.51.100.1", "x-real-ip": "198.51.100.2" } })
  assert.equal(result.statusCode, 429)
  assert.equal(h.calls.messages.length, 5)
})

test("private proxy, absent and reserved IPs skip the IP bucket without a shared five-attempt cap", async () => {
  for (const ip of [undefined, "unknown", "10.0.0.1", "172.16.1.1", "192.168.1.1", "127.0.0.1", "100.64.0.1", "169.254.1.1", "192.0.2.1", "::1", "fc00::1", "fe80::1", "2001:db8::1", "::ffff:10.0.0.1"]) {
    const h = harness()
    for (let index = 0; index < 6; index++) {
      const response = await h.request({ ...valid, email: `visitor${index}@example.com` }, { ip, headers: { "x-forwarded-for": "8.8.8.8" } })
      assert.equal(response.statusCode, 200, String(ip))
    }
    assert.equal(Array.from(h.store.documents.keys()).some(key => key.includes("/ip-")), false)
    for (let index = 0; index < 2; index++) assert.equal((await h.request({ ...valid, email: "visitor0@example.com" }, { ip })).statusCode, 200)
    assert.equal((await h.request({ ...valid, email: "visitor0@example.com" }, { ip })).statusCode, 429)
  }
})

test("global daily limit persists, blocks SMTP at 100, and resets at UTC midnight", async () => {
  const h = harness()
  h.store.documents.set("contactMailRateLimits/global-daily", { day: "2026-09-27", count: 99 })
  assert.equal((await h.request()).statusCode, 200)
  const peer = harness({ store: h.store })
  const result = await peer.request({ ...valid, email: "other@example.com" }, { ip: "198.51.100.1" })
  assert.equal(result.statusCode, 429)
  assert.equal(result.headers["Retry-After"], "43200")
  assert.equal(peer.calls.messages.length, 0)
  peer.advance(12 * 3600000)
  assert.equal((await peer.request()).statusCode, 200)
  assert.equal(h.store.documents.get("contactMailRateLimits/global-daily").count, 1)
})
