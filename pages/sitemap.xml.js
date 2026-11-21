import { projectStories } from "../lib/projectStories"
import components from "../lib/componentCatalog.json"
import unlisted from "../lib/unlistedComponents.json"
import { SITE_URL } from "../lib/business"

export default function Sitemap() { return null }
export function getServerSideProps({ res }) {
  const hidden = new Set(unlisted.map(component => component.key))
  const paths = ["/", "/about", "/applications", "/components", "/contact", "/Design", "/privacy", "/terms",
    ...projectStories.map(project => `/applications/${project.slug}`),
    ...components.filter(component => !hidden.has(component.key)).map(component => `/components/${component.key}`)]
  const escape = value => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
  res.setHeader("Content-Type", "application/xml; charset=utf-8")
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600")
  res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(paths)].map(path => `<url><loc>${escape(SITE_URL + path)}</loc></url>`).join("")}</urlset>`)
  return { props: {} }
}
