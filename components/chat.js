// components/ChatBot.jsx

import React, { useMemo, useRef, useState } from "react"
import { Box, Typography, Button, TextField, Divider } from "@mui/material"
import SendRoundedIcon from "@mui/icons-material/SendRounded"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import { motion } from "framer-motion"
import { useRouter } from "next/router"

function LoadingDots({ size = 8 }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.9, py: 2 }}>
      {[0, 1, 2].map((dot) => (
        <Box
          key={dot}
          component={motion.span}
          animate={{ y: [0, -7, 0], opacity: [0.34, 1, 0.34] }}
          transition={{
            duration: 0.78,
            repeat: Infinity,
            ease: "easeInOut",
            delay: dot * 0.14,
          }}
          sx={{
            width: size,
            height: size,
            borderRadius: "999px",
            background:
              dot === 0 ? "#7C3AED" : dot === 1 ? "#4F46E5" : "#22D3EE",
            boxShadow: "0 0 20px rgba(34,211,238,0.26)",
          }}
        />
      ))}
    </Box>
  )
}

export default function ChatBot(props) {
  const [prompt, setPrompt] = useState("Hello")
  const [response, setResponse] = useState("Hello, how can I help you today?")
  const [routeSuggestion, setRouteSuggestion] = useState(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const inputRef = useRef(null)
  const responseRef = useRef(null)

  const quickActions = useMemo(() => {
    return [
      { label: "What is Bergquist Applications?", ask: "What is Bergquist Applications?" },
      { label: "What are web components?", ask: "What are web components?" },
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
    setRouteSuggestion(null)
    setPrompt(cleanAsk)

    try {
      const r = await fetch("/api/home-route-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanAsk, source: "component-chatbot" }),
      })

      if (!r.ok) throw new Error(`Request failed with ${r.status}`)

      const session = await r.json()
      setResponse(session?.answer ?? "No response returned.")
      setRouteSuggestion(session?.route || null)

      requestAnimationFrame(() => {
        if (responseRef.current) responseRef.current.scrollTop = 0
      })
    } catch (e) {
      console.error(e)
      setResponse("Sorry - something went wrong while contacting the model.")
      setRouteSuggestion(null)
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

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#000",
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 2, sm: 2.5, md: 3 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          backgroundColor: "#000",
          borderRadius: 0,
          border: "none",
          boxShadow: "none",
        }}
      >
        <Box
          sx={{
            width: "100%",
            p: { xs: 1.25, sm: 1.75, md: 2.25 },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "flex-start", sm: "baseline" },
              justifyContent: "space-between",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: "Bemora",
                letterSpacing: 0.8,
                lineHeight: 1.15,
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
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
              gap: 1,
              mb: 1.75,
              width: "100%",
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
                  py: 1.15,
                  px: 1.25,
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "rgba(245, 248, 255, 0.88)",
                  fontFamily: "Helmet",
                  lineHeight: 1.2,
                  minHeight: 56,
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.10)",
                    borderColor: "rgba(255,255,255,0.18)",
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontFamily: "Helmet",
                    fontSize: 12.5,
                    textAlign: "center",
                  }}
                >
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
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "stretch",
              width: "100%",
            }}
          >
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
              placeholder="Ask something..."
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
                minWidth: 54,
                width: 54,
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

          {/* Loading / Response */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3, width: "100%" }}>
              <LoadingDots />
            </Box>
          ) : (
            <Box sx={{ mt: 2.25, width: "100%" }}>
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
                  minHeight: "42vh",
                  maxHeight: "60vh",
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  WebkitOverflowScrolling: "touch",
                  width: "100%",
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
              {!!routeSuggestion && (
                <Button
                  onClick={() => router.push(routeSuggestion.href)}
                  endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    mt: 1.2,
                    textTransform: "none",
                    borderRadius: 2,
                    px: 1.45,
                    py: 0.9,
                    fontFamily: "Helmet",
                    color: "rgba(255,255,255,0.92)",
                    background:
                      "linear-gradient(90deg, rgba(124,58,237,0.75) 0%, rgba(79,70,229,0.72) 35%, rgba(34,211,238,0.72) 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0.95) 0%, rgba(79,70,229,0.9) 35%, rgba(34,211,238,0.9) 100%)",
                    },
                  }}
                >
                  Visit {routeSuggestion.label}
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
