
import Nav from "../../../components/restaurant/nav"


import Hero from "../../../components/restaurant/hero"
import Visit from "../../../components/restaurant/visit"
import Favorites from "../../../components/restaurant/favorites"

import Footer from "../../../components/restaurant/footer"
import Head from "next/head"
import SiteLink from "../../../components/SiteLink"
import { BusinessContext, BusinessNextStep } from "../../../components/showcase/BusinessContext"
import catalog from "../../../lib/componentCatalog.json"
import styles from "../../../styles/component-catalog.module.css"

const example = catalog.find(item => item.key === "restaurant-ordering")


export default function Index() {
  return (
    <main>
      <Head><title>Restaurant Ordering | Finance Components | Bergquist Applications</title><meta name="description" content="Explore Italiana, a restaurant ordering component with menu browsing, a shopping cart, and an order workflow." /><link rel="canonical" href="https://bergquistapplications.com/components/restaurant-ordering" /></Head>
      <aside style={{ padding: "10px 20px", background: "#17131e", color: "#ede7fa", textAlign: "center", fontSize: 14, lineHeight: 1.6 }}>Independent demonstration by Anders Bergquist. Not a real restaurant. <SiteLink href="/components?category=Sell%20online" style={{ color: "#c9b4fb", textUnderlineOffset: 4 }}>Back to selling online examples</SiteLink>.</aside>
      <section className={styles.catalog}><div className={styles.container}><BusinessContext component={example} /><SiteLink className={styles.detailLink} href="/components/restaurant-ordering/order">Try building an order →</SiteLink></div></section>
      <div style={{ position: "relative" }}>
      <Nav />
      <Hero />
      <Favorites />
      <Visit />
      <Footer />
      </div>
      <section className={styles.catalog}><div className={styles.container}><BusinessNextStep component={example} /></div></section>
    </main>
  )
}
