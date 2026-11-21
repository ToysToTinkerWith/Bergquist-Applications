const API_BASE = "https://api.vestigelabs.org"

async function fetchUpstream(url) {
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
    text,
    data,
    url,
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const assetId = String(req.query.assetId || "").trim()
  const denominatingAssetId = String(
    req.query.denominatingAssetId || "31566704"
  ).trim()
  const interval = String(req.query.interval || "").trim()
  const start = String(req.query.start || "").trim()
  const end = String(req.query.end || "").trim()
  const limit = String(req.query.limit || "").trim()
  const networkId = String(req.query.networkId || "0").trim()

  if (!assetId || !interval || !start || !end || !limit) {
    return res.status(400).json({
      error: "Missing required query params",
      required: ["assetId", "interval", "start", "end", "limit"],
      received: {
        assetId,
        denominatingAssetId,
        interval,
        start,
        end,
        limit,
        networkId,
      },
    })
  }

  const urls = [
    `${API_BASE}/assets/${encodeURIComponent(assetId)}/candles?network_id=${encodeURIComponent(networkId)}&denominating_asset_id=${encodeURIComponent(denominatingAssetId)}&interval=${encodeURIComponent(interval)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=${encodeURIComponent(limit)}`,
    `${API_BASE}/assets/${encodeURIComponent(assetId)}/candles?denominating_asset_id=${encodeURIComponent(denominatingAssetId)}&interval=${encodeURIComponent(interval)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=${encodeURIComponent(limit)}`,
  ]

  const attempts = []

  for (const url of urls) {
    try {
      const upstream = await fetchUpstream(url)

      attempts.push({
        url,
        status: upstream.status,
        ok: upstream.ok,
      })

      if (upstream.ok) {
        res.status(200)
        res.setHeader("Content-Type", "application/json")
        return res.send(upstream.text)
      }
    } catch (error) {
      attempts.push({
        url,
        error: error?.message || String(error),
      })
    }
  }

  return res.status(502).json({
    error: "Failed to fetch candle data from Vestige.",
    received: {
      assetId,
      denominatingAssetId,
      interval,
      start,
      end,
      limit,
      networkId,
    },
    attempts,
  })
}