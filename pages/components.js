import React, { useEffect, useMemo, useState } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import SiteLink from "../components/SiteLink"
import FeaturePicture from "../components/showcase/FeaturePicture"
import catalog from "../lib/componentCatalog.json"
import { featureGallery, featureGroups } from "../lib/featureGallery"
import { outcomes } from "../lib/businessExamples"
import styles from "../styles/component-catalog.module.css"

const legacyCategories = ["Data", "Finance", "AI", "Design", ...outcomes]
const categoryFromHash = { "data-components": "Data", "finance-components": "Finance", "ai-components": "AI", "design-components": "Design" }

export default function Components() {
  const router = useRouter()
  const [category, setCategory] = useState("All")
  useEffect(() => {
    if (!router.isReady) return
    const requested = router.query.category || categoryFromHash[window.location.hash.slice(1)]
    setCategory([...featureGroups, ...legacyCategories].includes(requested) ? requested : "All")
  }, [router.isReady, router.asPath])
  const chooseCategory = value => {
    setCategory(value)
    router.push({ pathname: "/components", query: value === "All" ? {} : { category: value } }, undefined, { shallow: true, scroll: false })
  }
  const results = useMemo(() => Object.keys(featureGallery).map(key => catalog.find(item => item.key === key)).filter(Boolean).filter(item => category === "All" || featureGallery[item.key].group === category || item.outcome === category || item.category === category), [category])
  return <>
    <Head>
      <title>Website Features & Components | Bergquist Applications</title>
      <meta name="description" content="See what your website could do. Try simple examples of online booking, estimates, shopping, customer portals, and more." />
      <link rel="canonical" href="https://bergquistapplications.com/components" />
      <meta property="og:title" content="Website Features & Components | Bergquist Applications" />
      <meta property="og:description" content="Explore visual examples of useful website features. Pick one and try it." />
    </Head>
    <main className={styles.catalog}>
      <div className={styles.container}>
        <header className={`${styles.intro} ${styles.galleryIntro}`}>
          <p className={styles.eyebrow}>Ideas for your website</p>
          <h1>Small features.<br /><span>Real possibilities.</span></h1>
          <p>Book a visit. Sell a product. Answer a question.<br />Pick a feature and see it work.</p>
        </header>
        <div className={styles.galleryFilters} role="group" aria-label="Filter website features">
          {featureGroups.map(group => <button type="button" key={group} aria-pressed={category === group} onClick={() => chooseCategory(group)}>{group}</button>)}
        </div>
        <p className={styles.galleryCount} role="status">{results.length} {results.length === 1 ? "idea" : "ideas"} to explore{!featureGroups.includes(category) && <> · {category} <button onClick={() => chooseCategory("All")}>Show all</button></>}</p>
        <div className={`${styles.grid} ${styles.visualGrid}`}>
          {results.map(item => {
            const feature = featureGallery[item.key]
            return <article key={item.key} className={styles.visualCard}>
              <SiteLink href={`/components/${item.key}`} className={styles.visualCardLink} aria-label={feature.action}>
                <FeaturePicture kind={feature.kind} />
                <div className={styles.visualCopy}><h2>{feature.title}</h2><p>{feature.benefit}</p><span className={styles.tryFeature}>{feature.action}<ArrowForwardRoundedIcon fontSize="small" /></span></div>
              </SiteLink>
            </article>
          })}
        </div>
        <section className={styles.contact} aria-labelledby="catalog-contact-title"><div><p className={styles.eyebrow}>Built around your business</p><h2 id="catalog-contact-title">See something useful?</h2><p>Let&apos;s make it work for you.</p></div><SiteLink className={styles.detailLink} href="/contact">Talk about your website<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></section>
      </div>
    </main>
  </>
}
