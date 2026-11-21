import { getWebsiteTraffic } from "../../../lib/websiteTraffic"

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ error: "Method not allowed" }) }
  try {
    const report = await getWebsiteTraffic()
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300")
    return res.status(200).json(report)
  } catch (error) {
    res.setHeader("Cache-Control", "no-store")
    res.setHeader("Retry-After", "60")
    const code = error.message
    return res.status(503).json({ code, error: code === "ANALYTICS_ACCESS_REQUIRED"
      ? "Firebase Analytics reporting access is not enabled yet."
      : code === "ANALYTICS_NOT_CONFIGURED" ? "Firebase Analytics reporting is not configured yet."
      : "Website traffic is temporarily unavailable. Please try again later." })
  }
}
