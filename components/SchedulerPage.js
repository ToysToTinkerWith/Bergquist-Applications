// pages/scheduler.jsx
// Scheduler page (Pages Router) — matches your black + gradient Bemora theme
// Large calendar with click-to-schedule popup + Firestore persistence
//
// Requires:
//  - @mui/material
//  - @mui/x-date-pickers
//  - date-fns
//  - @fullcalendar/react
//  - @fullcalendar/daygrid   ✅ includes dayGridMonth/dayGridWeek/dayGridDay
//  - @fullcalendar/interaction
//
// Firebase:
//  - db export from ../Firebase/FirebaseInit
//
// Event schema in Firestore (collection: "scheduleEvents"):
//  {
//    title: string,
//    notes: string,
//    start: Timestamp,
//    end: Timestamp,
//    allDay: boolean,
//    createdAt: serverTimestamp(),
//    updatedAt: serverTimestamp(),
//  }

import React, { useEffect, useMemo, useRef, useState } from "react"
import Head from "next/head"
import {
  Box,
  Typography,
  Divider,
  Stack,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControlLabel,
  Switch,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import { motion } from "framer-motion"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"

// MUI pickers
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"

// Firestore
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore"
import { db } from "../Firebase/FirebaseInit"

// -------------------------- UI helpers --------------------------

function RevealOnScroll({
  children,
  delay = 0,
  threshold = 0.25,
  rootMargin = "0px 0px -12% 0px",
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (shown) return
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setShown(true)
      return
    }

    const el = ref.current
    if (!el) {
      setShown(true)
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setShown(true)
          obs.disconnect()
        }
      },
      { threshold, root: null, rootMargin }
    )

    obs.observe(el)
    return () => {
      try {
        obs.disconnect()
      } catch {}
    }
  }, [shown, threshold, rootMargin])

  return (
    <Box
      ref={ref}
      component={motion.div}
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
      transition={{ duration: 0.85, ease: "easeOut", delay }}
      sx={{ willChange: "transform, opacity" }}
    >
      {children}
    </Box>
  )
}

function GradientTitle({ children, variant = "h3", align = "left", sx = {} }) {
  return (
    <Typography
      variant={variant}
      align={align}
      sx={{
        fontFamily: "Bemora",
        letterSpacing: 1.1,
        lineHeight: 1.2,
        backgroundImage: "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        textShadow: "0 10px 35px rgba(0,0,0,0.55)",
        ...sx,
      }}
    >
      {children}
    </Typography>
  )
}

function SubText({ children, sx = {} }) {
  return (
    <Typography
      variant="body1"
      sx={{
        color: "rgba(216, 229, 254, 0.84)",
        lineHeight: 1.75,
        ...sx,
      }}
    >
      {children}
    </Typography>
  )
}

// Basic helper: set time to 9:00 AM local by default
function atDefaultTime(d, hours = 9, minutes = 0) {
  const x = new Date(d)
  x.setHours(hours, minutes, 0, 0)
  return x
}

// Format "9:00 AM" etc
function formatTime(d) {
  try {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(d)
  } catch {
    return ""
  }
}

// Overlap test: [aStart, aEnd) overlaps [bStart, bEnd) if aStart < bEnd && bStart < aEnd
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const aS = new Date(aStart).getTime()
  const aE = new Date(aEnd).getTime()
  const bS = new Date(bStart).getTime()
  const bE = new Date(bEnd).getTime()
  if (!Number.isFinite(aS) || !Number.isFinite(aE) || !Number.isFinite(bS) || !Number.isFinite(bE))
    return false
  return aS < bE && bS < aE
}

// -------------------------- Page --------------------------

