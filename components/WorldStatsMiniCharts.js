// components/WorldStatsMiniChartsDetailed.jsx

import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Box,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Link,
} from "@mui/material"
import { motion } from "framer-motion"

function RevealOnScroll({
  children,
  delay = 0,
  threshold = 0,
  rootMargin = "0px 0px -12% 0px",
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (shown) return
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setShown(true)
      return
    }
    const el = ref.current
    if (!el) {
      setShown(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setShown(true)
          obs.disconnect()
        }
      },
      { threshold, root: null, rootMargin }
    )
    obs.observe(el)
    return () => {
      try {
        obs.disconnect()
      } catch {}
    }
  }, [shown, threshold, rootMargin])

  return (
    <Box
      ref={ref}
      component={motion.div}
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
      transition={{ duration: 0.85, ease: "easeOut", delay }}
      sx={{ willChange: "transform, opacity" }}
    >
      {children}
    </Box>
  )
}

function GradientTitle({ children, variant = "h3", align = "left", sx = {} }) {
  return (
    <Typography
      variant={variant}
      align={align}
      sx={{
        fontFamily: "Bemora",
        letterSpacing: 1.1,
        lineHeight: 1.2,
        backgroundImage:
          "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        textShadow: "0 10px 35px rgba(0,0,0,0.55)",
        ...sx,
      }}
    >
      {children}
    </Typography>
  )
}

function fmtCompact(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return "—"
  const abs = Math.abs(v)
  const sign = v < 0 ? "-" : ""
  const f = (num, suffix) => `${sign}${num}${suffix}`

  if (abs >= 1e12) return f((abs / 1e12).toFixed(2).replace(/\.?0+$/, ""), "T")
  if (abs >= 1e9) return f((abs / 1e9).toFixed(2).replace(/\.?0+$/, ""), "B")
  if (abs >= 1e6) return f((abs / 1e6).toFixed(2).replace(/\.?0+$/, ""), "M")
  if (abs >= 1e3) return f((abs / 1e3).toFixed(1).replace(/\.?0+$/, ""), "K")
  return `${v}`
}

