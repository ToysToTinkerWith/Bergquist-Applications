import React, { useEffect, useMemo, useRef, useState } from "react"
import SiteLink from "./SiteLink"
import { readAssistantResponse } from "../lib/assistantStream"
import { assistantQuickAnswer } from "../lib/assistantQuickAnswers"
import { Box, Typography, Button, TextField, Divider, IconButton, Tooltip } from "@mui/material"
import RadarRoundedIcon from "@mui/icons-material/RadarRounded"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import SendRoundedIcon from "@mui/icons-material/SendRounded"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded"
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { useRouter } from "next/router"
import { MAX_ASSISTANT_PROMPT, normalizeConversationHistory, safeAssistantRoute, assistantLinkLabel, INTRO_QUESTION, INTRO_ANSWER } from "../lib/assistantConversation"
import { ASSISTANT_QUESTIONS } from "../lib/cockpitSystems"

function LoadingDots({ size = 7 }) {
  const reducedMotion = useReducedMotion()
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.8, py: 1.5 }}>
      {[0, 1, 2].map((dot) => (
        <Box
          key={dot}
          component={motion.span}
          animate={reducedMotion ? { opacity: 0.7 } : { y: [0, -4, 0], opacity: [0.36, 1, 0.36] }}
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
              dot === 0 ? "#baa5e2" : dot === 1 ? "#a1b7cf" : "#9dcec6",
          }}
        />
      ))}
    </Box>
  )
}

