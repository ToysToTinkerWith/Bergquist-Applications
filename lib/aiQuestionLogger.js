import { adminFieldValue, getFirestore } from "./firebaseAdmin"

function compactEntry(entry) {
  return Object.fromEntries(
    Object.entries(entry).filter(([, value]) => {
      if (value == null) return false
      if (typeof value === "string" && !value.trim()) return false
      if (Array.isArray(value) && !value.length) return false
      return true
    })
  )
}

export async function logAiQuestion({
  uid = null,
  isAnonymous = false,
  prompt,
  source,
  mode = null,
  route = null,
  answer = null,
}) {
  const cleanPrompt = String(prompt || "").trim()
  if (!cleanPrompt) return

  try {
    const db = getFirestore()
    const entry = compactEntry({
      prompt: cleanPrompt,
      source: source || "unknown",
      mode,
      route,
      answerPreview: answer ? String(answer).slice(0, 500) : "",
      createdAt: adminFieldValue.serverTimestamp(),
    })

    const writes = []
    if (uid) {
      writes.push(db
        .collection("users")
        .doc(uid)
        .collection("assistantHistory")
        .add(entry))
    }
    if (!uid || isAnonymous) writes.push(db.collection("aiQuestions").add(entry))
    await Promise.all(writes)
  } catch (error) {
    console.warn("Failed to log AI question", error?.message || error)
  }
}
