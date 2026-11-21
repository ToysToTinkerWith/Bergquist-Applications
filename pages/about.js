import React, { useRef, useState } from "react"
import Head from "next/head"
import dynamic from "next/dynamic"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded"
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined"
import CodeRoundedIcon from "@mui/icons-material/CodeRounded"
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined"
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined"
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined"
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined"
import SiteLink from "../components/SiteLink"
import AndersSignature from "../components/AndersSignature"
import { componentPreview } from "../lib/componentPreviews"
import styles from "../styles/about.module.css"

const AboutAstronaut = dynamic(() => import("../components/AboutAstronaut"), { ssr: false })

const fields = [
  { id: "ai", label: "AI", Icon: AutoAwesomeOutlinedIcon, title: "Assistance with a purpose.",
    description: "AI models can make websites more useful: answering common questions, organizing information, and helping visitors find their next step.",
    detail: "The AI assistant is one example. Clear boundaries, useful context, and thoughtful integration make it work for your business.",
    image: "ai-chat-bot", alt: "Bergquist's AI assistant component with a conversation and suggested questions", href: "/components/ai-chat-bot", link: "Try the AI assistant" },
  { id: "finance", label: "Finance", Icon: AccountBalanceWalletOutlinedIcon, title: "Less friction. More clarity.",
    description: "Buying something online should feel straightforward. I bring product catalogs, checkout, and sales reporting together so customers can find what they need and you can keep track of the business.",
    detail: "It's about making the day-to-day easier: taking payments, seeing what's selling, and understanding the numbers without jumping between tools.",
    image: "stripe-analytics-financial", alt: "Sales analytics component showing sample revenue trends and product performance", href: "/components/stripe-analytics-financial", link: "Explore sales analytics" },
  { id: "design", label: "Design", Icon: PaletteOutlinedIcon, title: "A little wonder. A clear purpose.",
    description: "Your website should feel like you. That might mean a simple, focused layout, a bit of motion, or a 3D experience that gives people a reason to stop and explore.",
    detail: "I enjoy finding those details, but they have to earn their place. People should be able to find what they need and use your site comfortably on any screen.",
    image: "expedition-showcase", alt: "Interactive design component featuring an astronaut and spacecraft", href: "/Design", link: "Explore the design collection" },
]
const journey = [
  { Icon: SchoolOutlinedIcon, title: "Computer science", text: "Western Washington University" },
  { Icon: CodeRoundedIcon, title: "Web development", text: "Ideas turned into global applications" },
  { Icon: ExploreOutlinedIcon, title: "Always exploring", text: "Modern web tools and possibilities." },
]
const process = [
  ["Understand", "Start with understanding the business, the people, and what outcomes we are aiming for."],
  ["Make it tangible", "I build a working prototype, then gather feedback from you."],
  ["Iterate", "We keep improving on the prototype, getting it closer to your vision, and testing out components that streamline your workflow."],
  ["Deploy", "Once the website meets your needs and feels right to you, we complete the final checks and bring it live. I'm here to help with updates and refinements along the way."],
]
export default function About() {
  const [selected, setSelected] = useState(0)
  const tabs = useRef([])
  const changeTab = (event, index) => {
    const next = event.key === "ArrowRight" ? (index + 1) % fields.length : event.key === "ArrowLeft" ? (index + fields.length - 1) % fields.length : event.key === "Home" ? 0 : event.key === "End" ? fields.length - 1 : null
    if (next === null) return
    event.preventDefault(); setSelected(next); tabs.current[next]?.focus()
  }
  return <>
    <Head>
      <title>About Anders | Bergquist Applications</title>
      <meta name="description" content="Meet Anders Bergquist, the developer behind your website, and learn how he works with you." />
      <link rel="canonical" href="https://bergquistapplications.com/about" />
      <meta property="og:title" content="About Anders | Bergquist Applications" />
      <meta property="og:description" content="Meet Anders Bergquist, the developer behind your website, and learn how he works with you." />
      <meta property="og:type" content="website" /><meta property="og:url" content="https://bergquistapplications.com/about" />
      <meta property="og:image" content="https://bergquistapplications.com/about/moon-landing-preview.webp" />
      <meta property="og:image:width" content="1200" /><meta property="og:image:height" content="600" />
      <meta property="og:image:alt" content="An astronaut waving beside the Pioneer spacecraft on the Moon" />
      <meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "AboutPage", name: "About Bergquist Applications", url: "https://bergquistapplications.com/about", description: "The background and approach behind Bergquist Applications.", about: { "@type": "Organization", name: "Bergquist Applications", url: "https://bergquistapplications.com" } }) }} />
    </Head>
    <main className={styles.about}>
      <section className={styles.hero} aria-labelledby="about-page-title">
        <div className={styles.heroWorld}>
          <AboutAstronaut />
          <noscript><img className={styles.moonFallback} src="/about/moon-landing-preview.webp" width="1200" height="600" alt="An astronaut waving beside the Pioneer spacecraft on the Moon" /></noscript>
        </div>
        <noscript><style>{`.${styles.tabs}{display:none!important}.${styles.fieldPanel}[hidden]{display:grid!important}`}</style></noscript>
        <div className={`${styles.container} ${styles.heroContent}`}>
          <p className={styles.eyebrow}>The person behind the build</p>
          <h1 id="about-page-title">Anders<br /><span>Bergquist</span></h1>
          <p className={styles.heroDescription}>The person who builds your website.<br />Working with you from the first idea to launch.</p>
          <a href="#my-story" className={styles.textLink}>My story<ArrowDownwardRoundedIcon fontSize="small" /></a>
        </div>
      </section>
      <section id="my-story" className={styles.section} aria-labelledby="story-title">
        <div className={styles.container}>
          <div className={styles.storyGrid}>
            <div><p className={styles.eyebrow}>01 / My story</p><h2 id="story-title">A foundation in code.<br /><span>A mind for possibility.</span></h2></div>
            <div className={styles.storyCopy}>
              <blockquote className={styles.biography}>
              <p className={styles.lead}>I&apos;m Anders Bergquist, the developer behind Bergquist Applications.</p>
              <p>I graduated from Western Washington University with a degree in computer science. That foundation led me into web development, where I could create programs that people can use from anywhere.</p>
              <p>Since then, I&apos;ve kept following new tools and bringing the useful ones into websites. AI, financial integrations, and different approaches to design have become part of that ongoing exploration.</p>
              </blockquote>
              <AndersSignature />
              <p className={styles.detail}>You work directly with me, from the first conversation through the build. I collaborate remotely and can arrange in-person meetings on Whidbey Island.</p>
              <SiteLink href="/contact" className={styles.textLink}>Talk through your project<ArrowForwardRoundedIcon fontSize="small" /></SiteLink>
            </div>
          </div>
          <ol className={styles.journey} aria-label="Development background">{journey.map(({ Icon, title, text }) => <li key={title}><Icon aria-hidden="true" /><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
        </div>
      </section>
      <section className={`${styles.section} ${styles.exploration}`} aria-labelledby="exploration-title">
        <div className={styles.container}>
          <div className={styles.introGrid}>
            <div><p className={styles.eyebrow}>02 / What I explore</p><h2 id="exploration-title">Technology moves fast.<br /><span>Make it work for you.</span></h2></div>
            <p>New tools keep expanding what a website can do. I explore that progress and bring it into practical web applications, so businesses can benefit without having to follow every release themselves.</p>
          </div>
          <div className={styles.tabs} role="tablist" aria-label="Areas of exploration">{fields.map(({ id, label, Icon }, index) => <button key={id} ref={element => { tabs.current[index] = element }} id={`explore-tab-${id}`} type="button" role="tab" aria-selected={selected === index} aria-controls={`explore-panel-${id}`} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => changeTab(event, index)}><Icon fontSize="small" aria-hidden="true" />{label}</button>)}</div>
          {fields.map((field, index) => <div key={field.id} id={`explore-panel-${field.id}`} role="tabpanel" aria-labelledby={`explore-tab-${field.id}`} hidden={selected !== index} className={styles.fieldPanel} tabIndex={0}>
            <div className={styles.fieldCopy}><h3>{field.title}</h3><p>{field.description}</p><p className={styles.detail}>{field.detail}</p><SiteLink href={field.href} className={styles.textLink}>{field.link}<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></div>
            <figure className={styles.componentPreview}><SiteLink href={field.href} aria-label={field.link}><img src={componentPreview(field.image)} width="1280" height="800" loading="lazy" decoding="async" alt={field.alt} /></SiteLink><figcaption>From the component collection<span>{field.id === "design" ? "Interactive design" : "Sample content"}</span></figcaption></figure>
          </div>)}
        </div>
      </section>
      <section className={styles.section} aria-labelledby="approach-title">
        <div className={styles.container}>
          <div className={styles.introGrid}><div><p className={styles.eyebrow}>03 / How I work</p><h2 id="approach-title">Understand the goals.<br /><span>Explore practical solutions.</span></h2></div><p>The newest tool is only useful when it&apos;s practical. We start with your goals, explore possibilities, then I build a prototype we can work from.</p></div>
          <ol className={styles.process}>{process.map(([title, description], index) => <li key={title}><span className={styles.number}>0{index + 1}</span><h3>{title}</h3><p>{description}</p></li>)}</ol>
          <div className={styles.workLink}><p>See how ideas become working applications.</p><SiteLink href="/applications" className={styles.textLink}>Explore applications<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></div>
        </div>
      </section>
      <section className={`${styles.section} ${styles.contact}`} aria-labelledby="about-contact-title">
        <div className={`${styles.container} ${styles.contactGrid}`}>
          <div><p className={styles.eyebrow}>04 / Your next chapter</p><h2 id="about-contact-title">Bring your<br /><span>Idea to life.</span></h2></div>
          <div><p>Tell me what you&apos;re building, what slows you down, or what you wish your website could do. We can find a useful next step together.</p><SiteLink href="/contact" className={styles.textLink}>Start a Project<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></div>
        </div>
      </section>
    </main>
  </>
}
