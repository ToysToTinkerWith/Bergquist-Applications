const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")

const root = path.resolve(__dirname, "..")
const firebaseInit = fs.readFileSync(path.join(root, "Firebase", "FirebaseInit.js"), "utf8")
const appShell = fs.readFileSync(path.join(root, "pages", "_app.js"), "utf8")
const contactPage = fs.readFileSync(path.join(root, "pages", "contact.js"), "utf8")
const businessVisit = fs.readFileSync(path.join(root, "components", "BusinessPageVisit.js"), "utf8")
const envPath = path.join(root, ".env")
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : null

for (const key of [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
]) {
  assert.match(firebaseInit, new RegExp(`${key}\\b`), `${key} is wired into Firebase config`)
  if (env) assert.match(env, new RegExp(`^${key}=.+`, "m"), `${key} is present in .env`)
}

assert.match(firebaseInit, /typeof window !== "undefined"/, "Analytics is guarded from SSR")
assert.match(firebaseInit, /firebaseConfig\.apiKey && firebaseConfig\.appId && firebaseConfig\.measurementId/, "Analytics requires complete public web config")
assert.match(firebaseInit, /isSupported\(\)/, "Analytics checks browser support before init")
assert.match(firebaseInit, /send_page_view:\s*false/, "Automatic Firebase page views are disabled")
assert.match(firebaseInit, /anonymize_ip:\s*true/, "IP anonymization is requested")
assert.match(firebaseInit, /initializeAnalytics\(app,\s*analyticsOptions\)/, "Analytics initializes with explicit options")
assert.match(firebaseInit, /analytics\/already-initialized/, "Existing Analytics instances are reused")
assert.match(firebaseInit, /getAnalytics\(app\)/, "Existing Analytics instance can be returned")
assert.match(firebaseInit, /logEvent\(analytics,\s*eventName,\s*eventParams\)/, "Custom events use Firebase logEvent")
assert.match(firebaseInit, /logFirebaseAnalyticsEvent\("page_view"/, "Page views are logged through Firebase")
assert.match(firebaseInit, /page_path:\s*pagePath/, "Page view includes page path")
assert.match(firebaseInit, /page_location:\s*`\$\{window\.location\.origin\}\$\{pagePath\}`/, "Page view includes absolute location")
assert.match(firebaseInit, /page_title:\s*document\.title/, "Page view includes document title")

assert.match(appShell, /routeChangeComplete/, "Next.js route changes are tracked")
assert.match(appShell, /logFirebasePageView\(url\)/, "Route changes call the Firebase page-view logger")
assert.match(appShell, /handleRouteChange\(\)/, "Initial page load is logged")
assert.doesNotMatch(appShell, /from\s+["']\.\.\/Firebase\/FirebaseInit["']/, "Firebase Analytics is not imported during SSR app render")

const leadEvent = contactPage.match(/logFirebaseAnalyticsEvent\("generate_lead",\s*\{[^}]*\}/s)?.[0] || ""
assert.match(leadEvent, /method:\s*"contact_form"/, "Confirmed contact sends a generate_lead event")
assert.match(leadEvent, /project_type:\s*fields\.project/, "Lead event includes only the selected public project type")
assert.doesNotMatch(leadEvent, /fields\.email/, "Lead event does not include email")
assert.doesNotMatch(leadEvent, /fields\.message/, "Lead event does not include message")
assert.match(businessVisit, /view_service/, "Service pages emit a public view_service event")
assert.match(businessVisit, /view_project/, "Project pages emit a public view_project event")
assert.match(businessVisit, /content_id:\s*slug/, "Business page analytics uses public slugs")

console.log("PASS Firebase Analytics setup: env keys, browser-only init, manual page views, and non-sensitive events are wired")
