// pages/applications-graph.jsx
// Page that calls ApplicationsBarGraph + LifeTimeline (exampleEvents defined locally)

import React, { useMemo } from "react"
import Head from "next/head"
import { Box, Divider, Typography, Stack } from "@mui/material"

import ApplicationsBarGraph from "../components/ApplicationsBarGraph"
import SchedulerPage from "../components/SchedulerPage"
import WorldStatsMiniCharts from "../components/WorldStatsMiniCharts"
import LifeTimeline from "../components/LifeTimeline"

function SectionIntro({
  title,
  subtitle,
  eyebrow,
  align = "center",
  maxWidth = 1100,
}) {
  return (
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
      <Box sx={{ width: "100%", maxWidth }}>
        <Stack
          spacing={2}
          sx={{
            textAlign: align,
            alignItems: align === "center" ? "center" : "flex-start",
          }}
        >
          {!!eyebrow && (
            <Typography
              sx={{
                fontSize: { xs: 12, sm: 13 },
                letterSpacing: 2,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.62)",
              }}
            >
              {eyebrow}
            </Typography>
          )}

          {!!title && (
            <Typography
              sx={{
                fontWeight: 600,
                fontSize: { xs: 24, sm: 34, md: 44 },
                fontFamily: "Bemora",
                lineHeight: 2.05,
                letterSpacing: 5,
                background:
                  "linear-gradient(90deg, rgba(124,58,237,1) 0%, rgba(34,211,238,1) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {title}
            </Typography>
          )}

          {!!subtitle && (
            <Typography
              sx={{
                maxWidth: 900,
                fontSize: { xs: 15, sm: 16, md: 18 },
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              {subtitle}
            </Typography>
          )}

    
        </Stack>
      </Box>
    </Box>
  )
}

export default function ApplicationsGraphPage() {
  const SITE_NAME = "Bergquist Applications"
  const TITLE = `Applications Graph | ${SITE_NAME}`
  const DESCRIPTION = "A tag-sorted bar graph of applications built by Bergquist Applications."

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

  // Example timeline events (post-2020). Replace with your real dates/details.
  const exampleEvents = useMemo(
    () => [
      {
        date: "2020-06-15",
        type: "Education",
        title: "Graduated college",
        summary: "Completed my degree in Computer Science",
        highlights: [
          "Built projects with fellow Computer Science students",
          "Gained familiarity with computer concepts and languages",
        ],
        tags: ["Portfolio", "Full-stack", "Launch"],
      },
      {
        date: "2021-08-10",
        type: "Stack Upgrade",
        title: "Built web application using React and Firebase",
        summary: "Delivered a tree based social media site using Goolge Maps, Firebase, and React",
        highlights: ["Map based UI with overlay", "Adding of location and image based data to display over map", "Set up hosting + deploy workflow"],
        tags: ["React", "Client Work", "Deployment"],
      },
      {
        date: "2022-02-05",
        type: "Stack Upgrade",
        title: "Adopted Next.js + Stripe for server functions",
        summary: "Moved to a more complete web development framework that enabled me to add the payment processor Stripe",
        highlights: ["Gained the abiliy to add APIs and server functions", "More compatable with services that require backend integrations"],
        tags: ["Next.js", "Stripe"],
      },
      {
        date: "2022-06-18",
        type: "Education",
        title: "Developed interest in blockchain technology",
        summary: "Researched fundamentals and advantages of using a decentralized finace",
        highlights: ["Designed Firestore collections for scale", "Built admin views + access boundaries"],
        tags: ["Firebase", "Firestore", "Auth"],
      },
      {
        date: "2023-01-22",
        type: "Payments",
        title: "Shipped Stripe Checkout in a web application",
        summary: "Implemented payments with reliable webhook-driven order updates.",
        highlights: ["Webhook ingestion + idempotent updates", "Receipt/status pages driven by Firestore"],
        tags: ["Stripe", "Webhooks", "E-commerce"],
      },
      {
        date: "2023-08-09",
        type: "Blockchain",
        title: "Started building with Algorand",
        summary: "Began exploring on-chain assets and integrating blockchain concepts into web UX.",
        highlights: ["Worked with ASA concepts and data flows", "Prototyped Web3 features into UI"],
        tags: ["Algorand", "Web3", "ASA"],
      },
      {
        date: "2024-03-14",
        type: "Product",
        title: "Built a scheduler tool with calendar UI",
        summary: "Created a scheduling experience with modern UI patterns and persistence.",
        highlights: ["Calendar interactions + event dialogs", "Firestore-backed storage + real-time updates"],
        tags: ["FullCalendar", "Firestore", "Productivity"],
      },
      {
        date: "2024-11-09",
        type: "Game Dev",
        title: "Launched a blockchain game prototype",
        summary: "Released a playable experience combining NFTs, game logic, and web UI.",
        highlights: ["Champion/NFT-driven gameplay loop", "Reward logic and strong UI feedback loops"],
        tags: ["Gaming", "NFT", "Algorand"],
      },
      {
        date: "2025-02-28",
        type: "Creative",
        title: "Started a fantasy card game project",
        summary: "Began building a new game concept with lore, systems, and UI scaffolding.",
        highlights: ["Defined core mechanics + content structure", "Planned scalable content pipelines"],
        tags: ["Game Design", "Lore", "Systems"],
      },
      {
        date: "2025-07-24",
        type: "Engineering",
        title: "Implemented drag-and-drop syncing to Firestore",
        summary: "Built a UX where drag actions update Firestore and local state reliably.",
        highlights: ["Handled optimistic UI + rollback paths", "Conflict-safe updates and clean removals"],
        tags: ["Firestore", "Drag and Drop", "React"],
      },
      {
        date: "2026-02-10",
        type: "Business",
        title: "Expanded Bergquist Applications demos into a cohesive showcase",
        summary: "Unified multiple projects under one theme with consistent UI, navigation, and branding.",
        highlights: ["Standardized styling tokens across components", "Improved presentation + discoverability"],
        tags: ["Branding", "UI/UX", "Showcase"],
      },
    ],
    []
  )

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", backgroundColor: "black" }}>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Top narrative: DATA + why it matters */}
      <SectionIntro
        eyebrow="Digital Presence"
        title="DATA"
        subtitle={
          "Everything can be measured — from a single website to the world itself: what people care about, what’s working, and what needs to change next. When you measure the right signals, your website stops being a static page and becomes a living, breathing system you can continuously refine."
        }
      />

      <WorldStatsMiniCharts />

      {/* Narrative bridge: storytelling through data visualization */}
      <SectionIntro
        eyebrow="Storytelling"
        title="Stories live beyond words"
        subtitle={
          "Charts and visuals turn raw facts into meaning you can grasp at a glance, revealing patterns, turning points, and momentum. It’s how data becomes a story people can understand."
        }
      />

      {/* Life timeline section */}
      <LifeTimeline
        events={exampleEvents}
        headerTitle="My Journey"
        headerSubtitle="Key milestones since 2020 — focused on web development."
        lastUpdated="February 26, 2026"
        showPageSection
      />

      {/* Narrative bridge: showcasing work + skills via data */}
      <SectionIntro
        eyebrow="Portfolio"
        title="Data-Driven Proof"
        subtitle={
          "Back up what you build with measurable evidence — real metrics, clear trends, and outcomes you can point to. It turns claims into credibility by showing what changed, and how you improve over time."
        }
        maxWidth={1200}
      />

      {/* Applications graph section */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 6, sm: 7, md: 8 },
          pb: { xs: 10, sm: 12, md: 14 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1200 }}>
          <ApplicationsBarGraph
            apps={defaultApps}
            headerTitle="Applications"
            headerSubtitle="Click a tag to see which applications are under it."
            lastUpdated="February 26, 2026"
            maxBars={24}
            showPageSection={false}
          />
        </Box>
      </Box>

      {/* Narrative bridge: invite interaction + lifestyle data */}
      <SectionIntro
        eyebrow="Try it"
        title="Collect & Visualize"
        subtitle={
          "Components that turns your routine data into quick clarity — pulling in the signals and showing them in one place, so you can spot changes fast, stay on track, and decide what to do next."
        }
        maxWidth={1100}
      />

      <SchedulerPage />
    </Box>
  )
}