import React, { useCallback, useEffect, useRef, useState } from "react"
import Head from "next/head"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded"
import SatelliteAltRoundedIcon from "@mui/icons-material/SatelliteAltRounded"
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded"
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded"
import InstagramIcon from "@mui/icons-material/Instagram"
import SiteLink from "../components/SiteLink"
import { EARTH_MOON_TEXTURES } from "../lib/earthMoonAssets"
import { SEARCH_TITLE, SEARCH_DESCRIPTION } from "../lib/business"
import { SOCIAL_IMAGE_URL, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT } from "../lib/socialPreview"
import ProjectStories from "../components/ProjectStories"
import DeferredContent from "../components/DeferredContent"
import { developerProfile } from "../lib/developerProfile"
import styles from "../styles/ai-home.module.css"

const EarthMoonMesh = dynamic(() => import("../components/EarthMoonMesh"), { ssr: false })
const ApproachFlight = dynamic(() => import("../components/ApproachFlight"), { ssr: false })
const ContactAstronaut = dynamic(() => import("../components/ContactAstronaut"), { ssr: false })
const ChatBot = dynamic(() => import("../components/chatBot"), { ssr: false })
const AboutAstronaut = dynamic(() => import("../components/AboutAstronaut"), { ssr: false })

const benefits = [
  { icon: RocketLaunchRoundedIcon, title: "Ideas into action, sooner.", text: "AI-assisted prototypes help you explore ideas early and find the right direction." },
  { icon: SatelliteAltRoundedIcon, title: "Designed around your workflow.", text: "Custom components bring design and functionality together." },
  { icon: AutoAwesomeRoundedIcon, title: "Clear to search. Ready for AI.", text: "Search best practices help search engines and AI tools understand your business, services, and website." },
]
const questions = [
  "What kind of website would work for my business?",
  "Can you improve the website I already have?",
  "How can my website bring in more inquiries?",
  "What do you need from me to get started?",
]
const oldSections = new Set(["digital-identity", "new-possibilities", "pioneer-cockpit", "home-ai-assistant", "expand-horizons"])

function ApproachWorld() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { rootMargin: "250px" })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={styles.approachWorld}>{visible && <ApproachFlight />}</div>
}

function ContactWorld() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { rootMargin: "200px" })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={styles.contactWorld}>{visible && <ContactAstronaut />}</div>
}

function DeveloperWorld() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [portraitFailed, setPortraitFailed] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { rootMargin: "200px" })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={styles.developerVisual}>
    <div className={styles.developerWorld}>{visible && <AboutAstronaut />}<noscript><img src="/about/moon-landing-preview.webp" alt="Astronaut beside a spacecraft" width="1200" height="600" /></noscript></div>
    <div className={styles.developerBadge}>
      <div className={styles.developerPortrait}>{developerProfile.portrait && !portraitFailed ? <img src={developerProfile.portrait} alt="Anders Bergquist" width="64" height="64" loading="lazy" onError={() => setPortraitFailed(true)} /> : <span aria-label="Anders Bergquist">AB</span>}</div>
      <div className={styles.developerIdentity}><strong>Anders Bergquist</strong><span>Owner &amp; developer</span></div>
      <div className={styles.developerSocials} aria-label="Anders on social media">
        <a href={developerProfile.facebook} target="_blank" rel="noopener noreferrer" aria-label="Anders Bergquist on Facebook (opens in a new tab)" title="Facebook"><FacebookRoundedIcon /></a>
        {developerProfile.instagram && <a href={developerProfile.instagram} target="_blank" rel="noopener noreferrer" aria-label="Anders Bergquist on Instagram (opens in a new tab)" title="Instagram"><InstagramIcon /></a>}
      </div>
    </div>
  </div>
}

function Action({ href, children, secondary = false, subtle = false }) {
  return <SiteLink href={href} className={`${styles.action} ${subtle ? styles.subtle : secondary ? styles.secondary : styles.primary}`}>
    {children}<ArrowForwardRoundedIcon fontSize="small" />
  </SiteLink>
}

