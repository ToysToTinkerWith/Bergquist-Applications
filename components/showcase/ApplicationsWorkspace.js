import React, { useMemo, useState } from "react"
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded"
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded"
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded"
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded"
import applications from "../../lib/applicationCatalog.json"
import SiteLink from "../SiteLink"
import { csvText, downloadFile } from "../../lib/componentDemos"
import { Workspace, Tool, Search, Select, Views, Empty, Metrics, s } from "./Workspace"

function AppLink({ app }) {
  const content = <>{app.name}<ArrowOutwardRoundedIcon fontSize="small" /></>
  return app.href.startsWith("/") ? <SiteLink className={s.link} href={app.href}>{content}</SiteLink> : <a className={s.link} href={app.href} target="_blank" rel="noopener noreferrer">{content}</a>
}
export default function ApplicationsWorkspace() {
  const [search, setSearch] = useState(""), [category, setCategory] = useState("All"), [tag, setTag] = useState(""), [view, setView] = useState("bars"), [sort, setSort] = useState("name")
  const candidates = useMemo(() => applications.filter(app => (category === "All" || app.category === category) && `${app.name} ${app.description} ${app.tags.join(" ")}`.toLowerCase().includes(search.trim().toLowerCase())), [search, category])
  const counts = useMemo(() => {
    const index = new Map()
    candidates.forEach(app => new Set(app.tags).forEach(item => index.set(item, (index.get(item) || 0) + 1)))
    return [...index].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [candidates])
  const selectedTag = counts.some(([item]) => item === tag) ? tag : ""
  const visible = candidates.filter(app => !selectedTag || app.tags.includes(selectedTag)).sort((a, b) => sort === "category" ? a.category.localeCompare(b.category) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name))
  const clear = () => { setSearch(""); setCategory("All"); setTag("") }
  const change = setter => value => { setter(value); setTag("") }
  return <Workspace title="Application explorer" status="Bergquist application collection" actions={<Tool label="Export applications" disabled={!visible.length} onClick={() => downloadFile("applications.csv", csvText(["Name", "Category", "Capabilities", "Website"], visible.map(app => [app.name, app.category, app.tags.join("; "), app.href])))}><FileDownloadRoundedIcon /></Tool>}>
    <Metrics items={[{ label: "Applications", value: visible.length }, { label: "Capabilities", value: counts.length }, { label: "Categories", value: new Set(candidates.map(app => app.category)).size }, { label: "Selected capability", value: selectedTag || "All" }]} />
    <div className={s.toolbar}><Search label="Search applications" value={search} onChange={change(setSearch)} /><Select label="Category" value={category} onChange={change(setCategory)} options={["All", "Commerce", "Portfolio", "Community"]} /><Select label="Sort" value={sort} onChange={setSort} options={[{ value: "name", label: "Name" }, { value: "category", label: "Category" }]} /></div>
    {!candidates.length ? <Empty title="No matching applications" onReset={clear} /> : <div className={s.split}>
      <section aria-label="Capabilities"><div className={s.heading}><h3>Capabilities</h3><Views value={view} onChange={setView} options={[{ value: "bars", label: "Bars", icon: BarChartRoundedIcon }, { value: "table", label: "Table", icon: TableRowsRoundedIcon }]} /></div>
        {view === "bars" ? <div className={s.barList}>{counts.map(([item, count]) => <button key={item} className={s.bar} aria-pressed={selectedTag === item} onClick={() => setTag(selectedTag === item ? "" : item)}><span>{item}</span><span className={s.barTrack}><span style={{ width: `${count / candidates.length * 100}%` }} /></span><span>{count}</span></button>)}</div> : <div className={s.tableWrap}><table className={s.table}><thead><tr><th>Capability</th><th>Applications</th><th>Filter</th></tr></thead><tbody>{counts.map(([item, count]) => <tr key={item}><td>{item}</td><td>{count}</td><td><button className={s.button} aria-pressed={selectedTag === item} onClick={() => setTag(selectedTag === item ? "" : item)}>{selectedTag === item ? "Show all" : "Select"}</button></td></tr>)}</tbody></table></div>}
      </section>
      <section className={s.aside} aria-label="Matching applications"><div className={s.heading}><h3>{selectedTag || "All applications"}</h3>{selectedTag && <button className={s.button} onClick={() => setTag("")}>Clear</button>}</div>
        <ul className={s.list}>{visible.map(app => <li key={app.name} className={s.listItem}><img src={app.logoSrc} alt="" loading="lazy" /><div><AppLink app={app} /><p>{app.description}</p><div className={s.tags}>{app.tags.map(item => <span key={item}>{item}</span>)}</div></div></li>)}</ul>
      </section>
    </div>}
  </Workspace>
}