export default function ChatBot(props) {
  const {
    embedded = false,
    defaultExpanded = false,
    hideToggle = false,
    source = "floating-chatbot",
    cockpit = false,
    onStateChange,
    suggestedQuestions = ASSISTANT_QUESTIONS,
    initialPrompt = INTRO_QUESTION,
    initialAnswer = INTRO_ANSWER,
  } = props || {}
  const [expand, setExpand] = useState(defaultExpanded)
  const [footerVisible, setFooterVisible] = useState(false)
  const reducedMotion = useReducedMotion()
  const floatingRef = useRef(null)
  const toggleRef = useRef(null)

  const initialConversation = () => [{ role: "user", content: initialPrompt }, { role: "assistant", content: initialAnswer }]
  const [prompt, setPrompt] = useState(initialPrompt)
  const [response, setResponse] = useState(initialAnswer)
  const [routeSuggestion, setRouteSuggestion] = useState(null)

  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState(initialConversation)
  const [error, setError] = useState("")

  const router = useRouter()
  const inputRef = useRef(null)
  const responseRef = useRef(null)
  const requestRef = useRef(null)
  const lastQuestionRef = useRef("")
  useEffect(() => {
    if (embedded) return
    const footer = document.querySelector("[data-site-footer]")
    if (!footer) return
    const observer = new IntersectionObserver(([entry]) => {
      const hidden = entry.isIntersecting
      if (hidden && floatingRef.current?.contains(document.activeElement)) {
        footer.setAttribute("tabindex", "-1")
        footer.focus({ preventScroll: true })
      }
      setFooterVisible(hidden)
    }, { rootMargin: "0px 0px -80px 0px" })
    observer.observe(footer)
    return () => observer.disconnect()
  }, [embedded, router.pathname])
  const closePanel = () => { setExpand(false); toggleRef.current?.focus() }
  useEffect(() => {
    if (embedded || !expand) return
    const escape = event => { if (event.key === "Escape") closePanel() }
    window.addEventListener("keydown", escape)
    return () => window.removeEventListener("keydown", escape)
  }, [embedded, expand])
  useEffect(() => {
    onStateChange?.({ prompt, answer: response, route: routeSuggestion, error, status: loading ? "running" : error ? "error" : history.length ? "done" : "idle" })
  }, [prompt, response, routeSuggestion, error, loading, history.length, onStateChange])

  useEffect(() => () => {
    requestRef.current?.abort()
    requestRef.current = null
  }, [])


  const quickActions = useMemo(() => {
   
    return suggestedQuestions.map(ask => ({ label: ask, ask }))
 }, [suggestedQuestions])

  const askModel = async (ask) => {
    const cleanAsk = String(ask ?? "").trim()
    if (!cleanAsk || requestRef.current) return
    if (cleanAsk.length > MAX_ASSISTANT_PROMPT) {
      setError(`Please keep your question under ${MAX_ASSISTANT_PROMPT} characters.`)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45000)
    requestRef.current = controller
    lastQuestionRef.current = cleanAsk
    setLoading(true)
    setResponse("")
    setRouteSuggestion(null)
    setError("")
    setPrompt(cleanAsk)


    try {
      let session = assistantQuickAnswer(cleanAsk)
      if (!session) {
      const r = await fetch("/api/home-route-assistant", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: cleanAsk, source, stream: true, history: normalizeConversationHistory(history),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      })

      session = await readAssistantResponse(r, answer => {
        if (!controller.signal.aborted) setResponse(answer)
      })
      }
      if (typeof session?.answer !== "string" || !session.answer.trim()) throw new Error("No answer arrived. Please try again.")
      if (controller.signal.aborted) return
      setResponse(session.answer)
      const route = safeAssistantRoute(session.route)
      setRouteSuggestion(route?.href === router.pathname ? null : route)
      setHistory(current => normalizeConversationHistory([...current,
        { role: "user", content: cleanAsk }, { role: "assistant", content: session.answer }]))

      // scroll response to top when a new answer arrives
      requestAnimationFrame(() => {
        if (responseRef.current) responseRef.current.scrollTop = 0
      })
    } catch (e) {
      if (controller.signal.aborted && requestRef.current !== controller) return
      setResponse("")
      setError(controller.signal.aborted ? "The assistant timed out. Please try again." : e.message || "Could not reach the assistant. Please try again.")
    } finally {
      clearTimeout(timeout)
      if (requestRef.current === controller) {
        requestRef.current = null
        setLoading(false)
      }
    }
  }

  const handlePromptChange = (event) => {
    const { name, type, value, checked } = event.target
    if (name !== "prompt") return
    const v = type === "checkbox" ? checked : value
    setPrompt(String(v))
  }

  const submitPrompt = (event) => {
    event?.preventDefault?.()
    if (!loading) {
      askModel(prompt)
    }
  }

  const onKeyDown = (e) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent?.isComposing) return
    e.preventDefault()
    if (!loading) {
      askModel(prompt)
    }
  }

  const panelVariants = {
    closed: { opacity: 0, y: 18, scale: 0.98, pointerEvents: "none" },
    open: { opacity: 1, y: 0, scale: 1, pointerEvents: "auto" },
  }

  return (
    <Box ref={floatingRef} data-assistant-floating={embedded ? undefined : "true"}
      data-footer-hidden={!embedded && footerVisible ? "true" : "false"}
      aria-hidden={!embedded && footerVisible ? true : undefined}
      inert={!embedded && footerVisible ? "" : undefined}
      sx={{ opacity: !embedded && footerVisible ? 0 : 1,
        visibility: !embedded && footerVisible ? "hidden" : "visible",
        pointerEvents: !embedded && footerVisible ? "none" : "auto",
        transition: reducedMotion ? "none" : `opacity 250ms ease, visibility 0s ${footerVisible ? "250ms" : "0s"}`,
        fontFamily: "var(--font-site)", letterSpacing: 0 }}>
      {/* Floating toggle button */}
      {!embedded && !hideToggle ? (
        <Button
          ref={toggleRef}
          data-home-assistant-toggle
          aria-label={expand ? "Close AI assistant" : "Open AI assistant"}
          aria-expanded={expand}
          onClick={() => {
            setExpand((v) => !v)
            if (!expand) setTimeout(() => inputRef.current?.focus?.(), 120)
          }}
          sx={{
            zIndex: 1100,
            position: "fixed",
            right: 18,
            bottom: 18,
            minWidth: 0,
            width: 54,
            height: 54,
            borderRadius: "50%",
            p: 0,
            background: "#101216",
            border: "1px solid #77698e",
            color: "#d4c2ed",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            "&:hover": {
              background: "#201c29", borderColor: "#bcabd5",
            },
          }}
        >
          {expand ? <CloseRoundedIcon sx={{ fontSize: 24 }} /> : <RadarRoundedIcon sx={{ fontSize: 30 }} />}
        </Button>
      ) : null}

      {/* Panel */}
      <AnimatePresence>
        {(embedded || expand) && (
          <Box
            component={motion.div}
            role={embedded ? undefined : "dialog"}
            aria-label={embedded ? undefined : "AI assistant"}
            aria-modal={embedded ? undefined : false}
            key="chatbot-panel"
            initial={embedded ? false : "closed"}
            animate="open"
            exit="closed"
            variants={panelVariants}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
            sx={{
              zIndex: embedded ? 1 : 1099,
              position: embedded ? "relative" : "fixed",
              right: embedded ? "auto" : 18,
              bottom: embedded ? "auto" : 86,
              width: embedded ? "100%" : "calc(100% - 36px)",
              maxWidth: embedded ? "100%" : 440,
              mx: embedded ? "auto" : 0,
            }}
          >
            <Box
              sx={{
                position: "relative",
                overflowY: embedded ? "visible" : "auto", overscrollBehavior: embedded ? "auto" : "contain",
                maxHeight: embedded ? "none" : "calc(100dvh - 110px)",
                borderRadius: cockpit ? 0 : "7px",
                backgroundColor: "#0d0f13",
                border: cockpit ? 0 : "1px solid #39353f",
                boxShadow: cockpit ? "none" : "0 16px 48px rgba(0,0,0,0.5)",
              }}
            >
              {/* Content */}
              <Box sx={{ position: "relative", zIndex: 1, p: cockpit ? 0 : 2.25 }}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                  <RadarRoundedIcon aria-hidden="true" sx={{ color: "#b5a5ee", fontSize: 28 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "var(--font-site)",
                      fontSize: 22, fontWeight: 500, flex: 1,
                      letterSpacing: 0,
                      lineHeight: 1.2,
                      color: "#e5deef",
                    }}
                  >
                    AI Assistant
                  </Typography>

                  <Tooltip title="New conversation"><span>
                    <IconButton aria-label="New conversation" disabled={loading || (!history.length && !error)}
                      onClick={() => {
                        setHistory(initialConversation()); setPrompt(initialPrompt); setResponse(initialAnswer)
                        setRouteSuggestion(null); setError(""); lastQuestionRef.current = ""
                        inputRef.current?.focus()
                      }} sx={{ width: 36, height: 36, color: "rgba(216,229,254,0.8)" }}>
                      <RestartAltRoundedIcon fontSize="small" />
                    </IconButton>
                  </span></Tooltip>
                  {!embedded && <Tooltip title="Close assistant"><IconButton aria-label="Close assistant panel" onClick={closePanel} sx={{ width: 36, height: 36, color: "#b9b2c4" }}><CloseRoundedIcon fontSize="small" /></IconButton></Tooltip>}
                </Box>

                <Divider sx={{ my: 1.5, borderColor: "rgba(255,255,255,0.10)" }} />

                {/* Quick actions */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: embedded ? { xs: "1fr", sm: "1fr 1fr" } : "1fr",
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
                        borderRadius: "5px",
                        py: 1,
                        px: 1.25,
                        border: "1px solid rgba(255,255,255,0.12)",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: "rgba(245, 248, 255, 0.88)",
                        fontFamily: "var(--font-site)",
                        lineHeight: 1.2,
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,0.10)",
                          borderColor: "rgba(255,255,255,0.18)",
                        },
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontFamily: "var(--font-site)", fontSize: 12.5 }}>
                        {qa.label}
                      </Typography>
                    </Button>
                  ))}
                </Box>

                <Typography
                    variant="overline"
                    sx={{
                      color: "rgba(216, 229, 254, 0.65)",
                      letterSpacing: 0,
                      fontFamily: "var(--font-site)",
                    }}
                  >
                    Your question
                  </Typography>

                {/* Input */}
                <Box
                  component="form"
                  onSubmit={submitPrompt}
                  sx={{ display: "flex", gap: 1, alignItems: "center" }}
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
                    inputProps={{ maxLength: MAX_ASSISTANT_PROMPT, "aria-label": "Ask the assistant" }}
                    fullWidth
                    InputProps={{
                      sx: {
                        color: "rgba(245, 248, 255, 0.92)",
                        fontFamily: "var(--font-site)",
                        borderRadius: "5px",
                        backgroundColor: "rgba(0,0,0,0.45)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        "&:hover": { borderColor: "rgba(255,255,255,0.18)" },
                        "&.Mui-focused": { borderColor: "#baa5e2" },
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                    }}
                  />

                  <Button
                    type="submit"
                    aria-label="Send question"
                    disabled={loading || !prompt.trim()}
                    sx={{
                      minWidth: 48,
                      height: 44,
                      borderRadius: "5px",
                      background:
                        "linear-gradient(110deg,#a385ed,#91a4ed 70%,#79c7df)",
                      color: "#10131b",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
                      "&:hover": {
                        background:
                          "linear-gradient(110deg,#b79cf3,#a4b5f2 70%,#91d5e8)",
                      },
                    }}
                  >
                    <SendRoundedIcon sx={{ fontSize: 18 }} />
                  </Button>
                </Box>

                

                {error && <Box role="alert" sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
                  <Typography sx={{ fontSize: 13, color: "#ffb5ae", flex: 1 }}>{error}</Typography>
                  {lastQuestionRef.current && <Tooltip title="Retry question">
                    <IconButton aria-label="Retry question" disabled={loading} onClick={() => askModel(lastQuestionRef.current)}
                      sx={{ width: 40, height: 40, color: "rgba(216,229,254,0.9)" }}><ReplayRoundedIcon fontSize="small" /></IconButton>
                  </Tooltip>}
                </Box>}

                {/* Loading indicator */}
                {loading && !response ? (
                  <Box role="status" aria-label="Preparing answer" sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <LoadingDots />
                  </Box>
                ) : 
                <Box aria-live="polite" aria-atomic="true" aria-busy={loading} sx={{ mt: 2 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      color: "rgba(216, 229, 254, 0.65)",
                      letterSpacing: 0,
                      fontFamily: "var(--font-site)",
                    }}
                  >
                    Answer
                  </Typography>

                  <Box
                    ref={responseRef}
                    role="region"
                    aria-label="Assistant answer"
                    tabIndex={0}
                    sx={{
                      mt: 0.75,
                      py: 0.5,
                      maxHeight: embedded ? "none" : "40vh",
                      overflowY: embedded ? "visible" : "auto",
                      overscrollBehavior: embedded ? "auto" : "contain",
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        color: "rgba(245, 248, 255, 0.88)",
                        lineHeight: 1.65,
                        whiteSpace: "pre-wrap",
                        wordBreak: "normal",
                        overflowWrap: "normal",
                      }}
                    >
                      {response}
                    </Typography>
                  </Box>
                  {!!routeSuggestion && (
                    <Box
                      component={SiteLink}
                      href={routeSuggestion.href}
                      sx={{
                        mt: 1.1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        maxWidth: "100%",
                        py: 0.85,
                        fontFamily: "var(--font-site)",
                        fontWeight: 500,
                        lineHeight: 1.5,
                        color: "#c6b5f4",
                        textDecoration: "none",
                        "&:hover": {
                          color: "#eee7ff",
                        },
                        "&:focus-visible": { outline: "2px solid #c6b5f4", outlineOffset: 4, borderRadius: "2px" },
                      }}
                    >
                      <Box component="span" sx={{ textDecoration: "underline", textUnderlineOffset: "5px", textDecorationThickness: "1px" }}>
                        {assistantLinkLabel(routeSuggestion)}
                      </Box>
                      <ArrowForwardRoundedIcon aria-hidden="true" sx={{ fontSize: 19, flexShrink: 0 }} />
                    </Box>
                  )}
                </Box>}

                
              </Box>
            </Box>
          </Box>
        )}
      </AnimatePresence>
    </Box>
  )
}
