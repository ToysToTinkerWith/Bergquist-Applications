import React from "react"
import { useRouter } from "next/router"
import SiteLink from "./SiteLink"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import styles from "../styles/site-chrome.module.css"

export default function Footer() {
  const { pathname } = useRouter()
  const current = href => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)) ? "page" : undefined
  return <footer className={styles.footer} data-site-footer>
    <div className={styles.footerGrid}>
      <div><SiteLink href="/" className={styles.footerBrand}><img src="/brand/bergquist-orbital-icon.webp" width="96" height="96" alt="" loading="lazy" decoding="async" /><span>Bergquist Applications</span></SiteLink><p>AI-assisted websites. Built around you.</p><SiteLink href="/contact" className={styles.subtleProject}>Start a Project<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></div>
      <div><h2>Explore</h2><nav aria-label="Footer navigation">{[["Home", "/"], ["About", "/about"], ["Components", "/components"], ["Applications", "/applications"], ["Contact", "/contact"]].map(([label, href]) => <SiteLink key={href} href={href} aria-current={current(href)}>{label}</SiteLink>)}</nav></div>
      <div><h2>What&apos;s next?</h2><p>Bring your idea to life.</p><SiteLink href="/contact" className={styles.contactLink}>Get in touch<ArrowForwardRoundedIcon fontSize="small" /></SiteLink><p>Work directly with Anders Bergquist.<br />Remote collaboration, with in-person meetings on Whidbey Island by arrangement.</p><SiteLink href="/applications" className={styles.subtleProject}>Project stories<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></div>
    </div>
    <div className={styles.footerBottom}><span>&copy; {new Date().getFullYear()} Bergquist Applications. All rights reserved.</span><div><SiteLink href="/privacy" aria-current={current("/privacy")}>Privacy</SiteLink><SiteLink href="/terms" aria-current={current("/terms")}>Terms</SiteLink></div></div>
  </footer>
}
