// Marketing pages need Analytics, not Auth, Firestore and Storage. Capture the
// navigation immediately but let its SDK load after the first render.
let sdk
const pending = new Set()
let listening = false
export function deferAnalytics(task) {
  if (typeof window === 'undefined') return () => {}
  let cancelled = false, idle
  const run = () => {
    clearTimeout(timer)
    if (idle) window.cancelIdleCallback?.(idle)
    pending.delete(run)
    if (!cancelled) void Promise.resolve().then(task).catch(() => {})
  }
  const timer = window.setTimeout(() => {
    if (window.requestIdleCallback) idle = window.requestIdleCallback(run, { timeout: 2000 })
    else run()
  }, 1200)
  pending.add(run)
  if (!listening) {
    listening = true
    document.addEventListener('visibilitychange', () => { if (document.hidden) [...pending].forEach(flush => flush()) })
  }
  return () => { cancelled = true; clearTimeout(timer); if (idle) window.cancelIdleCallback?.(idle); pending.delete(run) }
}
export async function logFirebaseAnalyticsEvent(name, params = {}) {
  sdk ||= import('../Firebase/FirebaseAnalytics')
  return (await sdk).logFirebaseAnalyticsEvent(name, params)
}
export function logFirebasePageView(url) {
  if (typeof window === 'undefined') return
  const pagePath = url || `${window.location.pathname}${window.location.search}`
  const params = { page_path: pagePath, page_location: `${window.location.origin}${pagePath}`, page_title: document.title }
  deferAnalytics(() => logFirebaseAnalyticsEvent('page_view', params))
}