export default function SchedulerPage() {
  // ---- SEO ----
  const SITE_NAME = "Bergquist Applications"
  const SITE_URL = "https://bergquistapplications.com"
  const PAGE_PATH = "/scheduler"
  const PAGE_URL = `${SITE_URL}${PAGE_PATH}`

  const TITLE = `Scheduler | ${SITE_NAME}`
  const DESCRIPTION = "Schedule events and view them on a calendar."

  const OG_IMAGE = `${SITE_URL}/og/bergquist-applications.jpg`
  const LAST_UPDATED = "February 22, 2026"

  const jsonLdWebPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    url: PAGE_URL,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    dateModified: "2026-02-22",
  }

  // ---- Firestore events ----
  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [eventsErr, setEventsErr] = useState("")

  useEffect(() => {
    const q = query(collection(db, "scheduleEvents"), orderBy("start", "asc"))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const out = []
        snap.forEach((d) => {
          const data = d.data() || {}
          const start = data.start?.toDate ? data.start.toDate() : null
          const end = data.end?.toDate ? data.end.toDate() : null
          if (!start || !end) return

          out.push({
            id: d.id,
            title: String(data.title || "Scheduled Event"),
            start,
            end,
            allDay: !!data.allDay,
            extendedProps: {
              notes: String(data.notes || ""),
            },
          })
        })
        setEvents(out)
        setLoadingEvents(false)
        setEventsErr("")
      },
      (err) => {
        setLoadingEvents(false)
        setEventsErr(err?.message || "Failed to load events.")
      }
    )

    return () => unsub()
  }, [])

  // ---- Create/Edit modal state ----
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState("create") // "create" | "edit"
  const [activeId, setActiveId] = useState(null)

  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [allDay, setAllDay] = useState(false)

  const [startDt, setStartDt] = useState(null)
  const [endDt, setEndDt] = useState(null)

  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState("")

  function resetModal() {
    setMode("create")
    setActiveId(null)
    setTitle("")
    setNotes("")
    setAllDay(false)
    setStartDt(null)
    setEndDt(null)
    setSaving(false)
    setSaveErr("")
  }

  function openForCreate(date) {
    const base = date instanceof Date ? date : new Date()
    const s = atDefaultTime(base, 9, 0)
    const e = atDefaultTime(base, 10, 0)
    setMode("create")
    setActiveId(null)
    setTitle("")
    setNotes("")
    setAllDay(false)
    setStartDt(s)
    setEndDt(e)
    setSaveErr("")
    setOpen(true)
  }

  function openForEdit(eventInfo) {
    const ev = eventInfo?.event
    if (!ev) return
    setMode("edit")
    setActiveId(ev.id)
    setTitle(ev.title || "")
    setNotes(ev.extendedProps?.notes || "")
    setAllDay(!!ev.allDay)
    setStartDt(ev.start ? new Date(ev.start) : null)
    setEndDt(ev.end ? new Date(ev.end) : (ev.start ? new Date(ev.start) : null))
    setSaveErr("")
    setOpen(true)
  }

  function closeModal() {
    setOpen(false)
    setTimeout(() => resetModal(), 120)
  }

  const canSubmit = useMemo(() => {
    if (!startDt || !endDt) return false
    const s = new Date(startDt).getTime()
    const e = new Date(endDt).getTime()
    if (!Number.isFinite(s) || !Number.isFinite(e)) return false
    return e > s
  }, [startDt, endDt])

  // ---- conflict detection ----
  const conflictMessage = useMemo(() => {
    if (!startDt || !endDt) return ""
    for (const ev of events) {
      if (mode === "edit" && activeId && ev.id === activeId) continue
      if (!ev?.start || !ev?.end) continue

      if (rangesOverlap(startDt, endDt, ev.start, ev.end)) {
        const label = ev.title ? `“${ev.title}”` : "an existing event"
        const a = `${formatTime(new Date(ev.start))}–${formatTime(new Date(ev.end))}`
        return `That time conflicts with ${label} (${a}). Choose a different time.`
      }
    }
    return ""
  }, [startDt, endDt, events, mode, activeId])

  async function handleSubmit() {
    setSaveErr("")

    if (!canSubmit) {
      setSaveErr("Please choose a valid start and end time (end must be after start).")
      return
    }

    if (conflictMessage) {
      setSaveErr(conflictMessage)
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: String(title || "Scheduled Event"),
        notes: String(notes || ""),
        allDay: !!allDay,
        start: Timestamp.fromDate(new Date(startDt)),
        end: Timestamp.fromDate(new Date(endDt)),
        updatedAt: serverTimestamp(),
      }

      if (mode === "create") {
        await addDoc(collection(db, "scheduleEvents"), {
          ...payload,
          createdAt: serverTimestamp(),
        })
      } else if (mode === "edit" && activeId) {
        await updateDoc(doc(db, "scheduleEvents", activeId), payload)
      }

      setSaving(false)
      closeModal()
    } catch (e) {
      setSaving(false)
      setSaveErr(e?.message || "Failed to save event.")
    }
  }

  async function handleDelete() {
    if (!activeId) return
    setSaveErr("")
    setSaving(true)
    try {
      await deleteDoc(doc(db, "scheduleEvents", activeId))
      setSaving(false)
      closeModal()
    } catch (e) {
      setSaving(false)
      setSaveErr(e?.message || "Failed to delete event.")
    }
  }

  // ✅ Keep "+X more" popover open unless the user clicks its own close button,
  // AND do not break focusing/typing inside the MUI edit dialog.
  useEffect(() => {
    function isMorePopoverOpen() {
      return !!document.querySelector(".fc-more-popover")
    }

    function onDocMouseDownCapture(e) {
      if (!isMorePopoverOpen()) return

      const t = e.target
      if (!(t instanceof Element)) return

      // Inside the popover: always allow
      if (t.closest(".fc-more-popover")) return

      // Allow the popover close button
      if (t.closest(".fc-popover-close")) return

      // ✅ If user clicks inside the MUI Dialog (portal), we MUST NOT preventDefault
      // (preventDefault blocks focus, which blocks typing).
      // But we still stop propagation so FullCalendar can't auto-close the popover.
      if (
        t.closest(".MuiDialog-root") ||
        t.closest(".MuiDialog-container") ||
        t.closest('[role="dialog"]') ||
        t.closest(".MuiPickersPopper-root") ||
        t.closest(".MuiPopover-root") ||
        t.closest(".MuiModal-root")
      ) {
        e.stopPropagation()
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation()
        return
      }

      // ✅ Allow normal calendar interactions while popover is open
      if (
        t.closest(".fc-event") ||
        t.closest(".fc-daygrid-day") ||
        t.closest(".fc-more-link") ||
        t.closest(".fc-button") ||
        t.closest(".fc-toolbar") ||
        t.closest(".fc-scrollgrid") ||
        t.closest(".fc")
      ) {
        return
      }

      // Otherwise: blank outside click -> block (prevents auto-close)
      e.preventDefault()
      e.stopPropagation()
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation()
    }

    function onDocKeyDownCapture(e) {
      if (!isMorePopoverOpen()) return
      if (e.key !== "Escape") return

      // Prevent Escape from closing the popover
      e.preventDefault()
      e.stopPropagation()
      if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation()
    }

    document.addEventListener("mousedown", onDocMouseDownCapture, true)
    document.addEventListener("keydown", onDocKeyDownCapture, true)

    return () => {
      document.removeEventListener("mousedown", onDocMouseDownCapture, true)
      document.removeEventListener("keydown", onDocKeyDownCapture, true)
    }
  }, [])

  // ---- Styles for FullCalendar (theme-match) ----
  const calendarCss = useMemo(
    () => `
      .fc {
        color: rgba(216, 229, 254, 0.92);
        --fc-border-color: rgba(216, 229, 254, 0.14);
        --fc-page-bg-color: transparent;
        --fc-neutral-bg-color: rgba(255,255,255,0.03);
        --fc-today-bg-color: rgba(124,58,237,0.14);
      }

      /* ✅ Prevent clipping: allow popovers to escape the calendar bounds */
      .fc, .fc-view-harness, .fc-scroller {
        overflow: visible !important;
      }

      /* ✅ Ensure the popover paints above everything */
      .fc .fc-popover {
        z-index: 9999 !important;
      }

      .fc .fc-toolbar-title {
        font-family: Bemora, serif;
        letter-spacing: 1.2px;
        background-image: linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        text-shadow: 0 10px 35px rgba(0,0,0,0.55);
        font-size: 1.35rem;
      }

      .fc .fc-button {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(216, 229, 254, 0.14);
        color: rgba(216, 229, 254, 0.92);
        box-shadow: 0 14px 45px rgba(0,0,0,0.45);
        border-radius: 10px;
        padding: 0.55rem 0.85rem;
        text-transform: none;
        font-weight: 600;
      }
      .fc .fc-button:hover { background: rgba(255,255,255,0.09); }
      .fc .fc-button:disabled { opacity: 0.55; }
      .fc .fc-button-primary:not(:disabled).fc-button-active {
        background: linear-gradient(90deg, rgba(124,58,237,0.35), rgba(34,211,238,0.22));
        border-color: rgba(216, 229, 254, 0.18);
      }

      .fc .fc-col-header-cell-cushion {
        color: rgba(216, 229, 254, 0.78);
        font-weight: 700;
        text-decoration: none;
      }
      .fc .fc-daygrid-day-number {
        color: rgba(216, 229, 254, 0.78);
        text-decoration: none;
      }

      /* Calendar events keep their purply style */
      .fc .fc-daygrid-event {
        border-radius: 10px;
        padding: 2px 8px;
        border: 1px solid rgba(216, 229, 254, 0.18);
        background: linear-gradient(90deg, rgba(124,58,237,0.34), rgba(34,211,238,0.18));
        box-shadow: 0 18px 55px rgba(0,0,0,0.45);
        font-weight: 800;
      }

      /* "+X more" link */
      .fc .fc-more-link {
        color: rgba(216, 229, 254, 0.92);
        font-weight: 800;
        text-decoration: none;
      }
      .fc .fc-more-link:hover {
        text-decoration: underline;
        opacity: 0.95;
      }

      /* ✅ Solid background ONLY for the "+X more" popover */
      .fc .fc-more-popover {
        background-color: #070813 !important;
        border: 1px solid rgba(216, 229, 254, 0.16) !important;
        box-shadow: 0 25px 80px rgba(0,0,0,0.85) !important;
        border-radius: 14px !important;
        overflow: hidden;
      }

      .fc .fc-more-popover .fc-popover-header {
        background-color: #05060A !important;
        border-bottom: 1px solid rgba(216, 229, 254, 0.12) !important;
        color: rgba(216, 229, 254, 0.92) !important;
        padding: 10px 12px;
      }

      .fc .fc-more-popover .fc-popover-title {
        font-family: Bemora, serif;
        letter-spacing: 1px;
        font-weight: 800;
      }

      .fc .fc-more-popover .fc-popover-close {
        color: rgba(216, 229, 254, 0.92) !important;
        opacity: 0.9;
      }

      .fc .fc-more-popover .fc-popover-body {
        background-color: #070813 !important;
        padding: 10px 10px 12px;
      }

      @media (min-width: 900px) {
        .fc .fc-daygrid-day-frame { min-height: 125px; }
      }
    `,
    []
  )

  // ✅ Very high-specificity styling so the DateTimePicker value never renders black
  const pickerTextFieldSx = useMemo(
    () => ({
      "& .MuiInputBase-root": {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 2,
      },

      // Force the actual input value color
      "&& input": {
        color: "rgba(255,255,255,0.95) !important",
        WebkitTextFillColor: "rgba(255,255,255,0.95) !important",
      },
      "&& .MuiInputBase-input": {
        color: "rgba(255,255,255,0.95) !important",
        WebkitTextFillColor: "rgba(255,255,255,0.95) !important",
      },

      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(216, 229, 254, 0.22)",
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(216, 229, 254, 0.32)",
      },

      "& .MuiInputLabel-root": {
        color: "rgba(245, 248, 255, 0.82)",
      },
      "& .MuiInputLabel-root.Mui-focused": {
        color: "rgba(245, 248, 255, 0.92)",
      },

      "& .MuiSvgIcon-root": {
        color: "rgba(245, 248, 255, 0.90)",
      },
    }),
    []
  )

  // ✅ Ensure event name shows by using FullCalendar's recommended eventInfo fields
  function renderEventContent(eventInfo) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "baseline", minWidth: 0 }}>
        {eventInfo.timeText ? (
          <span style={{ fontWeight: 900, opacity: 0.95, whiteSpace: "nowrap" }}>
            {eventInfo.timeText}
          </span>
        ) : null}
        <span style={{ fontWeight: 800, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
          {eventInfo.event.title}
        </span>
      </div>
    )
  }

  return (
    <Box sx={{ width: "100%", backgroundColor: "black", minHeight: "100vh" }}>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={PAGE_URL} />
        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <meta name="theme-color" content="#000000" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebPage) }}
        />
        <style>{calendarCss}</style>
      </Head>

      {/* Hero */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 10, sm: 12, md: 14 },
          pb: { xs: 6, sm: 7, md: 8 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1200 }}>
          <RevealOnScroll>
            
            <Typography
              variant="body2"
              align="center"
              sx={{ mt: 1.5, color: "rgba(216, 229, 254, 0.68)" }}
            >
              Last updated: {LAST_UPDATED}
            </Typography>
          </RevealOnScroll>
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          px: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 10, sm: 12, md: 14 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1200 }}>
          <Stack spacing={{ xs: 2.5, sm: 3 }}>
            <RevealOnScroll>
              <Box
                sx={{
                  position: "relative",
                  borderRadius: 3,
                  overflow: "visible",
                  background:
                    "linear-gradient(180deg, rgba(124,58,237,0.08) 0%, rgba(34,211,238,0.03) 100%)",
                  border: "1px solid rgba(216, 229, 254, 0.12)",
                  boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
                  p: { xs: 2.0, sm: 2.5, md: 3 },
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.25}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  sx={{ mb: 1.75 }}
                >
                  <Box>
                    <GradientTitle
                      variant="h5"
                      align="left"
                      sx={{ mb: 0.6, letterSpacing: 0.8, textShadow: "none" }}
                    >
                      Calendar
                    </GradientTitle>
                    <SubText sx={{ fontSize: 15, color: "rgba(216, 229, 254, 0.72)" }}>
                      {loadingEvents
                        ? "Loading events…"
                        : eventsErr
                        ? `Error: ${eventsErr}`
                        : `Showing ${events.length} event${events.length === 1 ? "" : "s"}.`}
                    </SubText>
                  </Box>

                  <Button
                    onClick={() => openForCreate(new Date())}
                    variant="contained"
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 800,
                      px: 2,
                      py: 1.1,
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0.85), rgba(34,211,238,0.65))",
                      boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
                      "&:hover": {
                        background:
                          "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(34,211,238,0.72))",
                      },
                    }}
                  >
                    New Event
                  </Button>
                </Stack>

                <Box
                  sx={{
                    position: "relative",
                    borderRadius: 3,
                    border: "1px solid rgba(216, 229, 254, 0.12)",
                    overflow: "visible",
                    background: "rgba(0,0,0,0.35)",
                    px: { xs: 0.75, sm: 1.25 },
                    py: { xs: 1.0, sm: 1.25 },
                  }}
                >
                  <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    height="auto"
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      // ✅ Add week/day view switches (dayGridPlugin already supports these)
                      right: "dayGridMonth,dayGridWeek,dayGridDay",
                    }}
                    events={events}
                    dateClick={(info) => openForCreate(info.date)}
                    eventClick={(info) => openForEdit(info)}
                    dayMaxEvents={3}
                    fixedWeekCount={false}
                    nowIndicator
                    selectable={false}
                    displayEventTime={true}
                    eventTimeFormat={{
                      hour: "numeric",
                      minute: "2-digit",
                      meridiem: "short",
                    }}
                    eventContent={renderEventContent}
                  />
                </Box>

                <SubText sx={{ mt: 1.5, fontSize: 14, color: "rgba(216, 229, 254, 0.68)" }}>
                  Tip: click any day to prefill an event for that date. Click an existing event to edit.
                </SubText>
              </Box>
            </RevealOnScroll>
          </Stack>
        </Box>
      </Box>

      {/* Create/Edit Dialog */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog
          open={open}
          onClose={closeModal}
          fullWidth
          maxWidth="sm"
          sx={{
            "&& input": {
              color: "rgba(255,255,255,0.95) !important",
              WebkitTextFillColor: "rgba(255,255,255,0.95) !important",
            },
            "&& .MuiInputBase-input": {
              color: "rgba(255,255,255,0.95) !important",
              WebkitTextFillColor: "rgba(255,255,255,0.95) !important",
            },
            "& .MuiPickersPopper-paper": {
              background: "linear-gradient(180deg, #070813 0%, #0A0B12 100%)",
              border: "1px solid rgba(216, 229, 254, 0.14)",
              color: "rgba(245, 248, 255, 0.92)",
            },
          }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              overflow: "hidden",
              background: "linear-gradient(180deg, #05060A 0%, #070813 100%)",
              border: "1px solid rgba(216, 229, 254, 0.14)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.85)",
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pr: 1,
              py: 2,
              borderBottom: "1px solid rgba(216, 229, 254, 0.10)",
            }}
          >
            <Box>
              <GradientTitle variant="h6" sx={{ textShadow: "none", letterSpacing: 0.9 }}>
                {mode === "edit" ? "Edit Event" : "Schedule Event"}
              </GradientTitle>
              <Typography sx={{ mt: 0.5, color: "rgba(216, 229, 254, 0.70)", fontSize: 13.5 }}>
                Set a start time, end time, and optional details.
              </Typography>
            </Box>

            <IconButton onClick={closeModal} sx={{ color: "rgba(216, 229, 254, 0.90)" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 2.5 }}>
            <Stack spacing={2.0}>
              <br />
              <TextField
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                label="Title"
                placeholder="e.g. Client call, Delivery, Booking…"
                fullWidth
                InputLabelProps={{ sx: { color: "rgba(245, 248, 255, 0.82)" } }}
                sx={{
                  "& .MuiInputBase-root": {
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderRadius: 2,
                  },
                  "&& input": {
                    color: "rgba(255,255,255,0.95) !important",
                    WebkitTextFillColor: "rgba(255,255,255,0.95) !important",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(216, 229, 254, 0.20)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(216, 229, 254, 0.30)",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "rgba(245, 248, 255, 0.92)",
                  },
                }}
              />

              <FormControlLabel
                control={<Switch checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />}
                label={<Typography sx={{ color: "rgba(245, 248, 255, 0.82)" }}>All-day event</Typography>}
              />

              <DateTimePicker
                label="Start"
                value={startDt}
                onChange={(v) => setStartDt(v)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: pickerTextFieldSx,
                  },
                }}
              />

              <DateTimePicker
                label="End"
                value={endDt}
                onChange={(v) => setEndDt(v)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: pickerTextFieldSx,
                  },
                }}
              />

              <TextField
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                label="Notes (optional)"
                placeholder="Extra details…"
                fullWidth
                multiline
                minRows={3}
                InputLabelProps={{ sx: { color: "rgba(245, 248, 255, 0.82)" } }}
                sx={{
                  "& .MuiInputBase-root": {
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderRadius: 2,
                  },
                  "&& textarea": {
                    color: "rgba(255,255,255,0.95) !important",
                    WebkitTextFillColor: "rgba(255,255,255,0.95) !important",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(216, 229, 254, 0.20)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(216, 229, 254, 0.30)",
                  },
                }}
              />

              {conflictMessage ? (
                <Typography sx={{ color: "rgba(255, 170, 70, 0.95)", fontSize: 13.5 }}>
                  {conflictMessage}
                </Typography>
              ) : null}

              {saveErr ? (
                <Typography sx={{ color: "rgba(255, 120, 120, 0.95)", fontSize: 13.5 }}>
                  {saveErr}
                </Typography>
              ) : null}
            </Stack>
          </DialogContent>

          <DialogActions
            sx={{
              px: 2.5,
              py: 2,
              borderTop: "1px solid rgba(216, 229, 254, 0.10)",
              display: "flex",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", gap: 1 }}>
              {mode === "edit" && activeId ? (
                <Button
                  onClick={handleDelete}
                  disabled={saving}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 900,
                    color: "rgba(255, 170, 170, 0.95)",
                    border: "1px solid rgba(255, 140, 140, 0.22)",
                    backgroundColor: "rgba(255, 80, 80, 0.08)",
                    "&:hover": {
                      backgroundColor: "rgba(255, 80, 80, 0.14)",
                      borderColor: "rgba(255, 140, 140, 0.34)",
                    },
                  }}
                >
                  {saving ? "Working…" : "Delete Event"}
                </Button>
              ) : null}
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                onClick={closeModal}
                disabled={saving}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  color: "rgba(245, 248, 255, 0.88)",
                }}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={saving || !canSubmit || !!conflictMessage}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  px: 2,
                  background:
                    "linear-gradient(90deg, rgba(124,58,237,0.85), rgba(34,211,238,0.65))",
                  boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
                  "&:hover": {
                    background:
                      "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(34,211,238,0.72))",
                  },
                  "&.Mui-disabled": {
                    opacity: 0.55,
                  },
                }}
              >
                {saving ? "Saving…" : mode === "edit" ? "Update" : "Submit"}
              </Button>
            </Box>
          </DialogActions>
        </Dialog>
      </LocalizationProvider>
    </Box>
  )
}