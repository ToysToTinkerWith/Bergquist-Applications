import SiteLink from "./SiteLink"
import styles from "../styles/business-pages.module.css"

export default function BusinessBreadcrumbs({ items }) {
  return <nav className={styles.breadcrumbs} aria-label="Breadcrumb"><ol>{items.map((item, index) => <li key={item.path}>{index === items.length - 1 ? <span aria-current="page">{item.name}</span> : <SiteLink href={item.path}>{item.name}</SiteLink>}</li>)}</ol></nav>
}
