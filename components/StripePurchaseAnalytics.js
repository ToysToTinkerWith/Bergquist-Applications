// components/StripePurchaseAnalytics.jsx

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
  MenuItem,
} from "@mui/material"
import QueryStatsIcon from "@mui/icons-material/QueryStats"
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined"
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined"
import RefreshIcon from "@mui/icons-material/Refresh"
import { motion } from "framer-motion"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts"

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

function formatDateLabel(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(d)
}

function formatWholeTick(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value)) : value
}

function colorForIndex(index) {
  const palette = [
    "#7C3AED",
    "#4F46E5",
    "#22D3EE",
    "#06B6D4",
    "#A855F7",
    "#6366F1",
    "#2DD4BF",
    "#8B5CF6",
  ]
  return palette[index % palette.length]
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

export default function StripePurchaseAnalytics({
  title = "Purchase Analytics",
  subtitle = "Track how many of each Stripe product have been purchased and how purchases change over time.",
  lastUpdated = "March 11, 2026",
  analyticsApi = "/api/analytics/product-purchases",
  showPageSection = true,
  defaultDays = 90,
}) {
  const [days, setDays] = useState(String(defaultDays))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [payload, setPayload] = useState({
    generatedAt: "",
    range: null,
    totals: [],
    series: [],
    topProducts: [],
  })

  async function loadAnalytics(nextDays = days) {
    try {
      setLoading(true)
      setError("")

      const url = `${analyticsApi}?days=${encodeURIComponent(nextDays)}`
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load analytics.")
      }

      setPayload({
        generatedAt: data?.generatedAt || "",
        range: data?.range || null,
        totals: Array.isArray(data?.totals) ? data.totals : [],
        series: Array.isArray(data?.series) ? data.series : [],
        topProducts: Array.isArray(data?.topProducts) ? data.topProducts : [],
      })
    } catch (err) {
      setError(err.message || "Could not load analytics.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics(defaultDays)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalUnitsSold = useMemo(() => {
    return payload.totals.reduce(
      (sum, item) => sum + Number(item.totalQty || 0),
      0
    )
  }, [payload.totals])

  const bestSeller = useMemo(() => {
    if (!payload.totals.length) return "—"

    const winner = payload.totals.reduce((best, item) => {
      const bestQty = Number(best?.totalQty || 0)
      const itemQty = Number(item?.totalQty || 0)
      return itemQty > bestQty ? item : best
    }, payload.totals[0])

    const qty = Number(winner?.totalQty || 0)
    return qty > 0 ? `${winner.productName} (${qty})` : "—"
  }, [payload.totals])

  const chartProducts = useMemo(() => {
    return payload.topProducts.slice(0, 6)
  }, [payload.topProducts])

  const content = (
    <Box
      sx={{
        width: "100%",
        pt: { xs: 3, sm: 4, md: 5 },
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
                boxShadow: "none",
                p: { xs: 2, sm: 2.5, md: 3 },
              }}
            >
              <Stack
                direction={{ xs: "column", lg: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", lg: "center" }}
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Stack spacing={0.75}>
                  <SubText
                    sx={{ fontSize: 15, color: "rgba(216, 229, 254, 0.72)" }}
                  >
                    Completed purchase data aggregated by your backend API.
                  </SubText>
                </Stack>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.25}
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <TextField
                    select
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    size="small"
                    sx={{
                      minWidth: { xs: "100%", sm: 180 },
                      "& .MuiOutlinedInput-root": {
                        color: "rgba(255,255,255,0.94)",
                        background: "rgba(0,0,0,0.28)",
                        borderRadius: 999,
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
                    }}
                  >
                    <MenuItem value="7">Last 7 days</MenuItem>
                    <MenuItem value="30">Last 30 days</MenuItem>
                    <MenuItem value="90">Last 90 days</MenuItem>
                    <MenuItem value="180">Last 180 days</MenuItem>
                    <MenuItem value="365">Last 365 days</MenuItem>
                  </TextField>

                  <Button
                    onClick={() => loadAnalytics(days)}
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
                        borderColor: "rgba(34,211,238,0.35)",
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
                    mb: 2,
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
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <StatCard
                  icon={<ShoppingBagOutlinedIcon />}
                  label="Total units sold"
                  value={loading ? "…" : totalUnitsSold}
                />
                <StatCard
                  icon={<QueryStatsIcon />}
                  label="Tracked products"
                  value={loading ? "…" : payload.totals.length}
                />
                <StatCard
                  icon={<TimelineOutlinedIcon />}
                  label="Best seller"
                  value={loading ? "…" : bestSeller}
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
                    Loading analytics...
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
                      gap: 2,
                      alignItems: "stretch",
                    }}
                  >
                    <Card
                      sx={{
                        borderRadius: 3,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.03) 100%)",
                        border: "1px solid rgba(216, 229, 254, 0.10)",
                        boxShadow: "0 18px 55px rgba(0,0,0,0.35)",
                        color: "white",
                        overflow: "hidden",
                      }}
                    >
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Stack spacing={1}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <GradientTitle
                              variant="h6"
                              sx={{ textShadow: "none" }}
                            >
                              Units Purchased by Product
                            </GradientTitle>
                            <Chip
                              label={`${payload.totals.length} product${
                                payload.totals.length === 1 ? "" : "s"
                              }`}
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

                          <SubText
                            sx={{ fontSize: 14, color: "rgba(216,229,254,0.68)" }}
                          >
                            Total quantity sold for each product in the selected
                            range.
                          </SubText>

                          <Divider sx={{ borderColor: "rgba(216,229,254,0.08)" }} />

                          <Box sx={{ width: "100%", height: 360 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={payload.totals}
                                margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
                              >
                                <CartesianGrid
                                  stroke="rgba(255,255,255,0.08)"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="productName"
                                  tick={{
                                    fill: "rgba(216,229,254,0.72)",
                                    fontSize: 12,
                                  }}
                                  angle={-20}
                                  textAnchor="end"
                                  interval={0}
                                  height={70}
                                />
                                <YAxis
                                  allowDecimals={false}
                                  domain={[0, "auto"]}
                                  tickFormatter={formatWholeTick}
                                  tick={{
                                    fill: "rgba(216,229,254,0.72)",
                                    fontSize: 12,
                                  }}
                                />
                                <Tooltip
                                  formatter={(value) => [
                                    formatWholeTick(value),
                                    "Units",
                                  ]}
                                  contentStyle={{
                                    background: "rgba(10,10,16,0.95)",
                                    border: "1px solid rgba(216,229,254,0.14)",
                                    borderRadius: 12,
                                    color: "white",
                                  }}
                                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                                />
                                <Bar
                                  dataKey="totalQty"
                                  radius={[10, 10, 0, 0]}
                                  fill="#7C3AED"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card
                      sx={{
                        borderRadius: 3,
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.03) 100%)",
                        border: "1px solid rgba(216, 229, 254, 0.10)",
                        boxShadow: "0 18px 55px rgba(0,0,0,0.35)",
                        color: "white",
                        overflow: "hidden",
                      }}
                    >
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Stack spacing={1}>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <GradientTitle
                              variant="h6"
                              sx={{ textShadow: "none" }}
                            >
                              Purchases Over Time
                            </GradientTitle>
                            <Chip
                              label={`${chartProducts.length} line${
                                chartProducts.length === 1 ? "" : "s"
                              }`}
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

                          <SubText
                            sx={{ fontSize: 14, color: "rgba(216,229,254,0.68)" }}
                          >
                            Daily purchase counts for the top tracked products.
                          </SubText>

                          <Divider sx={{ borderColor: "rgba(216,229,254,0.08)" }} />

                          <Box sx={{ width: "100%", height: 360 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={payload.series}
                                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                              >
                                <CartesianGrid
                                  stroke="rgba(255,255,255,0.08)"
                                  vertical={false}
                                />
                                <XAxis
                                  dataKey="date"
                                  tickFormatter={formatDateLabel}
                                  tick={{
                                    fill: "rgba(216,229,254,0.72)",
                                    fontSize: 12,
                                  }}
                                  minTickGap={22}
                                />
                                <YAxis
                                  allowDecimals={false}
                                  domain={[0, "auto"]}
                                  tickFormatter={formatWholeTick}
                                  tick={{
                                    fill: "rgba(216,229,254,0.72)",
                                    fontSize: 12,
                                  }}
                                />
                                <Tooltip
                                  labelFormatter={(value) => formatDateLabel(value)}
                                  formatter={(value, name) => [
                                    formatWholeTick(value),
                                    name,
                                  ]}
                                  contentStyle={{
                                    background: "rgba(10,10,16,0.95)",
                                    border: "1px solid rgba(216,229,254,0.14)",
                                    borderRadius: 12,
                                    color: "white",
                                  }}
                                />
                                <Legend />
                                {chartProducts.map((key, index) => (
                                  <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    stroke={colorForIndex(index)}
                                    strokeWidth={2.4}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                  />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>

                  <SubText
                    sx={{ fontSize: 14, color: "rgba(216,229,254,0.68)" }}
                  >
                    Generated from completed Stripe checkout purchases in the
                    selected date range.
                  </SubText>
                </Stack>
              )}
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