// Server-only Google web-service requests. Do not import this module in a client bundle.
import { validDate, validTimeZone } from "./businessNotes.mjs"

export class BusinessLocationError extends Error {
  constructor(code, message, statusCode = 503) { super(message); this.name = "BusinessLocationError"; this.code = code; this.statusCode = statusCode }
}
const fail = (code, message, status = 503) => { throw new BusinessLocationError(code, message, status) }
const finite = value => typeof value === "number" && Number.isFinite(value)
const shortText = (value, max = 180) => typeof value === "string" ? value.trim().slice(0, max) : ""

export function validateLocationRequest(input) {
  const location = typeof input?.location === "string" ? input.location.trim() : ""
  if (location.length < 2 || location.length > 500 || /[\u0000-\u001f\u007f]/.test(location) || /(?:https?|ftp|file):\/\/|^\/\/|^(?:data|javascript):/i.test(location)) fail("invalid_location", "Enter a city or postal address of up to 500 characters, rather than a URL.", 400)
  const date = input?.date == null || input.date === "" ? null : input.date
  if (date !== null && !validDate(date)) fail("invalid_date", "Choose a valid date in YYYY-MM-DD format.", 400)
  const timeZone = input?.timeZone || "America/Los_Angeles"
  if (!validTimeZone(timeZone)) fail("invalid_timezone", "Choose a valid timezone.", 400)
  return { location, date, timeZone }
}

export function normalizeGeocode(data) {
  if (data?.status === "ZERO_RESULTS") fail("location_not_found", "No matching place was found. Add a city, state, or postal address.", 404)
  if (data?.status === "REQUEST_DENIED" || data?.status === "OVER_DAILY_LIMIT") fail("google_permission_denied", "Google location lookup is unavailable. Check Geocoding API access, billing, and key restrictions.")
  if (data?.status === "OVER_QUERY_LIMIT") fail("google_rate_limit", "Google location lookup is busy. Try again shortly.", 429)
  if (data?.status !== "OK" || !Array.isArray(data.results)) fail("google_upstream", "Google location lookup is temporarily unavailable.")
  if (data.results.length !== 1 || data.results[0]?.partial_match) fail("location_ambiguous", "The location did not match one complete place. Add a city, state, or postal address.", 422)
  const result = data.results[0], point = result?.geometry?.location
  if (!finite(point?.lat) || !finite(point?.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180 || !shortText(result?.formatted_address, 600)) fail("google_upstream", "Google returned an incomplete location result.")
  const country = (Array.isArray(result.address_components) ? result.address_components : []).find(component => Array.isArray(component.types) && component.types.includes("country"))?.short_name
  return { label: shortText(result.formatted_address, 600), lat: point.lat, lng: point.lng, countryCode: typeof country === "string" && /^[A-Z]{2}$/.test(country) ? country : null }
}

function celsius(value) {
  if (!finite(value?.degrees)) return null
  const degrees = value.unit === "CELSIUS" ? value.degrees : value.unit === "FAHRENHEIT" ? (value.degrees - 32) * 5 / 9 : null
  return finite(degrees) && degrees >= -100 && degrees <= 100 ? Math.round(degrees * 10) / 10 : null
}
function probability(value) { return finite(value) && value >= 0 && value <= 100 ? value : null }
function providerDate(value) {
  if (!value || !Number.isInteger(value.year) || !Number.isInteger(value.month) || !Number.isInteger(value.day)) return null
  const date = `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`
  return validDate(date) ? date : null
}
function dateAt(instant, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant)
  const part = name => parts.find(entry => entry.type === name).value
  return `${part("year")}-${part("month")}-${part("day")}`
}
function thirdParty(countryCode) {
  if (countryCode === "JP") return [{ title: "気象データ提供：株式会社ウェザーニューズ", url: "https://jp.weathernews.com/" }]
  if (countryCode === "KR") return [{ title: "날씨 정보 제공: 웨더뉴스", url: "https://kr.weathernews.com/" }]
  return []
}
const baseWeather = countryCode => ({ source: "Google Weather", attribution: "Source: Includes weather data from Google.", thirdPartyAttributions: thirdParty(countryCode) })

export function normalizeCurrentWeather(data, { requestedDate = null, timeZone = "America/Los_Angeles", forecastRange = null, countryCode = null } = {}) {
  const instant = typeof data?.currentTime === "string" ? new Date(data.currentTime) : null
  if (!instant || !Number.isFinite(instant.getTime())) fail("google_upstream", "Google returned incomplete current weather.")
  const zone = validTimeZone(data.timeZone?.id) ? data.timeZone.id : timeZone
  const date = dateAt(instant, zone), condition = shortText(data.weatherCondition?.description?.text)
  const tempC = celsius(data.temperature)
  if (!condition && tempC === null) fail("google_upstream", "Google returned incomplete current weather.")
  return {
    ...baseWeather(countryCode), mode: "current", date, requestedDate, forecastAvailable: false, condition: condition || "Conditions unavailable",
    tempC, minTempC: null, maxTempC: null, precipProbability: probability(data.precipitation?.probability?.percent),
    timeZone: zone, asOf: instant.toISOString(), forecastRange,
    message: requestedDate ? `A daily forecast for ${requestedDate} is unavailable. Showing current conditions for ${date}, not a forecast for the requested appointment.` : "Current conditions at this location.",
  }
}

