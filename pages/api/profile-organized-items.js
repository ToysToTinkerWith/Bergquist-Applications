import {
  adminFieldValue,
  getAdminAuth,
  getFirestore,
} from "../../lib/firebaseAdmin"

const MAX_ITEMS = 120
const MAX_MIGRATIONS = 80

function cleanClientId(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80)
}

function serializeValue(value) {
  if (!value) return value
  if (typeof value.toDate === "function") return value.toDate().toISOString()
  if (Array.isArray(value)) return value.map(serializeValue)
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        serializeValue(entryValue),
      ])
    )
  }
  return value
}

function ownerUidForDoc(docSnap) {
  return docSnap.ref.parent.parent?.id || ""
}

function serializeItem(docSnap) {
  const data = docSnap.data() || {}
  return {
    id: docSnap.id,
    ...serializeValue(data),
  }
}

async function migrateAnonymousClientItems({ db, uid, clientId }) {
  if (!clientId) return 0

  const snap = await db
    .collectionGroup("organizedItems")
    .where("clientId", "==", clientId)
    .limit(MAX_MIGRATIONS)
    .get()

  const writes = []

  for (const docSnap of snap.docs) {
    const ownerUid = ownerUidForDoc(docSnap)
    const data = docSnap.data() || {}

    if (!ownerUid || ownerUid === uid || data.ownerIsAnonymous !== true) {
      continue
    }

    const targetId = `migrated_${ownerUid}_${docSnap.id}`.replace(
      /[^a-zA-Z0-9_-]/g,
      "_"
    )
    const targetRef = db
      .collection("users")
      .doc(uid)
      .collection("organizedItems")
      .doc(targetId)
    const targetSnap = await targetRef.get()

    if (targetSnap.exists) continue

    writes.push(
      targetRef.set({
        ...data,
        ownerUid: uid,
        ownerIsAnonymous: false,
        migratedFromUid: ownerUid,
        originalEntryId: docSnap.id,
        migratedAt: adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp(),
      })
    )
  }

  await Promise.all(writes)
  return writes.length
}

export default async function profileOrganizedItems(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    res.status(405).json({ error: "Method not allowed." })
    return
  }

  try {
    const idToken = String(req.body?.idToken || "").trim()
    if (!idToken) {
      res.status(401).json({ error: "Sign in is required." })
      return
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken)
    const uid = decoded.uid
    const clientId = cleanClientId(req.body?.clientId)
    const db = getFirestore()

    const migratedCount = await migrateAnonymousClientItems({
      db,
      uid,
      clientId,
    }).catch((error) => {
      console.warn("Could not migrate anonymous organizer entries", error?.message || error)
      return 0
    })

    const snap = await db
      .collection("users")
      .doc(uid)
      .collection("organizedItems")
      .orderBy("createdAt", "desc")
      .limit(MAX_ITEMS)
      .get()

    res.status(200).json({
      migratedCount,
      items: snap.docs.map(serializeItem),
    })
  } catch (error) {
    console.error("profile-organized-items error:", error)
    res.status(error.statusCode || 500).json({
      error: error.message || "Could not load profile database items.",
    })
  }
}
