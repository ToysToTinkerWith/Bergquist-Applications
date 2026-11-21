import { getAdminAuth, getFirestore } from "../../lib/firebaseAdmin"
import { isAnonymousFirebaseUser } from "../../lib/assistantRateLimit"

const CATEGORY_DEFINITIONS = [
  {
    key: "organize",
    label: "Store and organize",
    pattern:
      /\b(save|store|remember|organize|file|log|keep|database|upload|image|photo|video|data)\b/i,
  },
  {
    key: "retrieve",
    label: "Find saved info",
    pattern:
      /\b(find|get|retrieve|show|view|open|display|search|saved|stored|where is|what did)\b/i,
  },
  {
    key: "schedule",
    label: "Schedule and reminders",
    pattern:
      /\b(remind|reminder|schedule|calendar|wake|appointment|meeting|deadline|tomorrow|today|next week)\b/i,
  },
  {
    key: "generate",
    label: "Generate images",
    pattern:
      /\b(generate|create|make|design|mockup|mock-up|render|draw|visual|poster|flyer|logo|wireframe)\b/i,
  },
  {
    key: "components",
    label: "Components",
    pattern:
      /\b(component|dashboard|timeline|scheduler|catalog|analytics|chart|wallet|chatbot|game|graph)\b/i,
  },
  {
    key: "applications",
    label: "Applications and services",
    pattern:
      /\b(application|app|website|service|project|business|restaurant|ordering|booking|start|pricing|quote|contact)\b/i,
  },
  {
    key: "commerce",
    label: "Commerce and finance",
    pattern:
      /\b(payment|stripe|checkout|order|ordering|analytics|sales|wallet|algorand|market|finance|revenue)\b/i,
  },
]

const MODE_CATEGORY = {
  organize: "organize",
  schedule: "schedule",
  image: "generate",
  route: "components",
}

function cleanPrompt(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
}

function normalizePrompt(value) {
  return cleanPrompt(value)
    .toLowerCase()
    .replace(/[^\w\s/-]/g, "")
}

async function getUserFromBody(req) {
  const idToken = String(req.body?.idToken || "").trim()
  if (!idToken) return null

  try {
    return await getAdminAuth().verifyIdToken(idToken)
  } catch (error) {
    console.warn("Ignoring invalid insights token", error?.message || error)
    return null
  }
}

function getCategoryKeys(entry) {
  const prompt = String(entry.prompt || "")
  const keys = new Set()
  const modeKey = MODE_CATEGORY[String(entry.mode || "")]

  if (modeKey) keys.add(modeKey)

  CATEGORY_DEFINITIONS.forEach((category) => {
    if (category.pattern.test(prompt)) keys.add(category.key)
  })

  if (!keys.size) keys.add("applications")
  return Array.from(keys)
}

function summarizeEntries(entries, audience) {
  const categoryCounts = new Map()
  const promptCounts = new Map()

  entries.forEach((entry) => {
    getCategoryKeys(entry).forEach((key) => {
      categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1)
    })

    const prompt = cleanPrompt(entry.prompt)
    const normalized = normalizePrompt(prompt)
    if (!normalized) return

    const current = promptCounts.get(normalized) || {
      text: prompt,
      count: 0,
    }
    current.count += 1
    promptCounts.set(normalized, current)
  })

  const topCategories = CATEGORY_DEFINITIONS.map((category) => ({
    key: category.key,
    label: category.label,
    count: categoryCounts.get(category.key) || 0,
  }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const maxCount = Math.max(1, ...topCategories.map((item) => item.count))
  const topPrompts = Array.from(promptCounts.values())
    .filter((item) => audience === "user" || item.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    total: entries.length,
    topCategories: topCategories.map((item) => ({
      ...item,
      ratio: item.count / maxCount,
    })),
    topPrompts,
  }
}

export default async function homeAssistantInsights(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  try {
    const user = await getUserFromBody(req)
    const isAccountUser = user?.uid && !isAnonymousFirebaseUser(user)
    const db = getFirestore()
    const snap = isAccountUser
      ? await db
          .collection("users")
          .doc(user.uid)
          .collection("assistantHistory")
          .orderBy("createdAt", "desc")
          .limit(120)
          .get()
      : await db
          .collection("aiQuestions")
          .orderBy("createdAt", "desc")
          .limit(160)
          .get()

    const entries = snap.docs
      .map((doc) => doc.data() || {})
      .map((data) => ({
        prompt: cleanPrompt(data.prompt),
        mode: String(data.mode || ""),
      }))
      .filter((entry) => entry.prompt)

    res.json({
      audience: isAccountUser ? "user" : "visitor",
      ...summarizeEntries(entries, isAccountUser ? "user" : "visitor"),
    })
  } catch (error) {
    console.error("home-assistant-insights error:", error)
    res.status(500).json({
      error: "Could not load assistant input patterns.",
    })
  }
}
