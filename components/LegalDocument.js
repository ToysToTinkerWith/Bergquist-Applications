import React from "react"
import { Typography } from "@mui/material"
import SiteLink from "./SiteLink"
import styles from "../styles/legal-document.module.css"

export function LegalText({ children, sx = {} }) {
  return <Typography component="p" sx={{ color: "#b8c0cc", lineHeight: 1.85, fontFamily: "var(--font-site)", ...sx }}>{children}</Typography>
}

export default function LegalDocument({ title, description, updated, sections, children }) {
  return <main className={styles.page}>
    {children}
    <div className={styles.container}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Bergquist Applications / Legal</p>
        <h1>{title}</h1>
        <p className={styles.description}>{description}</p>
        <p className={styles.updated}>Last updated: {updated}</p>
      </header>
      <div className={styles.layout}>
        <aside className={styles.contents}>
          <nav aria-label="On this page"><h2>On this page</h2>{sections.map((section, index) => <a key={section.title} href={`#section-${index + 1}`}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a>)}</nav>
          <SiteLink className={styles.contact} href="/contact">Get in touch</SiteLink>
        </aside>
        <div className={styles.body}>{sections.map((section, index) => <section className={styles.section} id={`section-${index + 1}`} aria-labelledby={`heading-${index + 1}`} key={section.title}>
          <p className={styles.number}>{String(index + 1).padStart(2, "0")}</p>
          <h2 id={`heading-${index + 1}`}>{section.title}</h2>
          {section.body}
        </section>)}</div>
      </div>
    </div>
  </main>
}
