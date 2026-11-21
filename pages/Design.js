// The original interactive homepage, preserved as the Design showcase.

import SiteLink from "../components/SiteLink"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { keyframes } from "@emotion/react"
import Head from "next/head"
import { SOCIAL_IMAGE_URL, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT } from "../lib/socialPreview"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useRouter } from "next/router"
import { Box, Button, IconButton, TextField, Tooltip, Typography } from "@mui/material"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded"
import MicRoundedIcon from "@mui/icons-material/MicRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"
import StopRoundedIcon from "@mui/icons-material/StopRounded"
import { onAuthStateChanged, signInAnonymously } from "firebase/auth"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { auth } from "../Firebase/FirebaseInit"
import { EARTH_MOON_TEXTURES } from "../lib/earthMoonAssets"
import ChatBot from "../components/chatBot"

const EarthMoonMesh = dynamic(() => import("../components/EarthMoonMesh"), { ssr: false })
const IdentityAstronaut = dynamic(() => import("../components/IdentityAstronaut"), {
  ssr: false, loading: () => <Box sx={{ minHeight: { xs: 530, sm: 650, md: 670 } }} />,
})
const MarsLandingScene = dynamic(() => import("../components/MarsLandingScene"), { ssr: false })

const splashArrival = keyframes`
  from { opacity: 0; transform: translate3d(var(--arrival-x), var(--arrival-y), 0) rotate(var(--arrival-angle)); }
  to { opacity: 1; transform: translate3d(0, 0, 0) rotate(0deg); }
`
const splashEntrance = (x, y, angle, delay) => ({
  "--arrival-x": `${x}px`, "--arrival-y": `${y}px`, "--arrival-angle": `${angle}deg`,
  animation: `${splashArrival} 1000ms cubic-bezier(.22, 1, .36, 1) ${delay}ms backwards`,
  transformOrigin: "left center",
  "&:focus-visible": { animation: "none" },
  "@media (prefers-reduced-motion: reduce)": { animation: "none" },
})

const HorizonsJourney = dynamic(() => import("../components/HorizonsJourney"), {
  ssr: false,
  loading: () => <Box sx={{ width: "100%", height: { xs: 600, sm: 700, md: 760 } }} />,
})
const PioneerCockpit = dynamic(() => import("../components/PioneerCockpit"), {
  ssr: false,
  loading: () => <Box sx={{ width: "100%", height: { xs: 720, sm: 780, md: 860, lg: 920 } }} />,
})

function RevealOnScroll({
  children,
  delay = 0,
  threshold = 0.1,
  rootMargin = "0px 0px -15% 0px",
  mountWhenVisible = false,
  placeholderMinHeight = 0,
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  const reducedMotion = useReducedMotion()

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
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: reducedMotion ? 0 : 24 }}
      transition={{ duration: reducedMotion ? 0 : 0.85, ease: "easeOut", delay: reducedMotion ? 0 : delay }}
      sx={{
        willChange: "transform, opacity",
        minHeight: !shown && mountWhenVisible ? placeholderMinHeight : undefined,
      }}
    >
      {mountWhenVisible ? (shown ? children : null) : children}
    </Box>
  )
}

function useNearViewport({
  rootMargin = "1400px 0px",
  threshold = 0.01,
  once = true,
} = {}) {
  const ref = useRef(null)
  const [isNearViewport, setIsNearViewport] = useState(false)

  useEffect(() => {
    if (isNearViewport && once) return

    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
      setIsNearViewport(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        if (entry.isIntersecting) {
          setIsNearViewport(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setIsNearViewport(false)
        }
      },
      {
        root: null,
        rootMargin,
        threshold,
      }
    )

    observer.observe(el)

    return () => {
      try {
        observer.disconnect()
      } catch {}
    }
  }, [isNearViewport, once, rootMargin, threshold])

  return [ref, isNearViewport]
}

const ManagedVideo = React.forwardRef(function ManagedVideo(
  {
    src,
    sx,
    autoPlay = true,
    muted = true,
    loop = false,
    playsInline = true,
    preload = "none",
    onEnded,
    onLoadedMetadata,
    activate = true,
    ...rest
  },
  forwardedRef
) {
  const localRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const video = localRef.current
    if (!video) return

    if (typeof forwardedRef === "function") {
      forwardedRef(video)
    } else if (forwardedRef) {
      forwardedRef.current = video
    }

    let cancelled = false

    const clearRetry = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }
    }

    const prepare = () => {
      try {
        video.muted = true
        video.defaultMuted = true
        video.playsInline = true
        video.autoplay = !!autoPlay
        video.loop = !!loop
        video.controls = false
        video.preload = preload
        video.setAttribute("muted", "")
        video.setAttribute("playsinline", "")
        video.setAttribute("webkit-playsinline", "true")
        video.setAttribute("preload", preload)
        if (autoPlay) video.setAttribute("autoplay", "")
        if (loop) video.setAttribute("loop", "")
      } catch {}
    }

    const tryPlay = async () => {
      if (cancelled || !activate) return
      prepare()

      try {
        const playPromise = video.play()
        if (playPromise && typeof playPromise.then === "function") {
          await playPromise
        }
        if (!cancelled) setIsReady(true)
      } catch {
        if (!cancelled) {
          clearRetry()
          retryTimeoutRef.current = setTimeout(tryPlay, 500)
        }
      }
    }

    const handleCanPlay = () => {
      setIsReady(true)
      if (activate) tryPlay()
    }

    const handleLoadedMetadataInternal = (e) => {
      setIsReady(true)
      if (typeof onLoadedMetadata === "function") {
        onLoadedMetadata(e)
      }
      if (activate) tryPlay()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && activate) {
        tryPlay()
      }
    }

    prepare()

    if (activate && (preload === "auto" || preload === "metadata")) {
      try {
        video.load()
      } catch {}
    }

    if (activate) {
      tryPlay()
    } else {
      try {
        video.pause()
      } catch {}
    }

    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("loadedmetadata", handleLoadedMetadataInternal)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelled = true
      clearRetry()
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("loadedmetadata", handleLoadedMetadataInternal)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      try {
        video.pause()
      } catch {}
    }
  }, [autoPlay, loop, onLoadedMetadata, forwardedRef, preload, activate])

  return (
    <Box
      ref={localRef}
      component="video"
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      preload={preload}
      controls={false}
      onEnded={onEnded}
      sx={{
        ...sx,
        opacity: isReady ? 1 : 1,
      }}
      {...rest}
    >
      {activate ? <source src={src} type="video/mp4" /> : null}
    </Box>
  )
})

function SmartPreloadVideo({
  src,
  sx,
  autoPlay = true,
  muted = true,
  loop = false,
  playsInline = true,
  onEnded,
  onLoadedMetadata,
  eager = false,
  nearViewportRootMargin = "700px 0px",
  ...rest
}) {
  const [wrapperRef, isNearViewport] = useNearViewport({
    rootMargin: nearViewportRootMargin,
    threshold: 0.01,
    once: true,
  })

  const shouldActivate = eager || isNearViewport
  const resolvedPreload = eager ? "auto" : shouldActivate ? "auto" : "none"

  return (
    <Box ref={wrapperRef} sx={{ width: "100%", height: "100%" }}>
      <ManagedVideo
        src={src}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        preload={resolvedPreload}
        activate={shouldActivate}
        onEnded={onEnded}
        onLoadedMetadata={onLoadedMetadata}
        sx={sx}
        {...rest}
      />
    </Box>
  )
}

function CircularFadeVideo({
  src,
  maxWidth = 520,
  objectPosition = "center center",
  loop = true,
  freezeAtEnd = false,
  eager = false,
  nearViewportRootMargin = "700px 0px",
}) {
  function handleEnded(e) {
    if (!freezeAtEnd) return
    const video = e.currentTarget

    try {
      const duration = Number(video.duration || 0)
      if (duration > 0) {
        video.currentTime = Math.max(0, duration - 0.05)
      }
      video.pause()
    } catch {}
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth,
        mx: "auto",
        aspectRatio: "1 / 1",
        borderRadius: "50%",
        overflow: "hidden",
        backgroundColor: "black",
        boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
      }}
    >
      <SmartPreloadVideo
        src={src}
        autoPlay
        muted
        loop={loop}
        playsInline
        eager={eager}
        nearViewportRootMargin={nearViewportRootMargin}
        onEnded={handleEnded}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "brightness(0.95) contrast(1.05)",
          transform: "translateZ(0)",
          objectPosition,
          backgroundColor: "black",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,1) 80%)",
        }}
      />
    </Box>
  )
}

const visitorHeroAssistantSuggestions = [
  "What services can I request?",
  "Show me custom components",
  "What applications can you build?",
  "How do I start a project?",
]

const visitorCategorySuggestions = {
  organize: "How does saved data work?",
  retrieve: "How can users find saved info?",
  schedule: "Show me scheduler examples",
  generate: "Can this create mockups?",
  components: "Show me custom components",
  applications: "What applications can you build?",
  commerce: "Show me commerce tools",
}

