import crypto from "crypto"
import { adminFieldValue, getFirestore } from "./firebaseAdmin"

const WINDOW_MS = 10 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

const RATE_LIMITS = {
  authenticated: {
    maxInWindow: 24,
    maxPerDay: 160,
    minGapMs: 2500,
    cooldownMs: 2 * 60 * 1000,
  },
  anonymous: {
    maxInWindow: 6,
    maxPerDay: 25,
    minGapMs: 4000,
    cooldownMs: 5 * 60 * 1000,
  },
}

export class AssistantRateLimitError extends Error {
  constructor(message, { code, retryAfterSeconds }) {
    super(message)
    this.name = "AssistantRateLimitError"
    this.statusCode = 429
    this.code = code
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export function isAssistantRateLimitError(error) {
  return error?.name === "AssistantRateLimitError" || error?.statusCode === 429
}

export function sendAssistantRateLimitError(res, error) {
  res.status(429).json({
    error:
      error?.message ||
      "Please wait a moment before sending another assistant request.",
    code: error?.code || "rate_limited",
    retryAfterSeconds: Math.max(1, Number(error?.retryAfterSeconds || 1)),
  })
}

export function isAnonymousFirebaseUser(user) {
  return user?.firebase?.sign_in_provider === "anonymous"
}

function hash(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex")
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim()
  return (
    forwarded ||
    String(req.headers["x-real-ip"] || "").trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  )
}

function getClientId(req) {
  const value =
    req.body?.clientId ||
    req.query?.clientId ||
    req.headers["x-assistant-client-id"] ||
    ""

  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80)
}

function asRecentNumbers(value, cutoff) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => Number(item || 0))
    .filter((item) => Number.isFinite(item) && item >= cutoff)
}

export async function assertAssistantRateLimit({
  req,
  uid = null,
  isAnonymous = false,
  prompt = "",
  action = "home-assistant",
}) {
  const audience = uid && !isAnonymous ? "authenticated" : "anonymous"
  const limit = RATE_LIMITS[audience]
  const now = Date.now()
  const ip = getClientIp(req)
  const clientId = getClientId(req)
  const identifier = uid
    ? `${audience}:${uid}`
    : `anonymous:${ip || clientId || "unknown"}`
  const db = getFirestore()
  const ref = db.collection("assistantRateLimits").doc(hash(identifier).slice(0, 48))

  const decision = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref)
    const data = snap.exists ? snap.data() || {} : {}
    const requests = asRecentNumbers(data.requests, now - WINDOW_MS)
    const daily = asRecentNumbers(data.daily, now - DAY_MS)
    const lockedUntil = Number(data.lockedUntil || 0)
    const lastRequestAt = Number(data.lastRequestAt || 0)

    if (lockedUntil > now) {
      return {
        blocked: true,
        code: "cooldown",
        retryAfterSeconds: Math.ceil((lockedUntil - now) / 1000),
        message: "The assistant is cooling down for this visitor. Please wait a moment before sending another request.",
      }
    }

    if (lastRequestAt && now - lastRequestAt < limit.minGapMs) {
      const nextLockedUntil = now + limit.cooldownMs

      transaction.set(
        ref,
        {
          audience,
          action,
          identifierHash: hash(identifier),
          lockedUntil: nextLockedUntil,
          lastBlockedAt: now,
          updatedAt: adminFieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      return {
        blocked: true,
        code: "too_fast",
        retryAfterSeconds: Math.ceil(limit.cooldownMs / 1000),
        message: "That was a little too fast. The assistant is paused briefly for this visitor.",
      }
    }

    if (requests.length >= limit.maxInWindow) {
      const nextLockedUntil = Math.max(
        now + limit.cooldownMs,
        requests[0] + WINDOW_MS
      )

      transaction.set(
        ref,
        {
          audience,
          action,
          identifierHash: hash(identifier),
          lockedUntil: nextLockedUntil,
          lastBlockedAt: now,
          updatedAt: adminFieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      return {
        blocked: true,
        code: "rate_limited",
        retryAfterSeconds: Math.ceil((nextLockedUntil - now) / 1000),
        message: "Too many assistant requests were sent in a short time. Please wait for the cooldown.",
      }
    }

    if (daily.length >= limit.maxPerDay) {
      return {
        blocked: true,
        code: "daily_limit",
        retryAfterSeconds: Math.ceil(
        Math.max(1000, daily[0] + DAY_MS - now) / 1000
        ),
        message: "This assistant has reached its request limit for today.",
      }
    }

    transaction.set(
      ref,
      {
        audience,
        action,
        identifierHash: hash(identifier),
        requests: [...requests, now],
        daily: [...daily, now],
        totalCount: Number(data.totalCount || 0) + 1,
        lastRequestAt: now,
        lastAction: action,
        createdAt: data.createdAt || adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return { blocked: false }
  })

  if (decision?.blocked) {
    throw new AssistantRateLimitError(decision.message, {
      code: decision.code,
      retryAfterSeconds: decision.retryAfterSeconds,
    })
  }
}
