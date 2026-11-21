import React, { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded"
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import SiteLink from "../components/SiteLink"
import styles from "../styles/showcase-pages.module.css"
import { CONTACT_EMAIL as EMAIL } from "../lib/contactDetails"
import { SERVICE_AREA } from "../lib/business"
import { SOCIAL_IMAGE_URL, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT } from "../lib/socialPreview"
import { logFirebaseAnalyticsEvent } from "../lib/clientAnalytics"
import componentCatalog from "../lib/componentCatalog.json"
import unlistedExamples from "../lib/unlistedComponents.json"
import { guideFor } from "../lib/businessExamples"

const initial = { name: "", email: "", company: "", project: "A new website", message: "" }
const projectTypes = ["A new website", "An application", "Web components", "An existing website", "Let's explore"]
const examples = [...componentCatalog, ...unlistedExamples]

export default function ContactPage({ emailDeliveryEnabled = false }) {
  const router = useRouter()
  const attributed = useRef(false)
  const [fields, setFields] = useState(initial)
  useEffect(() => {
    if (!router.isReady || attributed.current) return
    attributed.current = true
    const project = { "business-websites": "A new website", "custom-web-applications": "An application", "commerce-payments": "An application", "ai-integrations": "Web components", "website-maintenance": "An existing website" }[router.query.service]
    const example = examples.find(item => item.key === router.query.component)
    if (example) setFields(current => ({ ...current, project: "Web components", message: current.message || `I'm interested in ${example.title.toLowerCase()} for my business.\n\nThe part of our workflow I'd like to improve is: ` }))
    else if (project) setFields(current => ({ ...current, project }))
  }, [router.isReady, router.query.service, router.query.component])
  const selectedExample = examples.find(item => item.key === router.query.component)
  const [draft, setDraft] = useState(null)
  const [copyStatus, setCopyStatus] = useState("")
  const [draftCopyStatus, setDraftCopyStatus] = useState("")
  const [deliveryStatus, setDeliveryStatus] = useState("idle")
  const [deliveryError, setDeliveryError] = useState("")
  const [website, setWebsite] = useState("")
  const sending = deliveryStatus === "sending"
  const focusDraftTitle = useCallback(element => element?.focus(), [])
  const change = event => setFields(current => ({ ...current, [event.target.name]: event.target.value }))
  const copy = async (value, setter) => {
    try {
      await navigator.clipboard.writeText(value)
      setter("Copied")
    } catch {
      setter("Copy unavailable. Select and copy the text instead.")
    }
  }
  const submit = async event => {
    event.preventDefault()
    if (sending) return
    const form = event.currentTarget
    const name = form.elements.namedItem("name"), message = form.elements.namedItem("message")
    name.setCustomValidity(fields.name.trim() ? "" : "Please enter your name.")
    message.setCustomValidity(fields.message.trim() ? "" : "Please add a message.")
    if (!form.reportValidity()) return
    const details = [`Name: ${fields.name.trim()}`, `Email: ${fields.email.trim()}`, fields.company.trim() ? `Business: ${fields.company.trim()}` : null, `Project: ${fields.project}`].filter(Boolean)
    const body = [...details, "", fields.message.trim()].join("\n")
    const href = `mailto:${EMAIL}?subject=${encodeURIComponent("Project inquiry: " + fields.project)}&body=${encodeURIComponent(body)}`
    if (!emailDeliveryEnabled) {
      setDraft({ body, href })
      setDraftCopyStatus("")
      return
    }
    setDeliveryStatus("sending"); setDeliveryError("")
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    try {
      const response = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, website }), signal: controller.signal,
      })
      const result = await response.json()
      if (!response.ok || result.ok !== true) {
        setDeliveryStatus("idle")
        setDeliveryError(result.error || "Your message could not be sent. Please try again or email me directly.")
        return
      }
      setDeliveryStatus("sent")
      // Only confirmed submissions count as leads; never send form contents to analytics.
      void logFirebaseAnalyticsEvent("generate_lead", { method: "contact_form", project_type: fields.project }).catch(() => {})
    } catch (error) {
      setDeliveryStatus("idle")
      setDeliveryError("We couldn't confirm that your message was sent. Your details are still here; you can contact me directly by email.")
    } finally { clearTimeout(timeout) }
  }
  return <>
    <Head>
      <title>Contact | Bergquist Applications</title>
      <meta name="description" content="Tell Anders about your website idea. Meet remotely or on Whidbey Island by arrangement." />
      <link rel="canonical" href="https://bergquistapplications.com/contact" />
      <meta property="og:title" content="Contact | Bergquist Applications" />
      <meta property="og:description" content="Tell Anders about your website idea. Meet remotely or on Whidbey Island by arrangement." />
      <meta property="og:url" content="https://bergquistapplications.com/contact" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={SOCIAL_IMAGE_URL} />
      <meta property="og:image:width" content={SOCIAL_IMAGE_WIDTH} />
      <meta property="og:image:height" content={SOCIAL_IMAGE_HEIGHT} />
      <meta property="og:image:alt" content={SOCIAL_IMAGE_ALT} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Contact | Bergquist Applications" />
      <meta name="twitter:description" content="Tell Anders about your website idea. Meet remotely or on Whidbey Island by arrangement." />
      <meta name="twitter:image" content={SOCIAL_IMAGE_URL} />
      <meta name="twitter:image:alt" content={SOCIAL_IMAGE_ALT} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "ContactPage", name: "Contact | Bergquist Applications", url: "https://bergquistapplications.com/contact" }) }} />
    </Head>
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.contactLayout}>
          <div className={styles.contactIntro}>
            <p className={styles.eyebrow}><MailOutlineRoundedIcon fontSize="small" />Get in touch</p>
            <h1>Let&apos;s build<br /><span>your idea.</span></h1>
            <div className={styles.rule} />
            <p className={styles.lead}>Tell me about your website idea or ask a question. We can work out the next step together.</p>
            <p className={styles.serviceArea}>Work directly with Anders Bergquist.<br />{SERVICE_AREA}</p>
            <div className={styles.emailBlock}>
              <p className={styles.eyebrow}>Email directly</p>
              <div className={styles.emailRow}><a href={`mailto:${EMAIL}`}>{EMAIL}</a><button type="button" className={styles.iconButton} title="Copy email address" aria-label="Copy email address" onClick={() => copy(EMAIL, setCopyStatus)}>{copyStatus === "Copied" ? <CheckRoundedIcon fontSize="small" /> : <ContentCopyRoundedIcon fontSize="small" />}</button></div>
              <p className={styles.copyStatus} role="status">{copyStatus}</p>
            </div>
            <SiteLink className={styles.textLink} href="/components">Explore the components<ArrowForwardRoundedIcon fontSize="small" /></SiteLink>
          </div>
          <div className={styles.formPanel}>
            {deliveryStatus === "sent" ? <section aria-labelledby="message-sent-title">
              <p className={styles.eyebrow}>Thank you</p>
              <h2 id="message-sent-title" tabIndex={-1} ref={focusDraftTitle}>Message sent.</h2>
              <p className={styles.formNote}>Your message has been sent to {EMAIL}. I&apos;ll be in touch.</p>
              <button type="button" className={styles.textLink} onClick={() => { setFields(initial); setWebsite(""); setDeliveryStatus("idle") }}>Send another message<ArrowForwardRoundedIcon fontSize="small" /></button>
            </section> : !draft ? <form onSubmit={submit} method="post" action="/api/contact" aria-busy={sending}>
              <h2>A little about your idea.</h2>
              {selectedExample && <p className={styles.formNote}>You&apos;re exploring <strong>{selectedExample.title}</strong>. {guideFor(selectedExample).benefit} <SiteLink href={`/components/${selectedExample.key}`}>Back to the example</SiteLink>.</p>}
              <fieldset disabled={sending} className={styles.formFields}>
              <div className={styles.formGrid}>
                <label htmlFor="contact-name">Name<input id="contact-name" name="name" autoComplete="name" required maxLength={100} value={fields.name} onChange={change} onInput={event => event.currentTarget.setCustomValidity("")} placeholder="Your name" /></label>
                <label htmlFor="contact-email">Email<input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={200} value={fields.email} onChange={change} placeholder="you@example.com" /></label>
                <label htmlFor="contact-company">Business <span>(optional)</span><input id="contact-company" name="company" autoComplete="organization" maxLength={120} value={fields.company} onChange={change} placeholder="Your business" /></label>
                <label htmlFor="contact-project">I&apos;m thinking about<select id="contact-project" name="project" value={fields.project} onChange={change}>{projectTypes.map(project => <option key={project}>{project}</option>)}</select></label>
                <label htmlFor="contact-message" className={styles.messageField}>Your idea<textarea id="contact-message" name="message" required maxLength={1200} rows={6} value={fields.message} onChange={change} onInput={event => event.currentTarget.setCustomValidity("")} placeholder="What would you like to create or improve?" /></label>
              </div>
              <div className={styles.trap} aria-hidden="true"><label>Website<input name="website" value={website} onChange={event => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></label></div>
              <button type="submit" className={styles.prepareButton} disabled={sending}>{sending ? "Sending..." : "Send message"}<ArrowForwardRoundedIcon fontSize="small" /></button>
              </fieldset>
              {deliveryError && <p className={styles.formError} role="alert">{deliveryError} <a href={`mailto:${EMAIL}`}>Email {EMAIL}</a></p>}
              <p className={styles.formNote}>{emailDeliveryEnabled ? `Your message goes directly to ${EMAIL}.` : "Opens a draft in your email app. Review it there and send."}</p>
              <p className={styles.formNote}>I&apos;ll review your idea and reply by email to discuss fit and next steps. Sending an inquiry does not commit you to a project. <SiteLink href="/privacy">How your information is used</SiteLink>.</p>
            </form> : <section aria-labelledby="draft-title">
              <p className={styles.eyebrow}>Ready when you are</p>
              <h2 id="draft-title" tabIndex={-1} ref={focusDraftTitle}>Your email draft.</h2>
              <p className={styles.formNote}>Nothing has been sent yet.</p>
              <p className={styles.formNote}>To: {EMAIL}</p>
              <pre className={styles.draftBody}>{draft.body}</pre>
              <a className={styles.prepareButton} href={draft.href}>Open email draft<ArrowForwardRoundedIcon fontSize="small" /></a>
              <div className={styles.draftActions}><button type="button" className={styles.textLink} onClick={() => setDraft(null)}>Edit message</button><button type="button" className={styles.textLink} onClick={() => copy(draft.body, setDraftCopyStatus)}><ContentCopyRoundedIcon fontSize="small" />Copy message</button></div>
              <p className={styles.copyStatus} role="status">{draftCopyStatus}</p>
            </section>}
          </div>
        </section>
        <section className={styles.contactNotes} aria-label="Getting started">
          <div><span>01</span><h2>I read your message.</h2><p>Tell me about your business, the problem, and any timing or budget you have in mind.</p></div>
          <div><span>02</span><h2>We talk it through.</h2><p>I reply by email. We can arrange a remote conversation or an in-person meeting on Whidbey Island.</p></div>
          <div><span>03</span><h2>We agree on a plan.</h2><p>If it&apos;s a good fit, we define scope, costs, ownership, and the next milestone before development begins.</p></div>
        </section>
      </div>
    </main>
  </>
}

export async function getStaticProps() {
  const { isContactMailConfigured } = await import("../lib/contactMail")
  return { props: { emailDeliveryEnabled: isContactMailConfigured() } }
}
