import getRawBody from "raw-body"
import { ContactMailError, sendContactMail } from "../../lib/contactMail"

export const config = { api: { bodyParser: false } }

const MAX_BODY_BYTES = 8 * 1024
const ALLOWED_ORIGINS = new Set([
  "https://bergquistapplications.com",
  "https://www.bergquistapplications.com",
  "https://cleaning-7852d.web.app",
  "https://cleaning-7852d.firebaseapp.com",
])

function allowedOrigin(origin) {
  if (typeof origin !== "string") return false
  if (ALLOWED_ORIGINS.has(origin)) return true
  if (process.env.NODE_ENV === "production") return false
  try {
    const url = new URL(origin)
    return url.origin === origin && ["http:", "https:"].includes(url.protocol)
      && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  } catch {
    return false
  }
}

export default async function contact(req, res) {
  res.setHeader("Cache-Control", "no-store")
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "Only POST is supported.", code: "not_sent" })
  }
  if (!allowedOrigin(req.headers.origin)) return res.status(403).json({ error: "This origin is not allowed.", code: "not_sent" })
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers["content-type"] || "")) {
    return res.status(415).json({ error: "Send application/json.", code: "not_sent" })
  }
  if (req.headers["content-encoding"] && req.headers["content-encoding"] !== "identity") {
    return res.status(415).json({ error: "Compressed request bodies are not supported.", code: "not_sent" })
  }
  let body
  try {
    // Firebase Functions has already consumed the stream and provides the original rawBody.
    const raw = Buffer.isBuffer(req.rawBody)
      ? req.rawBody
      : await getRawBody(req, { limit: MAX_BODY_BYTES, length: req.headers["content-length"] })
    if (raw.length > MAX_BODY_BYTES) return res.status(413).json({ error: "The contact form exceeds 8 KB.", code: "not_sent" })
    body = JSON.parse(raw.toString("utf8"))
  } catch (error) {
    const tooLarge = error.type === "entity.too.large"
    return res.status(tooLarge ? 413 : 400).json({ error: tooLarge ? "The contact form exceeds 8 KB." : "Invalid JSON request.", code: "not_sent" })
  }
  try {
    await sendContactMail(body, req)
    return res.status(200).json({ ok: true })
  } catch (error) {
    if (error instanceof ContactMailError) {
      if (error.retryAfterSeconds) res.setHeader("Retry-After", String(error.retryAfterSeconds))
      return res.status(error.statusCode).json({ error: error.message, code: error.code })
    }
    return res.status(503).json({ error: "Contact email is unavailable. Sending could not be confirmed. Please email directly.", code: "delivery_unconfirmed" })
  }
}