export default function Home() {
  const router = useRouter()
  const [splashReady, setSplashReady] = useState(false)
  const [mountSplash, setMountSplash] = useState(false)
  useEffect(() => {
    // Give the server-rendered heading and controls their first paint before WebGL.
    let secondFrame
    const firstFrame = requestAnimationFrame(() => { secondFrame = requestAnimationFrame(() => setMountSplash(true)) })
    return () => { cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame) }
  }, [])
  const handleSplashReady = useCallback(() => setSplashReady(true), [])
  // Keep previously shared links to the interactive homepage working after its move.
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (oldSections.has(hash)) router.replace(`/Design#${hash}`)
  }, [router.asPath])

  return <>
    <Head>
      <title>{SEARCH_TITLE}</title>
      <meta name="description" content={SEARCH_DESCRIPTION} />
      <link rel="canonical" href="https://bergquistapplications.com/" />
      <meta property="og:title" content={SEARCH_TITLE} />
      <meta property="og:description" content={SEARCH_DESCRIPTION} />
      <meta property="og:url" content="https://bergquistapplications.com/" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={SOCIAL_IMAGE_URL} />
      <meta property="og:image:width" content={SOCIAL_IMAGE_WIDTH} />
      <meta property="og:image:height" content={SOCIAL_IMAGE_HEIGHT} />
      <meta property="og:image:alt" content={SOCIAL_IMAGE_ALT} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={SEARCH_TITLE} />
      <meta name="twitter:description" content={SEARCH_DESCRIPTION} />
      <meta name="twitter:image" content={SOCIAL_IMAGE_URL} />
      <meta name="twitter:image:alt" content={SOCIAL_IMAGE_ALT} />
      <meta name="theme-color" content="#000000" />
      {EARTH_MOON_TEXTURES.map(({ src }) => <link key={src} rel="preload" as="image" type="image/webp" href={src} crossOrigin="anonymous" />)}
    </Head>
    <main className={styles.home}>
      <section className={styles.hero} aria-labelledby="home-title" data-splash-ready={splashReady}>
        <div className={styles.liveWorld} data-splash-world aria-hidden={!splashReady} inert={!splashReady ? "" : undefined}>{mountSplash && <EarthMoonMesh cinematic entrance onReady={handleSplashReady} />}</div>
        <div className={styles.heroShade} />
        <div className={`${styles.container} ${styles.heroContent}`}>
          <p className={`${styles.eyebrow} ${styles.arrival}`} style={{ "--delay": "100ms", "--x": "-10px" }}>A Digital World of Possibilities</p>
          <h1 id="home-title" className={styles.arrival} style={{ "--delay": "350ms", "--x": "-16px" }}>Custom Websites.<br /><span>Web Applications.</span></h1>
          <p className={`${styles.heroDescription} ${styles.arrival}`} style={{ "--delay": "600ms", "--x": "12px" }}>Thoughtful websites and practical applications, shaped around your goals.</p>
          <div className={`${styles.actions} ${styles.arrival}`} style={{ "--delay": "850ms", "--x": "-8px" }}>
            <Action href="/contact">Start a Project</Action>
            <Action href="/applications" secondary>Explore Applications</Action>
          </div>
          <p className={styles.heroNote}>Remote collaboration. In-person meetings on Whidbey Island.</p>
        </div>
      </section>

      <section id="ai-advantages" className={`${styles.section} ${styles.advantages}`} aria-labelledby="advantages-title">
        <div className={styles.container}>
          <h2 id="advantages-title" className={styles.visuallyHidden}>A thoughtful foundation for your website</h2>
          <div className={styles.benefits}>
            {benefits.map(({ icon: Icon, title, text }) => <article key={title} className={styles.benefit}>
              <div className={styles.benefitTop}><Icon aria-hidden="true" /><h3>{title}</h3></div><p>{text}</p>
            </article>)}
          </div>
        </div>
      </section>

      <section id="your-developer" className={styles.section} aria-labelledby="developer-title">
        <div className={`${styles.container} ${styles.developerGrid}`}>
          <DeveloperWorld />
          <div className={styles.developerCopy}><p className={styles.eyebrow}>Your developer</p><h2 id="developer-title">Owned and operated<br />by <span>Anders Bergquist.</span></h2><p>I design, build, and look after your website. You work directly with me, from the first conversation to launch and the updates that follow.</p><p>When you have a question or something needs attention, you have someone to turn to who knows your site and cares about how it works for your business.</p><Action href="/about" secondary>Meet Anders</Action></div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="about-title">
        <div className={`${styles.container} ${styles.aboutGrid}`}>
          <div><p className={styles.eyebrow}>Our approach</p><h2 id="about-title">Your business<br />on <span>jet fuel.</span></h2><p>Your goals set the course. We use modern web tools to explore ideas and build practical websites and applications that move your business forward.</p></div>
          <ApproachWorld />
        </div>
      </section>

      <section id="website-pricing" className={`${styles.section} ${styles.pricing}`} aria-labelledby="pricing-title">
        <div className={styles.container}>
          <div className={styles.sectionIntro}>
            <p className={styles.eyebrow}>A simple way to get started</p>
            <h2 id="pricing-title">Your website.<br /><span>A clear starting price.</span></h2>
            <p>Start with the essentials: a welcoming home page, your story, your products or services, and a clear way to get in touch.</p>
          </div>
          <div className={styles.pricingGrid}>
            <article aria-labelledby="foundation-title">
              <p className={styles.eyebrow}>The foundation</p>
              <h3 id="foundation-title">The essentials. Your brand.</h3>
              <p>A focused business website, customized with your colors, imagery, and content.</p>
              <ul className={styles.packageBasics}>
                <li><strong>Home splash.</strong> Introduce your business with a strong first impression.</li>
                <li><strong>About.</strong> Share your story and help customers get to know you.</li>
                <li><strong>Products or services.</strong> Show what you offer with clear descriptions and images.</li>
                <li><strong>Contact.</strong> Make it easy for visitors to take the next step.</li>
              </ul>
              <dl className={styles.priceDetails}>
                <div><dt>One-time build</dt><dd>$500</dd></div>
                <div><dt>Ongoing maintenance</dt><dd>$20<span> / month</span></dd></div>
              </dl>
              <p className={styles.pricingDetail}>See <SiteLink href="/applications/upgrade-aprons">Upgrade Aprons</SiteLink> for an example of a business website built around a brand and its products. Search and AI discovery foundations are part of your starting point.</p>
            </article>
            <article aria-labelledby="custom-pricing-title">
              <p className={styles.eyebrow}>Specialized components</p>
              <h3 id="custom-pricing-title">Extra tools. Built for you.</h3>
              <p>Need custom booking flows, payment integrations, or AI features? Add the components that fit the way you work.</p>
              <dl className={styles.priceDetails}>
                <div><dt>Custom development</dt><dd className={styles.variablePrice}>Quoted to scope</dd></div>
                <div><dt>Monthly costs</dt><dd className={styles.variablePrice}>Based on usage</dd></div>
              </dl>
              <p className={styles.pricingDetail}>Build and monthly fees vary with the project scope, integrations, and resources used.</p>
            </article>
          </div>
          <p className={styles.pricingNote}>Prices are in USD. The base package covers the core site structure and brand customization, not every demo or advanced feature shown here. We&apos;ll confirm included pages, features, and any third-party costs before we begin.</p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="work-title">
        <div className={styles.container}>
          <div className={styles.workHeading}><div><p className={styles.eyebrow}>Built by Bergquist Applications</p><h2 id="work-title">Made for <span>real businesses.</span></h2></div><SiteLink className={styles.textLink} href="/applications">All applications<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></div>
          <ProjectStories compact showHeading={false} />
        </div>
      </section>

      <section id="search-discovery" className={styles.section} aria-labelledby="questions-title">
        <div className={`${styles.container} ${styles.faqStack}`}>
          <div><h2 id="questions-title">Good questions.<br /><span>Straight answers.</span></h2></div>
          <DeferredContent minHeight={390}><ChatBot embedded source="homepage-questions" suggestedQuestions={questions} initialPrompt="Hello" initialAnswer="Hello! Tell me about your business or what you would like your website to do." /></DeferredContent>
        </div>
      </section>

      <section className={`${styles.section} ${styles.contact}`} aria-labelledby="contact-title">
        <div className={`${styles.container} ${styles.contactInner}`}>
          <div><p className={styles.eyebrow}>Your next chapter</p><h2 id="contact-title">What would you<br /><span>like to build?</span></h2><p>Bring your idea. Let&apos;s find the next step.</p><Action href="/contact" subtle>Start a Project</Action></div>
          <ContactWorld />
        </div>
      </section>
    </main>
  </>
}
