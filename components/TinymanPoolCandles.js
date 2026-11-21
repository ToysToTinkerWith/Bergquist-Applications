import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from "@mui/material"
import QueryStatsIcon from "@mui/icons-material/QueryStats"
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined"
import RefreshIcon from "@mui/icons-material/Refresh"
import CheckIcon from "@mui/icons-material/Check"
import WaterIcon from "@mui/icons-material/Water"
import { motion } from "framer-motion"

const NETWORK_ID = 0
const ALGO_ASSET_ID = 0
const USDC_ASSET_ID = 31566704
const DEFAULT_LIMIT = 60

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
    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
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
        if (entry?.isIntersecting) {
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

function SubText({ children, sx = {} }) {
  return (
    <Typography
      variant="body1"
      sx={{
        color: "rgba(216, 229, 254, 0.84)",
        lineHeight: 1.75,
        ...sx,
      }}
    >
      {children}
    </Typography>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.03) 100%)",
        border: "1px solid rgba(216, 229, 254, 0.10)",
        boxShadow: "0 18px 55px rgba(0,0,0,0.35)",
        color: "white",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 1.6 }}>
        <Stack direction="row" spacing={1.1} alignItems="center">
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(34,211,238,0.14))",
              border: "1px solid rgba(216,229,254,0.12)",
              color: "rgba(216,229,254,0.9)",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "rgba(216,229,254,0.66)",
                fontSize: 12.5,
                fontWeight: 700,
                letterSpacing: 0.25,
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.97)",
                fontSize: 22,
                fontWeight: 900,
                lineHeight: 1.15,
                wordBreak: "break-word",
              }}
            >
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

function formatPrice(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return "—"
  if (num >= 1) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })
  }
  if (num >= 0.01) {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 8,
    })
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 6,
    maximumFractionDigits: 10,
  })
}

function formatCompactNumber(value, digits = 4) {
  const num = Number(value)
  if (!Number.isFinite(num)) return "—"
  if (num === 0) return "0"
  if (Math.abs(num) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
      notation: "compact",
    }).format(num)
  }
  return num.toLocaleString("en-US", {
    maximumFractionDigits: digits,
  })
}

function formatDateTime(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value || "")
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d)
}

function normalizeArrayPayload(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.assets)) return data.assets
  if (Array.isArray(data?.candles)) return data.candles
  return []
}

function normalizeAsset(item) {
  if (!item || typeof item !== "object") return null

  const id =
    item.id ??
    item.asset_id ??
    item.assetId ??
    item.index ??
    item.assetID ??
    null

  if (id === null || id === undefined || Number.isNaN(Number(id))) return null

  return {
    id: Number(id),
    name:
      item.name ||
      item.asset_name ||
      item.assetName ||
      item.display_name ||
      `Asset ${id}`,
    unitName:
      item.unit_name ||
      item.unitName ||
      item.symbol ||
      item.ticker ||
      String(id),
    decimals: Number(item.decimals ?? 0),
    verified: Boolean(item.verified ?? item.is_verified ?? false),
  }
}

function normalizeCandle(item) {
  if (!item || typeof item !== "object") return null

  const rawTs =
    item.timestamp ??
    item.time ??
    item.start_time ??
    item.startTime ??
    item.started_at ??
    item.startedAt ??
    item.date

  const ts =
    typeof rawTs === "number" && rawTs < 1000000000000
      ? rawTs * 1000
      : Number(rawTs)

  const open = Number(item.open ?? item.o)
  const high = Number(item.high ?? item.h)
  const low = Number(item.low ?? item.l)
  const close = Number(item.close ?? item.c)
  const volume = Number(item.volume ?? item.v ?? 0)

  if (
    !Number.isFinite(ts) ||
    !Number.isFinite(open) ||
    !Number.isFinite(high) ||
    !Number.isFinite(low) ||
    !Number.isFinite(close)
  ) {
    return null
  }

  return {
    time: new Date(ts).toISOString(),
    open,
    high,
    low,
    close,
    volume: Number.isFinite(volume) ? volume : 0,
  }
}

async function fetchJson(url) {
  const res = await fetch(url, {
    method: "GET",
  })

  const rawText = await res.text()
  let data = null

  try {
    data = rawText ? JSON.parse(rawText) : null
  } catch {
    data = null
  }

  if (!res.ok) {
    const detail =
      (Array.isArray(data?.detail)
        ? data.detail.map((d) => d?.msg).filter(Boolean).join(" ")
        : null) ||
      data?.detail ||
      data?.message ||
      data?.error ||
      rawText ||
      `Request failed (${res.status})`

    throw new Error(detail)
  }

  return data
}

