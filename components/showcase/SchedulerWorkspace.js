import React, { useEffect, useMemo, useRef, useState } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import { addDays, addMonths, format, parseISO, startOfMonth } from "date-fns"
import AddRoundedIcon from "@mui/icons-material/AddRounded"
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded"
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded"
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded"
import ViewAgendaRoundedIcon from "@mui/icons-material/ViewAgendaRounded"
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded"
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material"
import { Workspace, Tool, Search, Select, Views, Empty, Modal, s } from "./Workspace"
import useLocalDemo from "./useLocalDemo"
import { makeCalendarEvents, eventIsValid, overlaps, calendarText, downloadFile } from "../../lib/componentDemos"
import { PHOTO_ACCEPT, MAX_PHOTOS, MAX_CAPTION_LENGTH, demoPhotosAreValid, serializeDemoEvents, validatePhotoFiles, makeDemoPhoto } from "../../lib/schedulerPhotos.mjs"
import SchedulerPhotoIndicator from "../scheduler/SchedulerPhotoIndicator"
import photos from "../../styles/scheduler-photos.module.css"

const kinds = ["Meeting", "Review", "Milestone"]
const colors = { Meeting: "#a897cf", Review: "#91bfca", Milestone: "#cbb77c" }
const storageKey = "bergquist-scheduler-demo-v1"
export default function SchedulerWorkspace() {
  const calendar = useRef(null)
  const [events, setEvents, storage] = useLocalDemo(storageKey, makeCalendarEvents, list => Array.isArray(list) && list.length <= 500 && list.every(event => eventIsValid(event) && demoPhotosAreValid(event.images)) && new Set(list.map(event => event.id)).size === list.length)
  const [view, setView] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches ? "agenda" : "month"), [search, setSearch] = useState(""), [kind, setKind] = useState("All")
  const [month, setMonth] = useState(() => startOfMonth(new Date())), [draft, setDraft] = useState(null), [error, setError] = useState(""), [notice, setNotice] = useState("")
  const [deleted, setDeleted] = useState(null)
  const [processing, setProcessing] = useState(false), [preview, setPreview] = useState(null)
  const fileInput = useRef(null), draftSession = useRef(0)
  useEffect(() => () => { draftSession.current += 1 }, [])
  const filtered = useMemo(() => events.filter(event => (kind === "All" || event.category === kind) && `${event.title} ${event.notes}`.toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => Date.parse(a.start) - Date.parse(b.start)), [events, kind, search])
  const agenda = filtered.filter(event => parseISO(event.start) < addMonths(month, 1) && parseISO(event.end) > month)
  const update = (field, value) => setDraft(current => ({ ...current, [field]: value }))
  function closeDraft() { draftSession.current += 1; setDraft(null); setPreview(null); setProcessing(false) }
  async function addPhotos(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ""
    if (!files.length || processing) return
    const session = draftSession.current
    setProcessing(true); setError("")
    try {
      await validatePhotoFiles(files, (draft.images || []).length)
      const images = []
      for (const file of files) images.push(await makeDemoPhoto(file))
      if (session === draftSession.current) setDraft(current => ({ ...current, images: [...(current.images || []), ...images] }))
    } catch (err) {
      if (session === draftSession.current) setError(err?.message || "Could not read this photo. Choose a different image.")
    } finally {
      if (session === draftSession.current) setProcessing(false)
    }
  }
  function create(date = new Date()) {
    draftSession.current += 1; setProcessing(false)
    const start = format(date, "yyyy-MM-dd")
    setDraft({ id: "", title: "", category: "Meeting", notes: "", images: [], allDay: false, start: `${start}T09:00`, end: `${start}T10:00` }); setError("")
  }
  function save(event) {
    event.preventDefault()
    if (processing) return
    if (!Number.isFinite(Date.parse(draft.start)) || !Number.isFinite(Date.parse(draft.end))) { setError("Choose valid start and end dates."); return }
    const next = { ...draft, id: draft.id || `event-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: draft.title.trim() }
    if (next.allDay) {
      next.start = `${draft.start.slice(0, 10)}T00:00`
      next.end = format(addDays(parseISO(`${draft.end.slice(0, 10)}T00:00`), 1), "yyyy-MM-dd'T'HH:mm")
    }
    if (!eventIsValid(next)) { setError("Add a title and an end date after the start."); return }
    if (!draft.id && events.length >= 500) { setError("This demo supports up to 500 events."); return }
    const nextEvents = [...events.filter(item => item.id !== next.id), next]
    try {
      const serialized = serializeDemoEvents(nextEvents)
      if (!storage.storageError) localStorage.setItem(storageKey, serialized)
    } catch (err) { setError(err?.name === "QuotaExceededError" ? "Browser storage is full. Remove some photos before saving." : err?.message || "Could not save this event in your browser."); return }
    setEvents(nextEvents); setNotice(draft.id ? "Event updated." : "Event added."); closeDraft()
    const destination = startOfMonth(parseISO(next.start)); setMonth(destination); calendar.current?.getApi().gotoDate(destination)
  }
  function edit(item) {
    draftSession.current += 1; setProcessing(false)
    setDraft({ ...item, end: item.allDay ? format(addDays(parseISO(item.end), -1), "yyyy-MM-dd'T'HH:mm") : item.end }); setError("")
  }
  function remove() { setDeleted(events.find(event => event.id === draft.id)); setEvents(current => current.filter(event => event.id !== draft.id)); closeDraft(); setNotice("Event deleted.") }
  function navigate(direction) {
    const next = new Date(month.getFullYear(), month.getMonth() + direction, 1)
    setMonth(next); calendar.current?.getApi().gotoDate(next)
  }
  const conflictCandidate = draft?.allDay && Number.isFinite(Date.parse(draft.end)) ? { ...draft, start: `${draft.start.slice(0, 10)}T00:00`, end: addDays(parseISO(`${draft.end.slice(0, 10)}T00:00`), 1).toISOString() } : draft
  const conflict = conflictCandidate && events.find(event => overlaps(conflictCandidate, event))
  return <Workspace title="Your schedule" status={storage.storageError ? "Sample calendar · Session only" : "Sample calendar · Saved in this browser"} actions={<>
    <Tool label="Export calendar" disabled={!events.length} onClick={() => downloadFile("schedule.ics", calendarText(events), "text/calendar;charset=utf-8")}><FileDownloadRoundedIcon /></Tool>
    <button className={s.primary} onClick={() => create()} disabled={!storage.ready}><AddRoundedIcon fontSize="small" />New event</button>
  </>}>
    {storage.storageError && <p className={s.notice} role="status">{storage.storageError}</p>}
    {notice && <div className={s.notice} role="status">{notice} {deleted && <button className={s.button} onClick={() => { setEvents(current => [...current, deleted]); setDeleted(null); setNotice("Event restored.") }}>Undo delete</button>}</div>}
    <div className={s.toolbar}><div className={s.row}><Tool label="Previous month" onClick={() => navigate(-1)}><ChevronLeftRoundedIcon /></Tool><h3>{format(month, "MMMM yyyy")}</h3><Tool label="Next month" onClick={() => navigate(1)}><ChevronRightRoundedIcon /></Tool><button className={s.button} onClick={() => { const today = startOfMonth(new Date()); setMonth(today); calendar.current?.getApi().gotoDate(today) }}>Today</button></div>
      <Views value={view} onChange={setView} options={[{ value: "month", label: "Month", icon: CalendarMonthRoundedIcon }, { value: "agenda", label: "Agenda", icon: ViewAgendaRoundedIcon }]} />
      <Search label="Search events" value={search} onChange={setSearch} /><Select label="Type" value={kind} onChange={setKind} options={["All", ...kinds]} />
    </div>
    {view === "month" ? <div className={s.calendar}><FullCalendar key="calendar" ref={calendar} plugins={[dayGridPlugin]} initialView="dayGridMonth" initialDate={month} headerToolbar={false} height="auto" fixedWeekCount={false} dayMaxEvents={2}
      events={filtered.map(event => ({ ...event, backgroundColor: "#292331", borderColor: colors[event.category] || colors.Meeting, textColor: "#e7ddf5" }))}
      eventContent={({ event, timeText }) => <span className={photos.event}><SchedulerPhotoIndicator count={event.extendedProps.images?.length} />{timeText && <span className={photos.time}>{timeText}</span>}<span className={photos.eventTitle}>{event.title}</span></span>}
      eventInteractive eventDidMount={({ el, event }) => { el.title = event.title; el.setAttribute("aria-label", `Edit ${event.title}${event.extendedProps.images?.length ? `, ${event.extendedProps.images.length} photos` : ""}`) }}
      eventClick={({ event }) => edit(events.find(item => item.id === event.id))}
      dayCellContent={({ date, dayNumberText }) => <button className={s.dayButton} aria-label={`Add event on ${format(date, "MMMM d, yyyy")}`} onClick={() => create(date)}>{dayNumberText}</button>}
    /></div> : agenda.length ? <div>{agenda.map(event => <button key={event.id} className={s.agendaButton} onClick={() => edit(event)}><span><SchedulerPhotoIndicator count={event.images?.length} />{event.title}<small>{format(parseISO(event.start), "EEE, MMM d")} · {event.allDay ? "All day" : `${format(parseISO(event.start), "h:mm a")} - ${format(parseISO(event.end), "h:mm a")}`}</small></span><span className={s.badge}>{event.category}</span></button>)}</div> : <Empty title="No events this month" onReset={search || kind !== "All" ? () => { setSearch(""); setKind("All") } : undefined} />}
    <Modal title={draft?.id ? "Edit event" : "New event"} open={Boolean(draft)} onClose={closeDraft}>{draft && <form onSubmit={save}>
      <label className={s.field}>Event title<input autoFocus required maxLength={100} value={draft.title} onChange={event => update("title", event.target.value)} /></label>
      <label className={s.field}>Type<select value={draft.category} onChange={event => update("category", event.target.value)}>{kinds.map(value => <option key={value}>{value}</option>)}</select></label>
      <label className={s.check}><input type="checkbox" checked={draft.allDay} onChange={event => update("allDay", event.target.checked)} />All day</label>
      <div className={s.formGrid}>{["start", "end"].map(field => <label className={s.field} key={field}>{field === "start" ? "Starts" : "Ends"}<input type={draft.allDay ? "date" : "datetime-local"} required value={draft.allDay ? draft[field].slice(0, 10) : draft[field]} onChange={event => update(field, draft.allDay ? `${event.target.value}T09:00` : event.target.value)} /></label>)}</div>
      <label className={s.field}>Notes<textarea maxLength={2000} value={draft.notes} onChange={event => update("notes", event.target.value)} /></label>
      <div className={s.row}><h3>Photos</h3><button type="button" className={s.button} disabled={processing || (draft.images || []).length >= MAX_PHOTOS} onClick={() => fileInput.current?.click()}><AddPhotoAlternateRoundedIcon fontSize="small" />Add photos</button></div>
      <input ref={fileInput} type="file" accept={PHOTO_ACCEPT} multiple hidden aria-label="Event photos" onChange={addPhotos} />
      {processing && <p role="status">Preparing photos...</p>}
      <div className={photos.grid}>{(draft.images || []).map((image, index) => <figure className={photos.photo} key={image.id}>
        <button type="button" className={photos.preview} aria-label={`Preview photo ${index + 1}`} onClick={() => setPreview(image)}><img src={image.url} alt={image.message || image.fileName || `Event photo ${index + 1}`} /></button>
        <figcaption><div className={photos.caption}><span title={image.fileName}>{image.fileName}</span><Tool label={`Remove photo ${index + 1}`} onClick={() => update("images", draft.images.filter(item => item.id !== image.id))}><DeleteOutlineRoundedIcon fontSize="small" /></Tool></div>
          <label className={s.field}>Caption {index + 1}<textarea aria-label={`Caption ${index + 1}`} maxLength={MAX_CAPTION_LENGTH} value={image.message} onChange={event => update("images", draft.images.map(item => item.id === image.id ? { ...item, message: event.target.value } : item))} /></label>
        </figcaption>
      </figure>)}</div>
      {conflict && <p className={s.notice}>Overlaps with {conflict.title}.</p>}{error && <p role="alert" className={s.error}>{error}</p>}
      <div className={s.formActions}>{draft.id && <button type="button" className={s.danger} onClick={remove}>Delete event</button>}<button type="button" className={s.button} onClick={closeDraft}>Cancel</button><button type="submit" className={s.primary} disabled={processing}>Save event</button></div>
    </form>}</Modal>
    <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} fullWidth maxWidth="md" aria-labelledby="scheduler-photo-title">
      <DialogTitle id="scheduler-photo-heading" sx={{ pr: 7 }}><span id="scheduler-photo-title">Event photo</span><IconButton aria-label="Close photo preview" onClick={() => setPreview(null)} sx={{ position: "absolute", right: 10, top: 10 }}><CloseRoundedIcon /></IconButton></DialogTitle>
      <DialogContent>{preview && <><img className={photos.fullImage} src={preview.url} alt={preview.message || preview.fileName || "Event photo"} />{preview.message && <p className={photos.message}>{preview.message}</p>}</>}</DialogContent>
    </Dialog>
  </Workspace>
}
