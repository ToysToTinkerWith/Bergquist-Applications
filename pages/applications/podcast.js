import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Box,
  Typography,
  TextField,
  LinearProgress,
  Divider,
  Stack,
  useMediaQuery,
} from "@mui/material"
import { useTheme } from "@mui/material/styles"
import { motion } from "framer-motion"
import {
  addDoc,
  collection,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore"
import { db } from "../../Firebase/FirebaseInit"

// Auth
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"

const ADMIN_EMAIL = "abergquist96@gmail.com"
const LIMIT_TIMEZONE = "America/Los_Angeles"

const BASIC_MAX_PODCASTS_PER_DAY = 5
const BASIC_MAX_REQUESTED_SECONDS_PER_DAY = 60 * 60 // 1 hour

function dayKeyLA(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LIMIT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const get = (type) => parts.find((p) => p.type === type)?.value
  return `${get("year")}-${get("month")}-${get("day")}`
}

function parseDurationToSeconds(input) {
  const s = String(input || "").trim().toLowerCase()
  const m = s.match(/^(\d+(\.\d+)?)(s|m|h)?$/)
  if (!m) throw new Error(`Invalid length: "${input}"`)
  const value = Number(m[1])
  const unit = m[3] || "s"
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid length: "${input}"`)
  if (unit === "s") return Math.round(value)
  if (unit === "m") return Math.round(value * 60)
  if (unit === "h") return Math.round(value * 3600)
  throw new Error(`Invalid unit in length: "${input}"`)
}

function formatSecondsShort(sec) {
  const s = Math.max(0, Math.round(Number(sec || 0)))
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m <= 0) return `${r}s`
  if (r === 0) return `${m}m`
  return `${m}m ${r}s`
}

/**
 * ✅ CHANGED: rounds seconds before formatting
 */
function prettySeconds(s) {
  const n = Math.round(Number(s || 0)) // ✅ round output seconds
  if (!Number.isFinite(n) || n <= 0) return ""
  const m = Math.floor(n / 60)
  const r = n % 60
  if (m <= 0) return `${r}s`
  return `${m}m ${r}s`
}

function formatWhen(ts) {
  try {
    const d =
      ts?.toDate?.() ||
      (typeof ts === "number" ? new Date(ts) : null) ||
      (ts?.seconds ? new Date(ts.seconds * 1000) : null)
    if (!d || isNaN(d.getTime())) return ""
    return d.toLocaleString()
  } catch {
    return ""
  }
}

function statusLabel(job) {
  const status = job?.status || "unknown"
  const pct = Math.max(0, Math.min(100, Number(job?.progress?.percent ?? 0)))
  const phase = job?.progress?.phase || ""
  const message = job?.progress?.message || ""
  const parts = []
  parts.push(status)
  if (phase) parts.push(`• ${phase}`)
  if (Number.isFinite(pct)) parts.push(`• ${pct}%`)
  if (message) parts.push(`• ${message}`)
  return parts.join(" ")
}

function toMillis(ts) {
  if (!ts) return 0
  if (typeof ts?.toMillis === "function") return ts.toMillis()
  if (typeof ts?.seconds === "number") return ts.seconds * 1000
  if (typeof ts === "number") return ts
  return 0
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function truncateTo100(s) {
  const t = String(s || "").trim()
  if (!t) return ""
  if (t.length <= 100) return t
  return t.slice(0, 99).trimEnd() + "…"
}

/**
 * Reveal that never stalls hidden for dynamically-added list items.
 */
function RevealOnScroll({
  children,
  delay = 0,
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
  triggerKey = "",
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    setShown(false)
  }, [triggerKey])

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

    let didSet = false
    const safeShow = () => {
      if (didSet) return
      didSet = true
      setShown(true)
    }

    try {
      const obs = new IntersectionObserver(
        (entries) => {
          const entry = entries?.[0]
          if (entry?.isIntersecting) {
            safeShow()
            try {
              obs.disconnect()
            } catch {}
          }
        },
        { threshold, root: null, rootMargin }
      )

      obs.observe(el)
      const t = setTimeout(() => safeShow(), 900)

      return () => {
        clearTimeout(t)
        try {
          obs.disconnect()
        } catch {}
      }
    } catch {
      setShown(true)
    }
  }, [shown, threshold, rootMargin])

  return (
    <Box
      ref={ref}
      component={motion.div}
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0.001, y: 10 }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
      sx={{ willChange: "transform, opacity" }}
    >
      {children}
    </Box>
  )
}

/**
 * ✅ NEW: pass expanded state + toggle handler down from parent
 */
function JobCard({
  job,
  gradient,
  cardBg,
  dense = false,
  tiny = false,
  isTopicExpanded = false,
  onToggleTopic,
}) {
  const pct = clamp(Number(job?.progress?.percent ?? 0), 0, 100)
  const status = statusLabel(job)
  const audioUrl = job?.audioUrl || ""
  const topic = String(job?.topic || "")

  const isCompleted = job?.status === "completed" && !!audioUrl
  const created = job?.createdAt ? `Created: ${formatWhen(job.createdAt)}` : ""
  const updated = job?.updatedAt ? `Updated: ${formatWhen(job.updatedAt)}` : ""

  const pad = tiny ? 1.6 : dense ? 2.0 : 2.75
  const metaFont = tiny ? 10.5 : dense ? 11 : 12
  const subFont = tiny ? 12 : 13

  const hasLongTopic = topic.trim().length > 100
  const shownTopic = isTopicExpanded ? (topic.trim() || "(untitled topic)") : truncateTo100(topic || "(untitled topic)")

  return (
    <Box
      sx={{
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        background: cardBg,
        boxShadow: tiny ? "0 10px 35px rgba(0,0,0,0.55)" : "0 18px 55px rgba(0,0,0,0.65)",
      }}
    >
      <Box sx={{ height: 3, backgroundImage: gradient, opacity: 0.9 }} />

      <Box sx={{ p: { xs: pad, sm: pad, md: 2.75 } }}>
        <Box sx={{ minWidth: 0 }}>
          {/* ✅ topic basic font + collapse/expand */}
          <Typography
            sx={{
              fontFamily: "inherit",
              color: "rgba(216, 229, 254, 0.92)",
              mb: hasLongTopic ? 0.25 : 0.5,
              lineHeight: 1.35,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
            }}
            title={topic}
          >
            {shownTopic}
          </Typography>

          {hasLongTopic && (
            <Box sx={{ mb: 0.5 }}>
              <Box
                component={motion.button}
                onClick={onToggleTopic}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(0,0,0,0.22)",
                  color: "rgba(216, 229, 254, 0.86)",
                  borderRadius: 999,
                  padding: tiny ? "6px 10px" : "6px 12px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: tiny ? 11.5 : 12,
                  letterSpacing: 0.2,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
                aria-label={isTopicExpanded ? "Collapse topic" : "Expand topic"}
                title={isTopicExpanded ? "Collapse" : "Expand"}
                type="button"
              >
                {isTopicExpanded ? "Collapse" : "Expand topic"}
              </Box>
            </Box>
          )}

          <Typography sx={{ color: "rgba(216, 229, 254, 0.70)", fontSize: subFont, lineHeight: 1.5 }}>
            {status}
          </Typography>

          <Box sx={{ mt: 1.05 }}>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                height: tiny ? 7 : 8,
                borderRadius: 99,
                backgroundColor: "rgba(255,255,255,0.10)",
                "& .MuiLinearProgress-bar": {
                  backgroundImage: gradient,
                  borderRadius: 99,
                },
              }}
            />
          </Box>
        </Box>

        {/* ✅ Default browser audio player (play/pause + menu) */}
        {isCompleted && (
          <Box
            sx={{
              mt: 1.25,
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 999,
              background: "rgba(0,0,0,0.18)",
              px: tiny ? 1.1 : 1.25,
              py: tiny ? 0.8 : 1.0,
            }}
          >
            <audio
              controls
              preload="metadata"
              src={audioUrl}
              style={{
                width: "100%",
                height: 34,
                display: "block",
              }}
            />
          </Box>
        )}

        <Box
          sx={{
            mt: 1.0,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 0.6, sm: 1.2 },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Typography sx={{ color: "rgba(216, 229, 254, 0.58)", fontSize: metaFont }}>
            Len: <b>{job?.lengthArg || "?"}</b>{" "}
            {Number.isFinite(Number(job?.totalSeconds)) ? (
              <span style={{ opacity: 0.92 }}>
                • Output: <b>{prettySeconds(job.totalSeconds)}</b>
              </span>
            ) : null}
          </Typography>

          {!tiny && (
            <Typography sx={{ color: "rgba(216, 229, 254, 0.46)", fontSize: metaFont - 1 }}>
              {created}
              {created && updated ? " • " : ""}
              {updated}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default function PodcastJobCreator({
  maxWidth = 1200,
  minHeight = "100vh",
  title = "Generate a Podcast",
  subtitle = "Enter a topic and a length. The backend will generate audio and update progress here in realtime.",
}) {
  const gradient = "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)"

  const theme = useTheme()
  const downSm = useMediaQuery(theme.breakpoints.down("sm"))
  const downXs = useMediaQuery("(max-width:420px)")
  const denseCards = downSm
  const tinyCards = downXs

  const auth = useMemo(() => getAuth(), [])
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [authErr, setAuthErr] = useState("")

  const [topic, setTopic] = useState("")
  const [lengthArg, setLengthArg] = useState("10m")

  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState("")

  const [jobs, setJobs] = useState([])
  const [jobsErr, setJobsErr] = useState("")

  const [quota, setQuota] = useState({
    dayKey: dayKeyLA(new Date()),
    usedPodcasts: 0,
    usedRequestedSeconds: 0,
    remainingPodcasts: BASIC_MAX_PODCASTS_PER_DAY,
    remainingSeconds: BASIC_MAX_REQUESTED_SECONDS_PER_DAY,
    blocked: false,
    blockedReason: "",
  })

  const isAdmin = String(user?.email || "").toLowerCase() === ADMIN_EMAIL

  /**
   * ✅ NEW: map of jobId -> boolean for topic expand/collapse
   */
  const [expandedTopics, setExpandedTopics] = useState({})

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u || null)
        setAuthReady(true)
        setAuthErr("")
        if (!u) {
          setJobs([])
          setJobsErr("")
          setExpandedTopics({}) // ✅ reset when signed out
          setQuota({
            dayKey: dayKeyLA(new Date()),
            usedPodcasts: 0,
            usedRequestedSeconds: 0,
            remainingPodcasts: BASIC_MAX_PODCASTS_PER_DAY,
            remainingSeconds: BASIC_MAX_REQUESTED_SECONDS_PER_DAY,
            blocked: false,
            blockedReason: "",
          })
        }
      },
      (e) => {
        setAuthReady(true)
        setAuthErr(e?.message || "Failed to read auth state.")
      }
    )
    return () => unsub()
  }, [auth])

  async function login() {
    setAuthErr("")
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })
      await signInWithPopup(auth, provider)
    } catch (e) {
      setAuthErr(e?.message || "Google sign-in failed.")
    }
  }

  async function logout() {
    setAuthErr("")
    try {
      await signOut(auth)
    } catch (e) {
      setAuthErr(e?.message || "Sign out failed.")
    }
  }

  // ✅ Use simple where query (no composite index), sort client-side so jobs pop immediately.
  useEffect(() => {
    setJobsErr("")
    if (!user?.uid) return

    const qRef = query(collection(db, "podcastJobs"), where("userId", "==", user.uid))
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const out = []
        snap.forEach((d) => out.push({ id: d.id, ...d.data() }))

        out.sort((a, b) => {
          const aT = toMillis(a.updatedAt) || toMillis(a.createdAt) || 0
          const bT = toMillis(b.updatedAt) || toMillis(b.createdAt) || 0
          return bT - aT
        })

        setJobs(out)

        // ✅ optional: prune expandedTopics for jobs that no longer exist
        setExpandedTopics((prev) => {
          const ids = new Set(out.map((j) => j.id))
          let changed = false
          const next = { ...prev }
          for (const k of Object.keys(next)) {
            if (!ids.has(k)) {
              delete next[k]
              changed = true
            }
          }
          return changed ? next : prev
        })
      },
      (e) => setJobsErr(e?.message || "Failed to load your podcasts.")
    )

    return () => unsub()
  }, [user?.uid])

  // best-effort quota display from today’s jobs
  useEffect(() => {
    const today = dayKeyLA(new Date())
    if (!user?.uid) return

    if (isAdmin) {
      setQuota({
        dayKey: today,
        usedPodcasts: 0,
        usedRequestedSeconds: 0,
        remainingPodcasts: Infinity,
        remainingSeconds: Infinity,
        blocked: false,
        blockedReason: "",
      })
      return
    }

    let usedPodcasts = 0
    let usedRequestedSeconds = 0

    for (const j of jobs) {
      const created =
        j?.createdAt?.toDate?.() ||
        (j?.createdAt?.seconds ? new Date(j.createdAt.seconds * 1000) : null) ||
        (typeof j?.createdAt === "number" ? new Date(j.createdAt) : null)

      if (!created || isNaN(created.getTime())) continue
      if (dayKeyLA(created) !== today) continue

      usedPodcasts += 1
      const rs =
        Number.isFinite(Number(j?.requestedSeconds))
          ? Number(j.requestedSeconds)
          : (() => {
              try {
                return parseDurationToSeconds(j?.lengthArg)
              } catch {
                return 0
              }
            })()
      usedRequestedSeconds += Math.max(0, rs)
    }

    const remainingPodcasts = Math.max(0, BASIC_MAX_PODCASTS_PER_DAY - usedPodcasts)
    const remainingSeconds = Math.max(0, BASIC_MAX_REQUESTED_SECONDS_PER_DAY - usedRequestedSeconds)

    let blocked = false
    let blockedReason = ""
    if (remainingPodcasts <= 0) {
      blocked = true
      blockedReason = `Daily limit reached: ${BASIC_MAX_PODCASTS_PER_DAY} podcasts per day.`
    } else if (remainingSeconds <= 0) {
      blocked = true
      blockedReason = `Daily limit reached: 60m total requested length per day.`
    }

    setQuota({
      dayKey: today,
      usedPodcasts,
      usedRequestedSeconds,
      remainingPodcasts,
      remainingSeconds,
      blocked,
      blockedReason,
    })
  }, [jobs, user?.uid, isAdmin])

  async function submit() {
    setErr("")
    if (!user?.uid) {
      setErr("Please sign in with Google to generate a podcast.")
      return
    }

    const t = String(topic || "").trim()
    const l = String(lengthArg || "").trim()
    if (!t) return setErr("Topic is required.")
    if (!l) return setErr("Length is required (e.g. 900s, 10m, 1h).")

    let requestedSeconds = 0
    try {
      requestedSeconds = parseDurationToSeconds(l)
    } catch (e) {
      setErr(e?.message || "Invalid length format.")
      return
    }

    if (!isAdmin) {
      if (requestedSeconds > BASIC_MAX_REQUESTED_SECONDS_PER_DAY) {
        setErr("Basic users can request up to 60m per podcast.")
        return
      }
      if (quota.remainingPodcasts <= 0) {
        setErr(quota.blockedReason || "Daily podcast count limit reached.")
        return
      }
      if (requestedSeconds > quota.remainingSeconds) {
        setErr(`Not enough daily time remaining. Remaining today: ${formatSecondsShort(quota.remainingSeconds)}.`)
        return
      }
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, "podcastJobs"), {
        userId: user.uid,
        ...(user.email ? { userEmail: user.email } : {}),
        ...(user.displayName ? { userName: user.displayName } : {}),
        topic: t,
        lengthArg: l,
        status: "queued",
        progress: { phase: "queued", percent: 0, message: "Queued" },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      setTopic("")
    } catch (e) {
      setErr(e?.message || "Failed to create job.")
    } finally {
      setSubmitting(false)
    }
  }

  const buttonDisabled =
    submitting ||
    !String(topic || "").trim() ||
    !String(lengthArg || "").trim() ||
    !user?.uid ||
    (!isAdmin && quota.blocked)

  const cardBg =
    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.65) 100%)"

  // ✅ Topic TextField: multiline + auto-grow + basic font
  const topicInputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "rgba(0,0,0,0.28)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      "& > fieldset": { border: "1px solid rgba(255,255,255,0.14)" },
      "&:hover > fieldset": { border: "1px solid rgba(255,255,255,0.22)" },
      "&.Mui-focused > fieldset": { border: "1px solid rgba(34,211,238,0.35)" },
      "& textarea": {
        color: "rgba(216, 229, 254, 0.92)",
        fontFamily: "inherit",
        letterSpacing: 0,
        lineHeight: 1.5,
      },
    },
    "& .MuiInputLabel-root": { color: "rgba(216, 229, 254, 0.72)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "rgba(216, 229, 254, 0.82)" },
    "& .MuiFormHelperText-root": { color: "rgba(216, 229, 254, 0.6)" },
  }

  const lengthInputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      backgroundColor: "rgba(0,0,0,0.28)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      "& > fieldset": { border: "1px solid rgba(255,255,255,0.14)" },
      "&:hover > fieldset": { border: "1px solid rgba(255,255,255,0.22)" },
      "&.Mui-focused > fieldset": { border: "1px solid rgba(34,211,238,0.35)" },
      "& input": {
        color: "rgba(216, 229, 254, 0.92)",
        fontFamily: "inherit",
        letterSpacing: 0,
      },
    },
    "& .MuiInputLabel-root": { color: "rgba(216, 229, 254, 0.72)" },
    "& .MuiInputLabel-root.Mui-focused": { color: "rgba(216, 229, 254, 0.82)" },
    "& .MuiFormHelperText-root": { color: "rgba(216, 229, 254, 0.6)" },
  }

  const ActionButton = ({ onClick, disabled, children, title }) => (
    <Box
      component={motion.button}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      style={{
        border: "1px solid rgba(255,255,255,0.14)",
        background: disabled ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.35)",
        color: disabled ? "rgba(216, 229, 254, 0.45)" : "rgba(216, 229, 254, 0.92)",
        borderRadius: 14,
        padding: downSm ? "10px 12px" : "10px 14px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        letterSpacing: 0.3,
        boxShadow: "0 14px 36px rgba(0,0,0,0.55)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minWidth: downSm ? 170 : undefined,
      }}
      aria-label={title}
      title={title}
      type="button"
    >
      {children}
    </Box>
  )

  return (
    <Box sx={{ width: "100%", backgroundColor: "black", minHeight }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minHeight,
          display: "flex",
          justifyContent: "center",
          backgroundColor: "black",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth,
            px: { xs: 1.6, sm: 4 },
            pt: { xs: 9, sm: 12, md: 14 },
            pb: { xs: 9, sm: 12, md: 14 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <RevealOnScroll delay={0.05} triggerKey="hero">
            <Box sx={{ width: "100%", textAlign: "center" }}>
              <Typography
                variant={downSm ? "h3" : "h2"}
                sx={{
                  fontFamily: "Bemora",
                  letterSpacing: downSm ? 1.4 : 2,
                  lineHeight: 1.2,
                  backgroundImage: gradient,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                  mb: 1.0,
                }}
              >
                {title}
              </Typography>

              <Typography
                variant={downSm ? "body1" : "h6"}
                sx={{
                  color: "rgba(216, 229, 254, 0.86)",
                  lineHeight: 1.6,
                  maxWidth: 760,
                  mx: "auto",
                  fontSize: downSm ? 15 : undefined,
                }}
              >
                {subtitle}
              </Typography>
            </Box>
          </RevealOnScroll>

          {/* Auth card */}
          <RevealOnScroll delay={0.12} triggerKey={`auth_${String(!!user)}`}>
            <Box
              sx={{
                width: "100%",
                maxWidth: 860,
                mt: { xs: 3.0, sm: 4 },
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.65) 100%)",
                boxShadow: "0 18px 55px rgba(0,0,0,0.65)",
              }}
            >
              <Box sx={{ height: 3, backgroundImage: gradient, opacity: 0.9 }} />
              <Box sx={{ p: { xs: 2.0, sm: 3.25 } }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "stretch", sm: "center" },
                    justifyContent: "space-between",
                    gap: 1.5,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        display: "block",
                        letterSpacing: 2.4,
                        color: "rgba(216, 229, 254, 0.72)",
                        mb: 0.6,
                      }}
                    >
                      AUTHENTICATION
                    </Typography>

                    {!authReady ? (
                      <Typography sx={{ color: "rgba(216, 229, 254, 0.78)" }}>Checking sign-in…</Typography>
                    ) : user ? (
                      <Typography sx={{ color: "rgba(216, 229, 254, 0.9)", lineHeight: 1.5 }}>
                        Signed in as <b>{user.displayName || user.email || "Google User"}</b>
                        <br />
                        <span style={{ opacity: 0.75, fontSize: 13 }}>{user.email}</span>
                      </Typography>
                    ) : (
                      <Typography sx={{ color: "rgba(216, 229, 254, 0.78)" }}>
                        Sign in to generate and view your podcasts.
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ display: "flex", gap: 1.25, justifyContent: { xs: "flex-end", sm: "flex-start" } }}>
                    {!user ? (
                      <ActionButton onClick={login} disabled={!authReady} title="Sign in with Google">
                        SIGN IN (GOOGLE)
                      </ActionButton>
                    ) : (
                      <ActionButton onClick={logout} disabled={!authReady} title="Sign out">
                        SIGN OUT
                      </ActionButton>
                    )}
                  </Box>
                </Box>

                {!!authErr && (
                  <Typography sx={{ mt: 1.25, color: "rgba(255, 120, 120, 0.92)", lineHeight: 1.6 }}>
                    {authErr}
                  </Typography>
                )}
              </Box>
            </Box>
          </RevealOnScroll>

          {/* Create job card */}
          <RevealOnScroll delay={0.18} triggerKey={`create_${String(!!user)}_${quota.dayKey}`}>
            <Box
              sx={{
                width: "100%",
                maxWidth: 860,
                mt: { xs: 2.75, sm: 3.5 },
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.65) 100%)",
                boxShadow: "0 18px 55px rgba(0,0,0,0.65)",
                opacity: user ? 1 : 0.82,
              }}
            >
              <Box sx={{ height: 3, backgroundImage: gradient, opacity: 0.9 }} />
              <Box sx={{ p: { xs: 2.0, sm: 3.25, md: 4 } }}>
                <Typography
                  variant="overline"
                  sx={{
                    display: "block",
                    letterSpacing: 2.4,
                    color: "rgba(216, 229, 254, 0.72)",
                    mb: 1,
                  }}
                >
                  JOB SETUP
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 220px" },
                    gap: 1.2,
                    alignItems: "start",
                  }}
                >
                  <TextField
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    label="Podcast Topic"
                    placeholder='e.g. "DeFi on Algorand"'
                    fullWidth
                    autoComplete="off"
                    multiline
                    minRows={2}
                    maxRows={8}
                    sx={topicInputSx}
                    disabled={!user}
                  />

                  <TextField
                    value={lengthArg}
                    onChange={(e) => setLengthArg(e.target.value)}
                    label="Length"
                    placeholder="10m"
                    fullWidth
                    autoComplete="off"
                    helperText="Examples: 900s, 10m, 1h"
                    sx={lengthInputSx}
                    disabled={!user}
                  />
                </Box>

                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                  <Box
                    component={motion.button}
                    onClick={submit}
                    disabled={buttonDisabled}
                    whileHover={buttonDisabled ? undefined : { y: -2 }}
                    whileTap={buttonDisabled ? undefined : { scale: 0.98 }}
                    style={{
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: buttonDisabled ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.35)",
                      color: buttonDisabled ? "rgba(216, 229, 254, 0.45)" : "rgba(216, 229, 254, 0.92)",
                      borderRadius: 14,
                      padding: downSm ? "11px 14px" : "12px 16px",
                      cursor: buttonDisabled ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      letterSpacing: 0.3,
                      boxShadow: "0 14px 36px rgba(0,0,0,0.55)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      whiteSpace: "nowrap",
                      minWidth: downSm ? 190 : 220,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    type="button"
                  >
                    {submitting ? "SUBMITTING…" : "CREATE PODCAST JOB"}
                  </Box>
                </Box>

                {!!err && (
                  <Typography sx={{ mt: 1.5, color: "rgba(255, 120, 120, 0.92)" }}>
                    {err}
                  </Typography>
                )}
              </Box>
            </Box>
          </RevealOnScroll>

          {/* Jobs list */}
          {!!user && (
            <RevealOnScroll delay={0.22} triggerKey={`jobs_${jobs.length}`}>
              <Box sx={{ width: "100%", maxWidth: 860, mt: { xs: 2.75, sm: 3 } }}>
                <Typography
                  variant="overline"
                  sx={{
                    display: "block",
                    letterSpacing: 2.4,
                    color: "rgba(216, 229, 254, 0.72)",
                    mb: 1,
                  }}
                >
                  YOUR PODCAST JOBS
                </Typography>

                {!!jobsErr && (
                  <Typography sx={{ color: "rgba(255,120,120,0.92)", mb: 1 }}>
                    {jobsErr}
                  </Typography>
                )}

                {jobs.length === 0 ? (
                  <Typography sx={{ color: "rgba(216, 229, 254, 0.72)", lineHeight: 1.6 }}>
                    No jobs found yet. Create one above.
                  </Typography>
                ) : (
                  <Stack spacing={downSm ? 1.15 : 1.5}>
                    {jobs.map((j, idx) => {
                      const expanded = !!expandedTopics[j.id]
                      return (
                        <RevealOnScroll
                          key={j.id}
                          delay={Math.min(0.04 + idx * 0.015, 0.16)}
                          triggerKey={`job_${j.id}_${j?.status || ""}_${j?.progress?.percent ?? 0}`}
                        >
                          <JobCard
                            job={j}
                            gradient={gradient}
                            cardBg={cardBg}
                            dense={denseCards}
                            tiny={tinyCards}
                            isTopicExpanded={expanded}
                            onToggleTopic={() =>
                              setExpandedTopics((prev) => ({ ...prev, [j.id]: !prev[j.id] }))
                            }
                          />
                        </RevealOnScroll>
                      )
                    })}
                  </Stack>
                )}
              </Box>
            </RevealOnScroll>
          )}

          {/* Optional selected divider for spacing consistency */}
          {!!user && jobs.length > 0 && (
            <Box sx={{ width: "100%", maxWidth: 860, mt: { xs: 2.75, sm: 3 } }}>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
