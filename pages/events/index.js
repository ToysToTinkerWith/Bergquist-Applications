// pages/scheduler.jsx
// Full code change
//
// Adds:
// - social post generation button while viewing/editing an event
// - editable generated social post title/description
// - multi-image social post selection before social post generation
// - sends selected saved images and company logo into the social post payload
// - uses /api/social-post-from-event, which generates a branded promo image with gpt-image-2
// - direct "View Event Page" access to the read-only /events/[eventId] page
//
// Requires:
//   npm install openai
//
// Environment:
//   OPENAI_API_KEY=your_openai_api_key

import React, { useEffect, useMemo, useRef, useState } from "react"
import Head from "next/head"
import { SOCIAL_IMAGE_URL, SOCIAL_IMAGE_ALT, SOCIAL_IMAGE_WIDTH, SOCIAL_IMAGE_HEIGHT } from "../../lib/socialPreview"
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
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded"
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded"
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded"
import ImageRoundedIcon from "@mui/icons-material/ImageRounded"
import AddRoundedIcon from "@mui/icons-material/AddRounded"
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded"
import NotesRoundedIcon from "@mui/icons-material/NotesRounded"
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded"
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded"
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded"
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded"
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded"
import { motion } from "framer-motion"

import dynamic from "next/dynamic"
const FullCalendar = dynamic(() => import('../../components/SchedulerCalendar'), { ssr: false, loading: () => <div role="status" style={{ minHeight: 500 }}>Loading calendar…</div> })

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
import { PHOTO_ACCEPT, MAX_PHOTOS, MAX_CAPTION_LENGTH, validatePhotoFiles } from "../../lib/schedulerPhotos.mjs"
import { saveSchedulerEvent, deleteSchedulerEvent } from "../../lib/schedulerPhotoStorage"
import SchedulerPhotoIndicator from "../../components/scheduler/SchedulerPhotoIndicator"

import { db } from "../../Firebase/FirebaseInit"

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

function formatSocialDateRange(start, end, allDay = false) {
  try {
    const s = new Date(start)
    const e = new Date(end)
    const sameDay =
      s.getFullYear() === e.getFullYear() &&
      s.getMonth() === e.getMonth() &&
      s.getDate() === e.getDate()

    const dateLabel = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(s)

    if (allDay) return `${dateLabel} (all day)`
    if (sameDay) return `${dateLabel}, ${formatTime(s)} – ${formatTime(e)}`
    return `${dateLabel}, ${formatTime(s)} – ${formatDayLabel(e)}, ${formatTime(e)}`
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
    preview: String(image?.preview || ""),
  }
}

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

function DayEventCard({ event, onClick, onViewPage }) {
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

          <Button
            onClick={(e) => {
              e.stopPropagation()
              onViewPage?.(event.id)
            }}
            startIcon={<VisibilityRoundedIcon />}
            sx={{
              alignSelf: "flex-start",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 800,
              color: "rgba(245,248,255,0.95)",
              border: "1px solid rgba(216,229,254,0.16)",
              backgroundColor: "rgba(255,255,255,0.06)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.10)",
              },
            }}
          >
            View Event Page
          </Button>
        </Stack>
      </Box>
    </Card>
  )
}

