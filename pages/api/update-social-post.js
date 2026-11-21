// pages/api/update-social-post.js
import {
  getAdminAuth,
  getFirestore,
  adminFieldValue,
} from "../../lib/firebaseAdmin"

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed.",
    })
  }

  try {
    const decodedUser = await verifyFirebaseUser(req)
    const uid = decodedUser.uid

    const postId = String(req.body?.postId || "").trim()
    const title = String(req.body?.title || "").trim()
    const description = String(req.body?.description || "").trim()

    if (!postId) {
      return res.status(400).json({
        error: "Missing postId.",
      })
    }

    if (!title) {
      return res.status(400).json({
        error: "Title is required.",
      })
    }

    const db = getFirestore()
    const postRef = db
      .collection("users")
      .doc(uid)
      .collection("socialPosts")
      .doc(postId)

    const postSnap = await postRef.get()

    if (!postSnap.exists) {
      return res.status(404).json({
        error: "Post not found.",
      })
    }

    await postRef.update({
      title,
      description,
      updatedAt: adminFieldValue.serverTimestamp(),
    })

    return res.status(200).json({
      post: {
        id: postId,
        ...postSnap.data(),
        title,
        description,
        updatedAt: Date.now(),
      },
    })
  } catch (err) {
    console.error("update-social-post error:", err)

    return res.status(err.statusCode || 500).json({
      error: err.message || "Failed to update social post.",
    })
  }
}