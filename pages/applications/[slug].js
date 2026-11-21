import SiteLink from "../../components/SiteLink"
import PageSeo from "../../components/PageSeo"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded"
import { projectStories } from "../../lib/projectStories"
import { SITE_URL } from "../../lib/business"
import styles from "../../styles/business-pages.module.css"
import BusinessBreadcrumbs from "../../components/BusinessBreadcrumbs"
import BusinessPageVisit from "../../components/BusinessPageVisit"

export default function Project({ project }) {
  const breadcrumbs = [{ name: "Home", path: "/" }, { name: "Applications", path: "/applications" }, { name: project.name, path: `/applications/${project.slug}` }]
  return <><PageSeo title={`${project.name} Project Story`} description={project.summary} path={`/applications/${project.slug}`} image={project.image} breadcrumbs={breadcrumbs} schema={{ "@context": "https://schema.org", "@type": "CreativeWork", name: `${project.name}: project story`, url: `${SITE_URL}/applications/${project.slug}`, description: project.summary, image: `${SITE_URL}${project.image}`, creator: { "@id": `${SITE_URL}/about#anders` } }} />
    <BusinessPageVisit type="project" slug={project.slug} />
    <main className={styles.page}><div className={styles.container}>
      <BusinessBreadcrumbs items={breadcrumbs} />
      <header className={styles.hero}><p className={styles.eyebrow}><SiteLink href="/applications">Applications</SiteLink> / {project.type}</p><h1>{project.name}</h1><p>{project.summary}</p><div className={styles.actions}>{project.href.startsWith("/") ? <SiteLink href={project.href} className={styles.textLink}>Explore the application<ArrowForwardRoundedIcon fontSize="small" /></SiteLink> : <a href={project.href} className={styles.textLink} target="_blank" rel="noopener noreferrer">Visit the live website<ArrowOutwardRoundedIcon fontSize="small" /></a>}</div></header>
      <dl className={styles.facts}><div><dt>Project type</dt><dd>{project.type}</dd></div><div><dt>Focus</dt><dd>{project.category}</dd></div><div><dt>Anders' role</dt><dd>{project.role}</dd></div></dl>
      <section className={styles.section} aria-label={`${project.name} website preview`}><figure className={styles.media}><img src={project.image} srcSet={`${project.image.replace('.webp', '-600.webp')} 600w, ${project.image} 1200w`} sizes="(max-width: 600px) calc(100vw - 40px), (max-width: 1440px) calc(100vw - 96px), 1344px" width="1200" height="833" alt={project.alt} fetchPriority="high" decoding="async" /><figcaption>{project.caption}</figcaption></figure></section>
      <section aria-label="The project story">{[["The need", project.need], ["The work", project.work], ["The result", project.result]].map(([title, text]) => <div className={styles.narrative} key={title}><h2>{title}</h2><p>{text}</p></div>)}{project.note && <p className={styles.note}>{project.note}</p>}</section>
      <section className={styles.section}><div className={styles.twoColumns}><div><p className={styles.eyebrow}>Behind the build</p><h2>Decisions with<br /><span>a purpose.</span></h2></div><div><ul>{project.decisions.map(decision => <li key={decision}>{decision}</li>)}</ul><div className={styles.actions}><SiteLink href="/contact" className={styles.textLink}>Discuss a similar project<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></div></div></div></section>
      <section className={styles.section} aria-labelledby="more-projects"><h2 id="more-projects">More of the work.</h2><div className={styles.actions}>{projectStories.filter(item => item.slug !== project.slug).slice(0, 3).map(item => <SiteLink key={item.slug} href={`/applications/${item.slug}`} className={styles.textLink}>{item.name}<ArrowForwardRoundedIcon fontSize="small" /></SiteLink>)}</div></section>
      <section className={styles.cta}><div><h2>What could this look like for you?</h2><p>Your customers and workflow set the direction. Let's talk about the part of your business a website could make easier.</p></div><SiteLink href="/contact" className={styles.textLink}>Start a Project<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></section>
    </div></main></>
}
export const getStaticPaths = () => ({ paths: projectStories.map(project => ({ params: { slug: project.slug } })), fallback: false })
export const getStaticProps = ({ params }) => ({ props: { project: projectStories.find(project => project.slug === params.slug) } })
