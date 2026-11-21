import React, { useEffect, useRef, useState } from "react"
import SiteLink from "./SiteLink"
import { Box, Button, CircularProgress, FormControl, IconButton, InputLabel, MenuItem, Select, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded"
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded"
import PublicRoundedIcon from "@mui/icons-material/PublicRounded"
import PauseRoundedIcon from "@mui/icons-material/PauseRounded"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { createLunarMuseum, MUSEUM_COLLECTIONS } from "./space/lunarMuseum"
import { disposeModel, warmScene } from "./space/crewAssets"
import { museumClickView, museumParentView } from "./space/museumNavigation"

export default function LunarComponentMuseum({ items }) {
  const mountRef = useRef(null), viewerRef = useRef(null)
  const [status, setStatus] = useState("loading"), [attempt, setAttempt] = useState(0)
  const [collection, setCollection] = useState("all"), [selected, setSelected] = useState("")
  const [paused, setPaused] = useState(false)
  const item = items.find(entry => entry.key === selected)
  const view = (category, key = "") => {
    setSelected(key); setCollection(category)
    viewerRef.current?.focus(category, key)
  }
  const back = () => { const parent = museumParentView(collection, selected); view(parent.category, parent.key) }
  const navigate = offset => {
    if (collection === "all") { view(MUSEUM_COLLECTIONS[offset > 0 ? 0 : MUSEUM_COLLECTIONS.length - 1].id); return }
    const candidates = collection === "all" ? items : items.filter(entry => entry.category === collection)
    if (!candidates.length) return
    const current = candidates.findIndex(entry => entry.key === selected)
    const index = current < 0 ? (offset > 0 ? 0 : candidates.length - 1) : (current + offset + candidates.length) % candidates.length
    const next = candidates[index]
    view(next.category, next.key)
  }
  const callbacksRef = useRef({ view, navigate }); callbacksRef.current = { view, navigate }

  useEffect(() => {
    const mount = mountRef.current, controller = new AbortController()
    const scene = new THREE.Scene(); scene.background = new THREE.Color("#010307")
    const camera = new THREE.PerspectiveCamera(50, 1, .1, 600)
    let renderer, controls, model, environment, resizeObserver, observer
    let disposed = false, ready = false, visible = false, frame = 0, last = 0, time = 0
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let playing = !motion.matches, transition = null, activeCategory = "all", activeKey = "", pointerStart = null
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2()
    setStatus("loading"); setPaused(!playing); setCollection("all"); setSelected("")
    const draw = () => {
      if (!ready || disposed || !visible || document.hidden) return
      renderer.render(scene, camera)
      mount.dataset.frame = String(Number(mount.dataset.frame || 0) + 1)
      mount.dataset.time = time.toFixed(4)
      mount.dataset.camera = JSON.stringify({ position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, aspect: camera.aspect })
    }
    const animate = now => {
      frame = 0
      if (!ready || disposed || !visible || document.hidden) return
      if (!last || now - last >= 1000 / 30) {
        const delta = last ? Math.min((now - last) / 1000, .12) : 0; last = now
        if (playing) { time += delta; mount.dataset.earthPosition = JSON.stringify(model.update(time)) }
        if (transition) {
          transition.elapsed += delta
          const t = Math.min(1, transition.elapsed / 1.15), eased = t * t * (3 - 2 * t)
          camera.position.lerpVectors(transition.start, transition.end, eased)
          controls.target.lerpVectors(transition.fromTarget, transition.target, eased)
          if (t === 1) transition = null
        }
        controls.update(); draw()
      }
      if (playing || transition) frame = requestAnimationFrame(animate)
    }
    const resume = () => {
      cancelAnimationFrame(frame); frame = 0; last = 0
      mount.dataset.motion = playing ? "playing" : "paused"
      draw()
      if (ready && !disposed && visible && !document.hidden && (playing || transition)) frame = requestAnimationFrame(animate)
    }
    const focus = (category = "all", key = "", immediate = false) => {
      if (!model) return
      activeCategory = category; activeKey = key; model.highlight(key, category)
      mount.dataset.collection = category; mount.dataset.selected = key
      mount.dataset.level = key ? "component" : category === "all" ? "overview" : "collection"
      let target, direction, distance
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      if (key && model.stations.has(key)) {
        target = model.stations.get(key).center.clone()
        direction = new THREE.Vector3(0, .20, 1).normalize()
        distance = Math.max(5.8, 5.5 / (2 * tan * camera.aspect), 4.4 / (2 * tan))
      } else if (category !== "all" && model.collections.has(category)) {
        const bounds = model.collections.get(category), size = bounds.getSize(new THREE.Vector3())
        target = bounds.getCenter(new THREE.Vector3()); direction = new THREE.Vector3(.05, .62, 1).normalize()
        distance = Math.max(size.x / camera.aspect, size.z * .8 + size.y) / (2 * tan) + 7
      } else {
        target = new THREE.Vector3(0, -2, 0); direction = new THREE.Vector3(.08, .64, 1).normalize()
        distance = Math.max(54, 42 / (2 * tan * camera.aspect) + 18)
      }
      const end = target.clone().addScaledVector(direction, distance)
      if (motion.matches || immediate) { transition = null; camera.position.copy(end); controls.target.copy(target); controls.update() }
      else transition = { start: camera.position.clone(), end, fromTarget: controls.target.clone(), target, elapsed: 0 }
      resume()
    }
    const resize = () => {
      if (!renderer || disposed) return
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix()
      focus(activeCategory, activeKey, true)
    }
    const pick = event => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(model.hitTargets.filter(object => object.visible && (!activeKey || !object.userData.collectionOnly)), false)[0] || raycaster.intersectObjects(model.collectionTargets, false)[0]
      if (!hit) return null
      const key = hit.object.userData.componentKey
      return { key, category: key ? model.stations.get(key).item.category : hit.object.userData.category }
    }
    const onPointerDown = event => { if (event.button === 0 && ready) { transition = null; pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId, distance: 0 } } }
    const onPointerMove = event => {
      if (!ready) return
      if (pointerStart) { pointerStart.distance = Math.max(pointerStart.distance, Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y)); return }
      const hit = pick(event)
      renderer.domElement.style.cursor = hit || activeCategory !== "all" ? "pointer" : "grab"
      renderer.domElement.title = hit ? (activeCategory === "all" ? `${hit.category} collection` : hit.key ? model.stations.get(hit.key).item.title : `${hit.category} collection`) : activeCategory !== "all" ? "Back one level" : ""
    }
    const onPointerUp = event => {
      if (pointerStart?.id !== event.pointerId) return
      const clicked = event.type === "pointerup" && pointerStart.distance < 6; pointerStart = null
      if (!clicked) return
      const next = museumClickView(activeCategory, activeKey, pick(event))
      if (next.category !== activeCategory || next.key !== activeKey) callbacksRef.current.view(next.category, next.key)
    }
    const onKey = event => {
      if (event.key === "Escape") { event.preventDefault(); const parent = museumParentView(activeCategory, activeKey); callbacksRef.current.view(parent.category, parent.key) }
      if (event.key === "Home") { event.preventDefault(); callbacksRef.current.view("all") }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); callbacksRef.current.navigate(event.key === "ArrowRight" ? 1 : -1) }
    }
    const onMotion = event => {
      if (event.matches) { playing = false; setPaused(true); focus(activeCategory, activeKey, true); resume() }
    }
    const fail = () => { if (!disposed) { ready = false; cancelAnimationFrame(frame); viewerRef.current = null; setStatus("error") } }
    const onContextLost = event => { event.preventDefault(); fail() }
    const events = [["pointerdown", onPointerDown], ["pointermove", onPointerMove], ["pointerup", onPointerUp], ["pointercancel", onPointerUp], ["keydown", onKey], ["webglcontextlost", onContextLost]]
    const initialize = async () => {
      try {
        mount.dataset.stage = "renderer"
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" })
        const mobile = window.innerWidth < 700
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.4))
        renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
        renderer.domElement.tabIndex = 0; renderer.domElement.setAttribute("role", "img")
        renderer.domElement.setAttribute("aria-label", `Lunar component museum: ${items.length} exhibits grouped into Data, Design, Financial and AI, with Earth orbiting the Moon`)
        renderer.domElement.setAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight Home Escape")
        events.forEach(([name, handler]) => renderer.domElement.addEventListener(name, handler)); mount.appendChild(renderer.domElement)
        controls = new OrbitControls(camera, renderer.domElement)
        controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = false
        controls.minPolarAngle = .18; controls.maxPolarAngle = 1.47
        controls.minAzimuthAngle = -1.1; controls.maxAzimuthAngle = 1.1
        controls.rotateSpeed = .45; renderer.domElement.style.touchAction = "pan-y"
        controls.addEventListener("change", draw)
        controls.addEventListener("start", () => { transition = null })
        const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment()
        try { environment = pmrem.fromScene(room, .04) } finally { pmrem.dispose(); room.dispose() }
        scene.environment = environment.texture; scene.environmentIntensity = .3
        scene.add(new THREE.AmbientLight("#bdcee0", .48))
        const sun = new THREE.DirectionalLight("#fff1d9", 2.5); sun.position.set(-24, 44, 20); sun.castShadow = true
        const shadowSize = mobile ? 1024 : 2048
        sun.shadow.mapSize.set(shadowSize, shadowSize); Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 150 })
        sun.shadow.camera.updateProjectionMatrix(); sun.shadow.normalBias = .055; sun.shadow.bias = -.0003; scene.add(sun)
        const rim = new THREE.DirectionalLight("#73b9e9", .9); rim.position.set(20, 15, -30); scene.add(rim)
        mount.dataset.stage = "moon-earth-exhibits"
        model = await createLunarMuseum(scene, renderer, items, controller.signal)
        if (disposed) return
        mount.dataset.exhibits = String(model.stations.size); mount.dataset.missingPreviews = JSON.stringify(model.missing)
        mount.dataset.stationPositions = JSON.stringify(Object.fromEntries([...model.stations].map(([key, value]) => [key, value.center.toArray()])))
        mount.dataset.earthPosition = JSON.stringify(model.update(0))
        resize(); mount.dataset.stage = "lighting"
        await warmScene(renderer, scene, camera)
        if (disposed) return
        renderer.shadowMap.autoUpdate = false
        renderer.render(scene, camera)
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount)
        observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; mount.dataset.visible = String(visible); resume() })
        observer.observe(mount)
        document.addEventListener("visibilitychange", resume); motion.addEventListener("change", onMotion)
        ready = true; setStatus("ready"); mount.dataset.stage = "ready"
        viewerRef.current = { focus, toggle() { playing = !playing; setPaused(!playing); resume() } }
        resume()
      } catch (error) { if (!disposed) { console.error("Lunar museum could not load", error); fail() } }
    }
    initialize()
    return () => {
      disposed = true; ready = false; controller.abort(); cancelAnimationFrame(frame); viewerRef.current = null
      observer?.disconnect(); resizeObserver?.disconnect(); controls?.dispose()
      document.removeEventListener("visibilitychange", resume); motion.removeEventListener("change", onMotion)
      events.forEach(([name, handler]) => renderer?.domElement.removeEventListener(name, handler))
      scene.traverse(object => { if (object.isLight) object.shadow?.dispose() })
      disposeModel(scene); environment?.dispose(); renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove()
    }
  }, [items, attempt])

  const iconStyle = { width: 40, height: 40, color: "#b4c8d6", "&:hover": { bgcolor: "#19232b", color: "white" } }
  const inner = { width: "100%", maxWidth: 1280, mx: "auto", px: { xs: 2, sm: 3, md: 4 } }
  return <Box component="section" id="lunar-component-museum" aria-labelledby="lunar-museum-title" data-status={status}
    sx={{ bgcolor: "#010307", color: "#e0e7ec", pt: { xs: 10, md: 12 }, pb: 3, fontFamily: "Helmet", letterSpacing: 0 }}>
    <Box sx={{ ...inner, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "end", gap: 2, mb: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontFamily: "Helmet", fontSize: 11, letterSpacing: 0, color: "#a1b3c4", mb: .7 }}>BERGQUIST APPLICATIONS / THE LUNAR COLLECTION</Typography>
        <Typography id="lunar-museum-title" component="h1" sx={{ fontFamily: "Bemora", fontSize: { xs: 26, sm: 34 }, lineHeight: 1.15, letterSpacing: 0,
          display: "inline-block", overflowWrap: "normal", backgroundImage: "linear-gradient(90deg,#7C3AED,#4F46E5 40%,#22D3EE)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>Component museum</Typography>
      </Box>
      <Typography sx={{ color: "#a1b3c4", fontFamily: "Helmet", fontSize: 12, flexShrink: 0 }}>{items.length} exhibits</Typography>
    </Box>
    <Box sx={{ ...inner, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
      <Tooltip title={selected ? `Back to ${collection} collection` : "Back to museum overview"}><span><IconButton aria-label="Back one museum level" disabled={status !== "ready" || collection === "all"} sx={iconStyle} onClick={back}><ArrowBackRoundedIcon /></IconButton></span></Tooltip>
      <ToggleButtonGroup value={collection} exclusive aria-label="Museum collection" onChange={(_, value) => view(value || collection)}
        sx={{ flexWrap: "wrap", "& .MuiToggleButton-root": { fontFamily: "Helmet", textTransform: "none", letterSpacing: 0, fontSize: 13, height: 40,
          border: 0, color: "#9cafbd", px: { xs: 1, sm: 1.6 }, borderRadius: "4px !important" }, "& .Mui-selected": { color: "#fff !important", bgcolor: "#1b2731 !important" } }}>
        <ToggleButton value="all" aria-label="Museum overview" disabled={status !== "ready"}><Tooltip title="Museum overview"><PublicRoundedIcon fontSize="small" /></Tooltip></ToggleButton>
        {MUSEUM_COLLECTIONS.map(entry => <ToggleButton value={entry.id} key={entry.id} aria-label={`${entry.label} collection`} disabled={status !== "ready"}>{entry.label}</ToggleButton>)}
      </ToggleButtonGroup>
      <Tooltip title={paused ? "Resume orbit" : "Pause orbit"}><span><IconButton aria-label={paused ? "Resume museum orbit" : "Pause museum orbit"} disabled={status !== "ready"} sx={iconStyle} onClick={() => viewerRef.current?.toggle()}>{paused ? <PlayArrowRoundedIcon /> : <PauseRoundedIcon />}</IconButton></span></Tooltip>
    </Box>
    <Box sx={{ position: "relative", width: "100%", height: { xs: 540, sm: 640, md: 730, lg: 790 } }}>
      <Box ref={mountRef} data-museum-surface sx={{ width: "100%", height: "100%", opacity: status === "ready" ? 1 : 0, transition: "opacity 500ms ease",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" }, "& canvas": { display: "block", width: "100%", height: "100%", cursor: "grab" },
        "& canvas:focus-visible": { outline: "2px solid #75d8ee", outlineOffset: -3 } }} />
      {status === "loading" && <Box role="status" aria-label="Loading lunar museum" sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><CircularProgress size={26} thickness={2} sx={{ color: "#8faabb" }} /></Box>}
      {status === "error" && <Box role="alert" sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
        <Typography>The museum could not load.</Typography><Tooltip title="Retry museum"><IconButton aria-label="Retry museum" sx={iconStyle} onClick={() => setAttempt(value => value + 1)}><RefreshRoundedIcon /></IconButton></Tooltip>
      </Box>}
    </Box>
    <Box sx={{ ...inner, pt: 2, borderTop: "1px solid #23303b" }}>
      <Box data-museum-controls sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", pr: { xs: 7, sm: 0 } }}>
        <Tooltip title="Previous exhibit"><span><IconButton aria-label="Previous exhibit" disabled={status === "loading"} sx={iconStyle} onClick={() => navigate(-1)}><ChevronLeftRoundedIcon /></IconButton></span></Tooltip>
        <FormControl size="small" sx={{ flex: 1, minWidth: { xs: 120, sm: 160 }, maxWidth: 360, "& .MuiInputBase-root, & .MuiInputLabel-root": { color: "#d8e5ef", fontFamily: "Helmet", letterSpacing: 0 }, "& .MuiOutlinedInput-notchedOutline": { borderColor: "#3b4c59" }, "& .MuiSvgIcon-root": { color: "#9eafbd" } }}>
          <InputLabel id="museum-exhibit-label">Exhibit</InputLabel>
          <Select labelId="museum-exhibit-label" label="Exhibit" value={selected} disabled={status === "loading" || collection === "all"} onChange={event => { const next = items.find(entry => entry.key === event.target.value); if (next) view(next.category, next.key) }}>
            <MenuItem value="" disabled>Collection overview</MenuItem>
            {items.filter(entry => entry.category === collection).map(entry => <MenuItem key={entry.key} value={entry.key} sx={{ fontFamily: "Helmet", whiteSpace: "normal" }}>{entry.title}</MenuItem>)}
          </Select>
        </FormControl>
        <Tooltip title="Next exhibit"><span><IconButton aria-label="Next exhibit" disabled={status === "loading"} sx={iconStyle} onClick={() => navigate(1)}><ChevronRightRoundedIcon /></IconButton></span></Tooltip>
        <Button component={SiteLink} href={item ? `/components/${item.key}` : "#components-dashboard"} endIcon={<ArrowForwardRoundedIcon />} sx={{ ml: { xs: 0, sm: "auto" }, color: "#98d9ed", fontFamily: "Helmet", letterSpacing: 0, textTransform: "none", minHeight: 42 }}>
          {item ? "Open component" : "Component catalog"}
        </Button>
      </Box>
      {item && <Box aria-live="polite" sx={{ pt: 2, maxWidth: 760 }}>
        <Typography component="h2" sx={{ fontFamily: "Bemora", fontSize: 20, letterSpacing: 0, mb: .8 }}>{item.title}</Typography>
        <Typography sx={{ fontFamily: "Helmet", fontSize: 15, lineHeight: 1.65, color: "#a7bac8" }}>{item.description}</Typography>
      </Box>}
    </Box>
  </Box>
}
