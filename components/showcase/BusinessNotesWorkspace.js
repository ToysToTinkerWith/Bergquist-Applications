import React, { useEffect, useMemo, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded"
import MicRoundedIcon from "@mui/icons-material/MicRounded"
import StopRoundedIcon from "@mui/icons-material/StopRounded"
import NotesRoundedIcon from "@mui/icons-material/NotesRounded"
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded"
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded"
import PeopleOutlineRoundedIcon from "@mui/icons-material/PeopleOutlineRounded"
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded"
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded"
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded"
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import EditOutlinedIcon from "@mui/icons-material/EditOutlined"
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded"
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded"
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import { Workspace, Tool, Search, Empty, Modal, s } from "./Workspace"
import { downloadFile } from "../../lib/componentDemos"
import { MAX_NOTE_LENGTH, makeNote, workspaceItems, makeExampleNote } from "../../lib/businessNotes.mjs"
import { noteCalendarEvent, noteDisplayDate, noteDisplayTime } from "../../lib/businessNotesCalendar.mjs"
import useBusinessNotes from "../business-notes/useBusinessNotes"
import useBusinessDictation from "../business-notes/useBusinessDictation"
import BusinessNotesMap from "../business-notes/BusinessNotesMap"
import BusinessNotesAccessGate from "../business-notes/BusinessNotesAccessGate"
import BusinessLocationWeather from "../business-notes/BusinessLocationWeather"
import BusinessNotePhotos, { NotePhotoGallery } from "../business-notes/BusinessNotePhotos"
import { materializeNotePhotos, prepareNotePhoto } from "../business-notes/notePhotoClient"
import { SHOWCASE_NOTE, SHOWCASE_PHOTOS, labelShowcase } from "../business-notes/photoShowcase.mjs"
import { BusinessJobs, BusinessSocialDrafts } from "../business-notes/BusinessJobViews"
import n from "../../styles/business-notes.module.css"

const kinds = {
  event: { label: "Event", plural: "Events", icon: CalendarMonthRoundedIcon, color: "#b4a1ed" },
  task: { label: "Task", plural: "Tasks", icon: TaskAltRoundedIcon, color: "#86c8ba" },
  followup: { label: "Follow-up", plural: "Follow-ups", icon: PeopleOutlineRoundedIcon, color: "#e3c38e" },
  expense: { label: "Expense", plural: "Expenses", icon: ReceiptLongRoundedIcon, color: "#a8bdec" },
  job: { label: "Job", plural: "Jobs", icon: WorkOutlineRoundedIcon, color: "#a0d0c6" },
  social: { label: "Social draft", plural: "Social drafts", icon: CampaignRoundedIcon, color: "#d9b2df" },
}
const tabs = [
  { id: "jobs", name: "Jobs", icon: WorkOutlineRoundedIcon },
  { id: "schedule", name: "Schedule", icon: CalendarMonthRoundedIcon },
  { id: "tasks", name: "Tasks", icon: TaskAltRoundedIcon },
  { id: "followups", name: "Follow-ups", icon: PeopleOutlineRoundedIcon },
  { id: "expenses", name: "Expenses", icon: ReceiptLongRoundedIcon },
  { id: "map", name: "Map", icon: PlaceOutlinedIcon },
  { id: "social", name: "Social", icon: CampaignRoundedIcon },
  { id: "notes", name: "Notes", icon: NotesRoundedIcon },
]
const makeId = () => "note-" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2))
const getZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" } catch { return "UTC" } }
function dayLabel(date) {
  if (!date) return "Date not specified"
  const parsed = new Date(date + "T12:00:00")
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Date needs review"
}
function timeLabel(time) {
  if (!time) return ""
  const parts = time.split(":")
  return new Date(2000, 0, 1, Number(parts[0]), Number(parts[1])).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}
function when(item) { return dayLabel(item.date) + (item.time ? " · " + timeLabel(item.time) : "") }
function money(item) {
  if (!Number.isInteger(item.amountCents)) return "Amount not specified"
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: item.currency || "USD" }).format(item.amountCents / 100) }
  catch { return (item.amountCents / 100).toFixed(2) + " " + (item.currency || "USD") }
}
function sortItems(a, b) { return (a.date || "9999").localeCompare(b.date || "9999") || (a.time || "").localeCompare(b.time || "") || a.title.localeCompare(b.title) }
function ItemTag({ item }) {
  const kind = kinds[item.kind], Icon = kind.icon
  return <span className={n.kind} style={{ "--kind-color": kind.color }}><Icon fontSize="inherit" />{kind.label}</span>
}

