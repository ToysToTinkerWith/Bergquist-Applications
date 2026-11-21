import { useEffect, useMemo, useRef, useState } from "react"
import { resolveAddress } from "./mapLocations.mjs"
import styles from "../../styles/business-notes-map.module.css"

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"
let mapsPromise = null
let authHandlerInstalled = false
const authFailures = new Set()

function observeAuthorizationFailure(listener) {
  authFailures.add(listener)
  if (!authHandlerInstalled && typeof window !== "undefined") {
    const previous = window.gm_authFailure
    window.gm_authFailure = () => {
      for (const callback of authFailures) callback()
      if (typeof previous === "function") previous()
    }
    authHandlerInstalled = true
  }
  return () => authFailures.delete(listener)
}

async function availableMaps() {
  const maps = window.google?.maps
  if (!maps?.importLibrary) throw new Error("Maps is unavailable")
  await Promise.all([maps.importLibrary("maps"), maps.importLibrary("marker"), maps.importLibrary("geocoding")])
  return maps
}

function loadMaps() {
  if (window.google?.maps?.importLibrary) return availableMaps()
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    const callbackName = "__bergquistBusinessNotesMapReady"
    const script = document.createElement("script")
    let complete = false
    const finish = (error, maps) => {
      if (complete) return
      complete = true
      window.clearTimeout(timeout)
      delete window[callbackName]
      if (error) { script.remove(); reject(error) }
      else resolve(maps)
    }
    const timeout = window.setTimeout(() => finish(new Error("Maps did not load")), 20000)
    window[callbackName] = () => availableMaps().then(maps => finish(null, maps), finish)
    const url = new URL("https://maps.googleapis.com/maps/api/js")
    url.searchParams.set("key", API_KEY)
    url.searchParams.set("v", "weekly")
    url.searchParams.set("loading", "async")
    url.searchParams.set("libraries", "maps,marker,geocoding")
    url.searchParams.set("callback", callbackName)
    script.src = url.toString()
    script.async = true
    script.dataset.businessNotesMap = "true"
    script.onerror = () => finish(new Error("Maps could not connect"))
    document.head.appendChild(script)
  }).catch(error => { mapsPromise = null; throw error })
  return mapsPromise
}

const mapsUrl = address => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
const locationKey = address => address.trim().replace(/\s+/g, " ").toLocaleLowerCase()
const when = item => [item.date, item.time, item.time && item.timeZone].filter(Boolean).join(" · ")

function infoContent(group, resolved, onSelect) {
  const wrapper = document.createElement("div")
  wrapper.className = styles.infoWindow
  const heading = document.createElement("h3")
  heading.textContent = resolved.formattedAddress || group.address
  wrapper.appendChild(heading)
  if (resolved.approximate) {
    const note = document.createElement("p")
    note.textContent = "Approximate area"
    wrapper.appendChild(note)
  }
  for (const item of group.items) {
    const section = document.createElement("section")
    const title = document.createElement("button")
    title.type = "button"
    title.textContent = item.title || "Business note"
    title.addEventListener("click", () => onSelect(item.id))
    section.appendChild(title)
    if (when(item)) {
      const date = document.createElement("p")
      date.textContent = when(item)
      section.appendChild(date)
    }
    if (item.details) {
      const description = document.createElement("p")
      description.textContent = String(item.details).slice(0, 500)
      section.appendChild(description)
    }
    wrapper.appendChild(section)
  }
  const link = document.createElement("a")
  link.href = mapsUrl(group.address)
  link.target = "_blank"
  link.rel = "noopener noreferrer"
  link.textContent = "Open in Google Maps"
  wrapper.appendChild(link)
  return wrapper
}

