import React, { useEffect, useRef, useState } from "react"
import { Box, CircularProgress, IconButton, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material"
import AccessibilityNewRoundedIcon from "@mui/icons-material/AccessibilityNewRounded"
import WavingHandRoundedIcon from "@mui/icons-material/WavingHandRounded"
import DirectionsWalkRoundedIcon from "@mui/icons-material/DirectionsWalkRounded"
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded"
import PauseRoundedIcon from "@mui/icons-material/PauseRounded"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import FlightLandRoundedIcon from "@mui/icons-material/FlightLandRounded"
import FlightTakeoffRoundedIcon from "@mui/icons-material/FlightTakeoffRounded"
import AirlineSeatReclineNormalRoundedIcon from "@mui/icons-material/AirlineSeatReclineNormalRounded"
import AddRoundedIcon from "@mui/icons-material/AddRounded"
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded"
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded"
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded"
import * as THREE from "three"
import { createExpeditionStars } from "./space/expeditionStars"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { CREWS, CHARACTER_ANIMATIONS, SHIP_ANIMATIONS } from "./space/flightCrews"
import { delay, disposeModel, getCrewAssetStats, loadCrew, warmScene } from "./space/crewAssets"
import { createSpacecraftMotion } from "./space/spacecraftMotion"
import { createCruiseExhaust } from "./space/cruiseExhaust"

const ANIMATION_ICONS = { Idle: AccessibilityNewRoundedIcon, Wave: WavingHandRoundedIcon,
  Walk: DirectionsWalkRoundedIcon, Float: RocketLaunchRoundedIcon,
  Cruise: FlightTakeoffRoundedIcon, Landing: FlightLandRoundedIcon, Cockpit: AirlineSeatReclineNormalRoundedIcon }

export default function IdentityAstronaut({ onCrewChange }) {
  const mountRef = useRef(null)
  const viewerRef = useRef(null)
  const motionInitializedRef = useRef(false)
  const [crewIndex, setCrewIndex] = useState(0)
  const character = CREWS[crewIndex]
  const [status, setStatus] = useState("loading")
  const [revealed, setRevealed] = useState(false)
  const [animation, setAnimation] = useState("Wave")
  const [shipAnimation, setShipAnimation] = useState("Cockpit")
  const [paused, setPaused] = useState(false)
  const [retry, setRetry] = useState(0)
  const selectionRef = useRef({ animation, shipAnimation, paused })
  selectionRef.current = { animation, shipAnimation, paused }

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false
    let visible = true
    let contextLost = false
    let frameId = 0
    let lastFrame = 0
    let model = null
    let mixer = null
    let currentAction = null
    let shipModel = null
    let shipMotion = null
    let shipExhaust = null
    let playing = !selectionRef.current.paused
    let renderer = null
    let controls = null
    let environment = null
    let shadowLight = null
    let stars = null
    let resizeObserver = null
    let visibilityObserver = null
    const actions = new Map()
    let request = null
    let loadGeneration = 0
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1.4, 1.4, 1.4, -1.4, 0.01, 60)
    setStatus("loading")
    setRevealed(false)
    if (!motionInitializedRef.current) {
      motionInitializedRef.current = true
      if (motionQuery.matches) {
        playing = false
        selectionRef.current.paused = true
        setPaused(true)
      }
    }

    const draw = () => {
      if (!disposed && !contextLost && renderer && model && visible && !document.hidden) {
        if (shipMotion) {
          const state = shipMotion.state()
          mount.dataset.gearDeployment = state.gear.toFixed(4)
          mount.dataset.canopyOpening = state.canopy.toFixed(4)
          mount.dataset.engineThrust = state.thrust.toFixed(4)
          shipExhaust?.update(0, state.thrust)
        }
        renderer.render(scene, camera)
      }
    }

    const animate = (now) => {
      frameId = 0
      if (disposed || !model || !playing || !visible || document.hidden || contextLost) return
      if (!lastFrame || now - lastFrame >= 1000 / 30) {
        const delta = lastFrame ? Math.min((now - lastFrame) / 1000, 1) : 0
        lastFrame = now
        mixer?.update(delta)
        shipMotion?.update(delta)
        shipExhaust?.update(delta, shipMotion.state().thrust)
        controls.update()
        draw()
      }
      frameId = window.requestAnimationFrame(animate)
    }

    const resume = () => {
      window.cancelAnimationFrame(frameId)
      frameId = 0
      lastFrame = 0
      if (disposed || !model || !visible || document.hidden || contextLost) return
      draw()
      if (playing) frameId = window.requestAnimationFrame(animate)
    }

    const play = (name, immediate = false) => {
      const next = actions.get(name)
      if (!next || (next === currentAction && !immediate)) return
      const previous = currentAction
      next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play()
      if (immediate && !currentAction && selectionRef.current.paused && name === "Wave") next.time = 2
      if (previous && previous !== next) {
        previous.fadeOut(immediate ? 0 : 0.3)
        next.fadeIn(immediate ? 0 : 0.3)
      }
      currentAction = next
      mixer.update(0)
      draw()
    }

    const resetView = () => {
      camera.position.set(2.6, 5.8, 9)
      controls.target.set(0, 1.15, 0)
      camera.zoom = 1
      camera.updateProjectionMatrix()
      controls.update()
      draw()
    }

    const resize = () => {
      if (!renderer) return
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      const aspect = width / height
      const span = Math.max(4.6, 10 / aspect)
      camera.left = -span * aspect / 2
      camera.right = span * aspect / 2
      camera.top = span / 2
      camera.bottom = -span / 2
      camera.updateProjectionMatrix()
      renderer.setSize(Math.floor(width), Math.floor(height), false)
      draw()
    }

    const onMotionChange = (event) => setPaused(event.matches)
    const onContextLost = (event) => {
      event.preventDefault()
      contextLost = true
      window.cancelAnimationFrame(frameId)
      setRevealed(false)
      setStatus("fallback")
    }
    const onContextRestored = async () => {
      contextLost = false
      const generation = loadGeneration
      if (model && shipModel) {
        try {
          await warmScene(renderer, scene, camera)
          if (disposed || generation !== loadGeneration) return
          renderer.render(scene, camera)
          setStatus("ready")
          setRevealed(true)
          resume()
        } catch (error) {
          if (!disposed && generation === loadGeneration) setStatus("fallback")
        }
      }
    }

    const releaseModel = () => {
      mixer?.stopAllAction()
      if (model) {
        mixer?.uncacheRoot(model)
        scene.remove(model)
        disposeModel(model)
      }
      model = null
      mixer = null
      currentAction = null
      actions.clear()
      if (shipModel) {
        scene.remove(shipModel)
        disposeModel(shipModel)
      }
      shipModel = null
      shipMotion = null
      shipExhaust = null
      delete mount.dataset.renderedCrew
    }

    const playShip = (name, immediate = false) => {
      shipMotion?.select(name, immediate)
      draw()
    }

    const loadCharacter = async (entry) => {
      const generation = ++loadGeneration
      request?.abort()
      request = new AbortController()
      const signal = request.signal
      setStatus("loading")
      let pending = null
      try {
        const preview = window.innerWidth < 700
          ? { ...entry, asset: entry.missionAsset, spacecraft: entry.missionSpacecraft }
          : entry
        pending = await loadCrew(preview, signal)
        signal.throwIfAborted()
        // Keep existing shader programs alive while compiling the incoming crew.
        const incoming = new THREE.Group()
        incoming.add(pending.astronaut.scene, pending.spacecraft.scene)
        await renderer.compileAsync(incoming, camera, scene)
        signal.throwIfAborted()
        setStatus("transitioning")
        setRevealed(false)
        await delay(!model || motionQuery.matches ? 0 : 240, signal)
        signal.throwIfAborted()
        window.cancelAnimationFrame(frameId)
        releaseModel()
        const { astronaut: gltf, spacecraft } = pending
        pending = null
        model = gltf.scene
        shipModel = spacecraft.scene
        model.scale.setScalar(1.0)
        model.position.set(-2.85, 0.12, 0.9)
        model.rotation.y = 0.16
        scene.add(model)
        mixer = new THREE.AnimationMixer(model)
        for (const name of CHARACTER_ANIMATIONS) {
          const clip = THREE.AnimationClip.findByName(gltf.animations, name)
          if (!clip) throw new Error(`Character animation ${name} is missing`)
          actions.set(name, mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity))
        }
        play(selectionRef.current.animation, true)
        shipModel = spacecraft.scene
        shipModel.scale.setScalar(entry.shipScale)
        shipModel.position.set(1.0, 0.95, -0.2)
        shipModel.rotation.y = -0.6
        scene.add(shipModel)
        shipMotion = createSpacecraftMotion(spacecraft)
        shipExhaust = createCruiseExhaust(shipModel, entry.id)
        playShip(selectionRef.current.shipAnimation, true)
        resetView()
        resize()
        // Compile the transparent flame shader before revealing a newly selected ship.
        shipExhaust.root.visible = true
        await warmScene(renderer, scene, camera)
        signal.throwIfAborted()
        shipExhaust.update(0, shipMotion.state().thrust)
        renderer.render(scene, camera)
        mount.dataset.renderedCrew = entry.id
        mount.dataset.assetCache = JSON.stringify(getCrewAssetStats())
        playing = !selectionRef.current.paused
        if (!contextLost) { setStatus("ready"); setRevealed(true) }
        resume()
      } catch (error) {
        if (pending) {
          disposeModel(pending.astronaut.scene)
          disposeModel(pending.spacecraft.scene)
        }
        if (disposed || generation !== loadGeneration || error.name === "AbortError") return
        releaseModel()
        setRevealed(false)
        setStatus("fallback")
        console.error("Character preview failed:", error)
      }
    }

    const setup = () => {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.15 : 1.4))
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 0.78
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.domElement.setAttribute("aria-hidden", "true")
      mount.appendChild(renderer.domElement)

      const pmrem = new THREE.PMREMGenerator(renderer)
      const room = new RoomEnvironment()
      environment = pmrem.fromScene(room, 0.04)
      scene.environment = environment.texture
      scene.environmentIntensity = 0.12
      room.dispose()
      pmrem.dispose()
      // Match the Earth/Moon hero's sun, atmosphere-blue rim, and violet bounce.
      scene.add(new THREE.AmbientLight(0x94a7d4, 0.2))
      const key = new THREE.DirectionalLight(0xfff0d2, 3.45)
      key.position.set(-6.8, 3.1, 6.5)
      key.target.position.set(0, 1.05, 0)
      key.castShadow = true
      const shadowSize = window.innerWidth < 700 ? 1024 : 2048
      key.shadow.mapSize.set(shadowSize, shadowSize)
      Object.assign(key.shadow.camera, { left: -5.5, right: 5.5, top: 4.5, bottom: -4.5, near: 0.5, far: 24 })
      key.shadow.bias = -0.00025
      key.shadow.normalBias = 0.007
      shadowLight = key
      scene.add(key.target)
      scene.add(key)
      const fill = new THREE.DirectionalLight(0x8e74ff, 0.28)
      fill.position.set(1.4, -3.8, 4.4)
      scene.add(fill)
      const rim = new THREE.DirectionalLight(0x66cfff, 1.8)
      rim.position.set(5.4, 1.8, -5.2)
      scene.add(rim)

      stars = createExpeditionStars({ orthographic: true })
      scene.add(stars)

      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableZoom = false
      controls.minZoom = 0.8
      controls.maxZoom = 2.8
      controls.enablePan = false
      controls.enableDamping = false
      controls.minPolarAngle = Math.PI * 0.26
      controls.maxPolarAngle = Math.PI * 0.64
      controls.rotateSpeed = 0.65
      renderer.domElement.style.touchAction = "pan-y"
      controls.addEventListener("change", draw)
      resetView()
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(mount)
      visibilityObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting
        resume()
      }, { threshold: 0 })
      visibilityObserver.observe(mount)
      document.addEventListener("visibilitychange", resume)
      motionQuery.addEventListener("change", onMotionChange)
      renderer.domElement.addEventListener("webglcontextlost", onContextLost)
      renderer.domElement.addEventListener("webglcontextrestored", onContextRestored)
      resize()

      viewerRef.current = {
        loadCharacter,
        play,
        playShip,
        replayShip: () => playShip(selectionRef.current.shipAnimation),
        replay: () => play(selectionRef.current.animation, true),
        setPaused: (value) => { playing = !value; resume() },
        resetView,
        zoom: (factor) => {
          camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, controls.minZoom, controls.maxZoom)
          camera.updateProjectionMatrix()
          draw()
        },
      }
    }

    try {
      setup()
    } catch (error) {
      window.cancelAnimationFrame(frameId)
      viewerRef.current = null
      setStatus("fallback")
      console.error("Character preview failed:", error)
    }

    return () => {
      disposed = true
      request?.abort()
      loadGeneration++
      viewerRef.current = null
      window.cancelAnimationFrame(frameId)
      resizeObserver?.disconnect()
      visibilityObserver?.disconnect()
      document.removeEventListener("visibilitychange", resume)
      motionQuery.removeEventListener("change", onMotionChange)
      controls?.removeEventListener("change", draw)
      controls?.dispose()
      renderer?.domElement.removeEventListener("webglcontextlost", onContextLost)
      renderer?.domElement.removeEventListener("webglcontextrestored", onContextRestored)
      releaseModel()
      environment?.dispose()
      shadowLight?.shadow.dispose()
      stars?.geometry.dispose()
      stars?.material.dispose()
      renderer?.dispose()
      renderer?.domElement.remove()
    }
  }, [retry])

  useEffect(() => { viewerRef.current?.loadCharacter(character) }, [character, retry])
  useEffect(() => { onCrewChange?.(character.id) }, [character, onCrewChange])
  useEffect(() => { viewerRef.current?.play(animation) }, [animation])
  useEffect(() => { viewerRef.current?.playShip(shipAnimation) }, [shipAnimation])
  useEffect(() => { viewerRef.current?.setPaused(paused) }, [paused])

  const chooseAnimation = (name) => {
    if (animation === name) viewerRef.current?.replay()
    setAnimation(name)
    setPaused(false)
  }

  const changeCrew = (direction) => {
    setStatus("loading")
    setCrewIndex((index) => (index+direction+CREWS.length)%CREWS.length)
  }

  return (
    <Box data-testid="identity-astronaut" data-astronaut-status={status}
      aria-busy={status === "loading" || status === "transitioning"}
      data-animation={animation} data-ship-animation={shipAnimation} data-paused={String(paused)} data-character={character.id}
      role="region" aria-roledescription="carousel" aria-label="Flight crews"
      sx={{ width: "100%", minWidth: 0 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr) 44px", alignItems: "center",
        width: "100%", maxWidth: 430, mx: "auto", minHeight: 48 }}>
        <Tooltip title="Previous crew"><IconButton aria-label="Previous crew" onClick={() => changeCrew(-1)}
          sx={{ width: 44, height: 44, color: "rgba(216,229,254,0.86)" }}><ChevronLeftRoundedIcon /></IconButton></Tooltip>
        <Box aria-live="polite" aria-atomic="true" sx={{ textAlign: "center", minWidth: 0 }}>
          <Typography sx={{ color: "#d8e5fe", fontSize: 14, fontWeight: 700, letterSpacing: 0 }}>{character.name}</Typography>
          <Typography sx={{ color: "rgba(216,229,254,0.55)", fontSize: 11, letterSpacing: 0 }}>{String(crewIndex+1).padStart(2, "0")} / {String(CREWS.length).padStart(2, "0")}</Typography>
        </Box>
        <Tooltip title="Next crew"><IconButton aria-label="Next crew" onClick={() => changeCrew(1)}
          sx={{ width: 44, height: 44, color: "rgba(216,229,254,0.86)" }}><ChevronRightRoundedIcon /></IconButton></Tooltip>
      </Box>
      <Box sx={{ position: "relative", width: "100%", height: { xs: 260, sm: 380, md: 400 } }}>
        <Box ref={mountRef} role="img"
          aria-label={character.description}
          sx={{ position: "absolute", inset: 0, cursor: status === "ready" ? "grab" : "default",
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : "translateY(6px)",
            transition: revealed ? "opacity 0.5s ease, transform 0.5s ease" : "opacity 0.22s ease",
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
            "&:active": { cursor: status === "ready" ? "grabbing" : "default" },
            "& canvas": { display: "block", width: "100%", height: "100%" } }} />
        {status !== "ready" && (
          <Box role="status" sx={{ position: "absolute", bottom: 10, insetInline: 0,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
            color: "rgba(216,229,254,0.78)" }}>
            {status === "loading" ? <CircularProgress size={16} color="inherit" aria-label="Loading flight crew" /> : null}
            {status === "fallback" && <Typography sx={{ fontSize: 13 }}>3D preview unavailable</Typography>}
            {status === "fallback" && <Tooltip title="Retry 3D preview"><IconButton aria-label="Retry 3D preview"
              onClick={() => setRetry((value) => value + 1)} sx={{ color: "inherit" }}><RefreshRoundedIcon fontSize="small" /></IconButton></Tooltip>}
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.1, pt: 1.5 }}>
        <Typography sx={{ fontSize: 11, color: "rgba(216,229,254,0.62)", letterSpacing: 0 }}>{character.pilot}</Typography>
        <ToggleButtonGroup value={animation} exclusive aria-label={`${character.name} animation`}
          sx={{ width: "100%", maxWidth: 430, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            "& .MuiToggleButton-root": { minWidth: 0, height: 48, p: 0.5, gap: 0.25,
              display: "flex", flexDirection: "column", color: "rgba(216,229,254,0.76)",
              borderColor: "rgba(216,229,254,0.17)", fontSize: 12, fontWeight: 700,
              textTransform: "none", letterSpacing: 0, borderRadius: 1,
              "&.Mui-selected": { color: "#d6c9ff", backgroundColor: "#211c2e", borderColor: "#71628e" },
              "&.Mui-selected:hover": { backgroundColor: "#2c253d" },
              "&.Mui-disabled": { color: "rgba(216,229,254,0.3)", borderColor: "rgba(216,229,254,0.1)" } } }}>
          {CHARACTER_ANIMATIONS.map((name) => {
            const Icon = ANIMATION_ICONS[name]
            return <ToggleButton key={name} value={name} aria-label={name}
            disabled={status !== "ready"} onClick={() => chooseAnimation(name)}>
            <Icon sx={{ fontSize: 21 }} />{name}
          </ToggleButton>})}
        </ToggleButtonGroup>
        <Typography sx={{ fontSize: 11, color: "rgba(216,229,254,0.62)", letterSpacing: 0, mt: 0.4 }}>{character.ship}</Typography>
        <ToggleButtonGroup value={shipAnimation} exclusive aria-label={`${character.ship} spacecraft`}
          sx={{ width: "100%", maxWidth: 430, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            "& .MuiToggleButton-root": { minWidth: 0, height: 48, p: 0.5, gap: 0.25,
              display: "flex", flexDirection: "column", color: "rgba(216,229,254,0.76)",
              borderColor: "rgba(216,229,254,0.17)", fontSize: 12, fontWeight: 700,
              textTransform: "none", letterSpacing: 0, borderRadius: 1,
              "&.Mui-selected": { color: "#d6c9ff", backgroundColor: "#211c2e", borderColor: "#71628e" },
              "&.Mui-selected:hover": { backgroundColor: "#2c253d" },
              "&.Mui-disabled": { color: "rgba(216,229,254,0.3)", borderColor: "rgba(216,229,254,0.1)" } } }}>
          {SHIP_ANIMATIONS.map((name) => {
            const Icon = ANIMATION_ICONS[name]
            return <ToggleButton key={name} value={name} aria-label={name} disabled={status !== "ready"}
              onClick={() => {
                if (shipAnimation === name) viewerRef.current?.replayShip()
                setShipAnimation(name)
                setPaused(false)
              }}><Icon sx={{ fontSize: 21 }} />{name}</ToggleButton>
          })}
        </ToggleButtonGroup>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <Tooltip title={paused ? "Play animation" : "Pause animation"}><span>
            <IconButton aria-label={paused ? "Play animation" : "Pause animation"} disabled={status !== "ready"}
              onClick={() => setPaused((value) => !value)} sx={{ color: "rgba(216,229,254,0.76)", width: 38, height: 38,
                "&.Mui-disabled": { color: "rgba(216,229,254,0.25)" } }}>
              {paused ? <PlayArrowRoundedIcon /> : <PauseRoundedIcon />}
            </IconButton>
          </span></Tooltip>
          {[{ label: "Zoom in", Icon: AddRoundedIcon, factor: 1.2 }, { label: "Zoom out", Icon: RemoveRoundedIcon, factor: 1 / 1.2 }].map(({ label, Icon, factor }) => (
            <Tooltip key={label} title={label}><span><IconButton aria-label={label} disabled={status !== "ready"}
              onClick={() => viewerRef.current?.zoom(factor)} sx={{ color: "rgba(216,229,254,0.76)", width: 38, height: 38 }}>
              <Icon /></IconButton></span></Tooltip>
          ))}
          <Tooltip title="Reset view"><span><IconButton aria-label="Reset view" disabled={status !== "ready"}
            onClick={() => viewerRef.current?.resetView()} sx={{ color: "rgba(216,229,254,0.76)", width: 38, height: 38,
              "&.Mui-disabled": { color: "rgba(216,229,254,0.25)" } }}><RestartAltRoundedIcon /></IconButton></span></Tooltip>
        </Box>
      </Box>
    </Box>
  )
}