export async function resolveAsset(query) {
  const trimmed = String(query || "").trim()

  if (!trimmed) {
    return {
      id: ALGO_ASSET_ID,
      name: "Algorand",
      unitName: "ALGO",
      decimals: 6,
      verified: true,
    }
  }

  if (/^\d+$/.test(trimmed)) {
    const numericId = Number(trimmed)
    return {
      id: numericId,
      name: numericId === 0 ? "Algorand" : `Asset ${numericId}`,
      unitName: numericId === 0 ? "ALGO" : String(numericId),
      decimals: 6,
      verified: numericId === 0,
    }
  }

  const upper = trimmed.toUpperCase()

  if (upper === "ALGO") {
    return {
      id: ALGO_ASSET_ID,
      name: "Algorand",
      unitName: "ALGO",
      decimals: 6,
      verified: true,
    }
  }

  if (upper === "USDC") {
    return {
      id: USDC_ASSET_ID,
      name: "USD Coin",
      unitName: "USDC",
      decimals: 6,
      verified: true,
    }
  }

  const data = await fetchJson(
    `/api/vestige/assets/search?query=${encodeURIComponent(trimmed)}&networkId=${NETWORK_ID}`
  )

  const items = normalizeArrayPayload(data).map(normalizeAsset).filter(Boolean)

  if (!items.length) {
    throw new Error("Could not resolve that asset. Try ALGO, USDC, or an asset id.")
  }

  const lower = trimmed.toLowerCase()

  const exact =
    items.find(
      (item) =>
        String(item.unitName || "").toLowerCase() === lower ||
        String(item.name || "").toLowerCase() === lower
    ) ||
    items.find((item) => item.verified) ||
    items[0]

  if (!exact) {
    throw new Error("Could not resolve that asset. Try ALGO, USDC, or an asset id.")
  }

  return exact
}

function buildCandleWindow({ limitValue }) {
  const intervalMinutes = 1440
  const requested = Math.max(10, Number(limitValue) || DEFAULT_LIMIT)
  const count = Math.min(requested, 90)
  const end = Math.floor(Date.now() / 1000)
  const start = end - count * intervalMinutes * 60

  return {
    start,
    end,
    interval: intervalMinutes,
    limit: count,
  }
}

async function fetchCandlesAttempt({
  assetId,
  denominatingAssetId,
  limitValue,
}) {
  const { start, end, interval, limit } = buildCandleWindow({
    limitValue,
  })

  const url =
    `/api/vestige/candles?assetId=${encodeURIComponent(assetId)}` +
    `&denominatingAssetId=${encodeURIComponent(denominatingAssetId)}` +
    `&interval=${encodeURIComponent(interval)}` +
    `&start=${encodeURIComponent(start)}` +
    `&end=${encodeURIComponent(end)}` +
    `&limit=${encodeURIComponent(limit)}` +
    `&networkId=${encodeURIComponent(NETWORK_ID)}`

  const data = await fetchJson(url)

  const candles = normalizeArrayPayload(data)
    .map(normalizeCandle)
    .filter(Boolean)
    .sort((a, b) => new Date(a.time) - new Date(b.time))

  if (candles.length) {
    return candles
  }

  throw new Error("No candle data returned.")
}

export async function fetchCandles({
  assetId,
  denominatingAssetId,
  limitValue,
}) {
  let nextLimit = Math.max(10, Number(limitValue) || DEFAULT_LIMIT)
  let lastError = null

  for (let i = 0; i < 5; i += 1) {
    try {
      return await fetchCandlesAttempt({
        assetId,
        denominatingAssetId,
        limitValue: nextLimit,
      })
    } catch (err) {
      lastError = err

      const msg = String(err?.message || "").toLowerCase()
      if (!msg.includes("too many candles")) {
        throw err
      }

      if (nextLimit <= 10) {
        break
      }

      nextLimit = Math.max(10, Math.floor(nextLimit / 2))
    }
  }

  throw lastError || new Error("Could not load candle data.")
}

function useElementSize() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === "undefined") return

    const el = ref.current
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      setSize({
        width: entry.contentRect.width || 0,
        height: entry.contentRect.height || 0,
      })
    })

    obs.observe(el)
    return () => {
      try {
        obs.disconnect()
      } catch {}
    }
  }, [])

  return [ref, size]
}

