import React, { useMemo } from "react"
import Head from "next/head"
import { SOCIAL_IMAGE_URL, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT } from "../lib/socialPreview"
import { Box, Link } from "@mui/material"
import LegalDocument, { LegalText as SubText } from "../components/LegalDocument"
import { CONTACT_EMAIL } from "../lib/contactDetails"

export default function TermsPage() {
  // ---- SEO ----
  const SITE_NAME = "Bergquist Applications"
  const SITE_URL = "https://bergquistapplications.com"
  const PAGE_PATH = "/terms"
  const PAGE_URL = `${SITE_URL}${PAGE_PATH}`

  const TITLE = `Terms of Service | ${SITE_NAME}`
  const DESCRIPTION =
    "Terms of Service for Bergquist Applications — conditions for using our site and engaging our website development and consulting services."

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

  return <LegalDocument title="Terms of Service" description="Terms that apply when you use our website or engage our services." updated={LAST_UPDATED} sections={sections}>
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
