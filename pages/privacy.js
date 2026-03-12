// pages/privacy.jsx
// Privacy Policy page (Pages Router) — matches your black + gradient Bemora theme
// Includes next/head SEO + JSON-LD
// Requires: @mui/material, framer-motion

import React, { useEffect, useMemo, useRef, useState } from "react"
import Head from "next/head"
import { Box, Typography, Divider, Link, Stack } from "@mui/material"
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

export default function PrivacyPage() {
  // ---- SEO ----
  const SITE_NAME = "Bergquist Applications"
  const SITE_URL = "https://bergquistapplications.com"
  const PAGE_PATH = "/privacy"
  const PAGE_URL = `${SITE_URL}${PAGE_PATH}`

  const TITLE = `Privacy Policy | ${SITE_NAME}`
  const DESCRIPTION =
    "Privacy Policy for Bergquist Applications — how we collect, use, and protect information when you visit our site or work with us."

  const OG_IMAGE = `${SITE_URL}/og/bergquist-applications.jpg`
  const LAST_UPDATED = "February 17, 2026" // update whenever you change this page

  const jsonLdWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    url: PAGE_URL,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    dateModified: "2026-02-17",
  }

  // ---- Content ----
  const sections = useMemo(
    () => [
      {
        title: "Overview",
        body: (
          <>
            <SubText>
              This Privacy Policy explains how {SITE_NAME} (“we”, “us”, “our”) collects, uses, and
              protects information when you visit {SITE_URL} (the “Site”) or engage our website
              development and consulting services (the “Services”).
            </SubText>
            <SubText sx={{ mt: 1.5 }}>
              If you have questions, contact us at{" "}
              <Link
                href="mailto:abergquist96@gmail.com"
                underline="hover"
                sx={{ color: "rgba(216, 229, 254, 0.92)" }}
              >
                abergquist96@gmail.com
              </Link>
              .
            </SubText>
          </>
        ),
      },
      {
        title: "Information We Collect",
        body: (
          <>
            <SubText>
              We collect information in three main ways:
            </SubText>
            <Box sx={{ mt: 1.25, pl: 2 }}>
              <SubText>
                • <b>Information you provide:</b> name, email, phone number, company details,
                project requirements, messages, and any files or content you submit through forms,
                email, or other communication channels.
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • <b>Information collected automatically:</b> basic usage data such as IP address,
                browser type, pages viewed, approximate location (city/state), referring pages,
                and timestamps. This is typically collected via standard server logs and analytics.
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • <b>Client / project data:</b> if you hire us, you may share credentials, source
                code, design assets, content, and business data needed to deliver the Services.
                We treat client project data as confidential.
              </SubText>
            </Box>
          </>
        ),
      },
      {
        title: "How We Use Information",
        body: (
          <>
            <SubText>We use information to:</SubText>
            <Box sx={{ mt: 1.25, pl: 2 }}>
              <SubText>• Respond to inquiries and communicate with you.</SubText>
              <SubText sx={{ mt: 0.75 }}>
                • Provide, operate, and improve the Site and Services (including debugging and performance monitoring).
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • Prepare proposals, statements of work, invoices, and project deliverables.
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • Protect against fraud, abuse, and security incidents.
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • Comply with legal obligations.
              </SubText>
            </Box>
          </>
        ),
      },
      {
        title: "Cookies and Analytics",
        body: (
          <>
            <SubText>
              We may use cookies or similar technologies to maintain site functionality and understand
              usage trends. You can typically control cookies through your browser settings.
            </SubText>
            <SubText sx={{ mt: 1.5 }}>
              If we use third-party analytics, those providers may set cookies and process usage data
              under their own privacy policies. We configure analytics, where possible, to reduce data
              collection to what’s necessary.
            </SubText>
          </>
        ),
      },
      {
        title: "Sharing and Disclosure",
        body: (
          <>
            <SubText>
              We do not sell your personal information. We may share information only in the following
              circumstances:
            </SubText>
            <Box sx={{ mt: 1.25, pl: 2 }}>
              <SubText>
                • <b>Service providers:</b> vendors that help us operate (hosting, email, analytics, billing),
                under appropriate confidentiality and data-protection terms.
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • <b>Legal requirements:</b> if required by law, regulation, or valid legal process.
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • <b>Business protection:</b> to investigate or prevent fraud, abuse, or security issues.
              </SubText>
            </Box>
          </>
        ),
      },
      {
        title: "Client Confidentiality",
        body: (
          <>
            <SubText>
              Client information, credentials, source code, and project materials are treated as confidential
              and used only to provide the Services. We recommend using least-privilege access and
              separate credentials for contractors whenever possible.
            </SubText>
          </>
        ),
      },
      {
        title: "Data Retention",
        body: (
          <>
            <SubText>
              We retain personal information only as long as necessary for the purposes described above,
              including maintaining business records, resolving disputes, and enforcing agreements.
              Client project data is retained according to the needs of the engagement and any applicable
              contractual terms.
            </SubText>
          </>
        ),
      },
      {
        title: "Security",
        body: (
          <>
            <SubText>
              We use reasonable administrative, technical, and organizational safeguards designed to protect
              information from unauthorized access, disclosure, or loss. No method of transmission or storage
              is 100% secure, so we cannot guarantee absolute security.
            </SubText>
          </>
        ),
      },
      {
        title: "Your Choices",
        body: (
          <>
            <SubText>
              You may request access, correction, or deletion of personal information we hold about you,
              subject to legal and contractual limitations. You can also opt out of non-essential cookies
              via your browser settings.
            </SubText>
          </>
        ),
      },
      {
        title: "Children’s Privacy",
        body: (
          <>
            <SubText>
              The Site and Services are not directed to children under 13, and we do not knowingly collect
              personal information from children.
            </SubText>
          </>
        ),
      },
      {
        title: "Third-Party Links",
        body: (
          <>
            <SubText>
              The Site may contain links to third-party websites. We are not responsible for the privacy
              practices of those third parties. Review their policies before providing information.
            </SubText>
          </>
        ),
      },
      {
        title: "Changes to This Policy",
        body: (
          <>
            <SubText>
              We may update this Privacy Policy from time to time. The “Last updated” date reflects the
              most recent revision.
            </SubText>
          </>
        ),
      },
      {
        title: "Contact",
        body: (
          <>
            <SubText>
              For privacy questions or requests, contact{" "}
              <Link
                href="mailto:abergquist96@gmail.com"
                underline="hover"
                sx={{ color: "rgba(216, 229, 254, 0.92)" }}
              >
                abergquist96@gmail.com
              </Link>
              .
            </SubText>
          </>
        ),
      },
    ],
    [SITE_NAME, SITE_URL]
  )

  return (
    <Box sx={{ width: "100%", backgroundColor: "black", minHeight: "100vh" }}>
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

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebPage) }}
        />
      </Head>

      {/* Hero header */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 10, sm: 12, md: 14 },
          pb: { xs: 6, sm: 7, md: 8 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1200 }}>
          <RevealOnScroll>
            <GradientTitle variant="h2" align="center" sx={{ letterSpacing: 1.8 }}>
              Privacy Policy
            </GradientTitle>
            <Typography
              variant="h6"
              align="center"
              sx={{
                mt: 1.25,
                color: "rgba(216, 229, 254, 0.86)",
                lineHeight: 1.6,
                maxWidth: 860,
                mx: "auto",
              }}
            >
              How we handle information when you visit our site or work with us.
            </Typography>
            <Typography
              variant="body2"
              align="center"
              sx={{ mt: 1.5, color: "rgba(216, 229, 254, 0.68)" }}
            >
              Last updated: {LAST_UPDATED}
            </Typography>
          </RevealOnScroll>
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 10, sm: 12, md: 14 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1200 }}>
          {/* Soft divider */}
          <Divider
            sx={{
              borderColor: "rgba(216, 229, 254, 0.14)",
              mb: { xs: 3.5, sm: 4.5 },
            }}
          />

          <Stack spacing={{ xs: 3.5, sm: 4 }}>
            {sections.map((s, idx) => (
              <RevealOnScroll key={s.title} delay={0.05 * idx}>
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: 3,
                    overflow: "hidden",
                    background:
                      "linear-gradient(180deg, rgba(124,58,237,0.08) 0%, rgba(34,211,238,0.03) 100%)",
                    border: "1px solid rgba(216, 229, 254, 0.12)",
                    boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
                    p: { xs: 2.25, sm: 3, md: 3.25 },
                  }}
                >
                  <GradientTitle
                    variant="h5"
                    align="left"
                    sx={{ mb: 1.25, letterSpacing: 0.8, textShadow: "none" }}
                  >
                    {s.title}
                  </GradientTitle>
                  {s.body}
                </Box>
              </RevealOnScroll>
            ))}
          </Stack>

      
        </Box>
      </Box>
    </Box>
  )
}
