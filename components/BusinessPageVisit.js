import { useEffect } from "react"
import { deferAnalytics, logFirebaseAnalyticsEvent } from "../lib/clientAnalytics"

// Only public catalog identifiers are sent, never form contents or query strings.
export default function BusinessPageVisit({ type, slug }) {
  useEffect(() => {
    return deferAnalytics(() => logFirebaseAnalyticsEvent(type === "service" ? "view_service" : "view_project", { content_id: slug }))
  }, [type, slug])
  return null
}
