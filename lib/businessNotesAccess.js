// Server-only. Never import this module from browser components.
import { getAdminAuth } from "./firebaseAdmin"

const accessErrors = {
  business_notes_auth_required: [401, "Sign in to use this workspace."],
  business_notes_forbidden: [403, "This account does not have access to this workspace."],
  business_notes_unconfigured: [503, "Workspace access is not configured."],
  business_notes_auth_unavailable: [503, "Account verification is temporarily unavailable."],
}
function fail(code) {
  const error = new Error(accessErrors[code][1])
  error.code = code; error.statusCode = accessErrors[code][0]
  throw error
}
const list = value => typeof value === "string" ? value.split(",").map(entry => entry.trim()).filter(Boolean) : []

export function businessNotesAccessDecision(user, env = process.env) {
  const uids = list(env.BUSINESS_NOTES_ALLOWED_UIDS)
  const emails = list(env.BUSINESS_NOTES_ALLOWED_EMAILS).map(email => email.toLowerCase())
  if (!uids.length && !emails.length) return "unconfigured"
  if (!user?.uid || user.firebase?.sign_in_provider === "anonymous") return "forbidden"
  if (env.BUSINESS_NOTES_REQUIRE_GOOGLE_SIGN_IN !== "false" && user.firebase?.sign_in_provider !== "google.com") return "forbidden"
  if (uids.includes(user.uid)) return "allowed"
  return user.email_verified === true && typeof user.email === "string" && emails.includes(user.email.trim().toLowerCase()) ? "allowed" : "forbidden"
}

export async function requireBusinessNotesAccess(req) {
  let token = ""
  if (req.headers?.authorization) {
    const match = String(req.headers.authorization).match(/^Bearer\s+(\S+)$/i)
    if (!match) fail("business_notes_auth_required")
    token = match[1]
  } else if (req.method === "POST" && typeof req.body?.idToken === "string") token = req.body.idToken.trim()
  if (!token) fail("business_notes_auth_required")
  let user
  try { user = await getAdminAuth().verifyIdToken(token) }
  catch (error) {
    fail(String(error?.code || "").startsWith("auth/") ? "business_notes_auth_required" : "business_notes_auth_unavailable")
  }
  if (!user?.uid) fail("business_notes_auth_required")
  const decision = businessNotesAccessDecision(user)
  if (decision === "unconfigured") fail("business_notes_unconfigured")
  if (decision !== "allowed") fail("business_notes_forbidden")
  return user
}

export function sendBusinessNotesAccessError(res, error) {
  if (!Object.hasOwn(accessErrors, error?.code)) return false
  const [status, message] = accessErrors[error.code]
  res.status(status).json({ allowed: false, code: error.code, error: message })
  return true
}
