// components/ChatBot.jsx
// Updated (full file):
// - Expanded panel container is solid black (no transparency)
// - Loading pulse is slower
// - Loading video has no border (and wrapper has no border)

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Box, Typography, Button, TextField, Divider } from "@mui/material"
import LiveHelpIcon from "@mui/icons-material/LiveHelp"
import SendRoundedIcon from "@mui/icons-material/SendRounded"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/router"

export default function ChatBot(props) {
  const [expand, setExpand] = useState(false)

  const [prompt, setPrompt] = useState("Hello")
  const [response, setResponse] = useState("Hello, how can I help you today?")

  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const inputRef = useRef(null)
  const responseRef = useRef(null)


  const quickActions = useMemo(() => {
   
    return [
      { label: "What is Bergquist Applications?", ask: "What is Bergquist Applications?" },
      { label: "What is modern web development?", ask: "What is modern web development?" },
      { label: "How can I contact Bergquist Applications?", ask: "How can I contact Bergquist Applications?" },
      {
        label: "Explain the technologies used in Bergquist Applications",
        ask: "Explain the different technologies used in Bergquist Applications",
      },
    ]
  }, [])

  const askModel = async (ask) => {
    const cleanAsk = String(ask ?? "").trim()
    if (!cleanAsk) return

    setLoading(true)
    setResponse("")
    setPrompt(cleanAsk)


    try {
      const r = await fetch("/api/customModel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanAsk }),
      })

      const session = await r.json()
      setResponse(session?.response ?? "No response returned.")

      // scroll response to top when a new answer arrives
      requestAnimationFrame(() => {
        if (responseRef.current) responseRef.current.scrollTop = 0
      })
    } catch (e) {
      console.error(e)
      setResponse("Sorry — something went wrong while contacting the model.")
    } finally {
      setLoading(false)
    }
  }

  const handlePromptChange = (event) => {
    const { name, type, value, checked } = event.target
    if (name !== "prompt") return
    const v = type === "checkbox" ? checked : value
    setPrompt(String(v).replace(/(\r\n|\n|\r)/gm, ""))
  }

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      askModel(prompt)
    }
  }

  const panelVariants = {
    closed: { opacity: 0, y: 18, scale: 0.98, pointerEvents: "none" },
    open: { opacity: 1, y: 0, scale: 1, pointerEvents: "auto" },
  }

  return (
    <>
      {/* Floating toggle button */}
      <Button
        onClick={() => {
          setExpand((v) => !v)
          setTimeout(() => inputRef.current?.focus?.(), 120)
        }}
        sx={{
          zIndex: 1100,
          position: "fixed",
          right: 18,
          bottom: 18,
          minWidth: 0,
          width: 54,
          height: 54,
          borderRadius: "999px",
          p: 0,
          background:
            "linear-gradient(90deg, rgba(124,58,237,0.9) 0%, rgba(79,70,229,0.9) 35%, rgba(34,211,238,0.9) 100%)",
          boxShadow: "0 14px 40px rgba(0,0,0,0.55)",
          "&:hover": {
            background:
              "linear-gradient(90deg, rgba(124,58,237,1) 0%, rgba(79,70,229,1) 35%, rgba(34,211,238,1) 100%)",
          },
        }}
      >
        <LiveHelpIcon sx={{ fontSize: 26, color: "rgba(255,255,255,0.92)" }} />
      </Button>

      {/* Panel */}
      <AnimatePresence>
        {expand && (
          <Box
            component={motion.div}
            key="chatbot-panel"
            initial="closed"
            animate="open"
            exit="closed"
            variants={panelVariants}
            transition={{ duration: 0.22, ease: "easeOut" }}
            sx={{
              zIndex: 1099,
              position: "fixed",
              right: "2%",
              bottom: 86,
              width: "96%",
            }}
          >
            <Box
              sx={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 3,
                backgroundColor: "#000", // solid black when expanded
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 18px 70px rgba(0,0,0,0.72)",
              }}
            >
              {/* Content */}
              <Box sx={{ position: "relative", zIndex: 1, p: 2.25 }}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Bemora",
                      letterSpacing: 0.8,
                      lineHeight: 1.2,
                      backgroundImage: "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                      textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                    }}
                  >
                    AI Assistant
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(216, 229, 254, 0.72)",
                      fontFamily: "FallingSky",
                      letterSpacing: 0.4,
                    }}
                  >
                    General mode
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.10)" }} />

                {/* Quick actions */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  {quickActions.map((qa) => (
                    <Button
                      key={qa.label}
                      onClick={() => askModel(qa.ask)}
                      disabled={loading}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        py: 1,
                        px: 1.25,
                        border: "1px solid rgba(255,255,255,0.12)",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: "rgba(245, 248, 255, 0.88)",
                        fontFamily: "Helmet",
                        lineHeight: 1.2,
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,0.10)",
                          borderColor: "rgba(255,255,255,0.18)",
                        },
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontFamily: "Helmet", fontSize: 12.5 }}>
                        {qa.label}
                      </Typography>
                    </Button>
                  ))}
                </Box>

                <Typography
                    variant="overline"
                    sx={{
                      color: "rgba(216, 229, 254, 0.65)",
                      letterSpacing: 1.2,
                      fontFamily: "Helmet",
                    }}
                  >
                    Input
                  </Typography>

                {/* Input */}
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    inputRef={inputRef}
                    onChange={handlePromptChange}
                    onKeyDown={onKeyDown}
                    value={prompt}
                    multiline
                    minRows={1}
                    maxRows={4}
                    type="text"
                    name="prompt"
                    autoComplete="off"
                    placeholder="Ask something…"
                    fullWidth
                    InputProps={{
                      sx: {
                        color: "rgba(245, 248, 255, 0.92)",
                        fontFamily: "FallingSky",
                        borderRadius: 2,
                        backgroundColor: "rgba(0,0,0,0.45)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        "&:hover": { borderColor: "rgba(255,255,255,0.18)" },
                        "&.Mui-focused": { borderColor: "rgba(34,211,238,0.45)" },
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    }}
                  />

                  <Button
                    onClick={() => askModel(prompt)}
                    disabled={loading}
                    sx={{
                      minWidth: 48,
                      height: 44,
                      borderRadius: 2,
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0.85) 0%, rgba(79,70,229,0.85) 35%, rgba(34,211,238,0.85) 100%)",
                      color: "rgba(255,255,255,0.92)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                      "&:hover": {
                        background:
                          "linear-gradient(90deg, rgba(124,58,237,1) 0%, rgba(79,70,229,1) 35%, rgba(34,211,238,1) 100%)",
                      },
                    }}
                  >
                    <SendRoundedIcon sx={{ fontSize: 18 }} />
                  </Button>
                </Box>

                

                {/* Loading indicator (pulsing video) */}
                {loading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Box
                      component={motion.div}
                      animate={{ opacity: [0.45, 1, 0.45], scale: [0.99, 1.015, 0.99] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} // slower pulse
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: 3,
                        overflow: "hidden",
                        border: "none", // no border
                        backgroundColor: "transparent", // optional: no panel behind video
                        boxShadow: "0 12px 35px rgba(0,0,0,0.55)",
                      }}
                    >
                      <Box
                        component="video"
                        src="/home/AI.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="auto"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          border: "none",
                          outline: "none",
                          filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.55))",
                        }}
                      />
                    </Box>
                  </Box>
                ) : 
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "rgba(216, 229, 254, 0.65)",
                      letterSpacing: 1.2,
                      fontFamily: "Helmet",
                    }}
                  >
                    Response
                  </Typography>

                  <Box
                    ref={responseRef}
                    sx={{
                      mt: 0.75,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      maxHeight: "30vh",
                      overflowY: "auto",
                      overscrollBehavior: "contain",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: "rgba(245, 248, 255, 0.88)",
                        lineHeight: 1.65,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {response}
                    </Typography>
                  </Box>
                </Box>}

                
              </Box>
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </>
  )
}
