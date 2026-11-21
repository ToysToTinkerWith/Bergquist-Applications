// Inactive profile implementation. The /profile route currently redirects home.
import React, { useEffect, useMemo, useRef, useState } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined"
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded"
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded"
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import DatabaseRoundedIcon from "@mui/icons-material/StorageRounded"
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded"
import MicRoundedIcon from "@mui/icons-material/MicRounded"
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded"
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded"
import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"
import SortRoundedIcon from "@mui/icons-material/SortRounded"
import StopRoundedIcon from "@mui/icons-material/StopRounded"
import { GoogleAuthProvider, linkWithPopup, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth"
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore"
import { auth, db } from "../Firebase/FirebaseInit"
import SocialPostCreator from "../components/SocialPostCreator"

const ASSISTANT_CLIENT_ID_KEY = "bergquist.homeAssistant.clientId.v1"
const MAX_PROFILE_ASSISTANT_MEDIA = 3
const MAX_PROFILE_ASSISTANT_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_PROFILE_ASSISTANT_VIDEO_BYTES = 25 * 1024 * 1024
const MAX_PROFILE_ASSISTANT_TOTAL_BYTES = 28 * 1024 * 1024

function isAccountUser(user) {
  return !!user && !user.isAnonymous
}

function getDisplayName(user) {
  return user?.displayName || user?.email || "Profile"
}

function getInitials(user) {
  const name = getDisplayName(user)
  const parts = String(name).trim().split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase()
  }

  return String(parts[0]?.slice(0, 2) || "U").toUpperCase()
}

