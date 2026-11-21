import React, { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import MenuRoundedIcon from "@mui/icons-material/MenuRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import SiteLink from "./SiteLink"
import styles from "../styles/site-chrome.module.css"

const items = [
  { label: "About", href: "/about" },
  { label: "Components", href: "/components" },
  { label: "Applications", href: "/applications" },
  { label: "Contact", href: "/contact" },
]
const Modal = dynamic(() => import('@mui/material/Modal'), { ssr: false })

export default function PublicNavigation({ logoSrc = "/brand/bergquist-orbital-icon.webp" }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false) }, [router.asPath])
  const links = items.map(item => <SiteLink key={item.href} href={item.href}
    aria-current={router.pathname === item.href || router.pathname.startsWith(`${item.href}/`) ? "page" : undefined}
    onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setOpen(false) }}>{item.label}</SiteLink>)
  const project = <SiteLink href="/contact" className={styles.project} onClick={() => setOpen(false)}>Start a Project<ArrowForwardRoundedIcon fontSize="small" /></SiteLink>
  return <>
    <header className={styles.header}>
      <nav className={styles.navigation} aria-label="Main navigation">
        <SiteLink href="/" className={styles.brand} aria-label="Bergquist Applications home"><img src={logoSrc} width="64" height="64" alt="" /><span className={styles.brandName}>Bergquist Applications</span></SiteLink>
        <div className={styles.desktopLinks}>{links}{project}</div>
        <button className={styles.menuButton} type="button" aria-label="Menu" aria-expanded={open} aria-controls={open ? "mobile-navigation" : undefined} onClick={() => setOpen(true)}><MenuRoundedIcon /></button>
      </nav>
    </header>
    {open && <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="mobile-navigation-title">
      <div className={styles.mobilePanel} id="mobile-navigation" role="dialog" aria-modal="true" aria-labelledby="mobile-navigation-title">
        <div className={styles.menuHeading}><span id="mobile-navigation-title">Explore Bergquist</span><button type="button" className={styles.menuButton} aria-label="Close navigation" onClick={() => setOpen(false)}><CloseRoundedIcon /></button></div>
        <nav aria-label="Mobile navigation" className={styles.mobileLinks}>{links}{project}</nav>
      </div>
    </Modal>}
  </>
}
