import React, { useMemo } from "react"
import Head from "next/head"
import { SOCIAL_IMAGE_URL, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT } from "../lib/socialPreview"
import { Box, Link } from "@mui/material"
import LegalDocument, { LegalText as SubText } from "../components/LegalDocument"
import { CONTACT_EMAIL } from "../lib/contactDetails"

export default function PrivacyPage() {
  // ---- SEO ----
  const SITE_NAME = "Bergquist Applications"
  const SITE_URL = "https://bergquistapplications.com"
  const PAGE_PATH = "/privacy"
  const PAGE_URL = `${SITE_URL}${PAGE_PATH}`

  const TITLE = `Privacy Policy | ${SITE_NAME}`
  const DESCRIPTION =
    "Privacy Policy for Bergquist Applications — how we collect, use, and protect information when you visit our site or work with us."

  const OG_IMAGE = SOCIAL_IMAGE_URL
  const LAST_UPDATED = "September 22, 2026" // update whenever you change this page

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
    dateModified: "2026-09-22",
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
                href={`mailto:${CONTACT_EMAIL}`}
                underline="hover"
                sx={{ color: "rgba(216, 229, 254, 0.92)" }}
              >
                {CONTACT_EMAIL}
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
                href={`mailto:${CONTACT_EMAIL}`}
                underline="hover"
                sx={{ color: "rgba(216, 229, 254, 0.92)" }}
              >
                {CONTACT_EMAIL}
              </Link>
              .
            </SubText>
          </>
        ),
      },
    ],
    [SITE_NAME, SITE_URL]
  )

  return <LegalDocument title="Privacy Policy" description="How we handle information when you visit our site or work with us." updated={LAST_UPDATED} sections={sections}>
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
        <meta property="og:image:width" content={SOCIAL_IMAGE_WIDTH} />
        <meta property="og:image:height" content={SOCIAL_IMAGE_HEIGHT} />
        <meta property="og:image:alt" content={SOCIAL_IMAGE_ALT} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <meta name="twitter:image:alt" content={SOCIAL_IMAGE_ALT} />

        <meta name="theme-color" content="#000000" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebPage) }}
        />
      </Head>
  </LegalDocument>
}
