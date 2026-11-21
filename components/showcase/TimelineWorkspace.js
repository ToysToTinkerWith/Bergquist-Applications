import React, { useMemo, useRef, useState } from "react"
import { format, parseISO, isValid } from "date-fns"
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded"
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded"
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded"
import { Workspace, Tool, Search, Select, Empty, s } from "./Workspace"
import { csvText, downloadFile } from "../../lib/componentDemos"

export default function TimelineWorkspace({ events = [] }) {
  const detail = useRef(null)
  const [search, setSearch] = useState(""), [type, setType] = useState("All"), [order, setOrder] = useState("newest"), [selected, setSelected] = useState("")
  const normalized = useMemo(() => events.filter(event => isValid(parseISO(event.date))).map((event, index) => ({ ...event, id: `${event.date}-${index}` })), [events])
  const types = ["All", ...new Set(normalized.map(event => event.type))]
  const filtered = normalized.filter(event => (type === "All" || event.type === type) && `${event.title} ${event.summary} ${event.date} ${(event.tags || []).join(" ")}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => order === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date))
  const current = filtered.find(event => event.id === selected) || filtered[0]
  const index = filtered.indexOf(current)
  const clear = () => { setSearch(""); setType("All") }
  function selectMilestone(id) {
    setSelected(id)
    if (window.matchMedia("(max-width: 760px)").matches) {
      detail.current?.focus({ preventScroll: true })
      detail.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
    }
  }
  return <Workspace title="Milestones" status={`${filtered.length} of ${normalized.length} milestones`} actions={<Tool label="Export milestones" disabled={!filtered.length} onClick={() => downloadFile("milestones.csv", csvText(["Date", "Milestone", "Type", "Summary"], filtered.map(event => [event.date, event.title, event.type, event.summary])))}><FileDownloadRoundedIcon /></Tool>}>
    <div className={s.toolbar}><Search label="Search milestones" value={search} onChange={setSearch} /><div className={s.row}><Select label="Type" value={type} onChange={setType} options={types} /><Select label="Order" value={order} onChange={setOrder} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }]} /></div></div>
    {!current ? <Empty title="No matching milestones" onReset={clear} /> : <div className={s.split}>
      <ol className={s.timeline}>{filtered.map(event => <li key={event.id}><button className={s.milestone} aria-pressed={event.id === current.id} onClick={() => selectMilestone(event.id)}><time dateTime={event.date}>{format(parseISO(event.date), "MMM yyyy")}</time><span><strong>{event.title}</strong><small>{event.type}</small></span></button></li>)}</ol>
      <section ref={detail} tabIndex={-1} className={`${s.aside} ${s.detail}`} aria-label="Selected milestone"><div className={s.heading}><span className={s.badge}>{current.type}</span><div className={s.actions}><Tool label="Previous milestone" disabled={index <= 0} onClick={() => setSelected(filtered[index - 1].id)}><ChevronLeftRoundedIcon /></Tool><Tool label="Next milestone" disabled={index >= filtered.length - 1} onClick={() => setSelected(filtered[index + 1].id)}><ChevronRightRoundedIcon /></Tool></div></div>
        <time className={s.muted} dateTime={current.date}>{format(parseISO(current.date), "MMMM d, yyyy")}</time><h3 style={{ marginTop: 14 }}>{current.title}</h3><p>{current.summary}</p>
        <ul>{(current.highlights || []).map(item => <li key={item}>{item}</li>)}</ul>
        <div className={s.tags}>{(current.tags || []).map(tag => <span key={tag}>{tag}</span>)}</div>
        {current.images?.length > 0 && <div className={s.detailImages}>{current.images.map((item, i) => <img key={i} loading="lazy" src={typeof item === "string" ? item : item.src} alt={item.alt || current.title} />)}</div>}
        {(current.links || []).filter(link => /^(https?:\/\/|\/(?!\/))/.test(link.href)).map(link => <p key={link.href}><a className={s.link} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a></p>)}
      </section>
    </div>}
  </Workspace>
}
