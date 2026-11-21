import OpenAI from "openai"
import { logAiQuestion } from "../../lib/aiQuestionLogger"
import {
  assertAssistantRateLimit,
  isAnonymousFirebaseUser,
  isAssistantRateLimitError,
  sendAssistantRateLimitError,
} from "../../lib/assistantRateLimit"
import { getAdminAuth, getFirestore } from "../../lib/firebaseAdmin"
import { MAX_ASSISTANT_PROMPT, normalizeConversationHistory } from "../../lib/assistantConversation"
import { generateAssistantPayload } from "../../lib/homeAssistant"
import { assistantQuickAnswer } from "../../lib/assistantQuickAnswers"
import COMPONENT_CATALOG from "../../lib/componentCatalog.json"
import { projectStories } from "../../lib/projectStories"

const openai = process.env.OPENAI_API_KEY || process.env.DALLE_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.DALLE_KEY,
  timeout: 30000,
  maxRetries: 0,
}) : null

const siteRoutes = [
  {
    label: "Home",
    href: "/",
    description:
      "AI-assisted website and application development: faster prototyping, iterative design, less repetitive coding, tailored workflows, and human review. Explains the process and how AI-built differs from AI-powered. No guaranteed savings or delivery dates.",
  },
  {
    label: "About",
    href: "/about",
    description:
      "Bergquist Applications' approach to AI-assisted development, human direction, choosing useful components, and the process from understanding business needs to testing and launch.",
  },
  {
    label: "Design",
    href: "/Design",
    description:
      "The original space-themed homepage and interactive design showcase: Earth and Moon, astronaut and spacecraft selection, Mars landing, Pioneer Flight Deck dashboards, AI assistant, and Expand Your Horizons solar-system journey.",
  },
  {
    label: "Component Library",
    href: "/components",
    description:
      "A browsable component catalog with category filters, search, preview images, and live demos for Data, Finance, AI, and Design. No published component prices.",
  },
  {
    label: "Applications",
    href: "/applications",
    description:
      "Real screenshots and project stories for Upgrade Aprons, New Standard, and Island Flourish client websites, plus the independent ComTree application. Each project includes a live link.",
  },
  {
    label: "Finance",
    href: "/finance",
    description:
      "Payments, Stripe products, purchase analytics, Algorand wallets, market candles, and financial workflow tools.",
  },
  {
    label: "Events",
    href: "/events",
    description:
      "Event galleries, event media, albums, photo workflows, and event-based content experiences.",
  },
  {
    label: "Social Post Creator",
    href: "/social-post-creator",
    description:
      "Social content generation, captions, campaign posts, and marketing content workflows.",
  },
  {
    label: "Contact",
    href: "/contact",
    description:
      "Project inquiries, estimates, budget conversations, consultations, and getting help from Bergquist Applications.",
  },
]

const componentRoutes = COMPONENT_CATALOG.map(({ key, title, description }) => ({
  label: title, href: `/components/${key}`, description,
}))

const assistantRoutes = [...siteRoutes, ...projectStories.map(project => ({ label: `${project.name} project story`, href: `/applications/${project.slug}`, description: `${project.type}. ${project.summary} ${project.result}` })), ...componentRoutes]

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "what",
  "where",
  "when",
  "from",
  "about",
  "have",
  "need",
  "want",
  "can",
  "you",
  "please",
  "show",
  "find",
  "retrieve",
  "saved",
  "stored",
])

function tokenize(text) {
  return Array.from(
    new Set(
      String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s/-]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 1 && !stopWords.has(token))
    )
  )
}

async function getUserFromBody(req) {
  const idToken = String(req.body?.idToken || "").trim()
  if (!idToken) return null

  try {
    return await getAdminAuth().verifyIdToken(idToken)
  } catch (error) {
    console.warn("Ignoring invalid route assistant token", error?.message || error)
    return null
  }
}

function timestampToMillis(value) {
  if (!value) return 0
  if (typeof value.toMillis === "function") return value.toMillis()
  if (typeof value.toDate === "function") return value.toDate().getTime()
  if (typeof value === "number") return value
  const parsed = Date.parse(String(value))
  return Number.isFinite(parsed) ? parsed : 0
}

function localDateKey(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date)
    const get = (type) => parts.find((part) => part.type === type)?.value || ""
    return `${get("year")}-${get("month")}-${get("day")}`
  } catch {
    if (timeZone !== "America/Los_Angeles") {
      return localDateKey(date, "America/Los_Angeles")
    }

    return date.toISOString().slice(0, 10)
  }
}

