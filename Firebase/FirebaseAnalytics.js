import { initializeApp, getApps } from 'firebase/app'

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}
let ready
export async function logFirebaseAnalyticsEvent(name, params) {
  if (typeof window === 'undefined' || !config.apiKey || !config.appId || !config.measurementId) return
  ready ||= import('firebase/analytics').then(async sdk => {
    if (!await sdk.isSupported()) return null
    const app = getApps().length ? getApps()[0] : initializeApp(config)
    let analytics
    try { analytics = sdk.initializeAnalytics(app, { config: { send_page_view: false, anonymize_ip: true } }) }
    catch (error) { if (error.code !== 'analytics/already-initialized') throw error; analytics = sdk.getAnalytics(app) }
    return { sdk, analytics }
  })
  const result = await ready
  if (result) result.sdk.logEvent(result.analytics, name, params)
}