function LoadingDots({ size = 6, color = "rgba(216,229,254,0.86)" }) {
  return (
    <Box
      component="span"
      aria-label="Loading"
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.6 }}
    >
      {[0, 1, 2].map((dot) => (
        <Box
          key={dot}
          component={motion.span}
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.8,
            delay: dot * 0.14,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor: color,
            display: "inline-block",
          }}
        />
      ))}
    </Box>
  )
}

const MAX_ORGANIZER_MEDIA = 3
const MAX_ORGANIZER_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_ORGANIZER_VIDEO_BYTES = 25 * 1024 * 1024
const MAX_ORGANIZER_TOTAL_BYTES = 28 * 1024 * 1024
const ASSISTANT_HISTORY_KEY = "bergquist.homeAssistant.history.v1"
const ASSISTANT_CLIENT_ID_KEY = "bergquist.homeAssistant.clientId.v1"
const MAX_ASSISTANT_HISTORY = 12

function createAssistantClientId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `client_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function createAssistantTurnId() {
  return `turn_${Date.now()}_${Math.random().toString(36).slice(2)}`
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

function uniqueSuggestions(values) {
  const seen = new Set()

  return values.filter((value) => {
    const key = String(value || "").toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildHeroAssistantSuggestions(insights) {
  const base = visitorHeroAssistantSuggestions
  const usageSuggestions = (insights?.topCategories || [])
    .map((category) => visitorCategorySuggestions[category.key])
    .filter(Boolean)

  return uniqueSuggestions([
    base[0],
    ...usageSuggestions,
    ...base.slice(1),
  ]).slice(0, 4)
}

function normalizeAssistantHistory(entries) {
  if (!Array.isArray(entries)) return []

  return entries
    .map((entry) => ({
      role: entry?.role === "assistant" ? "assistant" : "user",
      content: String(entry?.content || "").trim().slice(0, 900),
      createdAt: entry?.createdAt || null,
    }))
    .filter((entry) => entry.content)
    .slice(-MAX_ASSISTANT_HISTORY)
}

function loadAssistantHistory() {
  if (typeof window === "undefined") return []

  try {
    return normalizeAssistantHistory(
      JSON.parse(window.localStorage.getItem(ASSISTANT_HISTORY_KEY) || "[]")
    )
  } catch {
    return []
  }
}

function saveAssistantHistory(entries) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(
      ASSISTANT_HISTORY_KEY,
      JSON.stringify(normalizeAssistantHistory(entries))
    )
  } catch {}
}

async function readAssistantPayload(response, fallbackError) {
  let payload = null

  try {
    payload = await response.json()
  } catch {}

  if (!response.ok) {
    const error = new Error(payload?.error || fallbackError)
    error.statusCode = response.status
    error.code = payload?.code || ""
    error.retryAfterSeconds = payload?.retryAfterSeconds || null
    throw error
  }

  return payload || {}
}

function getLocalDateTimeSnapshot() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, "0")

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(reader.error || new Error("Could not read image."))
    reader.readAsDataURL(file)
  })
}

function looksLikeOrganizerSavePrompt(text) {
  const prompt = String(text || "").toLowerCase()
  const explicitSave =
    /\b(save|remember|store|organize|file this|log this|keep this)\b/.test(prompt)
  const eventIntent =
    /\b(event|appointment|meeting|reservation|deadline|birthday|trip|schedule)\b/.test(prompt) &&
    /\b(today|tomorrow|next|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}|20\d{2})\b/.test(prompt)

  return explicitSave || eventIntent
}

function looksLikeImageGenerationPrompt(text) {
  const prompt = String(text || "").toLowerCase()
  const generationVerb =
    /\b(generate|create|make|design|render|draw|illustrate|mock up|mockup)\b/.test(prompt)
  const visualTarget =
    /\b(image|picture|photo|mockup|mock-up|visual|graphic|poster|flyer|banner|hero image|logo|wireframe|screenshot|ui mockup|website mockup|webpage mockup|landing page mockup|app mockup)\b/.test(prompt)
  const directMockup =
    /\b(mockup|mock-up|wireframe|visual concept|image generation)\b/.test(prompt)

  return directMockup || (generationVerb && visualTarget)
}

function looksLikeSchedulerNavigationPrompt(text) {
  const prompt = String(text || "").toLowerCase()
  const routeIntent =
    /\b(open|go to|take me|show|view|see|visit|use|try)\b/.test(prompt)
  const schedulerTarget =
    /\b(scheduler|calendar|planner|schedule page|schedule component|calendar page)\b/.test(prompt)

  return routeIntent && schedulerTarget
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

function looksLikeGeneratedImageSavePrompt(text) {
  const prompt = String(text || "").toLowerCase()
  return (
    /\b(save|store|remember|organize|keep|file)\b/.test(prompt) &&
    /\b(generated|result|mockup|image|picture|photo|this|that|it)\b/.test(prompt)
  )
}

function estimateDataUrlBytes(dataUrl) {
  const b64 = String(dataUrl || "").split(",")[1] || ""
  return Math.floor((b64.length * 3) / 4)
}

function formatMediaSize(bytes) {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatSavedItemStoredAt(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
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
      video.onloadeddata = null
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

function savedItemSection(item) {
  const firstMedia = item.images?.[0]
  const itemType = String(item.itemType || "").toLowerCase()

  if (item.event?.isEvent) return { key: "events", label: "Events" }
  if (firstMedia?.kind === "video" || String(firstMedia?.contentType || "").startsWith("video/")) {
    return { key: "videos", label: "Videos" }
  }
  if (firstMedia) return { key: "media", label: "Images and media" }
  if (/(document|receipt|ticket|menu|screenshot)/.test(itemType)) {
    return { key: "documents", label: "Documents" }
  }
  if (/(task|reminder)/.test(itemType)) return { key: "tasks", label: "Tasks" }
  return { key: "notes", label: "Notes and data" }
}

function groupSavedOrganizerItems(items) {
  const order = ["events", "media", "videos", "documents", "tasks", "notes"]
  const labels = {
    events: "Events",
    media: "Images and media",
    videos: "Videos",
    documents: "Documents",
    tasks: "Tasks",
    notes: "Notes and data",
  }
  const groups = new Map(order.map((key) => [key, []]))

  items.forEach((item) => {
    const section = savedItemSection(item)
    groups.get(section.key)?.push(item)
  })

  return order
    .map((key) => ({
      key,
      label: labels[key],
      items: groups.get(key) || [],
    }))
    .filter((section) => section.items.length)
}

function SavedOrganizerItems({ items = [], onPreview }) {
  if (!items.length) return null

  const sections = groupSavedOrganizerItems(items)

  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gap: 1.2,
        mt: 0.75,
      }}
    >
      {sections.map((section) => (
        <Box key={section.key} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 0.65,
            }}
          >
            <Typography
              sx={{
                color: "rgba(245,248,255,0.88)",
                fontFamily: "Helmet",
                fontSize: 12,
                lineHeight: 1.2,
              }}
            >
              {section.label}
            </Typography>
            <Typography
              sx={{
                color: "rgba(216,229,254,0.48)",
                fontSize: 10.5,
                lineHeight: 1.2,
              }}
            >
              {section.items.length}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: 1,
            }}
          >
            {section.items.map((item) => {
              const firstMedia = item.images?.[0]
              const firstMediaIsVideo =
                firstMedia?.kind === "video" ||
                String(firstMedia?.contentType || "").startsWith("video/")
              const detailText = item.event?.isEvent && item.event?.startDate
                ? `${item.event.startDate}${item.event.startTime ? ` at ${item.event.startTime}` : ""}`
                : item.summary
              const typeLabel = item.event?.isEvent
                ? "event"
                : item.itemType || (firstMediaIsVideo ? "video" : firstMedia ? "media" : "note")
              const storedAtLabel = formatSavedItemStoredAt(item.createdAt)

              return (
          <Box
            key={item.id || item.title}
            sx={{
              minWidth: 0,
              borderRadius: 2,
              border: "1px solid rgba(216,229,254,0.14)",
              backgroundColor: "rgba(255,255,255,0.055)",
              p: 1,
            }}
          >
            {!!firstMedia?.downloadURL && (
              <Box
                component="button"
                type="button"
                onClick={() =>
                  onPreview?.({
                    id: `${item.id || item.title}-saved-preview`,
                    kind: firstMediaIsVideo ? "video" : "image",
                    name: firstMedia.name || item.title || "Saved organizer item",
                    previewUrl: firstMedia.downloadURL,
                    metadata: firstMedia.metadata || {},
                  })
                }
                sx={{
                  display: "block",
                  width: "100%",
                  aspectRatio: "16 / 9",
                  p: 0,
                  border: 0,
                  borderRadius: 1.5,
                  overflow: "hidden",
                  mb: 0.8,
                  cursor: "zoom-in",
                  backgroundColor: "rgba(0,0,0,0.35)",
                }}
              >
                <Box
                  component={firstMediaIsVideo ? "video" : "img"}
                  src={firstMedia.downloadURL}
                  alt={firstMediaIsVideo ? undefined : item.title || "Saved organizer item"}
                  muted={firstMediaIsVideo ? true : undefined}
                  playsInline={firstMediaIsVideo ? true : undefined}
                  sx={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            )}

            <Typography
              sx={{
                color: "rgba(245,248,255,0.92)",
                fontSize: 12.5,
                fontWeight: 700,
                lineHeight: 1.25,
                overflowWrap: "anywhere",
              }}
            >
              {item.title}
            </Typography>

            {!!typeLabel && (
              <Typography
                sx={{
                  display: "inline-flex",
                  width: "fit-content",
                  mt: 0.45,
                  px: 0.55,
                  py: 0.2,
                  borderRadius: "999px",
                  color: "rgba(34,211,238,0.86)",
                  backgroundColor: "rgba(34,211,238,0.09)",
                  border: "1px solid rgba(34,211,238,0.16)",
                  fontSize: 9.5,
                  lineHeight: 1.1,
                  textTransform: "uppercase",
                }}
              >
                {typeLabel}
              </Typography>
            )}

            {!!storedAtLabel && (
              <Typography
                sx={{
                  color: "rgba(216,229,254,0.5)",
                  fontSize: 10.5,
                  lineHeight: 1.2,
                  mt: 0.45,
                }}
              >
                Stored {storedAtLabel}
              </Typography>
            )}

            <Typography
              sx={{
                color: "rgba(216,229,254,0.72)",
                fontSize: 11.5,
                lineHeight: 1.35,
                mt: 0.35,
                overflowWrap: "anywhere",
              }}
            >
              {detailText}
            </Typography>

            {!!firstMedia?.note && (
              <Typography
                sx={{
                  color: "rgba(216,229,254,0.58)",
                  fontSize: 10.5,
                  lineHeight: 1.3,
                  mt: 0.45,
                  overflowWrap: "anywhere",
                }}
              >
                {firstMedia.note}
              </Typography>
            )}
          </Box>
              )
            })}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function GeneratedImageResults({ images = [], onPreview }) {
  if (!images.length) return null

  return (
    <Box
      sx={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
        gap: 1,
        mt: 0.75,
      }}
    >
      {images.slice(0, 2).map((image) => (
        <Box
          key={image.id || image.dataUrl}
          sx={{
            position: "relative",
            minWidth: 0,
            borderRadius: 2,
            border: "1px solid rgba(216,229,254,0.16)",
            backgroundColor: "rgba(255,255,255,0.055)",
            p: 1,
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() =>
              onPreview?.({
                id: image.id,
                kind: "image",
                name: image.name || "Generated image",
                previewUrl: image.dataUrl,
                metadata: image.metadata || {},
              })
            }
            sx={{
              display: "block",
              width: "100%",
              aspectRatio: "16 / 10",
              p: 0,
              border: 0,
              borderRadius: 1.5,
              overflow: "hidden",
              cursor: "zoom-in",
              backgroundColor: "rgba(0,0,0,0.35)",
            }}
          >
            <Box
              component="img"
              src={image.dataUrl}
              alt={image.name || "Generated image"}
              sx={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mt: 0.75,
            }}
          >
            <Typography
              sx={{
                minWidth: 0,
                color: "rgba(245,248,255,0.88)",
                fontSize: 11.5,
                lineHeight: 1.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {image.name || "Generated image"}
            </Typography>

            <Tooltip title="Download image">
              <IconButton
                component="a"
                href={image.dataUrl}
                download={image.name || "generated-image.png"}
                aria-label="Download generated image"
                sx={{
                  flexShrink: 0,
                  width: 28,
                  height: 28,
                  color: "rgba(216,229,254,0.88)",
                  border: "1px solid rgba(216,229,254,0.16)",
                  backgroundColor: "rgba(0,0,0,0.34)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderColor: "rgba(34,211,238,0.36)",
                  },
                }}
              >
                <DownloadRoundedIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function AssistantConversation({
  turns = [],
  loading,
  loadingUpdates = [],
  loadingUpdateIndex = 0,
  onRoute,
  onPreview,
}) {
  if (!turns.length) return null

  return (
    <Box
      sx={{
        mt: 1.25,
        display: "grid",
        gap: 1,
      }}
    >
      {turns.map((turn) => {
        const turnResult = turn.result || {}
        const isTurnLoading = !!turn.loading
        const loadingText =
          loadingUpdates[Math.min(loadingUpdateIndex, loadingUpdates.length - 1)] ||
          "Working on it."

        return (
          <Box
            key={turn.id}
            sx={{
              display: "grid",
              gap: 0.7,
            }}
          >
            {turn.prompt ? (
              <Box
                sx={{
                  justifySelf: "end",
                  maxWidth: "88%",
                  borderRadius: 2,
                  border: "1px solid rgba(34,211,238,0.2)",
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(34,211,238,0.13))",
                  px: 1.15,
                  py: 0.85,
                }}
              >
                <Typography
                  sx={{
                    color: "rgba(245,248,255,0.94)",
                    fontSize: { xs: "0.82rem", sm: "0.88rem" },
                    lineHeight: 1.4,
                    overflowWrap: "anywhere",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {turn.prompt}
                </Typography>
                {turn.mediaCount ? (
                  <Typography
                    sx={{
                      mt: 0.35,
                      color: "rgba(216,229,254,0.56)",
                      fontSize: 10.5,
                      lineHeight: 1.2,
                    }}
                  >
                    {turn.mediaCount} attachment{turn.mediaCount === 1 ? "" : "s"}
                  </Typography>
                ) : null}
              </Box>
            ) : null}

            <Box
              sx={{
                maxWidth: "100%",
                borderRadius: 2,
                border: "1px solid rgba(216,229,254,0.16)",
                backgroundColor: "rgba(0,0,0,0.5)",
                boxShadow: "0 14px 38px rgba(0,0,0,0.35)",
                px: { xs: 1.25, sm: 1.5 },
                py: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "stretch", sm: "center" },
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography
                  sx={{
                    color: "rgba(245,248,255,0.84)",
                    lineHeight: 1.45,
                    fontSize: { xs: "0.84rem", sm: "0.9rem" },
                    textAlign: "left",
                    overflowWrap: "anywhere",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {isTurnLoading && loading ? (
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 0.75,
                      }}
                    >
                      <LoadingDots />
                      <Box
                        component="span"
                        sx={{
                          color: "rgba(216,229,254,0.7)",
                          fontSize: { xs: "0.76rem", sm: "0.82rem" },
                          lineHeight: 1.35,
                        }}
                      >
                        {loadingText}
                      </Box>
                    </Box>
                  ) : (
                    turnResult.text
                  )}
                </Typography>

                {!isTurnLoading && turnResult?.route ? (
                  <Button
                    onClick={() => onRoute?.(turnResult.route.href)}
                    endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 17 }} />}
                    sx={{
                      flexShrink: 0,
                      alignSelf: { xs: "flex-start", sm: "center" },
                      minHeight: 32,
                      px: 1.35,
                      borderRadius: "999px",
                      textTransform: "none",
                      border: "1px solid rgba(34,211,238,0.34)",
                      color: "rgba(255,255,255,0.94)",
                      fontFamily: "Helmet",
                      fontSize: 12.5,
                      backgroundColor: "rgba(34,211,238,0.12)",
                      "&:hover": {
                        backgroundColor: "rgba(34,211,238,0.2)",
                        borderColor: "rgba(34,211,238,0.52)",
                      },
                    }}
                  >
                    Open {turnResult.route.label}
                  </Button>
                ) : null}
              </Box>

              {!isTurnLoading && turnResult?.generatedImages?.length ? (
                <GeneratedImageResults
                  images={turnResult.generatedImages}
                  onPreview={onPreview}
                />
              ) : null}

              {!isTurnLoading &&
              turnResult?.savedItems?.length &&
              (turnResult?.showSavedMedia || turnResult?.showSavedDataList) ? (
                <SavedOrganizerItems
                  items={turnResult.savedItems}
                  onPreview={onPreview}
                />
              ) : null}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

function AssistantInsightsPanel({ insights, loading, onPrompt }) {
  const categories = Array.isArray(insights?.topCategories)
    ? insights.topCategories.slice(0, 5)
    : []
  const prompts = Array.isArray(insights?.topPrompts)
    ? insights.topPrompts.slice(0, 4)
    : []
  const total = Number(insights?.total || 0)
  const title = "Visitor search patterns"
  const countLabel = loading
    ? "Loading"
    : total
      ? `${total} recent`
      : "No inputs yet"

  return (
    <Box
      sx={{
        mt: 1.25,
        width: "100%",
        borderRadius: 2,
        border: "1px solid rgba(216,229,254,0.14)",
        backgroundColor: "rgba(0,0,0,0.38)",
        boxShadow: "0 14px 38px rgba(0,0,0,0.24)",
        px: { xs: 1.2, sm: 1.45 },
        py: 1.15,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: categories.length ? 0.9 : 0,
        }}
      >
        <Typography
          sx={{
            color: "rgba(245,248,255,0.9)",
            fontFamily: "Helmet",
            fontSize: { xs: 12.5, sm: 13.5 },
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            flexShrink: 0,
            color: "rgba(216,229,254,0.58)",
            fontSize: 11,
            lineHeight: 1.2,
          }}
        >
          {countLabel}
        </Typography>
      </Box>

      {categories.length ? (
        <Box sx={{ display: "grid", gap: 0.75 }}>
          {categories.map((category) => {
            const width = `${Math.max(8, Math.round((category.ratio || 0) * 100))}%`

            return (
              <Box key={category.key} sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    mb: 0.35,
                  }}
                >
                  <Typography
                    sx={{
                      color: "rgba(216,229,254,0.78)",
                      fontSize: 11,
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {category.label}
                  </Typography>
                  <Typography
                    sx={{
                      color: "rgba(216,229,254,0.48)",
                      fontSize: 10.5,
                      lineHeight: 1.2,
                    }}
                  >
                    {category.count}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 6,
                    borderRadius: "999px",
                    backgroundColor: "rgba(216,229,254,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width,
                      height: "100%",
                      borderRadius: "inherit",
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0.88), rgba(34,211,238,0.88))",
                    }}
                  />
                </Box>
              </Box>
            )
          })}
        </Box>
      ) : null}

      {prompts.length ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.75,
            mt: 1,
          }}
        >
          {prompts.map((item) => (
            <Button
              key={`${item.text}-${item.count}`}
              type="button"
              onClick={() => onPrompt?.(item.text)}
              sx={{
                minHeight: 28,
                maxWidth: "100%",
                px: 1,
                py: 0.4,
                borderRadius: "999px",
                textTransform: "none",
                color: "rgba(245,248,255,0.82)",
                border: "1px solid rgba(216,229,254,0.14)",
                backgroundColor: "rgba(255,255,255,0.055)",
                fontFamily: "Helmet",
                fontSize: 11,
                lineHeight: 1.1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                "&:hover": {
                  backgroundColor: "rgba(34,211,238,0.12)",
                  borderColor: "rgba(34,211,238,0.32)",
                },
              }}
            >
              {item.text}
            </Button>
          ))}
        </Box>
      ) : null}
    </Box>
  )
}

function HeroRouteAssistant({ placement = "hero" }) {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingUpdates, setLoadingUpdates] = useState([])
  const [loadingUpdateIndex, setLoadingUpdateIndex] = useState(0)
  const [currentUser, setCurrentUser] = useState(null)
  const [selectedImages, setSelectedImages] = useState([])
  const [generatedImages, setGeneratedImages] = useState([])
  const [assistantHistory, setAssistantHistory] = useState([])
  const [assistantTurns, setAssistantTurns] = useState([])
  const [assistantClientId, setAssistantClientId] = useState("")
  const [assistantInsights, setAssistantInsights] = useState(null)
  const [assistantInsightsLoading, setAssistantInsightsLoading] = useState(false)
  const [assistantInsightsVersion, setAssistantInsightsVersion] = useState(0)
  const [previewMedia, setPreviewMedia] = useState(null)
  const [listening, setListening] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const shouldKeepListeningRef = useRef(false)
  const selectedImagesRef = useRef([])
  const anonymousSignInAttemptedRef = useRef(false)
  const isSectionPlacement = placement === "section"
  const isPopupPlacement = placement === "popup"
  const isEmbeddedPlacement = isSectionPlacement || isPopupPlacement
  const assistantSource = isPopupPlacement
    ? "home-ai-popup"
    : isSectionPlacement
      ? "home-ai-input"
      : "home-hero"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setCurrentUser(nextUser || null)

      if (!nextUser && !anonymousSignInAttemptedRef.current) {
        anonymousSignInAttemptedRef.current = true
        signInAnonymously(auth).catch((error) => {
          console.warn("Anonymous assistant sign-in failed", error?.message || error)
        })
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    setAssistantHistory(loadAssistantHistory())
    setAssistantClientId(getAssistantClientId())
  }, [])

  useEffect(() => {
    if (!assistantClientId) return

    let active = true

    async function loadInsights() {
      setAssistantInsightsLoading(true)

      try {
        const response = await fetch("/api/home-assistant-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: assistantClientId,
          }),
        })
        const payload = await readAssistantPayload(
          response,
          "Could not load assistant input patterns."
        )

        if (active) setAssistantInsights(payload)
      } catch (error) {
        if (active) setAssistantInsights(null)
      } finally {
        if (active) setAssistantInsightsLoading(false)
      }
    }

    loadInsights()

    return () => {
      active = false
    }
  }, [assistantClientId, assistantInsightsVersion])

  const heroAssistantSuggestions = useMemo(
    () => buildHeroAssistantSuggestions(assistantInsights),
    [assistantInsights]
  )

  useEffect(() => {
    if (!loading || loadingUpdates.length <= 1) return

    const interval = window.setInterval(() => {
      setLoadingUpdateIndex((index) =>
        Math.min(index + 1, loadingUpdates.length - 1)
      )
    }, 2200)

    return () => window.clearInterval(interval)
  }, [loading, loadingUpdates])

  useEffect(() => {
    selectedImagesRef.current = selectedImages
  }, [selectedImages])

  const ensureAssistantUser = async () => {
    const existing = auth.currentUser || currentUser
    if (existing) return existing

    try {
      const credential = await signInAnonymously(auth)
      setCurrentUser(credential.user || null)
      return credential.user || null
    } catch (error) {
      console.warn("Anonymous assistant sign-in failed", error?.message || error)
      return null
    }
  }

  const pushAssistantTurn = (turn) => {
    setAssistantTurns((prev) => [...prev.slice(-7), turn])
  }

  const completeAssistantTurn = (turnId, nextResult) => {
    setResult(nextResult)
    setAssistantTurns((prev) =>
      prev.map((turn) =>
        turn.id === turnId
          ? {
              ...turn,
              loading: false,
              result: nextResult,
            }
          : turn
      )
    )
  }

  const showAssistantNotice = (text) => {
    const nextResult = {
      route: null,
      savedItems: [],
      text,
    }
    setResult(nextResult)
    pushAssistantTurn({
      id: createAssistantTurnId(),
      prompt: "",
      mediaCount: 0,
      loading: false,
      result: nextResult,
    })
  }

  useEffect(() => {
    return () => {
      selectedImagesRef.current.forEach((image) => {
        try {
          URL.revokeObjectURL(image.previewUrl)
        } catch {}
      })

      try {
        shouldKeepListeningRef.current = false
        recognitionRef.current?.stop?.()
      } catch {}
    }
  }, [])

  const clearSelectedImages = () => {
    selectedImages.forEach((image) => {
      try {
        URL.revokeObjectURL(image.previewUrl)
      } catch {}
    })
    setSelectedImages([])
    setPreviewMedia(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeSelectedImage = (id) => {
    setPreviewMedia((prev) => (prev?.id === id ? null : prev))

    setSelectedImages((prev) => {
      const image = prev.find((item) => item.id === id)
      if (image) {
        try {
          URL.revokeObjectURL(image.previewUrl)
        } catch {}
      }

      return prev.filter((item) => item.id !== id)
    })
  }

  const updateSelectedMediaNote = (id, note) => {
    setSelectedImages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note } : item))
    )
  }

  const handleImageButtonClick = async () => {
    const user = await ensureAssistantUser()

    if (!user) {
      showAssistantNotice("Please try again in a moment before adding media.")
      return
    }

    fileInputRef.current?.click()
  }

  const addMediaFiles = async (incomingFiles) => {
    const files = Array.from(incomingFiles || [])
    if (!files.length) return

    const user = await ensureAssistantUser()

    if (!user) {
      showAssistantNotice("Please try again in a moment before adding media.")
      return
    }

    const usable = []
    const rejected = []

    for (const file of files) {
      if (!isAcceptedOrganizerFile(file)) {
        rejected.push(`${file.name} is not an image or video.`)
        continue
      }

      const isVideo = file.type?.startsWith("video/")
      const maxBytes = isVideo ? MAX_ORGANIZER_VIDEO_BYTES : MAX_ORGANIZER_IMAGE_BYTES

      if (file.size > maxBytes) {
        rejected.push(
          `${file.name} is larger than ${isVideo ? "25MB" : "5MB"}.`
        )
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

    const currentTotalBytes = selectedImages.reduce(
      (total, item) => total + Number(item.size || 0),
      0
    )
    const nextTotalBytes = usable.reduce(
      (total, item) => total + Number(item.size || 0),
      currentTotalBytes
    )

    if (nextTotalBytes > MAX_ORGANIZER_TOTAL_BYTES) {
      usable.forEach((item) => {
        try {
          URL.revokeObjectURL(item.previewUrl)
        } catch {}
      })
      showAssistantNotice("Please keep uploads under 28MB total.")
      return
    }

    const availableSlots = MAX_ORGANIZER_MEDIA - selectedImages.length
    const accepted = usable.slice(0, Math.max(availableSlots, 0))
    const overflow = usable.slice(Math.max(availableSlots, 0))

    overflow.forEach((item) => {
      try {
        URL.revokeObjectURL(item.previewUrl)
      } catch {}
    })

    if (overflow.length) {
      rejected.push(`Only ${MAX_ORGANIZER_MEDIA} files can be added at once.`)
    }

    if (accepted.length) {
      setSelectedImages((prev) => [...prev, ...accepted])
    }

    if (rejected.length) {
      showAssistantNotice(rejected.join(" "))
    }
  }

  const handleImageSelection = (event) => {
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
      selectedImages.map(async (item) => ({
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

  const buildGeneratedMediaPayload = (images = generatedImages) =>
    images.map((image) => ({
      name: image.name || "generated-image.png",
      size: image.size || estimateDataUrlBytes(image.dataUrl),
      type: image.contentType || "image/png",
      kind: "image",
      note: image.prompt ? `Generated from: ${image.prompt}` : "Generated image",
      lastModified: Date.now(),
      metadata: {
        ...(image.metadata || {}),
        generated: true,
      },
      dataUrl: image.dataUrl,
    }))

  const saveOrganizerEntry = async ({
    cleanPrompt,
    media,
    source,
    clientId = assistantClientId || getAssistantClientId(),
  }) => {
    const user = await ensureAssistantUser()

    if (!user) {
      showAssistantNotice(
        "Please try again in a moment before saving media, raw data, or scheduled items."
      )
      return null
    }

    const idToken = await user.getIdToken()
    const response = await fetch("/api/organize-entry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: cleanPrompt,
        media,
        idToken,
        source,
        clientId,
      }),
    })

    const payload = await readAssistantPayload(response, "Organizer save failed")

    return payload?.item || null
  }

  const startAssistantLoading = (updates) => {
    setLoadingUpdates(updates)
    setLoadingUpdateIndex(0)
    setLoading(true)
    setResult(null)
  }

  const setAssistantLoadingUpdates = (updates) => {
    setLoadingUpdates(updates)
    setLoadingUpdateIndex(0)
  }

  const rememberAssistantExchange = (userText, assistantText) => {
    const userContent = String(userText || "").trim()
    const assistantContent = String(assistantText || "").trim()
    if (!userContent && !assistantContent) return

    setAssistantHistory((prev) => {
      const next = normalizeAssistantHistory([
        ...prev,
        ...(userContent
          ? [{ role: "user", content: userContent, createdAt: new Date().toISOString() }]
          : []),
        ...(assistantContent
          ? [
              {
                role: "assistant",
                content: assistantContent,
                createdAt: new Date().toISOString(),
              },
            ]
          : []),
      ])
      saveAssistantHistory(next)
      return next
    })

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        setAssistantInsightsVersion((version) => version + 1)
      }, 700)
    }
  }

  const submitPrompt = async (value) => {
    const cleanPrompt = String(value ?? prompt).trim()
    const hasMedia = selectedImages.length > 0
    if ((!cleanPrompt && !hasMedia) || loading) return
    stopVoiceInput()
    setPrompt("")

    const turnId = createAssistantTurnId()
    const submittedMediaCount = selectedImages.length
    const submittedPrompt =
      cleanPrompt ||
      (submittedMediaCount
        ? `Attached ${submittedMediaCount} media item${
            submittedMediaCount === 1 ? "" : "s"
          }`
        : "")
    const historyContext = assistantHistory
    const requestClientId = assistantClientId || getAssistantClientId()
    if (!assistantClientId && requestClientId) {
      setAssistantClientId(requestClientId)
    }
    const assistantUser = currentUser || (await ensureAssistantUser())

    pushAssistantTurn({
      id: turnId,
      prompt: submittedPrompt,
      mediaCount: submittedMediaCount,
      loading: true,
      result: null,
    })

    startAssistantLoading([
      "Reading your request.",
      "Deciding what kind of help fits best.",
      "Preparing the next step.",
    ])

    try {
      const shouldSaveGeneratedImage =
        !hasMedia &&
        generatedImages.length > 0 &&
        looksLikeGeneratedImageSavePrompt(cleanPrompt)

      if (shouldSaveGeneratedImage) {
        setAssistantLoadingUpdates([
          "Preparing the generated image.",
          "Saving it to your organizer.",
          "Indexing it so you can find it later.",
        ])
        const media = buildGeneratedMediaPayload()
        const item = await saveOrganizerEntry({
          cleanPrompt,
          media,
          source: `${assistantSource}-generated-image-save`,
          clientId: requestClientId,
        })

        if (!item) {
          const assistantText =
            "I couldn't save that to your organizer right now. Please try again in a moment."
          completeAssistantTurn(turnId, {
            route: null,
            savedItems: [],
            text: assistantText,
          })
          rememberAssistantExchange(cleanPrompt, assistantText)
          return
        }

        setGeneratedImages([])
        const nextResult = {
          route: null,
          showSavedMedia: true,
          text: `Saved "${item?.title || "the generated image"}" to your organizer.`,
          savedItems: item ? [item] : [],
        }
        completeAssistantTurn(turnId, nextResult)
        rememberAssistantExchange(
          cleanPrompt,
          `Saved "${item?.title || "the generated image"}" to your organizer.`
        )
        return
      }

      const shouldContinueImageClarification =
        result?.needsClarification &&
        result?.clarificationFor === "image_generation"
      const shouldContinueSchedulerClarification =
        result?.needsClarification &&
        result?.clarificationFor === "scheduler"
      const shouldScheduleEntry =
        looksLikeSchedulerPrompt(cleanPrompt) ||
        shouldContinueSchedulerClarification

      if (shouldScheduleEntry) {
        setAssistantLoadingUpdates([
          "Reading the reminder details.",
          "Working out the date and time.",
          "Adding it to your scheduler.",
        ])

        if (!assistantUser) {
          const signInText = "Please try again in a moment before adding reminders to your scheduler."
          completeAssistantTurn(turnId, {
            prompt: cleanPrompt,
            route: null,
            savedItems: [],
            text: signInText,
          })
          rememberAssistantExchange(cleanPrompt, signInText)
          return
        }

        const idToken = await assistantUser.getIdToken()
        const timeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "America/Los_Angeles"
        const response = await fetch("/api/schedule-assistant-entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: cleanPrompt,
            idToken,
            history: historyContext,
            timeZone,
            currentLocalIso: getLocalDateTimeSnapshot(),
            source: `${assistantSource}-scheduler`,
            clientId: requestClientId,
          }),
        })

        const payload = await readAssistantPayload(response, "Scheduler save failed")

        const assistantText =
          payload?.answer ||
          "I added that to your scheduler."

        completeAssistantTurn(turnId, {
          prompt: cleanPrompt,
          route: payload?.needsClarification
            ? null
            : payload?.route || {
                label: "Scheduler",
                href: "/components/scheduler",
              },
          savedItems: [],
          needsClarification: !!payload?.needsClarification,
          clarificationFor: payload?.clarificationFor || null,
          text: assistantText,
        })
        rememberAssistantExchange(cleanPrompt, assistantText)
        return
      }

      const shouldGenerateImage =
        looksLikeImageGenerationPrompt(cleanPrompt) ||
        shouldContinueImageClarification

      if (shouldGenerateImage) {
        setAssistantLoadingUpdates([
          "Preparing reference media.",
          assistantUser
            ? "Checking your saved images for useful references."
            : "Using any attached images as references.",
          "Generating the image with OpenAI.",
          "Preparing the preview.",
        ])
        const media = await buildSelectedMediaPayload()
        const idToken = assistantUser ? await assistantUser.getIdToken() : ""
        const response = await fetch("/api/generate-home-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: cleanPrompt,
            media,
            idToken,
            history: historyContext,
            source: `${assistantSource}-image-generator`,
            clientId: requestClientId,
          }),
        })

        const payload = await readAssistantPayload(response, "Image generation failed")

        const nextGeneratedImages = Array.isArray(payload?.images)
          ? payload.images
          : []
        const assistantText =
          payload?.answer ||
          (payload?.needsClarification
            ? "Can you share a little more detail before I generate it?"
            : "Generated an image from your request.")

        if (payload?.needsClarification) {
          setGeneratedImages([])
          completeAssistantTurn(turnId, {
            prompt: cleanPrompt,
            route: null,
            showSavedMedia: false,
            generatedImages: [],
            savedItems: [],
            needsClarification: true,
            clarificationFor: payload?.clarificationFor || "image_generation",
            text: assistantText,
          })
          rememberAssistantExchange(cleanPrompt, assistantText)
          return
        }

        clearSelectedImages()
        setGeneratedImages(nextGeneratedImages)
        completeAssistantTurn(turnId, {
          prompt: cleanPrompt,
          route: null,
          showSavedMedia: false,
          generatedImages: nextGeneratedImages,
          savedItems: [],
          text: assistantText,
        })
        rememberAssistantExchange(cleanPrompt, assistantText)
        return
      }

      const shouldSaveEntry = hasMedia || looksLikeOrganizerSavePrompt(cleanPrompt)

      if (shouldSaveEntry) {
        setAssistantLoadingUpdates([
          "Preparing the attached media.",
          "Saving it to your organizer.",
          "Reading and indexing details for later search.",
        ])
        const media = await buildSelectedMediaPayload()
        const item = await saveOrganizerEntry({
          cleanPrompt,
          media,
          source: `${assistantSource}-organizer`,
          clientId: requestClientId,
        })

        if (!item) {
          const assistantText =
            "I couldn't save that to your organizer right now. Please try again in a moment."
          completeAssistantTurn(turnId, {
            route: null,
            savedItems: [],
            text: assistantText,
          })
          rememberAssistantExchange(cleanPrompt, assistantText)
          return
        }

        clearSelectedImages()
        const assistantText = item?.event?.isEvent
          ? `Saved "${item.title}" as an event you can retrieve later.`
          : `Saved "${item?.title || "this entry"}" to your organizer.`
        completeAssistantTurn(turnId, {
          route: null,
          showSavedMedia: true,
          text: assistantText,
          savedItems: item ? [item] : [],
        })
        rememberAssistantExchange(cleanPrompt, assistantText)
        return
      }

      const idToken = assistantUser ? await assistantUser.getIdToken() : ""
      setAssistantLoadingUpdates([
        "Checking your request.",
        assistantUser
          ? "Looking for relevant saved organizer entries."
          : "Choosing between an answer and a page suggestion.",
        "Writing a response.",
      ])
      const response = await fetch("/api/home-route-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanPrompt,
          source: assistantSource,
          idToken,
          history: historyContext,
          timeZone:
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            "America/Los_Angeles",
          clientId: requestClientId,
        }),
      })

      const payload = await readAssistantPayload(
        response,
        "OpenAI route assistant failed"
      )

      completeAssistantTurn(turnId, {
        prompt: cleanPrompt,
        route: payload?.route || null,
        showSavedMedia: !!payload?.showSavedMedia,
        showSavedDataList: !!payload?.showSavedDataList,
        savedItems: payload?.savedItems || [],
        needsClarification: !!payload?.needsClarification,
        clarificationFor: payload?.clarificationFor || null,
        text:
          payload?.answer ||
          "I can help with that. Try asking about components, applications, finance tools, or starting a project.",
      })
      rememberAssistantExchange(
        cleanPrompt,
        payload?.answer ||
          "I can help with that. Try asking about components, applications, finance tools, or starting a project."
      )
    } catch (error) {
      console.error(error)
      const errorText =
        error?.statusCode === 429
          ? error.message
          : "The AI assistant is temporarily unavailable. Please try again in a moment."
      completeAssistantTurn(turnId, {
        prompt: cleanPrompt,
        route: null,
        savedItems: [],
        text: errorText,
      })
      rememberAssistantExchange(cleanPrompt, errorText)
    } finally {
      setLoading(false)
      setLoadingUpdates([])
      setLoadingUpdateIndex(0)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    submitPrompt()
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: isEmbeddedPlacement ? 0.8 : 1.8,
        ease: "easeOut",
        delay: isEmbeddedPlacement ? 0 : 4.1,
      }}
      sx={{
        width: "100%",
        maxWidth: isEmbeddedPlacement ? "100%" : 760,
        mx: "auto",
        mt: isEmbeddedPlacement ? 0 : { xs: 18, sm: 19, md: 20 },
        px: isEmbeddedPlacement ? 0 : { xs: 1.5, sm: 0 },
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          display: "flex",
          gap: 1,
          alignItems: "flex-start",
          width: "100%",
          borderRadius: 2,
          outline: dragActive
            ? "2px solid rgba(34,211,238,0.68)"
            : "2px solid transparent",
          outlineOffset: 4,
          transition: "outline-color 160ms ease, box-shadow 160ms ease",
          boxShadow: dragActive
            ? "0 0 0 7px rgba(34,211,238,0.12)"
            : "none",
        }}
      >
        <Tooltip
          title={
            currentUser
              ? "Add media"
              : "Sign in before adding media"
          }
        >
          <span>
            <IconButton
              type="button"
              onClick={handleImageButtonClick}
              disabled={loading}
              aria-label="Add media"
              sx={{
                width: 48,
                height: 48,
                borderRadius: 1,
                color: currentUser
                  ? "rgba(216,229,254,0.9)"
                  : "rgba(216,229,254,0.42)",
                border: "1px solid rgba(216,229,254,0.18)",
                backgroundColor: "rgba(0,0,0,0.5)",
                boxShadow: "0 16px 42px rgba(0,0,0,0.34)",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderColor: "rgba(34,211,238,0.36)",
                },
                "&.Mui-disabled": {
                  color: "rgba(216,229,254,0.28)",
                },
              }}
            >
              <AddPhotoAlternateRoundedIcon sx={{ fontSize: 21 }} />
            </IconButton>
          </span>
        </Tooltip>

        <TextField
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={
            isEmbeddedPlacement
              ? "Describe what you want to build or search for"
              : "How can I help you?"
          }
          autoComplete="off"
          fullWidth
          multiline
          minRows={1}
          maxRows={6}
          size="small"
          InputProps={{
            sx: {
              minHeight: 48,
              alignItems: "flex-start",
              color: "rgba(245,248,255,0.92)",
              fontFamily: "FallingSky",
              borderRadius: 1,
              backgroundColor: "rgba(0,0,0,0.56)",
              boxShadow: "0 16px 42px rgba(0,0,0,0.42)",
              "& textarea": {
                py: 1.25,
                lineHeight: 1.35,
                overflow: "auto",
              },
            },
          }}
          sx={{
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(216,229,254,0.2)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(216,229,254,0.34)",
            },
            "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(34,211,238,0.58)",
            },
            "& textarea::placeholder": {
              color: "rgba(216,229,254,0.62)",
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
                width: 48,
                height: 48,
                borderRadius: 1,
                color: listening
                  ? "rgba(255,255,255,0.96)"
                  : "rgba(216,229,254,0.9)",
                border: listening
                  ? "1px solid rgba(34,211,238,0.5)"
                  : "1px solid rgba(216,229,254,0.18)",
                backgroundColor: listening
                  ? "rgba(34,211,238,0.18)"
                  : "rgba(0,0,0,0.5)",
                boxShadow: "0 16px 42px rgba(0,0,0,0.34)",
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
                <StopRoundedIcon sx={{ fontSize: 21 }} />
              ) : (
                <MicRoundedIcon sx={{ fontSize: 21 }} />
              )}
            </IconButton>
          </span>
        </Tooltip>

        <Button
          type="submit"
          aria-label="Send"
          disabled={loading}
          sx={{
            minWidth: 50,
            width: 50,
            height: 48,
            borderRadius: 1,
            background:
              "linear-gradient(90deg, rgba(124,58,237,0.92) 0%, rgba(79,70,229,0.92) 35%, rgba(34,211,238,0.92) 100%)",
            color: "rgba(255,255,255,0.95)",
            boxShadow: "0 16px 42px rgba(0,0,0,0.42)",
            "&:hover": {
              background:
                "linear-gradient(90deg, rgba(124,58,237,1) 0%, rgba(79,70,229,1) 35%, rgba(34,211,238,1) 100%)",
            },
            "&.Mui-disabled": {
              color: "rgba(255,255,255,0.42)",
              background:
                "linear-gradient(90deg, rgba(124,58,237,0.42) 0%, rgba(79,70,229,0.42) 35%, rgba(34,211,238,0.42) 100%)",
            },
          }}
        >
          <SendRoundedIcon sx={{ fontSize: 18 }} />
        </Button>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={handleImageSelection}
      />

      {selectedImages.length ? (
        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            gap: 1,
            justifyContent: "center",
          }}
        >
          {selectedImages.map((image) => (
            <Box
              key={image.id}
              sx={{
                position: "relative",
                minWidth: 0,
                borderRadius: 2,
                border: "1px solid rgba(216,229,254,0.18)",
                backgroundColor: "rgba(0,0,0,0.55)",
                boxShadow: "0 12px 32px rgba(0,0,0,0.34)",
                p: 0.65,
              }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => setPreviewMedia(image)}
                sx={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  display: "block",
                  p: 0,
                  border: 0,
                  borderRadius: 1.4,
                  overflow: "hidden",
                  cursor: "zoom-in",
                  backgroundColor: "rgba(0,0,0,0.48)",
                }}
              >
                <Box
                  component={image.kind === "video" ? "video" : "img"}
                  src={image.previewUrl}
                  alt={image.kind === "video" ? undefined : image.name}
                  muted={image.kind === "video" ? true : undefined}
                  playsInline={image.kind === "video" ? true : undefined}
                  poster={
                    image.kind === "video"
                      ? image.metadata?.thumbnailDataUrl || undefined
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
                aria-label={`Remove ${image.name}`}
                onClick={(event) => {
                  event.stopPropagation()
                  removeSelectedImage(image.id)
                }}
                disabled={loading}
                sx={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  width: 22,
                  height: 22,
                  color: "rgba(255,255,255,0.94)",
                  backgroundColor: "rgba(0,0,0,0.6)",
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.82)",
                  },
                }}
              >
                <CloseRoundedIcon sx={{ fontSize: 15 }} />
              </IconButton>
              {image.kind === "video" ? (
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
                    letterSpacing: 0.4,
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
                  bottom: 42,
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 9,
                  lineHeight: 1.1,
                  textShadow: "0 1px 6px rgba(0,0,0,0.9)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {formatMediaSize(image.size)}
              </Typography>
              <TextField
                value={image.note || ""}
                onChange={(event) =>
                  updateSelectedMediaNote(image.id, event.target.value)
                }
                disabled={loading}
                placeholder="Add a note"
                size="small"
                fullWidth
                inputProps={{ maxLength: 240 }}
                sx={{
                  mt: 0.65,
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

      <AnimatePresence>
        {previewMedia ? (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
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
      </AnimatePresence>

      <AssistantConversation
        turns={assistantTurns}
        loading={loading}
        loadingUpdates={loadingUpdates}
        loadingUpdateIndex={loadingUpdateIndex}
        onRoute={(href) => router.push(href)}
        onPreview={setPreviewMedia}
      />

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 1,
          mt: 1.25,
        }}
      >
        {heroAssistantSuggestions.map((suggestion) => (
          <Button
            key={suggestion}
            disabled={loading}
            onClick={() => {
              setPrompt(suggestion)
              submitPrompt(suggestion)
            }}
            sx={{
              minHeight: 32,
              px: 1.35,
              py: 0.6,
              borderRadius: "999px",
              textTransform: "none",
              border: "1px solid rgba(216,229,254,0.18)",
              backgroundColor: "rgba(0,0,0,0.42)",
              color: "rgba(216,229,254,0.82)",
              fontFamily: "Helmet",
              fontSize: { xs: 11.5, sm: 12.5 },
              lineHeight: 1.15,
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.08)",
                borderColor: "rgba(34,211,238,0.36)",
              },
              "&.Mui-disabled": {
                color: "rgba(216,229,254,0.36)",
                borderColor: "rgba(216,229,254,0.1)",
              },
            }}
          >
            {suggestion}
          </Button>
        ))}
      </Box>

      <AssistantInsightsPanel
        insights={assistantInsights}
        loading={assistantInsightsLoading}
        onPrompt={(text) => {
          setPrompt(text)
          submitPrompt(text)
        }}
      />
    </Box>
  )
}

export default function SplashVideoHero({
  line1 = "Website Design Examples",
  line2 = "",
  videoSrc = "/home/splash.mp4",
  minHeight = "100vh",
  maxWidth = 1200,
}) {
  const SITE_NAME = "Bergquist Applications"
  const [selectedCrew, setSelectedCrew] = useState("eva")
  const [splashReady, setSplashReady] = useState(false)
  const handleSplashReady = useCallback(() => setSplashReady(true), [])
  const SITE_URL = "https://bergquistapplications.com"
  const PAGE_URL = `${SITE_URL}/Design`

  const TITLE = `Website Design Examples | ${SITE_NAME}`
  const DESCRIPTION =
    "Explore interactive 3D scenes and design examples that can give your website its own character."

  const OG_IMAGE = SOCIAL_IMAGE_URL

  const categories = useMemo(
    () => [
      {
        title: "Data",
        model: "data",
        desc:
          "Build a reliable data foundation with clean pipelines, integrations, and dashboards — so you can make faster, informed decisions.",
      },
      {
        title: "Finance",
        model: "finance",
        desc:
          "Design and deliver secure, auditable financial workflows — payments, reconciliation, and reporting.",
      },
      {
        title: "AI",
        model: "ai",
        desc:
          "Automate workflows, improve accuracy, and scale operations - free your team to focus on high-value initiatives.",
      },
    ],
    []
  )

  const sectionPx = { xs: 2, sm: 3, md: 4 }
  const sectionGap = { xs: 3, md: 4 }
  const sectionPt = { xs: 6, sm: 7, md: 8 }
  const sectionPb = { xs: 6, sm: 7, md: 8 }
  const finalSectionPb = { xs: 8, sm: 10, md: 12 }

  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  }

  const jsonLdWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  }

  return (
    <Box sx={{ width: "100%", backgroundColor: "black" }}>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="canonical" href={PAGE_URL} />
        <link rel="preload" as="image" href="/home/splash/earth-moon-desktop.webp" media="(min-width: 700px)" />
        <link rel="preload" as="image" href="/home/splash/earth-moon-phone.webp" media="(max-width: 699px)" />
        {EARTH_MOON_TEXTURES.map(({ src }) => <link key={src} rel="preload" as="image" type="image/webp" href={src} crossOrigin="anonymous" />)}
        <link rel="preload" as="font" type="font/ttf" href="/fonts/Bemora.ttf" crossOrigin="anonymous" />
        <link rel="preload" as="font" type="font/otf" href="/fonts/Helmet.otf" crossOrigin="anonymous" />

        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
        <meta name="googlebot" content="index,follow" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:secure_url" content={OG_IMAGE} />
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </Head>

      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "black",
        }}
      >
        <Box data-splash-ready={String(splashReady)}
          sx={{ position: "relative", width: "100%", maxWidth, minHeight, overflow: "hidden", backgroundColor: "black" }}>
          <Box component="picture" data-splash-poster aria-hidden={splashReady ? "true" : undefined}
            sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <source media="(max-width: 699px)" srcSet="/home/splash/earth-moon-phone.webp" />
            <Box component="img" src="/home/splash/earth-moon-desktop.webp" width={1200} height={900}
              alt="Earth and its orbiting Moon against a star field" fetchpriority="high" loading="eager"
              sx={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              opacity: splashReady ? 1 : 0,
              transition: "opacity 220ms ease-out",
              "@media (prefers-reduced-motion: reduce)": { transition: "none" },
              "& [data-earth-moon-mesh='true']": {
                height: "100%",
                minHeight: "100%",
              },
            }}
          >
            <EarthMoonMesh onReady={handleSplashReady} />
          </Box>

          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.18) 45%, transparent 60%)",
            }}
          />

          <Box
            sx={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              height: "100%",
              minHeight,
              pointerEvents: "none",
              "& a, & button, & h1, & p": { pointerEvents: "auto" },
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "space-between",
              pt: { xs: 14, sm: 16, md: 18 },
              pb: { xs: 7, sm: 8, md: 9 },
              px: { xs: 3, sm: 6, md: 8 },
              textAlign: "left",
            }}
          >
            <Box sx={{ width: "100%", maxWidth: 720 }}>
              <Typography
                data-splash-arrival="brand"
                sx={{
                  ...splashEntrance(-10, -6, -.35, 100),
                  mb: { xs: 1.6, sm: 2.2 },
                  color: "rgba(216, 229, 254, 0.78)",
                  fontSize: { xs: 11, sm: 12 },
                  fontWeight: 900,
                  letterSpacing: { xs: 2.2, sm: 3.4 },
                  textTransform: "uppercase",
                }}
              >
                Bergquist Applications
              </Typography>
              <Typography
                component="h1"
                data-splash-arrival="title"
                sx={{
                  ...splashEntrance(-16, 8, -.45, 350),
                  fontFamily: "Bemora",
                  fontSize: { xs: "1.9rem", sm: "2.65rem", md: "3.55rem" },
                  letterSpacing: 0,
                  lineHeight: 1.12,
                  backgroundImage:
                    "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 14px 42px rgba(0,0,0,0.72)",
                  maxWidth: { xs: 280, sm: 440, md: 520 },
                  overflowWrap: "normal",
                }}
              >
                {line1}
                {line2 ? (
                  <Box
                    component="span"
                    sx={{
                      display: "block",
                      backgroundImage:
                        "linear-gradient(90deg, #7C3AED 0%, #4F46E5 45%, #22D3EE 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {line2}
                  </Box>
                ) : null}
              </Typography>

              <Typography
                data-splash-arrival="description"
                sx={{
                  mt: { xs: 2.4, sm: 3 },
                  ...splashEntrance(12, 10, .3, 600),
                  maxWidth: 560,
                  color: "rgba(216, 229, 254, 0.88)",
                  fontSize: { xs: 16, sm: 18, md: 21 },
                  lineHeight: 1.7,
                }}
              >
                Explore website design ideas with moving 3D scenes and hands-on examples.
                See how your website can feel unique while staying easy to use.
              </Typography>

              <Box
                sx={{
                  mt: { xs: 3, sm: 4 },
                  display: "flex",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  component={SiteLink}
                  href="/components"
                  data-splash-arrival="explore"
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    ...splashEntrance(-8, 14, -.5, 850),
                    minHeight: 54,
                    px: 3,
                    borderRadius: 1,
                    fontFamily: "Helmet",
                    fontWeight: 900,
                    letterSpacing: 1.4,
                    color: "rgba(5,7,15,0.96)",
                    background:
                      "linear-gradient(90deg, rgba(124,58,237,0.95) 0%, rgba(79,70,229,0.96) 48%, rgba(34,211,238,0.96) 100%)",
                    boxShadow: "0 22px 58px rgba(0,0,0,0.42)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  Explore Components
                </Button>
                <Button
                  component={SiteLink}
                  href="/contact"
                  data-splash-arrival="contact"
                  sx={{
                    ...splashEntrance(10, 12, .5, 1100),
                    minHeight: 54,
                    px: 3,
                    borderRadius: 1,
                    fontFamily: "Helmet",
                    fontWeight: 900,
                    letterSpacing: 1.4,
                    color: "rgba(216,229,254,0.9)",
                    border: "1px solid rgba(216,229,254,0.24)",
                    backgroundColor: "rgba(0,0,0,0.32)",
                    boxShadow: "0 22px 58px rgba(0,0,0,0.28)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      backgroundColor: "rgba(255,255,255,0.06)",
                    },
                  }}
                >
                  Start a Project
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "black",
          px: sectionPx,
          pt: { xs: 4, sm: 5, md: 6 },
          pb: { xs: 4, sm: 5, md: 6 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth }}>
          <Box
            component="section"
            id="digital-identity"
            aria-labelledby="digital-identity-title"
            sx={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1.4fr) minmax(0, 0.85fr)" },
              "& > :first-child": { order: { xs: 1, md: 0 } },
              gap: sectionGap,
              alignItems: "center",
            }}
          >
            <RevealOnScroll
              delay={0.08}
              mountWhenVisible
              rootMargin={splashReady ? "500px 0px" : "0px"}
              threshold={0}
              placeholderMinHeight={{ xs: 530, sm: 650, md: 670 }}
            >
              <IdentityAstronaut onCrewChange={setSelectedCrew} />
            </RevealOnScroll>

            <RevealOnScroll delay={0.12}>
              <Box sx={{ px: { xs: 2.25, sm: 3, md: 1 }, textAlign: "left" }}>
                <Typography
                  sx={{
                    color: "rgba(216, 229, 254, 0.68)",
                    fontSize: { xs: 11, sm: 12 },
                    fontWeight: 900,
                    letterSpacing: { xs: 2.1, sm: 3 },
                    textAlign: "left",
                    textTransform: "uppercase",
                    mb: 1.15,
                  }}
                >
                  First Impressions
                </Typography>

                <Typography
                  component="h2"
                  id="digital-identity-title"
                  sx={{
                    fontFamily: "Bemora",
                    fontSize: { xs: "1.72rem", sm: "2.28rem", md: "1.9rem", lg: "2.62rem" },
                    letterSpacing: 0,
                    lineHeight: 1.08,
                    textAlign: "left",
                    backgroundImage:
                      "linear-gradient(90deg, #7C3AED 0%, #4F46E5 42%, #22D3EE 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    textShadow: "0 10px 30px rgba(0,0,0,0.64)",
                    overflowWrap: "normal",
                    mb: 1.35,
                  }}
                >
                  Establishing Your Digital Identity
                </Typography>

                <Typography
                  sx={{
                    textAlign: "left",
                    color: "rgba(216, 229, 254, 0.84)",
                    fontSize: { xs: 15.5, sm: 16.5, md: 17 },
                    lineHeight: 1.72,
                    maxWidth: 660,
                    mx: 0,
                  }}
                >
                  Your digital identity is how customers understand your business
                  at a glance. Bergquist Applications shapes that presence so
                  your website feels aligned with your goals.
                </Typography>
              </Box>
            </RevealOnScroll>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "black",
          px: sectionPx,
          pt: { xs: 4, sm: 5, md: 6 },
          pb: { xs: 5, sm: 6, md: 7 },
        }}
      >
        <Box id="new-possibilities" sx={{ width: "100%", maxWidth }}>
          <RevealOnScroll delay={0.06} mountWhenVisible placeholderMinHeight={560} rootMargin="500px 0px" threshold={0}>
            <Box
              component="section"
              aria-labelledby="new-possibilities-title"
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "minmax(0, 1fr)",
                  md: "minmax(0, 0.92fr) minmax(0, 1.08fr)",
                },
                gridTemplateAreas: { xs: '"copy" "scene"', md: '"copy scene"' },
                gap: { xs: 2.5, sm: 3, md: 4 },
                alignItems: "stretch",
              }}
            >
              <Box
                sx={{
                  gridArea: "scene",
                  position: "relative",
                  minWidth: 0,
                  minHeight: { xs: 380, sm: 420, md: 520 },
                  "& [data-planet-mesh-canvas='mars']": {
                    filter: "saturate(1.08) contrast(1.05)",
                  },
                }}
              >
                <MarsLandingScene crewId={selectedCrew} />
              </Box>

              <Box
                sx={{
                  gridArea: "copy",
                  minWidth: 0,
                  p: { xs: 2.25, sm: 3, md: 4 },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: { xs: 1.5, md: 1.8 },
                }}
              >
                <Typography
                  sx={{
                    color: "rgba(216, 229, 254, 0.68)",
                    fontSize: { xs: 11, sm: 12 },
                    fontWeight: 900,
                    letterSpacing: { xs: 2.1, sm: 3 },
                    textTransform: "uppercase",
                  }}
                >
                  Digital Strategy
                </Typography>

                <Typography
                  component="h2"
                  id="new-possibilities-title"
                  sx={{
                    fontFamily: "Bemora",
                    fontSize: { xs: "1.72rem", sm: "2.28rem", md: "1.9rem", lg: "2.62rem" },
                    letterSpacing: 0,
                    lineHeight: 1.06,
                    backgroundImage:
                      "linear-gradient(90deg, #7C3AED 0%, #4F46E5 42%, #22D3EE 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    textShadow: "0 10px 30px rgba(0,0,0,0.64)",
                    overflowWrap: "normal",
                  }}
                >
                  Discovering New Possibilities
                </Typography>

                <Typography
                  sx={{
                    color: "rgba(216, 229, 254, 0.84)",
                    fontSize: { xs: 15.5, sm: 16.5, md: 17 },
                    lineHeight: 1.72,
                    maxWidth: 620,
                  }}
                >
                  Bergquist Applications studies how your business works in the
                  real world, then builds digital systems that make those daily
                  flows more manageable. The strategy is crafting the right components
                  that maximize your digital presence.
                </Typography>
              </Box>
            </Box>
          </RevealOnScroll>
        </Box>
      </Box>

      <Box component="section" id="pioneer-cockpit" aria-label="Pioneer flight deck"
        sx={{ width: "100%", minWidth: 0, bgcolor: "black", px: sectionPx, pt: { xs: 3, md: 5 }, scrollMarginTop: 80 }}>
        <Box sx={{ width: "100%", maxWidth, mx: "auto" }}>
          <RevealOnScroll delay={0.04} mountWhenVisible placeholderMinHeight={720} rootMargin="500px 0px" threshold={0}>
              <PioneerCockpit crewId={selectedCrew}
                description="Imagine a system built around where you want to go. The right combination of components can simplify your everyday work and support the next stage of your journey." />
          </RevealOnScroll>
        </Box>
      </Box>

      <Box component="section" id="home-ai-assistant" aria-label="AI assistant"
        sx={{ width: "100%", minWidth: 0, bgcolor: "black", px: sectionPx, pt: sectionPt, scrollMarginTop: 80 }}>
        <Box sx={{ width: "100%", maxWidth, mx: "auto", px: { xs: 2.25, sm: 3, md: 4 } }}>
          <ChatBot embedded defaultExpanded hideToggle source="home-expanded-chatbot" />
        </Box>
      </Box>

      <Box
        component="section"
        id="expand-horizons"
        aria-label="Expand your horizons"
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          backgroundColor: "black",
          px: sectionPx,
          pt: sectionPt,
          pb: finalSectionPb,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: sectionGap,
            alignItems: "center",
          }}
        >
          <RevealOnScroll delay={0.05}>
            <Box sx={{ px: { xs: 2.25, sm: 3, md: 4 }, textAlign: "left" }}>
              <Typography
                component="h2"
                sx={{
                  fontFamily: "Bemora",
                  fontSize: { xs: "1.72rem", sm: "2.28rem", md: "2.62rem" },
                  letterSpacing: 0,
                  lineHeight: 1.08,
                  textAlign: "left",
                  backgroundImage:
                    "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                  overflowWrap: "normal",
                  mb: 1.25,
                }}
              >
                Expand your horizons
              </Typography>

              <Typography
                sx={{
                  textAlign: "left",
                  color: "rgba(216, 229, 254, 0.84)",
                  fontSize: { xs: 15.5, sm: 16.5, md: 17 },
                  lineHeight: 1.72,
                  maxWidth: 620,
                  mx: 0,
                  letterSpacing: 0,
                }}
              >
                Contact Bergquist Applications to see what modern web development can do for you.
              </Typography>
              <Button
                component={SiteLink}
                href="/contact"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  mt: { xs: 2.5, sm: 3 },
                  minHeight: 54,
                  maxWidth: "100%",
                  px: 3,
                  borderRadius: 1,
                  fontFamily: "Helmet",
                  fontWeight: 900,
                  letterSpacing: 0,
                  color: "rgba(5,7,15,0.96)",
                  background:
                    "linear-gradient(90deg, rgba(124,58,237,0.95) 0%, rgba(79,70,229,0.96) 48%, rgba(34,211,238,0.96) 100%)",
                  boxShadow: "0 22px 58px rgba(0,0,0,0.42)",
                  "&:hover": { transform: "translateY(-2px)" },
                  "&.Mui-focusVisible": { outline: "2px solid #d8e5fe", outlineOffset: 4 },
                  "@media (prefers-reduced-motion: reduce)": { "&:hover": { transform: "none" } },
                }}
              >
                Start a Project
              </Button>
            </Box>
          </RevealOnScroll>

          <RevealOnScroll delay={0.12} mountWhenVisible placeholderMinHeight={700} rootMargin="500px 0px" threshold={0}>
            <HorizonsJourney crewId={selectedCrew} />
          </RevealOnScroll>
        </Box>
      </Box>
    </Box>
  )
}
