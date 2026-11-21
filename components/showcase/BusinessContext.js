import React from "react"
import SiteLink from "../SiteLink"
import { exampleContact, guideFor } from "../../lib/businessExamples"
import { featureGallery } from "../../lib/featureGallery"
import styles from "../../styles/component-catalog.module.css"

export function BusinessContext({ component }) {
  const guide = guideFor(component)
  return <p className={styles.demoHint}>{featureGallery[component.key]?.hint || guide.task}</p>
}
export function BusinessNextStep({ component }) {
  const feature = featureGallery[component.key]
  return <section className={styles.contact}><div><h2>Want this on your website?</h2><p>{feature?.benefit || component.description}</p></div><SiteLink className={styles.detailLink} href={exampleContact(component.key)}>Let&apos;s talk <span aria-hidden="true">↗</span></SiteLink></section>
}
