// pages/terms.jsx
// Terms of Service page (Pages Router) — matches your black + gradient Bemora theme
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

export default function TermsPage() {
  // ---- SEO ----
  const SITE_NAME = "Bergquist Applications"
  const SITE_URL = "https://bergquistapplications.com"
  const PAGE_PATH = "/terms"
  const PAGE_URL = `${SITE_URL}${PAGE_PATH}`

  const TITLE = `Terms of Service | ${SITE_NAME}`
  const DESCRIPTION =
    "Terms of Service for Bergquist Applications — conditions for using our site and engaging our website development and consulting services."

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

  const sections = useMemo(
    () => [
      {
        title: "Agreement to Terms",
        body: (
          <>
            <SubText>
              These Terms of Service (“Terms”) govern your access to and use of {SITE_URL} (the “Site”)
              and any website development, consulting, or related services provided by {SITE_NAME}
              (the “Services”). By accessing the Site or using the Services, you agree to be bound by
              these Terms.
            </SubText>
          </>
        ),
      },
      {
        title: "Scope of Services",
        body: (
          <>
            <SubText>
              The Services may include design, development, deployment, maintenance, consulting, integration work,
              and related deliverables as described in a proposal, statement of work (“SOW”), invoice, or written
              agreement. Any timelines, pricing, and deliverables are defined by the applicable SOW or agreement.
            </SubText>
          </>
        ),
      },
      {
        title: "Client Responsibilities",
        body: (
          <>
            <SubText>To help ensure successful delivery, you agree to:</SubText>
            <Box sx={{ mt: 1.25, pl: 2 }}>
              <SubText>• Provide timely feedback, approvals, and required materials (content, assets, access).</SubText>
              <SubText sx={{ mt: 0.75 }}>
                • Ensure you have rights to any materials you provide (logos, images, copy, data).
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • Maintain backups of your content and systems unless the SOW states otherwise.
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • Use least-privilege access and separate credentials when granting contractor access.
              </SubText>
            </Box>
          </>
        ),
      },
      {
        title: "Payments, Fees, and Invoicing",
        body: (
          <>
            <SubText>
              Fees, payment schedules, deposits, milestones, and late-payment terms are specified in the applicable
              proposal/SOW/invoice. Unless otherwise stated, invoices are due upon receipt. Late payments may result in
              paused work and/or delayed delivery.
            </SubText>
          </>
        ),
      },
      {
        title: "Changes and Revisions",
        body: (
          <>
            <SubText>
              You may request changes to the scope. If a request is outside the agreed scope, it may require a change
              order and additional fees and/or time. We’ll communicate material scope changes before proceeding.
            </SubText>
          </>
        ),
      },
      {
        title: "Intellectual Property",
        body: (
          <>
            <SubText>
              Unless stated otherwise in writing:
            </SubText>
            <Box sx={{ mt: 1.25, pl: 2 }}>
              <SubText>
                • <b>Client materials:</b> You retain ownership of materials you provide to us.
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • <b>Deliverables:</b> Upon full payment, you receive a license (or ownership if specified) to use the
                final deliverables created for you, excluding third-party components.
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • <b>Pre-existing tools:</b> We retain ownership of our pre-existing templates, libraries, code snippets,
                processes, and know-how used to deliver the Services.
              </SubText>
              <SubText sx={{ mt: 0.75 }}>
                • <b>Third-party software:</b> Frameworks, libraries, fonts, and other third-party assets remain subject to
                their respective licenses.
              </SubText>
            </Box>
          </>
        ),
      },
      {
        title: "Confidentiality",
        body: (
          <>
            <SubText>
              We treat client project information (including access credentials, source code, business data, and design assets)
              as confidential and use it only to provide the Services. We may require or offer a separate NDA for certain projects.
            </SubText>
          </>
        ),
      },
      {
        title: "Site Use and Acceptable Use",
        body: (
          <>
            <SubText>
              You agree not to misuse the Site or Services. This includes attempting to gain unauthorized access, disrupting
              systems, distributing malware, or using the Site in violation of applicable laws.
            </SubText>
          </>
        ),
      },
      {
        title: "Third-Party Services",
        body: (
          <>
            <SubText>
              Projects may rely on third-party services (hosting, email, analytics, payments, APIs, cloud providers). Those
              services are governed by their own terms and privacy policies. You are responsible for maintaining your accounts
              and compliance with third-party terms unless otherwise agreed.
            </SubText>
          </>
        ),
      },
      {
        title: "Warranties and Disclaimers",
        body: (
          <>
            <SubText>
              The Site and Services are provided “as is” and “as available.” We do not warrant that the Site will be uninterrupted
              or error-free, or that the Services will meet all requirements beyond what is expressly stated in a written agreement.
              Some jurisdictions do not allow certain disclaimers, so portions of this section may not apply to you.
            </SubText>
          </>
        ),
      },
      {
        title: "Limitation of Liability",
        body: (
          <>
            <SubText>
              To the maximum extent permitted by law, {SITE_NAME} will not be liable for indirect, incidental, special, consequential,
              or punitive damages, or any loss of profits, revenues, data, or goodwill arising from your use of the Site or Services.
              Our total liability for any claim relating to the Services will not exceed the amount you paid to us for the Services
              in the three (3) months preceding the event giving rise to the claim, unless a written agreement states otherwise.
            </SubText>
          </>
        ),
      },
      {
        title: "Indemnification",
        body: (
          <>
            <SubText>
              You agree to indemnify and hold harmless {SITE_NAME} from claims, liabilities, damages, and expenses (including reasonable
              attorneys’ fees) arising from your misuse of the Site/Services, your content, or your violation of these Terms or applicable law.
            </SubText>
          </>
        ),
      },
      {
        title: "Termination",
        body: (
          <>
            <SubText>
              We may suspend or terminate access to the Site if necessary to protect the Site, our users, or our rights. For Services engagements,
              termination rights and effects (including outstanding fees and deliverable handoff) should be covered in the SOW or agreement.
            </SubText>
          </>
        ),
      },
      {
        title: "Governing Law",
        body: (
          <>
            <SubText>
              These Terms are governed by the laws of the jurisdiction where {SITE_NAME} operates, without regard to conflict of law principles.
              Venue and dispute resolution may be further defined in a written agreement for Services.
            </SubText>
          </>
        ),
      },
      {
        title: "Changes to These Terms",
        body: (
          <>
            <SubText>
              We may update these Terms from time to time. The “Last updated” date reflects the most recent revision. Continued use of the Site
              after changes become effective constitutes acceptance of the updated Terms.
            </SubText>
          </>
        ),
      },
      {
        title: "Contact",
        body: (
          <>
            <SubText>
              Questions about these Terms? Contact{" "}
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

      {/* Header */}
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
              Terms of Service
            </GradientTitle>
            <Typography
              variant="h6"
              align="center"
              sx={{
                mt: 1.25,
                color: "rgba(216, 229, 254, 0.86)",
                lineHeight: 1.6,
                maxWidth: 900,
                mx: "auto",
              }}
            >
              Terms that apply when you use our website and when you engage our services.
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