export function CandlestickChart({ data, height = 380, quoteLabel = "USDC" }) {
  const [wrapRef, size] = useElementSize()
  const [hoverIndex, setHoverIndex] = useState(null)

  const width = Math.max(size.width || 0, 320)
  const padding = { top: 14, right: 14, bottom: 28, left: 62 }
  const chartW = Math.max(width - padding.left - padding.right, 10)
  const chartH = Math.max(height - padding.top - padding.bottom, 10)

  const values = useMemo(() => {
    const highs = data.map((d) => d.high)
    const lows = data.map((d) => d.low)
    const min = Math.min(...lows)
    const max = Math.max(...highs)
    const span = Math.max(max - min, max * 0.02, 0.00000001)

    return {
      min: min - span * 0.05,
      max: max + span * 0.05,
    }
  }, [data])

  const yFor = (price) => {
    const range = values.max - values.min || 1
    const normalized = (price - values.min) / range
    return padding.top + chartH - normalized * chartH
  }

  const step = chartW / Math.max(data.length, 1)
  const bodyW = Math.max(Math.min(step * 0.58, 14), 3)
  const hovered = hoverIndex === null ? null : data[hoverIndex]

  return (
    <Box
      ref={wrapRef}
      sx={{
        width: "100%",
        height,
        position: "relative",
        borderRadius: 1,
        overflow: "hidden",
        background: "black",
        border: "none",
      }}
    >
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" tabIndex={0} aria-label="Price candles. Use left and right arrow keys to inspect prices." onBlur={() => setHoverIndex(null)} onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(event.key)) return
        event.preventDefault()
        setHoverIndex(current => event.key === "Escape" ? null : event.key === "Home" ? 0 : event.key === "End" ? data.length - 1 : Math.max(0, Math.min(data.length - 1, (current ?? data.length - 1) + (event.key === "ArrowLeft" ? -1 : 1))))
      }}>
        {[0, 1, 2, 3, 4].map((idx) => {
          const y = padding.top + (chartH * idx) / 4
          const value = values.max - ((values.max - values.min) * idx) / 4

          return (
            <g key={idx}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="rgba(216,229,254,0.08)"
                strokeDasharray="4 6"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fill="rgba(216,229,254,0.65)"
                fontSize="11"
              >
                {Math.abs(value) < .0001 ? value.toExponential(1) : new Intl.NumberFormat("en-US", { maximumFractionDigits: 4, notation: "compact" }).format(value)}
              </text>
            </g>
          )
        })}

        {data.map((candle, index) => {
          const xCenter = padding.left + index * step + step / 2
          const wickTop = yFor(candle.high)
          const wickBottom = yFor(candle.low)
          const openY = yFor(candle.open)
          const closeY = yFor(candle.close)
          const bodyTop = Math.min(openY, closeY)
          const bodyBottom = Math.max(openY, closeY)
          const bodyHeight = Math.max(bodyBottom - bodyTop, 1.5)
          const bullish = candle.close >= candle.open

          const fill = bullish ? "#98c5b3" : "#b0a0ec"
          const stroke = bullish
            ? "#98c5b3"
            : "#b0a0ec"

          return (
            <g key={candle.time}>
              <line
                x1={xCenter}
                x2={xCenter}
                y1={wickTop}
                y2={wickBottom}
                stroke={stroke}
                strokeWidth="1.5"
              />
              <rect
                x={xCenter - bodyW / 2}
                y={bodyTop}
                width={bodyW}
                height={bodyHeight}
                rx="1.5"
                fill={fill}
                stroke={stroke}
                strokeWidth="1"
              />
              <rect
                x={xCenter - Math.max(step / 2, 6)}
                y={padding.top}
                width={Math.max(step, 12)}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          )
        })}

        {data
          .filter((_, i) => i % Math.max(1, Math.ceil(data.length / (width < 480 ? 4 : 6))) === 0)
          .map((candle) => {
            const index = data.findIndex((d) => d.time === candle.time)
            const x = padding.left + index * step + step / 2

            return (
              <text
                key={`x-${candle.time}`}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fill="rgba(216,229,254,0.62)"
                fontSize="11"
              >
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                }).format(new Date(candle.time))}
              </text>
            )
          })}
      </svg>

      {hovered ? (
        <Box
          role="status"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            minWidth: 210,
            p: 1.2,
            borderRadius: 2,
            background: "rgba(7,10,18,0.92)",
            border: "1px solid rgba(216,229,254,0.12)",
            boxShadow: "0 14px 30px rgba(0,0,0,0.35)",
            pointerEvents: "none",
          }}
        >
          <Typography
            sx={{
              color: "rgba(255,255,255,0.95)",
              fontWeight: 900,
              fontSize: 13.5,
              mb: 0.4,
            }}
          >
            {formatDateTime(hovered.time)}
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.74)", fontSize: 12.5 }}>
            Open: {formatPrice(hovered.open)} {quoteLabel}
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.74)", fontSize: 12.5 }}>
            High: {formatPrice(hovered.high)} {quoteLabel}
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.74)", fontSize: 12.5 }}>
            Low: {formatPrice(hovered.low)} {quoteLabel}
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.74)", fontSize: 12.5 }}>
            Close: {formatPrice(hovered.close)} {quoteLabel}
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.62)", fontSize: 12 }}>
            Volume: {formatCompactNumber(hovered.volume, 2)}
          </Typography>
        </Box>
      ) : null}
    </Box>
  )
}

