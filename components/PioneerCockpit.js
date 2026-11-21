import SiteLink from "./SiteLink"
import React, { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { Box, CircularProgress, IconButton, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material"
import ViewInArRoundedIcon from "@mui/icons-material/ViewInArRounded"
import StorageRoundedIcon from "@mui/icons-material/StorageRounded"
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded"
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded"
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded"
import PauseRoundedIcon from "@mui/icons-material/PauseRounded"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { createPioneerCockpit, COCKPIT_STATIONS } from "./space/pioneerCockpit"
import { createPlanetSurface } from "./MoonMesh"
import { disposeModel, preloadCrewModels } from "./space/crewAssets"
import { CREWS, SHIP_ROOT } from "./space/flightCrews"
import { createCockpitArrival } from "./space/cockpitArrival"
import { cockpitFonts } from "./CockpitStationPanel"
import { useRouter } from "next/router"
import { cockpitReducer, createCockpitSystems, exportCockpitData, hardwareActionEnabled, HARDWARE_ACTIONS, HARDWARE_LABELS } from "../lib/cockpitSystems"

const ICONS = { data: StorageRoundedIcon, finance: AccountBalanceWalletRoundedIcon, ai: AutoAwesomeRoundedIcon }
const clamp = THREE.MathUtils.clamp

const JUPITER = { id: "jupiter", position: [-5, 8.3, -42], scale: 4 }

export default function PioneerCockpit({ crewId = "eva", description }) {
  const mountRef = useRef(null), viewerRef = useRef(null), containerRef = useRef(null)
  const [systems, dispatch] = useReducer(cockpitReducer, undefined, createCockpitSystems)
  const systemsRef = useRef(systems), requestRef = useRef(null), actionRef = useRef(null)
  systemsRef.current = systems
  const [status, setStatus] = useState("loading")
  const [station, setStation] = useState("overview")
  const [paused, setPaused] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const router = useRouter()
  const stopRequest = () => {
    requestRef.current?.abort(); requestRef.current = null
  }
  const onAction = async (id, type, value) => {
    if (!hardwareActionEnabled(systemsRef.current, id, type)) return
    if (type === "export") {
      const file = exportCockpitData(systemsRef.current, id)
      if (!file.text) return
      const url = URL.createObjectURL(new Blob([file.text], { type: `${file.type};charset=utf-8` }))
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = file.name
      containerRef.current.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
      return
    }
    if (id === "data" && type === "sync") { refreshTraffic(); return }
    dispatch({ station: id, type, value })
  }
  const refreshTraffic = useCallback(async () => {
    if (requestRef.current) return
    const controller = new AbortController(); requestRef.current = controller
    dispatch({ station: "data", type: "loading" })
    const timeout = setTimeout(() => controller.abort(), 30000)
    try {
      const response = await fetch("/api/analytics/website-traffic", { signal: controller.signal })
      const report = await response.json()
      if (!response.ok) throw new Error(report.error || "Website traffic is unavailable.")
      if (!Array.isArray(report.rows)) throw new Error("Website traffic report is invalid.")
      if (!controller.signal.aborted) dispatch({ station: "data", type: "result", value: report })
    } catch (error) {
      if (requestRef.current === controller) dispatch({ station: "data", type: "error", value: controller.signal.aborted ? "Website traffic request timed out. Please refresh to try again." : error.message })
    } finally { clearTimeout(timeout); if (requestRef.current === controller) requestRef.current = null }
  }, [])
  useEffect(() => { refreshTraffic(); return () => stopRequest() }, [refreshTraffic])

  actionRef.current = onAction
  useEffect(() => { viewerRef.current?.setSystems(systems) }, [systems])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const controller = new AbortController()
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000)
    const camera = new THREE.PerspectiveCamera(58, 1, .06, 220)
    camera.rotation.order = "YXZ"
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    let renderer, model, arrival, environment, resizeObserver, visibilityObserver
    const crew = CREWS.find(entry => entry.id === crewId) || CREWS[0]
    const planets = new Map()
    let disposed = false, ready = false, visible = false, frame = 0, lastFrame = 0, elapsed = 0
    let playing = !motionQuery.matches, transition = null, drag = null, selected = "overview"
    let baseYaw = 0, basePitch = 0
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2()
    setStatus("loading"); setPaused(!playing); setStation("overview")
    mount.dataset.crew = crew.id; mount.dataset.ship = crew.ship
    mount.dataset.arrival = "loading"

    const draw = () => {
      if (!disposed && ready && visible && !document.hidden) {
        if (arrival) arrival.render()
        else renderer.render(scene, camera)
        const viewCamera = arrival?.active ? arrival.camera : camera
        mount.dataset.arrival = arrival?.active ? "entering" : "inside"
        mount.dataset.arrivalProgress = (arrival?.progress ?? 1).toFixed(4)
        mount.dataset.arrivalBlend = (arrival?.active ? arrival.blend : 1).toFixed(4)
        mount.dataset.frame = String(Number(mount.dataset.frame || 0) + 1)
        mount.dataset.time = elapsed.toFixed(3)
        mount.dataset.yaw = camera.rotation.y.toFixed(3)
        mount.dataset.pitch = camera.rotation.x.toFixed(3)
        mount.dataset.drawCalls = String(renderer.info.render.calls)
        mount.dataset.triangles = String(renderer.info.render.triangles)
        mount.dataset.camera = JSON.stringify({ position: viewCamera.position.toArray(), quaternion: viewCamera.quaternion.toArray(), fov: viewCamera.fov, aspect: viewCamera.aspect })
      }
    }
    const applyTransition = now => {
      if (!transition) return
      const t = clamp((now - transition.start) / 800, 0, 1), ease = t * t * (3 - 2 * t)
      camera.position.lerpVectors(transition.fromPosition, transition.toPosition, ease)
      camera.quaternion.slerpQuaternions(transition.fromRotation, transition.toRotation, ease)
      camera.fov = THREE.MathUtils.lerp(transition.fromFov, transition.toFov, ease)
      camera.updateProjectionMatrix()
      if (t === 1) { transition = null; baseYaw = camera.rotation.y; basePitch = camera.rotation.x }
    }
    const tick = now => {
      frame = 0
      if (disposed || !ready || !visible || document.hidden) return
      if (!lastFrame || now - lastFrame >= 1000 / 30) {
        const dt = lastFrame ? Math.min((now - lastFrame) / 1000, .25) : 0
        lastFrame = now
        if (playing) {
          elapsed += dt; model.update(elapsed)
          arrival?.update(dt)
          planets.forEach(planet => {
            planet.mesh.rotation.y = elapsed * .055
            planet.group.position.x = JUPITER.position[0] + Math.sin(elapsed * .065) * .65
            planet.group.position.y = JUPITER.position[1] + Math.sin(elapsed * .045) * .16
          })
          mount.dataset.jupiterRotation = (elapsed * .055).toFixed(5)
          mount.dataset.starDrift = model.sky.rotation.y.toFixed(5)
        }
        applyTransition(now); draw()
      }
      if (playing || transition) frame = requestAnimationFrame(tick)
    }
    const resume = () => {
      cancelAnimationFrame(frame); frame = 0; lastFrame = 0
      mount.dataset.motion = playing ? "playing" : "paused"
      draw()
      if (!disposed && ready && visible && !document.hidden && (playing || transition)) frame = requestAnimationFrame(tick)
    }
    const focus = (id, immediate = false, preserveArrival = false) => {
      if (!model || !renderer) return
      const entering = arrival?.active
      if (!preserveArrival) arrival?.skip()
      selected = id; setStation(id); mount.dataset.station = id
      const target = new THREE.Vector3(), position = new THREE.Vector3()
      let fov
      if (id === "overview") {
        position.set(0, 2.85, camera.aspect < .9 ? 3.45 : 4.1)
        target.set(0, 1.30, -3.1); fov = camera.aspect < .9 ? 68 : 62
      } else {
        const view = model.stations[id]
        const distance = Math.max(3.55, 3.3 / (2 * Math.tan(THREE.MathUtils.degToRad(25)) * camera.aspect))
        target.copy(view.center); target.y -= .12
        position.copy(view.center).addScaledVector(view.normal, distance)
        position.y += .18; fov = 50
      }
      const endCamera = new THREE.PerspectiveCamera(); endCamera.position.copy(position); endCamera.lookAt(target)
      if (immediate || motionQuery.matches || entering) {
        transition = null; camera.position.copy(position); camera.quaternion.copy(endCamera.quaternion)
        camera.fov = fov; camera.updateProjectionMatrix()
        baseYaw = camera.rotation.y; basePitch = camera.rotation.x
      } else {
        transition = { start: performance.now(), fromPosition: camera.position.clone(), toPosition: position,
          fromRotation: camera.quaternion.clone(), toRotation: endCamera.quaternion.clone(), fromFov: camera.fov, toFov: fov }
      }
      resume()
    }
    const resize = () => {
      if (!renderer || disposed) return
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false); camera.aspect = width / height
      camera.updateProjectionMatrix()
      focus(selected, arrival?.active || !transition, true)
      arrival?.resize(); draw()
    }
    const fail = () => {
      if (disposed) return
      ready = false; transition = null; viewerRef.current = null
      cancelAnimationFrame(frame); setStatus("error")
    }
    const onContextLost = event => { event.preventDefault(); fail() }
    const onMotionChange = event => {
      if (event.matches) {
        playing = false; setPaused(true)
        if (transition || arrival?.active) focus(selected, true)
        resume()
      }
    }
    const pick = event => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
      return raycaster.intersectObjects(model.hitTargets, false)[0]
    }
    const onPointerDown = event => {
      if (!ready || arrival?.active || event.button !== 0 || drag) return
      transition = null; baseYaw = camera.rotation.y; basePitch = camera.rotation.x
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: baseYaw, pitch: basePitch, distance: 0 }
      renderer.domElement.setPointerCapture(event.pointerId)
      renderer.domElement.style.cursor = "grabbing"
    }
    const onPointerMove = event => {
      if (!ready || arrival?.active) return
      if (!drag) {
        const hit = pick(event), id = hit?.object.userData.station
        const index = hit?.object.userData.action ? HARDWARE_ACTIONS[id].indexOf(hit.object.userData.action)
          : id === "data" && hit?.object.userData.screen && hit.uv.y < .115 ? Math.min(3, Math.floor(hit.uv.x * 4)) : -1
        const switching = id && id !== selected
        const enabled = switching || index < 0 || hardwareActionEnabled(systemsRef.current, id, HARDWARE_ACTIONS[id][index])
        renderer.domElement.style.cursor = !enabled ? "default" : hit || selected !== "overview" ? "pointer" : "grab"
        renderer.domElement.title = switching && selected !== "overview" ? `Open ${id} dashboard` : hit?.object.userData.link ? `View ${id} Components` : selected === "overview" && id ? `Open ${id} dashboard` : id === selected && index >= 0
          ? `${id} / ${HARDWARE_LABELS[id][index]}` : selected !== "overview" && id !== selected ? "Cockpit overview" : ""
        return
      }
      if (event.pointerId !== drag.id) return
      const x = event.clientX - drag.x, y = event.clientY - drag.y
      drag.distance = Math.max(drag.distance, Math.hypot(x, y))
      // A seated, bounded look direction never orbits through the console or hull.
      camera.rotation.y = clamp(drag.yaw + x * .0025, -.9, .9)
      camera.rotation.x = clamp(drag.pitch + y * .0023, -.65, .42)
      camera.rotation.z = 0; draw()
    }
    const releasePointer = event => {
      if (!drag || event.pointerId !== drag.id) return
      const clicked = event.type === "pointerup" && drag.distance < 6
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId)
      drag = null; renderer.domElement.style.cursor = "grab"
      if (clicked) {
        const hit = pick(event), id = hit?.object.userData.station
        if (selected !== "overview" && id !== selected) { focus(id || "overview"); return }
        if (hit?.object.userData.link) { router.push(`/components#${id}-components`); return }
        if (!id) return
        if (selected === "overview") { focus(id); return }
        const action = hit.object.userData.action || (id === "data" && hit.object.userData.screen && hit.uv.y < .115
          ? HARDWARE_ACTIONS[id][Math.min(3, Math.floor(hit.uv.x * 4))] : null)
        if (action) actionRef.current?.(id, action)
      }
    }
    const onKeyDown = event => {
      if (!ready) return
      if (event.key === "Home" || event.key === "Escape") { event.preventDefault(); focus("overview"); return }
      if (arrival?.active) return
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return
      event.preventDefault(); transition = null
      camera.rotation.y = clamp(camera.rotation.y + (event.key === "ArrowLeft" ? .085 : event.key === "ArrowRight" ? -.085 : 0), -.9, .9)
      camera.rotation.x = clamp(camera.rotation.x + (event.key === "ArrowUp" ? .065 : event.key === "ArrowDown" ? -.065 : 0), -.65, .42)
      camera.rotation.z = 0; draw()
    }
    const onOutsideClick = event => {
      if (event.target.closest?.("[data-cockpit-menu]")) return
      if (ready && selected !== "overview" && !containerRef.current?.contains(event.target)) focus("overview")
    }
    const onEscape = event => { if (event.key === "Escape" && selected !== "overview" && containerRef.current?.contains(event.target)) focus("overview") }
    const initialize = async () => {
      try {
        preloadCrewModels([SHIP_ROOT + crew.missionSpacecraft], controller.signal)
        mount.dataset.loadStage = "renderer"
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.15 : 1.5))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.88
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
        const canvas = renderer.domElement
        canvas.tabIndex = 0; canvas.style.touchAction = "pan-y"
        canvas.setAttribute("role", "img")
        canvas.setAttribute("aria-label", `${crew.ship} flight deck: an orbital approach into interactive Data, Finance and AI dashboards overlooking a rotating Jupiter`)
        canvas.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown Home Escape")
        for (const [name, handler] of [["webglcontextlost", onContextLost], ["pointerdown", onPointerDown],
          ["pointermove", onPointerMove], ["pointerup", releasePointer], ["pointercancel", releasePointer], ["lostpointercapture", releasePointer], ["keydown", onKeyDown]]) canvas.addEventListener(name, handler)
        mount.appendChild(canvas)
        const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment()
        try { environment = pmrem.fromScene(room, .04) } finally { pmrem.dispose(); room.dispose() }
        scene.environment = environment.texture; scene.environmentIntensity = .45
        scene.add(new THREE.AmbientLight(0xb7c7d0, .55))
        const sun = new THREE.DirectionalLight(0xfff1d9, 3.2)
        sun.position.set(-12, 16, 12); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024)
        Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -3, near: 1, far: 45 })
        sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -.0005; sun.shadow.normalBias = .025
        scene.add(sun)
        const rim = new THREE.DirectionalLight(0x77c6ef, 1.5); rim.position.set(7, 3, -9); scene.add(rim)
        const bounce = new THREE.PointLight(0x8ed9f5, 12, 12, 2); bounce.position.set(0, 1.4, 1.3); scene.add(bounce)
        mount.dataset.loadStage = "fonts"
        await Promise.all([document.fonts.load('500 48px "Outfit"'), document.fonts.load('400 24px "Outfit"')])
        if (disposed) return
        model = createPioneerCockpit(systemsRef.current); scene.add(model.root, model.sky)
        mount.dataset.loadStage = "product-images"
        await model.ready
        if (disposed) return
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount)
        visibilityObserver = new IntersectionObserver(entries => {
          for (const entry of entries) {
            if (entry.target === mount) { visible = entry.isIntersecting; mount.dataset.visible = String(visible) }
            else if (containerRef.current) containerRef.current.dataset.workspaceVisible = String(entry.isIntersecting)
          }
          resume()
        }, { threshold: 0 })
        visibilityObserver.observe(mount)
        visibilityObserver.observe(containerRef.current)
        document.addEventListener("visibilitychange", resume); motionQuery.addEventListener("change", onMotionChange)
        document.addEventListener("click", onOutsideClick); document.addEventListener("keydown", onEscape)
        resize()
        for (const layout of [JUPITER]) {
          mount.dataset.loadStage = layout.id
          const planet = await createPlanetSurface(layout.id, renderer, controller.signal)
          if (disposed) { disposeModel(planet.group); return }
          planet.group.position.set(...layout.position); planet.group.scale.setScalar(layout.scale)
          planets.set(layout.id, planet); scene.add(planet.group)
        }
        // Both sides of the entrance must be fully lit before the first visible frame.
        mount.dataset.loadStage = "spacecraft"
        arrival = await createCockpitArrival({ renderer, scene, interior: model.root, camera, crew, signal: controller.signal })
        if (disposed) return
        model.setNavigation("Jupiter")
        mount.dataset.planetView = "jupiter"
        model.setSystems(systemsRef.current, elapsed)
        if (!playing || motionQuery.matches) arrival.skip()
        else arrival.start()
        // The cockpit and light sources are stationary; reuse their finished shadow map.
        renderer.shadowMap.autoUpdate = false
        ready = true; setStatus("ready")
        mount.dataset.loadStage = "ready"
        viewerRef.current = {
          focus,
          setSystems(value) { model.setSystems(value, elapsed); draw() },
          toggle() { playing = !playing; setPaused(!playing); resume() },
          reset() {
            focus("overview", true)
            if (!motionQuery.matches) { arrival.start(); playing = true; setPaused(false) }
            resume()
          },
        }
        resume()
      } catch (error) {
        if (!disposed) { console.error("Unable to render Pioneer cockpit", error); fail() }
      }
    }
    initialize()
    return () => {
      disposed = true; ready = false; controller.abort(); cancelAnimationFrame(frame); viewerRef.current = null
      resizeObserver?.disconnect(); visibilityObserver?.disconnect()
      document.removeEventListener("visibilitychange", resume); motionQuery.removeEventListener("change", onMotionChange)
      document.removeEventListener("click", onOutsideClick); document.removeEventListener("keydown", onEscape)
      for (const [name, handler] of [["webglcontextlost", onContextLost], ["pointerdown", onPointerDown],
        ["pointermove", onPointerMove], ["pointerup", releasePointer], ["pointercancel", releasePointer], ["lostpointercapture", releasePointer], ["keydown", onKeyDown]]) renderer?.domElement.removeEventListener(name, handler)
      scene.traverse(object => { if (object.isLight) object.shadow?.dispose() })
      arrival?.dispose(); disposeModel(scene); environment?.dispose(); renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove()
    }
  }, [attempt, crewId])

  const buttonStyle = { width: 40, height: 40, color: "#afc1c9", "&:hover": { color: "#fff", backgroundColor: "#192127" },
    "&.Mui-focusVisible": { outline: "2px solid #b0a0ec", outlineOffset: -2 } }
  return (
    <Box ref={containerRef} data-testid="pioneer-cockpit" data-status={status} data-selected-station={station}
      onClick={event => {
        if (!event.target.closest('[data-station-panel], [data-cockpit-surface], [data-cockpit-menu], button, a, input, textarea, label, [role="button"], [role="combobox"]')) viewerRef.current?.focus("overview")
      }} sx={{ ...cockpitFonts, width: "100%", minWidth: 0, px: { xs: 2.25, sm: 3, md: 4 }, bgcolor: "black" }}>
      <Box sx={{ pt: 3, display: "flex", gap: 2, alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0, flex: 1, textAlign: "left" }}>
          <Typography component="h2" sx={{ fontSize: { xs: 23, sm: 30 }, fontWeight: 500, lineHeight: 1.2, textAlign: "left", overflowWrap: "normal",
            display: "inline-block", maxWidth: "100%",
            color: "#b0a0ec" }}>Pioneer flight deck</Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Box component={SiteLink} href="/components" aria-label="Explore the component library" sx={{ color: "#becbd1", textDecoration: "none", display: "flex", alignItems: "center", gap: 1, flexShrink: 0,
            fontSize: 13, "&:hover": { color: "#fff" }, "&:focus-visible": { outline: "2px solid #b0a0ec" } }}>
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Component library</Box><ArrowForwardRoundedIcon fontSize="small" />
          </Box>
        </Box>
      </Box>
      {description && <Typography component="p" sx={{ mt: 1.25, maxWidth: 720,
        "&&": { fontFamily: theme => theme.typography.body1.fontFamily },
        color: "rgba(216, 229, 254, 0.84)", fontSize: { xs: 15.5, sm: 16.5, md: 17 }, lineHeight: 1.72,
        letterSpacing: 0, textAlign: "left" }}>{description}</Typography>}
      <Box data-cockpit-world sx={{ position: "relative", width: "100%", height: { xs: 560, sm: 620, md: 700, lg: 760 }, maxHeight: 920,
        my: { xs: 2.25, sm: 3, md: 4 }, borderRadius: "8px", overflow: "hidden", bgcolor: "#000000" }}>
        <Box ref={mountRef} data-cockpit-surface sx={{ width: "100%", height: "100%", opacity: status === "ready" ? 1 : 0,
          transition: "opacity 800ms ease", "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          "& canvas": { display: "block", width: "100%", height: "100%", cursor: "grab", outlineOffset: -3 },
          "& canvas:focus-visible": { outline: "2px solid #b0a0ec" } }} />
        {status === "loading" && <Box role="status" aria-label="Loading Pioneer cockpit" sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <CircularProgress size={24} thickness={2} sx={{ color: "#8da5b6", "@media (prefers-reduced-motion: reduce)": { animation: "none", "& circle": { animation: "none" } } }} />
        </Box>}
        {status === "error" && <Box role="alert" sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <Typography sx={{ color: "#aebdca", fontSize: 14 }}>The cockpit could not load.</Typography>
          <Tooltip title="Retry cockpit"><IconButton aria-label="Retry cockpit" onClick={() => setAttempt(value => value + 1)} sx={buttonStyle}><RefreshRoundedIcon /></IconButton></Tooltip>
        </Box>}
      </Box>
      <Box data-cockpit-controls sx={{ pr: { xs: 6, sm: 4, md: 2 }, py: 1.4, minHeight: 66,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
        <ToggleButtonGroup value={station} exclusive onChange={(_, value) => value && viewerRef.current?.focus(value)} aria-label="Cockpit dashboard view"
          sx={{ "& .MuiToggleButton-root": { border: 0, borderRadius: "4px !important", color: "#91a4b0", textTransform: "none", fontSize: 13, height: 40,
            minWidth: { xs: 40, sm: 70 }, px: { xs: 1, sm: 1.6 }, gap: .8 },
          "& .MuiToggleButton-root.Mui-selected": { color: "#d6c9ff", backgroundColor: "#211c2e" },
          "& .MuiToggleButton-root.Mui-focusVisible": { outline: "2px solid #b0a0ec", outlineOffset: -2 } }}>
          <ToggleButton value="overview" aria-label="Full cockpit view" disabled={status !== "ready"}><Tooltip title="Full cockpit"><ViewInArRoundedIcon fontSize="small" /></Tooltip></ToggleButton>
          {COCKPIT_STATIONS.map(item => { const Icon = ICONS[item.id]; return (
            <ToggleButton key={item.id} value={item.id} aria-label={`${item.label} dashboard view`} disabled={status !== "ready"}>
              <Icon sx={{ fontSize: 17, color: item.color, display: { xs: "none", sm: "block" } }} />{item.label}
            </ToggleButton>
          ) })}
        </ToggleButtonGroup>
        <Box sx={{ display: "flex", alignItems: "center", gap: .25 }}>
          <Tooltip title={paused ? "Play flight deck" : "Pause flight deck"}>
            <span><IconButton aria-label={paused ? "Play cockpit animation" : "Pause cockpit animation"} disabled={status !== "ready"} onClick={() => viewerRef.current?.toggle()} sx={buttonStyle}>
              {paused ? <PlayArrowRoundedIcon fontSize="small" /> : <PauseRoundedIcon fontSize="small" />}
            </IconButton></span>
          </Tooltip>
          <Tooltip title="Replay cockpit arrival"><span><IconButton aria-label="Replay cockpit arrival" disabled={status !== "ready"} onClick={() => viewerRef.current?.reset()} sx={buttonStyle}><RestartAltRoundedIcon fontSize="small" /></IconButton></span></Tooltip>
        </Box>
      </Box>
    </Box>
  )
}
