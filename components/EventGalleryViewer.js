// components/EventGalleryViewer.jsx
//
// Read-only event viewer component.
// - Displays event title, notes, date/time, and all event images
// - Click any image to open a full-screen preview
// - Click anywhere while preview is open to close it
// - No edit, delete, upload, or mutation actions
//
// Requires your existing Firebase init export:
//   import { db } from "../Firebase/FirebaseInit"
//
// Firestore collection expected:
//   scheduleEvents
//
// Usage example:
//   <EventGalleryViewer />
//   <EventGalleryViewer eventId="abc123" />
//
// If eventId is provided, it shows just that event.
// If eventId is omitted, it shows all events in a read-only list.

import React, { useEffect, useMemo, useState } from "react"
import {
  Box,
  Typography,
  Stack,
  Card,
  Chip,
  Dialog,
  IconButton,
  CircularProgress,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import PhotoLibraryRoundedIcon from "@mui/icons-material/PhotoLibraryRounded"
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded"
import NotesRoundedIcon from "@mui/icons-material/NotesRounded"
import ImageRoundedIcon from "@mui/icons-material/ImageRounded"
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore"

import { db } from "../Firebase/FirebaseInit"

function GradientTitle({ children, variant = "h4", sx = {} }) {
  return (
    <Typography
      variant={variant}
      sx={{
        fontFamily: "Bemora",
        letterSpacing: 1,
        lineHeight: 1.2,
        backgroundImage:
          "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        textShadow: "0 10px 35px rgba(0,0,0,0.45)",
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
      sx={{
        color: "rgba(216, 229, 254, 0.82)",
        lineHeight: 1.7,
        ...sx,
      }}
    >
      {children}
    </Typography>
  )
}

function sanitizeImageMetadata(image) {
  return {
    id: String(image?.id || ""),
    url: String(image?.url || ""),
    path: String(image?.path || ""),
    message: String(image?.message || ""),
    fileName: String(image?.fileName || ""),
    contentType: String(image?.contentType || ""),
    size: Number(image?.size || 0),
    createdAt: image?.createdAt || null,
  }
}

function formatDayLabel(d) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(d))
  } catch {
    return ""
  }
}

function formatTime(d) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(d))
  } catch {
    return ""
  }
}

function formatDateRange(start, end, allDay = false) {
  if (!start || !end) return ""
  try {
    const s = new Date(start)
    const e = new Date(end)

    const sameDay =
      s.getFullYear() === e.getFullYear() &&
      s.getMonth() === e.getMonth() &&
      s.getDate() === e.getDate()

    const day = formatDayLabel(s)

    if (allDay) return `${day} · All day`
    if (sameDay) return `${day} · ${formatTime(s)} – ${formatTime(e)}`
    return `${formatDayLabel(s)} ${formatTime(s)} – ${formatDayLabel(e)} ${formatTime(e)}`
  } catch {
    return ""
  }
}

function EventImageGrid({ images, onOpen }) {
  if (!images.length) {
    return (
      <Box
        sx={{
          borderRadius: 3,
          border: "1px dashed rgba(216, 229, 254, 0.18)",
          background: "rgba(255,255,255,0.02)",
          minHeight: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 2,
        }}
      >
        <Box>
          <ImageRoundedIcon
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
              mb: 0.35,
            }}
          >
            No images for this event
          </Typography>
          <Typography
            sx={{ color: "rgba(216, 229, 254, 0.62)", fontSize: 13.5 }}
          >
            Images will appear here when they are added to the event.
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(1, minmax(0, 1fr))",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
        },
        gap: 1.4,
      }}
    >
      {images.map((image) => (
        <Card
          key={image.id || image.url}
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
            component="button"
            type="button"
            onClick={() => onOpen(image)}
            sx={{
              appearance: "none",
              WebkitAppearance: "none",
              width: "100%",
              border: "none",
              padding: 0,
              margin: 0,
              cursor: "pointer",
              background: "transparent",
              display: "block",
              textAlign: "left",
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 10",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {image.url ? (
                <Box
                  component="img"
                  src={image.url}
                  alt={image.fileName || "Event image"}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    transition: "transform 0.22s ease",
                    "&:hover": {
                      transform: "scale(1.02)",
                    },
                  }}
                />
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
            </Box>

            {(image.message || image.fileName) && (
              <Box sx={{ p: 1.15 }}>
                {image.fileName ? (
                  <Typography
                    sx={{
                      color: "rgba(245,248,255,0.95)",
                      fontWeight: 800,
                      fontSize: 13.5,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      mb: image.message ? 0.4 : 0,
                    }}
                  >
                    {image.fileName}
                  </Typography>
                ) : null}

                {image.message ? (
                  <Typography
                    sx={{
                      color: "rgba(216,229,254,0.74)",
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {image.message}
                  </Typography>
                ) : null}
              </Box>
            )}
          </Box>
        </Card>
      ))}
    </Box>
  )
}

