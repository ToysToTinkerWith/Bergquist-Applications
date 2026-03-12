// pages/components/SplashVideoHero.jsx
// Requires: @mui/material, framer-motion, next/head

import React, { useEffect, useMemo, useRef, useState } from "react"
import Head from "next/head"
import { Box, Typography } from "@mui/material"
import { motion } from "framer-motion"

function RevealOnScroll({
  children,
  delay = 0,
  threshold = 0.35,
  rootMargin = "0px 0px -15% 0px",
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

export default function SplashVideoHero({
  line1 = "Bergquist Applications",
  line2 = "Connection Starts Here",
  videoSrc = "/home/splash.mp4",
  minHeight = "100vh",
  maxWidth = 1200,
  videoFadeDuration = 2,
  videoFadeDelay = 0.25,
}) {
  // ---- SEO constants (adjust if you want) ----
  const SITE_NAME = "Bergquist Applications"
  const SITE_URL = "https://bergquistapplications.com"
  const PAGE_URL = `${SITE_URL}/`

  const TITLE = `${SITE_NAME} | Web Applications for the Future`
  const DESCRIPTION =
    "Bergquist Applications builds modern web applications with a focus on data, finance, and AI — fast, secure, and built to scale."

  const OG_IMAGE = `${SITE_URL}/og/bergquist-applications.jpg`

  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  }

  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  }

  const categories = useMemo(
    () => [
      {
        title: "Data",
        video: "/home/data.mp4",
        desc:
          "Build a reliable data foundation with clean pipelines, integrations, and dashboards — so you can make faster, informed decisions.",
      },
      {
        title: "Finance",
        video: "/home/finance.mp4",
        desc:
          "Design and deliver secure, auditable financial workflows — payments, reconciliation, and reporting.",
      },
      {
        title: "AI",
        video: "/home/AI.mp4",
        desc:
          "Automate workflows, improve accuracy, and scale operations - free your team to focus on high-value initiatives.",
      },
    ],
    []
  )

  return (
    <Box sx={{ width: "100%", backgroundColor: "black" }}>
      {/* SEO HEAD */}
      <Head>
        {/* Primary */}
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Canonical */}
        <link rel="canonical" href={PAGE_URL} />

        {/* Robots */}
        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
        <meta name="googlebot" content="index,follow" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:secure_url" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />

        {/* Favicons / App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme Color */}
        <meta name="theme-color" content="#000000" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </Head>

      {/* HERO */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "black",
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth,
            minHeight,
            overflow: "hidden",
            backgroundColor: "black",
          }}
        >
          {/* Background video (fades in) */}
          <Box
            component={motion.video}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: videoFadeDuration,
              ease: "easeOut",
              delay: videoFadeDelay,
            }}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.85) contrast(1.08)",
              transform: "translateZ(0)",
            }}
          >
            <source src={videoSrc} type="video/mp4" />
          </Box>

          {/* Full-edge vignette */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0) 65%, rgba(0,0,0,1) 72%)",
            }}
          />

          {/* Text layer */}
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              height: "100%",
              minHeight,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              pt: { xs: 10, sm: 12, md: 14 },
              px: { xs: 2, sm: 4 },
              textAlign: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 120 }}
              animate={{ opacity: 1, y: 100 }}
              transition={{ duration: 4, ease: "easeOut", delay: 1.5 }}
              style={{ width: "100%" }}
            >
              <Typography
                variant="h2"
                align="center"
                sx={{
                  letterSpacing: 2,
                  fontFamily: "Bemora",
                  lineHeight: 1.5,
                  backgroundImage:
                    "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                }}
              >
                {line1}
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 120 }}
              transition={{ duration: 2, ease: "easeOut", delay: 3.25 }}
              style={{ width: "100%" }}
            >
              <Typography
                variant="h5"
                sx={{
                  color: "rgba(216, 229, 254, 0.88)",
                }}
              >
                {line2}
              </Typography>
            </motion.div>
          </Box>
        </Box>
      </Box>

      {/* DIGITAL IDENTITY */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "black",
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 7, sm: 8, md: 9 },
          pb: { xs: 7, sm: 8, md: 9 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth }}>
          <Box
            sx={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
              gap: { xs: 3, md: 4 },
              alignItems: "center",
            }}
          >
            {/* Video (circular with radial fade) */}
            <RevealOnScroll delay={0.08}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 520,
                  mx: { xs: "auto", md: 0 },
                  aspectRatio: "1 / 1",
                  borderRadius: "50%",
                  overflow: "hidden",
                  backgroundColor: "black",
                  boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
                }}
              >
                <Box
                  component="video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "brightness(0.95) contrast(1.05)",
                    transform: "translateZ(0)",
                    objectPosition: "center 40%",
                  }}
                >
                  <source src="/home/identity.mp4" type="video/mp4" />
                </Box>

                {/* Radial fade overlay */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%,  rgba(0,0,0,0.7) 60%, rgba(0,0,0,1) 80%)",
                  }}
                />
              </Box>
            </RevealOnScroll>

            {/* Text (title ABOVE blurb, smaller) */}
            <RevealOnScroll delay={0.12}>
              <Box sx={{ px: { xs: 0, md: 1 } }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "Bemora",
                    letterSpacing: 1.1,
                    lineHeight: 1.15,
                    textAlign: { xs: "center", md: "left" },
                    backgroundImage:
                      "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                    mb: 1.25,
                  }}
                >
                  Establishing your digital identity
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    textAlign: { xs: "center", md: "left" },
                    color: "rgba(216, 229, 254, 0.86)",
                    lineHeight: 1.7,
                    maxWidth: 720,
                    mx: { xs: "auto", md: 0 },
                  }}
                >
                  Your digital identity is how customers find you, trust you, and choose you. A polished
                  website, consistent branding, fast performance, and clear messaging turn a quick visit
                  into real business — and create a foundation you can build on as you grow.
                </Typography>
              </Box>
            </RevealOnScroll>
          </Box>
        </Box>
      </Box>

      {/* CATEGORIES */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "black",
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 8, sm: 10, md: 12 },
          pt: { xs: 6, sm: 7, md: 8 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: { xs: 3, sm: 3.5, md: 4 },
          }}
        >
          {categories.map((c, idx) => (
            <RevealOnScroll key={c.title} delay={0.12 * idx}>
              {/* Card inner */}
              <Box sx={{ position: "relative", zIndex: 1, p: { xs: 2, sm: 2.5, md: 3 } }}>
                <Typography
                  variant="h5"
                  align="center"
                  sx={{
                    fontFamily: "Bemora",
                    backgroundImage:
                      "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    letterSpacing: 0.6,
                    mb: 1.25,
                  }}
                >
                  {c.title}
                </Typography>

                {/* Video */}
                <Box
                  sx={{
                    width: "100%",
                    borderRadius: 2,
                    overflow: "hidden",
                    backgroundColor: "black",
                  }}
                >
                  <Box
                    component="video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    sx={{
                      display: "block",
                      width: "100%",
                      transform: "translateZ(0)",
                    }}
                  >
                    <source src={c.video} type="video/mp4" />
                  </Box>
                </Box>

                <Typography
                  variant="body1"
                  align="center"
                  sx={{
                    mt: 1.5,
                    color: "rgba(216, 229, 254, 0.82)",
                    lineHeight: 1.6,
                  }}
                >
                  {c.desc}
                </Typography>
              </Box>
            </RevealOnScroll>
          ))}
        </Box>
      </Box>

      {/* EXPAND YOUR HORIZONS */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "black",
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 10, sm: 12, md: 14 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
            gap: { xs: 3, md: 4 },
            alignItems: "center",
          }}
        >
          {/* Text */}
          <RevealOnScroll delay={0.05}>
            <Box sx={{ px: { xs: 0, md: 1 } }}>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: "Bemora",
                  letterSpacing: 1.2,
                  lineHeight: 1.2,
                  textAlign: { xs: "center", md: "left" },
                  backgroundImage:
                    "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                  mb: 1.25,
                }}
              >
                Expand your horizons
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  textAlign: { xs: "center", md: "left" },
                  color: "rgba(216, 229, 254, 0.86)",
                  lineHeight: 1.6,
                  maxWidth: 720,
                  mx: { xs: "auto", md: 0 },
                }}
              >
                Contact Bergquist Applications to see what modern web development can do for you.
              </Typography>
            </Box>
          </RevealOnScroll>

          {/* Video (circular with radial fade) */}
          <RevealOnScroll delay={0.12}>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: 520,
                mx: { xs: "auto", md: 0 },
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                overflow: "hidden",
                backgroundColor: "black",
                boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
              }}
            >
              <Box
                component="video"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.95) contrast(1.05)",
                  transform: "translateZ(0)",
                }}
              >
                <source src="/home/horizons.mp4" type="video/mp4" />
              </Box>

              {/* Radial fade overlay (keeps center visible, fades edges to black) */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  background:
                    "radial-gradient(ellipse at center, rgba(0,0,0,0) 65%, rgba(0,0,0,1) 72%)",
                }}
              />
            </Box>
          </RevealOnScroll>
        </Box>
      </Box>
    </Box>
  )
}