function addDaysToDateKey(dateKey, days) {
  const [year, month, day] = String(dateKey || "")
    .split("-")
    .map((part) => Number(part))
  if (!year || !month || !day) return ""

  const date = new Date(Date.UTC(year, month - 1, day + days, 12))
  const pad = (value) => String(value).padStart(2, "0")
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

function getWeekStartKey(todayKey) {
  const [year, month, day] = String(todayKey || "")
    .split("-")
    .map((part) => Number(part))
  if (!year || !month || !day) return ""

  const date = new Date(Date.UTC(year, month - 1, day, 12))
  const dayOfWeek = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() - dayOfWeek)
  const pad = (value) => String(value).padStart(2, "0")
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

function buildSavedDataDateFilter(prompt, { timeZone }) {
  const text = String(prompt || "").toLowerCase()
  const now = new Date()
  const todayKey = localDateKey(now, timeZone)
  const yesterdayKey = addDaysToDateKey(todayKey, -1)
  const weekStartKey = getWeekStartKey(todayKey)
  const hasNegation =
    /\b(not|except|exclude|excluding|without|other than|older than|before)\b/.test(text)

  if (/\btoday\b/.test(text)) {
    if (hasNegation || /\bnot from today\b|\bnot today\b/.test(text)) {
      return {
        label: "not from today",
        matches: (item) =>
          !!item.createdAtKey && item.createdAtKey !== todayKey,
      }
    }

    return {
      label: "from today",
      matches: (item) => item.createdAtKey === todayKey,
    }
  }

  if (/\byesterday\b/.test(text)) {
    if (hasNegation) {
      return {
        label: "not from yesterday",
        matches: (item) =>
          !!item.createdAtKey && item.createdAtKey !== yesterdayKey,
      }
    }

    return {
      label: "from yesterday",
      matches: (item) => item.createdAtKey === yesterdayKey,
    }
  }

  if (/\bthis week\b|\bweek\b/.test(text)) {
    if (hasNegation) {
      return {
        label: "not from this week",
        matches: (item) =>
          !!item.createdAtKey &&
          (item.createdAtKey < weekStartKey || item.createdAtKey > todayKey),
      }
    }

    return {
      label: "from this week",
      matches: (item) =>
        !!item.createdAtKey &&
        item.createdAtKey >= weekStartKey &&
        item.createdAtKey <= todayKey,
    }
  }

  return null
}

function serializeOrganizerItem(doc) {
  const data = doc.data() || {}
  const createdAtMs = timestampToMillis(data.createdAt)
  const media = Array.isArray(data.media)
    ? data.media
    : Array.isArray(data.images)
      ? data.images
      : []

  return {
    id: doc.id,
    title: String(data.title || "Saved item"),
    summary: String(data.summary || ""),
    itemType: String(data.itemType || ""),
    createdAt: createdAtMs ? new Date(createdAtMs).toISOString() : "",
    createdAtMs,
    categories: Array.isArray(data.categories) ? data.categories.slice(0, 8) : [],
    tags: Array.isArray(data.tags) ? data.tags.slice(0, 12) : [],
    searchableFields: Array.isArray(data.searchableFields)
      ? data.searchableFields.slice(0, 18)
      : [],
    event: data.event || null,
    images: media
      .slice(0, 3)
      .map((item) => ({
          name: item.name || "",
          note: item.note || "",
          kind: item.kind || (String(item.contentType || "").startsWith("video/") ? "video" : "image"),
          downloadURL: item.downloadURL || "",
          contentType: item.contentType || "",
          metadata: item.metadata || {},
        }))
      .filter((item) => item.name || item.downloadURL),
    searchIndex: Array.isArray(data.searchIndex) ? data.searchIndex : [],
  }
}

function scoreOrganizerItem(item, terms) {
  const haystack = [
    item.title,
    item.summary,
    item.itemType,
    ...(item.categories || []),
    ...(item.tags || []),
    ...(item.searchableFields || []),
    ...(item.searchIndex || []),
    item.event?.title,
    item.event?.startDate,
    item.event?.startTime,
    item.event?.location,
    item.event?.description,
    ...(item.images || []).flatMap((image) => [
      image.name,
      image.note,
      image.kind,
      image.contentType,
      image.metadata?.width,
      image.metadata?.height,
      image.metadata?.durationSeconds,
    ]),
  ]
    .join(" ")
    .toLowerCase()

  return terms.reduce((score, term) => {
    if (haystack.includes(term)) return score + (term.length > 4 ? 3 : 2)
    return score
  }, 0)
}

function wantsSavedDataListPrompt(prompt) {
  const text = String(prompt || "").toLowerCase()
  const dataIntent =
    /\b(saved|stored|database|data|information|info|records|record|stuff|items|entries|organizer|uploads|notes|images|pictures|videos|events|documents|document|receipts|receipt|files|file)\b/.test(text)
  const listIntent =
    /\b(find|get|retrieve|search|list|show|view|display|what|everything|all|recent|have|inside|in my)\b/.test(text)

  return dataIntent && listIntent
}

function wantsBroadSavedDataListPrompt(prompt) {
  const text = String(prompt || "").toLowerCase()
  const broadDataIntent =
    /\b(saved data|stored data|saved information|stored information|saved info|stored info|saved records|stored records|my data|my information|my info|database|organizer|saved items|stored items|saved entries|stored entries|all data|all items|all entries|everything|what have i saved|what do i have saved|all my saved|everything i have saved|everything i've saved)\b/.test(text)
  const broadListIntent =
    /\b(find|get|retrieve|search|list|show|view|display|what|everything|all|recent|have|inside|in my)\b/.test(text)

  return wantsSavedDataListPrompt(prompt) && broadDataIntent && broadListIntent
}

function wantsSchedulerRoutePrompt(prompt) {
  return /^(?:please )?(?:open|go to|take me to|show me|visit) (?:the )?(?:scheduler|calendar|planner)(?: page| component| demo)?[.!?]*$/i.test(String(prompt || "").trim())
}

function withCreatedAtKey(item, timeZone) {
  return {
    ...item,
    createdAtKey: item.createdAtMs
      ? localDateKey(new Date(item.createdAtMs), timeZone)
      : "",
  }
}

function applySavedDataDateFilter(items, dateFilter) {
  if (!dateFilter) return items
  return items.filter((item) => dateFilter.matches(item))
}

async function loadRecentOrganizerItems({
  uid,
  limit = 100,
  timeZone = "America/Los_Angeles",
  dateFilter = null,
}) {
  if (!uid) return []

  let query = getFirestore()
    .collection("users")
    .doc(uid)
    .collection("organizedItems")
    .orderBy("createdAt", "desc")

  if (limit) {
    query = query.limit(limit)
  }

  const snap = await query.get()

  return snap.docs
    .map(serializeOrganizerItem)
    .map((item) => withCreatedAtKey(item, timeZone))
    .filter((item) => !dateFilter || dateFilter.matches(item))
    .map(({ searchIndex, createdAtMs, createdAtKey, ...item }) => item)
}

async function findOrganizerMatches({
  uid,
  prompt,
  timeZone = "America/Los_Angeles",
  dateFilter = null,
}) {
  if (!uid) return []

  const terms = tokenize(prompt)
  if (!terms.length) return []

  const snap = await getFirestore()
    .collection("users")
    .doc(uid)
    .collection("organizedItems")
    .orderBy("createdAt", "desc")
    .limit(80)
    .get()

  return snap.docs
    .map(serializeOrganizerItem)
    .map((item) => withCreatedAtKey(item, timeZone))
    .filter((item) => !dateFilter || dateFilter.matches(item))
    .map((item) => ({
      ...item,
      score: scoreOrganizerItem(item, terms),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ searchIndex, score, createdAtMs, createdAtKey, ...item }) => item)
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
          {
            role: "assistant",
            content: String(data.answerPreview || ""),
          },
        ]
      })
      .filter((entry) => entry.content)
  } catch (error) {
    console.warn("Could not load assistant history", error?.message || error)
    return []
  }
}

