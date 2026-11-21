const API_BASE = "https://api.vestigelabs.org"

async function tryFetchJson(url) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  })

  const text = await res.text()
  let data = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
    text,
    url,
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const query = String(req.query.query || "").trim()
  const networkId = String(req.query.networkId || "0").trim()

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter: query" })
  }

  const encoded = encodeURIComponent(query)

  const candidates = [
    `${API_BASE}/assets/list?network_id=${encodeURIComponent(networkId)}&search=${encoded}`,
    `${API_BASE}/assets/list?network_id=${encodeURIComponent(networkId)}&query=${encoded}`,
    `${API_BASE}/assets/list?network_id=${encodeURIComponent(networkId)}&keyword=${encoded}`,
    `${API_BASE}/assets/search?network_id=${encodeURIComponent(networkId)}&query=${encoded}`,
  ]

  const attempts = []

  for (const url of candidates) {
    try {
      const result = await tryFetchJson(url)
      attempts.push({
        url,
        status: result.status,
        ok: result.ok,
      })

      const hasArrayData =
        Array.isArray(result.data) ||
        Array.isArray(result.data?.results) ||
        Array.isArray(result.data?.items) ||
        Array.isArray(result.data?.data) ||
        Array.isArray(result.data?.assets)

      if (result.ok && hasArrayData) {
        return res.status(200).json(result.data)
      }
    } catch (error) {
      attempts.push({
        url,
        error: error?.message || String(error),
      })
    }
  }

  return res.status(502).json({
    error: "Failed to resolve asset from Vestige.",
    query,
    networkId,
    attempts,
  })
}