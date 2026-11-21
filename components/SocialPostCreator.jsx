// components/SocialPostCreator.jsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline"
import ImageIcon from "@mui/icons-material/Image"
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import SaveIcon from "@mui/icons-material/Save"
import SendIcon from "@mui/icons-material/Send"
import KeyIcon from "@mui/icons-material/Key"
import { onAuthStateChanged } from "firebase/auth"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"

import { auth, db } from "../Firebase/FirebaseInit"

const MAX_REFERENCE_IMAGES = 8

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "discord", label: "Discord" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
]

function safeClientFileName(name = "image") {
  return String(name || "image")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 120)
}

function databaseImageOptions(items = []) {
  return items
    .flatMap((item) => {
      const media = Array.isArray(item?.media)
        ? item.media
        : Array.isArray(item?.images)
          ? item.images
          : []

      return media
        .filter((image) => {
          const contentType = String(image?.contentType || "")
          const kind = String(image?.kind || "")
          return (
            image?.downloadURL &&
            !contentType.startsWith("video/") &&
            kind !== "video"
          )
        })
        .map((image, index) => ({
          id: `${item.id || item.title || "item"}-${image.id || image.downloadURL || index}`,
          url: image.downloadURL,
          name: image.name || image.fileName || `${item.title || "database"}-${index + 1}.png`,
          itemTitle: item.title || "Saved database item",
          note: image.note || item.summary || "",
          contentType: image.contentType || "image/png",
        }))
    })
    .slice(0, 30)
}

async function savedImageOptionToFile(option, index) {
  const response = await fetch(option.url)

  if (!response.ok) {
    throw new Error(`Could not load saved database image: ${option.name}`)
  }

  const blob = await response.blob()
  const contentType = blob.type || option.contentType || "image/png"
  const extension = contentType.includes("jpeg")
    ? "jpg"
    : contentType.includes("webp")
      ? "webp"
      : contentType.includes("gif")
        ? "gif"
        : "png"
  const baseName = safeClientFileName(option.name || `database-image-${index + 1}`)
  const fileName = /\.[a-z0-9]+$/i.test(baseName)
    ? baseName
    : `${baseName}.${extension}`

  return new File([blob], fileName, { type: contentType })
}

function createPreviewFile(file) {
  return {
    id: `${file.name}-${file.lastModified}-${
      crypto.randomUUID?.() || Math.random()
    }`,
    file,
    previewUrl: URL.createObjectURL(file),
  }
}

function emptyIntegrationForm() {
  return {
    discord: {
      webhookUrl: "",
    },
    instagram: {
      accessToken: "",
      igUserId: "",
    },
    facebook: {
      pageAccessToken: "",
      pageId: "",
    },
    linkedin: {
      accessToken: "",
      authorUrn: "",
    },
  }
}

function UploadDropZone({
  title,
  subtitle,
  multiple = false,
  disabled = false,
  onFiles,
  children,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (files) => {
    const imageFiles = Array.from(files || []).filter((file) =>
      file.type.startsWith("image/")
    )

    if (!imageFiles.length) return

    onFiles(multiple ? imageFiles : [imageFiles[0]])
  }

  return (
    <Paper
      elevation={0}
      onDragEnter={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        setDragging(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        if (!disabled) handleFiles(event.dataTransfer.files)
      }}
      sx={{
        p: 3,
        borderRadius: 4,
        border: dragging
          ? "1px dashed rgba(122, 230, 255, 0.95)"
          : "1px dashed rgba(255,255,255,0.28)",
        background: dragging
          ? "linear-gradient(145deg, rgba(30,45,70,0.96), rgba(5,5,8,0.96))"
          : "linear-gradient(145deg, rgba(18,18,24,0.96), rgba(5,5,8,0.96))",
        color: "white",
        textAlign: "center",
        transition: "border-color 180ms ease, background 180ms ease",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ""
        }}
      />

      <Stack alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <ImageIcon />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          {title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "rgba(255,255,255,0.68)",
            maxWidth: 520,
          }}
        >
          {subtitle}
        </Typography>

        <Button
          variant="contained"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          sx={{
            mt: 1,
            borderRadius: 999,
            px: 3,
            py: 1,
            fontWeight: 900,
            background:
              "linear-gradient(90deg, rgba(107,92,255,1), rgba(0,210,255,1))",
            "&.Mui-disabled": {
              color: "rgba(255,255,255,0.35)",
              background: "rgba(255,255,255,0.08)",
            },
          }}
        >
          Add Image
        </Button>
      </Stack>

      {children}
    </Paper>
  )
}

