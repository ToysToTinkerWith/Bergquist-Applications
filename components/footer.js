// components/Footer.jsx
// Change:
// - Move "Privacy" and "Terms" buttons to be UNDER the rights reserved text at all times
//   (stacked vertically layout on the left/bottom area).

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Box, Typography, Button, Divider } from "@mui/material"
import { motion } from "framer-motion"
import { useRouter } from "next/router"

function RevealOnScroll({
  children,
  delay = 0,
  threshold = 0.25,
  rootMargin = "0px 0px -10% 0px",
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
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.85, ease: "easeOut", delay }}
      sx={{ willChange: "transform, opacity" }}
    >
      {children}
    </Box>
  )
}

export default function Footer({ logoSrc = "/logoBig.png", maxWidth = 1200 }) {
  const router = useRouter()

  const items = useMemo(
    () => [
      { label: "Home", href: "/" },
      { label: "Applications", href: "/applications" },
      { label: "Contact", href: "/contact" },
    ],
    []
  )

  const legalItems = useMemo(() => [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }], [])

  const isActive = (href) => (router.pathname || "") === href
  const year = new Date().getFullYear()

  const containerV = {
    hidden: { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
  }

  const itemV = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  return (
    <Box
      component="footer"
      sx={{
        width: "100%",
        backgroundColor: "black",
        display: "flex",
        justifyContent: "center",
        px: 2,
        pt: { xs: 4, sm: 4.5 },
        pb: { xs: 3, sm: 3.5 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth }}>
        <RevealOnScroll>
          <Box
            component={motion.div}
            variants={containerV}
            initial="hidden"
            animate="show"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: { xs: 3, md: 2 },
              alignItems: "center",
            }}
          >
            {/* Section 1: Logo + tagline (CENTERED within its grid cell) */}
            <Box
              component={motion.div}
              variants={itemV}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                gap: 1.25,
              }}
            >
              <Box
                component={motion.button}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/")}
                style={{
                  border: "none",
                  background: "transparent",
                  padding: 0,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Go to home"
              >
                <Box
                  component="img"
                  src={logoSrc}
                  alt="Logo"
                  sx={{
                    height: { xs: 134, sm: 224 },
                    width: "auto",
                    display: "block",
                    userSelect: "none",
                  }}
                />
              </Box>

              <Typography
                sx={{
                  fontFamily: "Bemora",
                  letterSpacing: 0.5,
                  color: "rgba(216, 229, 254, 0.82)",
                  fontSize: { xs: 13.5, sm: 14.5 },
                  lineHeight: 1.6,
                  mt: 0.5,
                }}
              >
                Web Applications for the future
              </Typography>
            </Box>

            {/* Section 2: Navigation (CENTERED within its grid cell) */}
            <Box component={motion.div} variants={itemV} sx={{ display: "flex", justifyContent: "center" }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "center", textAlign: "center" }}>
                <Typography
                  sx={{
                    fontFamily: "Bemora",
                    letterSpacing: 0.85,
                    textTransform: "uppercase",
                    fontSize: 12,
                    color: "rgba(245, 248, 255, 0.9)",
                  }}
                >
                  Navigate
                </Typography>

                <Box
                  component={motion.div}
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
                  initial="hidden"
                  animate="show"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: { xs: 0.5, sm: 1.25 },
                    flexWrap: "wrap",
                  }}
                >
                  {items.map((it) => {
                    const active = isActive(it.href)
                    return (
                      <Box
                        key={it.href}
                        component={motion.div}
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
                        }}
                      >
                        <Button
                          onClick={() => router.push(it.href)}
                          disableRipple
                          sx={{
                            position: "relative",
                            textTransform: "none",
                            fontFamily: "Bemora",
                            letterSpacing: 0.6,
                            px: { xs: 1.25, sm: 1.75 },
                            py: 1,
                            minWidth: 0,
                            borderRadius: 999,
                            border: "1px solid rgba(255,255,255,0.10)",
                            backgroundColor: "rgba(255,255,255,0.03)",
                            color: active ? "rgba(245, 248, 255, 0.95)" : "rgba(216, 229, 254, 0.82)",
                            "&:hover": {
                              backgroundColor: "rgba(255,255,255,0.06)",
                              color: "rgba(245, 248, 255, 0.95)",
                              borderColor: "rgba(255,255,255,0.16)",
                            },
                            "&::after": {
                              content: '""',
                              position: "absolute",
                              left: "14%",
                              right: "14%",
                              bottom: 6,
                              height: 2,
                              borderRadius: 999,
                              background: active
                                ? "linear-gradient(90deg, rgba(255,255,255,0.95))"
                                : "transparent",
                              transform: active ? "scaleX(1)" : "scaleX(0.85)",
                              transition: "all 180ms ease",
                            },
                          }}
                          component={motion.button}
                          whileHover={{ y: -1 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {it.label}
                        </Button>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        </RevealOnScroll>

        {/* Divider */}
        <Divider
          sx={{
            mt: { xs: 3, sm: 3.5 },
            mb: 2,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        {/* Bottom area: copyright + legal buttons UNDER it */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontFamily: "Bemora",
              letterSpacing: 0.75,
              color: "rgba(216, 229, 254, 0.70)",
              fontSize: 12.5,
              textAlign: "left",
            }}
          >
            © {year} Bergquist Applications LLC. All rights reserved.
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
            {legalItems.map((it) => {
              const active = isActive(it.href)
              return (
                <Button
                  key={it.href}
                  onClick={() => router.push(it.href)}
                  disableRipple
                  size="small"
                  sx={{
                    position: "relative",
                    textTransform: "none",
                    fontFamily: "Bemora",
                    letterSpacing: 0.55,
                    px: 1.1,
                    py: 0.55,
                    minWidth: 0,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    color: active ? "rgba(245, 248, 255, 0.92)" : "rgba(216, 229, 254, 0.75)",
                    fontSize: 12,
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.05)",
                      color: "rgba(245, 248, 255, 0.92)",
                      borderColor: "rgba(255,255,255,0.16)",
                    },
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      left: "18%",
                      right: "18%",
                      bottom: 4,
                      height: 2,
                      borderRadius: 999,
                      background: active ? "linear-gradient(90deg, rgba(255,255,255,0.9))" : "transparent",
                      transform: active ? "scaleX(1)" : "scaleX(0.9)",
                      transition: "all 180ms ease",
                      opacity: active ? 1 : 0,
                    },
                  }}
                  component={motion.button}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {it.label}
                </Button>
              )
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
