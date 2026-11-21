"use client"

import React, { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"

function useMediaQuery(query) {
  const getMatch = () =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches

  const [matches, setMatches] = useState(getMatch)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)

    if (mql.addEventListener) mql.addEventListener("change", onChange)
    else mql.addListener(onChange)

    setMatches(mql.matches)

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange)
      else mql.removeListener(onChange)
    }
  }, [query])

  return matches
}

export default function RestaurantPizzeriaVisit({
  location = "287 Downtown, WA 95298",
  phone = "(360) 331-4533",
  hours = [
    { day: "Monday", value: "12:00 PM - 7:00 PM" },
    { day: "Tuesday", value: "12:00 PM - 7:00 PM" },
    { day: "Wednesday", value: "Closed" },
    { day: "Thursday", value: "12:00 PM - 7:00 PM" },
    { day: "Friday", value: "12:00 PM - 7:00 PM" },
    { day: "Saturday", value: "12:00 PM - 7:00 PM" },
    { day: "Sunday", value: "Closed" },
  ],
}) {
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    location
  )}`

  const isWide = useMediaQuery("(min-width: 700px)")
  const isTiny = useMediaQuery("(max-width: 420px)")

  const palette = useMemo(
    () => ({
      ink: "#f4f0e6",
      ink2: "rgba(244,240,230,0.82)", // match hero
      ink3: "rgba(244,240,230,0.62)", // match hero
      gold: "rgba(176,160,236,0.95)",
      goldHover: "rgba(176,160,236,0.60)",
      shadow: "rgba(0,0,0,0.55)",
    }),
    []
  )

  const styles = useMemo(() => {
    const kickerLineWidth = isTiny ? "min(120px, 18vw)" : "min(170px, 22vw)"

    return {
      shell: {
        position: "relative",
        padding: "28px 14px",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        background: "#060606",
        color: palette.ink,

        // FONT MATCH (from Hero)
        fontFamily: "ui-serif, Georgia, Times New Roman, Times, serif",
      },

      bgImage: {
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        backgroundImage: 'url("/restaurant/dark2.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        filter: "saturate(1.05) contrast(1.05)",
        transform: "scale(1.02)",
      },

      // Contrast-stabilizing overlay so text reads consistently
      bgOverlay: {
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        background:
          "radial-gradient(900px 420px at 50% 20%, rgba(176,160,236,0.18), transparent 60%), linear-gradient(180deg, rgba(0,0,0,0.70), rgba(0,0,0,0.88))",
      },

      card: {
        width: "min(820px, 100%)",
        borderRadius: 22,
        background: "transparent",
        border: "none",
        boxShadow: "none",
        padding: "18px 16px 16px",
        position: "relative",
        zIndex: 2,
      },

      head: {
        textAlign: "center",
        padding: "4px 8px 10px",
        textShadow: `0 10px 26px ${palette.shadow}`,
      },

      kickerRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 8,
      },

      kickerText: {
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontSize: 12,
        color: palette.ink3,
        whiteSpace: "nowrap",
      },

      kickerLine: {
        height: 1,
        width: kickerLineWidth,
        background:
          "linear-gradient(90deg, transparent, rgba(244,240,230,0.28), transparent)",
        opacity: 0.9,
      },

      blurb: {
        margin: "0 auto",
        maxWidth: "64ch",
        fontSize: 14,
        lineHeight: 1.6,
        color: palette.ink2,
      },

      grid: {
        display: "grid",
        gap: 10,
        gridTemplateColumns: isWide ? "1fr 1fr" : "1fr",
        marginTop: 12,
      },

      block: {
        borderRadius: 16,
        border: "1px solid rgba(244,240,230,0.12)",
        background:
          "linear-gradient(180deg, rgba(18,18,18,0.92), rgba(6,6,6,0.92))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        padding: "12px 12px",
      },

      blockTitle: {
        fontSize: 11,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: palette.ink3,
        marginBottom: 6,
      },

      link: {
        display: "inline-block",
        fontSize: 14,
        lineHeight: 1.5,
        color: palette.ink,
        textDecoration: "none",
        borderBottom: "1px solid rgba(176,160,236,0.35)",
        paddingBottom: 2,
      },

      hoursWrap: {
        paddingBottom: 10,
        ...(isWide ? { gridColumn: "1 / -1" } : null),
      },

      hoursTable: {
        display: "grid",
        gap: 6,
        marginTop: 6,
      },

      hoursRow: {
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 10,
        alignItems: "baseline",
        padding: "7px 8px",
        borderRadius: 12,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(244,240,230,0.10)",
      },

      hoursDay: {
        color: palette.ink2,
        fontSize: 13,
      },

      hoursVal: {
        color: palette.ink,
        fontSize: 13,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      },

      hoursHint: {
        marginTop: 8,
        fontSize: 12,
        color: "rgba(244,240,230,0.55)",
        textAlign: "right",
      },
    }
  }, [isWide, isTiny, palette])

  return (
    <section style={styles.shell} aria-label="Visit Village Pizzeria">
      <div style={styles.bgImage} aria-hidden="true" />
      <div style={styles.bgOverlay} aria-hidden="true" />

      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div style={styles.head}>
          <div style={styles.kickerRow} role="presentation">
            <span style={styles.kickerLine} aria-hidden="true" />
            <span style={styles.kickerText}>Come Join Us</span>
            <span style={styles.kickerLine} aria-hidden="true" />
          </div>

          <p style={styles.blurb}>
            We’d love to welcome you in. Stop by in the heart of the city for a
            cozy bite and a warm neighborhood vibe.
          </p>
        </div>

        <div style={styles.grid}>
          <div style={styles.block}>
            <div style={styles.blockTitle}>Location</div>
            <motion.a
              style={styles.link}
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${location} in maps`}
              whileHover={{ borderBottomColor: palette.goldHover }}
              transition={{ duration: 0.15 }}
            >
              {location}
            </motion.a>
          </div>

          <div style={styles.block}>
            <div style={styles.blockTitle}>Phone</div>
            <motion.a
              style={styles.link}
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              whileHover={{ borderBottomColor: palette.goldHover }}
              transition={{ duration: 0.15 }}
            >
              {phone}
            </motion.a>
          </div>

          <div style={{ ...styles.block, ...styles.hoursWrap }}>
            <div style={styles.blockTitle}>Opening Hours</div>

            <div style={styles.hoursTable} role="table" aria-label="Opening hours">
              {hours.map((h) => {
                const isClosed = String(h.value).toLowerCase() === "closed"
                return (
                  <div style={styles.hoursRow} role="row" key={h.day}>
                    <div style={styles.hoursDay} role="cell">
                      {h.day}
                    </div>
                    <div
                      style={{
                        ...styles.hoursVal,
                        ...(isClosed ? { color: "rgba(176,160,236,0.85)" } : null),
                      }}
                      role="cell"
                    >
                      {h.value}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={styles.hoursHint} aria-hidden="true">
              Hours may vary on holidays.
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
