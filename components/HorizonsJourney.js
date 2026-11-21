import React, { useEffect, useRef, useState } from "react"
import { Box, CircularProgress, IconButton, Slider, Tab, Tabs, Tooltip, Typography } from "@mui/material"
import PauseRoundedIcon from "@mui/icons-material/PauseRounded"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import * as THREE from "three"
import { createExpeditionStars } from "./space/expeditionStars"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { createPlanetSurface } from "./MoonMesh"
import { ASSET_ROOT, SHIP_ROOT, CREWS } from "./space/flightCrews"
import { delay, disposeModel, loadCrew, preloadCrewModels, renderOffscreen, warmScene } from "./space/crewAssets"
import { createHorizonsJourney, JOURNEY_DURATION, JOURNEY_STOPS, journeyPhase } from "./space/horizonsJourney"

const timestamp = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`

export default function HorizonsJourney({ crewId }) {
  const crew = CREWS.find(item => item.id === crewId) || CREWS[0]
  const selectionRef = useRef(crew)
  selectionRef.current = crew
  const mountRef = useRef(null), viewerRef = useRef(null)
  const [status, setStatus] = useState("loading")
  const [paused, setPaused] = useState(false)
  const [state, setState] = useState({ ...journeyPhase(0), time: 0 })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const request = new AbortController()
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, .05, 280)
    const planets = new Map()
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    let disposed = false, visible = false, ready = false, playing = !motionQuery.matches
    let manuallyPaused = false, scrubWasPlaying = null
    let frame = 0, lastFrame = 0, elapsed = 0, lastReport = -1, generation = 0
    let renderer, environment, journey, resizeObserver, observer, crewRequest, sun, rim, bounce
    let currentState = null, aspect = 1
    setStatus("loading"); setPaused(!playing); setState({ ...journeyPhase(0), time: 0 })

    const report = (force = false) => {
      if (!currentState) return
      const { phase, planet, time, gear, canopy, pilotVisible, shipPosition, pilotPosition } = currentState
      Object.assign(mount.dataset, { journeyTime: time.toFixed(3), journeyPhase: phase, journeyPlanet: planet,
        gearDeployment: gear.toFixed(4), canopyOpening: canopy.toFixed(4), pilotVisible: String(pilotVisible),
        shipPosition: shipPosition.map(value => value.toFixed(4)).join(","), pilotPosition: pilotPosition.map(value => value.toFixed(4)).join(",") })
      if (force || Math.abs(elapsed - lastReport) >= .18) {
        lastReport = elapsed
        setState({ phase, planet, time, label: currentState.label })
      }
    }
    const pose = () => {
      if (!journey) return
      currentState = journey.poseAt(elapsed)
      const { focus, halfHeight, viewWidth, depth } = currentState
      const height = Math.max(halfHeight, viewWidth / (2 * aspect))
      const distance = height / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) + depth
      camera.position.copy(focus).add(new THREE.Vector3(.2, .35, distance))
      camera.lookAt(focus)
      sun.position.copy(focus).add(new THREE.Vector3(-6, 5, 7))
      sun.target.position.copy(focus); sun.target.updateMatrixWorld()
      rim.position.copy(focus).add(new THREE.Vector3(5, 2, -5)); rim.target.position.copy(focus); rim.target.updateMatrixWorld()
      bounce.position.copy(focus).add(new THREE.Vector3(0, -4, 5)); bounce.target.position.copy(focus); bounce.target.updateMatrixWorld()
      planets.forEach((planet, id) => { if (id !== "earth" && id !== "mars") planet.mesh.rotation.y = elapsed * .027 })
      report()
    }
    const draw = () => {
      if (!disposed && ready && visible && !document.hidden) {
        renderer.render(scene, camera)
        mount.dataset.frame = String(Number(mount.dataset.frame || 0) + 1)
      }
    }
    const tick = now => {
      frame = 0
      if (!ready || !playing || !visible || document.hidden || disposed) return
      if (!lastFrame || now - lastFrame >= 1000 / 30) {
        elapsed = Math.min(JOURNEY_DURATION, elapsed + (lastFrame ? Math.min((now - lastFrame) / 1000, .12) : 0))
        lastFrame = now; pose(); draw()
        if (elapsed >= JOURNEY_DURATION) { playing = false; mount.dataset.playing = "false"; setPaused(true); report(true); return }
      }
      frame = requestAnimationFrame(tick)
    }
    const resume = () => {
      cancelAnimationFrame(frame); frame = 0; lastFrame = 0
      mount.dataset.playing = String(playing)
      draw()
      if (!disposed && ready && playing && visible && !document.hidden) frame = requestAnimationFrame(tick)
    }
    const setPlaying = value => { playing = value; setPaused(!value); resume() }
    const resize = () => {
      if (!renderer || disposed) return
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      aspect = width / height
      renderer.setSize(width, height, false); camera.aspect = aspect; camera.updateProjectionMatrix()
      pose(); draw()
    }
    const fail = error => {
      if (disposed) return
      ready = false; cancelAnimationFrame(frame); setStatus("error")
      console.error("Horizons journey unavailable:", error)
    }
    const contextLost = event => { event.preventDefault(); fail(new Error("WebGL context lost")) }
    const motionChanged = event => { setPlaying(!event.matches && !manuallyPaused && elapsed < JOURNEY_DURATION) }
    const releaseJourney = () => {
      if (!journey) return
      scene.remove(journey.root); journey.stop(); disposeModel(journey.root); journey = null
    }
    const select = async entry => {
      const ownGeneration = ++generation
      crewRequest?.abort(); crewRequest = new AbortController()
      const { signal } = crewRequest
      ready = false; setStatus("loading"); cancelAnimationFrame(frame)
      let pending = null, next = null
      try {
        await delay(journey && !motionQuery.matches ? 360 : 0, signal)
        signal.throwIfAborted()
        pending = await loadCrew({ ...entry, asset: entry.missionAsset, spacecraft: entry.missionSpacecraft }, signal)
        next = createHorizonsJourney({ ...pending, entry, planets })
        await renderer.compileAsync(next.root, camera, scene)
        signal.throwIfAborted()
        releaseJourney(); journey = next; next = null; pending = null
        elapsed = 0; lastReport = -1; scrubWasPlaying = null
        playing = !manuallyPaused && !motionQuery.matches; setPaused(!playing)
        scene.add(journey.root)
        pose()
        renderOffscreen(renderer, scene, camera)
        renderer.render(scene, camera)
        mount.dataset.renderedCrew = entry.id
        report(true); ready = true; setStatus("ready"); resume()
      } catch (error) {
        next?.stop()
        if (next) disposeModel(next.root)
        else if (pending) { disposeModel(pending.astronaut.scene); disposeModel(pending.spacecraft.scene) }
        if (disposed || signal.aborted || ownGeneration !== generation) return
        fail(error)
      }
    }
    async function initialize() {
      try {
        const entry = selectionRef.current
        preloadCrewModels([ASSET_ROOT + entry.missionAsset, SHIP_ROOT + entry.missionSpacecraft], request.signal)
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.15 : 1.4))
        renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = .8
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.domElement.setAttribute("role", "img")
        renderer.domElement.setAttribute("aria-label", "Selected astronaut boards on Earth and pilots their spacecraft to Mars, Jupiter, Saturn, Uranus, and Neptune")
        renderer.domElement.addEventListener("webglcontextlost", contextLost)
        mount.appendChild(renderer.domElement)
        const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment()
        try { environment = pmrem.fromScene(room, .04) } finally { room.dispose(); pmrem.dispose() }
        scene.environment = environment.texture; scene.environmentIntensity = .14
        scene.add(new THREE.AmbientLight(0x8fa7c8, .28))
        sun = new THREE.DirectionalLight(0xffefd6, 3.5)
        const shadowSize = window.innerWidth < 700 ? 1024 : 2048
        sun.castShadow = true; sun.shadow.mapSize.set(shadowSize, shadowSize)
        Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: .1, far: 25 })
        sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -.0003; sun.shadow.normalBias = .008
        rim = new THREE.DirectionalLight(0x67cfff, 1.15)
        bounce = new THREE.DirectionalLight(0x9683ea, .24)
        scene.add(sun, sun.target, rim, rim.target, bounce, bounce.target)
        scene.add(createExpeditionStars({ journey: true }))
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount)
        observer = new IntersectionObserver(entries => {
          const wasVisible = visible
          visible = entries[entries.length - 1].isIntersecting
          mount.dataset.visible = String(visible)
          // Returning to a finished journey starts a new flight, but never overrides a user's pause.
          if (visible && !wasVisible && elapsed >= JOURNEY_DURATION && !manuallyPaused && !motionQuery.matches) {
            elapsed = 0; playing = true; setPaused(false); pose(); report(true)
          }
          resume()
        }, { threshold: 0 })
        observer.observe(mount)
        document.addEventListener("visibilitychange", resume)
        motionQuery.addEventListener("change", motionChanged)
        resize()
        const results = await Promise.allSettled(JOURNEY_STOPS.map(async stop => {
          const planet = await createPlanetSurface(stop.id, renderer, request.signal)
          if (disposed) { disposeModel(planet.group); return }
          planet.group.position.set(...stop.position); planet.group.scale.setScalar(stop.scale)
          planet.mesh.receiveShadow = stop.id === "earth" || stop.id === "mars"
          scene.add(planet.group); planets.set(stop.id, planet)
        }))
        request.signal.throwIfAborted()
        const failed = results.find(result => result.status === "rejected")
        if (failed) throw failed.reason
        await warmScene(renderer, scene, camera)
        if (disposed) return
        viewerRef.current = {
          select,
          toggle() {
            if (elapsed >= JOURNEY_DURATION) { elapsed = 0; pose(); report(true) }
            manuallyPaused = playing; setPlaying(!playing)
          },
          seek(time, scrub = false) {
            if (scrub && scrubWasPlaying === null) scrubWasPlaying = playing
            elapsed = clampTime(time); pose(); report(true)
            if (scrub) setPlaying(false)
            else setPlaying(!manuallyPaused && !motionQuery.matches)
          },
          finishSeek() {
            if (scrubWasPlaying === null) return
            const shouldResume = scrubWasPlaying && !motionQuery.matches
            scrubWasPlaying = null; setPlaying(shouldResume)
          },
          replay() { manuallyPaused = false; elapsed = 0; pose(); report(true); setPlaying(!motionQuery.matches) },
        }
        await select(selectionRef.current)
      } catch (error) { if (!disposed && !request.signal.aborted) fail(error) }
    }
    initialize()
    return () => {
      disposed = true; ready = false; generation++; request.abort(); crewRequest?.abort(); viewerRef.current = null
      cancelAnimationFrame(frame); resizeObserver?.disconnect(); observer?.disconnect()
      document.removeEventListener("visibilitychange", resume); motionQuery.removeEventListener("change", motionChanged)
      renderer?.domElement.removeEventListener("webglcontextlost", contextLost)
      releaseJourney()
      scene.traverse(object => { if (object.isLight) object.shadow?.dispose() })
      disposeModel(scene); planets.clear(); environment?.dispose()
      renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove()
    }
  }, [attempt])

  useEffect(() => { viewerRef.current?.select(crew) }, [crew])
  const active = JOURNEY_STOPS.findIndex(stop => stop.id === state.planet)
  const buttonStyle = { color: "#d8e5fe", width: 40, height: 40, "&.Mui-disabled": { color: "#576371" } }
  return <Box data-testid="horizons-journey" data-status={status} data-crew={crew.id} sx={{ width: "100%", minWidth: 0 }}>
    <Box sx={{ position: "relative" }}>
      <Box ref={mountRef} sx={{ height: { xs: 440, sm: 540, md: 600 }, width: "100%", opacity: status === "ready" ? 1 : 0,
        transition: "opacity 450ms ease", touchAction: "pan-y", "& canvas": { display: "block", width: "100%", height: "100%" },
        "@media (prefers-reduced-motion: reduce)": { transition: "none" } }} />
      {status === "loading" && <Box role="status" aria-label="Loading solar-system journey" sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <CircularProgress size={24} thickness={2} sx={{ color: "#87adcd", "@media (prefers-reduced-motion: reduce)": { animation: "none", "& circle": { animation: "none" } } }} />
      </Box>}
      {status === "error" && <Box role="alert" sx={{ position: "absolute", inset: 0, display: "flex", gap: 1, alignItems: "center", justifyContent: "center" }}>
        <Typography sx={{ color: "#c3d1df", fontSize: 14 }}>Journey unavailable</Typography>
        <Tooltip title="Retry journey"><IconButton aria-label="Retry journey" onClick={() => setAttempt(value => value + 1)} sx={buttonStyle}><RefreshRoundedIcon /></IconButton></Tooltip>
      </Box>}
    </Box>
    <Box sx={{ maxWidth: 880, mx: "auto", px: { xs: 1, sm: 2 }, minWidth: 0 }}>
      <Tabs value={active} onChange={(_, value) => viewerRef.current?.seek(JOURNEY_STOPS[value].time)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
        aria-label="Journey destinations" sx={{ minHeight: 42, borderBottom: "1px solid rgba(216,229,254,.15)",
          "& .MuiTabs-flexContainer": { justifyContent: { sm: "center" } }, "& .MuiTabs-indicator": { backgroundColor: "#b0a0ec" }, "& .MuiTabs-scrollButtons": { color: "#c6b8ef" } }}>
        {JOURNEY_STOPS.map(stop => <Tab key={stop.id} label={stop.label} disabled={status !== "ready"} sx={{ color: "#98a9ba", fontSize: 13,
          textTransform: "none", minWidth: { xs: 73, sm: 94 }, minHeight: 44, px: 1.5, "&.Mui-selected": { color: "#d6c9ff" } }} />)}
      </Tabs>
      <Slider aria-label="Journey progress" min={0} max={JOURNEY_DURATION} step={.1} value={state.time}
        getAriaValueText={value => `${timestamp(value)}, ${journeyPhase(value).label}`} disabled={status !== "ready"}
        onChange={(_, value) => viewerRef.current?.seek(value, true)} onChangeCommitted={() => viewerRef.current?.finishSeek()}
        sx={{ display: "block", width: "calc(100% - 24px)", mx: "auto", color: "#b0a0ec", height: 2,
          mt: 1, mb: 0, "& .MuiSlider-thumb": { width: 10, height: 10 } }} />
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", columnGap: 1, rowGap: .5, minHeight: 60 }}>
        <Box sx={{ minWidth: 0, flex: "1 1 170px" }}>
          <Typography sx={{ color: "#d6e4f3", fontSize: 13 }}>{state.label || "Earth / Boarding"}</Typography>
          <Typography sx={{ color: "#8fa4b7", fontSize: 12, mt: .3 }}>{crew.name} / {crew.ship}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: .25 }}>
          <Typography sx={{ color: "#8fa4b7", fontSize: 11, fontVariantNumeric: "tabular-nums", mr: 1 }}>{timestamp(state.time)} / {timestamp(JOURNEY_DURATION)}</Typography>
          <Tooltip title={paused ? "Play journey" : "Pause journey"}><span><IconButton disabled={status !== "ready"}
            aria-label={paused ? "Play journey" : "Pause journey"} onClick={() => viewerRef.current?.toggle()} sx={buttonStyle}>
            {paused ? <PlayArrowRoundedIcon /> : <PauseRoundedIcon />}
          </IconButton></span></Tooltip>
          <Tooltip title="Replay journey"><span><IconButton disabled={status !== "ready"} aria-label="Replay journey" onClick={() => viewerRef.current?.replay()} sx={buttonStyle}><ReplayRoundedIcon /></IconButton></span></Tooltip>
        </Box>
      </Box>
    </Box>
  </Box>
}

function clampTime(time) { return THREE.MathUtils.clamp(Number(time) || 0, 0, JOURNEY_DURATION) }