export function BusinessSchedule({ items, onSelect }) {
  const calendar = useRef(null)
  const [view, setView] = useState("agenda")
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const scheduled = items.filter(item => noteCalendarEvent(item)).sort((a, b) => String(noteCalendarEvent(a).start).localeCompare(String(noteCalendarEvent(b).start)))
  const undated = items.filter(item => ["event", "task", "followup", "job"].includes(item.kind) && !noteCalendarEvent(item) && item.status !== "done" && item.stage !== "completed")
  const events = scheduled.map(item => ({ ...noteCalendarEvent(item), color: kinds[item.kind].color, textColor: "#14111c" }))
  function navigate(delta) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1)
    setMonth(next); calendar.current?.getApi().gotoDate(next)
  }
  return <section aria-label="Note schedule">
    <div className={n.panelHeading}><div><h3>Your schedule</h3><p>Appointments, deadlines, and follow-ups from your notes.</p></div>
      <div className={s.views} role="group" aria-label="Calendar view"><button type="button" aria-pressed={view === "agenda"} onClick={() => setView("agenda")}>Agenda</button><button type="button" aria-pressed={view === "month"} onClick={() => setView("month")}>Month</button></div>
    </div>
    {view === "month" ? <>
      <div className={n.monthToolbar}><strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><div className={s.actions}><Tool label="Previous month" onClick={() => navigate(-1)}><ChevronLeftRoundedIcon /></Tool><button className={s.button} onClick={() => { const today = new Date(); const next = new Date(today.getFullYear(), today.getMonth(), 1); setMonth(next); calendar.current?.getApi().gotoDate(next) }}>Today</button><Tool label="Next month" onClick={() => navigate(1)}><ChevronRightRoundedIcon /></Tool></div></div>
      <div className={s.calendar}><FullCalendar ref={calendar} plugins={[dayGridPlugin]} initialView="dayGridMonth" initialDate={month} headerToolbar={false} height="auto" fixedWeekCount={false} events={events} dayMaxEvents={3} eventClick={info => onSelect(items.find(item => item.id === info.event.id))} eventDidMount={info => { info.el.setAttribute("aria-label", info.event.title); info.el.setAttribute("tabindex", "0"); info.el.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(items.find(item => item.id === info.event.id)) } }) }} /></div>
    </> : scheduled.length ? <ul className={n.itemList}>{scheduled.map(item => <li key={item.id}><button type="button" className={n.agendaItem} onClick={() => onSelect(item)}><span className={n.dateBlock}><strong>{noteDisplayDate(item).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong><small>{item.time ? noteDisplayTime(item) : "All day / time not set"}</small></span><span className={n.itemBody}><ItemTag item={item} /><strong>{item.title}</strong><small>{item.location || item.person || item.details}</small>{item.reviewReason && <span className={n.reviewBadge}>Needs review</span>}</span><ArrowForwardRoundedIcon className={n.itemArrow} fontSize="small" /></button></li>)}</ul> : <Empty title="A clear place for what’s next">Add a note about an appointment, deadline, or customer follow-up. Its date will appear here.</Empty>}
    {undated.length > 0 && <div className={n.unscheduled}><h4>Dates to clarify <span>{undated.length}</span></h4><p>These items are saved, but won’t be placed on a date until you add one.</p>{undated.map(item => <button type="button" key={item.id} onClick={() => onSelect(item)}><ItemTag item={item} /><span>{item.title}</span><EditOutlinedIcon fontSize="small" /></button>)}</div>}
    <p className={n.footnote}>Timed entries are shown in your browser’s time zone. Open an item to see the time zone from its note.</p>
  </section>
}

export function BusinessTaskList({ items, onSelect, onChange }) {
  const [filter, setFilter] = useState("open")
  const tasks = items.filter(item => item.kind === "task" && (filter === "all" || item.status === filter)).sort(sortItems)
  return <section aria-label="Tasks from notes"><div className={n.panelHeading}><div><h3>The small things, followed through.</h3><p>Action items with their source note always close by.</p></div><label className={s.select}>Show<select value={filter} onChange={event => setFilter(event.target.value)}><option value="open">Open tasks</option><option value="done">Completed tasks</option><option value="all">All tasks</option></select></label></div>
    {tasks.length ? <ul className={n.itemList}>{tasks.map(item => <li className={n.taskRow} key={item.id}><label className={n.taskCheck}><input type="checkbox" checked={item.status === "done"} aria-label={"Complete task: " + item.title} onChange={event => onChange(item.id, { status: event.target.checked ? "done" : "open" })} /><span /></label><button className={n.taskContent} onClick={() => onSelect(item)}><strong className={item.status === "done" ? n.completed : ""}>{item.title}</strong><small>{item.date ? when(item) : "No due date"}{item.person ? " · " + item.person : ""}</small>{item.reviewReason && <span className={n.reviewBadge}>Needs review</span>}</button><Tool label={"Edit task: " + item.title} onClick={() => onSelect(item)}><EditOutlinedIcon fontSize="small" /></Tool></li>)}</ul> : <Empty title={filter === "done" ? "No completed tasks yet" : "Nothing on your task list"}>Write what needs doing in a note, and it can become a task here.</Empty>}
  </section>
}

export function BusinessFollowups({ items, onSelect, onChange }) {
  const records = items.filter(item => item.kind === "followup").sort((a, b) => (a.status === "done") - (b.status === "done") || sortItems(a, b))
  return <section aria-label="Customer follow-ups"><div className={n.panelHeading}><div><h3>Keep the conversation going.</h3><p>People to contact, what to discuss, and when to follow up.</p></div></div>
    {records.length ? <div className={n.cardGrid}>{records.map(item => <article key={item.id} className={n.followupCard}><div className={n.followupTop}><span className={n.personInitial}>{(item.person || item.title).slice(0, 1).toUpperCase()}</span><div><h4>{item.person || "Contact not specified"}</h4><span className={item.status === "done" ? n.doneBadge : n.reviewBadge}>{item.status === "done" ? "Contacted" : item.date ? dayLabel(item.date) : "Date to clarify"}</span></div></div><button className={n.cardTitle} onClick={() => onSelect(item)}>{item.title}<ArrowForwardRoundedIcon fontSize="small" /></button><p>{item.details}</p><div className={n.cardActions}><button className={s.button} onClick={() => onSelect(item)}>View details</button><button className={item.status === "done" ? s.button : s.primary} onClick={() => onChange(item.id, { status: item.status === "done" ? "open" : "done" })}>{item.status === "done" ? "Reopen" : "Mark contacted"}</button></div></article>)}</div> : <Empty title="Good relationships start with a follow-up">Mention a customer and a next step in your note to keep the conversation here.</Empty>}
  </section>
}

