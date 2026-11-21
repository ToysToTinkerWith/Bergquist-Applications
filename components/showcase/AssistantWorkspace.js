import React, { useEffect, useRef, useState } from "react"
import SendRoundedIcon from "@mui/icons-material/SendRounded"
import StopRoundedIcon from "@mui/icons-material/StopRounded"
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded"
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import SiteLink from "../SiteLink"
import { readAssistantResponse } from "../../lib/assistantStream"
import { assistantQuickAnswer } from "../../lib/assistantQuickAnswers"
import { MAX_ASSISTANT_PROMPT, normalizeConversationHistory, safeAssistantRoute, introductoryHistory } from "../../lib/assistantConversation"
import { downloadFile } from "../../lib/componentDemos"
import { Workspace, Tool, Modal, s } from "./Workspace"

const initial = () => introductoryHistory().map((message, index) => ({ ...message, id: `intro-${index}` }))
const questions = ["Which components could help my business?", "How would online booking work?", "Can you help me plan a website?"]
export default function AssistantWorkspace() {
  const [messages, setMessages] = useState(initial), [draft, setDraft] = useState(""), [loading, setLoading] = useState(false), [error, setError] = useState(""), [resetOpen, setResetOpen] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const retryAt = useRef(0)
  const request = useRef(null), last = useRef(null), conversation = useRef(null), input = useRef(null), follow = useRef(true)
  useEffect(() => () => { request.current?.controller.abort(); request.current = null }, [])
  useEffect(() => { if (follow.current && conversation.current) conversation.current.scrollTop = conversation.current.scrollHeight }, [messages])
  useEffect(() => {
    if (!cooldown) return
    const timer = setTimeout(() => setCooldown(Math.max(0, Math.ceil((retryAt.current - Date.now()) / 1000))), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])
  async function ask(question, base = messages) {
    const prompt = question.trim()
    if (!prompt || request.current || cooldown) return
    if (prompt.length > MAX_ASSISTANT_PROMPT) { setError(`Keep questions under ${MAX_ASSISTANT_PROMPT} characters.`); return }
    const controller = new AbortController(), id = `answer-${Date.now()}`, active = { controller, id, stopped: false, text: "" }
    request.current = active; last.current = { prompt, base }
    const timer = setTimeout(() => controller.abort(), 45000)
    setLoading(true); setError(""); setDraft(""); follow.current = true
    setMessages([...base.slice(-28), { id: `${id}-question`, role: "user", content: prompt }, { id, role: "assistant", content: "", pending: true }])
    const update = values => setMessages(current => current.map(message => message.id === id ? { ...message, ...values } : message))
    try {
      let result = assistantQuickAnswer(prompt)
      if (!result) {
      const response = await fetch("/api/home-route-assistant", {
        method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, source: "component-chatbot", stream: true, history: normalizeConversationHistory(base.filter(message => !message.error && !message.pending)), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      })
      if (response.status === 429) {
        const limit = await response.json()
        const failure = new Error(limit.error || "Please wait before sending another question.")
        failure.retryAfter = Math.min(86400, Math.max(1, Number(limit.retryAfterSeconds) || 60))
        throw failure
      }
      result = await readAssistantResponse(response, content => { if (request.current === active && !controller.signal.aborted) { active.text = content; update({ content }) } })
      }
      if (request.current !== active) return
      if (controller.signal.aborted) throw new Error("Response stopped")
      if (!result?.answer?.trim()) throw new Error("No answer arrived. Try again.")
      update({ content: result.answer, route: safeAssistantRoute(result.route), pending: false })
    } catch (failure) {
      if (request.current !== active) return
      if (failure.retryAfter) { retryAt.current = Date.now() + failure.retryAfter * 1000; setCooldown(failure.retryAfter) }
      const message = active.stopped ? "Response stopped." : controller.signal.aborted ? "The assistant took too long. Please try again." : failure.message || "The assistant is unavailable. Try again."
      update({ content: active.text || message, pending: false, error: true }); setError(active.stopped ? "" : message)
    } finally {
      clearTimeout(timer)
      if (request.current === active) { request.current = null; setLoading(false) }
    }
  }
  function reset() { request.current?.controller.abort(); request.current = null; setMessages(initial()); setDraft(""); setError(""); setLoading(false); setResetOpen(false); last.current = null; follow.current = true; input.current?.focus() }
  return <Workspace title="Website assistant" status={loading ? "Responding..." : "Live assistant · Conversation stays in this session"} actions={<>
    <Tool label="Download conversation" onClick={() => downloadFile("conversation.txt", messages.filter(message => !message.pending).map(message => `${message.role === "user" ? "You" : "Assistant"}\n${message.content}`).join("\n\n"), "text/plain;charset=utf-8")}><FileDownloadRoundedIcon /></Tool>
    <Tool label="New conversation" onClick={() => setResetOpen(true)}><RestartAltRoundedIcon /></Tool>
  </>}>
    <div className={s.chatLayout}><div>
      <div className={s.messages} ref={conversation} role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions" onScroll={() => { const node = conversation.current; follow.current = node.scrollHeight - node.scrollTop - node.clientHeight < 70 }}>
        {messages.map(message => <article className={s.message} data-role={message.role} key={message.id}><small>{message.role === "user" ? "You" : "Bergquist assistant"}</small><p>{message.content || "Thinking..."}</p>{message.route && <SiteLink className={s.primary} href={message.route.href}>{message.route.label}<ArrowForwardRoundedIcon fontSize="small" /></SiteLink>}</article>)}
      </div>
      {error && <div className={s.error} role="alert">{error}{last.current && <button className={s.button} style={{ marginLeft: 12 }} onClick={() => ask(last.current.prompt, last.current.base)} disabled={loading || cooldown > 0}>Retry</button>}</div>}
      {cooldown > 0 && <p className={s.notice}>Available again in {cooldown < 60 ? `${cooldown} seconds` : `${Math.ceil(cooldown / 60)} minutes`}.</p>}
      <form className={s.composer} onSubmit={event => { event.preventDefault(); ask(draft) }}><textarea ref={input} aria-label="Your question" placeholder="Ask about your website..." value={draft} maxLength={MAX_ASSISTANT_PROMPT} rows={2} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); if (!loading) ask(draft) } }} />
        {loading ? <button type="button" className={s.button} aria-label="Stop response" title="Stop response" onClick={() => { if (request.current) { request.current.stopped = true; request.current.controller.abort() } }}><StopRoundedIcon /></button> : <button type="submit" className={s.primary} aria-label="Send question" title="Send question" disabled={!draft.trim() || cooldown > 0}><SendRoundedIcon /></button>}
      </form>
    </div><aside className={s.aside}><h3>Start a conversation</h3><div className={s.suggestions}>{questions.map(question => <button key={question} className={s.button} disabled={loading || cooldown > 0} onClick={() => ask(question)}>{question}<ArrowForwardRoundedIcon fontSize="small" /></button>)}</div><p className={s.muted} style={{ fontSize: 13, marginTop: 24 }}>Responses can be imperfect. Confirm important details with our team.</p><SiteLink className={s.link} href="/contact" style={{ marginTop: 16 }}>Contact Bergquist<ArrowForwardRoundedIcon fontSize="small" /></SiteLink></aside></div>
    <Modal title="Start a new conversation?" open={resetOpen} onClose={() => setResetOpen(false)}><p>The current conversation will be cleared.</p><div className={s.formActions}><button className={s.button} onClick={() => setResetOpen(false)}>Cancel</button><button className={s.primary} onClick={reset}>New conversation</button></div></Modal>
  </Workspace>
}
