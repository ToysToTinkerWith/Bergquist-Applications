// Server-only reporting: expose daily aggregates, never visitor identifiers or credentials.
import { JWT } from "google-auth-library"

let cached, pending, retryAfter = 0, lastError
const TTL = 5 * 60 * 1000

export function normalizeTrafficReport(report) {
  const rows = (report.rows || []).map(row => {
    const day = row.dimensionValues?.[0]?.value || ""
    const count = index => Math.max(0, Number(row.metricValues?.[index]?.value) || 0)
    return { id: `${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}`, value: count(0), pageViews: count(1) }
  }).filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.id)).sort((a, b) => a.id.localeCompare(b.id))
  return { rows, generatedAt: new Date().toISOString(), timeZone: report.metadata?.timeZone || "UTC",
    source: "Firebase Analytics", range: "Last 30 complete days", limited: !!report.metadata?.subjectToThresholding }
}

async function readReport() {
  const email = process.env.NEXT_FIREBASE_CLIENT_EMAIL
  const key = process.env.NEXT_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!email || !key) throw new Error("ANALYTICS_NOT_CONFIGURED")
  const client = new JWT({ email, key, scopes: ["https://www.googleapis.com/auth/analytics.readonly", "https://www.googleapis.com/auth/firebase.readonly"] })
  const request = options => client.request({ timeout: 12000, retry: false, ...options })
  let property = process.env.GA4_PROPERTY_ID
  if (!property) {
    const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (!project) throw new Error("ANALYTICS_NOT_CONFIGURED")
    const { data } = await request({ url: `https://firebase.googleapis.com/v1beta1/projects/${encodeURIComponent(project)}/analyticsDetails` })
    property = data.analyticsProperty?.id
  }
  if (!/^\d+$/.test(property || "")) throw new Error("ANALYTICS_NOT_CONFIGURED")
  const { data } = await request({ url: `https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`, method: "POST",
    data: { dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }], dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }, { name: "screenPageViews" }],
      dimensionFilter: { filter: { fieldName: "platform", stringFilter: { matchType: "EXACT", value: "web", caseSensitive: false } } },
      orderBys: [{ dimension: { dimensionName: "date" } }], keepEmptyRows: true, limit: 31 } })
  return normalizeTrafficReport(data)
}

export async function getWebsiteTraffic() {
  if (cached && Date.now() - cached.at < TTL) return cached.value
  if (Date.now() < retryAfter) throw lastError
  if (!pending) pending = readReport().then(value => {
    cached = { at: Date.now(), value }; return value
  }).catch(error => {
    // Log only the upstream status/code, not auth request options or headers.
    const status = error.response?.status
    const code = error.code || error.message
    console.warn("Website analytics unavailable:", status || (/^[A-Z_]+$/.test(code || "") ? code : "UPSTREAM_ERROR"))
    lastError = new Error(status === 403 ? "ANALYTICS_ACCESS_REQUIRED" : error.message === "ANALYTICS_NOT_CONFIGURED" ? error.message : "ANALYTICS_UNAVAILABLE")
    retryAfter = Date.now() + 60000
    throw lastError
  }).finally(() => { pending = null })
  return pending
}
