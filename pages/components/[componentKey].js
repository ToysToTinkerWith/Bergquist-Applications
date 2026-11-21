import React from "react"
import Head from "next/head"
import dynamic from "next/dynamic"
import SiteLink from "../../components/SiteLink"
import { Box, CircularProgress } from "@mui/material"
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import styles from "../../styles/component-catalog.module.css"
import { WorkspaceTheme, Workspace, s as workspaceStyles } from "../../components/showcase/Workspace"

function DemoLoading() {
  return <Box role="status" aria-label="Loading component" sx={{ minHeight: 500, display: "grid", placeItems: "center" }}>
    <CircularProgress size={26} thickness={2} />
  </Box>
}

const ApplicationsBarGraph = dynamic(() => import("../../components/showcase/ApplicationsWorkspace"), { ssr: false, loading: DemoLoading })
const SchedulerPage = dynamic(() => import("../../components/showcase/SchedulerWorkspace"), { ssr: false, loading: DemoLoading })
const LifeTimeline = dynamic(() => import("../../components/showcase/TimelineWorkspace"), { ssr: false, loading: DemoLoading })
const SpaceRocketGame = dynamic(() => import("../../components/SpaceRocketGame"), { ssr: false, loading: DemoLoading })
const MoonMesh = dynamic(() => import("../../components/MoonMesh"), { ssr: false, loading: DemoLoading })
const HomeDesignComponent = dynamic(() => import("../../components/HomeDesignComponent"), { ssr: false, loading: DemoLoading })
import COMPONENT_CATALOG from "../../lib/componentCatalog.json"
import { BusinessNextStep } from "../../components/showcase/BusinessContext"
import InteractiveDesignCollection from "../../components/showcase/InteractiveDesignCollection"
const SimpleFeatureDemo = dynamic(() => import("../../components/showcase/SimpleFeatureDemo"), { ssr: false, loading: DemoLoading })
import UNLISTED_COMPONENTS from "../../lib/unlistedComponents.json"
const StripeCatalog = dynamic(() => import("../../components/showcase/CommerceWorkspace"), { ssr: false, loading: DemoLoading })
const StripePurchaseAnalytics = dynamic(() => import("../../components/showcase/SalesWorkspace"), { ssr: false, loading: DemoLoading })
const TinymanPoolCandles = dynamic(() => import("../../components/showcase/MarketWorkspace"), { ssr: false, loading: DemoLoading })
const AlgorandWalletManager = dynamic(() => import("../../components/showcase/WalletWorkspace"), { ssr: false, loading: DemoLoading })
const Chat = dynamic(() => import("../../components/showcase/AssistantWorkspace"), { ssr: false, loading: DemoLoading })
const BusinessNotesWorkspace = dynamic(() => import("../../components/showcase/BusinessNotesWorkspace"), { ssr: false, loading: DemoLoading })

const SITE_NAME = "Bergquist Applications"

// Keep existing demo links working without listing them in the public catalog.
const COMPONENTS = [...COMPONENT_CATALOG, ...UNLISTED_COMPONENTS]

const exampleEvents = [
  {
    date: "2020-06-15",
    type: "Education",
    title: "Graduated college",
    summary: "Completed my degree in Computer Science.",
    highlights: [
      "Built projects with fellow Computer Science students",
      "Gained familiarity with computer concepts and languages",
    ],
    tags: ["Computer Science", "Foundation", "Launch"],
  },
  {
    date: "2021-08-10",
    type: "Stack Upgrade",
    title: "Built web application using React and Firebase",
    summary:
      "Developed a location based social media site using Google Maps, Firebase, and React.",
    highlights: [
      "Map based UI with overlay",
      "Location and image based data displayed over a map",
      "Hosting and deploy workflow",
    ],
    tags: ["React", "Firebase", "Google Maps"],
  },
  {
    date: "2022-02-05",
    type: "Stack Upgrade",
    title: "Adopted Next.js and Stripe",
    summary:
      "Moved to a framework that made server functions and payment processing easier to ship.",
    highlights: [
      "Added API routes and server functions",
      "Integrated Stripe payment workflows",
    ],
    tags: ["Next.js", "Stripe"],
  },
  {
    date: "2023-06-18",
    type: "Stack Upgrade",
    title: "Deployed first smart contract on Algorand",
    summary:
      "Created Algorand smart contract TEAL code and deployed it to the blockchain.",
    highlights: [
      "Explored programmable value",
      "Added blockchain-native application experience",
    ],
    tags: ["Algorand", "Web3", "Blockchain"],
  },
  {
    date: "2025-05-23",
    type: "Business",
    title: "Established Bergquist Applications LLC",
    summary:
      "Formed an official business entity for custom web application work.",
    highlights: [
      "Created a formal foundation for client application work",
      "Shifted personal development work into an official business",
    ],
    tags: ["Business", "LLC", "Freelance"],
  },
]


