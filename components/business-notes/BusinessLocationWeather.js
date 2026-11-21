import { useEffect, useRef, useState } from "react"
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import styles from "../../styles/business-location-weather.module.css"

function calendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return ""
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(undefined, {
    timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric",
  }).format(date) : ""
}

function updatedAt(value, timeZone) {
  const date = new Date(value)
  if (!value || !Number.isFinite(date.getTime())) return ""
  try {
    return new Intl.DateTimeFormat(undefined, { timeZone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(date)
  } catch { return date.toLocaleString() }
}

function temperature(value, unit) {
  if (!Number.isFinite(value)) return null
  const number = unit === "F" ? value * 9 / 5 + 32 : value
  return `${Math.round(number)}°${unit}`
}

function safeProviderUrl(value) {
  if (typeof value !== "string") return null
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : null } catch { return null }
}

export default function BusinessLocationWeather({ location, date = null, timeZone, user }) {
  const [result, setResult] = useState(null), [error, setError] = useState(""), [loading, setLoading] = useState(false)
  const [unit, setUnit] = useState("F")
  const request = useRef(null), sequence = useRef(0), timer = useRef(null)
  const uid = user?.uid || null

  useEffect(() => {
    sequence.current += 1
    request.current?.abort()
    request.current = null
    clearTimeout(timer.current)
    timer.current = null
    setResult(null); setError(""); setLoading(false)
    return () => {
      sequence.current += 1
      request.current?.abort()
      request.current = null
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [location, date, timeZone, uid])

  async function checkWeather() {
    if (loading || !location?.trim()) return
    if (!user?.getIdToken) { setError("Sign in to check weather for this location."); return }
    const controller = new AbortController(), current = ++sequence.current
    request.current?.abort()
    request.current = controller
    setLoading(true); setError("")
    timer.current = setTimeout(() => {
      controller.abort()
      if (sequence.current === current) {
        sequence.current += 1
        timer.current = null
        request.current = null
        setResult(null); setLoading(false)
        setError("The weather lookup took too long. Try again.")
      }
    }, 45000)
    try {
      const token = await user.getIdToken()
      if (controller.signal.aborted || sequence.current !== current) return
      const response = await fetch("/api/business-location", {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ location: location.trim(), date: date || null, timeZone: timeZone || "UTC" }),
      })
      let payload
      try { payload = await response.json() } catch { throw new Error("The weather response could not be read. Try again.") }
      if (!response.ok) throw new Error(payload.error || "Weather is unavailable for this location right now.")
      if (!payload.weather || !["current", "forecast"].includes(payload.weather.mode)) throw new Error("Weather is unavailable for this location right now.")
      if (sequence.current === current && !controller.signal.aborted) setResult(payload)
    } catch (failure) {
      if (sequence.current === current) {
        setResult(null)
        setError(controller.signal.aborted ? "The weather lookup took too long. Try again." : String(failure.message || "Weather could not be checked right now.").slice(0, 500))
      }
    } finally {
      if (sequence.current === current) {
        clearTimeout(timer.current)
        timer.current = null
        request.current = null
        setLoading(false)
      }
    }
  }

  if (!location?.trim()) return null
  const weather = result?.weather
  const weatherDate = calendarDate(weather?.date)
  const currentTemperature = temperature(weather?.tempC, unit)
  const low = temperature(weather?.minTempC, unit), high = temperature(weather?.maxTempC, unit)
  const lastUpdated = updatedAt(weather?.asOf, weather?.timeZone || timeZone)
  const precipitation = Number.isFinite(weather?.precipProbability) && weather.precipProbability >= 0 && weather.precipProbability <= 100 ? Math.round(weather.precipProbability) : null
  const providers = Array.isArray(weather?.thirdPartyAttributions) ? weather.thirdPartyAttributions : []
  const forecastUnavailable = weather?.mode === "current" && weather?.forecastAvailable === false && weather?.requestedDate
  const message = weather?.message || (forecastUnavailable ? `A forecast for ${calendarDate(weather.requestedDate)} is not available. These are current conditions.` : "")

  return <section className={styles.panel} aria-label="Weather for note location">
    <div className={styles.header}>
      <div className={styles.heading}><CloudOutlinedIcon fontSize="small" /><h3>Weather at this location</h3></div>
      <button type="button" className={styles.check} disabled={loading || !user} onClick={checkWeather}>
        {loading ? <span className={styles.spinner} aria-hidden="true" /> : result ? <RefreshRoundedIcon fontSize="small" /> : null}
        {loading ? "Checking…" : result ? "Refresh weather" : "Check weather"}
      </button>
    </div>
    <p className={styles.location}>{result?.location?.label || location}</p>
    {!user && <p className={styles.note}>Sign in to check the weather for this location.</p>}
    {!weather && !loading && !error && user && <p className={styles.note}>{date ? `Check available weather for ${calendarDate(date)}.` : "Check current conditions before you head out."}</p>}
    {loading && <p className={styles.note} role="status">Checking the location and available weather…</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    {weather && <div className={styles.result} aria-busy={loading}>
      <div className={styles.resultHeading}>
        <div><strong>{weather.mode === "forecast" ? "Daily forecast" : "Current conditions"}</strong>{weatherDate && <span>{weatherDate}</span>}</div>
        <div className={styles.units} role="group" aria-label="Temperature units"><button type="button" aria-pressed={unit === "F"} onClick={() => setUnit("F")}>°F</button><button type="button" aria-pressed={unit === "C"} onClick={() => setUnit("C")}>°C</button></div>
      </div>
      {message && <p className={forecastUnavailable ? styles.warning : styles.note}>{message}</p>}
      <div className={styles.conditions}>
        {currentTemperature && <strong className={styles.temperature}>{currentTemperature}</strong>}
        <div>{weather.condition && <span className={styles.condition}>{weather.condition}</span>}<div className={styles.metrics}>
          {low && <span>Low {low}</span>}{high && <span>High {high}</span>}{precipitation !== null && <span>Precipitation {precipitation}%</span>}
        </div></div>
      </div>
      {lastUpdated && <p className={styles.updated}>Updated {lastUpdated}</p>}
      <div className={styles.attribution}><span translate="no" className={styles.googleMaps}>Google Maps</span><span>{weather.attribution || "Source: Includes weather data from Google."}</span></div>
      {providers.length > 0 && <ul className={styles.providers}>{providers.map((provider, index) => {
        const title = typeof provider === "string" ? provider : provider?.title
        if (!title) return null
        const url = safeProviderUrl(provider?.url)
        return <li key={index}>{url ? <a href={url} target="_blank" rel="noopener noreferrer">{title}</a> : title}</li>
      })}</ul>}
    </div>}
  </section>
}
