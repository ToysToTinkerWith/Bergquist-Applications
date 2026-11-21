// pages/scheduler.jsx
// Full code change

import React, { useEffect, useMemo, useRef, useState } from "react"
import Head from "next/head"
import { SOCIAL_IMAGE_URL, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT } from "../lib/socialPreview"
import {
  Box,
  Typography,
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
  Card,
  Chip,
  Divider,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded"
import ImageRoundedIcon from "@mui/icons-material/ImageRounded"
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded"
import AddRoundedIcon from "@mui/icons-material/AddRounded"
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded"
import NotesRoundedIcon from "@mui/icons-material/NotesRounded"
import { motion } from "framer-motion"

import dynamic from "next/dynamic"
const FullCalendar = dynamic(() => import('./SchedulerCalendar'), { ssr: false, loading: () => <div role="status" style={{ minHeight: 500 }}>Loading calendar…</div> })

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker"

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { PHOTO_ACCEPT, MAX_PHOTOS, MAX_CAPTION_LENGTH, validatePhotoFiles } from "../lib/schedulerPhotos.mjs"
import { saveSchedulerEvent, deleteSchedulerEvent } from "../lib/schedulerPhotoStorage"
import SchedulerPhotoIndicator from "../components/scheduler/SchedulerPhotoIndicator"
import { onAuthStateChanged } from "firebase/auth"

import { auth, db } from "../Firebase/FirebaseInit"

// -------------------------- UI helpers --------------------------

function RevealOnScroll({
  children,
  delay = 0,
  threshold = 0,
  rootMargin = "0px 0px -12% 0px",
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (shown) return
    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
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
        backgroundImage:
          "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
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

function atDefaultTime(d, hours = 9, minutes = 0) {
  const x = new Date(d)
  x.setHours(hours, minutes, 0, 0)
  return x
}

function formatTime(d) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(d)
  } catch {
    return ""
  }
}

function formatDayLabel(d) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d)
  } catch {
    return ""
  }
}

function isSameDay(a, b) {
  if (!a || !b) return false
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  const aS = new Date(aStart).getTime()
  const aE = new Date(aEnd).getTime()
  const bS = new Date(bStart).getTime()
  const bE = new Date(bEnd).getTime()
  if (
    !Number.isFinite(aS) ||
    !Number.isFinite(aE) ||
    !Number.isFinite(bS) ||
    !Number.isFinite(bE)
  ) {
    return false
  }
  return aS < bE && bS < aE
}

function makeClientId(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
}

function fileToPreview(file) {
  return URL.createObjectURL(file)
}

function sanitizeImageMetadata(image) {
  return {
    id: String(image?.id || makeClientId("img")),
    url: String(image?.url || ""),
    path: String(image?.path || ""),
    message: String(image?.message || ""),
    fileName: String(image?.fileName || ""),
    contentType: String(image?.contentType || ""),
    size: Number(image?.size || 0),
    createdAt: image?.createdAt || null,
  }
}

// -------------------------- Image card --------------------------