export default function SocialPostCreator({
  embedded = false,
  savedDatabaseItems = [],
}) {
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState(null)

  const [postPrompt, setPostPrompt] = useState("")
  const [referenceImages, setReferenceImages] = useState([])
  const [selectedDatabaseImageIds, setSelectedDatabaseImageIds] = useState([])
  const [logo, setLogo] = useState(null)

  const [pastPosts, setPastPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [latestPost, setLatestPost] = useState(null)

  const [previewImage, setPreviewImage] = useState(null)

  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const [integrationForm, setIntegrationForm] = useState(emptyIntegrationForm)
  const [integrationStatus, setIntegrationStatus] = useState(emptyIntegrationForm)

  const [generating, setGenerating] = useState(false)
  const [savingPost, setSavingPost] = useState(false)
  const [savingIntegrations, setSavingIntegrations] = useState(false)
  const [publishingPlatform, setPublishingPlatform] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const displayedPost = latestPost || selectedPost
  const savedImageOptions = useMemo(
    () => databaseImageOptions(savedDatabaseItems),
    [savedDatabaseItems]
  )
  const selectedDatabaseImages = useMemo(
    () =>
      savedImageOptions.filter((image) =>
        selectedDatabaseImageIds.includes(image.id)
      ),
    [savedImageOptions, selectedDatabaseImageIds]
  )

  const canGenerate = useMemo(() => {
    return Boolean(user && postPrompt.trim() && !generating)
  }, [user, postPrompt, generating])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser || null)
      setAuthReady(true)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      setPastPosts([])
      return undefined
    }

    const postsRef = collection(db, "users", user.uid, "socialPosts")
    const postsQuery = query(postsRef, orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const posts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setPastPosts(posts)
      },
      (err) => {
        console.error(err)
        setError("Could not load past generated posts.")
      }
    )

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    if (!user) return
    loadIntegrations()
  }, [user])

  useEffect(() => {
    if (!displayedPost) {
      setEditTitle("")
      setEditDescription("")
      return
    }

    setEditTitle(displayedPost.title || "")
    setEditDescription(displayedPost.description || "")
  }, [displayedPost?.id, displayedPost?.title, displayedPost?.description])

  useEffect(() => {
    return () => {
      referenceImages.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl)
      })

      if (logo?.previewUrl) {
        URL.revokeObjectURL(logo.previewUrl)
      }
    }
  }, [])

  const getAuthToken = async () => {
    if (!user) throw new Error("You must be logged in.")
    return user.getIdToken()
  }

  const loadIntegrations = async () => {
    try {
      const token = await getAuthToken()

      const response = await fetch("/api/social-integrations", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not load social integrations.")
      }

      setIntegrationStatus(data.integrations || emptyIntegrationForm())
    } catch (err) {
      console.error(err)
      setError(err.message || "Could not load social integrations.")
    }
  }

  const saveIntegrations = async () => {
    setSavingIntegrations(true)
    setError("")
    setSuccess("")

    try {
      const token = await getAuthToken()

      const response = await fetch("/api/social-integrations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(integrationForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not save integrations.")
      }

      setIntegrationStatus(data.integrations || emptyIntegrationForm())
      setIntegrationForm(emptyIntegrationForm())
      setSuccess("Social media API settings saved.")
    } catch (err) {
      console.error(err)
      setError(err.message || "Could not save integrations.")
    } finally {
      setSavingIntegrations(false)
    }
  }

  const updateIntegrationField = (platform, field, value) => {
    setIntegrationForm((current) => ({
      ...current,
      [platform]: {
        ...current[platform],
        [field]: value,
      },
    }))
  }

  const addReferenceImages = (files) => {
    setError("")
    setSuccess("")

    setReferenceImages((current) => {
      const roomLeft =
        MAX_REFERENCE_IMAGES - current.length - selectedDatabaseImageIds.length

      if (roomLeft <= 0) {
        setError(`You can only add up to ${MAX_REFERENCE_IMAGES} total reference images.`)
        return current
      }

      const nextFiles = files.slice(0, roomLeft).map(createPreviewFile)
      return [...current, ...nextFiles]
    })
  }

  const removeReferenceImage = (id) => {
    setReferenceImages((current) => {
      const removed = current.find((image) => image.id === id)

      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl)
      }

      return current.filter((image) => image.id !== id)
    })
  }

  const toggleDatabaseImage = (id) => {
    setError("")
    setSuccess("")

    setSelectedDatabaseImageIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id)
      }

      const totalReferenceCount = referenceImages.length + current.length
      if (totalReferenceCount >= MAX_REFERENCE_IMAGES) {
        setError(`You can only add up to ${MAX_REFERENCE_IMAGES} total reference images.`)
        return current
      }

      return [...current, id]
    })
  }

  const setLogoFile = (files) => {
    setError("")
    setSuccess("")

    if (logo?.previewUrl) {
      URL.revokeObjectURL(logo.previewUrl)
    }

    const file = files[0]
    setLogo(file ? createPreviewFile(file) : null)
  }

  const clearLogo = () => {
    if (logo?.previewUrl) {
      URL.revokeObjectURL(logo.previewUrl)
    }

    setLogo(null)
  }

  const generatePost = async () => {
    if (!user) {
      setError("You must be logged in to generate a social media post.")
      return
    }

    if (!postPrompt.trim()) {
      setError("Enter what you want the social media post to be.")
      return
    }

    setGenerating(true)
    setError("")
    setSuccess("")
    setLatestPost(null)

    try {
      const token = await getAuthToken()

      const formData = new FormData()
      formData.append("prompt", postPrompt.trim())

      referenceImages.forEach((image) => {
        formData.append("referenceImages", image.file)
      })

      const savedImageFiles = await Promise.all(
        selectedDatabaseImages.map((image, index) =>
          savedImageOptionToFile(image, index)
        )
      )

      savedImageFiles.forEach((file) => {
        formData.append("referenceImages", file)
      })

      if (logo?.file) {
        formData.append("logo", logo.file)
      }

      const response = await fetch("/api/generate-social-post", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate social media post.")
      }

      setLatestPost(data.post)
      setSelectedPost(null)
      setSuccess("Social media post generated.")
    } catch (err) {
      console.error(err)
      setError(err.message || "Failed to generate social media post.")
    } finally {
      setGenerating(false)
    }
  }

  const savePostEdits = async () => {
    if (!displayedPost?.id) return

    setSavingPost(true)
    setError("")
    setSuccess("")

    try {
      const token = await getAuthToken()

      const response = await fetch("/api/update-social-post", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: displayedPost.id,
          title: editTitle,
          description: editDescription,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Could not save post edits.")
      }

      if (latestPost?.id === displayedPost.id) {
        setLatestPost(data.post)
      }

      if (selectedPost?.id === displayedPost.id) {
        setSelectedPost(data.post)
      }

      setSuccess("Post title and description saved.")
    } catch (err) {
      console.error(err)
      setError(err.message || "Could not save post edits.")
    } finally {
      setSavingPost(false)
    }
  }

  const publishPost = async (platform) => {
    if (!displayedPost?.id) return

    setPublishingPlatform(platform)
    setError("")
    setSuccess("")

    try {
      const token = await getAuthToken()

      const response = await fetch("/api/publish-social-post", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: displayedPost.id,
          platform,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Could not publish to ${platform}.`)
      }

      setSuccess(`Published to ${platform}.`)
    } catch (err) {
      console.error(err)
      setError(err.message || `Could not publish to ${platform}.`)
    } finally {
      setPublishingPlatform("")
    }
  }

  if (!authReady) {
    return (
      <Box
        sx={{
          minHeight: embedded ? 220 : "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: embedded ? "transparent" : "#050507",
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return (
      <Box
        sx={{
          p: embedded ? 0 : { xs: 2, md: 4 },
          minHeight: embedded ? "auto" : "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: embedded
            ? "transparent"
            : "radial-gradient(circle at top, rgba(64,58,140,0.24), transparent 36%), #050507",
          color: "white",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            maxWidth: 620,
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            textAlign: "center",
            background:
              "linear-gradient(145deg, rgba(20,20,28,0.98), rgba(5,5,8,0.98))",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "white",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 950, mb: 1 }}>
            Social Post Creator
          </Typography>

          <Typography sx={{ color: "rgba(255,255,255,0.72)" }}>
            You need to be logged in before you can generate and save social
            media posts.
          </Typography>
        </Paper>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        p: embedded ? 0 : { xs: 2, md: 4 },
        minHeight: embedded ? "auto" : "100vh",
        background:
          embedded
            ? "transparent"
            : "radial-gradient(circle at top, rgba(64,58,140,0.28), transparent 34%), #050507",
        color: "white",
      }}
    >
      <Box sx={{ maxWidth: 1320, mx: "auto" }}>
        {!embedded && (
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 4 }}
          >
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 950,
                  mb: 1,
                  background:
                    "linear-gradient(90deg, #ffffff, #9dc8ff, #79f7ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Social Post Creator
              </Typography>

              <Typography sx={{ color: "rgba(255,255,255,0.68)" }}>
                Upload reference images, add a logo, describe the post, then
                generate a finished image, title, and description.
              </Typography>
            </Box>

            <Chip
              label={`Logged in: ${user.email || user.uid}`}
              sx={{
                color: "white",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontWeight: 700,
              }}
            />
          </Stack>
        )}

        {embedded && (
          <Stack spacing={0.65} sx={{ mb: 2 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 950,
                background:
                  "linear-gradient(90deg, #ffffff, #9dc8ff, #79f7ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Social media generator
            </Typography>
            <Typography sx={{ color: "rgba(216,229,254,0.68)", fontSize: 13.5, lineHeight: 1.55 }}>
              Use images from your database or computer, generate a post with AI,
              review it, then publish to saved social accounts.
            </Typography>
          </Stack>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Stack spacing={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background:
                    "linear-gradient(145deg, rgba(18,18,24,0.96), rgba(5,5,8,0.96))",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 900, mb: 2, color: "white" }}
                >
                  Post Details
                </Typography>

                <TextField
                  multiline
                  minRows={5}
                  fullWidth
                  value={postPrompt}
                  onChange={(event) => setPostPrompt(event.target.value)}
                  placeholder="Example: Create a dramatic Dark Coin arena announcement post showing two champions about to fight, with a callout for the next battle."
                  label="What should the social media post be?"
                  InputLabelProps={{
                    sx: { color: "rgba(255,255,255,0.75)" },
                  }}
                  sx={darkTextFieldSx}
                />
              </Paper>

              <UploadDropZone
                title="Reference Images"
                subtitle={`Drag and drop images here, or add up to ${MAX_REFERENCE_IMAGES} images. Click an image to view it larger.`}
                multiple
                disabled={generating}
                onFiles={addReferenceImages}
              >
                {referenceImages.length > 0 && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {referenceImages.map((image) => (
                      <Grid item xs={6} sm={4} md={3} key={image.id}>
                        <Box
                          sx={{
                            position: "relative",
                            borderRadius: 3,
                            overflow: "hidden",
                            border: "1px solid rgba(255,255,255,0.14)",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setPreviewImage({
                              src: image.previewUrl,
                              title: image.file.name,
                            })
                          }
                        >
                          <Box
                            component="img"
                            src={image.previewUrl}
                            alt={image.file.name}
                            sx={{
                              width: "100%",
                              aspectRatio: "1 / 1",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />

                          <IconButton
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation()
                              removeReferenceImage(image.id)
                            }}
                            sx={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              color: "white",
                              background: "rgba(0,0,0,0.72)",
                              "&:hover": {
                                background: "rgba(180,30,60,0.92)",
                              },
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </UploadDropZone>

              {savedImageOptions.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background:
                      "linear-gradient(145deg, rgba(18,18,24,0.96), rgba(5,5,8,0.96))",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1}
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 900, color: "white" }}
                      >
                        Database Images
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.62)" }}
                      >
                        Select saved images to use as AI references.
                      </Typography>
                    </Box>
                    <Chip
                      label={`${selectedDatabaseImages.length} selected`}
                      sx={{
                        color: "white",
                        background: "rgba(150,120,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    />
                  </Stack>

                  <Grid container spacing={1.5}>
                    {savedImageOptions.map((image) => {
                      const selected = selectedDatabaseImageIds.includes(image.id)

                      return (
                        <Grid item xs={6} sm={4} md={3} key={image.id}>
                          <Box
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleDatabaseImage(image.id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                toggleDatabaseImage(image.id)
                              }
                            }}
                            sx={{
                              borderRadius: 3,
                              overflow: "hidden",
                              cursor: "pointer",
                              border: selected
                                ? "2px solid rgba(125,220,255,0.95)"
                                : "1px solid rgba(255,255,255,0.14)",
                              background: selected
                                ? "rgba(125,220,255,0.1)"
                                : "rgba(255,255,255,0.04)",
                            }}
                          >
                            <Box
                              component="img"
                              src={image.url}
                              alt={image.name}
                              sx={{
                                width: "100%",
                                aspectRatio: "1 / 1",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                            <Box sx={{ p: 0.8 }}>
                              <Typography
                                sx={{
                                  color: "white",
                                  fontSize: 11,
                                  fontWeight: 800,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {image.itemTitle}
                              </Typography>
                              <Typography
                                sx={{
                                  color: "rgba(255,255,255,0.56)",
                                  fontSize: 10,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {image.name}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      )
                    })}
                  </Grid>
                </Paper>
              )}

              <UploadDropZone
                title="Logo"
                subtitle="Add one logo. The API will use it as brand identity in the generated post."
                multiple={false}
                disabled={generating}
                onFiles={setLogoFile}
              >
                {logo && (
                  <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                    <Box
                      sx={{
                        width: 190,
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.14)",
                        position: "relative",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setPreviewImage({
                          src: logo.previewUrl,
                          title: logo.file.name,
                        })
                      }
                    >
                      <Box
                        component="img"
                        src={logo.previewUrl}
                        alt={logo.file.name}
                        sx={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "contain",
                          background: "rgba(255,255,255,0.06)",
                          display: "block",
                        }}
                      />

                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation()
                          clearLogo()
                        }}
                        sx={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          color: "white",
                          background: "rgba(0,0,0,0.72)",
                          "&:hover": {
                            background: "rgba(180,30,60,0.92)",
                          },
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </UploadDropZone>

              <Button
                disabled={!canGenerate}
                onClick={generatePost}
                variant="contained"
                startIcon={
                  generating ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <AutoAwesomeIcon />
                  )
                }
                sx={{
                  py: 1.6,
                  borderRadius: 999,
                  fontWeight: 950,
                  fontSize: "1rem",
                  background:
                    "linear-gradient(90deg, rgba(107,92,255,1), rgba(0,210,255,1))",
                  "&.Mui-disabled": {
                    color: "rgba(255,255,255,0.35)",
                    background: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                {generating ? "Generating Post..." : "Generate Social Media Post"}
              </Button>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background:
                    "linear-gradient(145deg, rgba(18,18,24,0.96), rgba(5,5,8,0.96))",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <KeyIcon />
                  <Typography variant="h6" sx={{ fontWeight: 900, color: "white" }}>
                    Social Media API Settings
                  </Typography>
                </Stack>

                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.65)", mb: 2 }}
                >
                  Saved credentials are encrypted server-side and are not shown
                  again after saving. Leave fields blank if you do not want to
                  replace a saved value.
                </Typography>

                <Stack spacing={1.5}>
                  <Accordion sx={accordionSx}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
                    >
                      <Typography sx={{ fontWeight: 900 }}>
                        Discord {integrationStatus.discord?.connected ? "✓" : ""}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TextField
                        fullWidth
                        label="Discord Webhook URL"
                        value={integrationForm.discord.webhookUrl}
                        onChange={(event) =>
                          updateIntegrationField(
                            "discord",
                            "webhookUrl",
                            event.target.value
                          )
                        }
                        sx={darkTextFieldSx}
                      />
                    </AccordionDetails>
                  </Accordion>

                  <Accordion sx={accordionSx}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
                    >
                      <Typography sx={{ fontWeight: 900 }}>
                        Instagram {integrationStatus.instagram?.connected ? "✓" : ""}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        <TextField
                          fullWidth
                          label="Instagram Access Token"
                          value={integrationForm.instagram.accessToken}
                          onChange={(event) =>
                            updateIntegrationField(
                              "instagram",
                              "accessToken",
                              event.target.value
                            )
                          }
                          sx={darkTextFieldSx}
                        />
                        <TextField
                          fullWidth
                          label="Instagram Business/Creator User ID"
                          value={integrationForm.instagram.igUserId}
                          onChange={(event) =>
                            updateIntegrationField(
                              "instagram",
                              "igUserId",
                              event.target.value
                            )
                          }
                          placeholder={integrationStatus.instagram?.igUserId || ""}
                          sx={darkTextFieldSx}
                        />
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion sx={accordionSx}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
                    >
                      <Typography sx={{ fontWeight: 900 }}>
                        Facebook {integrationStatus.facebook?.connected ? "✓" : ""}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        <TextField
                          fullWidth
                          label="Facebook Page Access Token"
                          value={integrationForm.facebook.pageAccessToken}
                          onChange={(event) =>
                            updateIntegrationField(
                              "facebook",
                              "pageAccessToken",
                              event.target.value
                            )
                          }
                          sx={darkTextFieldSx}
                        />
                        <TextField
                          fullWidth
                          label="Facebook Page ID"
                          value={integrationForm.facebook.pageId}
                          onChange={(event) =>
                            updateIntegrationField(
                              "facebook",
                              "pageId",
                              event.target.value
                            )
                          }
                          placeholder={integrationStatus.facebook?.pageId || ""}
                          sx={darkTextFieldSx}
                        />
                      </Stack>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion sx={accordionSx}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
                    >
                      <Typography sx={{ fontWeight: 900 }}>
                        LinkedIn {integrationStatus.linkedin?.connected ? "✓" : ""}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={2}>
                        <TextField
                          fullWidth
                          label="LinkedIn Access Token"
                          value={integrationForm.linkedin.accessToken}
                          onChange={(event) =>
                            updateIntegrationField(
                              "linkedin",
                              "accessToken",
                              event.target.value
                            )
                          }
                          sx={darkTextFieldSx}
                        />
                        <TextField
                          fullWidth
                          label="LinkedIn Author URN"
                          value={integrationForm.linkedin.authorUrn}
                          onChange={(event) =>
                            updateIntegrationField(
                              "linkedin",
                              "authorUrn",
                              event.target.value
                            )
                          }
                          placeholder="urn:li:person:xxxx or urn:li:organization:xxxx"
                          sx={darkTextFieldSx}
                        />
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </Stack>

                <Button
                  fullWidth
                  onClick={saveIntegrations}
                  disabled={savingIntegrations}
                  startIcon={
                    savingIntegrations ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  sx={{
                    mt: 2,
                    borderRadius: 999,
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.18)",
                    fontWeight: 900,
                  }}
                >
                  {savingIntegrations ? "Saving API Settings..." : "Save API Settings"}
                </Button>
              </Paper>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 4,
                background:
                  "linear-gradient(145deg, rgba(18,18,24,0.96), rgba(5,5,8,0.96))",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
                position: { md: "sticky" },
                top: { md: 24 },
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 950, mb: 2 }}>
                Generated Post
              </Typography>

              {!displayedPost ? (
                <Box
                  sx={{
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.12)",
                    p: 4,
                    minHeight: 360,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "rgba(255,255,255,0.58)",
                  }}
                >
                  Your generated social post will appear here.
                </Box>
              ) : (
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.045)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={displayedPost.imageUrl}
                    alt={displayedPost.title}
                    sx={{
                      width: "100%",
                      aspectRatio: "3 / 2",
                      objectFit: "cover",
                      background: "rgba(255,255,255,0.04)",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setPreviewImage({
                        src: displayedPost.imageUrl,
                        title: displayedPost.title,
                      })
                    }
                  />

                  <CardContent>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Title"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        sx={darkTextFieldSx}
                      />

                      <TextField
                        fullWidth
                        multiline
                        minRows={4}
                        label="Description"
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(event.target.value)
                        }
                        sx={darkTextFieldSx}
                      />

                      <Button
                        onClick={savePostEdits}
                        disabled={savingPost}
                        startIcon={
                          savingPost ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        sx={{
                          borderRadius: 999,
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.18)",
                          fontWeight: 900,
                        }}
                      >
                        {savingPost ? "Saving..." : "Save Title and Description"}
                      </Button>
                    </Stack>

                    <Divider
                      sx={{
                        my: 2,
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                    />

                    <Typography
                      variant="caption"
                      sx={{
                        color: "rgba(255,255,255,0.5)",
                        fontWeight: 800,
                      }}
                    >
                      Prompt
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.5,
                        color: "rgba(255,255,255,0.82)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {displayedPost.prompt}
                    </Typography>

                    <Button
                      href={displayedPost.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      fullWidth
                      sx={{
                        mt: 2,
                        borderRadius: 999,
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.18)",
                        fontWeight: 900,
                      }}
                    >
                      Open Image
                    </Button>

                    <Divider
                      sx={{
                        my: 2,
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                    />

                    <Typography variant="h6" sx={{ fontWeight: 950, mb: 1 }}>
                      Publish Directly
                    </Typography>

                    <Grid container spacing={1}>
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <Grid item xs={12} sm={6} key={platform.key}>
                          <Button
                            fullWidth
                            onClick={() => publishPost(platform.key)}
                            disabled={Boolean(publishingPlatform)}
                            startIcon={
                              publishingPlatform === platform.key ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <SendIcon />
                              )
                            }
                            sx={{
                              borderRadius: 999,
                              color: "white",
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid rgba(255,255,255,0.14)",
                              fontWeight: 900,
                              "&:hover": {
                                background: "rgba(125,220,255,0.16)",
                              },
                            }}
                          >
                            {publishingPlatform === platform.key
                              ? "Posting..."
                              : platform.label}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Typography variant="h4" sx={{ fontWeight: 950 }}>
              Past Generated Posts
            </Typography>

            <Chip
              label={`${pastPosts.length} saved`}
              sx={{
                color: "white",
                background: "rgba(255,255,255,0.1)",
                fontWeight: 800,
              }}
            />
          </Stack>

          {pastPosts.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 4,
                background: "rgba(255,255,255,0.045)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.68)",
                textAlign: "center",
              }}
            >
              No generated social media posts yet.
            </Paper>
          ) : (
            <Grid container spacing={2.5}>
              {pastPosts.map((post) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={post.id}>
                  <Card
                    elevation={0}
                    onClick={() => {
                      setSelectedPost(post)
                      setLatestPost(null)
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                    sx={{
                      height: "100%",
                      cursor: "pointer",
                      borderRadius: 4,
                      overflow: "hidden",
                      background: "rgba(255,255,255,0.045)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.12)",
                      transition:
                        "transform 180ms ease, border-color 180ms ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        borderColor: "rgba(125,220,255,0.65)",
                      },
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={post.imageUrl}
                      alt={post.title}
                      sx={{
                        width: "100%",
                        aspectRatio: "3 / 2",
                        objectFit: "cover",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    />

                    <CardContent>
                      <Typography
                        sx={{
                          fontWeight: 950,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(255,255,255,0.65)",
                          mt: 1,
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.description}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 1.5 }}
                      >
                        {post.hasLogo && (
                          <Chip
                            size="small"
                            label="Logo"
                            sx={{
                              color: "white",
                              background: "rgba(255,255,255,0.1)",
                            }}
                          />
                        )}

                        {post.referenceImageCount > 0 && (
                          <Chip
                            size="small"
                            label={`${post.referenceImageCount} refs`}
                            sx={{
                              color: "white",
                              background: "rgba(150,120,255,0.18)",
                            }}
                          />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          onClick: () => setPreviewImage(null),
          sx: {
            background: "rgba(0,0,0,0)",
            boxShadow: "none",
            color: "white",
            cursor: "pointer",
          },
        }}
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(0,0,0,0.86)",
          },
        }}
      >
        <DialogContent
          onClick={() => setPreviewImage(null)}
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {previewImage?.src && (
            <Box
              component="img"
              src={previewImage.src}
              alt={previewImage.title || "Preview"}
              sx={{
                maxWidth: "100%",
                maxHeight: "86vh",
                objectFit: "contain",
                borderRadius: 3,
                background: "rgba(255,255,255,0.04)",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

const accordionSx = {
  background: "rgba(255,255,255,0.045)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px !important",
  "&:before": {
    display: "none",
  },
}

const darkTextFieldSx = {
  "& .MuiInputLabel-root": {
    color: "rgba(255,255,255,0.72)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "rgba(125,220,255,0.95)",
  },
  "& .MuiOutlinedInput-root": {
    color: "white",
    borderRadius: 3,
    background: "rgba(255,255,255,0.045)",
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.18)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(125,220,255,0.55)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "rgba(125,220,255,0.9)",
    },
  },
}