export default function TinymanPoolCandles({
  title = "Tinyman Pool Candles",
  subtitle = "Start with ALGO / USDC, then type any Algorand asset name, unit name, or asset id to load its USDC-denominated daily candles from Vestige.",
  lastUpdated = "March 14, 2026",
  showPageSection = true,
  defaultAssetQuery = "ALGO",
  defaultLimit = DEFAULT_LIMIT,
}) {
  const [assetQuery, setAssetQuery] = useState(defaultAssetQuery)
  const [selectedAsset, setSelectedAsset] = useState({
    id: ALGO_ASSET_ID,
    name: "Algorand",
    unitName: "ALGO",
    decimals: 6,
    verified: true,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [candles, setCandles] = useState([])

  async function loadForQuery(nextQuery = assetQuery) {
    try {
      setError("")
      setLoading(true)

      const asset = await resolveAsset(nextQuery)
      const nextCandles = await fetchCandles({
        assetId: asset.id,
        denominatingAssetId: USDC_ASSET_ID,
        limitValue: defaultLimit,
      })

      setSelectedAsset(asset)
      setCandles(nextCandles)
    } catch (err) {
      setError(err?.message || "Could not load candle data.")
      setCandles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForQuery(defaultAssetQuery)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const latest = useMemo(() => {
    return candles.length ? candles[candles.length - 1] : null
  }, [candles])

  const changePct = useMemo(() => {
    if (!latest || !Number.isFinite(latest.open) || latest.open === 0) return null
    return ((latest.close - latest.open) / latest.open) * 100
  }, [latest])

  const lowHigh = useMemo(() => {
    if (!candles.length) return { low: null, high: null }

    return candles.reduce(
      (acc, candle) => ({
        low: acc.low === null ? candle.low : Math.min(acc.low, candle.low),
        high: acc.high === null ? candle.high : Math.max(acc.high, candle.high),
      }),
      { low: null, high: null }
    )
  }, [candles])

  const content = (
    <Box
      sx={{
        width: "100%",
        pt: { xs: 7, sm: 8, md: 10 },
        pb: { xs: 3, sm: 4 },
        px: { xs: 2, sm: 3, md: 4 },
        display: "flex",
        justifyContent: "center",
        backgroundColor: "black",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1280 }}>
        <Stack spacing={{ xs: 2.5, sm: 3 }}>
          <RevealOnScroll delay={0.05}>
            <Box
              sx={{
                position: "relative",
                borderRadius: 3,
                overflow: "hidden",
                background: "black",
                border: "none",
                boxShadow: "none",
                p: { xs: 2, sm: 2.5, md: 3 },
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={2}
                  alignItems={{ xs: "stretch", lg: "center" }}
                  justifyContent="space-between"
                >
                  <Stack spacing={0.75}>
                    <GradientTitle
                      variant="h5"
                      sx={{ letterSpacing: 0.8, textShadow: "none" }}
                    >
                      {selectedAsset?.unitName || "ALGO"} / USDC
                    </GradientTitle>
                  </Stack>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <TextField
                      value={assetQuery}
                      onChange={(e) => setAssetQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          loadForQuery(assetQuery)
                        }
                      }}
                      placeholder="ALGO, USDC, asset id..."
                      size="small"
                      sx={{
                        minWidth: { xs: "100%", sm: 300 },
                        "& .MuiOutlinedInput-root": {
                          color: "rgba(255,255,255,0.94)",
                          background: "rgba(0,0,0,0.28)",
                          borderRadius: 999,
                          pr: 0.4,
                          "& fieldset": {
                            borderColor: "rgba(216, 229, 254, 0.14)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(216, 229, 254, 0.22)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "rgba(34,211,238,0.6)",
                          },
                        },
                        "& input::placeholder": {
                          color: "rgba(216,229,254,0.5)",
                          opacity: 1,
                        },
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              onClick={() => loadForQuery(assetQuery)}
                              disabled={loading}
                              variant="outlined"
                              sx={{
                                minWidth: 0,
                                width: 38,
                                height: 38,
                                borderRadius: "50%",
                                p: 0,
                                color: "rgba(216,229,254,0.92)",
                                borderColor: "rgba(216,229,254,0.16)",
                                background: "rgba(255,255,255,0.03)",
                                "&:hover": {
                                  borderColor: "rgba(34,211,238,0.35)",
                                  background: "rgba(255,255,255,0.06)",
                                },
                              }}
                            >
                              {loading ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                <CheckIcon fontSize="small" />
                              )}
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      onClick={() => loadForQuery(assetQuery)}
                      startIcon={
                        loading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <RefreshIcon />
                        )
                      }
                      variant="outlined"
                      sx={{
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 800,
                        color: "rgba(216,229,254,0.92)",
                        borderColor: "rgba(216,229,254,0.16)",
                        background: "rgba(255,255,255,0.03)",
                        "&:hover": {
                          borderColor: "rgba(124,58,237,0.35)",
                          background: "rgba(255,255,255,0.06)",
                        },
                      }}
                    >
                      Refresh
                    </Button>
                  </Stack>
                </Stack>

                {error ? (
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: 2,
                      background: "rgba(60, 0, 0, 0.45)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {error}
                  </Alert>
                ) : null}

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                  }}
                >
                  <StatCard
                    icon={<QueryStatsIcon />}
                    label="Selected asset"
                    value={selectedAsset?.unitName || "—"}
                  />
                  <StatCard
                    icon={<TimelineOutlinedIcon />}
                    label="Latest close"
                    value={latest ? `${formatPrice(latest.close)} USDC` : "—"}
                  />
                  <StatCard
                    icon={<WaterIcon />}
                    label="Range"
                    value={
                      lowHigh.low !== null && lowHigh.high !== null
                        ? `${formatPrice(lowHigh.low)} → ${formatPrice(lowHigh.high)}`
                        : "—"
                    }
                  />
                  <StatCard
                    icon={<RefreshIcon />}
                    label="Current candle"
                    value={
                      changePct === null
                        ? "—"
                        : `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`
                    }
                  />
                </Box>

                {loading ? (
                  <Stack
                    spacing={1.5}
                    alignItems="center"
                    justifyContent="center"
                    sx={{ minHeight: 320 }}
                  >
                    <CircularProgress />
                    <Typography
                      sx={{
                        color: "rgba(216,229,254,0.72)",
                        fontWeight: 700,
                      }}
                    >
                      Loading candles...
                    </Typography>
                  </Stack>
                ) : candles.length ? (
                  <Card
                    sx={{
                      borderRadius: 3,
                      background: "black",
                      border: "none",
                      boxShadow: "none",
                      color: "white",
                      overflow: "hidden",
                    }}
                  >
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Stack spacing={1}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          spacing={1}
                        >
                          <GradientTitle variant="h6" sx={{ textShadow: "none" }}>
                            {selectedAsset?.unitName || "Asset"} Candles
                          </GradientTitle>

                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Chip
                              label={`${candles.length} candles`}
                              size="small"
                              sx={{
                                borderRadius: 999,
                                fontWeight: 900,
                                color: "rgba(216, 229, 254, 0.94)",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(216, 229, 254, 0.14)",
                              }}
                            />
                            <Chip
                              label="Interval 1d"
                              size="small"
                              sx={{
                                borderRadius: 999,
                                fontWeight: 900,
                                color: "rgba(216, 229, 254, 0.94)",
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(216, 229, 254, 0.14)",
                              }}
                            />
                          </Stack>
                        </Stack>

                        <SubText
                          sx={{ fontSize: 14, color: "rgba(216,229,254,0.68)" }}
                        >
                          Hover a candle to inspect OHLC and volume.
                        </SubText>

                        <Divider sx={{ borderColor: "rgba(216,229,254,0.08)" }} />

                        <CandlestickChart
                          data={candles}
                          height={380}
                          quoteLabel="USDC"
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.04)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    No candles returned for this asset.
                  </Alert>
                )}
              </Stack>
            </Box>
          </RevealOnScroll>
        </Stack>
      </Box>
    </Box>
  )

  if (showPageSection) {
    return <Box sx={{ width: "100%", backgroundColor: "black" }}>{content}</Box>
  }

  return <Box sx={{ width: "100%", backgroundColor: "black" }}>{content}</Box>
}
