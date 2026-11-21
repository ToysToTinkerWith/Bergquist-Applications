import { requireBusinessNotesAccess, sendBusinessNotesAccessError } from "../../lib/businessNotesAccess"
import { lookupBusinessLocation, BusinessLocationError } from "../../lib/businessLocation.mjs"

export const config = { api: { bodyParser: { sizeLimit: "16kb" } } }

export default async function businessLocation(req, res) {
  res.setHeader("Cache-Control", "private, no-store")
  if (!["GET", "POST"].includes(req.method)) { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ error: "Method not allowed." }) }
  try { await requireBusinessNotesAccess(req) }
  catch (error) {
    if (!sendBusinessNotesAccessError(res, error)) res.status(503).json({ error: "Account verification is temporarily unavailable." })
    return
  }
  try {
    const payload = await lookupBusinessLocation(req.method === "GET" ? req.query : req.body)
    return res.status(200).json(payload)
  } catch (error) {
    if (error instanceof BusinessLocationError) {
      if (error.statusCode === 429) res.setHeader("Retry-After", "30")
      return res.status(error.statusCode).json({ error: error.message, code: error.code, ...(error.location ? { location: error.location } : {}) })
    }
    return res.status(503).json({ error: "Location and weather services are temporarily unavailable.", code: "google_upstream" })
  }
}
