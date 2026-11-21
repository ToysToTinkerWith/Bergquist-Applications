// pages/api/social-integrations.js
import {
  getAdminAuth,
  getFirestore,
  adminFieldValue,
} from "../../lib/firebaseAdmin"
import {
  decryptObject,
  encryptObject,
  redactIntegrations,
} from "../../lib/socialSecrets"

async function verifyFirebaseUser(req) {
  const authHeader = req.headers.authorization || ""

  if (!authHeader.startsWith("Bearer ")) {
    const err = new Error("Missing Firebase auth token.")
    err.statusCode = 401
    throw err
  }

  const token = authHeader.replace("Bearer ", "").trim()
  return getAdminAuth().verifyIdToken(token)
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeIntegrations(body = {}) {
  return {
    discord: {
      webhookUrl: cleanString(body.discord?.webhookUrl),
    },
    instagram: {
      accessToken: cleanString(body.instagram?.accessToken),
      igUserId: cleanString(body.instagram?.igUserId),
    },
    facebook: {
      pageAccessToken: cleanString(body.facebook?.pageAccessToken),
      pageId: cleanString(body.facebook?.pageId),
    },
    linkedin: {
      accessToken: cleanString(body.linkedin?.accessToken),
      authorUrn: cleanString(body.linkedin?.authorUrn),
    },
  }
}

function compactIntegrations(integrations = {}) {
  return Object.fromEntries(
    Object.entries(integrations)
      .map(([platform, values]) => [
        platform,
        Object.fromEntries(
          Object.entries(values || {}).filter(([, value]) =>
            Boolean(cleanString(value))
          )
        ),
      ])
      .filter(([, values]) => Object.keys(values).length)
  )
}

export default async function handler(req, res) {
  try {
    const decodedUser = await verifyFirebaseUser(req)
    const uid = decodedUser.uid
    const db = getFirestore()

    const ref = db
      .collection("users")
      .doc(uid)
      .collection("socialIntegrations")
      .doc("private")

    if (req.method === "GET") {
      const snap = await ref.get()

      if (!snap.exists) {
        return res.status(200).json({
          integrations: redactIntegrations({}),
        })
      }

      const integrations = decryptObject(snap.data()?.encrypted)

      return res.status(200).json({
        integrations: redactIntegrations(integrations),
      })
    }

    if (req.method === "POST") {
      const incoming = normalizeIntegrations(req.body || {})

      const existingSnap = await ref.get()
      const existing = existingSnap.exists
        ? decryptObject(existingSnap.data()?.encrypted)
        : {}

      const merged = compactIntegrations({
        discord: {
          webhookUrl:
            incoming.discord.webhookUrl || existing.discord?.webhookUrl || "",
        },
        instagram: {
          accessToken:
            incoming.instagram.accessToken ||
            existing.instagram?.accessToken ||
            "",
          igUserId:
            incoming.instagram.igUserId || existing.instagram?.igUserId || "",
        },
        facebook: {
          pageAccessToken:
            incoming.facebook.pageAccessToken ||
            existing.facebook?.pageAccessToken ||
            "",
          pageId: incoming.facebook.pageId || existing.facebook?.pageId || "",
        },
        linkedin: {
          accessToken:
            incoming.linkedin.accessToken ||
            existing.linkedin?.accessToken ||
            "",
          authorUrn:
            incoming.linkedin.authorUrn || existing.linkedin?.authorUrn || "",
        },
      })

      await ref.set(
        {
          encrypted: encryptObject(merged),
          updatedAt: adminFieldValue.serverTimestamp(),
        },
        { merge: true }
      )

      return res.status(200).json({
        integrations: redactIntegrations(merged),
      })
    }

    return res.status(405).json({
      error: "Method not allowed.",
    })
  } catch (err) {
    console.error("social-integrations error:", err)

    return res.status(err.statusCode || 500).json({
      error: err.message || "Failed to handle social integrations.",
    })
  }
}