function renderComponent(componentKey) {
  switch (componentKey) {
    case "quote-builder":
    case "inquiry-pipeline":
    case "service-configurator":
    case "document-intake":
    case "customer-portal":
    case "appointment-booking":
      return <SimpleFeatureDemo key={componentKey} componentKey={componentKey} />
    case "interactive-design":
      return <InteractiveDesignCollection />
    case "applications-graph":
      return <ApplicationsBarGraph />
    case "scheduler":
    case "team-calendar":
      return <SchedulerPage />
    case "life-timeline":
      return <LifeTimeline events={exampleEvents} />
    case "space-rocket-game":
      return <Workspace title="Orbital arena" status="Local game · No account required"><div className={workspaceStyles.legacy}><SpaceRocketGame /></div></Workspace>
    case "earth-moon-world":
    case "expedition-showcase":
    case "mars-landing":
    case "pioneer-flight-deck":
    case "solar-system-journey":
      return <HomeDesignComponent componentKey={componentKey} />
    case "moon-mesh":
      return <MoonMesh />
    case "earth-mesh":
      return <MoonMesh planet="earth" />
    case "mars-mesh":
      return <MoonMesh planet="mars" />
    case "mercury-mesh":
      return <MoonMesh planet="mercury" />
    case "venus-mesh":
      return <MoonMesh planet="venus" />
    case "jupiter-mesh":
      return <MoonMesh planet="jupiter" />
    case "saturn-mesh":
      return <MoonMesh planet="saturn" />
    case "uranus-mesh":
      return <MoonMesh planet="uranus" />
    case "neptune-mesh":
      return <MoonMesh planet="neptune" />
    case "sun-mesh":
      return <MoonMesh planet="sun" />
    case "stripe-catalog-financial":
      return <StripeCatalog />
    case "stripe-analytics-financial":
      return <StripePurchaseAnalytics />
    case "algorand-wallet-financial":
      return <AlgorandWalletManager />
    case "tinyman-candles-financial":
      return <TinymanPoolCandles />
    case "ai-chat-bot":
      return <Chat />
    case "business-notes":
      return <BusinessNotesWorkspace />
    default:
      return null
  }
}

export async function getStaticPaths() {
  return {
    paths: COMPONENTS.filter(component => component.key !== "restaurant-ordering").map((component) => ({
      params: { componentKey: component.key },
    })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const component = COMPONENTS.find(
    (item) => item.key === params?.componentKey
  )

  if (!component) return { notFound: true }

  return {
    props: {
      componentKey: component.key,
      componentCategory: component.category,
    },
  }
}

export default function ComponentDetailPage({ componentKey }) {
  const component = COMPONENTS.find((item) => item.key === componentKey)
  const renderedComponent = renderComponent(componentKey)
  if (!component || !renderedComponent) return null

  return <main className={styles.catalog}>
    <Head>
      <title>{`${component.title} | Components | ${SITE_NAME}`}</title>
      <meta name="description" content={component.description} />
      <link rel="canonical" href={`https://bergquistapplications.com/components/${component.key}`} />
      {componentKey === "business-notes" && <meta name="robots" content="noindex, nofollow" />}
    </Head>
    <div className={styles.container}>
      <header className={`${styles.detailIntro} ${component.category !== "Design" ? styles.practicalIntro : ""}`}>
        <SiteLink href={`/components?category=${encodeURIComponent(component.outcome || (component.category === "Design" ? "Interactive design" : component.category))}`} className={styles.detailLink}><ArrowBackRoundedIcon fontSize="small" />{component.outcome || component.category} examples</SiteLink>
        <p className={styles.eyebrow}>{component.subcategory}</p>
        <h1>{component.title}</h1>
        <p>{component.description}</p>
      </header>
    </div>
    <div className={component.category === "Design" ? styles.demo : styles.practicalDemo} data-component-preview={componentKey}><WorkspaceTheme>{renderedComponent}</WorkspaceTheme></div>
    {componentKey !== "business-notes" && <div className={styles.container}><BusinessNextStep component={component} /></div>}
  </main>
}