function organizerContext(savedItems) {
  if (!savedItems.length) {
    return "No relevant saved organizer entries were found for this signed-in user."
  }

  return `Relevant saved organizer entries for this signed-in user:\n${savedItems
    .map((item, index) => {
      const event = item.event?.isEvent
        ? ` Event: ${[
            item.event.title,
            item.event.startDate,
            item.event.startTime,
            item.event.location,
          ]
            .filter(Boolean)
            .join(" | ")}.`
        : ""
      const images = item.images?.length
        ? ` Media: ${item.images
            .map((image) =>
              [
                image.name,
                image.kind ? `kind ${image.kind}` : "",
                image.note ? `note ${image.note}` : "",
              ]
                .filter(Boolean)
                .join(" | ")
            )
            .join(", ")}.`
        : ""

      return `${index + 1}. [id: ${item.id}] ${item.title}: ${item.summary} Tags: ${[
        ...(item.categories || []),
        ...(item.tags || []),
      ].join(", ")}.${event}${images}`
    })
    .join("\n")}`
}

function normalizeAssistantPayload(payload, savedItems = [], options = {}) {
  const mode =
    payload?.mode === "route"
      ? "route"
      : payload?.mode === "clarify"
        ? "clarify"
        : "answer"
  const answer = String(payload?.answer || "").trim()
  const routeHref = String(payload?.routeHref || "").trim()
  const matchedRoute = assistantRoutes.find((route) => route.href === routeHref)
  const route = matchedRoute ? { label: matchedRoute.label, href: matchedRoute.href } : null
  const showSavedMedia = !!payload?.showSavedMedia
  const showSavedDataList =
    !!options.forceSavedDataList || !!payload?.showSavedDataList
  const requestedIds = Array.isArray(payload?.savedItemIds)
    ? payload.savedItemIds.map((id) => String(id || "").trim()).filter(Boolean)
    : []
  const shouldDisplaySavedItems = showSavedMedia || showSavedDataList
  const displayLimit = showSavedDataList ? 100 : 5
  const displaySavedItems = shouldDisplaySavedItems
    ? requestedIds.length
      ? savedItems.filter((item) => requestedIds.includes(item.id))
      : savedItems.slice(0, displayLimit)
    : []

  if (mode === "route" && matchedRoute) {
    return {
      mode: "route",
      answer:
        answer ||
        `The ${matchedRoute.label} page is the best place for that request.`,
      route: {
        label: matchedRoute.label,
        href: matchedRoute.href,
      },
      showSavedMedia: false,
      showSavedDataList: false,
      needsClarification: false,
      clarificationFor: null,
      savedItems: [],
    }
  }

  if (mode === "clarify") {
    return {
      mode: "clarify",
      answer:
        answer ||
        "What would you like this to accomplish, and who is it for?",
      route: null,
      showSavedMedia: false,
      showSavedDataList: false,
      needsClarification: true,
      clarificationFor: "assistant",
      savedItems: [],
    }
  }

  return {
    mode: "answer",
    answer:
      answer ||
      "I can help with that. Ask about components, applications, finance tools, events, social content, or starting a project.",
    route,
    showSavedMedia,
    showSavedDataList,
    needsClarification: false,
    clarificationFor: null,
    savedItems: displaySavedItems,
  }
}