export function BusinessExpenses({ items, onSelect }) {
  const records = items.filter(item => item.kind === "expense").sort(sortItems)
  const totals = records.reduce((all, item) => { if (Number.isInteger(item.amountCents)) all[item.currency] = (all[item.currency] || 0) + item.amountCents; return all }, {})
  return <section aria-label="Expenses from notes"><div className={n.panelHeading}><div><h3>Catch the costs while they’re fresh.</h3><p>Amounts mentioned in your notes, ready to check and export.</p></div><div className={n.expenseTotals}>{Object.entries(totals).map(([currency, amountCents]) => <span key={currency}><small>{currency} recorded</small><strong>{money({ currency, amountCents })}</strong></span>)}</div></div>
    {records.length ? <div className={s.tableWrap}><table className={s.table}><thead><tr><th>Expense</th><th>Date</th><th>Amount</th><th><span className={n.srOnly}>Details</span></th></tr></thead><tbody>{records.map(item => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.person || item.details}</small>{item.reviewReason && <span className={n.reviewBadge}>Needs review</span>}</td><td>{item.date ? dayLabel(item.date) : "Not specified"}</td><td>{money(item)}</td><td><Tool label={"Edit expense: " + item.title} onClick={() => onSelect(item)}><EditOutlinedIcon fontSize="small" /></Tool></td></tr>)}</tbody></table></div> : <Empty title="Make a note. Keep the amount.">Include a purchase, supplier, and amount in a note to build your expense list.</Empty>}
    <p className={n.footnote}>These are extracted notes, not posted accounting transactions. Confirm amounts against your receipts.</p>
  </section>
}

function ItemEditor({ item, onSave, onClose, onSource, user, note }) {
  const [draft, setDraft] = useState(item), [error, setError] = useState("")
  const update = (key, value) => setDraft(current => ({ ...current, [key]: value }))
  function submit(event) {
    event.preventDefault()
    try {
      const amount = draft.amountInput !== undefined ? draft.amountInput.trim() : item.amountCents === null ? "" : String(item.amountCents / 100)
      if (amount && (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) > 100000000)) throw new Error("Enter a positive amount with at most two decimal places.")
      const patch = { title: draft.title.trim(), details: draft.details.trim(), date: draft.date || null, time: draft.time || null, endDate: draft.endDate || null, endTime: draft.endTime || null, person: draft.person?.trim() || null, location: draft.location?.trim() || null, amountCents: amount ? Math.round(Number(amount) * 100) : null, currency: draft.currency || "USD", status: item.kind === "job" ? draft.stage === "completed" ? "done" : "open" : draft.status, reviewReason: null }
      if (item.kind === "job") patch.stage = draft.stage || "new"
      if (item.kind === "social") { patch.platform = draft.platform || "Facebook"; patch.postText = draft.postText?.trim() || null }
      onSave(item.id, patch); onClose()
    } catch (failure) { setError(failure.message) }
  }
  return <form onSubmit={submit} className={n.editor}><div className={n.editorMeta}><ItemTag item={item} /><span>{item.timeZone}</span></div>
    <label className={s.field}>Title<input required maxLength={160} value={draft.title} onChange={event => update("title", event.target.value)} /></label>
    <label className={s.field}>Details<textarea maxLength={2500} value={draft.details} onChange={event => update("details", event.target.value)} /></label>
    {item.kind === "job" && <label className={s.field}>Job stage<select value={draft.stage || "new"} onChange={event => update("stage", event.target.value)}><option value="new">New</option><option value="planned">Planned</option><option value="in-progress">In progress</option><option value="completed">Completed</option></select></label>}
    {item.kind === "social" && <><label className={s.field}>Platform<select value={draft.platform || "Facebook"} onChange={event => update("platform", event.target.value)}><option>Facebook</option><option>Instagram</option><option>LinkedIn</option></select></label><label className={s.field}>Post draft<textarea rows={7} maxLength={3000} value={draft.postText || ""} onChange={event => update("postText", event.target.value)} /></label><p className={n.footnote}>Draft only. Review the text and photos before sharing.</p></>}
    <div className={s.formGrid}><label className={s.field}>Date<input type="date" value={draft.date || ""} onChange={event => update("date", event.target.value)} /></label><label className={s.field}>Time (optional)<input type="time" value={draft.time || ""} onChange={event => update("time", event.target.value)} /></label></div>
    {["event", "job"].includes(item.kind) && <div className={s.formGrid}><label className={s.field}>End date (optional)<input type="date" value={draft.endDate || ""} onChange={event => update("endDate", event.target.value)} /></label><label className={s.field}>End time (optional)<input type="time" value={draft.endTime || ""} onChange={event => update("endTime", event.target.value)} /></label></div>}
    <label className={s.field}>{item.kind === "expense" ? "Vendor / person" : "Person / customer"}<input maxLength={160} value={draft.person || ""} onChange={event => update("person", event.target.value)} /></label>
    <label className={s.field}>Location (optional)<input maxLength={500} value={draft.location || ""} placeholder="An address or named place" onChange={event => update("location", event.target.value)} /></label>
    {item.location && <BusinessLocationWeather location={item.location} date={item.date} timeZone={item.timeZone} user={user} />}
    {item.kind === "expense" && <div className={s.formGrid}><label className={s.field}>Amount<input inputMode="decimal" value={draft.amountInput ?? (draft.amountCents === null ? "" : (draft.amountCents / 100).toFixed(2))} onChange={event => update("amountInput", event.target.value)} /></label><label className={s.field}>Currency<select value={draft.currency} onChange={event => update("currency", event.target.value)}>{Array.from(new Set(["USD", "CAD", "EUR", "GBP", item.currency])).map(currency => <option key={currency}>{currency}</option>)}</select></label></div>}
    {item.kind !== "job" && <label className={s.check}><input type="checkbox" checked={draft.status === "done"} onChange={event => update("status", event.target.checked ? "done" : "open")} />{item.kind === "followup" ? "Contacted" : item.kind === "social" ? "Draft reviewed" : "Completed / reviewed"}</label>}
    {note?.photos?.length > 0 && <NotePhotoGallery photos={note.photos.filter(photo => (item.sourcePhotoIds || []).includes(photo.id))} noteId={note.id} user={user} />}
    {item.reviewReason && <p className={s.notice}>{item.reviewReason}</p>}
    {item.sourceQuote && <div className={n.sourceQuote}><small>From your note</small><blockquote>{item.sourceQuote}</blockquote></div>}
    <button className={s.link + " " + n.textButton} type="button" onClick={() => onSource(item.noteId)}>Open original note<ArrowForwardRoundedIcon fontSize="small" /></button>
    {error && <p role="alert" className={s.error}>{error}</p>}
    <div className={s.formActions}><button type="button" className={s.button} onClick={onClose}>Cancel</button><button type="submit" className={s.primary}>Save changes</button></div>
  </form>
}

