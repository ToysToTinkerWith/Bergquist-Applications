import React from "react"
import SiteLink from "../SiteLink"
import unlisted from "../../lib/unlistedComponents.json"
import { componentPreview } from "../../lib/componentPreviews"
import styles from "../../styles/component-catalog.module.css"

const keys = ["pioneer-flight-deck", "earth-moon-world", "expedition-showcase", "mars-landing", "solar-system-journey"]
export default function InteractiveDesignCollection() {
  return <section className={styles.grid} aria-label="Interactive design examples">{keys.map(key => {
    const item = unlisted.find(example => example.key === key)
    return <article className={styles.card} key={key} data-category="Design"><SiteLink href={`/components/${key}`} className={styles.preview}><img src={componentPreview(key)} alt={item.title} width="960" height="600" loading="lazy" /></SiteLink><div className={styles.copy}><p className={styles.category}>Interactive experience</p><h2>{item.title}</h2><p className={styles.description}>{item.description}</p><SiteLink className={styles.detailLink} href={`/components/${key}`}>Try the experience <span aria-hidden="true">↗</span></SiteLink></div></article>
  })}</section>
}