function buildSavedDataListPayload({ savedItems, dateFilter }) {
  const count = savedItems.length
  const filterSuffix = dateFilter?.label ? ` ${dateFilter.label}` : ""
  const answer = count
    ? `Here ${count === 1 ? "is" : "are"} ${count} saved ${
        count === 1 ? "item" : "items"
      }${filterSuffix}.`
    : dateFilter?.label
      ? `I couldn't find saved data ${dateFilter.label}.`
      : "I couldn't find any saved data yet."

  return {
    mode: "answer",
    answer,
    route: null,
    showSavedMedia: false,
    showSavedDataList: count > 0,
    needsClarification: false,
    clarificationFor: null,
    savedItems,
  }
}

export default async function homeRouteAssistant(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const prompt = String(req.body?.prompt || "").trim()

  if (!prompt) {
    res.status(400).json({ error: "Prompt is required" })
    return
  }

  if (prompt.length > MAX_ASSISTANT_PROMPT) {
    res.status(400).json({ error: `Please keep your question under ${MAX_ASSISTANT_PROMPT} characters.` })
    return
  }

  // These public facts require neither a model call nor a database round trip.
  const immediate = assistantQuickAnswer(prompt)
  if (immediate) {
    res.setHeader('Cache-Control', 'no-store')
    res.json(immediate)
    return
  }

  if (!process.env.OPENAI_API_KEY && !process.env.DALLE_KEY) {
    res.status(500).json({ error: "OpenAI API key is not configured" })
    return
  }

  let user = null
  const streaming = req.body?.stream === true
  let streamedAnswer = ""
  const controller = streaming ? new AbortController() : null
  const disconnect = () => { if (!res.writableEnded) controller?.abort() }
  if (streaming) res.once("close", disconnect)
  const sendEvent = event => {
    if (res.destroyed || res.writableEnded) return
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8")
      res.setHeader("Cache-Control", "no-store, no-transform")
      res.setHeader("X-Accel-Buffering", "no")
      res.flushHeaders()
    }
    res.write(`${JSON.stringify(event)}\n`)
  }

  try {
    user = await getUserFromBody(req)
    const clientHistory = normalizeConversationHistory(req.body?.history)
    const [, storedHistory] = await Promise.all([assertAssistantRateLimit({
      req,
      uid: user?.uid || null,
      isAnonymous: isAnonymousFirebaseUser(user),
      prompt,
      action: "route-assistant",
    }), user && !clientHistory.length ? loadStoredAssistantHistory(user.uid) : Promise.resolve([])])
    const history = normalizeConversationHistory([
      ...storedHistory,
      ...clientHistory,
    ])
    const timeZone = String(req.body?.timeZone || "America/Los_Angeles")
    const savedDataDateFilter = buildSavedDataDateFilter(prompt, { timeZone })
    const shouldSearchSavedData = !!user && wantsSavedDataListPrompt(prompt)
    const shouldListSavedData =
      shouldSearchSavedData && wantsBroadSavedDataListPrompt(prompt)
    const savedItems = user
      ? shouldListSavedData
        ? await loadRecentOrganizerItems({
            uid: user.uid,
            limit: null,
            timeZone,
            dateFilter: savedDataDateFilter,
          })
        : shouldSearchSavedData
          ? await findOrganizerMatches({
              uid: user.uid,
              prompt,
              timeZone,
              dateFilter: savedDataDateFilter,
            })
          : []
      : []

    if (shouldListSavedData) {
      const savedDataPayload = buildSavedDataListPayload({
        savedItems,
        dateFilter: savedDataDateFilter,
      })
      await logAiQuestion({
        uid: user?.uid || null,
        isAnonymous: isAnonymousFirebaseUser(user),
        prompt,
        source: req.body?.source || "route-assistant",
        ...savedDataPayload,
      })
      res.json(savedDataPayload)
      return
    }

    if (wantsSchedulerRoutePrompt(prompt)) {
      const schedulerPayload = {
        mode: "route",
        answer:
          "The Scheduler page is the best place to view and manage calendar items.",
        route: {
          label: "Scheduler",
          href: "/components/scheduler",
        },
        showSavedMedia: false,
        showSavedDataList: false,
        needsClarification: false,
        clarificationFor: null,
        savedItems: [],
      }
      await logAiQuestion({
        uid: user?.uid || null,
        isAnonymous: isAnonymousFirebaseUser(user),
        prompt,
        source: req.body?.source || "route-assistant",
        ...schedulerPayload,
      })
      res.json(schedulerPayload)
      return
    }

    const parsed = await generateAssistantPayload(openai, {
      prompt,
      history,
      routes: assistantRoutes,
      savedContext: user ? organizerContext(savedItems) : "The visitor is not signed in; no private saved data is available.",
      dateFilter: savedDataDateFilter,
    }, {
      signal: controller?.signal,
      onAnswer: streaming ? answer => {
        const event = answer.startsWith(streamedAnswer)
          ? { type: "answer", delta: answer.slice(streamedAnswer.length) }
          : { type: "answer", answer }
        streamedAnswer = answer
        sendEvent(event)
      } : undefined,
    })

    const normalizedPayload = normalizeAssistantPayload(parsed, savedItems, {
      forceSavedDataList: shouldListSavedData,
    })
    await logAiQuestion({
      uid: user?.uid || null,
      isAnonymous: isAnonymousFirebaseUser(user),
      prompt,
      source: req.body?.source || "route-assistant",
      ...normalizedPayload,
    })
    if (streaming) {
      sendEvent({ type: "done", payload: normalizedPayload })
      res.end()
    } else res.json(normalizedPayload)
  } catch (error) {
    if (controller?.signal.aborted) return
    if (isAssistantRateLimitError(error)) {
      sendAssistantRateLimitError(res, error)
      return
    }

    console.error("Home assistant failed", { status: error?.status, code: error?.code, message: error?.message })
    await logAiQuestion({
      uid: user?.uid || null,
      isAnonymous: isAnonymousFirebaseUser(user),
      prompt,
      source: req.body?.source || "route-assistant",
      mode: "error",
      answer: "The assistant could not complete this answer.",
    })
    const message = "The assistant is temporarily unavailable. Please try again."
    if (res.headersSent) { sendEvent({ type: "error", error: message }); res.end() }
    else res.status(500).json({ error: message })
  } finally {
    if (streaming) res.off("close", disconnect)
  }
}
