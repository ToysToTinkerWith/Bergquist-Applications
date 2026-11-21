// lib/firebaseAdmin.js
import admin from "firebase-admin"

function getPrivateKey() {
  const key = process.env.NEXT_FIREBASE_PRIVATE_KEY
  return key ? key.replace(/\\n/g, "\n") : undefined
}

export function getAdminApp() {
  if (admin.apps.length) return admin.app()

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.NEXT_FIREBASE_CLIENT_EMAIL
  const privateKey = getPrivateKey()
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin env vars: NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_FIREBASE_CLIENT_EMAIL, NEXT_FIREBASE_PRIVATE_KEY."
    )
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    ...(storageBucket ? { storageBucket } : {}),
  })
}

export function getFirestore() {
  getAdminApp()
  return admin.firestore()
}

export function getAdminAuth() {
  getAdminApp()
  return admin.auth()
}

export function getStorageBucket() {
  getAdminApp()

  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

  if (!bucketName) {
    throw new Error(
      "Missing Firebase Storage bucket env var: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET."
    )
  }

  return admin.storage().bucket(bucketName)
}

export const adminFieldValue = admin.firestore.FieldValue

export { admin }