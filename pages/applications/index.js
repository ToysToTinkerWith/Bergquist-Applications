// pages/components/ApplicationsShowcase.jsx
// Update:
// - ADD: next/head SEO (title, description, canonical, OG/Twitter, JSON-LD)
// - Keeps your ContactPage-style background + layout + cards

import React, { useEffect, useMemo, useRef, useState } from "react"
import Head from "next/head"
import { Box, Typography } from "@mui/material"
import { motion } from "framer-motion"

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
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.85, ease: "easeOut", delay }}
      sx={{ willChange: "transform, opacity" }}
    >
      {children}
    </Box>
  )
}

function TechPill({ text }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1.2,
        py: 0.55,
        borderRadius: 999,
        border: "1px solid rgba(124,58,237,0.22)",
        background:
          "linear-gradient(180deg, rgba(124,58,237,0.10) 0%, rgba(34,211,238,0.06) 100%)",
        color: "rgba(216, 229, 254, 0.86)",
        fontSize: 12,
        letterSpacing: 0.6,
        fontFamily: "Bemora",
        userSelect: "none",
        backdropFilter: "blur(10px)",
      }}
    >
      {text}
    </Box>
  )
}

function OrbitLogo({ src, alt }) {
  return (
    <Box
      sx={{
        position: "relative",
        width: { xs: 70, sm: 80 },
        height: { xs: 70, sm: 80 },
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        background: "rgba(0,0,0,0.55)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.65)",
        transform: "translateZ(0)",
        flex: "0 0 auto",
      }}
    >
      <Box
        component={motion.div}
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        sx={{
          position: "absolute",
          inset: -10,
          borderRadius: 999,
          background:
            "conic-gradient(from 180deg, rgba(124,58,237,0) 0%, rgba(124,58,237,0.55) 20%, rgba(79,70,229,0.15) 40%, rgba(34,211,238,0.55) 60%, rgba(34,211,238,0) 85%, rgba(124,58,237,0) 100%)",
          opacity: 0.65,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 6,
          borderRadius: 999,
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.58) 55%, rgba(0,0,0,0.88) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(10px)",
        }}
      />
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          position: "relative",
          zIndex: 1,
          width: "62%",
          height: "62%",
          objectFit: "contain",
          filter: "drop-shadow(0 10px 22px rgba(0,0,0,0.65))",
        }}
      />
    </Box>
  )
}