function fmtPct(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return "—"
  return `${v.toFixed(1).replace(/\.0$/, "")}%`
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function latestNonZeroPoint(years = [], values = []) {
  for (let i = values.length - 1; i >= 0; i--) {
    const v = Number(values[i])
    const y = Number(years[i])
    if (Number.isFinite(v) && Number.isFinite(y) && v !== 0) {
      return { year: y, value: v, index: i }
    }
  }
  for (let i = values.length - 1; i >= 0; i--) {
    const v = Number(values[i])
    const y = Number(years[i])
    if (Number.isFinite(v) && Number.isFinite(y)) {
      return { year: y, value: v, index: i }
    }
  }
  return { year: null, value: null, index: null }
}

function buildLine(values, w, h, pad) {
  const pts = (values || []).map((v) => (v == null ? null : Number(v)))
  const idxs = pts.map((v, i) => (Number.isFinite(v) ? i : null)).filter((x) => x != null)

  if (idxs.length < 2) {
    return { line: "", area: "", xs: [], ys: [] }
  }

  const numeric = idxs.map((i) => pts[i])
  const min = Math.min(...numeric)
  const max = Math.max(...numeric)
  const span = Math.max(1e-9, max - min)

  const innerW = Math.max(1, w - pad * 2)
  const innerH = Math.max(1, h - pad * 2)

  const xAt = (i) => pad + (i / (pts.length - 1)) * innerW
  const yAt = (v) => pad + (1 - (v - min) / span) * innerH

  const xs = pts.map((_, i) => xAt(i))
  const ys = pts.map((v) => (Number.isFinite(v) ? yAt(v) : null))

  let d = ""
  let started = false
  for (let i = 0; i < pts.length; i++) {
    const v = pts[i]
    if (!Number.isFinite(v)) {
      started = false
      continue
    }
    const x = xs[i]
    const y = ys[i]
    if (!started) {
      d += `M ${x} ${y}`
      started = true
    } else {
      d += ` L ${x} ${y}`
    }
  }

  const finitePoints = idxs.map((i) => ({ x: xs[i], y: ys[i] }))
  const baseY = pad + innerH
  let area = ""
  if (finitePoints.length >= 2) {
    area = `M ${finitePoints[0].x} ${finitePoints[0].y}`
    for (let k = 1; k < finitePoints.length; k++) {
      area += ` L ${finitePoints[k].x} ${finitePoints[k].y}`
    }
    area += ` L ${finitePoints[finitePoints.length - 1].x} ${baseY} L ${finitePoints[0].x} ${baseY} Z`
  }

  return { line: d, area, xs, ys }
}

function MiniLineChart({
  years = [],
  values = [],
  height = 92,
  formatValue = (v) => `${v}`,
  ariaLabel = "chart",
  pinnedPoint = null,
}) {
  const w = 460
  const h = height
  const pad = 18

  const { line, area, xs, ys } = useMemo(() => buildLine(values, w, h, pad), [values])
  const hasData = useMemo(
    () => (values || []).some((v) => Number.isFinite(Number(v))),
    [values]
  )

  const [hoverIdx, setHoverIdx] = useState(null)
  const hostRef = useRef(null)

  const onMove = (e) => {
    if (!hostRef.current) return
    if (!years.length) return
    const rect = hostRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const t = clamp(x / rect.width, 0, 1)
    const i = Math.round(t * (years.length - 1))
    setHoverIdx(clamp(i, 0, years.length - 1))
  }

  const onLeave = () => setHoverIdx(null)

  const hv = hoverIdx != null ? values[hoverIdx] : null
  const hy = hoverIdx != null ? years[hoverIdx] : null
  const hx = hoverIdx != null && xs?.length ? xs[hoverIdx] : null
  const hvOk = Number.isFinite(Number(hv))

  const pIdx = pinnedPoint?.index
  const pOk = pIdx != null && xs?.length && ys?.length && ys[pIdx] != null
  const px = pOk ? xs[pIdx] : null
  const py = pOk ? ys[pIdx] : null

  return (
    <Box
      ref={hostRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      sx={{
        width: "100%",
        position: "relative",
        borderRadius: 2.25,
        px: 0.8,
        py: 0.6,
        overflow: "hidden",
        background: "rgba(255,255,255,0.02)",
      }}
      aria-label={ariaLabel}
    >
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id={`strokeGrad-${ariaLabel}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(124,58,237,0.95)" />
            <stop offset="45%" stopColor="rgba(79,70,229,0.92)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.82)" />
          </linearGradient>
          <linearGradient id={`fillGrad-${ariaLabel}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(124,58,237,0.22)" />
            <stop offset="55%" stopColor="rgba(79,70,229,0.10)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.04)" />
          </linearGradient>
          <filter id={`glow-${ariaLabel}`}>
            <feGaussianBlur stdDeviation="2.1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={`g-${t}`}
            x1={pad}
            x2={w - pad}
            y1={pad + (h - pad * 2) * t}
            y2={pad + (h - pad * 2) * t}
            stroke="rgba(216,229,254,0.08)"
            strokeWidth="1"
          />
        ))}

        {area ? <path d={area} fill={`url(#fillGrad-${ariaLabel})`} /> : null}
        {line ? (
          <path
            d={line}
            fill="none"
            stroke={`url(#strokeGrad-${ariaLabel})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#glow-${ariaLabel})`}
          />
        ) : null}

        {pOk ? (
          <g>
            <line
              x1={px}
              x2={px}
              y1={pad}
              y2={h - pad}
              stroke="rgba(216,229,254,0.12)"
              strokeWidth="1"
            />
            <circle
              cx={px}
              cy={py}
              r={8}
              fill="rgba(34,211,238,0.10)"
              stroke="rgba(34,211,238,0.28)"
              strokeWidth="1"
            />
            <circle cx={px} cy={py} r={3.8} fill="rgba(34,211,238,0.95)" opacity={0.98} />
          </g>
        ) : null}

        {hasData
          ? years.map((year, i) => {
              const v = values[i]
              const x = xs[i]
              const y = ys[i]
              if (!Number.isFinite(Number(v)) || y == null) return null
              const isHover = hoverIdx === i
              return (
                <g key={`pt-${i}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHover ? 4.0 : 2.6}
                    fill={isHover ? "rgba(34,211,238,0.95)" : "rgba(245,248,255,0.88)"}
                    opacity={isHover ? 0.96 : 0.5}
                  />
                </g>
              )
            })
          : null}

        {hoverIdx != null && hx != null ? (
          <line
            x1={hx}
            x2={hx}
            y1={pad}
            y2={h - pad}
            stroke="rgba(216,229,254,0.14)"
            strokeWidth="1"
          />
        ) : null}
      </svg>

      {hoverIdx != null ? (
        <Box
          sx={{
            position: "absolute",
            top: 8,
            left: 8,
            pointerEvents: "none",
            borderRadius: 2,
            px: 1,
            py: 0.7,
            background: "rgba(0,0,0,0.70)",
            boxShadow: "0 16px 50px rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Typography sx={{ color: "rgba(245,248,255,0.92)", fontWeight: 950, fontSize: 12 }}>
            {hy ?? "—"}
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.78)", fontSize: 12 }}>
            {hvOk ? formatValue(hv) : "No data"}
          </Typography>
        </Box>
      ) : null}
    </Box>
  )
}

const IND = {
  population: "SP.POP.TOTL",
  internetPct: "IT.NET.USER.ZS",
  povertyPct: "SI.POV.DDAY",
}

async function parseResponseSafely(res) {
  const text = await res.text()
  if (!text) return { json: null, text: "" }

  try {
    return { json: JSON.parse(text), text }
  } catch {
    return { json: null, text }
  }
}

async function fetchRecentSeries({
  country = "WLD",
  indicator,
  mrnev = 30,
  gapfill = "N",
  signal,
}) {
  if (!indicator) {
    throw new Error("World Bank indicator is missing before request is made.")
  }

  const qs = new URLSearchParams({
    country: String(country),
    indicator: String(indicator),
    mrnev: String(mrnev),
    gapfill: String(gapfill),
  })

  const res = await fetch(`/api/worldbank-series?${qs.toString()}`, { signal })
  const { json, text } = await parseResponseSafely(res)

  if (!res.ok) {
    throw new Error(
      json?.error ||
        json?.message ||
        json?.upstreamBody ||
        text ||
        `World Bank proxy request failed (${res.status})`
    )
  }

  const rows = Array.isArray(json) ? json : Array.isArray(json?.rows) ? json.rows : []

  return rows
    .map((r) => ({
      year: Number(r?.year),
      value: r?.value == null ? null : Number(r.value),
    }))
    .filter((r) => Number.isFinite(r.year))
    .sort((a, b) => a.year - b.year)
}

function mergeByYear(seriesMap) {
  const map = new Map()
  const add = (arr, key) => {
    for (const r of arr || []) {
      if (!map.has(r.year)) map.set(r.year, { year: r.year })
      map.get(r.year)[key] = r.value
    }
  }
  add(seriesMap.population, "population")
  add(seriesMap.povertyPct, "povertyPct")
  add(seriesMap.internetPct, "internetPct")
  return Array.from(map.values()).sort((a, b) => a.year - b.year)
}

function prettyIsoDate(iso) {
  if (!iso) return ""
  return String(iso).slice(0, 10)
}

export default function WorldStatsMiniChartsDetailed({
  country = "WLD",
  headerTitle = "World Stats",
  headerSubtitle = "Population, global poverty, and internet usage over time (World Bank).",
  showPageSection = false,
  lastUpdatedLabel = "Live (World Bank API)",
  points = 30,
}) {
  const [pt, setPt] = useState(points)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [rows, setRows] = useState([])

  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsErr, setEventsErr] = useState("")
  const [events, setEvents] = useState([])
  const [eventsStale, setEventsStale] = useState(false)

  useEffect(() => setPt(points), [points])

  useEffect(() => {
    const ac = new AbortController()
    let mounted = true

    async function run() {
      setLoading(true)
      setErr("")
      try {
        const [population, internetPct, povertyPct] = await Promise.all([
          fetchRecentSeries({
            country,
            indicator: IND.population,
            mrnev: pt,
            gapfill: "N",
            signal: ac.signal,
          }),
          fetchRecentSeries({
            country,
            indicator: IND.internetPct,
            mrnev: pt,
            gapfill: "N",
            signal: ac.signal,
          }),
          fetchRecentSeries({
            country,
            indicator: IND.povertyPct,
            mrnev: pt,
            gapfill: "Y",
            signal: ac.signal,
          }),
        ])

        const merged = mergeByYear({ population, povertyPct, internetPct })
        if (mounted) setRows(merged)
      } catch (e) {
        if (e?.name === "AbortError") return
        if (mounted) {
          setRows([])
          setErr(e?.message || "Failed to load World Bank data.")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
      ac.abort()
    }
  }, [country, pt])

  useEffect(() => {
    const ac = new AbortController()
    let mounted = true

    async function run() {
      setEventsLoading(true)
      setEventsErr("")
      try {
        const res = await fetch(`/api/news-sci-tech?max=5&days=14`, {
          signal: ac.signal,
        })
        const { json, text } = await parseResponseSafely(res)

        if (!res.ok) {
          throw new Error(
            json?.error ||
              json?.message ||
              text ||
              `Events request failed (${res.status})`
          )
        }

        const list = Array.isArray(json?.events) ? json.events : []

        if (mounted) {
          setEvents(list)
          setEventsStale(Boolean(json?.stale))
        }
      } catch (e) {
        if (e?.name === "AbortError") return
        if (mounted) {
          setEvents([])
          setEventsStale(false)
          setEventsErr(e?.message || "Failed to load recent events.")
        }
      } finally {
        if (mounted) setEventsLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
      ac.abort()
    }
  }, [])

  const years = useMemo(() => rows.map((r) => r.year), [rows])
  const populationVals = useMemo(() => rows.map((r) => r.population ?? null), [rows])
  const povertyVals = useMemo(() => rows.map((r) => r.povertyPct ?? null), [rows])
  const internetVals = useMemo(() => rows.map((r) => r.internetPct ?? null), [rows])

  const latestPop = useMemo(
    () => latestNonZeroPoint(years, populationVals),
    [years, populationVals]
  )
  const latestPov = useMemo(
    () => latestNonZeroPoint(years, povertyVals),
    [years, povertyVals]
  )
  const latestNet = useMemo(
    () => latestNonZeroPoint(years, internetVals),
    [years, internetVals]
  )

  const StatCard = ({ title, subtitle, hint, years, series, formatValue, pinnedPoint }) => (
    <Box
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        background: "rgba(0,0,0,0.28)",
        p: { xs: 1.15, sm: 1.3 },
        backdropFilter: "blur(10px)",
      }}
    >
      <Stack spacing={0.8}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography
            sx={{
              color: "rgba(245, 248, 255, 0.92)",
              fontWeight: 950,
              fontSize: 14.25,
              lineHeight: 1.2,
            }}
          >
            {title}
          </Typography>

          <Chip
            label={hint}
            size="small"
            sx={{
              borderRadius: 999,
              fontWeight: 900,
              color: "rgba(216, 229, 254, 0.90)",
              background: "rgba(255,255,255,0.06)",
              height: 24,
            }}
          />
        </Stack>

        {subtitle ? (
          <Typography
            sx={{
              color: "rgba(216, 229, 254, 0.70)",
              fontSize: 12.5,
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </Typography>
        ) : null}

        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.96)",
              fontWeight: 950,
              fontSize: 20,
              lineHeight: 1.05,
            }}
          >
            {pinnedPoint?.value == null ? "—" : formatValue(pinnedPoint.value)}
          </Typography>

          {pinnedPoint?.year ? (
            <Typography sx={{ color: "rgba(216, 229, 254, 0.62)", fontSize: 12 }}>
              ({pinnedPoint.year})
            </Typography>
          ) : null}
        </Stack>

        <MiniLineChart
          years={years}
          values={series}
          formatValue={formatValue}
          ariaLabel={title}
          pinnedPoint={pinnedPoint}
        />

        <Typography sx={{ color: "rgba(216, 229, 254, 0.55)", fontSize: 12 }}>
          {years.length ? `${years[0]} – ${years[years.length - 1]}` : "No data"}
        </Typography>
      </Stack>
    </Box>
  )

  const content = (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        px: 0,
        pb: { xs: 0, sm: 0, md: 0 },
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Stack spacing={0}>
          <RevealOnScroll>
            <Box
              sx={{
                position: "relative",
                borderRadius: 0,
                overflow: "hidden",
                p: 0,
                width: "100%",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  minHeight: {
                    xs: 860,
                    sm: 760,
                    md: 860,
                    lg: 920,
                    xl: 980,
                  },
                  width: "100%",
                }}
              >
                <Box
                  component="video"
                  src="/data/earth.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center 45%",
                    filter: "brightness(0.95) contrast(1.05)",
                    transform: "translateZ(0)",
                    zIndex: 0,
                  }}
                />

                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "radial-gradient(ellipse at center, rgba(0,0,0,0) 65%, rgba(0,0,0,1) 72%)",
                    zIndex: 1,
                  }}
                />

                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.70) 100%)",
                    opacity: 0.55,
                    zIndex: 1,
                  }}
                />

                {loading ? (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 14,
                      left: 14,
                      zIndex: 3,
                      borderRadius: 2.5,
                      background: "rgba(0,0,0,0.72)",
                      px: 1.25,
                      py: 1,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={16} />
                      <Typography sx={{ color: "rgba(245,248,255,0.92)", fontWeight: 900 }}>
                        Loading World Bank data…
                      </Typography>
                    </Stack>
                  </Box>
                ) : null}

                {err ? (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 14,
                      left: 14,
                      right: 14,
                      zIndex: 3,
                      borderRadius: 2.5,
                      background: "rgba(0,0,0,0.72)",
                      px: 1.25,
                      py: 1,
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Typography sx={{ color: "rgba(255,160,160,0.92)", fontWeight: 900 }}>
                      {err}
                    </Typography>
                  </Box>
                ) : null}

                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    pt: { xs: 2.25, sm: 2.25, md: 2.0 },
                    pb: { xs: 2.75, sm: 2.75, md: 3.0 },
                    px: { xs: 1.0, sm: 1.25, md: 1.5 },
                    display: "grid",
                    gap: { xs: 1.2, sm: 1.3, md: 1.2 },
                    gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" },
                    gridTemplateRows: { xs: "auto", md: "auto auto auto" },
                    alignContent: "start",
                    justifyItems: { xs: "center", md: "stretch" },
                  }}
                >
                  <Box
                    sx={{
                      gridColumn: { xs: "1 / -1", md: "1 / span 5" },
                      gridRow: { xs: "auto", md: "1" },
                      width: "100%",
                      maxWidth: { xs: 520, md: 410 },
                    }}
                  >
                    <StatCard
                      title="Population"
                      subtitle="Total population (SP.POP.TOTL)."
                      hint="People"
                      years={years}
                      series={populationVals}
                      formatValue={fmtCompact}
                      pinnedPoint={latestPop}
                    />
                  </Box>

                  <Box
                    sx={{
                      gridColumn: { xs: "1 / -1", md: "8 / span 5" },
                      gridRow: { xs: "auto", md: "2" },
                      width: "100%",
                      maxWidth: { xs: 520, md: 410 },
                      justifySelf: { xs: "center", md: "end" },
                    }}
                  >
                    <StatCard
                      title="Internet Users"
                      subtitle="Individuals using the Internet % (IT.NET.USER.ZS)."
                      hint="%"
                      years={years}
                      series={internetVals}
                      formatValue={fmtPct}
                      pinnedPoint={latestNet}
                    />
                  </Box>

                  <Box
                    sx={{
                      gridColumn: { xs: "1 / -1", md: "1 / span 5" },
                      gridRow: { xs: "auto", md: "3" },
                      width: "100%",
                      maxWidth: { xs: 520, md: 410 },
                    }}
                  >
                    <StatCard
                      title="World Poverty"
                      subtitle="Poverty headcount $2.15/day % (SI.POV.DDAY) — sparse; gapfill enabled."
                      hint="%"
                      years={years}
                      series={povertyVals}
                      formatValue={fmtPct}
                      pinnedPoint={latestPov}
                    />
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  background: "rgba(0,0,0,0.35)",
                  p: { xs: 1.5, sm: 1.75 },
                  width: "100%",
                }}
              >
                <Stack spacing={1.15}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1}
                  >
                    <GradientTitle
                      variant="h6"
                      align="left"
                      sx={{ letterSpacing: 0.9, textShadow: "none" }}
                    >
                      Recent Global Tech & Economy Events
                    </GradientTitle>

                    <Chip
                      label={eventsStale ? "Stale cache" : "Live (NewsAPI)"}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 900,
                        color: "rgba(216, 229, 254, 0.90)",
                        background: "rgba(255,255,255,0.06)",
                      }}
                    />
                  </Stack>

                  <Typography
                    sx={{
                      color: "rgba(216,229,254,0.68)",
                      fontSize: 13.25,
                      lineHeight: 1.55,
                    }}
                  >
                    Headlines from the last ~2 weeks, filtered for science & technology.
                  </Typography>

                  {eventsErr ? (
                    <Typography sx={{ color: "rgba(255,160,160,0.92)", fontWeight: 900 }}>
                      {eventsErr}
                    </Typography>
                  ) : null}

                  {eventsLoading ? (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.75 }}>
                      <CircularProgress size={16} />
                      <Typography sx={{ color: "rgba(216,229,254,0.68)", fontSize: 12.5 }}>
                        Loading events…
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={1}>
                      {events?.length ? (
                        events.map((ev, i) => {
                          const date = prettyIsoDate(ev.publishedAt) || "—"
                          const src = ev.source || "source"
                          return (
                            <Box
                              key={`${ev.url}-${i}`}
                              sx={{
                                borderRadius: 2.5,
                                background: "rgba(255,255,255,0.03)",
                                px: 1.25,
                                py: 1,
                              }}
                            >
                              <Typography
                                sx={{
                                  color: "rgba(245,248,255,0.92)",
                                  fontWeight: 950,
                                  fontSize: 14.25,
                                  lineHeight: 1.35,
                                }}
                              >
                                <Link
                                  href={ev.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  underline="hover"
                                  sx={{
                                    color: "rgba(245,248,255,0.92)",
                                    "&:hover": { color: "rgba(34,211,238,0.95)" },
                                  }}
                                >
                                  {ev.title}
                                </Link>
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.5,
                                  color: "rgba(216,229,254,0.62)",
                                  fontSize: 12.5,
                                }}
                              >
                                {date} • {src}
                              </Typography>
                            </Box>
                          )
                        })
                      ) : (
                        <Typography sx={{ color: "rgba(216,229,254,0.68)", fontSize: 13 }}>
                          No recent events found in the current window.
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Box>
          </RevealOnScroll>
        </Stack>
      </Box>
    </Box>
  )

  return showPageSection ? (
    <Box sx={{ width: "100%", backgroundColor: "black" }}>{content}</Box>
  ) : (
    <Box sx={{ width: "100%" }}>{content}</Box>
  )
}