export function normalizeDailyWeather(data, requestedDate, { timeZone = "America/Los_Angeles", countryCode = null, now = new Date() } = {}) {
  if (!Array.isArray(data?.forecastDays)) fail("google_upstream", "Google returned an incomplete daily forecast.")
  const dates = data.forecastDays.map(day => providerDate(day.displayDate)).filter(Boolean).sort()
  const forecastRange = dates.length ? { from: dates[0], through: dates[dates.length - 1] } : null
  const day = data.forecastDays.find(day => providerDate(day.displayDate) === requestedDate)
  if (!day) return { weather: null, forecastRange }
  const part = day.fullDayForecast || day.daytimeForecast || day.nighttimeForecast
  const condition = shortText(part?.weatherCondition?.description?.text), maxTempC = celsius(day.maxTemperature), minTempC = celsius(day.minTemperature)
  if (!condition && maxTempC === null && minTempC === null) fail("google_upstream", "Google returned an incomplete daily forecast.")
  return { forecastRange, weather: {
    ...baseWeather(countryCode), mode: "forecast", date: requestedDate, requestedDate, forecastAvailable: true,
    condition: condition || "Conditions unavailable", tempC: null, minTempC, maxTempC,
    precipProbability: probability(part?.precipitation?.probability?.percent), timeZone: validTimeZone(data.timeZone?.id) ? data.timeZone.id : timeZone,
    asOf: now.toISOString(), forecastRange, period: day.fullDayForecast ? "full-day" : day.daytimeForecast ? "daytime" : "nighttime",
    message: day.fullDayForecast ? "Daily forecast; high and low temperatures for this date." : "Daytime conditions with daily high and low temperatures; not an hourly appointment forecast.",
  } }
}

async function googleJson(url, { fetchImpl, timeoutMs, service }) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(url.toString(), { signal: controller.signal, redirect: "error", headers: { Accept: "application/json" } })
    if (response.status === 401 || response.status === 403) fail("google_permission_denied", `Google ${service} is unavailable. Check API access, billing, and key restrictions.`)
    if (response.status === 429) fail("google_rate_limit", `Google ${service} is busy. Try again shortly.`, 429)
    if (!response.ok) fail("google_upstream", `Google ${service} is temporarily unavailable.`)
    const data = await response.json()
    if (data?.error) {
      if (["PERMISSION_DENIED", "UNAUTHENTICATED"].includes(data.error.status)) fail("google_permission_denied", `Google ${service} is unavailable. Check API access, billing, and key restrictions.`)
      fail("google_upstream", `Google ${service} is temporarily unavailable.`)
    }
    return data
  } catch (error) {
    if (error instanceof BusinessLocationError) throw error
    if (controller.signal.aborted) fail("google_timeout", `Google ${service} took too long. Try again.`)
    // Never propagate fetch errors: their messages can include the credentialed URL.
    fail("google_upstream", `Google ${service} is temporarily unavailable.`)
  } finally { clearTimeout(timer) }
}

export async function lookupBusinessLocation(input, { apiKey = process.env.MAPS_API_KEY, fetchImpl = globalThis.fetch, timeoutMs = 8000, now = new Date() } = {}) {
  const request = validateLocationRequest(input)
  if (typeof apiKey !== "string" || !apiKey.trim()) fail("maps_unconfigured", "Location and weather services are not configured here.")
  if (typeof fetchImpl !== "function") fail("google_upstream", "Location and weather services are temporarily unavailable.")
  const options = { fetchImpl, timeoutMs: Math.min(15000, Math.max(1, timeoutMs)) }
  const geocodeUrl = new URL("https://maps.googleapis.com/maps/api/geocode/json")
  geocodeUrl.search = new URLSearchParams({ address: request.location, language: "en", key: apiKey }).toString()
  const location = normalizeGeocode(await googleJson(geocodeUrl, { ...options, service: "location lookup" }))
  const weatherUrl = path => {
    const url = new URL(`https://weather.googleapis.com/v1/${path}`)
    url.search = new URLSearchParams({ "location.latitude": String(location.lat), "location.longitude": String(location.lng), unitsSystem: "METRIC", languageCode: "en", key: apiKey }).toString()
    return url
  }
  try {
    let forecastRange = null
    if (request.date) {
      const url = weatherUrl("forecast/days:lookup")
      url.searchParams.set("days", "10"); url.searchParams.set("pageSize", "10")
      const daily = normalizeDailyWeather(await googleJson(url, { ...options, service: "weather" }), request.date, { timeZone: request.timeZone, countryCode: location.countryCode, now })
      if (daily.weather) return { location, weather: daily.weather }
      forecastRange = daily.forecastRange
    }
    const data = await googleJson(weatherUrl("currentConditions:lookup"), { ...options, service: "weather" })
    return { location, weather: normalizeCurrentWeather(data, { requestedDate: request.date, timeZone: request.timeZone, forecastRange, countryCode: location.countryCode }) }
  } catch (error) {
    if (error instanceof BusinessLocationError) error.location = location
    throw error
  }
}