export default function ApplicationsShowcase({
  title = "Applications",
  subtitle = "Explore the product suite built under Bergquist Applications.",
  maxWidth = 1200,
  minHeight = "100vh",
  apps,
}) {
  // ---------------- SEO ----------------
  const SITE_NAME = "Bergquist Applications"
  const SITE_URL = "https://bergquistapplications.com"
  // If you mount this on /applications, keep PAGE_PATH as /applications.
  // If you mount it elsewhere, change this accordingly.
  const PAGE_PATH = "/applications"
  const PAGE_URL = `${SITE_URL}${PAGE_PATH}`

  const TITLE = `${title} | ${SITE_NAME}`
  const DESCRIPTION =
    "Explore applications built by Bergquist Applications: online ordering, business showcases, and community platforms."
  const OG_IMAGE = `${SITE_URL}/og/bergquist-applications.jpg`

  const jsonLdCollectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: TITLE,
    url: PAGE_URL,
    description: DESCRIPTION,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  }

  // -------------- UI --------------
  const gradient = "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)"

  const defaultApps = useMemo(
    () => [
      {
        name: "Italiana",
        logoSrc: "/phone.png",
        href: "./applications/restaurant",
        description:
          "A modern restaurant experience — interactive menu, ordering, and operational workflows designed for speed and clarity.",
        tags: ["Ordering", "Stripe", "Admin Ops"],
      },
      {
        name: "Island Flourish",
        logoSrc: "/showcase.png",
        href: "https://islandflourish-c7caa.web.app/",
        description:
          "A portfolio + booking experience for florals and events — curated galleries, inquiries, and brand-forward presentation.",
        tags: ["Portfolio", "Bookings", "Gallery"],
      },
      {
        name: "Dark Coin",
        logoSrc: "/coin.png",
        href: "https://dark-coin.com/",
        description:
          "A blockchain-native gaming ecosystem — champions, battles, rewards, and media automation built for community engagement.",
        tags: ["Algorand", "NFTs", "Game Systems"],
      },
      {
        name: "Denise Prints",
        logoSrc: "/showcase.png",
        href: "https://deniseprints.web.app/",
        description:
          "A portfolio + showcase experience for custom made prints — curated works, contact information, and personalized presentation.",
        tags: ["Portfolio", "Gallery"],
      },
    ],
    []
  )

  const list = apps?.length ? apps : defaultApps

  return (
    <Box sx={{ width: "100%", backgroundColor: "black", minHeight }}>
      {/* SEO HEAD */}
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="canonical" href={PAGE_URL} />

        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:image" content={OG_IMAGE} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />

        <meta name="theme-color" content="#000000" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCollectionPage) }}
        />
      </Head>

      <Box
        sx={{
          position: "relative",
          width: "100%",
          minHeight,
          display: "flex",
          justifyContent: "center",
          backgroundColor: "black",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow blobs (same treatment as ContactPage) */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.25, ease: "easeOut" }}
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          {/* top-left glow */}
          <Box
            component={motion.div}
            animate={{ y: [0, 10, 0], opacity: [0.85, 0.95, 0.85] }}
            transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
            sx={{
              position: "absolute",
              left: "-12%",
              top: "-18%",
              width: { xs: 420, sm: 560, md: 720 },
              height: { xs: 420, sm: 560, md: 720 },
              borderRadius: "50%",
              filter: "blur(40px)",
              background:
                "radial-gradient(circle at 30% 30%, rgba(124,58,237,0.35) 0%, rgba(79,70,229,0.16) 40%, rgba(0,0,0,0) 70%)",
            }}
          />
          {/* bottom-right glow */}
          <Box
            component={motion.div}
            animate={{ y: [0, -12, 0], opacity: [0.8, 0.92, 0.8] }}
            transition={{ duration: 9.5, ease: "easeInOut", repeat: Infinity }}
            sx={{
              position: "absolute",
              right: "-18%",
              bottom: "-22%",
              width: { xs: 520, sm: 680, md: 860 },
              height: { xs: 520, sm: 680, md: 860 },
              borderRadius: "50%",
              filter: "blur(44px)",
              background:
                "radial-gradient(circle at 65% 65%, rgba(34,211,238,0.26) 0%, rgba(79,70,229,0.14) 38%, rgba(0,0,0,0) 72%)",
            }}
          />
          {/* subtle center vignette fade */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,1) 100%)",
            }}
          />
        </Box>

        {/* Content */}
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth,
            px: { xs: 2, sm: 4 },
            pt: { xs: 10, sm: 12, md: 14 },
            pb: { xs: 10, sm: 12, md: 14 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Header */}
          <RevealOnScroll delay={0.05}>
            <Box sx={{ width: "100%", textAlign: "center" }}>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: "Bemora",
                  letterSpacing: 2,
                  lineHeight: 1.2,
                  backgroundImage: gradient,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                  mb: 1.25,
                }}
              >
                {title}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: "rgba(216, 229, 254, 0.86)",
                  lineHeight: 1.6,
                  maxWidth: 760,
                  mx: "auto",
                }}
              >
                {subtitle}
              </Typography>
            </Box>
          </RevealOnScroll>

          {/* LIST (one app per line) */}
          <Box sx={{ width: "100%", maxWidth: 1000, mt: { xs: 4, sm: 5, md: 6 } }}>
            {list.map((app, idx) => (
              <RevealOnScroll key={`${app.name}-${idx}`} delay={0.08 * idx}>
                <Box
                  component={motion.a}
                  href={app.href}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  sx={{
                    display: "flex",
                    alignItems: { xs: "flex-start", sm: "center" },
                    gap: { xs: 2, sm: 2.5, md: 3 },
                    textDecoration: "none",
                    color: "inherit",
                    position: "relative",
                    borderRadius: 3,
                    overflow: "hidden",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 45%, rgba(0,0,0,0.65) 100%)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    boxShadow: "0 22px 80px rgba(0,0,0,0.62)",
                    backdropFilter: "blur(10px)",
                    px: { xs: 2.2, sm: 2.6, md: 3 },
                    py: { xs: 2, sm: 2.2, md: 2.5 },
                    mb: { xs: 2.2, sm: 2.6, md: 3 },
                  }}
                >
                  {/* top accent */}
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0) 0%, rgba(124,58,237,0.85) 25%, rgba(34,211,238,0.85) 75%, rgba(34,211,238,0) 100%)",
                      opacity: 0.9,
                    }}
                  />

                  {/* scanlines */}
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, rgba(0,0,0,0) 5px, rgba(0,0,0,0) 9px)",
                      opacity: 0.08,
                      pointerEvents: "none",
                    }}
                  />

                  <OrbitLogo src={app.logoSrc} alt={`${app.name} logo`} />

                  <Box sx={{ flex: 1, minWidth: 0, py: 0.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: { xs: "flex-start", sm: "center" },
                        justifyContent: "space-between",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: "Bemora",
                          letterSpacing: 0.8,
                          lineHeight: 1.15,
                          backgroundImage: gradient,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                          textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                          pr: 1,
                        }}
                      >
                        {app.name}
                      </Typography>

                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 1.2,
                          color: "rgba(216, 229, 254, 0.68)",
                          fontSize: 12,
                          letterSpacing: 0.9,
                          fontFamily: "Bemora",
                        }}
                      />
                    </Box>

                    <Typography
                      variant="body1"
                      sx={{
                        mt: 1.1,
                        color: "rgba(216, 229, 254, 0.82)",
                        lineHeight: 1.7,
                      }}
                    >
                      {app.description}
                    </Typography>

                    {!!app.tags?.length && (
                      <Box
                        sx={{
                          mt: 1.5,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {app.tags.slice(0, 6).map((t) => (
                          <TechPill key={`${app.name}-${t}`} text={t} />
                        ))}
                      </Box>
                    )}
                  </Box>

                  {/* edge vignette */}
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      background:
                        "radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(0,0,0,1) 80%)",
                      opacity: 0.85,
                    }}
                  />
                </Box>
              </RevealOnScroll>
            ))}
          </Box>

          {/* Subtle footer line (same vibe as ContactPage divider) */}
          <RevealOnScroll delay={0.28}>
            <Box
              sx={{
                mt: { xs: 4, sm: 5 },
                width: "100%",
                maxWidth: 860,
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(124,58,237,0.35) 20%, rgba(34,211,238,0.28) 50%, rgba(79,70,229,0.35) 80%, rgba(0,0,0,0) 100%)",
                opacity: 0.9,
              }}
            />
          </RevealOnScroll>
        </Box>
      </Box>
    </Box>
  )
}
