import OpenAI from "openai"
import { admin, adminFieldValue, getAdminAuth, getFirestore } from "../../lib/firebaseAdmin"
import { logAiQuestion } from "../../lib/aiQuestionLogger"
import {
  assertAssistantRateLimit,
  isAnonymousFirebaseUser,
  isAssistantRateLimitError,
  sendAssistantRateLimitError,
} from "../../lib/assistantRateLimit"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DALLE_KEY,
})

function parseModelJson(text) {
  const raw = String(text || "").trim()

  try {
    return JSON.parse(raw)
  } catch {}

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

function normalizeConversationHistory(value) {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => ({
      role: entry?.role === "assistant" ? "assistant" : "user",
      content: String(entry?.content || "").trim().slice(0, 900),
    }))
    .filter((entry) => entry.content)
    .slice(-12)
}

function conversationContext(history) {
  if (!history.length) return "No prior homepage assistant conversation is available."

  return `Recent homepage assistant conversation:\n${history
    .map((entry) => `${entry.role}: ${entry.content}`)
    .join("\n")}`
}

async function getUserFromBody(req) {
  const idToken = String(req.body?.idToken || "").trim()
  if (!idToken) return null

  return getAdminAuth().verifyIdToken(idToken)
}

async function loadStoredAssistantHistory(uid) {
  if (!uid) return []

  try {
    const snap = await getFirestore()
      .collection("users")
      .doc(uid)
      .collection("assistantHistory")
      .orderBy("createdAt", "desc")
      .limit(12)
      .get()

    return snap.docs
      .reverse()
      .flatMap((doc) => {
        const data = doc.data() || {}
        return [
          { role: "user", content: String(data.prompt || "") },
          { role: "assistant", content: String(data.answerPreview || "") },
        ]
      })
      .filter((entry) => entry.content)
  } catch (error) {
    console.warn("Could not load assistant history", error?.message || error)
    return []
  }
}

function getTimeZoneOffset(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const values = {}

  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") values[part.type] = Number(part.value)
  }

  const hour = values.hour === 24 ? 0 : values.hour
  const asUTC = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    hour,
    values.minute,
    values.second
  )

  return asUTC - date.getTime()
}

function zonedLocalDateToDate({ date, time, timeZone }) {
  const match = `${date}T${time || "09:00"}`.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/
  )
  if (!match) return null

  const [, year, month, day, hour, minute] = match.map(Number)
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0)
  let result = new Date(utcGuess - getTimeZoneOffset(new Date(utcGuess), timeZone))
  result = new Date(utcGuess - getTimeZoneOffset(result, timeZone))
  return result
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function formatWhen(date, timeZone) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

async function parseScheduleRequest({ prompt, history, timeZone, currentLocalIso }) {
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_HERO_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You turn natural language reminder, calendar, scheduler, and task-tracking requests into one compact schedule event. Be realistic. If required date or time information is missing, ask one clarifying question instead of guessing. Return only valid JSON.",
      },
      {
        role: "system",
        content:
          'Return JSON in this exact shape: {"ready":true|false,"clarifyingQuestion":"one question if not ready","title":"short event title","notes":"useful non-redundant notes","kind":"reminder|event|task|appointment|other","startDate":"YYYY-MM-DD","startTime":"HH:mm","durationMinutes":number,"allDay":true|false,"reminderLeadMinutes":number,"priority":"low|normal|high","searchTags":["useful tags"]}. For reminders like waking up, use reminderLeadMinutes 0 and a short duration such as 15 minutes. For "tomorrow", "today", and relative dates, use the current local date/time provided. Do not invent unnecessary details.',
      },
      {
        role: "system",
        content: `Current local datetime: ${currentLocalIso}\nUser timezone: ${timeZone}`,
      },
      {
        role: "system",
        content: conversationContext(history),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.1,
    max_tokens: 420,
  })

  return parseModelJson(completion.choices?.[0]?.message?.content) || {}
}

