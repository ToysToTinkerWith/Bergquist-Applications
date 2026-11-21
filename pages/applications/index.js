import PageSeo from "../../components/PageSeo"
import BusinessBreadcrumbs from "../../components/BusinessBreadcrumbs"
import ProjectStories from "../../components/ProjectStories"
import { projectStories } from "../../lib/projectStories"
import { SITE_URL } from "../../lib/business"
import styles from "../../styles/business-pages.module.css"

export default function Applications() {
  const breadcrumbs = [{ name: "Home", path: "/" }, { name: "Applications", path: "/applications" }]
  return <><PageSeo title="Websites & Applications" description="Explore real websites and applications built by Anders Bergquist, with live examples to try." path="/applications" schema={{ "@context": "https://schema.org", "@type": "ItemList", itemListElement: projectStories.map((project, index) => ({ "@type": "ListItem", position: index + 1, url: `${SITE_URL}/applications/${project.slug}`, name: project.name })) }} /><main className={styles.page}><div className={styles.container}><BusinessBreadcrumbs items={breadcrumbs} /><header className={styles.hero}><p className={styles.eyebrow}>Applications / Bergquist Applications</p><h1>Websites with a purpose.<br /><span>See the work behind them.</span></h1><p>Real screenshots, the thinking behind each build, and a link to explore. Client projects and independent applications are clearly labeled.</p></header><section className={styles.section}><ProjectStories /></section></div></main></>
}
