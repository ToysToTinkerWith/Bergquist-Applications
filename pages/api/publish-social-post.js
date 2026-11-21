// pages/api/publish-social-post.js
import {
  getAdminAuth,
  getFirestore,
  adminFieldValue,
} from "../../lib/firebaseAdmin"
import { decryptObject } from "../../lib/socialSecrets"

const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v25.0"

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

function makeCaption(post) {
  return [post.title, post.description].filter(Boolean).join("\n\n")
}

async function fetchImageBuffer(imageUrl) {
  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error("Could not fetch generated image.")
  }

  const arrayBuffer = await response.arrayBuffer()
  const contentType = response.headers.get("content-type") || "image/png"

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  }
}

async function publishToDiscord({ post, credentials }) {
  if (!credentials.webhookUrl) {
    throw new Error("Missing Discord webhook URL.")
  }

  const { buffer } = await fetchImageBuffer(post.imageUrl)

  const formData = new FormData()

  formData.append(
    "payload_json",
    JSON.stringify({
      content: makeCaption(post),
    })
  )

  formData.append(
    "files[0]",
    new Blob([buffer], { type: "image/png" }),
    "social-post.png"
  )

  const response = await fetch(credentials.webhookUrl, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Discord publish failed: ${text}`)
  }

  return {
    platformPostId: "discord-webhook",
  }
}

async function publishToFacebook({ post, credentials }) {
  if (!credentials.pageId || !credentials.pageAccessToken) {
    throw new Error("Missing Facebook Page ID or Page access token.")
  }

  const params = new URLSearchParams()
  params.set("url", post.imageUrl)
  params.set("caption", makeCaption(post))
  params.set("access_token", credentials.pageAccessToken)

  const response = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${credentials.pageId}/photos`,
    {
      method: "POST",
      body: params,
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || "Facebook publish failed.")
  }

  return {
    platformPostId: data.post_id || data.id || "",
    raw: data,
  }
}

async function publishToInstagram({ post, credentials }) {
  if (!credentials.igUserId || !credentials.accessToken) {
    throw new Error("Missing Instagram User ID or access token.")
  }

  const createParams = new URLSearchParams()
  createParams.set("image_url", post.imageUrl)
  createParams.set("caption", makeCaption(post))
  createParams.set("access_token", credentials.accessToken)

  const createResponse = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${credentials.igUserId}/media`,
    {
      method: "POST",
      body: createParams,
    }
  )

  const createData = await createResponse.json()

  if (!createResponse.ok) {
    throw new Error(
      createData?.error?.message || "Instagram media container failed."
    )
  }

  const publishParams = new URLSearchParams()
  publishParams.set("creation_id", createData.id)
  publishParams.set("access_token", credentials.accessToken)

  const publishResponse = await fetch(
    `https://graph.facebook.com/${META_GRAPH_VERSION}/${credentials.igUserId}/media_publish`,
    {
      method: "POST",
      body: publishParams,
    }
  )

  const publishData = await publishResponse.json()

  if (!publishResponse.ok) {
    throw new Error(publishData?.error?.message || "Instagram publish failed.")
  }

  return {
    platformPostId: publishData.id || "",
    raw: publishData,
  }
}

async function publishToLinkedIn({ post, credentials }) {
  if (!credentials.accessToken || !credentials.authorUrn) {
    throw new Error("Missing LinkedIn access token or author URN.")
  }

  const { buffer, contentType } = await fetchImageBuffer(post.imageUrl)

  const registerResponse = await fetch(
    "https://api.linkedin.com/v2/assets?action=registerUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: credentials.authorUrn,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent",
            },
          ],
        },
      }),
    }
  )

  const registerData = await registerResponse.json()

  if (!registerResponse.ok) {
    throw new Error(
      registerData?.message || "LinkedIn image registration failed."
    )
  }

  const uploadUrl =
    registerData?.value?.uploadMechanism?.[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ]?.uploadUrl

  const asset = registerData?.value?.asset

  if (!uploadUrl || !asset) {
    throw new Error("LinkedIn did not return an upload URL.")
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Content-Type": contentType,
    },
    body: buffer,
  })

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text()
    throw new Error(`LinkedIn image upload failed: ${text}`)
  }

  const shareResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: credentials.authorUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: makeCaption(post),
          },
          shareMediaCategory: "IMAGE",
          media: [
            {
              status: "READY",
              media: asset,
              title: {
                text: post.title || "Generated Social Post",
              },
            },
          ],
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  })

  const shareText = await shareResponse.text()

  if (!shareResponse.ok) {
    throw new Error(`LinkedIn publish failed: ${shareText}`)
  }

  return {
    platformPostId: shareResponse.headers.get("x-restli-id") || "",
    raw: shareText,
  }
}

const PUBLISHERS = {
  discord: publishToDiscord,
  instagram: publishToInstagram,
  facebook: publishToFacebook,
  linkedin: publishToLinkedIn,
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

    const platform = String(req.body?.platform || "").trim()
    const postId = String(req.body?.postId || "").trim()

    if (!PUBLISHERS[platform]) {
      return res.status(400).json({
        error: "Unsupported platform.",
      })
    }

    if (!postId) {
      return res.status(400).json({
        error: "Missing postId.",
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

    const integrationsRef = db
      .collection("users")
      .doc(uid)
      .collection("socialIntegrations")
      .doc("private")

    const integrationsSnap = await integrationsRef.get()

    if (!integrationsSnap.exists) {
      return res.status(400).json({
        error: "No saved social integrations found.",
      })
    }

    const integrations = decryptObject(integrationsSnap.data()?.encrypted)
    const credentials = integrations[platform] || {}

    const post = {
      id: postSnap.id,
      ...postSnap.data(),
    }

    const result = await PUBLISHERS[platform]({
      post,
      credentials,
    })

    await postRef.update({
      [`published.${platform}`]: {
        platform,
        platformPostId: result.platformPostId || "",
        publishedAt: adminFieldValue.serverTimestamp(),
      },
      updatedAt: adminFieldValue.serverTimestamp(),
    })

    return res.status(200).json({
      success: true,
      platform,
      result,
    })
  } catch (err) {
    console.error("publish-social-post error:", err)

    return res.status(err.statusCode || 500).json({
      error: err.message || "Failed to publish social post.",
    })
  }
}