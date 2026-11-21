import { requireBusinessNotesAccess, sendBusinessNotesAccessError } from "../../lib/businessNotesAccess"

export default async function businessNotesAccess(req, res) {
  res.setHeader("Cache-Control", "private, no-store")
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ allowed: false, error: "Method not allowed." }) }
  try {
    await requireBusinessNotesAccess(req)
    return res.status(200).json({ allowed: true })
  } catch (error) {
    if (!sendBusinessNotesAccessError(res, error)) res.status(503).json({ allowed: false, code: "business_notes_auth_unavailable", error: "Account verification is temporarily unavailable." })
  }
}