export default function BusinessNotesMap({ items = [], selectedId = null, onSelect = () => {} }) {
  const locatedItems = useMemo(() => items.filter(item => typeof item.location === "string" && item.location.trim()), [items])
  const groups = useMemo(() => {
    const grouped = new Map()
    for (const item of locatedItems) {
      const key = locationKey(item.location)
      if (!grouped.has(key)) grouped.set(key, { key, address: item.location.trim(), items: [] })
      grouped.get(key).items.push(item)
    }
    return [...grouped.values()]
  }, [locatedItems])
  const [status, setStatus] = useState(API_KEY ? "loading" : "unavailable")
  const [api, setApi] = useState(null)
  const [locations, setLocations] = useState({})
  const canvas = useRef(null), map = useRef(null), info = useRef(null)
  const pins = useRef(new Map()), geocoding = useRef(new Map())
  const selectRef = useRef(onSelect), selectedRef = useRef(selectedId)
  selectRef.current = onSelect
  selectedRef.current = selectedId

  useEffect(() => {
    if (!API_KEY || !groups.length) return undefined
    let cancelled = false, authorizationFailed = false
    const stopObserving = observeAuthorizationFailure(() => {
      authorizationFailed = true
      if (!cancelled) setStatus("failed")
    })
    setStatus("loading")
    loadMaps().then(maps => {
      if (!cancelled && !authorizationFailed) { setApi(maps); setStatus("ready") }
    }).catch(() => { if (!cancelled) setStatus("failed") })
    return () => { cancelled = true; stopObserving() }
  }, [Boolean(groups.length)])

  useEffect(() => {
    if (!api || status !== "ready" || !canvas.current || !groups.length) return undefined
    try {
      map.current = new api.Map(canvas.current, {
        center: { lat: 25, lng: 0 }, zoom: 2, mapId: MAP_ID,
        gestureHandling: "cooperative", mapTypeControl: false, streetViewControl: false,
      })
      info.current = new api.InfoWindow({ maxWidth: 330 })
    } catch {
      if (map.current) api.event.clearInstanceListeners(map.current)
      map.current = null
      setStatus("failed")
      return undefined
    }
    return () => {
      info.current?.close()
      for (const pin of pins.current.values()) { pin.listener?.remove(); pin.marker.map = null }
      pins.current.clear()
      if (map.current) api.event.clearInstanceListeners(map.current)
      info.current = null
      map.current = null
    }
  }, [api, status, Boolean(groups.length)])

  useEffect(() => {
    if (!api || status !== "ready" || !groups.length) return undefined
    let cancelled = false
    const geocoder = new api.Geocoder()
    let next = 0
    const work = async () => {
      while (next < groups.length && !cancelled) {
        const group = groups[next++]
        if (!geocoding.current.has(group.key)) geocoding.current.set(group.key, resolveAddress(geocoder, group.address))
        const resolved = await geocoding.current.get(group.key)
        if (!cancelled) setLocations(current => current[group.key] === resolved ? current : ({ ...current, [group.key]: resolved }))
      }
    }
    void Promise.all([work(), work()])
    return () => { cancelled = true }
  }, [api, status, groups])

  useEffect(() => {
    if (!api || !map.current || status !== "ready") return undefined
    for (const pin of pins.current.values()) { pin.listener?.remove(); pin.marker.map = null }
    pins.current.clear()
    const bounds = new api.LatLngBounds()
    for (const group of groups) {
      const resolved = locations[group.key]
      if (resolved?.status !== "resolved") continue
      const marker = new api.marker.AdvancedMarkerElement({
        map: map.current, position: resolved.position, gmpClickable: true,
        title: `${group.address}: ${group.items.map(item => item.title || "Business note").join(", ")}`,
      })
      const open = () => {
        if (!info.current || !map.current) return
        info.current.setContent(infoContent(group, resolved, id => selectRef.current(id)))
        info.current.open({ map: map.current, anchor: marker, shouldFocus: false })
      }
      const handleClick = () => {
        const selected = group.items.find(item => item.id === selectedRef.current) || group.items[0]
        selectRef.current(selected.id)
        open()
      }
      marker.addEventListener("gmp-click", handleClick)
      const listener = { remove: () => marker.removeEventListener("gmp-click", handleClick) }
      pins.current.set(group.key, { marker, listener, open })
      bounds.extend(resolved.position)
    }
    let zoomListener = null
    if (pins.current.size) {
      map.current.fitBounds(bounds, 48)
      zoomListener = api.event.addListenerOnce(map.current, "idle", () => {
        if (map.current?.getZoom() > 16) map.current.setZoom(16)
      })
    }
    const selected = groups.find(group => group.items.some(item => item.id === selectedRef.current))
    if (selected) pins.current.get(selected.key)?.open()
    return () => { zoomListener?.remove() }
  }, [api, status, groups, locations])

  useEffect(() => {
    const group = groups.find(entry => entry.items.some(item => item.id === selectedId))
    const pin = group && pins.current.get(group.key)
    if (pin) { map.current?.panTo(locations[group.key].position); pin.open() }
    else info.current?.close()
  }, [selectedId, groups, locations])

  if (!locatedItems.length) return <div className={styles.empty}><strong>No locations yet</strong><p>Include a place or address in a note to see it here.</p></div>

  const mappedCount = groups.filter(group => locations[group.key]?.status === "resolved").length
  return <section className={styles.workspace} aria-label="Locations from business notes">
    {API_KEY && <div className={styles.frame}>
      <div ref={canvas} className={styles.canvas} role="region" aria-label="Google Map of locations mentioned in notes" />
      {status !== "ready" && <div className={styles.overlay} role="status">{status === "failed" ? "The map could not load. You can still open the addresses below in Google Maps." : "Loading your map…"}</div>}
    </div>}
    {!API_KEY && <p className={styles.notice} role="status">Add a Google Maps key to show locations here. You can still open each address below in Google Maps.</p>}
    {status === "ready" && <p className={styles.caption} aria-live="polite">{mappedCount} mapped {mappedCount === 1 ? "location" : "locations"}. Only notes with a location appear here.</p>}
    <ul className={styles.list}>
      {locatedItems.map(item => {
        const location = locations[locationKey(item.location)]
        return <li key={item.id} className={selectedId === item.id ? styles.selected : undefined}>
          <div className={styles.entry}>
            <button type="button" className={styles.title} onClick={() => onSelect(item.id)} aria-pressed={selectedId === item.id}>{item.title || "Business note"}</button>
            <span className={styles.address}>{item.location}</span>
            {when(item) && <span className={styles.when}>{when(item)}</span>}
            {status === "ready" && location?.status === "ambiguous" && <span className={styles.unplaced}>Add a more specific address to place a pin.</span>}
            {status === "ready" && location?.status === "unresolved" && <span className={styles.unplaced}>This address could not be placed on the map.</span>}
            {status === "ready" && location?.approximate && <span className={styles.when}>Approximate area</span>}
          </div>
          <a className={styles.link} href={mapsUrl(item.location)} target="_blank" rel="noopener noreferrer">Google Maps <span aria-hidden="true">↗</span><span className={styles.srOnly}> for {item.location} (opens in a new tab)</span></a>
        </li>
      })}
    </ul>
  </section>
}
