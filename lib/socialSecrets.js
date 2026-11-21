// lib/socialSecrets.js
import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"

function getKey() {
  const raw = process.env.SOCIAL_SECRETS_KEY

  if (!raw) {
    throw new Error("Missing SOCIAL_SECRETS_KEY env var.")
  }

  const key = Buffer.from(raw, "base64")

  if (key.length !== 32) {
    throw new Error("SOCIAL_SECRETS_KEY must be a 32-byte base64 string.")
  }

  return key
}

export function encryptObject(value) {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const plaintext = JSON.stringify(value || {})
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    data: encrypted.toString("base64"),
  }
}

export function decryptObject(encryptedValue) {
  if (!encryptedValue?.iv || !encryptedValue?.authTag || !encryptedValue?.data) {
    return {}
  }

  const key = getKey()
  const iv = Buffer.from(encryptedValue.iv, "base64")
  const authTag = Buffer.from(encryptedValue.authTag, "base64")
  const data = Buffer.from(encryptedValue.data, "base64")

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])

  return JSON.parse(decrypted.toString("utf8"))
}

export function redactIntegrations(integrations = {}) {
  return {
    discord: {
      connected: Boolean(integrations.discord?.webhookUrl),
    },
    instagram: {
      connected: Boolean(
        integrations.instagram?.accessToken && integrations.instagram?.igUserId
      ),
      igUserId: integrations.instagram?.igUserId || "",
    },
    facebook: {
      connected: Boolean(
        integrations.facebook?.pageAccessToken && integrations.facebook?.pageId
      ),
      pageId: integrations.facebook?.pageId || "",
    },
    linkedin: {
      connected: Boolean(
        integrations.linkedin?.accessToken && integrations.linkedin?.authorUrn
      ),
      authorUrn: integrations.linkedin?.authorUrn || "",
    },
  }
}