
import { initializeApp, getApps } from "firebase/app"

import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"



const analyticsOptions = {
    config: {
        send_page_view: false,
        anonymize_ip: true,
    },
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

let analyticsPromise = null

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

function canUseAnalytics() {
    return typeof window !== "undefined" && Boolean(firebaseConfig.apiKey && firebaseConfig.appId && firebaseConfig.measurementId)
}

export function getFirebaseAnalytics() {
    if (!canUseAnalytics()) return Promise.resolve(null)

    if (!analyticsPromise) {
        analyticsPromise = import("firebase/analytics")
            .then(async ({ getAnalytics, initializeAnalytics, isSupported }) => {
                const supported = await isSupported()
                if (!supported) return null

                try {
                    return initializeAnalytics(app, analyticsOptions)
                } catch (error) {
                    if (error?.code !== "analytics/already-initialized") throw error
                    return getAnalytics(app)
                }
            })
            .catch((error) => {
                console.warn("Firebase Analytics is unavailable.", error?.message || error)
                return null
            })
    }

    return analyticsPromise
}

export async function logFirebaseAnalyticsEvent(eventName, eventParams = {}) {
    if (!canUseAnalytics()) return

    const [{ logEvent }, analytics] = await Promise.all([
        import("firebase/analytics"),
        getFirebaseAnalytics(),
    ])

    if (!analytics) return
    logEvent(analytics, eventName, eventParams)
}

export function logFirebasePageView(url) {
    if (!canUseAnalytics()) return

    const pagePath = url || `${window.location.pathname}${window.location.search}`

    return logFirebaseAnalyticsEvent("page_view", {
        page_path: pagePath,
        page_location: `${window.location.origin}${pagePath}`,
        page_title: document.title,
    }).catch(() => {})
}

