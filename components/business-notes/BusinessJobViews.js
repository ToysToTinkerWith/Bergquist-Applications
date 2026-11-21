import React, { useEffect, useRef, useState } from "react"
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded"
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded"
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined"
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import { Empty, s } from "../showcase/Workspace"
import { noteDisplayDate, noteDisplayTime } from "../../lib/businessNotesCalendar.mjs"
import { NotePhotoGallery } from "./BusinessNotePhotos"
import BusinessSocialStudio from "./BusinessSocialStudio"
import j from "../../styles/business-job-views.module.css"

const phases = [
  { value: "new", label: "New" },
  { value: "planned", label: "Planned" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
]
const platforms = ["Facebook", "Instagram", "LinkedIn"]
const stageOf = item => item.status === "done" || item.stage === "completed" ? "completed" : phases.some(phase => phase.value === item.stage) ? item.stage : "new"
const sortByDate = (a, b) => (a.date || "9999").localeCompare(b.date || "9999") || (a.time || "").localeCompare(b.time || "") || a.title.localeCompare(b.title)

function dateText(item) {
  if (!item.date) return "Date to arrange"
  const date = noteDisplayDate(item)
  if (!date || !Number.isFinite(date.getTime())) return "Date needs review"
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
  const time = item.time ? noteDisplayTime(item) : ""
  return day + (item.time ? " · " + (time || "Time needs review") : "")
}

function sourceFor(item, notes) {
  const note = notes.find(entry => entry.id === item.noteId)
  const ids = new Set(Array.isArray(item.sourcePhotoIds) ? item.sourcePhotoIds : [])
  // Never attach every note photo to a social draft without a source link.
  return { note, photos: Array.isArray(note?.photos) ? note.photos.filter(photo => ids.has(photo.id)) : [] }
}

function SourcePhotos({ item, notes, user }) {
  const { note, photos } = sourceFor(item, notes)
  return photos.length ? <div className={j.photos}><span className={j.photoLabel}>Linked photos</span><NotePhotoGallery photos={photos} noteId={note.id} user={user} /></div> : null
}

export function BusinessJobs({ items = [], onSelect = () => {}, onChange = () => {}, notes = [], user }) {
  const [filter, setFilter] = useState("active"), [saving, setSaving] = useState(null), [error, setError] = useState("")
  const jobs = items.filter(item => item.kind === "job")
  const records = jobs.filter(item => filter === "all" || (filter === "active" ? stageOf(item) !== "completed" : stageOf(item) === filter)).sort(sortByDate)
  async function setPhase(item, stage) {
    setSaving(item.id); setError("")
    try { await onChange(item.id, { stage, status: stage === "completed" ? "done" : "open" }) }
    catch (failure) { setError(failure?.message || "The job could not be updated. Try again.") }
    finally { setSaving(null) }
  }
  return <section className={j.panel} aria-label="Jobs from business notes">
    <div className={j.heading}><div><h3>The work, from first note to finished.</h3><p>Scope, customers, dates, and progress kept together.</p></div><label className={s.select}>Show<select value={filter} onChange={event => setFilter(event.target.value)} aria-label="Filter jobs"><option value="active">Active jobs</option><option value="all">All jobs</option>{phases.map(phase => <option value={phase.value} key={phase.value}>{phase.label}</option>)}</select></label></div>
    {error && <p role="alert" className={s.error}>{error}</p>}
    {records.length ? <div className={j.grid}>{records.map(item => {
      const stage = stageOf(item)
      return <article key={item.id} className={j.jobCard} data-stage={stage}>
        <div className={j.cardTop}><span className={j.jobIcon}><WorkOutlineRoundedIcon fontSize="small" /></span><span className={j.phase}>{phases.find(phase => phase.value === stage).label}</span></div>
        <button type="button" className={j.title} onClick={() => onSelect(item)}>{item.title}<ArrowForwardRoundedIcon fontSize="small" /></button>
        {item.details && <p className={j.scope}>{item.details}</p>}
        <dl className={j.meta}><div><dt><PersonOutlineRoundedIcon fontSize="small" /><span>Customer</span></dt><dd>{item.person || "Not specified"}</dd></div><div><dt><CalendarMonthRoundedIcon fontSize="small" /><span>When</span></dt><dd>{dateText(item)}</dd></div>{item.location && <div><dt><PlaceOutlinedIcon fontSize="small" /><span>Location</span></dt><dd>{item.location}</dd></div>}</dl>
        <SourcePhotos item={item} notes={notes} user={user} />
        {item.reviewReason && <p className={j.review}>{item.reviewReason}</p>}
        <div className={j.jobFooter}><label>Progress<select value={stage} aria-label={"Progress for " + item.title} disabled={saving === item.id} onChange={event => setPhase(item, event.target.value)}>{phases.map(phase => <option value={phase.value} key={phase.value}>{phase.label}</option>)}</select></label><button type="button" className={s.button} onClick={() => onSelect(item)}>View job<ArrowForwardRoundedIcon fontSize="small" /></button></div>
      </article>
    })}</div> : <Empty title={filter === "completed" ? "No completed jobs yet" : filter === "active" ? "Room for your next job" : "No jobs in this view"}>Describe the work, customer, and next steps in a note. Its job details will stay connected here.</Empty>}
    {records.some(item => item.time) && <p className={j.footnote}>Times are shown in your browser’s time zone. Open a job to see its original note and time zone.</p>}
  </section>
}

function SocialDraftCard({ item, onSelect, onChange, notes, user }) {
  const savedCaption = item.postText || "", savedPlatform = item.platform || ""
  const [caption, setCaption] = useState(savedCaption), [platform, setPlatform] = useState(savedPlatform)
  const [saving, setSaving] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState(""), [conflict, setConflict] = useState(false)
  const previous = useRef({ caption: savedCaption, platform: savedPlatform }), textarea = useRef(null)
  const dirty = caption !== savedCaption || platform !== savedPlatform
  useEffect(() => {
    const untouched = caption === previous.current.caption && platform === previous.current.platform
    const matchesSaved = caption.trim() === savedCaption && platform === savedPlatform
    if (untouched || matchesSaved) { setCaption(savedCaption); setPlatform(savedPlatform); setConflict(false) }
    else setConflict(true)
    previous.current = { caption: savedCaption, platform: savedPlatform }
    // Preserve an unsaved local caption when another view updates this item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedCaption, savedPlatform])
  async function save() {
    setSaving(true); setError(""); setNotice("")
    const value = caption.trim()
    try {
      await onChange(item.id, { postText: value || null, platform: platform || null, status: "open" })
      setCaption(value); setConflict(false); setNotice("Draft saved for review.")
    } catch (failure) { setError(failure?.message || "The draft could not be saved. Your caption is still here.") }
    finally { setSaving(false) }
  }
  async function copy() {
    setError(""); setNotice("")
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable")
      await navigator.clipboard.writeText(caption)
      setNotice("Caption copied. You can paste it into your own post.")
    } catch { textarea.current?.focus(); textarea.current?.select(); setNotice("Caption selected. Use your browser’s Copy command.") }
  }
  async function review(checked) {
    setSaving(true); setError(""); setNotice("")
    try { await onChange(item.id, { status: checked ? "done" : "open" }); setNotice(checked ? "Marked reviewed. Nothing was published." : "Draft reopened for review.") }
    catch (failure) { setError(failure?.message || "The review status could not be updated.") }
    finally { setSaving(false) }
  }
  async function useCreativeCaption(value) {
    await onChange(item.id, { postText: value, platform: platform || "Facebook", status: "open" })
    setCaption(value); setNotice("AI caption saved for review."); setConflict(false)
  }
  return <article className={j.socialCard}>
    <div className={j.cardTop}><span className={j.draftBadge}>Draft only</span><span className={item.status === "done" ? j.reviewedBadge : j.pendingBadge}>{item.status === "done" ? <><CheckRoundedIcon fontSize="inherit" />Reviewed</> : "Needs review"}</span></div>
    <button type="button" className={j.title} onClick={() => onSelect(item)}>{item.title}<ArrowForwardRoundedIcon fontSize="small" /></button>
    {item.details && <p className={j.summary}>{item.details}</p>}
    <label className={j.platform}>Platform<select aria-label={"Platform for " + item.title} value={platform} disabled={saving} onChange={event => { setPlatform(event.target.value); setNotice("") }}><option value="">Choose a platform</option>{platforms.map(value => <option key={value}>{value}</option>)}</select></label>
    <label className={j.caption}>Caption<textarea ref={textarea} rows={7} maxLength={3000} value={caption} disabled={saving} onChange={event => { setCaption(event.target.value); setNotice("") }} aria-label={"Caption for " + item.title} placeholder="Review or write the caption for this draft." /></label>
    <div className={j.captionMeta}><small>{caption.length.toLocaleString()} / 3,000</small>{dirty && <span>Unsaved changes</span>}</div>
    <details className={j.sourceDetails}><summary>Original photos & note context</summary><SourcePhotos item={item} notes={notes} user={user} /></details>
    <BusinessSocialStudio note={notes.find(note => note.id === item.noteId)} user={user} platform={platform || item.platform || "Facebook"} onUseCaption={useCreativeCaption} />
    {item.reviewReason && <p className={j.review}>{item.reviewReason}</p>}
    {conflict && <div className={j.review}><p>The saved draft changed. Your unsaved caption is still here.</p><button type="button" className={j.textButton} onClick={() => { setCaption(savedCaption); setPlatform(savedPlatform); setConflict(false) }}>Use saved version</button></div>}
    {error && <p className={s.error} role="alert">{error}</p>}
    <div className={j.socialActions}><button type="button" className={s.button} disabled={saving || !caption.trim()} onClick={copy}><ContentCopyRoundedIcon fontSize="small" />Copy caption</button><button type="button" className={s.primary} disabled={saving || !dirty} onClick={save}>{saving ? "Saving…" : "Save draft"}</button></div>
    <div className={j.reviewRow}><label><input type="checkbox" checked={item.status === "done"} disabled={saving || dirty || !savedCaption.trim()} onChange={event => review(event.target.checked)} />Reviewed by me</label><button type="button" className={j.textButton} onClick={() => onSelect(item)}>View source<ArrowForwardRoundedIcon fontSize="small" /></button></div>
    <div className={j.notice} role="status" aria-live="polite">{notice}</div>
  </article>
}

export function BusinessSocialDrafts({ items = [], onSelect = () => {}, onChange = () => {}, notes = [], user }) {
  const [filter, setFilter] = useState("all")
  const records = items.filter(item => item.kind === "social" && (filter === "all" || (filter === "reviewed" ? item.status === "done" : item.status !== "done"))).sort((a, b) => (a.status === "done") - (b.status === "done") || sortByDate(a, b))
  return <section className={j.panel} aria-label="Social drafts from business notes">
    <div className={j.heading}><div><h3>A project update, ready for your words.</h3><p>Review the caption and photos, then copy the text when you’re ready.</p></div><label className={s.select}>Show<select aria-label="Filter social drafts" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">All drafts</option><option value="open">Needs review</option><option value="reviewed">Reviewed</option></select></label></div>
    <p className={j.draftsOnly}>These are private drafts. Saving, copying, or marking one reviewed does not publish it.</p>
    {records.length ? <div className={j.socialGrid}>{records.map(item => <SocialDraftCard key={item.id} item={item} onSelect={onSelect} onChange={onChange} notes={notes} user={user} />)}</div> : <Empty title={filter === "reviewed" ? "No reviewed drafts yet" : "Your next update starts with a note"}>Add a project photo and describe what you’d like to share. A social draft can keep its caption and linked photos together here.</Empty>}
  </section>
}