export default function BusinessNotesWorkspace() {
  const store = useBusinessNotes(), { workspace, ready, user, storageStatus, storageError, saveNote, deleteNote, changeItem, retrySync, sessionKey, accessStatus = "checking", accessError, retryAccess } = store
  const [draft, setDraft] = useState(""), [editingId, setEditingId] = useState(null), [view, setView] = useState("schedule")
  const [draftPhotos, setDraftPhotos] = useState([]), [photoBusy, setPhotoBusy] = useState(false)
  const [createJob, setCreateJob] = useState(false), [createSocialDraft, setCreateSocialDraft] = useState(false), [socialPlatform, setSocialPlatform] = useState("Facebook")
  const [processingLabel, setProcessingLabel] = useState("")
  const [search, setSearch] = useState(""), [processing, setProcessing] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("")
  const [workspaceError, setWorkspaceError] = useState("")
  const [selectedId, setSelectedId] = useState(null), [noteDetailId, setNoteDetailId] = useState(null), [deleteId, setDeleteId] = useState(null), [language, setLanguage] = useState("en-US")
  const [cooldown, setCooldown] = useState(0), [lastId, setLastId] = useState(null)
  const request = useRef(null), input = useRef(null), sample = useRef(null), retryAt = useRef(0), ownerSession = useRef(sessionKey)
  ownerSession.current = sessionKey
  const timeZone = useMemo(getZone, [])
  const dictation = useBusinessDictation({ language, onFinal: text => setDraft(current => (current + (current && !/\s$/.test(current) ? " " : "") + text).slice(0, MAX_NOTE_LENGTH)) })
  const allItems = useMemo(() => workspaceItems(workspace), [workspace])
  const items = useMemo(() => allItems.filter(item => [item.title, item.details, item.person, item.location, item.noteTitle].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase())), [allItems, search])
  const selected = allItems.find(item => item.id === selectedId), noteDetail = workspace.notes.find(note => note.id === noteDetailId)
  const last = workspace.notes.find(note => note.id === lastId), isExample = Boolean(sample.current && draft === sample.current.text && !draftPhotos.length && !createJob && !createSocialDraft)
  const canCapture = Boolean(draft.trim() || draftPhotos.length)
  useEffect(() => () => request.current?.abort(), [])
  useEffect(() => {
    if (!cooldown) return
    const timer = setTimeout(() => setCooldown(Math.max(0, Math.ceil((retryAt.current - Date.now()) / 1000))), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])
  useEffect(() => {
    request.current?.abort(); request.current = null; dictation.stop({ discardPending: true })
    setProcessing(false); setDraft(""); setDraftPhotos([]); setCreateJob(false); setCreateSocialDraft(false); setPhotoBusy(false); setEditingId(null); setSelectedId(null); setNoteDetailId(null); setDeleteId(null); setLastId(null); setNotice(""); setError(""); setWorkspaceError(""); sample.current = null
  }, [sessionKey])
  function resetComposer() { dictation.stop({ discardPending: true }); setDraft(""); setDraftPhotos([]); setCreateJob(false); setCreateSocialDraft(false); setEditingId(null); sample.current = null; setError(""); setNotice(""); input.current?.focus() }
  function editNote(note) { dictation.stop({ discardPending: true }); setEditingId(note.id); setDraft(note.text); setDraftPhotos(note.photos || []); setCreateJob(note.items.some(item => item.kind === "job")); setCreateSocialDraft(note.items.some(item => item.kind === "social")); setSocialPlatform(note.items.find(item => item.kind === "social")?.platform || "Facebook"); sample.current = note.source === "sample" ? note : null; setNoteDetailId(null); setSelectedId(null); setError(""); input.current?.focus(); input.current?.scrollIntoView({ behavior: "smooth", block: "center" }) }
  function showItem(item) { if (item) setSelectedId(item.id) }
  function afterSave(note, message, expectedSession = sessionKey) { saveNote(note, expectedSession); setLastId(note.id); setNotice(message); setDraft(""); setDraftPhotos([]); setCreateJob(false); setCreateSocialDraft(false); setEditingId(null); sample.current = null; setError("") }
  function changePhotos(next) { if (!draftPhotos.length && next.length) setCreateJob(true); setDraftPhotos(next) }
  async function uploadPhotos(id, payload, photoDescriptions, controller, token) {
    if (!payload.length) return []
    setProcessingLabel("Saving your photos privately…")
    const descriptions = new Map((photoDescriptions || []).map(photo => [photo.id, photo.description]))
    const response = await fetch("/api/business-note-photos", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ noteId: id, photos: payload.map(photo => ({ id: photo.id, name: photo.name, dataUrl: photo.dataUrl, caption: photo.caption || "", description: descriptions.get(photo.id) || photo.description || "" })) }) })
    const data = await response.json()
    if (!response.ok || !Array.isArray(data.photos)) throw new Error(data.error || "Your photos could not be saved. The note is still here.")
    return data.photos
  }
  async function saveRaw() {
    if (!ready || !canCapture || processing || photoBusy || dictation.listening || request.current) return
    const controller = new AbortController(), expectedSession = sessionKey
    request.current = controller; setProcessing(true); setProcessingLabel("Preparing your note and photos…"); setError("")
    const timer = setTimeout(() => controller.abort(), 90000)
    try {
      const existing = workspace.notes.find(note => note.id === editingId)
      if (existing?.items.length) { setError("Use Organize note to update its linked items. The original note is still saved."); return }
      const id = editingId || makeId(), payload = await materializeNotePhotos(draftPhotos, { noteId: editingId, user, signal: controller.signal })
      const token = await user.getIdToken(), photos = await uploadPhotos(id, payload, [], controller, token)
      if (controller.signal.aborted || expectedSession !== ownerSession.current || request.current !== controller) return
      const note = makeNote({ id, text: draft.trim(), photos, timeZone: existing?.timeZone || timeZone, referenceDate: existing?.referenceDate || existing?.createdAt, source: "manual", analysis: { title: draft.trim().split("\n")[0].slice(0, 80) || "Photo note", summary: draft.trim().slice(0, 240) || photos.length + " attached photos, ready to organize.", items: [], questions: [] }, createdAt: existing?.createdAt })
      note.updatedAt = new Date().toISOString()
      afterSave(note, "Note saved. You can organize it with AI whenever you’re ready.", expectedSession); setView("notes")
    } catch (failure) { if (expectedSession === ownerSession.current) setError(controller.signal.aborted ? "Saving stopped. Your note and photos are still here." : failure.message) }
    finally { clearTimeout(timer); if (request.current === controller) { request.current = null; setProcessing(false) } }
  }
  async function organize(event) {
    event?.preventDefault()
    if (!ready || request.current || !canCapture || dictation.listening || photoBusy || cooldown) return
    const original = workspace.notes.find(note => note.id === editingId)
    const text = draft.trim(), controller = new AbortController(), expectedSession = sessionKey, referenceDate = original?.referenceDate || original?.createdAt || new Date().toISOString()
    request.current = controller; setProcessing(true); setProcessingLabel(draftPhotos.length ? "Preparing photos for the note…" : "Finding dates, next steps, people, amounts, and places…"); setError(""); setNotice("")
    const timer = setTimeout(() => controller.abort(), 90000)
    try {
      let note
      if (isExample) {
        const example = sample.current
        note = makeNote({ id: editingId || example.id, text, timeZone: example.timeZone, referenceDate: example.referenceDate || example.createdAt, analysis: { title: example.title, summary: example.summary, items: example.items, questions: example.questions }, createdAt: original?.createdAt || example.createdAt, source: "sample" })
      } else {
        const idToken = user ? await user.getIdToken() : undefined
        const photos = await materializeNotePhotos(draftPhotos, { noteId: editingId, user, signal: controller.signal })
        setProcessingLabel(photos.length ? "Reading the note and photos to organize the work…" : "Finding dates, next steps, people, amounts, and places…")
        const response = await fetch("/api/business-capture", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, photos, createJob, createSocialDraft, socialPlatform, timeZone: original?.timeZone || timeZone, referenceDate, idToken }) })
        const data = await response.json()
        if (!response.ok) { const failure = new Error(data.error || "The note could not be organized."); failure.retryAfter = response.status === 429 ? Math.min(86400, Math.max(1, Number(data.retryAfterSeconds) || 60)) : 0; throw failure }
        const id = editingId || makeId(), savedPhotos = await uploadPhotos(id, photos, data.analysis.photoDescriptions, controller, idToken)
        note = labelShowcase(makeNote({ id, text, photos: savedPhotos, timeZone: original?.timeZone || timeZone, referenceDate, analysis: data.analysis, createdAt: original?.createdAt, source: "ai" }))
        if (original) note.items = note.items.map((item, index) => {
          const previous = original.items.find(entry => entry.kind === item.kind && entry.title === item.title)
          if (!previous) return item
          if (item.kind === "job") { const stage = data.analysis.items[index]?.stage || previous.stage || (previous.status === "done" ? "completed" : "new"); return { ...item, stage, status: stage === "completed" ? "done" : "open" } }
          const changedSocial = item.kind === "social" && (previous.postText !== item.postText || previous.platform !== item.platform || JSON.stringify([...(previous.sourcePhotoIds || [])].sort()) !== JSON.stringify([...(item.sourcePhotoIds || [])].sort()))
          return { ...item, status: changedSocial ? "open" : previous.status }
        })
      }
      if (controller.signal.aborted || expectedSession !== ownerSession.current || request.current !== controller) return
      note.updatedAt = new Date().toISOString()
      afterSave(note, note.source === "sample" ? "Example organized. These sample items are now linked to this note." : "Note organized. Your views are up to date.", expectedSession)
      setView(note.text.includes("[EXAMPLE SHOWCASE]") && note.items.some(item => item.kind === "social") ? "social" : note.items.some(item => item.kind === "job") ? "jobs" : note.items.some(item => item.kind === "social") ? "social" : note.items.some(item => item.kind === "event") ? "schedule" : note.items.some(item => item.kind === "task") ? "tasks" : note.items.some(item => item.kind === "followup") ? "followups" : note.items.some(item => item.kind === "expense") ? "expenses" : "notes")
    } catch (failure) {
      if (expectedSession !== ownerSession.current || request.current !== controller) return
      if (failure.retryAfter) { retryAt.current = Date.now() + failure.retryAfter * 1000; setCooldown(failure.retryAfter) }
      setError(controller.signal.aborted ? "Processing stopped. Your note is still here; you can retry or save the note only." : failure.message || "AI processing is unavailable. Your note is still here.")
    } finally { clearTimeout(timer); if (request.current === controller) { request.current = null; setProcessing(false) } }
  }
  function loadExample() { const example = makeExampleNote(new Date(), timeZone); sample.current = example; setDraft(example.text); setDraftPhotos([]); setCreateJob(false); setCreateSocialDraft(false); setEditingId(workspace.notes.some(note => note.id === example.id) ? example.id : null); setError(""); setNotice("Example loaded. Select Organize example to see how one note feeds the workspace."); input.current?.focus() }
  async function loadPhotoShowcase() {
    if (!ready || request.current || photoBusy || dictation.listening) return
    const controller = new AbortController(), expectedSession = sessionKey
    request.current = controller; setProcessing(true); setProcessingLabel("Loading the clearly labeled example photos…"); setError("")
    const timeout = setTimeout(() => controller.abort(), 20000)
    try {
      const photos = []
      for (const source of SHOWCASE_PHOTOS) {
        const response = await fetch(source.path, { signal: controller.signal })
        if (!response.ok) throw new Error("The showcase photo could not be loaded.")
        const photo = await prepareNotePhoto(new File([await response.blob()], source.name, { type: "image/png" }))
        photos.push({ ...photo, caption: source.caption })
      }
      if (controller.signal.aborted || ownerSession.current !== expectedSession || request.current !== controller) return
      dictation.stop({ discardPending: true }); sample.current = null; setEditingId(null); setDraft(SHOWCASE_NOTE); setDraftPhotos(photos); setCreateJob(true); setCreateSocialDraft(true); setSocialPlatform("Facebook"); setNotice("Photo showcase loaded. Review the example, then organize it with AI to create the job and social draft.")
    } catch (failure) { if (request.current === controller) setError(controller.signal.aborted ? "Example loading stopped. Your previous draft is unchanged." : failure.message) }
    finally { clearTimeout(timeout); if (request.current === controller) { request.current = null; setProcessing(false) } }
  }
  function exportNotes() { downloadFile("business-notes.json", JSON.stringify(workspace, null, 2), "application/json;charset=utf-8") }
  function saveItem(id, patch) { changeItem(id, patch, sessionKey); setWorkspaceError(""); setNotice("Item updated across your workspace.") }
  function changeStatus(id, patch) { try { saveItem(id, patch) } catch (failure) { setWorkspaceError(failure.message || "The item could not be updated.") } }
  function confirmDelete() {
    try { deleteNote(deleteId, sessionKey); setWorkspaceError(""); setDeleteId(null); setNotice("Note and linked items removed."); if (editingId === deleteId) resetComposer() }
    catch (failure) { setWorkspaceError(failure.message || "The note could not be deleted."); setDeleteId(null) }
  }
  const counts = { jobs: allItems.filter(item => item.kind === "job" && item.status !== "done").length, social: allItems.filter(item => item.kind === "social").length, schedule: allItems.filter(item => noteCalendarEvent(item)).length, tasks: allItems.filter(item => item.kind === "task" && item.status !== "done").length, followups: allItems.filter(item => item.kind === "followup" && item.status !== "done").length, expenses: allItems.filter(item => item.kind === "expense").length, map: allItems.filter(item => item.location).length, notes: workspace.notes.length }
  if (accessStatus !== "allowed") return <Workspace title="Business notebook" status="Private · Approved Google account only"><BusinessNotesAccessGate status={accessStatus} message={accessError} onRetry={retryAccess} /></Workspace>
  return <Workspace title="Business notes" status={storageStatus} actions={<Tool label="Download business notes" disabled={!workspace.notes.length} onClick={exportNotes}><FileDownloadRoundedIcon /></Tool>}>
    <div className={n.captureLayout}><form className={n.capture} onSubmit={organize}>
      <div className={n.captureHeading}><div><span className={n.eyebrow}>{editingId ? "UPDATE A NOTE" : "A LITTLE LESS TO REMEMBER"}</span><h3>{editingId ? "Keep the plan in step." : "Write it once. Put it to work."}</h3></div><span className={n.captureIcon}><NotesRoundedIcon /></span></div>
      <label htmlFor="business-note" className={n.noteLabel}>What’s happening in your business?</label>
      {editingId && <p className={n.editContext}>Relative dates use this note’s original date and time zone: {new Date(workspace.notes.find(note => note.id === editingId)?.createdAt || Date.now()).toLocaleDateString()}.</p>}
      <textarea id="business-note" ref={input} value={draft} rows={6} maxLength={MAX_NOTE_LENGTH} disabled={processing || !ready} onChange={event => setDraft(event.target.value)} placeholder="Meeting with Maya at the Freeland Library next Tuesday at 10am. Send her the proposal by Monday. Bought $48 of supplies today…" />
      {dictation.interim && <p className={n.interim} aria-live="polite"><span>Hearing</span>{dictation.interim}</p>}
      <div className={n.voiceBar}><button type="button" className={n.micButton} data-listening={dictation.listening} aria-pressed={dictation.listening} disabled={!ready || processing || !dictation.supported} onClick={dictation.listening ? dictation.stop : dictation.start}>{dictation.listening ? <StopRoundedIcon fontSize="small" /> : <MicRoundedIcon fontSize="small" />}{dictation.listening ? "Stop listening" : "Dictate note"}</button><label className={n.language}><span className={n.srOnly}>Dictation language</span><select aria-label="Dictation language" value={language} disabled={dictation.listening || processing} onChange={event => setLanguage(event.target.value)}><option value="en-US">English (US)</option><option value="en-GB">English (UK)</option><option value="es-ES">Español</option><option value="fr-FR">Français</option><option value="de-DE">Deutsch</option></select></label><small>{draft.length.toLocaleString()} / {MAX_NOTE_LENGTH.toLocaleString()}</small></div>
      <p className={n.voiceHelp} role="status">{dictation.listening ? "Listening… Stop and review the text before organizing." : !dictation.supported ? "Voice input isn’t supported in this browser. You can still type your note." : "Click the microphone to start. Your browser may use an online speech service."}</p>
      {dictation.error && <p role="alert" className={s.error}>{dictation.error}<button type="button" className={n.inlineDismiss} aria-label="Dismiss microphone error" onClick={dictation.clearError}><CloseRoundedIcon fontSize="small" /></button></p>}
      {error && <p role="alert" className={s.error}>{error}</p>}
      <BusinessNotePhotos key={sessionKey + ":" + (editingId || "new")} photos={draftPhotos} onChange={changePhotos} disabled={!ready || processing} user={user} noteId={editingId} onBusyChange={setPhotoBusy} />
      <div className={n.showcasePrompt}><div><strong>Try the before & after workflow.</strong><p>Load two AI-generated example photos and a note. Turn them into a job, a social draft, a collage, and a short video.</p></div><button type="button" className={s.button} disabled={!ready || processing || photoBusy || dictation.listening} onClick={loadPhotoShowcase}>Load photo showcase</button></div>
      <fieldset className={n.captureOptions} disabled={!ready || processing || photoBusy}><legend>Put this note to work</legend><label className={s.check}><input type="checkbox" checked={createJob} onChange={event => setCreateJob(event.target.checked)} />Organize as a job</label><label className={s.check}><input type="checkbox" checked={createSocialDraft} onChange={event => setCreateSocialDraft(event.target.checked)} />Create a social media draft</label>{createSocialDraft && <label className={n.platformChoice}>Platform<select value={socialPlatform} onChange={event => setSocialPlatform(event.target.value)}><option>Facebook</option><option>Instagram</option><option>LinkedIn</option></select></label>}<p>AI uses the description and photos to suggest the work. Social posts stay as drafts for your review.</p></fieldset>
      <div className={n.captureFooter}><div>{editingId ? <button type="button" className={s.button} disabled={processing || photoBusy} onClick={resetComposer}>Cancel edit</button> : <button type="button" className={n.exampleButton} disabled={!ready || processing || photoBusy || dictation.listening} onClick={loadExample}>Try an example<ArrowForwardRoundedIcon fontSize="small" /></button>}<button type="button" className={n.exampleButton} disabled={!ready || !canCapture || processing || photoBusy || dictation.listening} onClick={saveRaw}>Save note only</button></div>
        {processing ? <button type="button" className={s.button} onClick={() => request.current?.abort()}><StopRoundedIcon fontSize="small" />Stop processing</button> : <button type="submit" className={s.primary} disabled={!ready || !canCapture || photoBusy || dictation.listening || cooldown > 0}><AutoAwesomeRoundedIcon fontSize="small" />{cooldown ? "Try again in " + cooldown + "s" : isExample ? "Organize example" : editingId ? "Update linked items" : "Organize note"}</button>}
      </div>
      {processing && <p className={n.processing} role="status"><span />{processingLabel}</p>}
    </form><aside className={n.routePanel}><span className={n.eyebrow}>ONE NOTE, CONNECTED VIEWS</span><h3>Make room for<br />the work itself.</h3><p>Describe the work. Add a photo from the job. Keep the details together, wherever you need them.</p><div className={n.routeList}>{Object.entries(kinds).map(([id, kind]) => { const Icon = kind.icon; return <div key={id}><span style={{ color: kind.color }}><Icon fontSize="small" /></span><div><strong>{kind.plural}</strong><small>{{ job: "Scope, photos & progress", social: "Photo captions to review", event: "Appointments & deadlines", task: "The next things to do", followup: "Customers to get back to", expense: "Costs to check & keep" }[id]}</small></div></div> })}</div><p className={n.routeHint}><PlaceOutlinedIcon fontSize="small" />A place in your note can become a point on your map.</p></aside></div>
    {notice && <div className={n.resultNotice} role="status"><TaskAltRoundedIcon /><div><strong>{notice}</strong>{last && <p>{last.summary} {last.source === "sample" && <span className={n.sampleBadge}>Sample</span>}</p>}</div>{last && <button className={n.exampleButton} onClick={() => setNoteDetailId(last.id)}>View note<ArrowForwardRoundedIcon fontSize="small" /></button>}</div>}
    {last?.questions?.length > 0 && <div className={n.questions}><strong>A few details to clarify</strong><ul>{last.questions.map((question, index) => <li key={index}>{question}</li>)}</ul><button className={n.exampleButton} onClick={() => editNote(last)}>Add detail to the note<EditOutlinedIcon fontSize="small" /></button></div>}
    {storageError && <div role="alert" className={s.error}>{storageError}{user && <button className={s.button} onClick={retrySync} style={{ marginLeft: 12 }}>Retry account sync</button>}</div>}
    {workspaceError && <div role="alert" className={s.error}>{workspaceError}</div>}
    <div className={n.viewHeader}><nav className={n.tabs} aria-label="Business note views">{tabs.map(tab => { const Icon = tab.icon; return <button type="button" key={tab.id} aria-pressed={view === tab.id} onClick={() => { setView(tab.id); setSearch("") }}><Icon fontSize="small" /><span>{tab.name}</span><small>{counts[tab.id]}</small></button> })}</nav><Search label="Search your workspace" value={search} onChange={setSearch} /></div>
    <div className={n.viewPanel}>
      {view === "jobs" && <BusinessJobs items={items} notes={workspace.notes} user={user} onSelect={showItem} onChange={saveItem} />}
      {view === "social" && <BusinessSocialDrafts items={items} notes={workspace.notes} user={user} onSelect={showItem} onChange={saveItem} />}
      {view === "schedule" && <BusinessSchedule items={items} onSelect={showItem} />}
      {view === "tasks" && <BusinessTaskList items={items} onSelect={showItem} onChange={changeStatus} />}
      {view === "followups" && <BusinessFollowups items={items} onSelect={showItem} onChange={changeStatus} />}
      {view === "expenses" && <BusinessExpenses items={items} onSelect={showItem} />}
      {view === "map" && <section aria-label="Locations from business notes"><div className={n.panelHeading}><div><h3>The places behind the plan.</h3><p>Only notes with a location appear here. Select a place to see its event or next step.</p></div></div><BusinessNotesMap items={items} selectedId={selectedId} onSelect={item => showItem(typeof item === "string" ? allItems.find(entry => entry.id === item) : item)} /></section>}
      {view === "notes" && <section aria-label="Original business notes"><div className={n.panelHeading}><div><h3>The original, always here.</h3><p>Edit a note and organize it again to update its linked items.</p></div><span className={n.noteCount}>{workspace.notes.length} notes</span></div>{workspace.notes.length ? <div className={n.noteGrid}>{workspace.notes.filter(note => [note.text, note.title, note.summary].join(" ").toLowerCase().includes(search.toLowerCase())).map(note => <article key={note.id} className={n.noteCard}><div className={n.noteCardTop}><small>{new Date(note.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small>{note.source === "sample" && <span className={n.sampleBadge}>Sample</span>}{note.source === "manual" && <span className={n.sampleBadge}>Note only</span>}<span>{note.items.length} linked items</span></div><button className={n.cardTitle} onClick={() => setNoteDetailId(note.id)}>{note.title}<ArrowForwardRoundedIcon fontSize="small" /></button><p>{note.text || note.summary}</p>{note.photos?.length > 0 && <p className={n.photoCount}>{note.photos.length} attached {note.photos.length === 1 ? "photo" : "photos"}</p>}<div className={n.cardActions}><button className={s.button} onClick={() => editNote(note)}><EditOutlinedIcon fontSize="small" />Edit & organize</button><button className={n.exampleButton} onClick={() => setNoteDetailId(note.id)}>Read note</button></div></article>)}</div> : <Empty title="Your business, in your own words">Type or dictate a note above. The original will stay here alongside everything it helps organize.</Empty>}</section>}
    </div>
    <p className={n.workspaceFooter}>You’re in control. AI can miss details; check important dates and amounts. {user ? "Your notes are private to your account." : "Notes stay in this browser. Sign in on your profile to keep a separate account workspace."}</p>
    <Modal title={selected ? kinds[selected.kind].label + " details" : "Item details"} open={Boolean(selected)} onClose={() => setSelectedId(null)}>{selected && <ItemEditor key={selected.id} item={selected} note={workspace.notes.find(note => note.id === selected.noteId)} user={user} onSave={saveItem} onClose={() => setSelectedId(null)} onSource={id => { setSelectedId(null); setNoteDetailId(id) }} />}</Modal>
    <Modal title={noteDetail?.title || "Original note"} open={Boolean(noteDetail)} onClose={() => setNoteDetailId(null)}>{noteDetail && <div className={n.noteDetail}><p className={n.noteDate}>{new Date(noteDetail.createdAt).toLocaleString()} · {noteDetail.timeZone}</p><p className={n.originalText}>{noteDetail.text || "Photo note"}</p>{noteDetail.photos?.length > 0 && <NotePhotoGallery photos={noteDetail.photos} noteId={noteDetail.id} user={user} />}<h3>Linked items</h3>{noteDetail.items.length ? <ul className={n.linkedItems}>{noteDetail.items.map(item => <li key={item.id}><button type="button" onClick={() => { setNoteDetailId(null); setSelectedId(item.id) }}><ItemTag item={item} /><span>{item.title}</span><ArrowForwardRoundedIcon fontSize="small" /></button></li>)}</ul> : <p>No linked items. Organize the note when you’re ready.</p>}{noteDetail.questions.length > 0 && <div className={n.questions}><strong>To clarify</strong><ul>{noteDetail.questions.map((question, index) => <li key={index}>{question}</li>)}</ul></div>}<div className={s.formActions}><button type="button" className={s.danger} onClick={() => { setDeleteId(noteDetail.id); setNoteDetailId(null) }}>Delete note</button><button type="button" className={s.primary} onClick={() => editNote(noteDetail)}><EditOutlinedIcon fontSize="small" />Edit & organize</button></div></div>}</Modal>
    <Modal title="Delete this note and its linked items?" open={Boolean(deleteId)} onClose={() => setDeleteId(null)}><p>The note and the items it created will be removed from this workspace.</p><div className={s.formActions}><button className={s.button} onClick={() => setDeleteId(null)}>Keep note</button><button className={s.danger} onClick={confirmDelete}>Delete note</button></div></Modal>
  </Workspace>
}
