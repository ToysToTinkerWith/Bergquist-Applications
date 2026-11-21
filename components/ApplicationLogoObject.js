import React, { useEffect, useRef, useState } from "react"
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material"
import PauseRoundedIcon from "@mui/icons-material/PauseRounded"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { createApplicationObject } from "./space/applicationObjects"
import { disposeModel, warmScene } from "./space/crewAssets"

export default function ApplicationLogoObject({ src, name, compact = false, animation = "rotate", showControls = true, spotlight = false }) {
  const mountRef = useRef(null), viewerRef = useRef(null)
  const [status, setStatus] = useState("loading"), [paused, setPaused] = useState(false), [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const mount = mountRef.current, signal = new AbortController(), motion = matchMedia("(prefers-reduced-motion: reduce)")
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-3, 3, 3, -3, .1, 50)
    camera.position.set(0, .1, 8)
    scene.add(camera)
    let renderer, model, controls, environment, observer, resizeObserver, frame = 0, last = 0, time = 0
    let disposed = false, visible = false, started = false, ready = false, warming = false, playing = !motion.matches
    const releaseGraphics = () => {
      disposeModel(scene); environment?.dispose(); renderer?.dispose(); renderer?.forceContextLoss()
    }
    setStatus("loading"); setPaused(!playing)
    const draw = () => {
      if (!ready || !visible || disposed || document.hidden) return
      renderer.render(scene, camera)
      mount.dataset.frame = String(Number(mount.dataset.frame || 0) + 1)
      mount.dataset.rotation = model.rotation.y.toFixed(5)
      mount.dataset.time = time.toFixed(4)
      mount.dataset.angle = controls.getAzimuthalAngle().toFixed(4)
    }
    const tick = now => {
      frame = 0
      if (!ready || disposed || !visible || document.hidden || !playing) return
      if (!last || now - last >= 1000 / 30) {
        time += last ? Math.min((now - last) / 1000, .1) : 0; last = now
        if (animation === "sway") {
          model.rotation.set(.055 + Math.sin(time * .4) * .035, -.12 + Math.sin(time * .55) * .28, Math.sin(time * .55) * .025)
        } else model.rotation.y = -.38 + time * Math.PI * 2 / 88
        draw()
      }
      frame = requestAnimationFrame(tick)
    }
    const resume = () => {
      cancelAnimationFrame(frame); last = 0; mount.dataset.motion = playing ? "playing" : "paused"
      draw(); if (ready && visible && !document.hidden && !disposed && playing) frame = requestAnimationFrame(tick)
    }
    const resize = () => {
      if (!renderer || !model || disposed) return
      const { width, height } = mount.getBoundingClientRect(); if (!width || !height) return
      const [x, y, z] = model.userData.size, aspect = width / height
      // Keep the previous framing so wide emblems shrink with the shorter stage too.
      const span = Math.max(y, Math.hypot(x, z) / (aspect * (compact ? 1 : 2 / 3))) * 1.24
      camera.left = -span * aspect / 2; camera.right = span * aspect / 2; camera.top = span / 2; camera.bottom = -span / 2
      camera.updateProjectionMatrix(); renderer.setSize(width, height, false); draw()
    }
    const lost = event => { event.preventDefault(); ready = false; cancelAnimationFrame(frame); setStatus("error") }
    const motionChanged = event => {
      if (event.matches || !showControls) { playing = !event.matches; setPaused(!playing); resume() }
    }
    const initialize = async () => {
      started = true
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" })
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.setClearColor(0, 0)
        renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1
        renderer.domElement.setAttribute("role", "img"); renderer.domElement.setAttribute("aria-label", `${animation === "sway" ? "Gently tilting" : "Rotating"} 3D ${name} emblem`)
        renderer.domElement.addEventListener("webglcontextlost", lost); mount.appendChild(renderer.domElement)
        controls = new OrbitControls(camera, renderer.domElement); controls.enableZoom = false; controls.enablePan = false
        controls.enableDamping = false; controls.rotateSpeed = .45; renderer.domElement.style.touchAction = "pan-y"
        controls.addEventListener("change", draw)
        const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment()
        try { environment = pmrem.fromScene(room, .03, .1, 100, { size: 128 }); scene.environment = environment.texture } finally { pmrem.dispose(); room.dispose() }
        scene.environmentIntensity = spotlight ? .1 : .8
        scene.add(new THREE.AmbientLight("#dae4ef", spotlight ? .04 : .4))
        const lights = spotlight
          ? [["#f2edff", 5, [3.5, 4, -.5], [.4, .4, -8], .6], ["#b0a0ec", .12, [-2, 0, -2], [0, 0, -8]], ["#b0a0ec", .3, [3, 2, -10], [0, 0, -8]]]
          : [["#fff3dc", 2.2, [-3, 4, 5]], ["#a5dfff", .8, [4, 1, 2]], ["#ffffff", 2, [0, 3, -4]]]
        for (const [color, intensity, position, target = [0, 0, 0], angle = .52] of lights) {
          const light = spotlight ? new THREE.SpotLight(color, intensity, 20, angle, 1, 0) : new THREE.DirectionalLight(color, intensity)
          // Camera-local lights stay upper/front-right as the viewer orbits the emblem.
          const parent = spotlight ? camera : scene
          light.position.set(...position); parent.add(light)
          if (spotlight) { light.target.position.set(...target); parent.add(light.target) }
        }
        mount.dataset.spotlights = String(spotlight ? lights.length : 0)
        mount.dataset.lighting = spotlight ? "camera-front-right" : "world"
        model = await createApplicationObject(src, signal.signal)
        if (disposed) { disposeModel(model); return }
        scene.add(model); model.rotation.set(.055, animation === "sway" ? -.12 : -.38, animation === "sway" ? 0 : -.035); resize(); controls.update()
        warming = true
        try { await warmScene(renderer, scene, camera) } finally {
          warming = false
          if (disposed) releaseGraphics()
        }
        if (disposed) return
        renderer.render(scene, camera); ready = true; setStatus("ready")
        mount.dataset.meshes = String(model.children.length)
        mount.dataset.depth = model.userData.size[2].toFixed(3)
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount)
        viewerRef.current = { toggle() { playing = !playing; setPaused(!playing); resume() } }; resume()
      } catch (error) { if (!disposed) { console.error(`3D emblem failed: ${name}`, error); setStatus("error") } }
    }
    observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; mount.dataset.visible = String(visible)
      if (visible && !started) initialize()
      resume()
    }, { rootMargin: "100px" }); observer.observe(mount)
    document.addEventListener("visibilitychange", resume); motion.addEventListener("change", motionChanged)
    return () => {
      disposed = true; ready = false; signal.abort(); cancelAnimationFrame(frame); viewerRef.current = null
      observer.disconnect(); resizeObserver?.disconnect(); controls?.dispose()
      document.removeEventListener("visibilitychange", resume); motion.removeEventListener("change", motionChanged)
      renderer?.domElement.removeEventListener("webglcontextlost", lost)
      renderer?.domElement.remove()
      // Shader readiness polling still needs the materials until warm-up settles.
      if (!warming) releaseGraphics()
    }
  }, [src, name, attempt, compact, animation, showControls, spotlight])

  return <Box data-app-object={name} data-status={status} data-animation={animation} sx={{ position: "relative", width: "100%", height: compact ? "100%" : { xs: 220, sm: 287, md: 307 } }}>
    <Box ref={mountRef} data-app-object-surface sx={{ width: "100%", height: "100%", opacity: status === "ready" ? 1 : 0,
      transition: "opacity 650ms ease", "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      "& canvas": { display: "block", width: "100%", height: "100%", cursor: "grab" } }} />
    {status === "loading" && <Box role="status" aria-label={`Loading ${name} 3D emblem`} sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><CircularProgress size={22} sx={{ color: "#899cae" }} /></Box>}
    {status === "error" && <Box sx={{ position: "absolute", inset: 24, display: "grid", placeItems: "center" }}>
      <Box component="img" src={src} alt={`${name} logo; 3D view unavailable`} sx={{ width: "75%", height: "75%", objectFit: "contain" }} />
    </Box>}
    {(showControls || status === "error") && <Tooltip title={status === "error" ? "Retry 3D emblem" : paused ? "Rotate emblem" : "Pause rotation"}><span>
      <IconButton aria-label={status === "error" ? `Retry ${name} 3D emblem` : `${paused ? "Rotate" : "Pause"} ${name} emblem`} disabled={status === "loading"}
        onClick={() => status === "error" ? setAttempt(value => value + 1) : viewerRef.current?.toggle()}
        sx={{ position: "absolute", left: compact ? 0 : 12, bottom: compact ? 0 : 12, width: compact ? 32 : 40, height: compact ? 32 : 40, color: "#bacbd5", bgcolor: "rgba(8,14,19,.6)" }}>
        {status === "error" ? <RefreshRoundedIcon fontSize="small" /> : paused ? <PlayArrowRoundedIcon fontSize="small" /> : <PauseRoundedIcon fontSize="small" />}
      </IconButton>
    </span></Tooltip>}
  </Box>
}
