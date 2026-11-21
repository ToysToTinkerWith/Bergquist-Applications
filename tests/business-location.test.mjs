import test from "node:test"
import assert from "node:assert/strict"
import { validateLocationRequest, normalizeGeocode, normalizeCurrentWeather, normalizeDailyWeather, lookupBusinessLocation } from "../lib/businessLocation.mjs"

const key = "test-only-maps-key"
const geocode = { status: "OK", results: [{ formatted_address: "Freeland, WA, USA", geometry: { location: { lat: 48.0095, lng: -122.5257 } }, address_components: [{ short_name: "US", types: ["country"] }] }] }
const current = { currentTime: "2026-11-10T01:00:00Z", timeZone: { id: "America/Los_Angeles" }, weatherCondition: { description: { text: "Cloudy" } }, temperature: { degrees: 10, unit: "CELSIUS" }, precipitation: { probability: { percent: 0 } } }
const daily = { timeZone: { id: "America/Los_Angeles" }, forecastDays: [{ displayDate: { year: 2026, month: 11, day: 10 }, maxTemperature: { degrees: 14, unit: "CELSIUS" }, minTemperature: { degrees: 5, unit: "CELSIUS" }, daytimeForecast: { weatherCondition: { description: { text: "Rain" } }, precipitation: { probability: { percent: 80 } } } }] }
function fakeFetch(payloads, urls) { return async url => { urls.push(new URL(url)); const data = payloads.shift(); return { ok: true, status: 200, json: async () => data } } }

test("accepts provided place text while rejecting URLs, invalid dates and timezones", () => {
  assert.equal(validateLocationRequest({ location: " Freeland, WA " }).location, "Freeland, WA")
  for (const input of [{ location: "https://example.test/private" }, { location: "Freeland", date: "2026-02-30" }, { location: "Freeland", timeZone: "Invalid/Zone" }, { location: ["Freeland"] }]) assert.throws(() => validateLocationRequest(input), error => error.statusCode === 400)
})

test("provider location status and coordinates are validated without exposing provider diagnostics", () => {
  assert.equal(normalizeGeocode(geocode).lat, 48.0095)
  assert.throws(() => normalizeGeocode({ status: "REQUEST_DENIED", error_message: key }), error => error.code === "google_permission_denied" && !error.message.includes(key))
  assert.throws(() => normalizeGeocode({ status: "ZERO_RESULTS" }), error => error.statusCode === 404)
  assert.throws(() => normalizeGeocode({ status: "OK", results: [{ formatted_address: "Invalid", geometry: { location: { lat: 999, lng: 0 } } }] }), error => error.code === "google_upstream")
})

test("ambiguous and partial geocodes never trigger a weather lookup for an assumed place", async () => {
  for (const results of [[geocode.results[0], geocode.results[0]], [{ ...geocode.results[0], partial_match: true }], []]) {
    const urls = []
    await assert.rejects(lookupBusinessLocation({ location: "Ambiguous place", date: "2026-11-10" }, { apiKey: key, fetchImpl: fakeFetch([{ status: "OK", results }], urls) }), error => error.code === "location_ambiguous" && error.statusCode === 422)
    assert.equal(urls.length, 1)
  }
})

test("current and daily weather retain honest local dates and distinguish point temperature from daily extrema", () => {
  const conditions = normalizeCurrentWeather(current)
  assert.equal(conditions.date, "2026-11-09")
  assert.equal(conditions.tempC, 10); assert.equal(conditions.precipProbability, 0)
  const { weather } = normalizeDailyWeather(daily, "2026-11-10")
  assert.equal(weather.mode, "forecast"); assert.equal(weather.tempC, null)
  assert.equal(weather.maxTempC, 14); assert.equal(weather.minTempC, 5)
  assert.equal(weather.precipProbability, 80)
  assert.equal(weather.forecastAvailable, true)
})

test("future forecast selection uses provider displayDate and requests all ten days without page truncation", async () => {
  const urls = []
  const data = await lookupBusinessLocation({ location: "Freeland, WA", date: "2026-11-10" }, { apiKey: key, fetchImpl: fakeFetch([geocode, daily], urls) })
  assert.equal(data.weather.date, "2026-11-10"); assert.equal(data.weather.mode, "forecast")
  assert.equal(urls[1].searchParams.get("days"), "10"); assert.equal(urls[1].searchParams.get("pageSize"), "10")
  assert.ok(urls.every(url => ["maps.googleapis.com", "weather.googleapis.com"].includes(url.hostname)))
  assert.ok(!JSON.stringify(data).includes(key))
})

test("out-of-range target dates never masquerade as an appointment forecast", async () => {
  const urls = []
  const data = await lookupBusinessLocation({ location: "Freeland, WA", date: "2027-03-15" }, { apiKey: key, fetchImpl: fakeFetch([geocode, daily, current], urls) })
  assert.equal(data.weather.mode, "current"); assert.equal(data.weather.forecastAvailable, false)
  assert.equal(data.weather.requestedDate, "2027-03-15"); assert.equal(data.weather.date, "2026-11-09")
  assert.match(data.weather.message, /not a forecast/)
  assert.equal(urls.length, 3)
})

test("unconfigured, denied and broken upstream errors are safe and weather errors preserve a valid place", async () => {
  await assert.rejects(lookupBusinessLocation({ location: "Freeland" }, { apiKey: "" }), error => error.code === "maps_unconfigured")
  const urls = [], fetchImpl = fakeFetch([geocode], urls)
  await assert.rejects(lookupBusinessLocation({ location: "Freeland" }, { apiKey: key, fetchImpl: async (...args) => urls.length ? { ok: false, status: 403 } : fetchImpl(...args) }), error => error.code === "google_permission_denied" && error.location.lat === 48.0095 && !error.message.includes(key))
  await assert.rejects(lookupBusinessLocation({ location: "Freeland" }, { apiKey: key, fetchImpl: async () => { throw new Error(`Failed request containing ${key}`) } }), error => error.code === "google_upstream" && !error.message.includes(key))
})

test("requests time out and attribution is preserved for regional providers", async () => {
  await assert.rejects(lookupBusinessLocation({ location: "Freeland" }, { apiKey: key, timeoutMs: 2, fetchImpl: (_, options) => new Promise((_, reject) => options.signal.addEventListener("abort", () => reject(new Error("aborted")))) }), error => error.code === "google_timeout")
  const weather = normalizeCurrentWeather(current, { countryCode: "JP" })
  assert.equal(weather.thirdPartyAttributions[0].url, "https://jp.weathernews.com/")
  assert.equal(weather.attribution, "Source: Includes weather data from Google.")
})