function EventImageCard({
  image,
  onRemove,
  onMessageChange,
  onPreview,
  isExisting = false,
}) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        border: "1px solid rgba(216, 229, 254, 0.12)",
        boxShadow: "0 16px 45px rgba(0,0,0,0.38)",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 10",
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(216, 229, 254, 0.10)",
        }}
      >
        {image?.preview || image?.url ? (
          <Box
            component="button"
            type="button"
            onClick={() => onPreview?.(image)}
            aria-label={`Preview ${image.fileName || "event photo"}`}
            sx={{
              appearance: "none",
              WebkitAppearance: "none",
              border: "none",
              "&:focus-visible": { outline: "2px solid #c6b9ff", outlineOffset: "-3px" },
              padding: 0,
              margin: 0,
              background: "transparent",
              cursor: "pointer",
              width: "100%",
              height: "100%",
              display: "block",
            }}
          >
            <Box
              component="img"
              src={image.preview || image.url}
              alt={image.message || image.fileName || "Event photo"}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.25s ease",
                "&:hover": {
                  transform: "scale(1.02)",
                },
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(216, 229, 254, 0.52)",
            }}
          >
            <ImageRoundedIcon />
          </Box>
        )}

        <IconButton
          onClick={onRemove}
          aria-label={`Remove ${image.fileName || "event photo"}`}
          title="Remove photo"
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            backgroundColor: "rgba(0,0,0,0.55)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.18)",
            "&:hover": {
              backgroundColor: "rgba(0,0,0,0.72)",
            },
          }}
        >
          <DeleteOutlineRoundedIcon />
        </IconButton>

        <Box
          sx={{
            position: "absolute",
            left: 10,
            bottom: 10,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Chip
            size="small"
            label={isExisting ? "Saved" : "New"}
            sx={{
              background: isExisting
                ? "rgba(34,211,238,0.18)"
                : "rgba(124,58,237,0.20)",
              color: "rgba(245, 248, 255, 0.94)",
              border: "1px solid rgba(216, 229, 254, 0.16)",
              backdropFilter: "blur(8px)",
            }}
          />
          {image?.fileName ? (
            <Chip
              size="small"
              label={image.fileName}
              sx={{
                maxWidth: 180,
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
                background: "rgba(0,0,0,0.40)",
                color: "rgba(245, 248, 255, 0.90)",
                border: "1px solid rgba(216, 229, 254, 0.16)",
                backdropFilter: "blur(8px)",
              }}
            />
          ) : null}
        </Box>
      </Box>

      <Box sx={{ p: 1.35 }}>
        <TextField
          fullWidth
          label="Caption (optional)"
          inputProps={{ maxLength: MAX_CAPTION_LENGTH }}
          value={image?.message || ""}
          onChange={(e) => onMessageChange(e.target.value)}
          InputLabelProps={{ sx: { color: "rgba(245, 248, 255, 0.82)" } }}
          sx={{
            "& .MuiInputBase-root": {
              backgroundColor: "rgba(255,255,255,0.05)",
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
          }}
        />
      </Box>
    </Card>
  )
}

// -------------------------- Day event card --------------------------

function DayEventCard({ event, onClick }) {
  const images = Array.isArray(event?.extendedProps?.images)
    ? event.extendedProps.images
    : []

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: "pointer",
        borderRadius: 3,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(124,58,237,0.10), rgba(34,211,238,0.04))",
        border: "1px solid rgba(216, 229, 254, 0.12)",
        boxShadow: "0 18px 55px rgba(0,0,0,0.38)",
        transition: "transform 0.18s ease, border-color 0.18s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "rgba(216, 229, 254, 0.22)",
        },
      }}
    >
      <Box sx={{ p: { xs: 1.6, sm: 1.9 } }}>
        <Stack spacing={1.25}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Typography
              sx={{
                color: "rgba(245,248,255,0.96)",
                fontWeight: 900,
                fontSize: { xs: 16, sm: 17 },
              }}
            >
              {event.title}
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                icon={<AccessTimeRoundedIcon />}
                label={
                  event.allDay
                    ? "All day"
                    : `${formatTime(event.start)} – ${formatTime(event.end)}`
                }
                sx={{
                  color: "rgba(245,248,255,0.94)",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(216,229,254,0.12)",
                }}
              />
              {images.length ? (
                <Chip
                  icon={<PhotoLibraryRoundedIcon />}
                  label={`${images.length} image${images.length === 1 ? "" : "s"}`}
                  sx={{
                    color: "rgba(245,248,255,0.94)",
                    background: "rgba(34,211,238,0.14)",
                    border: "1px solid rgba(216,229,254,0.12)",
                  }}
                />
              ) : null}
            </Stack>
          </Stack>

          {event.extendedProps?.notes ? (
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <NotesRoundedIcon
                sx={{
                  color: "rgba(216,229,254,0.72)",
                  mt: "2px",
                  fontSize: 18,
                }}
              />
              <Typography
                sx={{
                  color: "rgba(216,229,254,0.82)",
                  lineHeight: 1.7,
                  fontSize: 14.5,
                }}
              >
                {event.extendedProps.notes}
              </Typography>
            </Stack>
          ) : null}

          {images.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  sm: "repeat(4, minmax(0, 1fr))",
                },
                gap: 1,
              }}
            >
              {images.slice(0, 4).map((img) => (
                <Box
                  key={img.id}
                  component="img"
                  src={img.url}
                  alt={img.fileName || "Event image"}
                  sx={{
                    width: "100%",
                    aspectRatio: "4 / 3",
                    objectFit: "cover",
                    borderRadius: 2,
                    border: "1px solid rgba(216,229,254,0.10)",
                    display: "block",
                  }}
                />
              ))}
            </Box>
          ) : null}
        </Stack>
      </Box>
    </Card>
  )
}

// -------------------------- Page --------------------------

