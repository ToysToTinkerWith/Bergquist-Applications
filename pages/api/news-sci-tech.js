// pages/api/news-sci-tech.js
// NewsAPI proxy (Pages Router) — debug-friendly + resilient.
// Update: tech-only query + reject non-tech matches.
// Also filters out package update / release / version bump type events.

const CACHE = { ts: 0, key: "", items: [] }

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function isoDay(d) {
  const pad2 = (n) => String(n).padStart(2, "0")
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

async function fetchWithTimeout(url, { timeoutMs = 6500, headers = {} } = {}) {
  if (typeof fetch !== "function") {
    throw new Error(
      "Global fetch() is not available in this runtime. Upgrade Node (18+) or Next.js, or add a fetch polyfill."
    )
  }

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  try {
    return await fetch(url, { headers, signal: ac.signal })
  } finally {
    clearTimeout(t)
  }
}

function isTransientStatus(status) {
  return status === 429 || (status >= 500 && status <= 599)
}

function safeHost(u) {
  try {
    return new URL(u).hostname.toLowerCase()
  } catch {
    return ""
  }
}

// Heuristic filter for "package update / release" type posts.
// Goal: remove npm/pypi/github release notes and "v1.2.3 released" noise.
function looksLikePackageUpdate(a) {
  const title = String(a?.title || "").toLowerCase()
  const desc = String(a?.description || "").toLowerCase()
  const content = String(a?.content || "").toLowerCase()
  const source = String(a?.source?.name || "").toLowerCase()
  const url = String(a?.url || "")
  const host = safeHost(url)

  const text = `${title}\n${desc}\n${content}\n${source}\n${host}`

  // Common release/version patterns
  const hasVersion =
    /\bv?\d+\.\d+(\.\d+)?([\-+][0-9a-z.\-]+)?\b/i.test(title) || // v1.2.3, 1.2, 1.2.3-beta
    /\bversion\s+\d+(\.\d+)+\b/i.test(title) ||
    /\brelease\s+v?\d+(\.\d+)+\b/i.test(title)

  // Keywords that strongly indicate package/library release notes rather than "news"
  const releaseKeywords = [
    "release notes",
    "changelog",
    "announcing",
    "now available",
    "available now",
    "rc",
    "beta",
    "alpha",
    "patch",
    "hotfix",
    "bugfix",
    "bug fix",
    "security patch",
    "dependency",
    "dependencies",
    "deps",
    "upgrade",
    "update available",
    "new version",
    "version bump",
    "bump version",
    "published to",
    "published on",
    "npm",
    "pypi",
    "pip ",
    "composer",
    "crates.io",
    "rubygems",
    "nuget",
    "maven",
    "gradle",
    "homebrew",
    "conda",
    "docker hub",
    "helm chart",
  ]

  const keywordHit = releaseKeywords.some((k) => text.includes(k))

  // Domains/sources that are very often "package release" noise.
  // (We keep GitHub generally, but "releases" pages are usually not news.)
  const badHosts = [
    "pypi.org",
    "www.pypi.org",
    "npmjs.com",
    "www.npmjs.com",
    "crates.io",
    "rubygems.org",
    "nuget.org",
    "mvnrepository.com",
    "repo1.maven.org",
    "packagist.org",
    "hub.docker.com",
    "docker.com",
  ]

  const hostHit = badHosts.some((h) => host === h || host.endsWith(`.${h}`))

  // GitHub releases / tags / compare links commonly indicate version bumps
  const githubReleaseHit =
    host === "github.com" &&
    (url.includes("/releases") || url.includes("/tags") || url.includes("/compare/"))

  // Also exclude "X.Y.Z released" even if not in the above lists.
  if (githubReleaseHit) return true
  if (hostHit) return true
  if (hasVersion && (keywordHit || title.includes("released") || title.includes("release"))) return true
  if (keywordHit && (title.includes("release") || title.includes("released") || title.includes("version")))
    return true

  return false
}

// Heuristic allowlist to keep results *tech* focused.
// This is a second gate after the NewsAPI query to reduce false positives.
function looksTechRelated(a) {
  const title = String(a?.title || "").toLowerCase()
  const desc = String(a?.description || "").toLowerCase()
  const content = String(a?.content || "").toLowerCase()
  const source = String(a?.source?.name || "").toLowerCase()
  const url = String(a?.url || "")
  const host = safeHost(url)

  const text = `${title}\n${desc}\n${content}\n${source}\n${host}`

  // Strong tech keywords (computing / AI / hardware / security / space tech / telecom)
  const techKeywords = [
    "ai",
    "artificial intelligence",
    "machine learning",
    "ml",
    "llm",
    "chatbot",
    "openai",
    "google",
    "microsoft",
    "amazon",
    "meta",
    "apple",
    "nvidia",
    "amd",
    "intel",
    "semiconductor",
    "chip",
    "gpu",
    "cpu",
    "data center",
    "cloud",
    "saas",
    "api",
    "software",
    "hardware",
    "robot",
    "robotics",
    "automation",
    "autonomous",
    "drone",
    "cyber",
    "cybersecurity",
    "hack",
    "hacker",
    "ransomware",
    "breach",
    "vulnerability",
    "zero-day",
    "encryption",
    "privacy",
    "surveillance",
    "5g",
    "telecom",
    "satellite",
    "spacex",
    "launch",
    "space mission",
    "rocket",
    "starlink",
    "quantum computing",
    "supercomputer",
    "database",
    "blockchain",
    "crypto",
    "web3",
    "internet",
    "social media",
    "platform",
    "app",
    "mobile",
    "smartphone",
    "iphone",
    "android",
  ]

  const hit = techKeywords.some((k) => text.includes(k))

  // If it doesn't match any tech keyword at all, it's probably not tech news.
  if (!hit) return false

  // Optional: reject common non-tech “drift” topics that slip through.
  // (You can add/remove words here based on what you see in your feed.)
  const nonTechDrift = [
    "sports",
    "celebrity",
    "movie",
    "music",
    "fashion",
    "recipe",
    "travel",
    "horoscope",
    "lottery",
    "obituary",
    "gossip",
  ]
  if (nonTechDrift.some((k) => text.includes(k))) return false

  return true
}

export default async function handler(req, res) {
  const step = (name, extra = {}) => ({ step: name, ...extra })

  try {
    const apiKey =
      process.env.NEWSAPI_KEY ||
      process.env.NEXT_PUBLIC_NEWSAPI_KEY ||
      process.env.NEWS_API_KEY ||
      ""

    if (!apiKey) {
      return res.status(500).json(
        step("missing_key", {
          error: "Missing NEWSAPI_KEY (set it in .env.local and restart `next dev`).",
          expectedEnv: ["NEWSAPI_KEY"],
        })
      )
    }

    const max = Math.min(Math.max(Number(req.query.max || 5), 1), 20)
    const days = Math.min(Math.max(Number(req.query.days || 14), 1), 30)

    const cacheKey = `max=${max}&days=${days}`
    const now = Date.now()
    const FRESH_MS = 5 * 60 * 1000
    const STALE_MAX_MS = 60 * 60 * 1000

    if (CACHE.key === cacheKey && CACHE.items?.length && now - CACHE.ts <= FRESH_MS) {
      res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
      return res.status(200).json({ events: CACHE.items, stale: false, cached: true })
    }

    // TECH-ONLY query:
    // - Focuses on tech industry, AI, chips, cloud, cybersecurity, satellites/space tech, telecom.
    // - Excludes obvious non-tech categories.
    // - Avoids generic "science" which pulls in health/biology etc.
    const q =
      '(' +
      [
        '"artificial intelligence"',
        "AI",
        '"machine learning"',
        "LLM",
        "robotics",
        "semiconductor",
        "chip",
        "GPU",
        "CPU",
        '"data center"',
        "cloud",
        "software",
        "hardware",
        "cybersecurity",
        "ransomware",
        "breach",
        "vulnerability",
        '"zero-day"',
        "telecom",
        "5G",
        "satellite",
        '"space mission"',
        "rocket",
        "blockchain",
      ].join(" OR ") +
      ')' +
      " NOT (" +
      [
        "sports",
        "celebrity",
        "movie",
        "music",
        "politics",
        "election",
        "weather",
        "recipe",
        "horoscope",
      ].join(" OR ") +
      ")"

    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

    const qs = new URLSearchParams()
    qs.set("q", q)
    qs.set("language", "en")
    qs.set("sortBy", "publishedAt")
    qs.set("pageSize", String(Math.max(80, max * 12))) // fetch more so filtering still leaves enough
    qs.set("from", isoDay(start))
    qs.set("to", isoDay(end))

    const url = `https://newsapi.org/v2/everything?${qs.toString()}`

    const maxAttempts = 3
    let lastErr = null

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const r = await fetchWithTimeout(url, {
          timeoutMs: 6500,
          headers: {
            "X-Api-Key": apiKey,
            "User-Agent": "bergquist-apps/1.0 (+newsapi-proxy)",
          },
        })

        const bodyText = await r.text().catch(() => "")
        let json = null
        try {
          json = bodyText ? JSON.parse(bodyText) : null
        } catch {
          // keep text for debugging
        }

        if (!r.ok) {
          const err = new Error(`NewsAPI HTTP ${r.status}`)
          err.status = r.status
          err.payload = json || bodyText.slice(0, 500)
          if (!isTransientStatus(r.status)) throw err
          lastErr = err
        } else if (json?.status === "error") {
          const err = new Error(json?.message || "NewsAPI error")
          err.status = 502
          err.code = json?.code
          err.payload = json
          if (json?.code === "rateLimited") {
            lastErr = err
          } else {
            throw err
          }
        } else {
          const articles = Array.isArray(json?.articles) ? json.articles : []
          const seen = new Set()
          const out = []

          for (const a of articles) {
            const u = a?.url
            if (!u || seen.has(u)) continue

            // Filters:
            if (looksLikePackageUpdate(a)) continue
            if (!looksTechRelated(a)) continue

            seen.add(u)
            out.push({
              title: a?.title || "Untitled",
              url: u,
              source: a?.source?.name || "",
              publishedAt: a?.publishedAt || "",
            })

            if (out.length >= max) break
          }

          CACHE.ts = Date.now()
          CACHE.key = cacheKey
          CACHE.items = out

          res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600")
          return res.status(200).json({ events: out, stale: false, cached: false })
        }
      } catch (e) {
        lastErr = e
      }

      if (attempt < maxAttempts) {
        const base = [250, 700, 1500][attempt - 1] || 1500
        const jitter = Math.floor(Math.random() * 200)
        await sleep(base + jitter)
      }
    }

    if (CACHE.items?.length && now - CACHE.ts <= STALE_MAX_MS) {
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=600")
      return res.status(200).json({
        events: CACHE.items,
        stale: true,
        cached: true,
        error: lastErr?.message || "Upstream error",
      })
    }

    console.error("[news-sci-tech] upstream failure:", lastErr)

    return res.status(502).json(
      step("upstream_failed", {
        error: "Bad Gateway (NewsAPI upstream failed)",
        detail: lastErr?.message || "Unknown error",
        status: lastErr?.status,
        code: lastErr?.code,
        payload: lastErr?.payload,
      })
    )
  } catch (e) {
    console.error("[news-sci-tech] handler error:", e)
    return res.status(500).json(step("handler_error", { error: e?.message || "Server error" }))
  }
}