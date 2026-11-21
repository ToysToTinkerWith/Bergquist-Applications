import React, { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { createPlanetSurface } from "./MoonMesh"
import { CREWS } from "./space/flightCrews"
import { loadCrew, disposeModel, warmScene } from "./space/crewAssets"
import { createExpeditionStars } from "./space/expeditionStars"
import { createAboutMoonMission, MOON_WAVE_STILL } from "./space/aboutMoonMission"
import styles from "../styles/about-moon-landing.module.css"

export default function AboutMoonLanding({ className = "" }) {
  const mountRef = useRef(null)
  const [status, setStatus] = useState("loading")
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const mount = mountRef.current, request = new AbortController()
    const preference = matchMedia("(prefers-reduced-motion: reduce)")
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-5, 5, 5, -5, .1, 160)
    let renderer, environment, controls, mission, resizeObserver, keyLight
    let disposed = false, released = false, warming = false, started = false, ready = false, visible = false
    let active = !preference.matches, frame = 0, last = 0, elapsed = active ? 0 : MOON_WAVE_STILL
    let frameWidth = 8, frameHeight = 7, viewportWidth = 1, viewportHeight = 1, framing
    setStatus("loading")
    function release() {
      if (released) return
      released = true; mission?.dispose(); disposeModel(scene)
      renderer?.domElement.removeEventListener("webglcontextlost", contextLost)
      keyLight?.shadow.dispose(); environment?.dispose(); renderer?.dispose(); renderer?.forceContextLoss()
    }
    function pose() {
      if (!mission) return
      const state = mission.poseAt(elapsed)
      if (framing && controls) {
        frameWidth = THREE.MathUtils.lerp(framing.flight.width, framing.final.width, state.walk)
        frameHeight = THREE.MathUtils.lerp(framing.flight.height, framing.final.height, state.walk)
        const target = framing.flight.target.clone().lerp(framing.final.target, state.walk)
        camera.position.add(target.clone().sub(controls.target)); controls.target.copy(target)
        camera.updateMatrixWorld(true); project()
      }
      mount.dataset.phase = state.phase; mount.dataset.time = elapsed.toFixed(3)
      mount.dataset.canopy = state.canopy.toFixed(4); mount.dataset.gear = state.gear.toFixed(4)
      mount.dataset.thrust = state.thrust.toFixed(4)
      mount.dataset.pilotVisible = String(state.pilotVisible)
      mount.dataset.pilotOpacity = state.pilotOpacity.toFixed(4)
      mount.dataset.pilotScale = state.pilotScale.toFixed(4)
      mount.dataset.pilotPosition = state.pilotPosition.map(n => n.toFixed(4)).join(",")
      mount.dataset.shipPosition = state.shipPosition.map(n => n.toFixed(4)).join(",")
      mount.dataset.footClearance = state.footClearance.toFixed(4)
    }
    function draw() {
      if (!ready || disposed || !visible || document.hidden) return
      renderer.render(scene, camera)
      mount.dataset.frame = String(Number(mount.dataset.frame || 0) + 1)
      mount.dataset.angle = controls.getAzimuthalAngle().toFixed(4)
      mount.dataset.cameraTarget = controls.target.toArray().map(n => n.toFixed(4)).join(",")
      mount.dataset.viewSpan = (camera.top - camera.bottom).toFixed(4)
    }
    function tick(now) {
      frame = 0
      if (!ready || disposed || !visible || !active || document.hidden) return
      if (!last || now - last >= 1000 / 30) {
        elapsed += last ? Math.min((now - last) / 1000, .1) : 0
        last = now; pose(); draw()
      }
      frame = requestAnimationFrame(tick)
    }
    function resume() {
      cancelAnimationFrame(frame); frame = 0; last = 0
      mount.dataset.playing = String(active)
      mount.dataset.running = String(ready && active && visible && !document.hidden)
      draw()
      if (ready && active && visible && !disposed && !document.hidden) frame = requestAnimationFrame(tick)
    }
    function project() {
      const aspect = viewportWidth / viewportHeight, span = Math.max(frameHeight, frameWidth / aspect) * 1.22
      camera.left = -span * aspect / 2; camera.right = span * aspect / 2
      camera.top = span / 2; camera.bottom = -span / 2; camera.updateProjectionMatrix()
    }
    function resize() {
      if (!renderer || disposed) return
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      viewportWidth = width; viewportHeight = height; project()
      renderer.setSize(width, height, false); draw()
    }
    function motionChanged(event) {
      active = !event.matches
      if (event.matches) { elapsed = MOON_WAVE_STILL; pose() }
      resume()
    }
    function fail(error) {
      if (disposed || request.signal.aborted) return
      ready = false; cancelAnimationFrame(frame); setStatus("error")
      mount.dataset.running = "false"
      controls?.dispose(); release()
      console.error("About Moon landing unavailable", error)
    }
    const contextLost = event => { event.preventDefault(); fail(new Error("WebGL context lost")) }
    function keydown(event) {
      if (!ready || !["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return
      event.preventDefault()
      if (event.key === "Home") { controls.reset(); pose() }
      else {
        const offset = camera.position.clone().sub(controls.target)
        const spherical = new THREE.Spherical().setFromVector3(offset)
        spherical.theta += event.key === "ArrowLeft" ? -.06 : .06
        camera.position.copy(controls.target).add(offset.setFromSpherical(spherical)); controls.update()
      }
      draw()
    }
    async function initialize() {
      started = true
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" })
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.25 : 1.5))
        renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .86
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap
        const canvas = renderer.domElement
        canvas.setAttribute("role", "img")
        canvas.setAttribute("aria-label", "A spacecraft lands on the Moon, opens its canopy, and an astronaut jumps out, walks forward and waves. Drag or use left and right arrow keys to change the view; Home resets it.")
        canvas.tabIndex = 0; canvas.addEventListener("keydown", keydown)
        canvas.addEventListener("webglcontextlost", contextLost); mount.appendChild(canvas)
        const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment()
        try { environment = pmrem.fromScene(room, .04, .1, 100, { size: 128 }) } finally { room.dispose(); pmrem.dispose() }
        scene.environment = environment.texture; scene.environmentIntensity = .22
        scene.add(new THREE.AmbientLight(0xb1a7cc, .5))
        keyLight = new THREE.DirectionalLight(0xfff1df, 3.2)
        keyLight.position.set(-7, 12, 9); keyLight.castShadow = true
        keyLight.shadow.mapSize.set(1024, 1024)
        Object.assign(keyLight.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: .1, far: 55 })
        keyLight.shadow.normalBias = .025; keyLight.shadow.bias = -.0001
        scene.add(keyLight)
        const rim = new THREE.DirectionalLight(0x98cde9, 1.05); rim.position.set(6, 5, -5); scene.add(rim)
        scene.add(createExpeditionStars({ orthographic: true }))
        const crew = CREWS[0]
        const results = await Promise.allSettled([
          loadCrew({ ...crew, asset: crew.missionAsset, spacecraft: crew.missionSpacecraft }, request.signal),
          createPlanetSurface("moon", renderer, request.signal),
        ])
        const failure = results.find(result => result.status === "rejected")
        if (disposed || failure) {
          if (results[0].status === "fulfilled") {
            disposeModel(results[0].value.astronaut.scene); disposeModel(results[0].value.spacecraft.scene)
          }
          if (results[1].status === "fulfilled") disposeModel(results[1].value.group)
          if (failure) throw failure.reason
          return
        }
        const [{ astronaut, spacecraft }, surface] = results.map(result => result.value)
        // Rotate away from the texture's pole and frame a patch of the shared cratered mesh.
        surface.group.scale.setScalar(7.5); surface.group.rotation.set(.38, .3, -.7)
        surface.group.position.y = -16.1; scene.add(surface.group)
        scene.add(astronaut.scene, spacecraft.scene)
        try { mission = createAboutMoonMission({ astronaut, spacecraft, moon: surface.mesh, crew }) }
        catch (error) { scene.add(astronaut.scene, spacecraft.scene); throw error }
        scene.add(mission.root)
        mount.dataset.terrain = surface.group.userData.albedo
        camera.position.set(7, 6, 14); camera.lookAt(0, 1.2, 0)
        camera.updateMatrixWorld(true)
        // Project the complete animation envelope, including the open canopy and raised hand.
        const envelope = new THREE.Box3(), finalEnvelope = new THREE.Box3(), corner = new THREE.Vector3()
        for (const time of [0, 2.6, 5.2, 7.2, 8.8, 10.4, 13.4, 16.4, MOON_WAVE_STILL, 20.4]) {
          mission.poseAt(time)
          for (const object of [mission.ship, ...(time >= 7.2 ? [mission.pilot] : [])]) {
            const box = new THREE.Box3().setFromObject(object, true)
            for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
              envelope.expandByPoint(corner.set(x, y, z).applyMatrix4(camera.matrixWorldInverse))
              if (time >= 16.4) finalEnvelope.expandByPoint(corner)
            }
          }
        }
        const measure = box => {
          const shift = box.getCenter(new THREE.Vector3()); shift.z = 0; shift.applyQuaternion(camera.quaternion)
          return { width: box.max.x - box.min.x, height: box.max.y - box.min.y,
            target: new THREE.Vector3(0, 1.2, 0).add(shift) }
        }
        framing = { flight: measure(envelope), final: measure(finalEnvelope) }
        const target = framing.flight.target
        camera.position.add(target.clone().sub(new THREE.Vector3(0, 1.2, 0)))
        controls = new OrbitControls(camera, canvas); controls.target.copy(target)
        canvas.style.touchAction = "pan-y"
        controls.enableZoom = false; controls.enablePan = false; controls.rotateSpeed = .3
        controls.update()
        const azimuth = controls.getAzimuthalAngle(), polar = controls.getPolarAngle()
        controls.minAzimuthAngle = azimuth - .16; controls.maxAzimuthAngle = azimuth + .16
        controls.minPolarAngle = polar - .05; controls.maxPolarAngle = polar + .05
        controls.saveState(); controls.addEventListener("change", draw)
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount); resize()
        warming = true
        try {
          mission.poseAt(8.4); await warmScene(renderer, scene, camera)
          mission.poseAt(MOON_WAVE_STILL); await warmScene(renderer, scene, camera)
        } finally { warming = false; if (disposed) release() }
        if (disposed) return
        pose(); renderer.render(scene, camera)
        ready = true; setStatus("ready"); resume()
      } catch (error) { fail(error) }
    }
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; mount.dataset.visible = String(visible)
      if (visible && !started) initialize()
      resume()
    })
    const preloader = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started) initialize()
    }, { rootMargin: "180px" })
    observer.observe(mount); preloader.observe(mount)
    document.addEventListener("visibilitychange", resume); preference.addEventListener("change", motionChanged)
    return () => {
      disposed = true; ready = false; request.abort(); cancelAnimationFrame(frame)
      observer.disconnect(); preloader.disconnect(); resizeObserver?.disconnect(); controls?.dispose()
      document.removeEventListener("visibilitychange", resume); preference.removeEventListener("change", motionChanged)
      renderer?.domElement.removeEventListener("keydown", keydown)
      renderer?.domElement.removeEventListener("webglcontextlost", contextLost); renderer?.domElement.remove()
      if (!warming) release()
    }
  }, [attempt])
  return <div className={`${styles.world} ${className}`} data-about-moon data-about-moon-landing data-status={status}>
    <div ref={mountRef} className={styles.surface} data-about-moon-surface data-ready={status === "ready"} />
    {status === "loading" && <div className={styles.loading} role="status" aria-label="Loading Moon landing"><span /></div>}
    {status === "error" && <div className={styles.error} role="status"><p>Moon landing unavailable.</p><button className={styles.retry} type="button" onClick={() => setAttempt(value => value + 1)}>Retry loading</button></div>}
  </div>
}