export default function SchedulerPage() {
  const SITE_NAME = "Bergquist Applications"
  const SITE_URL = "https://bergquistapplications.com"
  const PAGE_PATH = "/scheduler"
  const PAGE_URL = `${SITE_URL}${PAGE_PATH}`

  const TITLE = `Scheduler | ${SITE_NAME}`
  const DESCRIPTION = "Schedule events and view them on a calendar."

  const OG_IMAGE = SOCIAL_IMAGE_URL
  const LAST_UPDATED = "March 22, 2026"

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
    dateModified: "2026-03-22",
  }

  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [eventsErr, setEventsErr] = useState("")
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setCurrentUser(nextUser || null)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const q = query(collection(db, "scheduleEvents"), orderBy("start", "asc"))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const out = []
        snap.forEach((d) => {
          const data = d.data() || {}
          const ownerUid = data.ownerUid || null
          if (ownerUid && ownerUid !== currentUser?.uid) return

          const start = data.start?.toDate ? data.start.toDate() : null
          const end = data.end?.toDate ? data.end.toDate() : null
          if (!start || !end) return

          const rawImages = Array.isArray(data.images) ? data.images : []

          out.push({
            id: d.id,
            title: String(data.title || "Scheduled Event"),
            start,
            end,
            allDay: !!data.allDay,
            extendedProps: {
              notes: String(data.notes || ""),
              images: rawImages.map((img) => sanitizeImageMetadata(img)),
              ownerUid,
              scheduleKind: data.scheduleKind || "",
              reminder: data.reminder || null,
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
  }, [currentUser?.uid])

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState("create")
  const [activeId, setActiveId] = useState(null)

  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [allDay, setAllDay] = useState(false)

  const [startDt, setStartDt] = useState(null)
  const [endDt, setEndDt] = useState(null)

  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [removedExistingImages, setRemovedExistingImages] = useState([])

  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState("")
  const fileInputRef = useRef(null)
  const busyRef = useRef(false)
  const [preparingPhotos, setPreparingPhotos] = useState(false)
  const newImagesRef = useRef(newImages)
  const mountedRef = useRef(false)
  newImagesRef.current = newImages
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false; revokeNewImagePreviews(newImagesRef.current) }
  }, [])

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)

  const [dayZoomOpen, setDayZoomOpen] = useState(false)
  const [dayZoomDate, setDayZoomDate] = useState(null)
  const dayZoomScrollYRef = useRef(0)
  const restoreDayZoomScrollRef = useRef(false)

  function openImagePreview(image) {
    const src = image?.preview || image?.url || ""
    if (!src) return
    setPreviewImage({
      src,
      alt: image?.message || image?.fileName || "Event photo",
      message: image?.message || "",
    })
    setImagePreviewOpen(true)
  }

  function closeImagePreview() {
    setImagePreviewOpen(false)
    setPreviewImage(null)
  }

  function openDayZoom(date) {
    if (!date) return

    if (typeof window !== "undefined") {
      dayZoomScrollYRef.current = window.scrollY || window.pageYOffset || 0
      restoreDayZoomScrollRef.current = true
    }

    setDayZoomDate(new Date(date))
    setDayZoomOpen(true)
  }

  function closeDayZoom() {
    setDayZoomOpen(false)
    setDayZoomDate(null)
  }

  const dayZoomEvents = useMemo(() => {
    if (!dayZoomDate) return []
    return [...events]
      .filter((ev) => isSameDay(ev.start, dayZoomDate))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  }, [events, dayZoomDate])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (dayZoomOpen) return
    if (!restoreDayZoomScrollRef.current) return

    const restoreY = dayZoomScrollYRef.current || 0

    requestAnimationFrame(() => {
      window.scrollTo({
        top: restoreY,
        left: 0,
        behavior: "auto",
      })
      restoreDayZoomScrollRef.current = false
    })
  }, [dayZoomOpen])

  function revokeNewImagePreviews(images) {
    for (const img of images || []) {
      try {
        if (img?.preview) URL.revokeObjectURL(img.preview)
      } catch {}
    }
  }

  function resetModal() {
    revokeNewImagePreviews(newImages)
    setMode("create")
    setActiveId(null)
    setTitle("")
    setNotes("")
    setAllDay(false)
    setStartDt(null)
    setEndDt(null)
    setExistingImages([])
    setNewImages([])
    setRemovedExistingImages([])
    setSaving(false)
    setSaveErr("")
  }

  function openForCreate(date) {
    const base = date instanceof Date ? date : new Date()
    const s = atDefaultTime(base, 9, 0)
    const e = atDefaultTime(base, 10, 0)

    revokeNewImagePreviews(newImages)

    setMode("create")
    setActiveId(null)
    setTitle("")
    setNotes("")
    setAllDay(false)
    setStartDt(s)
    setEndDt(e)
    setExistingImages([])
    setNewImages([])
    setRemovedExistingImages([])
    setSaveErr("")
    setOpen(true)
  }

  function openForEdit(eventInfo) {
    const ev = eventInfo?.event
    if (!ev) return

    revokeNewImagePreviews(newImages)

    setMode("edit")
    setActiveId(ev.id)
    setTitle(ev.title || "")
    setNotes(ev.extendedProps?.notes || "")
    setAllDay(!!ev.allDay)
    setStartDt(ev.start ? new Date(ev.start) : null)
    setEndDt(ev.end ? new Date(ev.end) : ev.start ? new Date(ev.start) : null)
    setExistingImages(
      (Array.isArray(ev.extendedProps?.images) ? ev.extendedProps.images : []).map(
        (img) => sanitizeImageMetadata(img)
      )
    )
    setNewImages([])
    setRemovedExistingImages([])
    setSaveErr("")
    setOpen(true)
  }

  function openExistingEventFromDayZoom(eventItem) {
    openForEdit({
      event: {
        id: eventItem.id,
        title: eventItem.title,
        allDay: eventItem.allDay,
        start: eventItem.start,
        end: eventItem.end,
        extendedProps: eventItem.extendedProps || {},
      },
    })
  }

  function openCreateFromDayZoom() {
    if (!dayZoomDate) return
    openForCreate(dayZoomDate)
  }

  function closeModal() {
    if (busyRef.current) return
    setOpen(false)
    resetModal()
  }

  const canSubmit = useMemo(() => {
    if (!startDt || !endDt) return false
    const s = new Date(startDt).getTime()
    const e = new Date(endDt).getTime()
    if (!Number.isFinite(s) || !Number.isFinite(e)) return false
    return e > s
  }, [startDt, endDt])

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

  function triggerImageSelect() {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  async function handleImageFilesSelected(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ""
    if (!files.length || busyRef.current) return
    busyRef.current = true
    setPreparingPhotos(true)
    try {
      await validatePhotoFiles(files, existingImages.length + newImages.length)
    } catch (error) {
      if (!mountedRef.current) return
      setSaveErr(error.message || "Could not read these photos.")
      busyRef.current = false
      setPreparingPhotos(false)
      return
    }

    if (!mountedRef.current) return
    const mapped = files.map((file) => ({
      id: makeClientId("newimg"),
      file,
      fileName: file.name || "image",
      contentType: file.type || "",
      size: Number(file.size || 0),
      message: "",
      preview: fileToPreview(file),
    }))

    setNewImages((prev) => [...prev, ...mapped])
    newImagesRef.current = [...newImagesRef.current, ...mapped]
    setSaveErr("")
    busyRef.current = false
    setPreparingPhotos(false)
  }

  function updateNewImageMessage(id, message) {
    setNewImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, message } : img))
    )
  }

  function updateExistingImageMessage(id, message) {
    setExistingImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, message } : img))
    )
  }

  function removeNewImage(id) {
    setNewImages((prev) => {
      const target = prev.find((img) => img.id === id)
      try {
        if (target?.preview) URL.revokeObjectURL(target.preview)
      } catch {}
      return prev.filter((img) => img.id !== id)
    })
  }

  function removeExistingImage(id) {
    setExistingImages((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) {
        setRemovedExistingImages((old) => [...old, target])
      }
      return prev.filter((img) => img.id !== id)
    })
  }


  async function handleSubmit() {
    if (busyRef.current) return
    setSaveErr("")

    if (!canSubmit) {
      setSaveErr("Please choose a valid start and end time (end must be after start).")
      return
    }

    if (conflictMessage) {
      setSaveErr(conflictMessage)
      return
    }

    busyRef.current = true
    setSaving(true)

    try {
      const basePayload = {
        title: String(title || "Scheduled Event"),
        notes: String(notes || ""),
        allDay: !!allDay,
        start: Timestamp.fromDate(new Date(startDt)),
        end: Timestamp.fromDate(new Date(endDt)),
        ...(currentUser?.uid ? { ownerUid: currentUser.uid } : {}),
        ...(currentUser?.email ? { ownerEmail: currentUser.email } : {}),
        updatedAt: serverTimestamp(),
      }

      await saveSchedulerEvent({
        eventId: mode === "edit" ? activeId : null,
        payload: { ...basePayload, ...(mode === "create" ? { createdAt: serverTimestamp() } : {}) },
        existingImages: existingImages.map(sanitizeImageMetadata),
        newImages,
        removedImages: removedExistingImages,
      })
      busyRef.current = false

      if (!mountedRef.current) return
      setSaving(false)
      closeModal()
    } catch (e) {
      if (!mountedRef.current) return
      setSaving(false)
      busyRef.current = false
      setSaveErr(e?.message || "Failed to save event.")
    }
  }

  async function handleDelete() {
    if (!activeId || busyRef.current) return
    setSaveErr("")
    busyRef.current = true
    setSaving(true)

    try {
      const imagesToDelete = [...existingImages, ...removedExistingImages]
      await deleteSchedulerEvent(activeId, imagesToDelete)
      busyRef.current = false
      if (!mountedRef.current) return
      setSaving(false)
      closeModal()
    } catch (e) {
      setSaving(false)
      busyRef.current = false
      if (mountedRef.current) setSaveErr(e?.message || "Failed to delete event.")
    }
  }

  useEffect(() => {
    function isMorePopoverOpen() {
      return !!document.querySelector(".fc-more-popover")
    }

    function onDocMouseDownCapture(e) {
      if (!isMorePopoverOpen()) return

      const t = e.target
      if (!(t instanceof Element)) return

      if (t.closest(".fc-more-popover")) return
      if (t.closest(".fc-popover-close")) return

      if (
        t.closest(".MuiDialog-root") ||
        t.closest(".MuiDialog-container") ||
        t.closest('[role="dialog"]') ||
        t.closest(".MuiPickersPopper-root") ||
        t.closest(".MuiPopover-root") ||
        t.closest(".MuiModal-root")
      ) {
        e.stopPropagation()
        if (typeof e.stopImmediatePropagation === "function") {
          e.stopImmediatePropagation()
        }
        return
      }

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

      e.preventDefault()
      e.stopPropagation()
      if (typeof e.stopImmediatePropagation === "function") {
        e.stopImmediatePropagation()
      }
    }

    function onDocKeyDownCapture(e) {
      if (!isMorePopoverOpen()) return
      if (e.key !== "Escape") return

      e.preventDefault()
      e.stopPropagation()
      if (typeof e.stopImmediatePropagation === "function") {
        e.stopImmediatePropagation()
      }
    }

    document.addEventListener("mousedown", onDocMouseDownCapture, true)
    document.addEventListener("keydown", onDocKeyDownCapture, true)

    return () => {
      document.removeEventListener("mousedown", onDocMouseDownCapture, true)
      document.removeEventListener("keydown", onDocKeyDownCapture, true)
    }
  }, [])

  const calendarCss = useMemo(
    () => `
      .fc {
        color: rgba(216, 229, 254, 0.92);
        --fc-border-color: rgba(216, 229, 254, 0.14);
        --fc-page-bg-color: transparent;
        --fc-neutral-bg-color: rgba(255,255,255,0.03);
        --fc-today-bg-color: rgba(124,58,237,0.14);
      }

      .fc, .fc-view-harness, .fc-scroller {
        overflow: visible !important;
      }

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

      .fc .fc-daygrid-day {
        cursor: pointer;
      }

      .fc .fc-daygrid-event {
        border-radius: 10px;
        padding: 2px 8px;
        border: 1px solid rgba(216, 229, 254, 0.18);
        background: linear-gradient(90deg, rgba(124,58,237,0.34), rgba(34,211,238,0.18));
        box-shadow: 0 18px 55px rgba(0,0,0,0.45);
        font-weight: 800;
      }

      .fc .fc-more-link {
        color: rgba(216, 229, 254, 0.92);
        font-weight: 800;
        text-decoration: none;
      }

      .fc .fc-more-link:hover {
        text-decoration: underline;
        opacity: 0.95;
      }

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

  const pickerTextFieldSx = useMemo(
    () => ({
      "& .MuiInputBase-root": {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 2,
      },
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

  function renderEventContent(eventInfo) {
    const images = Array.isArray(eventInfo.event.extendedProps?.images)
      ? eventInfo.event.extendedProps.images
      : []

    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
        <SchedulerPhotoIndicator count={images.length} />

        <div
          style={{ display: "flex", gap: 8, alignItems: "baseline", minWidth: 0 }}
        >
          {eventInfo.timeText ? (
            <span style={{ fontWeight: 900, opacity: 0.95, whiteSpace: "nowrap" }}>
              {eventInfo.timeText}
            </span>
          ) : null}
          <span
            style={{
              fontWeight: 800,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {eventInfo.event.title}
          </span>
        </div>
      </div>
    )
  }

  const totalImageCount = existingImages.length + newImages.length

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
        <meta property="og:image:width" content={SOCIAL_IMAGE_WIDTH} />
        <meta property="og:image:height" content={SOCIAL_IMAGE_HEIGHT} />
        <meta property="og:image:alt" content={SOCIAL_IMAGE_ALT} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
        <meta name="twitter:image:alt" content={SOCIAL_IMAGE_ALT} />
        <meta name="theme-color" content="#000000" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebPage) }}
        />
        <style>{calendarCss}</style>
      </Head>

      <Box
        sx={{
          width: "100vw",
          maxWidth: "100%",
          px: 0,
          pb: { xs: 2, sm: 2.5, md: 3 },
        }}
      >
        <Box sx={{ width: "100%" }}>
          <RevealOnScroll>
            <Typography
              variant="body2"
              align="center"
              sx={{ mt: 0.25, color: "rgba(216, 229, 254, 0.68)" }}
            >
              Last updated: {LAST_UPDATED}
            </Typography>
          </RevealOnScroll>
        </Box>
      </Box>

      <Box
        sx={{
          width: "100vw",
          maxWidth: "100%",
          px: 0,
          pb: { xs: 8, sm: 10, md: 12 },
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Stack spacing={{ xs: 2, sm: 2.5 }}>
            <RevealOnScroll>
              <Box
                sx={{
                  position: "relative",
                  borderRadius: 0,
                  overflow: "visible",
                  background: "black",
                  border: "none",
                  boxShadow: "none",
                  p: { xs: 1, sm: 1.25, md: 1.5 },
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.25}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  sx={{ mb: 1.1 }}
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
                        : `Showing ${events.length} event${events.length === 1 ? "" : "s"}. Click any day or event to open the full day view.`}
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
                    borderRadius: 0,
                    border: "none",
                    overflow: "visible",
                    background: "black",
                    px: { xs: 0.35, sm: 0.6 },
                    py: { xs: 0.35, sm: 0.6 },
                  }}
                >
                  <FullCalendar
                    initialView="dayGridMonth"
                    height="auto"
                    headerToolbar={{
                      left: "prev,next today",
                      center: "title",
                      right: "dayGridMonth,dayGridWeek,dayGridDay",
                    }}
                    events={events}
                    dateClick={(info) => openDayZoom(info.date)}
                    eventClick={(info) => {
                      info.jsEvent?.preventDefault?.()
                      info.jsEvent?.stopPropagation?.()
                      openForEdit(info)
                    }}
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
                    eventInteractive
                  />
                </Box>

                <SubText sx={{ mt: 1.1, fontSize: 14, color: "rgba(216, 229, 254, 0.68)" }}>
                  Click an event to view its details and photos, or a day to see
                  its schedule.
                </SubText>
              </Box>
            </RevealOnScroll>
          </Stack>
        </Box>
      </Box>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog
          open={open}
          onClose={closeModal}
          fullWidth
          maxWidth="md"
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
              <Typography
                sx={{ mt: 0.5, color: "rgba(216, 229, 254, 0.70)", fontSize: 13.5 }}
              >
                Add scheduling details, notes, and an image gallery for the event.
              </Typography>
            </Box>

            <IconButton
              onClick={closeModal}
              aria-label="Close event"
              disabled={saving || preparingPhotos}
              sx={{ color: "rgba(216, 229, 254, 0.90)" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 2.5 }}>
            <fieldset disabled={saving || preparingPhotos} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <Stack spacing={2.2}>
              <br />

              <Box
                sx={{
                  borderRadius: 3,
                  border: "1px solid rgba(216, 229, 254, 0.10)",
                  background: "rgba(255,255,255,0.02)",
                  p: { xs: 1.4, sm: 1.8 },
                }}
              >
                <GradientTitle variant="subtitle1" sx={{ textShadow: "none", mb: 1.25 }}>
                  Event Details
                </GradientTitle>

                <Stack spacing={2}>
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
                        WebkitTextFillColor:
                          "rgba(255,255,255,0.95) !important",
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
                    control={
                      <Switch
                        checked={allDay}
                        onChange={(e) => setAllDay(e.target.checked)}
                      />
                    }
                    label={
                      <Typography sx={{ color: "rgba(245, 248, 255, 0.82)" }}>
                        All-day event
                      </Typography>
                    }
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
                        WebkitTextFillColor:
                          "rgba(255,255,255,0.95) !important",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(216, 229, 254, 0.20)",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(216, 229, 254, 0.30)",
                      },
                    }}
                  />
                </Stack>
              </Box>

              <Box
                sx={{
                  borderRadius: 3,
                  border: "1px solid rgba(216, 229, 254, 0.10)",
                  background: "rgba(255,255,255,0.02)",
                  p: { xs: 1.4, sm: 1.8 },
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.25}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  justifyContent="space-between"
                  sx={{ mb: 1.5 }}
                >
                  <Box>
                    <GradientTitle variant="subtitle1" sx={{ textShadow: "none", mb: 0.55 }}>
                      Event Photos
                    </GradientTitle>
                    <Typography
                      sx={{ color: "rgba(216, 229, 254, 0.68)", fontSize: 13.5 }}
                    >
                      JPEG, PNG, or WebP. Up to 8 photos, 5 MB each.
                    </Typography>
                  </Box>

                  <Button
                    onClick={triggerImageSelect}
                    disabled={saving || preparingPhotos || totalImageCount >= MAX_PHOTOS}
                    startIcon={<AddPhotoAlternateRoundedIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 800,
                      px: 1.8,
                      py: 1,
                      color: "rgba(245,248,255,0.92)",
                      border: "1px solid rgba(216, 229, 254, 0.16)",
                      background: "rgba(255,255,255,0.04)",
                      "&:hover": {
                        background: "rgba(255,255,255,0.07)",
                      },
                    }}
                  >
                    Add photos
                  </Button>
                </Stack>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={PHOTO_ACCEPT}
                  aria-label="Event photos"
                  multiple
                  hidden
                  onChange={handleImageFilesSelected}
                />

                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mb: totalImageCount ? 1.5 : 0 }}
                >
                  <Chip
                    label={`${totalImageCount} image${totalImageCount === 1 ? "" : "s"}`}
                    sx={{
                      background: "rgba(124,58,237,0.18)",
                      color: "rgba(245,248,255,0.92)",
                      border: "1px solid rgba(216, 229, 254, 0.14)",
                    }}
                  />
                  <Chip
                    label={`${existingImages.length} saved`}
                    sx={{
                      background: "rgba(34,211,238,0.16)",
                      color: "rgba(245,248,255,0.92)",
                      border: "1px solid rgba(216, 229, 254, 0.14)",
                    }}
                  />
                  <Chip
                    label={`${newImages.length} pending upload`}
                    sx={{
                      background: "rgba(255,255,255,0.08)",
                      color: "rgba(245,248,255,0.92)",
                      border: "1px solid rgba(216, 229, 254, 0.14)",
                    }}
                  />
                </Stack>

                {totalImageCount ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                      },
                      gap: 1.4,
                    }}
                  >
                    {existingImages.map((image) => (
                      <EventImageCard
                        key={image.id}
                        image={image}
                        isExisting
                        onPreview={openImagePreview}
                        onRemove={() => removeExistingImage(image.id)}
                        onMessageChange={(message) =>
                          updateExistingImageMessage(image.id, message)
                        }
                      />
                    ))}

                    {newImages.map((image) => (
                      <EventImageCard
                        key={image.id}
                        image={image}
                        onPreview={openImagePreview}
                        onRemove={() => removeNewImage(image.id)}
                        onMessageChange={(message) =>
                          updateNewImageMessage(image.id, message)
                        }
                      />
                    ))}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      borderRadius: 3,
                      border: "1px dashed rgba(216, 229, 254, 0.18)",
                      background: "rgba(255,255,255,0.02)",
                      minHeight: 170,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      px: 2,
                    }}
                  >
                    <Box>
                      <PhotoLibraryRoundedIcon
                        sx={{
                          fontSize: 34,
                          color: "rgba(216, 229, 254, 0.52)",
                          mb: 0.7,
                        }}
                      />
                      <Typography
                        sx={{
                          color: "rgba(245,248,255,0.90)",
                          fontWeight: 700,
                          mb: 0.4,
                        }}
                      >
                        No images added yet
                      </Typography>
                      <Typography
                        sx={{ color: "rgba(216, 229, 254, 0.62)", fontSize: 13.5 }}
                      >
                        Upload event photos, flyers, mockups, or reference images.
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {conflictMessage ? (
                <Typography sx={{ color: "rgba(255, 170, 70, 0.95)", fontSize: 13.5 }}>
                  {conflictMessage}
                </Typography>
              ) : null}

              {preparingPhotos && <Typography role="status">Preparing photos...</Typography>}
              {saveErr ? (
                <Typography
                  sx={{ color: "rgba(255, 120, 120, 0.95)", fontSize: 13.5 }}
                >
                  <span role="alert">{saveErr}</span>
                </Typography>
              ) : null}
            </Stack>
            </fieldset>
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
                disabled={saving || preparingPhotos || !canSubmit || !!conflictMessage}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  px: 2.25,
                  background:
                    "linear-gradient(90deg, rgba(124,58,237,0.88), rgba(34,211,238,0.68))",
                  boxShadow: "0 16px 45px rgba(0,0,0,0.38)",
                  "&:hover": {
                    background:
                      "linear-gradient(90deg, rgba(124,58,237,0.94), rgba(34,211,238,0.76))",
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.10)",
                  },
                }}
              >
                {saving
                  ? mode === "edit"
                    ? "Updating…"
                    : "Saving…"
                  : mode === "edit"
                  ? "Update"
                  : "Submit"}
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        <Dialog
          open={imagePreviewOpen}
          onClose={closeImagePreview}
          aria-label="Event photo preview"
          fullScreen
          PaperProps={{
            sx: {
              width: "100vw",
              maxWidth: "100vw",
              height: "100vh",
              maxHeight: "100vh",
              margin: 0,
              borderRadius: 0,
              background: "rgba(0,0,0,0.96)",
              boxShadow: "none",
              overflow: "hidden",
            },
          }}
          BackdropProps={{
            sx: {
              backgroundColor: "rgba(0,0,0,0.82)",
            },
          }}
        >
          <IconButton aria-label="Close photo preview" onClick={closeImagePreview} sx={{ position: "absolute", right: 16, top: 16, zIndex: 2, color: "white", backgroundColor: "rgba(0,0,0,0.7)" }}><CloseIcon /></IconButton>
          <Box
            onClick={closeImagePreview}
            sx={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 0,
              py: 0,
              cursor: "pointer",
              position: "relative",
              background: "rgba(0,0,0,0.96)",
            }}
          >
            {previewImage?.src ? (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <Box
                  component="img"
                  src={previewImage.src}
                  alt={previewImage.alt || "Preview image"}
                  sx={{
                    width: "100%",
                    maxWidth: "100vw",
                    maxHeight: "100vh",
                    objectFit: "contain",
                    display: "block",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />

                {previewImage?.message ? (
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      px: { xs: 2, sm: 3, md: 4 },
                      py: 2,
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.78) 100%)",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.96)",
                        textAlign: "center",
                        fontSize: { xs: 14, sm: 15, md: 16 },
                        lineHeight: 1.6,
                      }}
                    >
                      {previewImage.message}
                    </Typography>
                  </Box>
                ) : null}
              </Box>
            ) : null}
          </Box>
        </Dialog>

        <Dialog
          open={dayZoomOpen}
          onClose={(event, reason) => {
            if (reason === "backdropClick" || reason === "escapeKeyDown") return
          }}
          fullScreen
          disableEscapeKeyDown
          PaperProps={{
            sx: {
              width: "100vw",
              maxWidth: "100vw",
              height: "100vh",
              maxHeight: "100vh",
              margin: 0,
              borderRadius: 0,
              background: "linear-gradient(180deg, #03040A 0%, #070813 100%)",
              boxShadow: "none",
              overflow: "hidden",
            },
          }}
          BackdropProps={{
            sx: {
              backgroundColor: "rgba(0,0,0,0.82)",
            },
          }}
        >
          <Box
            sx={{
              width: "100vw",
              height: "100vh",
              overflowY: "auto",
              background: "linear-gradient(180deg, #03040A 0%, #070813 100%)",
            }}
          >
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 5,
                backdropFilter: "blur(16px)",
                background: "rgba(5,6,10,0.78)",
                borderBottom: "1px solid rgba(216,229,254,0.10)",
              }}
            >
              <Box sx={{ px: { xs: 2, sm: 2.5, md: 3 }, py: { xs: 1.5, sm: 1.8 } }}>
                <Stack spacing={1.25}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1.25}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <IconButton
                        onClick={closeDayZoom}
                        sx={{
                          color: "rgba(245,248,255,0.94)",
                          border: "1px solid rgba(216,229,254,0.14)",
                          background: "rgba(255,255,255,0.04)",
                          "&:hover": {
                            background: "rgba(255,255,255,0.08)",
                          },
                        }}
                      >
                        <CloseIcon />
                      </IconButton>

                      <Box>
                        <GradientTitle
                          variant="h5"
                          sx={{ textShadow: "none", letterSpacing: 0.8, mb: 0.25 }}
                        >
                          {dayZoomDate ? formatDayLabel(dayZoomDate) : "Day View"}
                        </GradientTitle>
                        <SubText sx={{ fontSize: 14.5, color: "rgba(216,229,254,0.70)" }}>
                          {dayZoomEvents.length
                            ? `${dayZoomEvents.length} event${dayZoomEvents.length === 1 ? "" : "s"} scheduled for this day.`
                            : "No events scheduled for this day yet."}
                        </SubText>
                      </Box>
                    </Stack>

                    <Button
                      onClick={openCreateFromDayZoom}
                      startIcon={<AddRoundedIcon />}
                      variant="contained"
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 900,
                        px: 2,
                        py: 1.05,
                        background:
                          "linear-gradient(90deg, rgba(124,58,237,0.85), rgba(34,211,238,0.65))",
                        boxShadow: "0 18px 55px rgba(0,0,0,0.42)",
                        "&:hover": {
                          background:
                            "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(34,211,238,0.72))",
                        },
                      }}
                    >
                      New Event
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </Box>

            <Box sx={{ px: { xs: 2, sm: 2.5, md: 3 }, py: { xs: 2, sm: 2.5 } }}>
              {dayZoomEvents.length ? (
                <Stack spacing={1.6}>
                  {dayZoomEvents.map((ev, idx) => (
                    <React.Fragment key={ev.id}>
                      <DayEventCard
                        event={ev}
                        onClick={() => openExistingEventFromDayZoom(ev)}
                      />
                      {idx < dayZoomEvents.length - 1 ? (
                        <Divider sx={{ borderColor: "rgba(216,229,254,0.08)" }} />
                      ) : null}
                    </React.Fragment>
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    minHeight: 280,
                    borderRadius: 3,
                    border: "1px dashed rgba(216,229,254,0.16)",
                    background: "rgba(255,255,255,0.02)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    px: 2,
                  }}
                >
                  <Box>
                    <CalendarMonthRoundedIcon
                      sx={{
                        fontSize: 40,
                        color: "rgba(216,229,254,0.48)",
                        mb: 1,
                      }}
                    />
                    <Typography
                      sx={{
                        color: "rgba(245,248,255,0.92)",
                        fontWeight: 800,
                        mb: 0.5,
                      }}
                    >
                      No events for this day
                    </Typography>
                    <Typography sx={{ color: "rgba(216,229,254,0.68)", fontSize: 14 }}>
                      Use the button above to add one.
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Dialog>
      </LocalizationProvider>
    </Box>
  )
}