export default async function scheduleAssistantEntry(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  if (!process.env.OPENAI_API_KEY && !process.env.DALLE_KEY) {
    res.status(500).json({ error: "OpenAI API key is not configured" })
    return
  }

  const prompt = String(req.body?.prompt || "").trim()
  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" })
    return
  }

  let user = null

  try {
    user = await getUserFromBody(req)
    if (!user?.uid) {
      res.status(401).json({ error: "Sign in is required to add reminders." })
      return
    }

    await assertAssistantRateLimit({
      req,
      uid: user.uid,
      isAnonymous: isAnonymousFirebaseUser(user),
      prompt,
      action: "scheduler",
    })

    const timeZone = String(req.body?.timeZone || "America/Los_Angeles")
    const currentLocalIso =
      String(req.body?.currentLocalIso || "").trim() || new Date().toISOString()
    const clientHistory = normalizeConversationHistory(req.body?.history)
    const storedHistory = await loadStoredAssistantHistory(user.uid)
    const history = normalizeConversationHistory([...storedHistory, ...clientHistory])
    const parsed = await parseScheduleRequest({
      prompt,
      history,
      timeZone,
      currentLocalIso,
    })

    if (parsed.ready === false) {
      const answer =
        String(parsed.clarifyingQuestion || "").trim() ||
        "What date and time should I schedule that for?"

      await logAiQuestion({
        uid: user.uid,
        isAnonymous: isAnonymousFirebaseUser(user),
        prompt,
        source: req.body?.source || "home-hero-scheduler",
        mode: "clarify",
        answer,
      })

      res.json({
        answer,
        needsClarification: true,
        clarificationFor: "scheduler",
      })
      return
    }

    const startDate = String(parsed.startDate || "").trim()
    const startTime = String(parsed.startTime || "").trim()
    const durationMinutes = Math.max(5, Number(parsed.durationMinutes || 15))
    const start = zonedLocalDateToDate({ date: startDate, time: startTime, timeZone })

    if (!start || Number.isNaN(start.getTime())) {
      res.status(400).json({
        error: "I could not understand the reminder date and time.",
      })
      return
    }

    const end = addMinutes(start, durationMinutes)
    const title = String(parsed.title || "Reminder").trim().slice(0, 120)
    const parsedNotes = String(parsed.notes || "").trim().slice(0, 1000)
    const notes =
      parsedNotes && parsedNotes.toLowerCase() !== prompt.toLowerCase()
        ? parsedNotes
        : ""
    const reminderLeadMinutes = Math.max(0, Number(parsed.reminderLeadMinutes || 0))
    const priority = ["low", "high"].includes(parsed.priority)
      ? parsed.priority
      : ""
    const searchTags = Array.isArray(parsed.searchTags)
      ? parsed.searchTags.map((tag) => String(tag || "").trim()).filter(Boolean).slice(0, 12)
      : []
    const db = getFirestore()
    const eventRef = db.collection("scheduleEvents").doc()
    const event = {
      title,
      ...(notes ? { notes } : {}),
      ...(parsed.allDay ? { allDay: true } : {}),
      start: admin.firestore.Timestamp.fromDate(start),
      end: admin.firestore.Timestamp.fromDate(end),
      ownerUid: user.uid,
      ...(user.email ? { ownerEmail: user.email } : {}),
      source: req.body?.source || "home-hero-scheduler",
      status: "active",
      scheduleKind: String(parsed.kind || "reminder"),
      ...(priority ? { priority } : {}),
      timeZone,
      originalPrompt: prompt,
      reminder: {
        ...(reminderLeadMinutes ? { leadMinutes: reminderLeadMinutes } : {}),
        triggerAt: admin.firestore.Timestamp.fromDate(
          addMinutes(start, -reminderLeadMinutes)
        ),
      },
      ...(searchTags.length ? { searchTags } : {}),
      createdAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
    }

    await eventRef.set(event)

    const answer = `Added "${title}" to your scheduler for ${formatWhen(
      start,
      timeZone
    )}.`

    await logAiQuestion({
      uid: user.uid,
      isAnonymous: isAnonymousFirebaseUser(user),
      prompt,
      source: req.body?.source || "home-hero-scheduler",
      mode: "schedule",
      answer,
    })

    res.json({
      answer,
      route: {
        label: "Scheduler",
        href: "/components/scheduler",
      },
      event: {
        id: eventRef.id,
        title,
        notes,
        start: start.toISOString(),
        end: end.toISOString(),
        timeZone,
        scheduleKind: event.scheduleKind,
      },
    })
  } catch (error) {
    if (isAssistantRateLimitError(error)) {
      sendAssistantRateLimitError(res, error)
      return
    }

    console.error(error)
    await logAiQuestion({
      uid: user?.uid || null,
      isAnonymous: isAnonymousFirebaseUser(user),
      prompt,
      source: req.body?.source || "home-hero-scheduler",
      mode: "error",
      answer: "Failed to add scheduler entry",
    })
    res.status(500).json({
      error: error?.message || "Failed to add scheduler entry.",
    })
  }
}
