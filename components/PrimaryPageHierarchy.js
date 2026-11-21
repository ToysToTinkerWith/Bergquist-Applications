import Head from "next/head"
import { SITE_URL, BUSINESS_NAME } from "../lib/business"

const pages = {
  "/": BUSINESS_NAME,
  "/about": "About",
  "/components": "Components",
  "/applications": "Applications",
  "/contact": "Contact",
  "/Design": "Design",
  "/privacy": "Privacy",
  "/terms": "Terms",
}

// Describe real navigation relationships; Google still chooses its own sitelinks.
export default function PrimaryPageHierarchy({ path }) {
  if (!pages[path]) return null
  const url = `${SITE_URL}${path}`
  const page = {
    "@type": "WebPage", "@id": `${url}#webpage`, url, name: pages[path],
    isPartOf: { "@id": `${SITE_URL}/#website` },
    ...(path === "/" ? { mainEntity: { "@id": `${SITE_URL}/#organization` } } : {
      breadcrumb: { "@id": `${url}#breadcrumb` },
    }),
  }
  const graph = [page]
  if (path !== "/") graph.push({
    "@type": "BreadcrumbList", "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: pages[path], item: url },
    ],
  })
  return <Head><script key="primary-page-hierarchy" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") }} /></Head>
}
