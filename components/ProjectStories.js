import SiteLink from "./SiteLink"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import { projectStories } from "../lib/projectStories"
import styles from "../styles/business-pages.module.css"

export default function ProjectStories({ compact = false, showHeading = true }) {
  const projects = compact ? projectStories.filter(project => project.type === "Client project").slice(0, 3) : projectStories
  return <div className={styles.stories}>
    {showHeading && <div className={styles.sectionHeading}><p className={styles.eyebrow}>A closer look at the work</p><h2>Real screens.<br /><span>Practical possibilities.</span></h2><p>Client work and independent projects, with the thinking behind each build.</p></div>}
    <div className={styles.storyGrid}>{projects.map(project => <article key={project.slug} className={styles.story}>
      <SiteLink href={`/applications/${project.slug}`} className={styles.screenLink} aria-label={`Read the ${project.name} project story`}><img src={project.image} srcSet={`${project.image.replace('.webp', '-600.webp')} 600w, ${project.image} 1200w`} sizes="(max-width: 599px) calc(100vw - 40px), (max-width: 800px) 50vw, 33vw" width="1200" height="833" loading="lazy" decoding="async" alt={project.alt} /></SiteLink>
      <div className={styles.storyCopy}><p className={styles.eyebrow}>{project.type}</p><h3>{project.name}</h3><p>{project.summary}</p><SiteLink href={`/applications/${project.slug}`} className={styles.textLink}>Explore the project<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></div>
    </article>)}</div>
    {compact && <div className={styles.actions}><SiteLink href="/applications" className={styles.textLink}>All project stories<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></div>}
  </div>
}
