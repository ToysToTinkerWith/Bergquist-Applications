// components/LifeTimeline.jsx
// Full code change:
// - Removes the Type Tags section entirely.
// - The "selected event" panel now lives in that right-hand slot (next to the video).
// - On small screens (stacked layout), the video ALWAYS keeps its full 300px height,
//   and the selected-event panel flows below it (no forced height).
// - Keeps: radial fade overlay on video, perfectly vertical stems from true node,
//   bubble clamping, click behavior.
//
// Requires: @mui/material
// Optional: framer-motion

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Box, Typography, Stack, Chip, Button } from "@mui/material"
import { motion } from "framer-motion"

// -------------------------- UI helpers --------------------------

function RevealOnScroll({
  children,
  delay = 0,
  threshold = 0.25,
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
        backgroundImage: "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
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

function safeKey(s) {
  return String(s || "").replace(/\s+/g, "-").toLowerCase()
}

function normalizeStr(s) {
  return String(s || "").trim()
}

function parseDateMs(iso) {
  const d = new Date(String(iso || ""))
  const ms = d.getTime()
  return Number.isFinite(ms) ? ms : NaN
}

function formatMonthYear(isoDate) {
  const d = new Date(String(isoDate || ""))
  if (Number.isNaN(d.getTime())) return String(isoDate || "")
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" })
}

function clamp(n, lo, hi) {
  const x = Number(n)
  if (!Number.isFinite(x)) return lo
  return Math.max(lo, Math.min(hi, x))
}

function clamp01(n) {
  return clamp(n, 0, 1)
}

// BIG variance layout
function layoutForIndex(i, isXs) {
  const above = i % 2 === 0

  const distTiers = [70, 110, 160, 210, 90, 140, 190, 240, 120, 175, 260, 150]
  const dist = distTiers[i % distTiers.length]

  const jitterTiers = [0, 22, -22, 40, -40, 14, -14, 56, -56, 30, -30, 70, -70]
  const baseJitter = jitterTiers[i % jitterTiers.length]
  const jitter = isXs ? Math.round(baseJitter * 1.35) : baseJitter

  return { above, dist, jitter }
}

// -------------------------- Component --------------------------

export default function LifeTimeline({
  events = [],
  headerTitle = "My Timeline",
  headerSubtitle = "Milestones from 2020 to today — positioned by date.",
  lastUpdated = "February 26, 2026",
  showPageSection = false,
}) {
  const [selectedKey, setSelectedKey] = useState("")
  const [isXs, setIsXs] = useState(false)

  const trackRef = useRef(null)
  const [trackW, setTrackW] = useState(0)

  // Video ref (normal loop) — robust autoplay + loop
  const astroVidRef = useRef(null)

  useEffect(() => {
    const calc = () => setIsXs(typeof window !== "undefined" && window.innerWidth < 600)
    calc()
    window.addEventListener("resize", calc)
    return () => window.removeEventListener("resize", calc)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const el = trackRef.current
    if (!el) return

    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width
      setTrackW(Number.isFinite(w) ? w : 0)
    })
    ro.observe(el)

    const w0 = el.getBoundingClientRect().width
    setTrackW(Number.isFinite(w0) ? w0 : 0)

    return () => {
      try {
        ro.disconnect()
      } catch {}
    }
  }, [])

  // Robust: try to autoplay/loop; retry a few times; click fallback always works.
  useEffect(() => {
    const v = astroVidRef.current
    if (!v) return

    let alive = true
    let tries = 0

    const tryPlay = async () => {
      if (!alive) return
      tries += 1
      try {
        v.muted = true
        v.playsInline = true
        v.loop = true
        v.preload = "auto"
        v.setAttribute("playsinline", "true")
        v.setAttribute("webkit-playsinline", "true")

        const p = v.play()
        if (p && typeof p.then === "function") await p
      } catch {
        if (tries < 6) {
          setTimeout(() => {
            if (alive) tryPlay()
          }, 650)
        }
      }
    }

    const onMeta = () => tryPlay()
    const onData = () => tryPlay()
    const onCanPlay = () => tryPlay()

    v.addEventListener("loadedmetadata", onMeta)
    v.addEventListener("loadeddata", onData)
    v.addEventListener("canplay", onCanPlay)

    tryPlay()

    return () => {
      alive = false
      try {
        v.removeEventListener("loadedmetadata", onMeta)
        v.removeEventListener("loadeddata", onData)
        v.removeEventListener("canplay", onCanPlay)
      } catch {}
    }
  }, [])

  const startMs = useMemo(() => new Date("2020-01-01T00:00:00.000Z").getTime(), [])
  const endMs = useMemo(() => Date.now(), [])

  function eCmp(a, b) {
    const da = a?.__ms
    const db = b?.__ms
    if (da !== db) return da - db
    return (a?.__idx ?? 0) - (b?.__idx ?? 0)
  }

  const filtered = useMemo(() => {
    return (events || [])
      .map((e, idx) => ({ ...e, __ms: parseDateMs(e?.date), __idx: idx }))
      .filter((e) => {
        if (!Number.isFinite(e.__ms)) return false
        if (e.__ms < startMs || e.__ms > endMs) return false
        return true
      })
      .sort((a, b) => eCmp(a, b))
  }, [events, startMs, endMs])

  useEffect(() => {
    if (!selectedKey && filtered.length) {
      const first = filtered[0]
      setSelectedKey(`${safeKey(first?.title)}-${first?.date}-${first?.__idx}`)
      return
    }
    if (
      selectedKey &&
      !filtered.some((e) => `${safeKey(e?.title)}-${e?.date}-${e?.__idx}` === selectedKey)
    ) {
      setSelectedKey("")
    }
  }, [filtered, selectedKey])

  const selectedEvent = useMemo(() => {
    if (!selectedKey) return null
    return (
      filtered.find((e) => `${safeKey(e?.title)}-${e?.date}-${e?.__idx}` === selectedKey) || null
    )
  }, [filtered, selectedKey])

  // Track sizing
  const TRACK_H = isXs ? 760 : 620
  const LINE_Y = isXs ? 380 : 310

  // Line left/right padding
  const LINE_PAD = isXs ? 16 : 22

  // Bubble sizing assumptions for clamping
  const bubbleW = isXs ? 132 : 220
  const bubbleH = isXs ? 44 : 56
  const edgePad = 10

  // Controls/video sizing
  const VIDEO_H = 300 // requested

  const content = (
    <>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 8, sm: 10, md: 12 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1200 }}>
          <Stack spacing={{ xs: 2.5, sm: 3 }}>
            <RevealOnScroll>
              <Box
                sx={{
                  position: "relative",
                  borderRadius: 3,
                  overflow: "visible",
                  boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
                  p: { xs: 2.0, sm: 2.5, md: 3 },
                }}
              >
                <Stack spacing={0.85} sx={{ mb: 1.75 }}>
                  <GradientTitle
                    variant="h5"
                    align="left"
                    sx={{ mb: 0.1, letterSpacing: 0.8, textShadow: "none" }}
                  >
                    Anders Bergquist (2020 → Today)
                  </GradientTitle>
                  {/* (headerSubtitle/lastUpdated are still available if you want to render them) */}
                </Stack>

                {/* Top row: VIDEO + Selected Event Panel */}
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.25}
                  alignItems={{ xs: "stretch", md: "stretch" }}
                  sx={{ mb: 1.75 }}
                >
                  {/* Astro video: always full height */}
                  <RevealOnScroll delay={0.02}>
                    <Box
                      onClick={() => {
                        const v = astroVidRef.current
                        if (!v) return
                        try {
                          v.muted = true
                          v.play?.()
                        } catch {}
                      }}
                      sx={{
                        position: "relative",
                        flex: { md: "0 0 520px" },
                        height: VIDEO_H,
                        minHeight: VIDEO_H,
                        flexShrink: 0, // key: don't let stacking squash the video
                        overflow: "hidden",
                        backgroundColor: "black",
                        boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
                        cursor: "pointer",
                      }}
                      title="Click to play if autoplay is blocked"
                    >
                      <video
                        ref={astroVidRef}
                        src="/data/astro.mp4"
                        muted
                        playsInline
                        loop
                        autoPlay
                        preload="auto"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: "brightness(0.95) contrast(1.05)",
                          transform: "translateZ(0)",
                          objectPosition: "center 20%",
                          display: "block",
                        }}
                      />

                      {/* Radial fade overlay */}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          pointerEvents: "none",
                          background:
                            "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,1) 80%)",
                        }}
                      />
                    </Box>
                  </RevealOnScroll>

                  {/* Selected event panel (replaces type tags section) */}
                  <Box
                    sx={{
                      flex: 1,
                      minWidth: 0,

                      // IMPORTANT:
                      // - On md+, lock to video height so it feels like a paired panel.
                      // - On xs (stacked), let it be auto so the video still shows full height.
                      height: { xs: "auto", md: VIDEO_H },
                      minHeight: { xs: 0, md: VIDEO_H },
                      overflow: { xs: "visible", md: "auto" },

                      p: 0,
                      background: "transparent",

                      "&::-webkit-scrollbar": { width: 10, height: 10 },
                      "&::-webkit-scrollbar-thumb": {
                        background: "rgba(216, 229, 254, 0.16)",
                        borderRadius: 999,
                      },
                    }}
                  >
                    {selectedEvent ? (
                      <EventDetails
                        event={selectedEvent}
                        onClear={() => setSelectedKey("")}
                        sx={{ height: { xs: "auto", md: "100%" } }}
                      />
                    ) : (
                      <Box
                        sx={{
                          borderRadius: 3,
                          background: "rgba(0,0,0,0.30)",
                          border: "1px solid rgba(216, 229, 254, 0.12)",
                          px: { xs: 1.25, sm: 1.5 },
                          py: { xs: 1.1, sm: 1.25 },
                          height: { xs: "auto", md: "100%" },
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Typography sx={{ color: "rgba(216, 229, 254, 0.72)", fontWeight: 800 }}>
                          Click a milestone on the line to view details.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Stack>

                {/* Timeline box */}
                <Box
                  sx={{
                    overflow: "visible",
                    background: "rgba(0,0,0,0.35)",
                    p: { xs: 1.25, sm: 1.5 },
                  }}
                >
                  <Box
                    ref={trackRef}
                    sx={{
                      position: "relative",
                      width: "100%",
                      height: TRACK_H,
                      overflow: "hidden",
                      borderRadius: 2,
                    }}
                  >
                    {/* Base line (padded) */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: LINE_PAD,
                        right: LINE_PAD,
                        top: LINE_Y,
                        height: 2,
                        background: "rgba(216, 229, 254, 0.18)",
                      }}
                    />
                    {/* Gradient overlay (padded) */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: LINE_PAD,
                        right: LINE_PAD,
                        top: LINE_Y - 1,
                        height: 4,
                        opacity: 0.35,
                        backgroundImage:
                          "linear-gradient(90deg, rgba(124,58,237,0.55), rgba(34,211,238,0.45))",
                      }}
                    />

                    {/* End labels */}
                    <Typography
                      sx={{
                        position: "absolute",
                        left: LINE_PAD,
                        top: LINE_Y + 10,
                        color: "rgba(216, 229, 254, 0.70)",
                        fontWeight: 900,
                        fontSize: 12.5,
                      }}
                    >
                      2020
                    </Typography>
                    <Typography
                      sx={{
                        position: "absolute",
                        right: LINE_PAD,
                        top: LINE_Y + 10,
                        color: "rgba(216, 229, 254, 0.70)",
                        fontWeight: 900,
                        fontSize: 12.5,
                      }}
                    >
                      Today
                    </Typography>

                    {/* Events */}
                    {filtered.map((e, i) => {
                      const key = `${safeKey(e?.title)}-${e?.date}-${e?.__idx}`
                      const pct = clamp01((e.__ms - startMs) / Math.max(1, endMs - startMs))
                      const isActive = key === selectedKey

                      const { above, dist, jitter } = layoutForIndex(i, isXs)

                      const spanW = Math.max(0, (trackW || 0) - 2 * LINE_PAD)

                      // TRUE node X in px (within padded line span)
                      const nodeX = trackW > 0 ? LINE_PAD + pct * spanW : null

                      // bubble center desired with jitter, clamped for bounds
                      const desiredBubbleCenterX = nodeX == null ? null : nodeX + jitter
                      const minCenterX = bubbleW / 2 + edgePad
                      const maxCenterX = (trackW || 0) - bubbleW / 2 - edgePad
                      const bubbleCenterX =
                        desiredBubbleCenterX == null || trackW <= 0
                          ? null
                          : clamp(desiredBubbleCenterX, minCenterX, maxCenterX)

                      // bubble Y clamped
                      const desiredTopY = above ? LINE_Y - dist - bubbleH : LINE_Y + dist
                      const minTopY = edgePad
                      const maxTopY = TRACK_H - bubbleH - edgePad
                      const bubbleTopY = clamp(desiredTopY, minTopY, maxTopY)

                      const typeText = normalizeStr(e?.type) || "Event"
                      const titleText = normalizeStr(e?.title) || "Untitled event"
                      const showTitle = !isXs

                      // Fallback calc (before measuring width)
                      const nodeLeftFallback = `calc(${LINE_PAD}px + ${(pct * 100).toFixed(
                        4
                      )}% * ((100% - ${2 * LINE_PAD}px) / 100%))`
                      const nodeLeft = nodeX == null ? nodeLeftFallback : `${nodeX}px`
                      const bubbleLeft = bubbleCenterX == null ? nodeLeftFallback : `${bubbleCenterX}px`

                      // ---- STEM: perfectly vertical from NODE ----
                      const stemX = nodeLeft
                      const stemEndY = above ? bubbleTopY + bubbleH : bubbleTopY
                      const stemTop = Math.min(LINE_Y, stemEndY)
                      const stemH = Math.abs(stemEndY - LINE_Y)

                      const stemColor = isActive
                        ? "rgba(34,211,238,0.65)"
                        : "rgba(216, 229, 254, 0.20)"

                      return (
                        <Box
                          key={key}
                          sx={{
                            position: "absolute",
                            inset: 0,
                            pointerEvents: "none",
                          }}
                        >
                          {/* Vertical stem directly off the node */}
                          <Box
                            sx={{
                              position: "absolute",
                              left: stemX,
                              top: stemTop,
                              transform: "translateX(-50%)",
                              width: 2,
                              height: stemH,
                              background: stemColor,
                              pointerEvents: "none",
                            }}
                          />

                          {/* Node */}
                          <Box
                            onClick={() => setSelectedKey(key)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter" || ev.key === " ") setSelectedKey(key)
                            }}
                            aria-label={`Select ${titleText} (${formatMonthYear(e?.date)})`}
                            title={`${titleText} — ${formatMonthYear(e?.date)}`}
                            sx={{
                              pointerEvents: "auto",
                              zIndex: isActive ? 5 : 3,
                              position: "absolute",
                              left: nodeLeft,
                              top: LINE_Y - 6,
                              transform: "translateX(-50%)",
                              width: 12,
                              height: 12,
                              borderRadius: 999,
                              cursor: "pointer",
                              outline: "none",
                              backgroundImage:
                                "linear-gradient(90deg, rgba(124,58,237,0.95), rgba(34,211,238,0.85))",
                              boxShadow: isActive
                                ? "0 0 0 6px rgba(34,211,238,0.18), 0 0 50px rgba(34,211,238,0.16)"
                                : "0 0 0 4px rgba(34,211,238,0.10), 0 0 28px rgba(34,211,238,0.08)",
                              transition: "transform 140ms ease, box-shadow 140ms ease",
                              "&:hover": { transform: "translateX(-50%) scale(1.08)" },
                              "&:focus-visible": {
                                boxShadow:
                                  "0 0 0 6px rgba(34,211,238,0.24), 0 0 50px rgba(34,211,238,0.20)",
                              },
                            }}
                          />

                          {/* Bubble (still clamped to stay in-bounds) */}
                          <Box
                            onClick={() => setSelectedKey(key)}
                            sx={{
                              pointerEvents: "auto",
                              zIndex: isActive ? 4 : 2,
                              position: "absolute",
                              left: bubbleLeft,
                              top: bubbleTopY,
                              transform: "translateX(-50%)",
                              width: bubbleW,
                              borderRadius: 3,
                              overflow: "hidden",
                              background: isActive ? "rgba(0,0,0,0.58)" : "rgba(0,0,0,0.44)",
                              border: isActive
                                ? "1px solid rgba(34,211,238,0.32)"
                                : "1px solid rgba(216, 229, 254, 0.12)",
                              boxShadow: isActive
                                ? "0 0 0 3px rgba(34,211,238,0.12), 0 18px 55px rgba(0,0,0,0.60)"
                                : "0 14px 45px rgba(0,0,0,0.35)",
                              px: 1.05,
                              py: 0.8,
                              cursor: "pointer",
                              userSelect: "none",
                            }}
                          >
                            <Stack spacing={0.25}>
                              {showTitle ? (
                                <Typography
                                  sx={{
                                    color: "rgba(245, 248, 255, 0.92)",
                                    fontWeight: 900,
                                    fontSize: 13.25,
                                    lineHeight: 1.15,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={titleText}
                                >
                                  {titleText}
                                </Typography>
                              ) : null}

                              <Typography
                                sx={{
                                  color: "rgba(216, 229, 254, 0.70)",
                                  fontWeight: 900,
                                  fontSize: 12.0,
                                  lineHeight: 1.1,
                                }}
                              >
                                {formatMonthYear(e?.date)}
                              </Typography>

                              <Typography
                                sx={{
                                  color: "rgba(216, 229, 254, 0.78)",
                                  fontWeight: 900,
                                  fontSize: isXs ? 12.25 : 12.0,
                                  lineHeight: 1.15,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                                title={typeText}
                              >
                                {typeText}
                              </Typography>
                            </Stack>
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              </Box>
            </RevealOnScroll>
          </Stack>
        </Box>
      </Box>
    </>
  )

  if (showPageSection) return <Box sx={{ width: "100%", backgroundColor: "black" }}>{content}</Box>
  return <Box sx={{ width: "100%" }}>{content}</Box>
}

// -------------------------- Details panel --------------------------

function EventDetails({ event, onClear, sx = {} }) {
  const title = normalizeStr(event?.title)
  const type = normalizeStr(event?.type)
  const summary = normalizeStr(event?.summary)
  const highlights = Array.isArray(event?.highlights) ? event.highlights.filter(Boolean) : []
  const tags = Array.isArray(event?.tags) ? event.tags.filter(Boolean) : []
  const dateLabel = formatMonthYear(event?.date)

  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        background: "rgba(0,0,0,0.35)",
        border: "1px solid rgba(216, 229, 254, 0.12)",
        boxShadow: "0 18px 55px rgba(0,0,0,0.40)",
        px: { xs: 1.25, sm: 1.5 },
        py: { xs: 1.1, sm: 1.25 },
        ...sx,
      }}
    >
      <Stack spacing={0.85}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                color: "rgba(245, 248, 255, 0.92)",
                fontWeight: 900,
                fontSize: 16,
                lineHeight: 1.2,
              }}
            >
              {title || "Untitled event"}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.6, flexWrap: "wrap" }}>
              <Chip
                label={dateLabel}
                size="small"
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  color: "rgba(216, 229, 254, 0.90)",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(216, 229, 254, 0.14)",
                }}
              />
              {type ? (
                <Chip
                  label={type}
                  size="small"
                  sx={{
                    borderRadius: 999,
                    fontWeight: 900,
                    color: "rgba(216, 229, 254, 0.90)",
                    background: "rgba(124,58,237,0.10)",
                    border: "1px solid rgba(124,58,237,0.22)",
                  }}
                />
              ) : null}
            </Stack>
          </Box>

       
        </Stack>

        {summary ? (
          <Typography sx={{ color: "rgba(216, 229, 254, 0.74)", fontSize: 13.5, lineHeight: 1.55 }}>
            {summary}
          </Typography>
        ) : null}

        {highlights.length ? (
          <Stack spacing={0.55}>
            {highlights.map((h, i) => (
              <Typography
                key={`${safeKey(h)}-${i}`}
                sx={{ color: "rgba(216, 229, 254, 0.72)", fontSize: 13.25, lineHeight: 1.45 }}
              >
                • {h}
              </Typography>
            ))}
          </Stack>
        ) : null}

        {tags.length ? (
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {tags.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                sx={{
                  borderRadius: 999,
                  fontWeight: 900,
                  color: "rgba(216, 229, 254, 0.82)",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(216, 229, 254, 0.14)",
                }}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  )
}