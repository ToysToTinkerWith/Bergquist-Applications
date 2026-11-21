// components/ApplicationsBarGraph.jsx

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Box, Typography, Stack, Chip } from "@mui/material"
import { motion } from "framer-motion"

// -------------------------- UI helpers --------------------------

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

// -------------------------- Data helpers --------------------------

function normalizeTag(t) {
  return String(t || "").trim()
}

function buildTagIndex(apps) {
  const map = new Map()
  for (const app of apps || []) {
    const tags = Array.isArray(app?.tags) ? app.tags : []
    for (const raw of tags) {
      const tag = normalizeTag(raw)
      if (!tag) continue
      if (!map.has(tag)) map.set(tag, { tag, count: 0, apps: [] })
      const row = map.get(tag)
      row.count += 1
      row.apps.push(app)
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.count - a.count) || a.tag.localeCompare(b.tag))
}

function safeKey(s) {
  return String(s || "").replace(/\s+/g, "-").toLowerCase()
}

// -------------------------- Component --------------------------

export default function ApplicationsBarGraph({
  apps = [],
  headerTitle = "Applications",
  headerSubtitle = "Click a tag to see which applications are under it.",
  lastUpdated = "February 24, 2026",
  maxBars = 24,
  showPageSection = false,
}) {
  const tagRowsAll = useMemo(() => buildTagIndex(apps), [apps])
  const tagRows = useMemo(() => tagRowsAll.slice(0, maxBars), [tagRowsAll, maxBars])

  const [selectedTag, setSelectedTag] = useState("")

  useEffect(() => {
    if (selectedTag) return
    if (tagRows.length <= 0) return
    setSelectedTag(tagRows[0].tag)
  }, [tagRows, selectedTag])

  const selectedRow = useMemo(() => {
    if (!selectedTag) return null
    return tagRowsAll.find((r) => r.tag === selectedTag) || null
  }, [tagRowsAll, selectedTag])

  const maxCount = useMemo(
    () => Math.max(1, ...tagRowsAll.map((r) => Number(r.count || 0))),
    [tagRowsAll]
  )

  const content = (
    <Box
      sx={{
        width: "100vw",
        maxWidth: "100%",
        px: 0,
        pb: { xs: 8, sm: 10, md: 12 },
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Stack spacing={{ xs: 2.5, sm: 3 }}>
          <RevealOnScroll>
            <Box
              sx={{
                position: "relative",
                borderRadius: 3,
                overflow: "hidden",
                background: "black",
                boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
                p: { xs: 2.0, sm: 2.5, md: 3 },
              }}
            >
              <Stack spacing={0.75} sx={{ mb: 1.75 }}>
                <GradientTitle
                  variant="h5"
                  align="left"
                  sx={{ mb: 0.1, letterSpacing: 0.8, textShadow: "none" }}
                >
                  Tag Graph
                </GradientTitle>
                <SubText sx={{ fontSize: 15, color: "rgba(216, 229, 254, 0.72)" }}>
                  One bar per tag. Height = number of applications using that tag.
                </SubText>
              </Stack>

              <Box
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  background: "rgba(0,0,0,0.35)",
                  px: { xs: 1.0, sm: 1.25 },
                  py: { xs: 1.25, sm: 1.5 },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    width: "100%",
                    gap: { xs: 0.75, sm: 1.0 },
                    alignItems: "flex-end",
                  }}
                >
                  {tagRows.length ? (
                    tagRows.map((row) => {
                      const isActive = row.tag === selectedTag
                      const pct = Math.max(8, Math.round((row.count / maxCount) * 100))

                      return (
                        <Box
                          key={safeKey(row.tag)}
                          sx={{
                            flex: "1 1 0",
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 0.6,
                            userSelect: "none",
                          }}
                        >
                          <Typography
                            sx={{
                              color: isActive
                                ? "rgba(255,255,255,0.98)"
                                : "rgba(216,229,254,0.92)",
                              fontWeight: 900,
                              fontSize: 12.5,
                              textShadow: isActive ? "0 10px 35px rgba(34,211,238,0.25)" : "none",
                              lineHeight: 1,
                            }}
                          >
                            {row.count}
                          </Typography>

                          <Box
                            onClick={() => setSelectedTag(row.tag)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") setSelectedTag(row.tag)
                            }}
                            sx={{
                              width: "100%",
                              height: { xs: 150, sm: 190 },
                              borderRadius: 2,
                              background: "rgba(255,255,255,0.06)",
                              overflow: "hidden",
                              position: "relative",
                              cursor: "pointer",
                              outline: "none",
                              transition:
                                "transform 140ms ease, box-shadow 140ms ease, background 140ms ease",
                              boxShadow: isActive
                                ? "0 0 0 4px rgba(34,211,238,0.22), 0 0 42px rgba(34,211,238,0.18), 0 20px 70px rgba(0,0,0,0.55)"
                                : "0 14px 45px rgba(0,0,0,0.35)",
                              "&:hover": {
                                transform: "translateY(-3px)",
                                background: "rgba(255,255,255,0.09)",
                              },
                              "&:focus-visible": {
                                boxShadow:
                                  "0 0 0 4px rgba(34,211,238,0.35), 0 0 42px rgba(34,211,238,0.22), 0 20px 70px rgba(0,0,0,0.55)",
                              },
                            }}
                            aria-label={`Show apps tagged ${row.tag}`}
                            title={`Show apps under ${row.tag}`}
                          >
                            <Box
                              sx={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: `${pct}%`,
                                backgroundImage:
                                  "linear-gradient(90deg, rgba(124,58,237,0.85), rgba(34,211,238,0.65))",
                                filter: isActive ? "saturate(1.10) brightness(1.05)" : "none",
                                transition: "filter 140ms ease",
                                zIndex: 2,
                              }}
                            />

                            <Box
                              sx={{
                                position: "absolute",
                                inset: 0,
                                background:
                                  "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 60%)",
                                pointerEvents: "none",
                                opacity: 0.35,
                                zIndex: 3,
                              }}
                            />
                          </Box>

                          <Typography
                            sx={{
                              color: isActive
                                ? "rgba(255,255,255,0.96)"
                                : "rgba(216,229,254,0.78)",
                              fontWeight: 900,
                              fontSize: { xs: 11.5, sm: 12.5 },
                              textAlign: "center",
                              lineHeight: 1.15,
                              maxWidth: "100%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              textShadow: isActive ? "0 10px 35px rgba(34,211,238,0.22)" : "none",
                            }}
                            title={row.tag}
                          >
                            {row.tag}
                          </Typography>
                        </Box>
                      )
                    })
                  ) : (
                    <Typography sx={{ color: "rgba(216, 229, 254, 0.72)", fontWeight: 700 }}>
                      No tags found.
                    </Typography>
                  )}
                </Box>

                {tagRowsAll.length > maxBars ? (
                  <Typography
                    sx={{ mt: 1.0, color: "rgba(216, 229, 254, 0.62)", fontSize: 12.5 }}
                  >
                    Showing top {maxBars} tags by usage.
                  </Typography>
                ) : null}
              </Box>

              <Box sx={{ mt: 2.0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.0 }}>
                  <GradientTitle variant="h6" sx={{ textShadow: "none" }}>
                    {selectedTag ? `Apps under “${selectedTag}”` : "Apps"}
                  </GradientTitle>

                  {selectedRow ? (
                    <Chip
                      label={`${selectedRow.count} app${selectedRow.count === 1 ? "" : "s"}`}
                      size="small"
                      sx={{
                        borderRadius: 999,
                        fontWeight: 900,
                        color: "rgba(216, 229, 254, 0.90)",
                        background: "rgba(255,255,255,0.06)",
                      }}
                    />
                  ) : null}
                </Stack>

                {selectedRow?.apps?.length ? (
                  <Stack spacing={1.25}>
                    {selectedRow.apps.map((app) => {
                      const appTags = Array.isArray(app?.tags)
                        ? app.tags.map(normalizeTag).filter(Boolean)
                        : []
                      const href = String(app?.href || "#")
                      const isExternal = href.startsWith("http")

                      return (
                        <Box
                          key={app?.href || app?.name}
                          component="a"
                          href={href}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noreferrer" : undefined}
                          sx={{
                            textDecoration: "none",
                            borderRadius: 3,
                            overflow: "hidden",
                            background: "rgba(0,0,0,0.35)",
                            border: "1px solid rgba(216, 229, 254, 0.12)",
                            boxShadow: "0 18px 55px rgba(0,0,0,0.40)",
                            px: { xs: 1.25, sm: 1.5 },
                            py: { xs: 1.1, sm: 1.25 },
                            transition:
                              "transform 120ms ease, border-color 120ms ease, background 120ms ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              borderColor: "rgba(34,211,238,0.28)",
                              background: "black",
                            },
                            "&:focus-visible": {
                              outline: "none",
                              boxShadow:
                                "0 0 0 3px rgba(34,211,238,0.28), 0 18px 55px rgba(0,0,0,0.40)",
                            },
                            cursor: "pointer",
                            display: "block",
                          }}
                        >
                          <Stack spacing={0.6}>
                            <Typography
                              sx={{
                                color: "rgba(245, 248, 255, 0.92)",
                                fontWeight: 900,
                                fontSize: 15,
                                lineHeight: 1.2,
                              }}
                            >
                              {app?.name}
                            </Typography>

                            {app?.description ? (
                              <Typography
                                sx={{
                                  color: "rgba(216, 229, 254, 0.72)",
                                  fontSize: 13.5,
                                  lineHeight: 1.45,
                                }}
                              >
                                {app.description}
                              </Typography>
                            ) : null}

                            {appTags.length ? (
                              <Typography
                                sx={{ color: "rgba(216, 229, 254, 0.62)", fontSize: 12.5 }}
                              >
                                {appTags.join(" • ")}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Box>
                      )
                    })}
                  </Stack>
                ) : (
                  <Typography sx={{ color: "rgba(216, 229, 254, 0.72)", fontWeight: 700 }}>
                    No apps found for this tag.
                  </Typography>
                )}
              </Box>

              <SubText sx={{ mt: 1.75, fontSize: 14, color: "rgba(216, 229, 254, 0.68)" }}>
                Each bar represents a tag. Bar height is the number of apps under that tag.
              </SubText>
            </Box>
          </RevealOnScroll>
        </Stack>
      </Box>
    </Box>
  )

  if (showPageSection) {
    return <Box sx={{ width: "100%", backgroundColor: "black" }}>{content}</Box>
  }

  return <Box sx={{ width: "100%" }}>{content}</Box>
}