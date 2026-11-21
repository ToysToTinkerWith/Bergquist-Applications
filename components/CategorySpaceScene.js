import React, { useEffect, useRef, useState } from "react"
import { Box, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material"
import PauseRoundedIcon from "@mui/icons-material/PauseRounded"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { createCategoryModel } from "./space/categoryModels"
import { disposeModel, warmScene } from "./space/crewAssets"

const DESCRIPTIONS = {
  data: "Orbital data relay with tracking solar panels, a scanning dish, and flowing telemetry",
  finance: "Orbital clearing vault with a locking hatch, cargo transfer, and verification scanner",
  ai: "Autonomous survey drone with an optical sensor, articulated grippers, and a processing core",
}

export default function CategorySpaceScene({ category, title }) {
  const mountRef = useRef(null)
  const viewerRef = useRef(null)
  const [status, setStatus] = useState("loading")
  const [paused, setPaused] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let disposed = false, ready = false, visible = false, frame = 0, lastFrame = 0, elapsed = 0
    let renderer, model, controls, environment, resizeObserver, visibilityObserver
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 40)
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    let playing = !motionQuery.matches
    setPaused(!playing); setStatus("loading")
    const draw = () => {
      if (!disposed && ready && visible && !document.hidden) {
        renderer.render(scene, camera)
        mount.dataset.frame = String(Number(mount.dataset.frame || 0) + 1)
        mount.dataset.time = elapsed.toFixed(3)
      }
    }
    const tick = now => {
      frame = 0
      if (disposed || !ready || !playing || !visible || document.hidden) return
      if (!lastFrame || now - lastFrame >= 1000 / 30) {
        elapsed += lastFrame ? Math.min((now - lastFrame) / 1000, .1) : 0
        lastFrame = now
        model.update(elapsed); draw()
      }
      frame = requestAnimationFrame(tick)
    }
    const resume = () => {
      cancelAnimationFrame(frame); frame = 0; lastFrame = 0
      mount.dataset.motion = playing ? "playing" : "paused"
      draw()
      if (!disposed && ready && playing && visible && !document.hidden) frame = requestAnimationFrame(tick)
    }
    const resize = () => {
      if (!renderer || !model || disposed) return
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false)
      const aspect = width / height
      const halfHeight = model.radius / Math.min(aspect, 1)
      camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect
      camera.top = halfHeight; camera.bottom = -halfHeight
      camera.updateProjectionMatrix(); draw()
    }
    const fail = () => {
      if (disposed) return
      ready = false; cancelAnimationFrame(frame); setStatus("error")
    }
    const onContextLost = event => { event.preventDefault(); fail() }
    const onMotionChange = event => {
      if (event.matches) { playing = false; setPaused(true); resume() }
    }
    const onKeyDown = event => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) || !ready) return
      event.preventDefault()
      const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target))
      spherical.theta += event.key === "ArrowLeft" ? -.13 : event.key === "ArrowRight" ? .13 : 0
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + (event.key === "ArrowUp" ? -.13 : event.key === "ArrowDown" ? .13 : 0), .35, 2.75)
      camera.position.setFromSpherical(spherical).add(controls.target)
      controls.update(); draw()
    }
    const initialize = async () => {
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 1.08
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.domElement.setAttribute("role", "img")
        renderer.domElement.setAttribute("aria-label", DESCRIPTIONS[category])
        renderer.domElement.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight ArrowUp ArrowDown")
        renderer.domElement.tabIndex = 0
        renderer.domElement.addEventListener("webglcontextlost", onContextLost)
        renderer.domElement.addEventListener("keydown", onKeyDown)
        mount.appendChild(renderer.domElement)

        const pmrem = new THREE.PMREMGenerator(renderer)
        const room = new RoomEnvironment()
        try { environment = pmrem.fromScene(room, .04) } finally { room.dispose(); pmrem.dispose() }
        scene.environment = environment.texture; scene.environmentIntensity = .52
        scene.add(new THREE.AmbientLight(0x9caec4, .38))
        const sun = new THREE.DirectionalLight(0xffefd6, 3.8)
        sun.position.set(-3.5, 4.8, 5.5); sun.castShadow = true
        sun.shadow.mapSize.set(1024, 1024)
        Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: .1, far: 20 })
        sun.shadow.camera.updateProjectionMatrix()
        sun.shadow.bias = -.0004; sun.shadow.normalBias = .018
        scene.add(sun)
        const rim = new THREE.DirectionalLight(0x69cfff, 2.2)
        rim.position.set(4, 1.5, -4); scene.add(rim)
        const bounce = new THREE.DirectionalLight(0x9a8cf2, .65)
        bounce.position.set(-2, -3, 3); scene.add(bounce)
        model = createCategoryModel(category); scene.add(model.root)
        camera.position.set(...model.view); camera.lookAt(0, 0, 0)
        controls = new OrbitControls(camera, renderer.domElement)
        controls.enableZoom = false; controls.enablePan = false
        controls.enableDamping = false; controls.rotateSpeed = .55
        controls.minPolarAngle = .35; controls.maxPolarAngle = 2.75
        renderer.domElement.style.touchAction = "pan-y"
        controls.addEventListener("change", draw)
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount)
        visibilityObserver = new IntersectionObserver(entries => {
          visible = entries[0].isIntersecting
          mount.dataset.visible = String(visible); resume()
        }, { threshold: 0 })
        visibilityObserver.observe(mount)
        document.addEventListener("visibilitychange", resume)
        motionQuery.addEventListener("change", onMotionChange)
        resize()
        await warmScene(renderer, scene, camera)
        if (disposed) return
        // Reveal only after the full-size, lit frame is in the canvas.
        renderer.render(scene, camera)
        ready = true
        viewerRef.current = {
          toggle() { playing = !playing; setPaused(!playing); resume() },
          reset() { elapsed = 0; model.update(0); controls.reset(); resume() },
        }
        setStatus("ready"); resume()
      } catch (error) {
        if (!disposed) { console.error(`Unable to render ${category} model`, error); fail() }
      }
    }
    initialize()
    return () => {
      disposed = true; ready = false; viewerRef.current = null; cancelAnimationFrame(frame)
      resizeObserver?.disconnect(); visibilityObserver?.disconnect()
      document.removeEventListener("visibilitychange", resume)
      motionQuery.removeEventListener("change", onMotionChange)
      controls?.dispose()
      renderer?.domElement.removeEventListener("webglcontextlost", onContextLost)
      renderer?.domElement.removeEventListener("keydown", onKeyDown)
      scene.traverse(object => { if (object.isLight) object.shadow?.dispose() })
      disposeModel(scene); environment?.dispose()
      renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove()
    }
  }, [category, attempt])

  const buttonStyle = { width: 36, height: 36, color: "rgba(216,229,254,.72)",
    "&:hover": { color: "#fff", backgroundColor: "rgba(216,229,254,.1)" },
    "&.Mui-focusVisible": { outline: "2px solid #69cfff", outlineOffset: 2 } }
  return (
    <Box data-category-scene={category} data-status={status} sx={{ width: "100%", maxWidth: 480, mx: "auto", position: "relative" }}>
      <Box ref={mountRef} sx={{ width: "100%", aspectRatio: "1.12", position: "relative",
        opacity: status === "ready" ? 1 : 0, transition: "opacity 650ms ease",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        "& canvas": { display: "block", width: "100%", height: "100%", cursor: "grab", outlineOffset: -3 },
        "& canvas:active": { cursor: "grabbing" }, "& canvas:focus-visible": { outline: "1px solid #69cfff" } }} />
      {status === "loading" && <Box role="status" aria-label={`Loading ${title} model`} sx={{ position: "absolute", inset: "0 0 36px", display: "grid", placeItems: "center" }}>
        <CircularProgress size={20} thickness={2} sx={{ color: "#8da5b6", "@media (prefers-reduced-motion: reduce)": { animation: "none", "& circle": { animation: "none" } } }} />
      </Box>}
      {status === "error" && <Box role="alert" sx={{ position: "absolute", inset: "0 0 36px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
        <Typography variant="body2" sx={{ color: "#aebdca" }}>3D view unavailable</Typography>
        <Tooltip title="Retry 3D view"><IconButton aria-label={`Retry ${title} 3D view`} onClick={() => setAttempt(value => value + 1)} sx={buttonStyle}><RefreshRoundedIcon fontSize="small" /></IconButton></Tooltip>
      </Box>}
      <Box sx={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: .5, visibility: status === "ready" ? "visible" : "hidden" }}>
        <Tooltip title={paused ? "Play animation" : "Pause animation"}>
          <IconButton aria-label={`${paused ? "Play" : "Pause"} ${title} animation`} onClick={() => viewerRef.current?.toggle()} sx={buttonStyle}>
            {paused ? <PlayArrowRoundedIcon fontSize="small" /> : <PauseRoundedIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset view and animation"><IconButton aria-label={`Reset ${title} view and animation`} onClick={() => viewerRef.current?.reset()} sx={buttonStyle}><RestartAltRoundedIcon fontSize="small" /></IconButton></Tooltip>
      </Box>
    </Box>
  )
}