function EventDisplayCard({ event, onOpenImage }) {
  const images = Array.isArray(event?.images) ? event.images : []

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(124,58,237,0.08), rgba(34,211,238,0.03))",
        border: "1px solid rgba(216, 229, 254, 0.12)",
        boxShadow: "0 18px 55px rgba(0,0,0,0.38)",
      }}
    >
      <Box sx={{ p: { xs: 1.5, sm: 1.8, md: 2 } }}>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <GradientTitle variant="h6" sx={{ textShadow: "none" }}>
              {event.title || "Scheduled Event"}
            </GradientTitle>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {event.start && event.end ? (
                <Chip
                  icon={<AccessTimeRoundedIcon />}
                  label={formatDateRange(event.start, event.end, event.allDay)}
                  sx={{
                    color: "rgba(245,248,255,0.94)",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(216,229,254,0.12)",
                  }}
                />
              ) : null}

              <Chip
                icon={<PhotoLibraryRoundedIcon />}
                label={`${images.length} image${images.length === 1 ? "" : "s"}`}
                sx={{
                  color: "rgba(245,248,255,0.94)",
                  background: "rgba(34,211,238,0.14)",
                  border: "1px solid rgba(216,229,254,0.12)",
                }}
              />
            </Stack>
          </Stack>

          {event.notes ? (
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
                  lineHeight: 1.75,
                  fontSize: 14.5,
                }}
              >
                {event.notes}
              </Typography>
            </Stack>
          ) : null}

          <EventImageGrid images={images} onOpen={onOpenImage} />
        </Stack>
      </Box>
    </Card>
  )
}

export default function EventGalleryViewer({ eventId = "" }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [previewImage, setPreviewImage] = useState(null)

  useEffect(() => {
    if (eventId) {
      const refDoc = doc(db, "scheduleEvents", eventId)
      const unsub = onSnapshot(
        refDoc,
        (snap) => {
          if (!snap.exists()) {
            setEvents([])
            setLoading(false)
            setError("Event not found.")
            return
          }

          const data = snap.data() || {}
          const start = data.start?.toDate ? data.start.toDate() : null
          const end = data.end?.toDate ? data.end.toDate() : null
          const rawImages = Array.isArray(data.images) ? data.images : []

          setEvents([
            {
              id: snap.id,
              title: String(data.title || "Scheduled Event"),
              notes: String(data.notes || ""),
              start,
              end,
              allDay: !!data.allDay,
              images: rawImages.map((img) => sanitizeImageMetadata(img)),
            },
          ])
          setLoading(false)
          setError("")
        },
        (err) => {
          setLoading(false)
          setError(err?.message || "Failed to load event.")
        }
      )

      return () => unsub()
    }

    const q = query(collection(db, "scheduleEvents"), orderBy("start", "asc"))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const out = []
        snap.forEach((d) => {
          const data = d.data() || {}
          const start = data.start?.toDate ? data.start.toDate() : null
          const end = data.end?.toDate ? data.end.toDate() : null
          const rawImages = Array.isArray(data.images) ? data.images : []

          out.push({
            id: d.id,
            title: String(data.title || "Scheduled Event"),
            notes: String(data.notes || ""),
            start,
            end,
            allDay: !!data.allDay,
            images: rawImages.map((img) => sanitizeImageMetadata(img)),
          })
        })

        setEvents(out)
        setLoading(false)
        setError("")
      },
      (err) => {
        setLoading(false)
        setError(err?.message || "Failed to load events.")
      }
    )

    return () => unsub()
  }, [eventId])

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aTime = a?.start ? new Date(a.start).getTime() : 0
      const bTime = b?.start ? new Date(b.start).getTime() : 0
      return aTime - bTime
    })
  }, [events])

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "black",
        minHeight: "100vh",
        px: { xs: 1, sm: 1.5, md: 2 },
        py: { xs: 2, sm: 2.5, md: 3 },
      }}
    >
      <Stack spacing={2}>
        <Box>
          <GradientTitle variant="h4" sx={{ mb: 0.5 }}>
            Event Viewer
          </GradientTitle>
          <SubText>
            View scheduled events and open event images in full screen. This view
            is read-only.
          </SubText>
        </Box>

        {loading ? (
          <Box
            sx={{
              minHeight: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stack spacing={1.2} alignItems="center">
              <CircularProgress />
              <Typography sx={{ color: "rgba(216,229,254,0.75)" }}>
                Loading events…
              </Typography>
            </Stack>
          </Box>
        ) : error ? (
          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid rgba(255, 120, 120, 0.18)",
              background: "rgba(255, 80, 80, 0.05)",
              p: 2,
            }}
          >
            <Typography sx={{ color: "rgba(255, 150, 150, 0.96)" }}>
              {error}
            </Typography>
          </Box>
        ) : !sortedEvents.length ? (
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
                  color: "rgba(245,248,255,0.90)",
                  fontWeight: 800,
                  mb: 0.35,
                }}
              >
                No events to display
              </Typography>
              <Typography
                sx={{ color: "rgba(216, 229, 254, 0.62)", fontSize: 14 }}
              >
                When events are added, they will appear here in a read-only view.
              </Typography>
            </Box>
          </Box>
        ) : (
          <Stack spacing={1.6}>
            {sortedEvents.map((event) => (
              <EventDisplayCard
                key={event.id}
                event={event}
                onOpenImage={setPreviewImage}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
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
        <Box
          onClick={() => setPreviewImage(null)}
          sx={{
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            position: "relative",
            background: "rgba(0,0,0,0.96)",
          }}
        >
          <IconButton
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              color: "white",
              zIndex: 2,
              backgroundColor: "rgba(0,0,0,0.45)",
              border: "1px solid rgba(255,255,255,0.16)",
            }}
          >
            <CloseIcon />
          </IconButton>

          {previewImage?.url ? (
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
                src={previewImage.url}
                alt={previewImage.fileName || "Preview image"}
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
    </Box>
  )
}