function SocialPostPreviewDialog({
  open,
  onClose,
  postResult,
  onCopy,
  onChange,
}) {
  const title = postResult?.headline || ""
  const description = postResult?.caption || ""
  const shortCaption = postResult?.shortCaption || ""
  const hashtags = Array.isArray(postResult?.hashtags) ? postResult.hashtags : []

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
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
            Generated Social Post
          </GradientTitle>
          <Typography
            sx={{ mt: 0.5, color: "rgba(216, 229, 254, 0.70)", fontSize: 13.5 }}
          >
            Preview image and edit the post before using it.
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{ color: "rgba(216, 229, 254, 0.90)" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2}>
          {postResult?.imageDataUrl ? (
            <Box
              component="img"
              src={postResult.imageDataUrl}
              alt={postResult.altText || "Generated social post image"}
              sx={{
                width: "100%",
                borderRadius: 3,
                objectFit: "cover",
                border: "1px solid rgba(216, 229, 254, 0.12)",
                boxShadow: "0 18px 55px rgba(0,0,0,0.4)",
              }}
            />
          ) : null}

          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(216, 229, 254, 0.10)",
              background: "rgba(255,255,255,0.02)",
              p: { xs: 1.4, sm: 1.8 },
            }}
          >
            <Typography
              sx={{
                color: "rgba(245,248,255,0.95)",
                fontWeight: 800,
                mb: 1,
              }}
            >
              Social Post Title
            </Typography>

            <TextField
              fullWidth
              value={title}
              onChange={(e) => onChange?.("headline", e.target.value)}
              placeholder="Edit the title..."
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

          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(216, 229, 254, 0.10)",
              background: "rgba(255,255,255,0.02)",
              p: { xs: 1.4, sm: 1.8 },
            }}
          >
            <Typography
              sx={{
                color: "rgba(245,248,255,0.95)",
                fontWeight: 800,
                mb: 1,
              }}
            >
              Social Post Description
            </Typography>

            <TextField
              fullWidth
              multiline
              minRows={6}
              value={description}
              onChange={(e) => onChange?.("caption", e.target.value)}
              placeholder="Edit the description..."
              sx={{
                "& .MuiInputBase-root": {
                  backgroundColor: "rgba(255,255,255,0.05)",
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
          </Box>

          {shortCaption ? (
            <Box
              sx={{
                borderRadius: 3,
                border: "1px solid rgba(216, 229, 254, 0.10)",
                background: "rgba(255,255,255,0.02)",
                p: { xs: 1.4, sm: 1.8 },
              }}
            >
              <Typography
                sx={{
                  color: "rgba(245,248,255,0.95)",
                  fontWeight: 800,
                  mb: 1,
                }}
              >
                Short Version
              </Typography>

              <TextField
                fullWidth
                multiline
                minRows={3}
                value={shortCaption}
                onChange={(e) => onChange?.("shortCaption", e.target.value)}
                placeholder="Edit the short version..."
                sx={{
                  "& .MuiInputBase-root": {
                    backgroundColor: "rgba(255,255,255,0.05)",
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
            </Box>
          ) : null}

          {hashtags.length ? (
            <Box
              sx={{
                borderRadius: 3,
                border: "1px solid rgba(216, 229, 254, 0.10)",
                background: "rgba(255,255,255,0.02)",
                p: { xs: 1.4, sm: 1.8 },
              }}
            >
              <Typography
                sx={{
                  color: "rgba(245,248,255,0.95)",
                  fontWeight: 800,
                  mb: 1,
                }}
              >
                Hashtags
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {hashtags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    sx={{
                      color: "rgba(245,248,255,0.94)",
                      background: "rgba(124,58,237,0.18)",
                      border: "1px solid rgba(216,229,254,0.14)",
                    }}
                  />
                ))}
              </Stack>
            </Box>
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
        <Button
          onClick={onClose}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 800,
            color: "rgba(216,229,254,0.92)",
            border: "1px solid rgba(216,229,254,0.14)",
          }}
        >
          Close
        </Button>

        <Button
          onClick={onCopy}
          startIcon={<ContentCopyRoundedIcon />}
          variant="contained"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 800,
            px: 2,
            py: 1,
            background:
              "linear-gradient(90deg, rgba(124,58,237,0.85), rgba(34,211,238,0.65))",
            boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
            "&:hover": {
              background:
                "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(34,211,238,0.72))",
            },
          }}
        >
          Copy Post
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function SchedulerPage() {
  const SITE_NAME = "Bergquist Applications"
  const SITE_URL = "https://bergquistapplications.com"
  const PAGE_PATH = "/scheduler"
  const PAGE_URL = `${SITE_URL}${PAGE_PATH}`

  const SOCIAL_POST_COMPANY = {
    name: "Pacific Driveways",
    website: "https://www.pacificdriveways.com",
    logoUrl: "/postLogo.png",
    phone: "360-929-5984",
  }

  const TITLE = `Scheduler | ${SITE_NAME}`
  const DESCRIPTION = "Schedule events and view them on a calendar."

  const OG_IMAGE = SOCIAL_IMAGE_URL
  const LAST_UPDATED = "April 6, 2026"

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
    dateModified: "2026-04-06",
  }

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

  const [generatingPost, setGeneratingPost] = useState(false)
  const [generatedPostError, setGeneratedPostError] = useState("")
  const [generatedPostOpen, setGeneratedPostOpen] = useState(false)
  const [generatedPost, setGeneratedPost] = useState(null)
  const [selectedPostImageIds, setSelectedPostImageIds] = useState([])

  function handleGeneratedPostFieldChange(field, value) {
    setGeneratedPost((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        [field]: value,
      }
    })
  }

  function handleOpenViewOnlyPage(eventId = activeId) {
    if (!eventId) return
    window.open(`/events/${eventId}`, "_blank", "noopener,noreferrer")
  }

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

    if (typeof window === "undefined") {
      setDayZoomDate(new Date(date))
      setDayZoomOpen(true)
      return
    }

    dayZoomScrollYRef.current = window.scrollY || window.pageYOffset || 0
    restoreDayZoomScrollRef.current = true
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
    setGeneratingPost(false)
    setGeneratedPostError("")
    setSelectedPostImageIds([])
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
    setGeneratingPost(false)
    setGeneratedPostError("")
    setSelectedPostImageIds([])
    setOpen(true)
  }

  function openForEdit(eventInfo) {
    const ev = eventInfo?.event
    if (!ev) return

    revokeNewImagePreviews(newImages)

    const mappedImages = (
      Array.isArray(ev.extendedProps?.images) ? ev.extendedProps.images : []
    ).map((img) => sanitizeImageMetadata(img))

    setMode("edit")
    setActiveId(ev.id)
    setTitle(ev.title || "")
    setNotes(ev.extendedProps?.notes || "")
    setAllDay(!!ev.allDay)
    setStartDt(ev.start ? new Date(ev.start) : null)
    setEndDt(ev.end ? new Date(ev.end) : ev.start ? new Date(ev.start) : null)
    setExistingImages(mappedImages)
    setNewImages([])
    setRemovedExistingImages([])
    setSaveErr("")
    setGeneratingPost(false)
    setGeneratedPostError("")
    setSelectedPostImageIds(mappedImages.slice(0, 6).map((img) => img.id).filter(Boolean))
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
      const next = prev.filter((img) => img.id !== id)

      if (target) {
        setRemovedExistingImages((old) => [...old, target])
      }

      setSelectedPostImageIds((current) => current.filter((imageId) => imageId !== id))

      return next
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

  function toggleSelectedPostImageId(imageId) {
    if (!imageId) return

    setSelectedPostImageIds((prev) => {
      if (prev.includes(imageId)) {
        return prev.filter((id) => id !== imageId)
      }

      return [...prev, imageId].slice(0, 8)
    })
  }

  function buildEventPayloadForSocialPost() {
    const selectedImages = existingImages.filter((img) =>
      selectedPostImageIds.includes(img.id)
    )

    return {
      id: activeId || "",
      title: String(title || "").trim(),
      notes: String(notes || "").trim(),
      allDay: !!allDay,
      start: startDt ? new Date(startDt).toISOString() : null,
      end: endDt ? new Date(endDt).toISOString() : null,
      dateLabel: startDt
        ? formatSocialDateRange(startDt, endDt || startDt, allDay)
        : "",
      images: selectedImages.map((img) => ({
        id: img.id,
        url: img.url,
        fileName: img.fileName,
        message: img.message,
        contentType: img.contentType,
      })),
    }
  }

  async function handleGenerateSocialPost() {
    setGeneratedPostError("")
    setGeneratedPost(null)

    if (mode !== "edit" || !activeId) {
      setGeneratedPostError("Open an existing saved event to generate a social post.")
      return
    }

    if (newImages.length) {
      setGeneratedPostError(
        "Save the event first so newly added images are available to the post generator."
      )
      return
    }

    if (!existingImages.length) {
      setGeneratedPostError("Add at least one saved image before generating a social post.")
      return
    }

    if (!selectedPostImageIds.length) {
      setGeneratedPostError("Select at least one saved image for the social post.")
      return
    }

    setGeneratingPost(true)

    try {
      const response = await fetch("/api/social-post-from-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: SOCIAL_POST_COMPANY,
          event: buildEventPayloadForSocialPost(),
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to generate the social post.")
      }

      setGeneratedPost(payload)
      setGeneratedPostOpen(true)
    } catch (error) {
      setGeneratedPostError(
        error?.message || "Failed to generate the social post."
      )
    } finally {
      setGeneratingPost(false)
    }
  }

  async function handleCopyGeneratedPost() {
    if (!generatedPost) return

    const textToCopy = [
      generatedPost.headline || "",
      generatedPost.caption || "",
      generatedPost.shortCaption
        ? `Short version:\n${generatedPost.shortCaption}`
        : "",
      Array.isArray(generatedPost.hashtags) && generatedPost.hashtags.length
        ? generatedPost.hashtags.join(" ")
        : "",
    ]
      .filter(Boolean)
      .join("\n\n")

    try {
      await navigator.clipboard.writeText(textToCopy)
    } catch {}
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

              {mode === "edit" && existingImages.length ? (
                <Box
                  sx={{
                    borderRadius: 3,
                    border: "1px solid rgba(216, 229, 254, 0.10)",
                    background: "rgba(255,255,255,0.02)",
                    p: { xs: 1.4, sm: 1.8 },
                  }}
                >
                  <GradientTitle variant="subtitle1" sx={{ textShadow: "none", mb: 0.55 }}>
                    Social Post Images
                  </GradientTitle>

                  <Typography
                    sx={{ color: "rgba(216, 229, 254, 0.68)", fontSize: 13.5, mb: 1.5 }}
                  >
                    Select the saved images that show the work completed. The promo generator will use those images plus the company logo to create a clean branded post.
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.4 }}>
                    <Chip
                      label={`${selectedPostImageIds.length} selected`}
                      sx={{
                        color: "rgba(245,248,255,0.94)",
                        background: "rgba(34,211,238,0.14)",
                        border: "1px solid rgba(216,229,254,0.14)",
                      }}
                    />
                    <Chip
                      label={`Logo: ${SOCIAL_POST_COMPANY.name}`}
                      sx={{
                        color: "rgba(245,248,255,0.94)",
                        background: "rgba(124,58,237,0.18)",
                        border: "1px solid rgba(216,229,254,0.14)",
                      }}
                    />
                    <Chip
                      label={`Phone: ${SOCIAL_POST_COMPANY.phone}`}
                      sx={{
                        color: "rgba(245,248,255,0.94)",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(216,229,254,0.14)",
                      }}
                    />
                    
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(3, minmax(0, 1fr))",
                      },
                      gap: 1.25,
                    }}
                  >
                    {existingImages.map((img) => {
                      const isSelected = selectedPostImageIds.includes(img.id)

                      return (
                        <Box
                          key={img.id}
                          onClick={() => toggleSelectedPostImageId(img.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault()
                              toggleSelectedPostImageId(img.id)
                            }
                          }}
                          sx={{
                            borderRadius: 3,
                            overflow: "hidden",
                            cursor: "pointer",
                            border: isSelected
                              ? "2px solid rgba(34,211,238,0.95)"
                              : "1px solid rgba(216, 229, 254, 0.14)",
                            background: isSelected
                              ? "rgba(34,211,238,0.08)"
                              : "rgba(255,255,255,0.03)",
                            transition: "transform 0.18s ease, border-color 0.18s ease, background 0.18s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              borderColor: "rgba(34,211,238,0.70)",
                            },
                          }}
                        >
                          <Box sx={{ position: "relative" }}>
                            <Box
                              component="img"
                              src={img.url}
                              alt={img.fileName || "Social post option"}
                              sx={{
                                width: "100%",
                                aspectRatio: "16 / 10",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />

                            {isSelected ? (
                              <Chip
                                icon={<CheckCircleRoundedIcon />}
                                label="Selected"
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 10,
                                  left: 10,
                                  color: "rgba(245,248,255,0.96)",
                                  background: "rgba(0,0,0,0.56)",
                                  border: "1px solid rgba(216,229,254,0.18)",
                                  backdropFilter: "blur(8px)",
                                }}
                              />
                            ) : null}
                          </Box>

                          <Box sx={{ p: 1.1 }}>
                            <Typography
                              sx={{
                                color: "rgba(245,248,255,0.95)",
                                fontSize: 12.5,
                                fontWeight: 800,
                                mb: 0.45,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {img.fileName || "Event image"}
                            </Typography>

                            {img.message ? (
                              <Typography
                                sx={{
                                  color: "rgba(216,229,254,0.68)",
                                  fontSize: 12.5,
                                  lineHeight: 1.55,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {img.message}
                              </Typography>
                            ) : (
                              <Typography
                                sx={{ color: "rgba(216,229,254,0.50)", fontSize: 12.5 }}
                              >
                                No image note added
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
              ) : null}

              {mode === "edit" ? (
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
                  >
                    <Box>
                      <GradientTitle variant="subtitle1" sx={{ textShadow: "none", mb: 0.55 }}>
                        Social Post Generator
                      </GradientTitle>
                      <Typography
                        sx={{ color: "rgba(216, 229, 254, 0.68)", fontSize: 13.5 }}
                      >
                        Generate a branded promo using the selected saved images and the company logo. The model will infer the work shown, create a professional image, and write matching post copy.
                      </Typography>
                    </Box>

                    <Button
                      onClick={handleGenerateSocialPost}
                      disabled={generatingPost || saving}
                      startIcon={<CampaignRoundedIcon />}
                      variant="contained"
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 800,
                        px: 2,
                        py: 1,
                        background:
                          "linear-gradient(90deg, rgba(124,58,237,0.85), rgba(34,211,238,0.65))",
                        boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
                        "&:hover": {
                          background:
                            "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(34,211,238,0.72))",
                        },
                      }}
                    >
                      {generatingPost ? "Generating…" : "Generate Social Post"}
                    </Button>
                  </Stack>

                  {generatedPostError ? (
                    <Typography
                      sx={{
                        mt: 1.25,
                        color: "rgba(255, 120, 120, 0.95)",
                        fontSize: 13.5,
                      }}
                    >
                      {generatedPostError}
                    </Typography>
                  ) : null}
                </Box>
              ) : null}

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
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {mode === "edit" && activeId ? (
                <Button
                  onClick={handleDelete}
                  disabled={saving || generatingPost}
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
                  Delete
                </Button>
              ) : null}

              {mode === "edit" && activeId ? (
                <Button
                  onClick={() => handleOpenViewOnlyPage(activeId)}
                  startIcon={<VisibilityRoundedIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 900,
                    color: "rgba(245,248,255,0.95)",
                    border: "1px solid rgba(216,229,254,0.16)",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.10)",
                    },
                  }}
                >
                  View Event Page
                </Button>
              ) : null}

              {mode === "edit" && activeId ? (
                <Button
                  onClick={handleGenerateSocialPost}
                  disabled={generatingPost || saving}
                  startIcon={<AutoAwesomeRoundedIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 900,
                    color: "rgba(245,248,255,0.95)",
                    border: "1px solid rgba(216,229,254,0.16)",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.10)",
                    },
                  }}
                >
                  {generatingPost ? "Generating…" : "Generate Social Post"}
                </Button>
              ) : null}
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                onClick={closeModal}
                disabled={saving || generatingPost}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  color: "rgba(216,229,254,0.92)",
                  border: "1px solid rgba(216,229,254,0.14)",
                }}
              >
                Cancel
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={saving || preparingPhotos || !!conflictMessage || !canSubmit || generatingPost}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 900,
                  px: 2.25,
                  background:
                    "linear-gradient(90deg, rgba(124,58,237,0.85), rgba(34,211,238,0.65))",
                  boxShadow: "0 18px 55px rgba(0,0,0,0.45)",
                  "&:hover": {
                    background:
                      "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(34,211,238,0.72))",
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.45)",
                    background: "rgba(255,255,255,0.08)",
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
              background:
                "linear-gradient(180deg, rgba(5,6,10,1) 0%, rgba(7,8,19,1) 100%)",
              overflow: "auto",
            },
          }}
        >
          <Box sx={{ minHeight: "100vh", p: { xs: 1.25, sm: 2, md: 2.5 } }}>
            <Stack spacing={2}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1.5}
              >
                <Box>
                  <GradientTitle variant="h4" sx={{ textShadow: "none", mb: 0.6 }}>
                    {dayZoomDate ? formatDayLabel(dayZoomDate) : "Day View"}
                  </GradientTitle>
                  <SubText sx={{ color: "rgba(216,229,254,0.72)" }}>
                    {dayZoomEvents.length} event{dayZoomEvents.length === 1 ? "" : "s"} on this day.
                  </SubText>
                </Box>

                <Stack direction="row" spacing={1}>
                  <Button
                    onClick={openCreateFromDayZoom}
                    startIcon={<AddRoundedIcon />}
                    variant="contained"
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 800,
                      px: 1.8,
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0.85), rgba(34,211,238,0.65))",
                    }}
                  >
                    New Event
                  </Button>

                  <IconButton
                    onClick={closeDayZoom}
                    sx={{
                      color: "rgba(245,248,255,0.94)",
                      border: "1px solid rgba(216,229,254,0.14)",
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Stack>
              </Stack>

              {dayZoomEvents.length ? (
                <Stack spacing={1.35}>
                  {dayZoomEvents.map((event) => (
                    <DayEventCard
                      key={event.id}
                      event={event}
                      onClick={() => openExistingEventFromDayZoom(event)}
                      onViewPage={handleOpenViewOnlyPage}
                    />
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    borderRadius: 3,
                    border: "1px dashed rgba(216, 229, 254, 0.18)",
                    background: "rgba(255,255,255,0.02)",
                    minHeight: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    px: 2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        color: "rgba(245,248,255,0.92)",
                        fontWeight: 800,
                        mb: 0.5,
                      }}
                    >
                      No events scheduled for this day
                    </Typography>
                    <SubText sx={{ color: "rgba(216,229,254,0.66)" }}>
                      Add a new event to start planning this date.
                    </SubText>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>
        </Dialog>

        <SocialPostPreviewDialog
          open={generatedPostOpen}
          onClose={() => setGeneratedPostOpen(false)}
          postResult={generatedPost}
          onCopy={handleCopyGeneratedPost}
          onChange={handleGeneratedPostFieldChange}
        />
      </LocalizationProvider>
    </Box>
  )
}