function timestampToDate(value) {
  if (!value) return null
  if (typeof value.toDate === "function") return value.toDate()
  if (value instanceof Date) return value

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDateTime(value) {
  const date = timestampToDate(value)
  if (!date) return ""

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatDate(value) {
  const date = timestampToDate(value)
  if (!date) return ""

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function getLocalDateTimeSnapshot() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, "0")

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function createAssistantClientId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `client_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function getAssistantClientId() {
  if (typeof window === "undefined") return ""

  try {
    const existing = window.localStorage.getItem(ASSISTANT_CLIENT_ID_KEY)
    if (existing) return existing

    const next = createAssistantClientId()
    window.localStorage.setItem(ASSISTANT_CLIENT_ID_KEY, next)
    return next
  } catch {
    return createAssistantClientId()
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(reader.error || new Error("Could not read media."))
    reader.readAsDataURL(file)
  })
}

function formatMediaSize(bytes) {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isAcceptedOrganizerFile(file) {
  return file?.type?.startsWith("image/") || file?.type?.startsWith("video/")
}

function getOrganizerFileKind(file) {
  return file?.type?.startsWith("video/") ? "video" : "image"
}

function getImageDimensions(previewUrl) {
  return new Promise((resolve) => {
    const image = new window.Image()
    const done = (metadata = {}) => {
      image.onload = null
      image.onerror = null
      resolve(metadata)
    }

    image.onload = () => {
      done({
        width: image.naturalWidth || null,
        height: image.naturalHeight || null,
      })
    }
    image.onerror = () => done()
    image.src = previewUrl
  })
}

function getVideoMetadata(previewUrl) {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    let finished = false

    const finish = (metadata = {}) => {
      if (finished) return
      finished = true
      video.onloadedmetadata = null
      video.onseeked = null
      video.onerror = null
      resolve(metadata)
    }

    const buildMetadata = () => ({
      width: video.videoWidth || null,
      height: video.videoHeight || null,
      durationSeconds: Number.isFinite(video.duration)
        ? Math.round(video.duration * 10) / 10
        : null,
    })

    video.muted = true
    video.playsInline = true
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      const metadata = buildMetadata()

      try {
        video.currentTime = Math.min(0.5, Math.max(0, Number(video.duration || 0) / 2))
      } catch {
        finish(metadata)
      }
    }
    video.onseeked = () => {
      const metadata = buildMetadata()

      try {
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth || 720
        canvas.height = video.videoHeight || 405
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
        metadata.thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.72)
      } catch {}

      finish(metadata)
    }
    video.onerror = () => finish()
    video.src = previewUrl

    window.setTimeout(() => finish(buildMetadata()), 2500)
  })
}

async function getOrganizerFileMetadata(file, previewUrl) {
  if (typeof window === "undefined") return {}

  if (file.type?.startsWith("video/")) {
    return getVideoMetadata(previewUrl)
  }

  return getImageDimensions(previewUrl)
}

async function readAssistantPayload(response, fallbackError) {
  let payload = null

  try {
    payload = await response.json()
  } catch {}

  if (!response.ok) {
    const error = new Error(payload?.error || fallbackError)
    error.statusCode = response.status
    throw error
  }

  return payload || {}
}

function getOrganizerMedia(item) {
  if (Array.isArray(item.media)) return item.media
  if (Array.isArray(item.images)) return item.images
  return []
}

function normalizeOrganizerItemData(id, data = {}) {
  const media = getOrganizerMedia(data)

  return {
    id,
    title: String(data.title || "Saved item"),
    summary: String(data.summary || data.prompt || ""),
    itemType: String(data.itemType || "note"),
    categories: Array.isArray(data.categories) ? data.categories : [],
    tags: Array.isArray(data.tags) ? data.tags : [],
    searchableFields: Array.isArray(data.searchableFields)
      ? data.searchableFields
      : [],
    event: data.event || null,
    media,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt),
  }
}

function normalizeOrganizerItem(docSnap) {
  return normalizeOrganizerItemData(docSnap.id, docSnap.data() || {})
}

function normalizeScheduleEvent(docSnap) {
  const data = docSnap.data() || {}
  const start = timestampToDate(data.start)
  const end = timestampToDate(data.end)

  return {
    id: docSnap.id,
    title: String(data.title || "Scheduled event"),
    notes: String(data.notes || ""),
    scheduleKind: String(data.scheduleKind || "event"),
    start,
    end,
    allDay: !!data.allDay,
    status: String(data.status || "active"),
    priority: String(data.priority || ""),
  }
}

function matchesText(item, queryText) {
  const queryValue = String(queryText || "").trim().toLowerCase()
  if (!queryValue) return true

  const haystack = [
    item.title,
    item.summary,
    item.itemType,
    ...(item.categories || []),
    ...(item.tags || []),
    ...(item.searchableFields || []),
    item.event?.title,
    item.event?.description,
    item.event?.location,
    ...getOrganizerMedia(item).flatMap((media) => [
      media.name,
      media.note,
      media.kind,
      media.contentType,
    ]),
  ]
    .join(" ")
    .toLowerCase()

  return haystack.includes(queryValue)
}

function looksLikeSchedulerNavigationPrompt(text) {
  const prompt = String(text || "").toLowerCase()
  return (
    /\b(open|go to|take me|show|view|see|visit|use|try)\b/.test(prompt) &&
    /\b(scheduler|calendar|planner|schedule page|calendar page)\b/.test(prompt)
  )
}

function looksLikeDatabaseNavigationPrompt(text) {
  const prompt = String(text || "").toLowerCase()
  return (
    /\b(open|go to|take me|show|view|see|visit|use|try)\b/.test(prompt) &&
    /\b(database|saved data|organizer|data workspace|saved items)\b/.test(prompt)
  )
}

function looksLikeSchedulerPrompt(text) {
  const prompt = String(text || "").toLowerCase()
  if (looksLikeSchedulerNavigationPrompt(prompt)) return false

  const reminderIntent =
    /\b(remind me|reminder|wake me|wake up|notify me|alert me|tell me|ping me)\b/.test(prompt)
  const calendarIntent =
    /\b(schedule|add to my calendar|put on my calendar|calendar this|book|set up)\b/.test(prompt)
  const datedThing =
    /\b(today|tomorrow|tonight|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}:\d{2}|\d{1,2}\s*(am|pm)|\d{1,2}\/\d{1,2})\b/.test(prompt)
  const eventThing =
    /\b(meeting|appointment|event|deadline|call|class|reservation|trip|practice|task)\b/.test(prompt)

  return reminderIntent || calendarIntent || (eventThing && datedThing)
}

function looksLikeDatabaseSavePrompt(text) {
  const prompt = String(text || "").toLowerCase()
  return /\b(save|store|remember|organize|log|keep|add to my database|add this to database|file this)\b/.test(prompt)
}

function looksLikeDatabaseFindPrompt(text) {
  const prompt = String(text || "").toLowerCase()
  const findIntent = /\b(find|get|retrieve|search|list|show|view|display|what|everything|all)\b/.test(prompt)
  const dataIntent = /\b(saved|stored|database|data|items|entries|organizer|notes|images|pictures|videos|events|documents|files)\b/.test(prompt)

  return findIntent && dataIntent
}

function looksLikeSocialNavigationPrompt(text) {
  const prompt = String(text || "").toLowerCase()
  const socialIntent =
    /\b(social media|social post|post creator|instagram|facebook|linkedin|discord|caption|captions|publish|posting|promo post|marketing post)\b/.test(prompt)
  const actionIntent =
    /\b(open|go to|take me|show|view|see|visit|use|try|create|generate|make|post|publish)\b/.test(prompt)

  return socialIntent && actionIntent
}

function looksLikePaymentNavigationPrompt(text) {
  const prompt = String(text || "").toLowerCase()
  const paymentIntent =
    /\b(algorand|algo|asa|asset transfer|payment|payments|wallet|transaction|transactions|airdrop|send funds|send asset|send algo|sign transaction|weekly airdrop|mass send)\b/.test(prompt)
  const actionIntent =
    /\b(open|go to|take me|show|view|see|visit|use|try|create|draft|make|send|sign|schedule|airdrop)\b/.test(prompt)

  return paymentIntent && actionIntent
}

function GradientText({ children, variant = "h4", sx = {} }) {
  return (
    <Typography
      variant={variant}
      sx={{
        fontFamily: "Bemora",
        letterSpacing: 1.1,
        lineHeight: 1.15,
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

function Panel({ children, sx = {} }) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid rgba(216,229,254,0.13)",
        backgroundColor: "rgba(0,0,0,0.48)",
        boxShadow: "0 18px 55px rgba(0,0,0,0.32)",
        p: { xs: 1.5, sm: 2 },
        minWidth: 0,
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}

function StatCard({ label, value, detail, icon }) {
  return (
    <Panel sx={{ p: 1.45 }}>
      <Stack direction="row" alignItems="center" spacing={1.15}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            color: "rgba(255,255,255,0.92)",
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.32), rgba(34,211,238,0.18))",
            border: "1px solid rgba(216,229,254,0.14)",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: "rgba(216,229,254,0.62)", fontSize: 11 }}>
            {label}
          </Typography>
          <Typography sx={{ color: "rgba(245,248,255,0.94)", fontWeight: 800, fontSize: 22, lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.5)", fontSize: 10.5, lineHeight: 1.2 }}>
            {detail}
          </Typography>
        </Box>
      </Stack>
    </Panel>
  )
}

function LoadingDots() {
  return (
    <Box component="span" sx={{ display: "inline-flex", gap: 0.55, alignItems: "center" }}>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          component="span"
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "rgba(216,229,254,0.82)",
            animation: `profileDot 900ms ${index * 120}ms infinite ease-in-out`,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes profileDot {
          0%, 100% { transform: translateY(0); opacity: 0.42; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </Box>
  )
}

function ProfileAssistant({
  user,
  onFocusView,
  onSavedData,
  onRefreshHint,
}) {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [turns, setTurns] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState([])
  const [previewMedia, setPreviewMedia] = useState(null)
  const [listening, setListening] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const historyRef = useRef([])
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const shouldKeepListeningRef = useRef(false)
  const selectedMediaRef = useRef([])

  const addTurn = (turn) => {
    setTurns((prev) => [...prev.slice(-7), turn])
  }

  const updateTurn = (id, result) => {
    setTurns((prev) =>
      prev.map((turn) => (turn.id === id ? { ...turn, loading: false, result } : turn))
    )
  }

  const remember = (userText, assistantText) => {
    historyRef.current = [
      ...historyRef.current,
      { role: "user", content: userText },
      { role: "assistant", content: assistantText },
    ].slice(-12)
  }

  useEffect(() => {
    selectedMediaRef.current = selectedMedia
  }, [selectedMedia])

  useEffect(() => {
    return () => {
      selectedMediaRef.current.forEach((item) => {
        try {
          URL.revokeObjectURL(item.previewUrl)
        } catch {}
      })

      try {
        shouldKeepListeningRef.current = false
        recognitionRef.current?.stop?.()
      } catch {}
    }
  }, [])

  const showAssistantNotice = (text) => {
    addTurn({
      id: `profile_notice_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      prompt: "",
      loading: false,
      result: { text },
    })
  }

  const clearSelectedMedia = () => {
    selectedMedia.forEach((item) => {
      try {
        URL.revokeObjectURL(item.previewUrl)
      } catch {}
    })
    setSelectedMedia([])
    setPreviewMedia(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeSelectedMedia = (id) => {
    setPreviewMedia((prev) => (prev?.id === id ? null : prev))
    setSelectedMedia((prev) => {
      const match = prev.find((item) => item.id === id)
      if (match) {
        try {
          URL.revokeObjectURL(match.previewUrl)
        } catch {}
      }
      return prev.filter((item) => item.id !== id)
    })
  }

  const updateSelectedMediaNote = (id, note) => {
    setSelectedMedia((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note } : item))
    )
  }

  const addMediaFiles = async (incomingFiles) => {
    const files = Array.from(incomingFiles || [])
    if (!files.length || loading) return

    const usable = []
    const rejected = []

    for (const file of files) {
      if (!isAcceptedOrganizerFile(file)) {
        rejected.push(`${file.name} is not an image or video.`)
        continue
      }

      const isVideo = file.type?.startsWith("video/")
      const maxBytes = isVideo
        ? MAX_PROFILE_ASSISTANT_VIDEO_BYTES
        : MAX_PROFILE_ASSISTANT_IMAGE_BYTES

      if (file.size > maxBytes) {
        rejected.push(`${file.name} is larger than ${isVideo ? "25MB" : "5MB"}.`)
        continue
      }

      const previewUrl = URL.createObjectURL(file)
      const metadata = await getOrganizerFileMetadata(file, previewUrl)
      usable.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(16).slice(2)}`,
        file,
        kind: getOrganizerFileKind(file),
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified || null,
        note: "",
        metadata,
        previewUrl,
      })
    }

    const currentTotalBytes = selectedMedia.reduce(
      (total, item) => total + Number(item.size || 0),
      0
    )
    const nextTotalBytes = usable.reduce(
      (total, item) => total + Number(item.size || 0),
      currentTotalBytes
    )

    if (nextTotalBytes > MAX_PROFILE_ASSISTANT_TOTAL_BYTES) {
      usable.forEach((item) => {
        try {
          URL.revokeObjectURL(item.previewUrl)
        } catch {}
      })
      showAssistantNotice("Please keep uploads under 28MB total.")
      return
    }

    const availableSlots = MAX_PROFILE_ASSISTANT_MEDIA - selectedMedia.length
    const accepted = usable.slice(0, Math.max(availableSlots, 0))
    const overflow = usable.slice(Math.max(availableSlots, 0))

    overflow.forEach((item) => {
      try {
        URL.revokeObjectURL(item.previewUrl)
      } catch {}
    })

    if (overflow.length) {
      rejected.push(`Only ${MAX_PROFILE_ASSISTANT_MEDIA} files can be added at once.`)
    }

    if (accepted.length) {
      setSelectedMedia((prev) => [...prev, ...accepted])
    }

    if (rejected.length) {
      showAssistantNotice(rejected.join(" "))
    }
  }

  const handleMediaSelection = (event) => {
    addMediaFiles(event.target.files)
    event.target.value = ""
  }

  const handleDragEnter = (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (event.dataTransfer?.types?.includes("Files")) {
      setDragActive(true)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy"
    setDragActive(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    event.stopPropagation()

    const current = event.currentTarget
    const related = event.relatedTarget
    if (!related || !current.contains(related)) {
      setDragActive(false)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    addMediaFiles(event.dataTransfer?.files)
  }

  const stopVoiceInput = () => {
    shouldKeepListeningRef.current = false

    try {
      recognitionRef.current?.abort?.()
    } catch {
      try {
        recognitionRef.current?.stop?.()
      } catch {}
    }

    recognitionRef.current = null
    setListening(false)
  }

  const toggleVoiceInput = () => {
    if (typeof window === "undefined") return

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      showAssistantNotice("Voice input is not supported in this browser.")
      return
    }

    if (listening) {
      stopVoiceInput()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onresult = (event) => {
      let transcript = ""

      for (let index = event.resultIndex || 0; index < event.results.length; index += 1) {
        const item = event.results[index]
        if (item?.isFinal) {
          transcript = `${transcript} ${item?.[0]?.transcript || ""}`.trim()
        }
      }

      if (transcript) {
        setPrompt((prev) => {
          const prefix = prev.trim()
          return prefix ? `${prefix} ${transcript}` : transcript
        })
      }
    }

    recognition.onerror = (event) => {
      if (
        event?.error === "not-allowed" ||
        event?.error === "service-not-allowed"
      ) {
        shouldKeepListeningRef.current = false
        setListening(false)
      }
    }

    recognition.onend = () => {
      if (!shouldKeepListeningRef.current) {
        setListening(false)
        return
      }

      window.setTimeout(() => {
        if (!shouldKeepListeningRef.current) return

        try {
          recognition.start()
          setListening(true)
        } catch {}
      }, 180)
    }

    recognitionRef.current = recognition
    shouldKeepListeningRef.current = true
    setListening(true)

    try {
      recognition.start()
    } catch {
      shouldKeepListeningRef.current = false
      setListening(false)
    }
  }

  const buildSelectedMediaPayload = async () =>
    Promise.all(
      selectedMedia.map(async (item) => ({
        name: item.name,
        size: item.size,
        type: item.file.type,
        kind: item.kind,
        note: item.note || "",
        lastModified: item.lastModified || null,
        metadata: item.metadata || {},
        thumbnailDataUrl: item.metadata?.thumbnailDataUrl || "",
        dataUrl: await readFileAsDataUrl(item.file),
      }))
    )

  const submitPrompt = async (event, forcedPrompt = "") => {
    event?.preventDefault?.()

    const cleanPrompt = String(forcedPrompt || prompt).trim()
    const hasMedia = selectedMedia.length > 0
    if ((!cleanPrompt && !hasMedia) || loading || !user) return

    stopVoiceInput()

    const turnId = `profile_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const clientId = getAssistantClientId()
    const history = historyRef.current
    const submittedPrompt =
      cleanPrompt ||
      `Attached ${selectedMedia.length} media item${selectedMedia.length === 1 ? "" : "s"}`
    setPrompt("")
    setLoading(true)
    addTurn({
      id: turnId,
      prompt: submittedPrompt,
      mediaCount: selectedMedia.length,
      loading: true,
      result: null,
    })

    try {
      const idToken = await user.getIdToken()
      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles"

      if (!hasMedia && looksLikeSchedulerNavigationPrompt(cleanPrompt)) {
        const answer = "I opened your scheduler workspace and linked the full Scheduler page."
        onFocusView("schedule")
        const result = {
          text: answer,
          route: { label: "Full Scheduler", href: "/components/scheduler" },
        }
        updateTurn(turnId, result)
        remember(submittedPrompt, answer)
        return
      }

      if (!hasMedia && looksLikeDatabaseNavigationPrompt(cleanPrompt)) {
        const answer = "I opened your database workspace so you can sort and review saved items."
        onFocusView("database")
        const result = { text: answer }
        updateTurn(turnId, result)
        remember(submittedPrompt, answer)
        return
      }

      if (!hasMedia && looksLikeSocialNavigationPrompt(cleanPrompt)) {
        const answer =
          "I opened your social media generator so you can use saved database images, upload images, generate a post, and publish it."
        onFocusView("social")
        const result = { text: answer }
        updateTurn(turnId, result)
        remember(submittedPrompt, answer)
        return
      }

      if (!hasMedia && looksLikePaymentNavigationPrompt(cleanPrompt)) {
        const answer =
          "I opened your Algorand payments workspace so you can draft, review, confirm, and schedule wallet transactions."
        onFocusView("payments")
        const result = { text: answer }
        updateTurn(turnId, result)
        remember(submittedPrompt, answer)
        return
      }

      if (!hasMedia && looksLikeSchedulerPrompt(cleanPrompt)) {
        const response = await fetch("/api/schedule-assistant-entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: cleanPrompt,
            idToken,
            history,
            timeZone,
            currentLocalIso: getLocalDateTimeSnapshot(),
            source: "profile-ai-scheduler",
            clientId,
          }),
        })
        const payload = await readAssistantPayload(response, "Scheduler save failed")
        const answer = payload?.answer || "I added that to your scheduler."
        const result = {
          text: answer,
          needsClarification: !!payload?.needsClarification,
          route: payload?.needsClarification
            ? null
            : payload?.route || { label: "Scheduler", href: "/components/scheduler" },
        }
        onFocusView("schedule")
        updateTurn(turnId, result)
        remember(submittedPrompt, answer)
        onRefreshHint()
        return
      }

      if (hasMedia || looksLikeDatabaseSavePrompt(cleanPrompt)) {
        const media = await buildSelectedMediaPayload()
        const response = await fetch("/api/organize-entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: cleanPrompt,
            media,
            idToken,
            source: "profile-ai-database",
            clientId,
          }),
        })
        const payload = await readAssistantPayload(response, "Database save failed")
        const item = payload?.item || null
        const answer = item?.event?.isEvent
          ? `Saved "${item.title || "this item"}" as an event you can retrieve later.`
          : `Saved "${item?.title || "this item"}" to your database.`
        const result = {
          text: answer,
          savedItems: item ? [item] : [],
        }
        onFocusView("database")
        clearSelectedMedia()
        updateTurn(turnId, result)
        remember(submittedPrompt, answer)
        onRefreshHint()
        return
      }

      const response = await fetch("/api/home-route-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanPrompt,
          idToken,
          history,
          timeZone,
          source: "profile-ai",
          clientId,
        }),
      })
      const payload = await readAssistantPayload(response, "Profile assistant failed")
      const answer =
        payload?.answer ||
        "I can help with scheduler items, saved data, database review, or useful component pages."
      const result = {
        text: answer,
        route: payload?.route || null,
        savedItems: payload?.savedItems || [],
        showSavedDataList: !!payload?.showSavedDataList,
        showSavedMedia: !!payload?.showSavedMedia,
      }

      if (looksLikeDatabaseFindPrompt(cleanPrompt) || result.savedItems.length) {
        onFocusView("database")
        onSavedData(result.savedItems)
      }

      updateTurn(turnId, result)
      remember(submittedPrompt, answer)
    } catch (error) {
      const answer =
        error?.statusCode === 429
          ? error.message
          : error?.message || "The profile AI is temporarily unavailable."
      updateTurn(turnId, { text: answer })
      remember(submittedPrompt, answer)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel sx={{ height: "100%" }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
        <AutoAwesomeRoundedIcon sx={{ color: "rgba(34,211,238,0.82)" }} />
        <Box>
          <Typography sx={{ color: "rgba(245,248,255,0.94)", fontFamily: "Helmet", fontSize: 15 }}>
            Profile AI
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.58)", fontSize: 11.5 }}>
            Add schedule events, save data, or retrieve what you stored.
          </Typography>
        </Box>
      </Stack>

      <Box
        component="form"
        onSubmit={submitPrompt}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          display: "flex",
          gap: 0.8,
          alignItems: "flex-start",
          borderRadius: 2,
          outline: dragActive
            ? "2px solid rgba(34,211,238,0.68)"
            : "2px solid transparent",
          outlineOffset: 4,
          transition: "outline-color 160ms ease, box-shadow 160ms ease",
          boxShadow: dragActive ? "0 0 0 7px rgba(34,211,238,0.1)" : "none",
        }}
      >
        <Tooltip title="Add media">
          <span>
            <IconButton
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              aria-label="Add media"
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                color: "rgba(216,229,254,0.9)",
                border: "1px solid rgba(216,229,254,0.18)",
                backgroundColor: "rgba(255,255,255,0.055)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(34,211,238,0.36)",
                },
                "&.Mui-disabled": {
                  color: "rgba(216,229,254,0.28)",
                },
              }}
            >
              <AddPhotoAlternateRoundedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </span>
        </Tooltip>

        <TextField
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="How can I help you?"
          multiline
          minRows={1}
          maxRows={6}
          fullWidth
          size="small"
          disabled={loading}
          autoComplete="off"
          InputProps={{
            sx: {
              minHeight: 42,
              alignItems: "flex-start",
              "& textarea": {
                py: 0.85,
                lineHeight: 1.35,
                overflow: "auto",
              },
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              color: "rgba(245,248,255,0.92)",
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.055)",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(216,229,254,0.16)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(34,211,238,0.36)",
            },
            "& textarea::placeholder": {
              color: "rgba(216,229,254,0.55)",
              opacity: 1,
            },
          }}
        />

        <Tooltip title={listening ? "Stop voice input" : "Speak into the field"}>
          <span>
            <IconButton
              type="button"
              onClick={toggleVoiceInput}
              disabled={loading}
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                color: listening
                  ? "rgba(255,255,255,0.96)"
                  : "rgba(216,229,254,0.9)",
                border: listening
                  ? "1px solid rgba(34,211,238,0.5)"
                  : "1px solid rgba(216,229,254,0.18)",
                backgroundColor: listening
                  ? "rgba(34,211,238,0.18)"
                  : "rgba(255,255,255,0.055)",
                "&:hover": {
                  backgroundColor: listening
                    ? "rgba(34,211,238,0.26)"
                    : "rgba(255,255,255,0.08)",
                  borderColor: "rgba(34,211,238,0.36)",
                },
                "&.Mui-disabled": {
                  color: "rgba(216,229,254,0.28)",
                },
              }}
            >
              {listening ? (
                <StopRoundedIcon sx={{ fontSize: 19 }} />
              ) : (
                <MicRoundedIcon sx={{ fontSize: 19 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Send">
          <span>
            <IconButton
              type="submit"
              disabled={loading || (!prompt.trim() && !selectedMedia.length)}
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                color: "rgba(255,255,255,0.94)",
                background:
                  "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(34,211,238,0.88))",
                "&.Mui-disabled": {
                  color: "rgba(255,255,255,0.36)",
                  background:
                    "linear-gradient(90deg, rgba(124,58,237,0.36), rgba(34,211,238,0.28))",
                },
              }}
            >
              <SendRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={handleMediaSelection}
      />

      {selectedMedia.length ? (
        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            gap: 0.8,
          }}
        >
          {selectedMedia.map((item) => (
            <Box
              key={item.id}
              sx={{
                position: "relative",
                minWidth: 0,
                borderRadius: 2,
                border: "1px solid rgba(216,229,254,0.16)",
                backgroundColor: "rgba(255,255,255,0.045)",
                p: 0.6,
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => setPreviewMedia(item)}
                sx={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  display: "block",
                  p: 0,
                  border: 0,
                  borderRadius: 1.4,
                  overflow: "hidden",
                  cursor: "zoom-in",
                  backgroundColor: "rgba(0,0,0,0.5)",
                }}
              >
                <Box
                  component={item.kind === "video" ? "video" : "img"}
                  src={item.previewUrl}
                  alt={item.kind === "video" ? undefined : item.name}
                  muted={item.kind === "video" ? true : undefined}
                  playsInline={item.kind === "video" ? true : undefined}
                  poster={
                    item.kind === "video"
                      ? item.metadata?.thumbnailDataUrl || undefined
                      : undefined
                  }
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "cover",
                  }}
                />
              </Box>
              <IconButton
                type="button"
                aria-label={`Remove ${item.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  removeSelectedMedia(item.id)
                }}
                disabled={loading}
                sx={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  width: 22,
                  height: 22,
                  color: "rgba(255,255,255,0.94)",
                  backgroundColor: "rgba(0,0,0,0.62)",
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.82)",
                  },
                }}
              >
                <CloseRoundedIcon sx={{ fontSize: 15 }} />
              </IconButton>
              {item.kind === "video" ? (
                <Typography
                  sx={{
                    position: "absolute",
                    left: 10,
                    top: 10,
                    px: 0.6,
                    py: 0.2,
                    borderRadius: 1,
                    color: "rgba(255,255,255,0.92)",
                    backgroundColor: "rgba(0,0,0,0.66)",
                    fontSize: 9,
                    lineHeight: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Video
                </Typography>
              ) : null}
              <Typography
                sx={{
                  position: "absolute",
                  left: 10,
                  right: 10,
                  bottom: 41,
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 9,
                  lineHeight: 1.1,
                  textShadow: "0 1px 6px rgba(0,0,0,0.9)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formatMediaSize(item.size)}
              </Typography>
              <TextField
                value={item.note || ""}
                onChange={(event) =>
                  updateSelectedMediaNote(item.id, event.target.value)
                }
                disabled={loading}
                placeholder="Add a note"
                size="small"
                fullWidth
                inputProps={{ maxLength: 240 }}
                sx={{
                  mt: 0.6,
                  "& .MuiInputBase-root": {
                    height: 32,
                    borderRadius: 1.2,
                    color: "rgba(245,248,255,0.9)",
                    fontSize: 11,
                    backgroundColor: "rgba(255,255,255,0.055)",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(216,229,254,0.14)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(34,211,238,0.28)",
                  },
                  "& input::placeholder": {
                    color: "rgba(216,229,254,0.46)",
                    opacity: 1,
                  },
                }}
              />
            </Box>
          ))}
        </Box>
      ) : null}

      {previewMedia ? (
        <Box
          onClick={() => setPreviewMedia(null)}
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 2400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: { xs: 1.5, sm: 3 },
            backgroundColor: "rgba(0,0,0,0.9)",
            cursor: "zoom-out",
          }}
        >
          <Box
            component={previewMedia.kind === "video" ? "video" : "img"}
            src={previewMedia.previewUrl}
            alt={previewMedia.kind === "video" ? undefined : previewMedia.name}
            controls={previewMedia.kind === "video" ? true : undefined}
            autoPlay={previewMedia.kind === "video" ? true : undefined}
            muted={previewMedia.kind === "video" ? true : undefined}
            playsInline={previewMedia.kind === "video" ? true : undefined}
            poster={
              previewMedia.kind === "video"
                ? previewMedia.metadata?.thumbnailDataUrl || undefined
                : undefined
            }
            sx={{
              display: "block",
              width: "auto",
              maxWidth: "96vw",
              height: "auto",
              maxHeight: "88vh",
              objectFit: "contain",
              borderRadius: { xs: 1.5, sm: 2 },
              boxShadow: "0 28px 90px rgba(0,0,0,0.7)",
            }}
          />
        </Box>
      ) : null}

      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.1 }}>
        {[
          "Remind me tomorrow morning",
          "Save this note to my database",
          "Find my saved data",
          "Open my scheduler",
          "Create a social media post",
          "Open Algorand payments",
        ].map((suggestion) => (
          <Button
            key={suggestion}
            disabled={loading}
            onClick={() => {
              submitPrompt(null, suggestion)
            }}
            sx={{
              minHeight: 28,
              px: 1,
              py: 0.35,
              borderRadius: "999px",
              textTransform: "none",
              color: "rgba(216,229,254,0.78)",
              border: "1px solid rgba(216,229,254,0.14)",
              fontSize: 11,
            }}
          >
            {suggestion}
          </Button>
        ))}
      </Stack>

      <Stack spacing={1} sx={{ mt: 1.35 }}>
        {turns.map((turn) => (
          <Box key={turn.id} sx={{ display: "grid", gap: 0.65 }}>
            {turn.prompt || turn.mediaCount ? (
              <Box
                sx={{
                  justifySelf: "end",
                  maxWidth: "90%",
                  borderRadius: 2,
                  px: 1,
                  py: 0.75,
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(34,211,238,0.12))",
                  border: "1px solid rgba(34,211,238,0.18)",
                }}
              >
                {turn.prompt ? (
                  <Typography sx={{ color: "rgba(245,248,255,0.92)", fontSize: 12.5, whiteSpace: "pre-wrap" }}>
                    {turn.prompt}
                  </Typography>
                ) : null}
                {turn.mediaCount ? (
                  <Typography sx={{ color: "rgba(216,229,254,0.58)", fontSize: 10.5, mt: turn.prompt ? 0.35 : 0 }}>
                    {turn.mediaCount} attachment{turn.mediaCount === 1 ? "" : "s"}
                  </Typography>
                ) : null}
              </Box>
            ) : null}
            <Box
              sx={{
                borderRadius: 2,
                px: 1,
                py: 0.8,
                backgroundColor: "rgba(255,255,255,0.055)",
                border: "1px solid rgba(216,229,254,0.1)",
              }}
            >
              {turn.loading ? (
                <LoadingDots />
              ) : (
                <Stack spacing={0.75}>
                  <Typography sx={{ color: "rgba(216,229,254,0.84)", fontSize: 12.5, lineHeight: 1.45 }}>
                    {turn.result?.text}
                  </Typography>
                  {turn.result?.route ? (
                    <Button
                      onClick={() => router.push(turn.result.route.href)}
                      endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 15 }} />}
                      sx={{
                        alignSelf: "flex-start",
                        textTransform: "none",
                        borderRadius: "999px",
                        color: "rgba(255,255,255,0.92)",
                        border: "1px solid rgba(34,211,238,0.3)",
                        fontSize: 11.5,
                      }}
                    >
                      Open {turn.result.route.label}
                    </Button>
                  ) : null}
                  {turn.result?.savedItems?.length ? (
                    <Stack spacing={0.65}>
                      {turn.result.savedItems.slice(0, 3).map((item) => (
                        <Box
                          key={item.id || item.title}
                          sx={{
                            borderRadius: 1.5,
                            p: 0.8,
                            border: "1px solid rgba(216,229,254,0.1)",
                            backgroundColor: "rgba(0,0,0,0.24)",
                          }}
                        >
                          <Typography sx={{ color: "rgba(245,248,255,0.88)", fontSize: 12, fontWeight: 700 }}>
                            {item.title || "Saved item"}
                          </Typography>
                          <Typography sx={{ color: "rgba(216,229,254,0.62)", fontSize: 11, lineHeight: 1.35 }}>
                            {item.summary || item.itemType || "Saved database item"}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              )}
            </Box>
          </Box>
        ))}
      </Stack>
    </Panel>
  )
}

function SchedulerWorkspace({ events, loading, onOpenFull }) {
  const now = new Date()
  const upcoming = events
    .filter((event) => event.start && event.start >= now)
    .sort((a, b) => a.start - b.start)
    .slice(0, 8)

  return (
    <Panel>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 1.35 }}>
        <Box>
          <Typography sx={{ color: "rgba(245,248,255,0.94)", fontFamily: "Helmet", fontSize: 16 }}>
            Scheduler
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.58)", fontSize: 11.5 }}>
            Upcoming events connected to your account.
          </Typography>
        </Box>
        <Button
          onClick={onOpenFull}
          endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 15 }} />}
          sx={{
            textTransform: "none",
            borderRadius: "999px",
            color: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(34,211,238,0.3)",
            fontSize: 11.5,
          }}
        >
          Full page
        </Button>
      </Stack>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress size={26} sx={{ color: "rgba(34,211,238,0.82)" }} />
        </Stack>
      ) : upcoming.length ? (
        <Stack spacing={0.8}>
          {upcoming.map((event) => (
            <Box
              key={event.id}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "120px 1fr auto" },
                gap: 1,
                alignItems: "center",
                borderRadius: 2,
                border: "1px solid rgba(216,229,254,0.1)",
                backgroundColor: "rgba(255,255,255,0.045)",
                px: 1,
                py: 0.9,
              }}
            >
              <Typography sx={{ color: "rgba(34,211,238,0.84)", fontSize: 12, fontWeight: 800 }}>
                {formatDateTime(event.start)}
              </Typography>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ color: "rgba(245,248,255,0.92)", fontSize: 13.5, fontWeight: 800, overflowWrap: "anywhere" }}>
                  {event.title}
                </Typography>
                {event.notes ? (
                  <Typography sx={{ color: "rgba(216,229,254,0.58)", fontSize: 11.5, lineHeight: 1.35, overflowWrap: "anywhere" }}>
                    {event.notes}
                  </Typography>
                ) : null}
              </Box>
              <Chip
                label={event.scheduleKind || "event"}
                size="small"
                sx={{
                  justifySelf: { xs: "start", sm: "end" },
                  color: "rgba(216,229,254,0.78)",
                  borderColor: "rgba(216,229,254,0.16)",
                }}
                variant="outlined"
              />
            </Box>
          ))}
        </Stack>
      ) : (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography sx={{ color: "rgba(216,229,254,0.68)" }}>
            No upcoming events yet.
          </Typography>
        </Box>
      )}
    </Panel>
  )
}

function DatabaseWorkspace({ items, loading, error = "", highlightedItems = [] }) {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortMode, setSortMode] = useState("newest")

  const typeCounts = useMemo(() => {
    const counts = new Map()
    items.forEach((item) => {
      const key = item.itemType || "note"
      counts.set(key, (counts.get(key) || 0) + 1)
    })

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [items])

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const typeOk = typeFilter === "all" || item.itemType === typeFilter
      return typeOk && matchesText(item, search)
    })

    return filtered.sort((a, b) => {
      if (sortMode === "title") return a.title.localeCompare(b.title)
      if (sortMode === "type") return a.itemType.localeCompare(b.itemType)
      return (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
    })
  }, [items, search, sortMode, typeFilter])

  const highlightedIds = new Set(highlightedItems.map((item) => item.id).filter(Boolean))

  return (
    <Panel>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.4} sx={{ mb: 1.4 }}>
        <Box>
          <Typography sx={{ color: "rgba(245,248,255,0.94)", fontFamily: "Helmet", fontSize: 16 }}>
            Database
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.58)", fontSize: 11.5 }}>
            Sort, search, and review the data you have saved.
          </Typography>
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <SearchRoundedIcon sx={{ color: "rgba(216,229,254,0.56)", fontSize: 18 }} />
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search saved data"
            size="small"
            sx={{
              minWidth: { xs: "100%", sm: 260 },
              "& .MuiOutlinedInput-root": {
                height: 36,
                color: "rgba(245,248,255,0.9)",
                borderRadius: 2,
                backgroundColor: "rgba(255,255,255,0.055)",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(216,229,254,0.14)",
              },
            }}
          />
        </Stack>
      </Stack>

      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <Chip
          label={`All ${items.length}`}
          onClick={() => setTypeFilter("all")}
          variant={typeFilter === "all" ? "filled" : "outlined"}
          sx={{
            color: "rgba(245,248,255,0.88)",
            borderColor: "rgba(216,229,254,0.16)",
            backgroundColor: typeFilter === "all" ? "rgba(34,211,238,0.14)" : "transparent",
          }}
        />
        {typeCounts.map(([type, count]) => (
          <Chip
            key={type}
            label={`${type} ${count}`}
            onClick={() => setTypeFilter(type)}
            variant={typeFilter === type ? "filled" : "outlined"}
            sx={{
              color: "rgba(216,229,254,0.82)",
              borderColor: "rgba(216,229,254,0.16)",
              backgroundColor: typeFilter === type ? "rgba(124,58,237,0.18)" : "transparent",
            }}
          />
        ))}
        <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(216,229,254,0.12)" }} />
        {[
          ["newest", "Newest"],
          ["title", "Title"],
          ["type", "Type"],
        ].map(([key, label]) => (
          <Chip
            key={key}
            icon={<SortRoundedIcon sx={{ fontSize: 15 }} />}
            label={label}
            onClick={() => setSortMode(key)}
            variant={sortMode === key ? "filled" : "outlined"}
            sx={{
              color: "rgba(216,229,254,0.82)",
              borderColor: "rgba(216,229,254,0.16)",
              backgroundColor: sortMode === key ? "rgba(34,211,238,0.12)" : "transparent",
              "& .MuiChip-icon": { color: "inherit" },
            }}
          />
        ))}
      </Stack>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress size={26} sx={{ color: "rgba(34,211,238,0.82)" }} />
        </Stack>
      ) : error ? (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography sx={{ color: "rgba(255,149,149,0.9)", fontSize: 13, lineHeight: 1.5 }}>
            {error}
          </Typography>
        </Box>
      ) : visibleItems.length ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 1,
          }}
        >
          {visibleItems.map((item) => {
            const media = getOrganizerMedia(item)
            const firstMedia = media[0]
            const highlighted = highlightedIds.has(item.id)

            return (
              <Box
                key={item.id}
                sx={{
                  minWidth: 0,
                  borderRadius: 2,
                  border: highlighted
                    ? "1px solid rgba(34,211,238,0.4)"
                    : "1px solid rgba(216,229,254,0.1)",
                  backgroundColor: highlighted
                    ? "rgba(34,211,238,0.08)"
                    : "rgba(255,255,255,0.045)",
                  p: 1,
                }}
              >
                {firstMedia?.downloadURL ? (
                  <Box
                    component={String(firstMedia.contentType || "").startsWith("video/") ? "video" : "img"}
                    src={firstMedia.downloadURL}
                    muted
                    playsInline
                    sx={{
                      width: "100%",
                      aspectRatio: "16 / 9",
                      objectFit: "cover",
                      display: "block",
                      borderRadius: 1.5,
                      mb: 0.8,
                      backgroundColor: "rgba(0,0,0,0.32)",
                    }}
                  />
                ) : null}
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: "rgba(245,248,255,0.92)", fontWeight: 800, fontSize: 13.5, overflowWrap: "anywhere" }}>
                      {item.title}
                    </Typography>
                    <Typography sx={{ color: "rgba(216,229,254,0.54)", fontSize: 10.5 }}>
                      {formatDate(item.createdAt)}
                    </Typography>
                  </Box>
                  <Chip
                    label={item.itemType || "note"}
                    size="small"
                    sx={{
                      flexShrink: 0,
                      color: "rgba(34,211,238,0.86)",
                      backgroundColor: "rgba(34,211,238,0.09)",
                    }}
                  />
                </Stack>
                <Typography sx={{ mt: 0.7, color: "rgba(216,229,254,0.7)", fontSize: 12, lineHeight: 1.45, overflowWrap: "anywhere" }}>
                  {item.summary || "No summary saved."}
                </Typography>
                {item.tags?.length ? (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.8 }}>
                    {item.tags.slice(0, 5).map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          height: 22,
                          color: "rgba(216,229,254,0.72)",
                          backgroundColor: "rgba(255,255,255,0.06)",
                          fontSize: 10.5,
                        }}
                      />
                    ))}
                  </Stack>
                ) : null}
              </Box>
            )
          })}
        </Box>
      ) : (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography sx={{ color: "rgba(216,229,254,0.68)" }}>
            No saved data was found for this signed-in account yet.
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.48)", fontSize: 12, mt: 0.5 }}>
            New items saved from the profile AI will appear here.
          </Typography>
        </Box>
      )}
    </Panel>
  )
}

function shortAddress(address) {
  const value = String(address || "")
  if (value.length <= 16) return value
  return `${value.slice(0, 8)}...${value.slice(-8)}`
}

function formatMicroAlgo(value) {
  return `${(Number(value || 0) / 1_000_000).toLocaleString("en-US", {
    maximumFractionDigits: 6,
  })} ALGO`
}

function addThousandsSeparators(value) {
  return String(value || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function formatAssetDisplayAmount(amount, decimals = 0) {
  const cleanAmount = String(amount || "0").replace(/[^\d]/g, "") || "0"
  const decimalCount = Math.max(0, Number(decimals || 0))

  if (!decimalCount) return addThousandsSeparators(cleanAmount)

  const padded = cleanAmount.padStart(decimalCount + 1, "0")
  const whole = padded.slice(0, -decimalCount) || "0"
  const fraction = padded.slice(-decimalCount).replace(/0+$/g, "")
  return fraction
    ? `${addThousandsSeparators(whole)}.${fraction}`
    : addThousandsSeparators(whole)
}

const PAYMENT_JOB_FILTERS = [
  { key: "sending", label: "Sending now" },
  { key: "scheduled", label: "Scheduled" },
  { key: "history", label: "History" },
  { key: "all", label: "All" },
]

function getPaymentJobStatus(job) {
  return String(job?.status || "queued").trim().toLowerCase()
}

function isSendingPaymentJob(job) {
  return ["running", "sending", "processing", "executing", "active", "retrying"].includes(
    getPaymentJobStatus(job)
  )
}

function isScheduledPaymentJob(job) {
  return ["scheduled", "queued", "pending", "paused", "waiting"].includes(
    getPaymentJobStatus(job)
  )
}

function isFinishedPaymentJob(job) {
  return [
    "complete",
    "completed",
    "submitted",
    "sent",
    "failed",
    "cancelled",
    "canceled",
  ].includes(getPaymentJobStatus(job))
}

function getPaymentJobTotal(job) {
  const explicitTotal = Number(job?.totalCount || job?.recipientCount || 0)
  if (explicitTotal > 0) return explicitTotal

  const plan = job?.plan || {}
  const planTotal = Number(
    plan.estimatedTransactionCount || plan.previewRecipientCount || plan.recipientCount || 0
  )
  if (planTotal > 0) return planTotal

  if (plan.action === "scheduled_transfer" || job?.kind === "scheduled") return 1
  return 0
}

function getPaymentJobProcessed(job) {
  return Number(job?.processedCount || 0)
}

function getPaymentJobFailures(job) {
  return Number(job?.failureCount || 0)
}

function getPaymentJobAttempted(job) {
  return getPaymentJobProcessed(job) + getPaymentJobFailures(job)
}

function getPaymentJobProgress(job) {
  const total = getPaymentJobTotal(job)
  if (!total) return null

  return Math.min(100, Math.round((getPaymentJobAttempted(job) / total) * 100))
}

function getPaymentJobKindLabel(job) {
  const kind = String(job?.kind || job?.action || "payment_job")
    .replace(/_/g, " ")
    .trim()

  return kind ? kind.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Payment Job"
}

function getPaymentJobUpdatedLabel(job) {
  return (
    formatDateTime(job?.heartbeatAt) ||
    formatDateTime(job?.lastActivityAt) ||
    formatDateTime(job?.updatedAt) ||
    formatDateTime(job?.startedAt) ||
    formatDateTime(job?.createdAt)
  )
}

function getPaymentJobScheduleLabel(job) {
  return (
    job?.scheduledForLocal ||
    job?.plan?.startLocal ||
    formatDateTime(job?.nextRunAt) ||
    formatDateTime(job?.scheduledFor) ||
    formatDateTime(job?.runAt) ||
    ""
  )
}

function getPaymentJobStatusColor(job) {
  const status = getPaymentJobStatus(job)
  if (isSendingPaymentJob(job)) {
    return {
      color: "rgba(34,211,238,0.92)",
      backgroundColor: "rgba(34,211,238,0.1)",
      borderColor: "rgba(34,211,238,0.24)",
    }
  }
  if (status === "failed" || status === "cancelled" || status === "canceled") {
    return {
      color: "rgba(255,149,149,0.94)",
      backgroundColor: "rgba(255,149,149,0.1)",
      borderColor: "rgba(255,149,149,0.24)",
    }
  }
  if (isFinishedPaymentJob(job)) {
    return {
      color: "rgba(134,239,172,0.9)",
      backgroundColor: "rgba(34,197,94,0.1)",
      borderColor: "rgba(34,197,94,0.24)",
    }
  }
  return {
    color: "rgba(216,229,254,0.8)",
    backgroundColor: "rgba(216,229,254,0.075)",
    borderColor: "rgba(216,229,254,0.14)",
  }
}

function PaymentMetric({ label, value }) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid rgba(216,229,254,0.1)",
        backgroundColor: "rgba(255,255,255,0.045)",
        p: 1,
        minWidth: 0,
      }}
    >
      <Typography sx={{ color: "rgba(216,229,254,0.52)", fontSize: 11 }}>
        {label}
      </Typography>
      <Typography sx={{ color: "rgba(245,248,255,0.94)", fontSize: 20, fontWeight: 900 }}>
        {value}
      </Typography>
    </Box>
  )
}

function PaymentJobCard({ job }) {
  const processed = getPaymentJobProcessed(job)
  const failures = getPaymentJobFailures(job)
  const attempted = getPaymentJobAttempted(job)
  const total = getPaymentJobTotal(job)
  const progress = getPaymentJobProgress(job)
  const scheduleLabel = getPaymentJobScheduleLabel(job)
  const updatedLabel = getPaymentJobUpdatedLabel(job)
  const statusColors = getPaymentJobStatusColor(job)
  const status = getPaymentJobStatus(job)
  const rows = [
    ["Progress", total ? `${attempted} of ${total} attempted` : `${attempted} attempted`],
    ["Processed", processed],
    ["Failures", failures],
    ["Batch size", job?.batchSize || ""],
    ["Starts", scheduleLabel],
    ["Frequency", job?.frequency || job?.plan?.frequency || ""],
    ["Updated", updatedLabel],
    ["Plan", job?.planId || ""],
    ["Job", job?.id || ""],
  ].filter(([, value]) => value !== "" && value !== null && value !== undefined)

  const txId = job?.lastTxId || job?.txId || job?.submittedTxId
  const statusMessage = job?.statusMessage || job?.workerMessage || job?.lastUpdateMessage || ""

  if (txId) rows.splice(3, 0, ["Last tx", shortAddress(txId)])
  if (job?.nextCursor) rows.splice(4, 0, ["Cursor", String(job.nextCursor).slice(0, 28)])

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid rgba(216,229,254,0.11)",
        background: isSendingPaymentJob(job)
          ? "linear-gradient(135deg, rgba(34,211,238,0.1), rgba(124,58,237,0.075))"
          : "rgba(255,255,255,0.045)",
        p: 1,
      }}
    >
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
        <Stack direction="row" spacing={0.8} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color: "rgba(255,255,255,0.92)",
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.82), rgba(34,211,238,0.68))",
            }}
          >
            <PaymentsRoundedIcon sx={{ fontSize: 17 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: "rgba(245,248,255,0.9)", fontSize: 12.7, fontWeight: 900 }}>
              {job?.plan?.summary || getPaymentJobKindLabel(job)}
            </Typography>
            <Typography sx={{ color: "rgba(216,229,254,0.54)", fontSize: 11, mt: 0.2 }}>
              {getPaymentJobKindLabel(job)}{job?.action ? ` | ${String(job.action).replace(/_/g, " ")}` : ""}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label={status}
          size="small"
          sx={{
            flexShrink: 0,
            height: 23,
            fontSize: 10.5,
            border: `1px solid ${statusColors.borderColor}`,
            color: statusColors.color,
            backgroundColor: statusColors.backgroundColor,
          }}
        />
      </Stack>

      <Box sx={{ mt: 1 }}>
        <LinearProgress
          variant={progress === null && isSendingPaymentJob(job) ? "indeterminate" : "determinate"}
          value={progress === null ? 0 : progress}
          sx={{
            height: 6,
            borderRadius: 999,
            backgroundColor: "rgba(216,229,254,0.1)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
              background:
                failures > 0
                  ? "linear-gradient(90deg, rgba(34,211,238,0.9), rgba(255,149,149,0.86))"
                  : "linear-gradient(90deg, rgba(124,58,237,0.9), rgba(34,211,238,0.9))",
            },
          }}
        />
        <Typography sx={{ color: "rgba(216,229,254,0.56)", fontSize: 10.8, mt: 0.45 }}>
          {progress === null ? "Waiting for worker progress" : `${progress}% complete`}
        </Typography>
      </Box>

      {statusMessage ? (
        <Box
          sx={{
            mt: 0.8,
            borderRadius: 1.5,
            border: "1px solid rgba(216,229,254,0.1)",
            backgroundColor: "rgba(0,0,0,0.16)",
            px: 0.8,
            py: 0.65,
          }}
        >
          <Typography sx={{ color: "rgba(216,229,254,0.68)", fontSize: 11.2, lineHeight: 1.45 }}>
            {statusMessage}
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
          gap: 0.55,
          mt: 0.9,
        }}
      >
        {rows.map(([label, value]) => (
          <Stack
            key={label}
            direction="row"
            justifyContent="space-between"
            spacing={1}
            sx={{ minWidth: 0 }}
          >
            <Typography sx={{ color: "rgba(216,229,254,0.45)", fontSize: 10.8 }}>
              {label}
            </Typography>
            <Typography
              sx={{
                color: "rgba(245,248,255,0.78)",
                fontSize: 10.8,
                textAlign: "right",
                overflowWrap: "anywhere",
                minWidth: 0,
              }}
            >
              {value}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  )
}

function PaymentJobsMonitor({ jobs }) {
  const [filter, setFilter] = useState("sending")
  const sendingJobs = jobs.filter(isSendingPaymentJob)
  const scheduledJobs = jobs.filter(isScheduledPaymentJob)
  const historyJobs = jobs.filter(isFinishedPaymentJob)
  const visibleJobs =
    filter === "sending"
      ? sendingJobs
      : filter === "scheduled"
        ? scheduledJobs
        : filter === "history"
          ? historyJobs
          : jobs

  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
          gap: 0.75,
          mb: 1.1,
        }}
      >
        <PaymentMetric label="Sending now" value={sendingJobs.length} />
        <PaymentMetric label="Scheduled / queued" value={scheduledJobs.length} />
        <PaymentMetric label="Finished" value={historyJobs.length} />
      </Box>

      <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        {PAYMENT_JOB_FILTERS.map((item) => {
          const active = filter === item.key
          return (
            <Button
              key={item.key}
              onClick={() => setFilter(item.key)}
              sx={{
                minHeight: 28,
                px: 1,
                py: 0.35,
                borderRadius: "999px",
                textTransform: "none",
                color: active ? "rgba(255,255,255,0.94)" : "rgba(216,229,254,0.74)",
                border: active
                  ? "1px solid rgba(34,211,238,0.42)"
                  : "1px solid rgba(216,229,254,0.13)",
                background: active
                  ? "linear-gradient(90deg, rgba(124,58,237,0.42), rgba(34,211,238,0.28))"
                  : "rgba(255,255,255,0.025)",
                fontSize: 11,
              }}
            >
              {item.label}
            </Button>
          )
        })}
      </Stack>

      {visibleJobs.length ? (
        <Stack spacing={0.85}>
          {visibleJobs.map((job) => (
            <PaymentJobCard key={job.id} job={job} />
          ))}
        </Stack>
      ) : (
        <Panel sx={{ p: 1.2, backgroundColor: "rgba(255,255,255,0.035)" }}>
          <Typography sx={{ color: "rgba(216,229,254,0.68)", fontSize: 12.3 }}>
            No payment jobs match this view yet.
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.48)", fontSize: 11.2, mt: 0.35 }}>
            Live updates will appear here as scheduled or batched payment workers update each job.
          </Typography>
        </Panel>
      )}
    </Box>
  )
}

function AssetIcon({ src, label }) {
  const [failed, setFailed] = useState(false)

  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color: "rgba(245,248,255,0.9)",
        background:
          "linear-gradient(135deg, rgba(124,58,237,0.38), rgba(34,211,238,0.24))",
        border: "1px solid rgba(216,229,254,0.14)",
      }}
    >
      {src && !failed ? (
        <Box
          component="img"
          src={src}
          alt={label || "Asset"}
          onError={() => setFailed(true)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <Typography sx={{ fontSize: 11, fontWeight: 900 }}>
          {String(label || "?").slice(0, 2).toUpperCase()}
        </Typography>
      )}
    </Box>
  )
}

function WalletHoldingsPanel({
  holdings,
  loading,
  error,
  onRefresh,
}) {
  const algo = holdings?.algo || null
  const assets = Array.isArray(holdings?.assets) ? holdings.assets : []
  const algoAmount = algo
    ? formatAssetDisplayAmount(algo.amount, algo.decimals)
    : "0"

  return (
    <Panel sx={{ p: 1.2, mb: 1.25, backgroundColor: "rgba(255,255,255,0.04)" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={0.8}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography sx={{ color: "rgba(245,248,255,0.9)", fontWeight: 900, fontSize: 13 }}>
            Wallet holdings
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.56)", fontSize: 11.5 }}>
            ALGO and non-zero ASA balances held by this custodial wallet.
          </Typography>
        </Box>
        <Button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          sx={{
            flexShrink: 0,
            minHeight: 28,
            px: 1,
            borderRadius: "999px",
            textTransform: "none",
            color: "rgba(216,229,254,0.76)",
            border: "1px solid rgba(216,229,254,0.14)",
            fontSize: 11,
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </Stack>

      {loading && !holdings ? (
        <Stack alignItems="center" sx={{ py: 2 }}>
          <CircularProgress size={22} sx={{ color: "rgba(34,211,238,0.82)" }} />
        </Stack>
      ) : error ? (
        <Typography sx={{ color: "rgba(255,149,149,0.9)", fontSize: 12.2, lineHeight: 1.45 }}>
          {error}
        </Typography>
      ) : (
        <Stack spacing={0.75}>
          <Box
            sx={{
              borderRadius: 2,
              border: "1px solid rgba(34,211,238,0.18)",
              background:
                "linear-gradient(135deg, rgba(34,211,238,0.09), rgba(124,58,237,0.07))",
              p: 0.9,
            }}
          >
            <Stack direction="row" spacing={0.85} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={0.85} alignItems="center" sx={{ minWidth: 0 }}>
                <AssetIcon src={algo?.iconUrl} label="ALGO" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "rgba(245,248,255,0.92)", fontWeight: 900, fontSize: 13 }}>
                    Algorand
                  </Typography>
                  <Typography sx={{ color: "rgba(216,229,254,0.55)", fontSize: 10.8 }}>
                    Native ALGO
                  </Typography>
                </Box>
              </Stack>
              <Typography sx={{ color: "rgba(245,248,255,0.94)", fontWeight: 900, fontSize: 12.5, textAlign: "right" }}>
                {algoAmount} ALGO
              </Typography>
            </Stack>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={0.75}
            sx={{ color: "rgba(216,229,254,0.58)" }}
          >
            <Chip
              label={`${assets.length} non-zero ASA${assets.length === 1 ? "" : "s"}`}
              size="small"
              sx={{
                color: "rgba(216,229,254,0.78)",
                backgroundColor: "rgba(255,255,255,0.055)",
                border: "1px solid rgba(216,229,254,0.12)",
              }}
            />
            <Chip
              label={`${holdings?.assetCount || 0} total opt-in${holdings?.assetCount === 1 ? "" : "s"}`}
              size="small"
              sx={{
                color: "rgba(216,229,254,0.7)",
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(216,229,254,0.1)",
              }}
            />
          </Stack>

          {assets.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 0.75,
              }}
            >
              {assets.map((asset) => (
                <Box
                  key={asset.assetId}
                  sx={{
                    minWidth: 0,
                    borderRadius: 2,
                    border: "1px solid rgba(216,229,254,0.1)",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    p: 0.85,
                  }}
                >
                  <Stack direction="row" spacing={0.85} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={0.85} alignItems="center" sx={{ minWidth: 0 }}>
                      <AssetIcon src={asset.iconUrl} label={asset.unitName || asset.name} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ color: "rgba(245,248,255,0.9)", fontWeight: 850, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {asset.name || `Asset ${asset.assetId}`}
                        </Typography>
                        <Typography sx={{ color: "rgba(216,229,254,0.52)", fontSize: 10.6, overflowWrap: "anywhere" }}>
                          ID {asset.assetId}{asset.unitName ? ` | ${asset.unitName}` : ""}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography sx={{ color: "rgba(245,248,255,0.88)", fontWeight: 900, fontSize: 11.5, textAlign: "right", overflowWrap: "anywhere" }}>
                      {formatAssetDisplayAmount(asset.amount, asset.decimals)}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ color: "rgba(216,229,254,0.58)", fontSize: 12 }}>
              No non-zero ASA balances were found for this wallet.
            </Typography>
          )}
        </Stack>
      )}
    </Panel>
  )
}

function AlgorandPaymentWorkspace({ user }) {
  const router = useRouter()
  const [walletDoc, setWalletDoc] = useState(null)
  const [walletLoading, setWalletLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [walletHoldings, setWalletHoldings] = useState(null)
  const [holdingsLoading, setHoldingsLoading] = useState(false)
  const [holdingsError, setHoldingsError] = useState("")
  const [holdingsRefreshKey, setHoldingsRefreshKey] = useState(0)
  const [paymentPanel, setPaymentPanel] = useState("draft")
  const [pendingPaymentClarification, setPendingPaymentClarification] = useState(null)
  const [prompt, setPrompt] = useState("")
  const [planning, setPlanning] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [plan, setPlan] = useState(null)
  const [confirmationText, setConfirmationText] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user?.uid) return undefined

    setWalletLoading(true)
    const unsubscribe = onSnapshot(
      doc(db, "algoWallets", user.uid),
      (snapshot) => {
        setWalletDoc(snapshot.exists() ? snapshot.data() || {} : null)
        setWalletLoading(false)
      },
      () => {
        setWalletDoc(null)
        setWalletLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return undefined

    const q = query(
      collection(db, "users", user.uid, "algorandPaymentJobs"),
      orderBy("createdAt", "desc"),
      limit(30)
    )
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setJobs(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))
      },
      () => setJobs([])
    )

    return () => unsubscribe()
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid || !walletDoc?.address) {
      setWalletHoldings(null)
      setHoldingsLoading(false)
      setHoldingsError("")
      return
    }

    let active = true
    setHoldingsLoading(true)
    setHoldingsError("")

    async function loadHoldings() {
      try {
        const token = await user.getIdToken()
        const response = await fetch("/api/algorand-wallet-holdings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        })
        const payload = await readAssistantPayload(
          response,
          "Could not load wallet holdings."
        )

        if (active) setWalletHoldings(payload)
      } catch (error) {
        if (!active) return
        setWalletHoldings(null)
        setHoldingsError(error?.message || "Could not load wallet holdings.")
      } finally {
        if (active) setHoldingsLoading(false)
      }
    }

    loadHoldings()

    return () => {
      active = false
    }
  }, [user?.uid, walletDoc?.address, holdingsRefreshKey])

  const planPayment = async (event, forcedPrompt = "") => {
    event?.preventDefault?.()
    const cleanPrompt = String(forcedPrompt || prompt).trim()
    if (!cleanPrompt || planning || executing) return
    const clarificationContext = forcedPrompt ? null : pendingPaymentClarification

    setPrompt("")
    setPlanning(true)
    setError("")
    setMessage("")
    setPlan(null)
    setConfirmationText("")
    setPaymentPanel("draft")

    try {
      const token = await user.getIdToken()
      const response = await fetch("/api/algorand-agent-plan", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: cleanPrompt,
          clarificationContext,
          timeZone:
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            "America/Los_Angeles",
        }),
      })
      const payload = await readAssistantPayload(
        response,
        "Could not create payment plan."
      )

      if (payload.mode === "plan") {
        setPlan(payload.plan)
        setMessage(payload.answer || "Review the payment plan.")
        setPendingPaymentClarification(null)
      } else if (payload.mode === "clarify") {
        const nextMessages = [
          ...(clarificationContext?.messages || []),
          ...(clarificationContext ? [{ role: "user", content: cleanPrompt }] : []),
          { role: "assistant", content: payload.answer || "I need one more detail." },
        ].slice(-8)

        setPendingPaymentClarification({
          originalPrompt: clarificationContext?.originalPrompt || cleanPrompt,
          messages: nextMessages,
        })
        setMessage(payload.answer || "I need more details before drafting that.")
      } else {
        setPendingPaymentClarification(null)
        setMessage(payload.answer || "I need more details before drafting that.")
      }
    } catch (err) {
      setError(err.message || "Could not create payment plan.")
    } finally {
      setPlanning(false)
    }
  }

  const executePlan = async () => {
    if (!plan?.planId || executing) return

    setExecuting(true)
    setError("")
    setMessage("")

    try {
      const token = await user.getIdToken()
      const response = await fetch("/api/algorand-agent-execute", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: plan.planId,
          confirmationText,
        }),
      })
      const payload = await readAssistantPayload(
        response,
        "Could not execute payment plan."
      )

      setMessage(
        payload.txId
          ? `${payload.answer} Transaction ID: ${payload.txId}`
          : payload.answer || "Payment job created."
      )
      if (payload.mode === "job") {
        setPaymentPanel("jobs")
      }
      setPlan(null)
      setConfirmationText("")
    } catch (err) {
      setError(err.message || "Could not execute payment plan.")
    } finally {
      setExecuting(false)
    }
  }

  const renderPlanDetails = () => {
    if (!plan) return null

    const rows = [
      ["Action", plan.action],
      ["Network", plan.network],
      ["Transactions", plan.estimatedTransactionCount || 1],
    ]

    if (plan.to) rows.push(["Recipient", shortAddress(plan.to)])
    if (plan.amountMicroAlgos) rows.push(["Amount", formatMicroAlgo(plan.amountMicroAlgos)])
    if (plan.assetId) rows.push(["Asset ID", plan.assetId])
    if (plan.assetAmount) rows.push(["Asset amount", plan.assetAmount])
    if (plan.holderAssetId) rows.push(["Holder asset", plan.holderAssetId])
    if (plan.outgoingAssetId) rows.push(["Outgoing asset", plan.outgoingAssetId])
    if (plan.startLocal) rows.push(["Starts", plan.startLocal])
    if (plan.frequency) rows.push(["Frequency", plan.frequency])

    return (
      <Panel sx={{ mt: 1.25, backgroundColor: "rgba(255,255,255,0.045)" }}>
        <Typography sx={{ color: "rgba(245,248,255,0.94)", fontWeight: 900, mb: 0.75 }}>
          Review before signing
        </Typography>
        <Typography sx={{ color: "rgba(216,229,254,0.7)", fontSize: 12.5, lineHeight: 1.55, mb: 1 }}>
          {plan.summary}
        </Typography>

        <Box sx={{ display: "grid", gap: 0.55 }}>
          {rows.map(([label, value]) => (
            <Stack key={label} direction="row" justifyContent="space-between" spacing={1}>
              <Typography sx={{ color: "rgba(216,229,254,0.5)", fontSize: 11.5 }}>
                {label}
              </Typography>
              <Typography sx={{ color: "rgba(245,248,255,0.84)", fontSize: 11.5, textAlign: "right", overflowWrap: "anywhere" }}>
                {value}
              </Typography>
            </Stack>
          ))}
        </Box>

        {plan.recipientPreview?.length ? (
          <Box sx={{ mt: 1 }}>
            <Typography sx={{ color: "rgba(216,229,254,0.54)", fontSize: 11.5, mb: 0.5 }}>
              Recipient preview ({plan.previewRecipientCount || plan.recipientPreview.length})
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {plan.recipientPreview.slice(0, 8).map((address) => (
                <Chip
                  key={address}
                  label={shortAddress(address)}
                  size="small"
                  sx={{
                    color: "rgba(216,229,254,0.78)",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    fontSize: 10.5,
                  }}
                />
              ))}
            </Stack>
          </Box>
        ) : null}

        <Divider sx={{ my: 1.25, borderColor: "rgba(216,229,254,0.1)" }} />
        <Typography sx={{ color: "rgba(216,229,254,0.62)", fontSize: 11.5, mb: 0.65 }}>
          Type this exact confirmation phrase:
        </Typography>
        <Box
          sx={{
            borderRadius: 1.5,
            border: "1px solid rgba(34,211,238,0.2)",
            backgroundColor: "rgba(34,211,238,0.07)",
            color: "rgba(245,248,255,0.92)",
            fontSize: 12,
            fontFamily: "monospace",
            p: 0.9,
            overflowWrap: "anywhere",
          }}
        >
          {plan.confirmationText}
        </Box>
        <TextField
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.target.value)}
          placeholder="Confirmation phrase"
          size="small"
          fullWidth
          sx={{
            mt: 1,
            "& .MuiOutlinedInput-root": {
              color: "rgba(245,248,255,0.92)",
              borderRadius: 2,
              backgroundColor: "rgba(0,0,0,0.34)",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(216,229,254,0.14)",
            },
          }}
        />
        <Button
          onClick={executePlan}
          disabled={executing || confirmationText !== plan.confirmationText}
          sx={{
            mt: 1,
            minHeight: 38,
            borderRadius: "999px",
            textTransform: "none",
            color: "rgba(255,255,255,0.94)",
            background:
              "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(34,211,238,0.86))",
            "&.Mui-disabled": {
              color: "rgba(255,255,255,0.35)",
              background:
                "linear-gradient(90deg, rgba(124,58,237,0.32), rgba(34,211,238,0.24))",
            },
          }}
        >
          {executing
            ? "Submitting..."
            : plan.action === "scheduled_transfer" || plan.action === "asset_holder_airdrop"
              ? "Create Payment Job"
              : "Sign and Submit"}
        </Button>
      </Panel>
    )
  }

  const sendingJobCount = jobs.filter(isSendingPaymentJob).length
  const pendingPaymentQuestion = pendingPaymentClarification?.messages
    ?.filter((message) => message.role === "assistant")
    .slice(-1)[0]?.content

  return (
    <Panel>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.3}
        sx={{ mb: 1.35 }}
      >
        <Box>
          <Typography sx={{ color: "rgba(245,248,255,0.94)", fontFamily: "Helmet", fontSize: 16 }}>
            Algorand payments
          </Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.58)", fontSize: 11.5 }}>
            Draft wallet transactions in plain language, then review before signing.
          </Typography>
        </Box>
        <Button
          onClick={() => router.push("/components/algorand-wallet-financial")}
          endIcon={<OpenInNewRoundedIcon sx={{ fontSize: 15 }} />}
          sx={{
            textTransform: "none",
            borderRadius: "999px",
            color: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(34,211,238,0.3)",
            fontSize: 11.5,
          }}
        >
          Wallet page
        </Button>
      </Stack>

      <Panel sx={{ p: 1.2, mb: 1.25, backgroundColor: "rgba(255,255,255,0.04)" }}>
        {walletLoading ? (
          <Typography sx={{ color: "rgba(216,229,254,0.68)", fontSize: 12.5 }}>
            Loading wallet...
          </Typography>
        ) : walletDoc?.address ? (
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography sx={{ color: "rgba(216,229,254,0.5)", fontSize: 11 }}>
                Custodial wallet
              </Typography>
              <Typography sx={{ color: "rgba(245,248,255,0.9)", fontSize: 12.5, overflowWrap: "anywhere" }}>
                {walletDoc.address}
              </Typography>
            </Box>
            <Chip
              label="Server-side signing"
              size="small"
              sx={{
                alignSelf: { xs: "flex-start", sm: "center" },
                color: "rgba(34,211,238,0.9)",
                backgroundColor: "rgba(34,211,238,0.08)",
              }}
            />
          </Stack>
        ) : (
          <Typography sx={{ color: "rgba(216,229,254,0.68)", fontSize: 12.5 }}>
            No Algorand wallet is saved for this account yet. Open the wallet page to generate one.
          </Typography>
        )}
      </Panel>

      {walletDoc?.address ? (
        <WalletHoldingsPanel
          holdings={walletHoldings}
          loading={holdingsLoading}
          error={holdingsError}
          onRefresh={() => setHoldingsRefreshKey((value) => value + 1)}
        />
      ) : null}

      <Stack direction="row" spacing={0.65} flexWrap="wrap" useFlexGap sx={{ mb: 1.15 }}>
        {[
          { key: "draft", label: "Draft / sign" },
          { key: "jobs", label: `Jobs${jobs.length ? ` (${jobs.length})` : ""}` },
        ].map((item) => {
          const active = paymentPanel === item.key
          return (
            <Button
              key={item.key}
              onClick={() => setPaymentPanel(item.key)}
              sx={{
                minHeight: 31,
                px: 1.15,
                py: 0.4,
                borderRadius: "999px",
                textTransform: "none",
                color: active ? "rgba(255,255,255,0.96)" : "rgba(216,229,254,0.72)",
                border: active
                  ? "1px solid rgba(34,211,238,0.42)"
                  : "1px solid rgba(216,229,254,0.13)",
                background: active
                  ? "linear-gradient(90deg, rgba(124,58,237,0.46), rgba(34,211,238,0.3))"
                  : "rgba(255,255,255,0.025)",
                fontSize: 11.5,
                fontWeight: active ? 800 : 600,
              }}
            >
              {item.label}
            </Button>
          )
        })}
        {sendingJobCount ? (
          <Chip
            label={`${sendingJobCount} live`}
            size="small"
            sx={{
              height: 29,
              color: "rgba(34,211,238,0.92)",
              backgroundColor: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.22)",
              fontSize: 10.8,
            }}
          />
        ) : null}
      </Stack>

      {paymentPanel === "draft" ? (
        <>
          {pendingPaymentClarification ? (
            <Box
              sx={{
                mb: 1,
                borderRadius: 2,
                border: "1px solid rgba(34,211,238,0.18)",
                background:
                  "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(124,58,237,0.06))",
                p: 1,
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={0.8}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "rgba(245,248,255,0.88)", fontSize: 12.3, fontWeight: 900 }}>
                    Answering clarification
                  </Typography>
                  <Typography sx={{ color: "rgba(216,229,254,0.72)", fontSize: 11.6, lineHeight: 1.45, mt: 0.25 }}>
                    {pendingPaymentQuestion || "I need one more detail to finish this payment draft."}
                  </Typography>
                  <Typography sx={{ color: "rgba(216,229,254,0.46)", fontSize: 10.6, lineHeight: 1.35, mt: 0.35, overflowWrap: "anywhere" }}>
                    Original: {pendingPaymentClarification.originalPrompt}
                  </Typography>
                </Box>
                <Button
                  type="button"
                  onClick={() => {
                    setPendingPaymentClarification(null)
                    setMessage("")
                  }}
                  sx={{
                    flexShrink: 0,
                    minHeight: 28,
                    px: 1,
                    borderRadius: "999px",
                    textTransform: "none",
                    color: "rgba(216,229,254,0.76)",
                    border: "1px solid rgba(216,229,254,0.14)",
                    fontSize: 11,
                  }}
                >
                  Start new draft
                </Button>
              </Stack>
            </Box>
          ) : null}

          <Box component="form" onSubmit={planPayment} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <TextField
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              disabled={planning || executing || !walletDoc?.address}
              multiline
              minRows={2}
              maxRows={6}
              fullWidth
              placeholder={
                pendingPaymentClarification
                  ? "Answer the clarification, for example: 500"
                  : "Example: send 0.25 ALGO to ADDRESS with note invoice 104, or schedule 5 units of asset 123 weekly..."
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "rgba(245,248,255,0.92)",
                  borderRadius: 2,
                  backgroundColor: "rgba(255,255,255,0.055)",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(216,229,254,0.16)",
                },
                "& textarea::placeholder": {
                  color: "rgba(216,229,254,0.48)",
                  opacity: 1,
                },
              }}
            />
            <Tooltip title="Create payment plan">
              <span>
                <IconButton
                  type="submit"
                  disabled={planning || executing || !prompt.trim() || !walletDoc?.address}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    color: "rgba(255,255,255,0.94)",
                    background:
                      "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(34,211,238,0.88))",
                    "&.Mui-disabled": {
                      color: "rgba(255,255,255,0.35)",
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0.32), rgba(34,211,238,0.24))",
                    },
                  }}
                >
                  <SendRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Stack direction="row" spacing={0.7} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            {[
              "Send 0.1 ALGO to an address",
              "Schedule a weekly ALGO payment",
              "Send an asset to an address",
              "Create an airdrop job for asset holders",
            ].map((suggestion) => (
              <Button
                key={suggestion}
                disabled={planning || executing || !walletDoc?.address}
                onClick={() => planPayment(null, suggestion)}
                sx={{
                  minHeight: 28,
                  px: 1,
                  py: 0.35,
                  borderRadius: "999px",
                  textTransform: "none",
                  color: "rgba(216,229,254,0.78)",
                  border: "1px solid rgba(216,229,254,0.14)",
                  fontSize: 11,
                }}
              >
                {suggestion}
              </Button>
            ))}
          </Stack>

          {planning ? (
            <Typography sx={{ mt: 1.25, color: "rgba(216,229,254,0.7)", fontSize: 12.5 }}>
              Creating a payment plan...
            </Typography>
          ) : null}
          {message ? (
            <Typography sx={{ mt: 1.25, color: "rgba(216,229,254,0.82)", fontSize: 12.5, lineHeight: 1.45 }}>
              {message}
            </Typography>
          ) : null}
          {error ? (
            <Typography sx={{ mt: 1.25, color: "rgba(255,149,149,0.9)", fontSize: 12.5, lineHeight: 1.45 }}>
              {error}
            </Typography>
          ) : null}

          {renderPlanDetails()}
        </>
      ) : (
        <Box>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={0.8}
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography sx={{ color: "rgba(245,248,255,0.9)", fontWeight: 900, fontSize: 13 }}>
                Payment job monitor
              </Typography>
              <Typography sx={{ color: "rgba(216,229,254,0.56)", fontSize: 11.5, mt: 0.2 }}>
                Review jobs being sent now, jobs waiting for their schedule, and finished work.
              </Typography>
            </Box>
            <Chip
              label="Live Firestore updates"
              size="small"
              sx={{
                color: "rgba(216,229,254,0.78)",
                backgroundColor: "rgba(255,255,255,0.055)",
                border: "1px solid rgba(216,229,254,0.12)",
                fontSize: 10.8,
              }}
            />
          </Stack>
          <PaymentJobsMonitor jobs={jobs} />
        </Box>
      )}
    </Panel>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [items, setItems] = useState([])
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsError, setItemsError] = useState("")
  const [activeView, setActiveView] = useState("overview")
  const [highlightedItems, setHighlightedItems] = useState([])
  const [refreshPulse, setRefreshPulse] = useState(0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser || null)
      setAuthReady(true)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isAccountUser(user)) {
      setEvents([])
      return
    }

    setEventsLoading(true)
    const q = query(collection(db, "scheduleEvents"), orderBy("start", "asc"))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = []
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() || {}
          if (data.ownerUid !== user.uid) return
          const event = normalizeScheduleEvent(docSnap)
          if (event.start) next.push(event)
        })
        setEvents(next)
        setEventsLoading(false)
      },
      () => {
        setEventsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user?.uid, refreshPulse])

  useEffect(() => {
    if (!isAccountUser(user)) {
      setItems([])
      setItemsLoading(false)
      setItemsError("")
      return
    }

    let active = true
    setItemsLoading(true)
    setItemsError("")

    async function loadItems() {
      try {
        const idToken = await user.getIdToken()
        const response = await fetch("/api/profile-organized-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            clientId: getAssistantClientId(),
          }),
        })
        const payload = await readAssistantPayload(
          response,
          "Could not load profile database items."
        )

        if (!active) return

        setItems(
          (Array.isArray(payload.items) ? payload.items : []).map((item) =>
            normalizeOrganizerItemData(item.id, item)
          )
        )
      } catch (error) {
        if (!active) return
        setItems([])
        setItemsError(error?.message || "Could not load profile database items.")
      } finally {
        if (active) setItemsLoading(false)
      }
    }

    loadItems()

    return () => {
      active = false
    }
  }, [user?.uid, refreshPulse])

  const upcomingCount = useMemo(() => {
    const now = new Date()
    return events.filter((event) => event.start && event.start >= now).length
  }, [events])

  const databaseTypes = useMemo(
    () => new Set(items.map((item) => item.itemType || "note")).size,
    [items]
  )

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })
      const existingUser = auth.currentUser

      if (existingUser?.isAnonymous) {
        try {
          await linkWithPopup(existingUser, provider)
        } catch (error) {
          if (
            String(error?.code || "").includes("credential-already-in-use") ||
            String(error?.code || "").includes("email-already-in-use")
          ) {
            await signInWithPopup(auth, provider)
          } else {
            throw error
          }
        }
      } else {
        await signInWithPopup(auth, provider)
      }
    } finally {
      setSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    await signOut(auth)
    setActiveView("overview")
  }

  const accountUser = isAccountUser(user)

  return (
    <>
      <Head>
        <title>Profile | Bergquist Applications</title>
        <meta
          name="description"
          content="Signed-in profile workspace for scheduler events, saved database items, and profile AI."
        />
      </Head>

      <Box
        sx={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top left, rgba(124,58,237,0.15), transparent 30%), radial-gradient(circle at top right, rgba(34,211,238,0.12), transparent 28%), #000",
          px: { xs: 1.5, sm: 3, md: 4 },
          pt: { xs: 13, sm: 14 },
          pb: { xs: 5, md: 7 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1180, mx: "auto" }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <GradientText variant="h3">Profile workspace</GradientText>
              <Typography sx={{ color: "rgba(216,229,254,0.76)", lineHeight: 1.65, maxWidth: 720, mt: 0.75 }}>
                Manage your scheduler, review your saved database, and use the profile AI to add or retrieve data.
              </Typography>
            </Box>

            {accountUser ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar
                  src={user.photoURL || ""}
                  sx={{
                    width: 42,
                    height: 42,
                    background:
                      "linear-gradient(135deg, rgba(124,58,237,0.95), rgba(34,211,238,0.9))",
                    fontWeight: 900,
                  }}
                >
                  {getInitials(user)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "rgba(245,248,255,0.92)", fontWeight: 800 }}>
                    {getDisplayName(user)}
                  </Typography>
                  <Typography sx={{ color: "rgba(216,229,254,0.56)", fontSize: 11.5 }}>
                    {user.email || "Signed in"}
                  </Typography>
                </Box>
                <Tooltip title="Sign out">
                  <IconButton
                    onClick={handleSignOut}
                    sx={{
                      color: "rgba(216,229,254,0.82)",
                      border: "1px solid rgba(216,229,254,0.14)",
                    }}
                  >
                    <LogoutRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            ) : null}
          </Stack>

          {!authReady ? (
            <Panel sx={{ py: 8, textAlign: "center" }}>
              <CircularProgress size={28} sx={{ color: "rgba(34,211,238,0.82)" }} />
            </Panel>
          ) : !accountUser ? (
            <Panel sx={{ maxWidth: 620, mx: "auto", py: 4, textAlign: "center" }}>
              <AccountCircleOutlinedIcon sx={{ color: "rgba(34,211,238,0.78)", fontSize: 44, mb: 1 }} />
              <GradientText variant="h4" sx={{ justifyContent: "center" }}>
                Sign in to use your profile
              </GradientText>
              <Typography sx={{ color: "rgba(216,229,254,0.72)", lineHeight: 1.7, mt: 1, mb: 2 }}>
                Your profile workspace is connected to your scheduler and saved database, so it needs a signed-in account.
              </Typography>
              <Button
                onClick={handleGoogleSignIn}
                disabled={signingIn}
                sx={{
                  minHeight: 42,
                  px: 2.4,
                  borderRadius: "999px",
                  textTransform: "none",
                  color: "rgba(255,255,255,0.94)",
                  background:
                    "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(34,211,238,0.88))",
                }}
              >
                {signingIn ? "Signing in..." : "Sign in with Google"}
              </Button>
            </Panel>
          ) : (
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                {[
                  ["overview", "Overview"],
                  ["schedule", "Scheduler"],
                  ["database", "Database"],
                  ["payments", "Payments"],
                  ["social", "Social"],
                ].map(([key, label]) => (
                  <Button
                    key={key}
                    onClick={() => setActiveView(key)}
                    sx={{
                      minHeight: 34,
                      px: 1.4,
                      borderRadius: "999px",
                      textTransform: "none",
                      color: "rgba(245,248,255,0.9)",
                      border: "1px solid rgba(216,229,254,0.14)",
                      backgroundColor:
                        activeView === key ? "rgba(34,211,238,0.14)" : "rgba(255,255,255,0.035)",
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", lg: "0.9fr 1.1fr" },
                  gap: 1.5,
                  alignItems: "start",
                }}
              >
                <ProfileAssistant
                  user={user}
                  onFocusView={setActiveView}
                  onSavedData={(savedItems) => setHighlightedItems(savedItems || [])}
                  onRefreshHint={() => setRefreshPulse((value) => value + 1)}
                />

                <Box sx={{ display: "grid", gap: 1.5 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                      gap: 1,
                    }}
                  >
                    <StatCard
                      label="Upcoming"
                      value={upcomingCount}
                      detail="scheduler events"
                      icon={<CalendarMonthRoundedIcon sx={{ fontSize: 20 }} />}
                    />
                    <StatCard
                      label="Database"
                      value={items.length}
                      detail="saved items"
                      icon={<DatabaseRoundedIcon sx={{ fontSize: 20 }} />}
                    />
                    <StatCard
                      label="Types"
                      value={databaseTypes}
                      detail="data categories"
                      icon={<SearchRoundedIcon sx={{ fontSize: 20 }} />}
                    />
                  </Box>

                  {(activeView === "overview" || activeView === "schedule") && (
                    <SchedulerWorkspace
                      events={events}
                      loading={eventsLoading}
                      onOpenFull={() => router.push("/components/scheduler")}
                    />
                  )}
                </Box>
              </Box>

              {activeView === "payments" && (
                <AlgorandPaymentWorkspace user={user} />
              )}

              {(activeView === "overview" || activeView === "database") && (
                <DatabaseWorkspace
                  items={items}
                  loading={itemsLoading}
                  error={itemsError}
                  highlightedItems={highlightedItems}
                />
              )}

              {activeView === "social" && (
                <SocialPostCreator embedded savedDatabaseItems={items} />
              )}
            </Stack>
          )}
        </Box>
      </Box>
    </>
  )
}
