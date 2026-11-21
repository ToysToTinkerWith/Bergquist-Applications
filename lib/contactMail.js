import crypto from "crypto"
import { BlockList, isIP } from "net"
import nodemailer from "nodemailer"
import { getFirestore } from "./firebaseAdmin"
import { CONTACT_EMAIL } from "./contactDetails"
import { formatContactSubmission, isContactEmail, validateContactSubmission } from "./contactSubmission"

// Import only from API routes or dynamically inside getStaticProps. Never serialize config.
if (typeof window !== "undefined") throw new Error("contactMail is server-only")

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const RATE_COLLECTION = "contactMailRateLimits"
const nonPublicIps = new BlockList()
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
]) nonPublicIps.addSubnet(address, prefix, "ipv4")
for (const [address, prefix] of [["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20]]) {
  nonPublicIps.addSubnet(address, prefix, "ipv6")
}

export class ContactMailError extends Error {
  constructor(message, statusCode = 503, retryAfterSeconds = 0, code = "not_sent") {
    super(message)
    this.name = "ContactMailError"
    this.statusCode = statusCode
    this.retryAfterSeconds = retryAfterSeconds
    this.code = code
  }
}

export function getContactMailConfig() {
  const apiKey = (process.env.RESEND_API_KEY || "").trim()
  const resendFrom = (process.env.RESEND_FROM_EMAIL || "").trim()
  if (apiKey || resendFrom) {
    const namedAddress = resendFrom.match(/^([^<>\r\n]+)\s*<([^<>]+)>$/)
    const address = namedAddress ? namedAddress[2] : resendFrom
    if (!/^re_[A-Za-z0-9_-]+$/.test(apiKey) || /[\x00-\x1f\x7f]/.test(resendFrom) || !isContactEmail(address)) return null
    return { provider: "resend", apiKey, from: resendFrom }
  }
  const host = (process.env.CONTACT_SMTP_HOST || "").trim()
  const portText = (process.env.CONTACT_SMTP_PORT || "465").trim()
  const user = (process.env.CONTACT_SMTP_USER || "").trim()
  const password = process.env.CONTACT_SMTP_PASSWORD || ""
  const from = (process.env.CONTACT_SMTP_FROM || user).trim()
  if (!host || !user || !password.trim() || !isContactEmail(from)) return null
  if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?$/.test(host)) return null
  if (/[\x00-\x1f\x7f]/.test(user) || /[\r\n\x00]/.test(password)) return null
  if (portText !== "465" && portText !== "587") return null
  const port = Number(portText)
  return {
    from,
    transport: {
      host, port, secure: port === 465, requireTLS: true,
      auth: { user, pass: password },
      tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000, dnsTimeout: 10000,
      logger: false, debug: false, transactionLog: false,
      disableFileAccess: true, disableUrlAccess: true,
    },
  }
}

export function isContactMailConfigured() {
  return Boolean(getContactMailConfig())
}

function clientIp(req) {
  // Only a trusted adapter's public req.ip can identify a visitor; sockets may be shared proxies.
  const address = req.ip
  if (typeof address !== "string" || address.includes("%") || !isIP(address)) return null
  if (isIP(address) === 4) return nonPublicIps.check(address, "ipv4") ? null : address
  const normalized = new URL(`http://[${address}]/`).hostname.slice(1, -1)
  const mapped = normalized.match(/^::ffff:([a-f0-9]+):([a-f0-9]+)$/)
  if (!mapped) return /^[23]/.test(normalized) && !nonPublicIps.check(normalized, "ipv6") ? normalized : null
  const bytes = [parseInt(mapped[1], 16), parseInt(mapped[2], 16)]
  const ipv4 = [bytes[0] >> 8, bytes[0] & 255, bytes[1] >> 8, bytes[1] & 255].join(".")
  return nonPublicIps.check(ipv4, "ipv4") ? null : ipv4
}

async function reserveContactQuota(req, email) {
  const now = Date.now()
  const day = new Date(now).toISOString().slice(0, 10)
  const hash = value => crypto.createHash("sha256").update(value).digest("hex")
  const db = getFirestore()
  const collection = db.collection(RATE_COLLECTION)
  const buckets = [
    { ref: collection.doc(`sender-${hash(email.toLowerCase())}`), limit: 3 },
  ]
  const ip = clientIp(req)
  if (ip) buckets.push({ ref: collection.doc(`ip-${hash(ip)}`), limit: 5 })
  const globalRef = collection.doc("global-daily")
  // Reserve all counters atomically, before delivery. Failed attempts also consume quota.
  await db.runTransaction(async transaction => {
    const snapshots = await Promise.all(buckets.map(bucket => transaction.get(bucket.ref)))
    const globalSnapshot = await transaction.get(globalRef)
    const daily = globalSnapshot.exists ? globalSnapshot.data() : {}
    const count = daily.day === day ? Number(daily.count || 0) : 0
    if (count >= 100) throw new ContactMailError("The daily contact limit has been reached. Please email directly.", 429, Math.ceil((DAY_MS - now % DAY_MS) / 1000))
    const requests = snapshots.map(snapshot => {
      const history = snapshot.exists ? snapshot.data().requests : []
      return (Array.isArray(history) ? history : []).filter(time => Number.isFinite(time) && time > now - HOUR_MS)
    })
    for (let index = 0; index < buckets.length; index++) {
      if (requests[index].length >= buckets[index].limit) {
        throw new ContactMailError("Too many contact attempts. Please try later or email directly.", 429, Math.max(1, Math.ceil((Math.min(...requests[index]) + HOUR_MS - now) / 1000)))
      }
    }
    buckets.forEach((bucket, index) => transaction.set(bucket.ref, {
      requests: [...requests[index], now], expiresAt: new Date(now + 2 * DAY_MS),
    }))
    transaction.set(globalRef, { day, count: count + 1, expiresAt: new Date(now + 2 * DAY_MS) })
  })
}

export async function sendContactMail(body, req) {
  const submission = validateContactSubmission(body)
  if (submission.error) throw new ContactMailError(submission.error, 400)
  const config = getContactMailConfig()
  if (!config) throw new ContactMailError("Contact email is not configured. Please use the email draft or email directly.")
  try {
    await reserveContactQuota(req, submission.fields.email)
  } catch (error) {
    if (error instanceof ContactMailError) throw error
    throw new ContactMailError("Contact email is temporarily unavailable. Please email directly.")
  }
  const { fields } = submission
  try {
    if (config.provider === "resend") {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `contact-${crypto.randomUUID()}`,
        },
        body: JSON.stringify({
          from: config.from, to: [CONTACT_EMAIL], reply_to: fields.email,
          ...formatContactSubmission(fields),
        }),
        signal: AbortSignal.timeout(20000),
        redirect: "error",
      })
      const result = await response.json()
      if (!response.ok || typeof result?.id !== "string" || !result.id.trim()) throw new Error("Email was not accepted")
      return { ok: true }
    }
    const transport = nodemailer.createTransport(config.transport)
    const info = await transport.sendMail({
      from: config.from,
      to: CONTACT_EMAIL,
      envelope: { from: config.from, to: [CONTACT_EMAIL] },
      replyTo: { name: fields.name, address: fields.email },
      ...formatContactSubmission(fields),
    })
    const accepted = info?.accepted?.some(recipient => {
      const address = typeof recipient === "string" ? recipient : recipient?.address
      return typeof address === "string" && address.toLowerCase() === CONTACT_EMAIL.toLowerCase()
    })
    if (!accepted) throw new Error("Recipient was not accepted")
    return { ok: true }
  } catch {
    // Timeouts may happen after acceptance; do not retry automatically or expose provider errors.
    throw new ContactMailError("Sending could not be confirmed. Please use the email draft or email directly.", 502, 0, "delivery_unconfirmed")
  }
}
