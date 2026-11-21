import React, { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { ASSET_ROOT, SHIP_ROOT, CREWS } from "./space/flightCrews"
import { loadCrewModel, disposeModel, warmScene } from "./space/crewAssets"
import { createSpacecraftMotion } from "./space/spacecraftMotion"
import { departureProgress } from "./space/homeFlightMotion"
import { astronautRevealAt, createAstronautReveal } from "./space/astronautReveal"
import styles from "../styles/contact-astronaut.module.css"

export default function ContactAstronaut() {
  const mountRef = useRef(null)
  const [status, setStatus] = useState("loading"), [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const mount = mountRef.current, request = new AbortController()
    const motion = matchMedia("(prefers-reduced-motion: reduce)")
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 40)
    let renderer, environment, model, mixer, shipMotion, reveal, controls, observer, preloadObserver, resizeObserver
    const formation = new THREE.Group(), pilot = new THREE.Group(), ship = new THREE.Group()
    formation.add(ship, pilot); scene.add(formation)
    const cockpitFloor = new THREE.Plane(new THREE.Vector3(0, 1, 0), -.5)
    const cockpit = new THREE.Vector3(...CREWS[0].cockpit).multiplyScalar(.55)
    const exitPath = new THREE.CubicBezierCurve3(
      new THREE.Vector3(cockpit.x, -.95, cockpit.z),
      new THREE.Vector3(cockpit.x, 1.2, cockpit.z),
      new THREE.Vector3(-.25, 1.9, 1.15),
      new THREE.Vector3(-.45, 1.85, 1.3),
    )
    let disposed = false, started = false, ready = false, visible = false, playing = !motion.matches, warming = false
    let frame = 0, last = 0, elapsed = 0, width = 2, height = 3
    setStatus("loading")
    const release = () => {
      mixer?.stopAllAction()
      if (model) mixer?.uncacheRoot(model)
      disposeModel(scene); environment?.dispose(); renderer?.dispose(); renderer?.forceContextLoss()
    }
    const pose = time => {
      if (!shipMotion) return
      const { canopy, exit, hover } = departureProgress(time)
      shipMotion.pose(0, canopy)
      const entrance = astronautRevealAt(time, 3.6, 3.5)
      pilot.visible = entrance.opacity > 0
      pilot.scale.setScalar(.8 * entrance.scale)
      reveal?.(entrance.opacity)
      exitPath.getPoint(exit, pilot.position)
      pilot.position.y += Math.sin((time - 8.6) * .85) * .1 * hover
      pilot.rotation.set(-.08 * exit, -.18 + Math.sin(time * .4) * .08 * hover, Math.sin(time * .65) * .055 * hover)
      formation.position.y = Math.sin(time * .5) * .035
      cockpitFloor.constant = -(.5 + formation.position.y)
      mount.dataset.canopy = canopy.toFixed(4)
      mount.dataset.exit = exit.toFixed(4)
      mount.dataset.pilotOpacity = entrance.opacity.toFixed(4)
      mount.dataset.pilotScale = pilot.scale.x.toFixed(4)
      mount.dataset.phase = exit >= 1 ? "hovering" : time >= 3.6 ? "emerging" : canopy > 0 ? "opening" : "closed"
      mount.dataset.pilotPosition = pilot.position.toArray().map(n => n.toFixed(4)).join(",")
    }
    const draw = () => {
      if (!ready || !visible || disposed || document.hidden) return
      renderer.render(scene, camera)
      mount.dataset.frame = String(Number(mount.dataset.frame || 0) + 1)
      mount.dataset.time = elapsed.toFixed(3)
      mount.dataset.angle = controls.getAzimuthalAngle().toFixed(4)
    }
    const viewChanged = () => {
      // Leave more room for the ship's length when looking down or up along the hull.
      const elevation = Math.abs(Math.cos(controls.getPolarAngle()))
      const zoom = 1 / (1 + .22 * THREE.MathUtils.smoothstep(elevation, .35, .86))
      if (camera.zoom !== zoom) { camera.zoom = zoom; camera.updateProjectionMatrix() }
      draw()
    }
    const tick = now => {
      frame = 0
      if (!ready || !visible || disposed || !playing || document.hidden) return
      if (!last || now - last >= 1000 / 30) {
        const delta = last ? Math.min((now - last) / 1000, .1) : 0
        last = now; elapsed += delta; mixer.update(delta); pose(elapsed); draw()
      }
      frame = requestAnimationFrame(tick)
    }
    const resume = () => {
      cancelAnimationFrame(frame); last = 0; mount.dataset.playing = String(playing)
      draw()
      if (ready && visible && playing && !disposed && !document.hidden) frame = requestAnimationFrame(tick)
    }
    const resize = () => {
      if (!renderer || disposed) return
      const bounds = mount.getBoundingClientRect()
      if (!bounds.width || !bounds.height) return
      const aspect = bounds.width / bounds.height, span = Math.max(height, width / aspect) * 1.08
      camera.left = -span * aspect / 2; camera.right = span * aspect / 2
      camera.top = span / 2; camera.bottom = -span / 2; camera.updateProjectionMatrix()
      renderer.setSize(bounds.width, bounds.height, false); draw()
    }
    const fail = error => {
      if (disposed || request.signal.aborted) return
      ready = false; cancelAnimationFrame(frame); setStatus("error")
      console.error("Contact spacecraft unavailable", error)
    }
    const lost = event => { event.preventDefault(); fail(new Error("WebGL context lost")) }
    const motionChanged = event => {
      playing = !event.matches
      if (ready && !playing) { elapsed = Math.max(elapsed, 11); mixer.setTime(2); pose(elapsed) }
      resume()
    }
    const keydown = event => {
      if (!ready || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key)) return
      event.preventDefault()
      if (event.key === "Home") controls.reset()
      else {
        const offset = camera.position.clone().sub(controls.target), spherical = new THREE.Spherical().setFromVector3(offset)
        if (event.key === "ArrowLeft") spherical.theta -= .15
        if (event.key === "ArrowRight") spherical.theta += .15
        if (event.key === "ArrowUp") spherical.phi -= .1
        if (event.key === "ArrowDown") spherical.phi += .1
        spherical.phi = THREE.MathUtils.clamp(spherical.phi, .55, Math.PI - .55)
        camera.position.copy(controls.target).add(offset.setFromSpherical(spherical)); controls.update()
      }
      draw()
    }
    const initialize = async () => {
      started = true
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" })
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.15 : 1.4))
        renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.localClippingEnabled = true
        renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .8
        renderer.domElement.setAttribute("role", "img")
        renderer.domElement.setAttribute("aria-label", "Pioneer spacecraft opening its cockpit as an astronaut floats out and hovers above it. Drag or use arrow keys to rotate; Home resets the view.")
        renderer.domElement.tabIndex = 0
        renderer.domElement.addEventListener("keydown", keydown)
        controls = new OrbitControls(camera, renderer.domElement)
        controls.enableZoom = false; controls.enablePan = false; controls.rotateSpeed = .55
        controls.minPolarAngle = .55; controls.maxPolarAngle = Math.PI - .55
        controls.addEventListener("change", viewChanged)
        renderer.domElement.addEventListener("webglcontextlost", lost); mount.appendChild(renderer.domElement)
        const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment()
        try { environment = pmrem.fromScene(room, .04, .1, 100, { size: 128 }) } finally { room.dispose(); pmrem.dispose() }
        scene.environment = environment.texture; scene.environmentIntensity = .14
        scene.add(new THREE.AmbientLight(0x8fa7c8, .4))
        for (const [color, intensity, position] of [[0xffefd6, 3.2, [-3, 4, 5]], [0x67cfff, 1.1, [4, 2, -3]], [0x9683ea, .24, [0, -2, 3]]]) {
          const light = new THREE.DirectionalLight(color, intensity); light.position.set(...position); scene.add(light)
        }
        const results = await Promise.allSettled([
          loadCrewModel(ASSET_ROOT + CREWS[0].missionAsset, request.signal),
          loadCrewModel(SHIP_ROOT + CREWS[0].missionSpacecraft, request.signal),
        ])
        const failed = results.find(result => result.status === "rejected")
        if (disposed || failed) {
          results.forEach(result => { if (result.status === "fulfilled") disposeModel(result.value.scene) })
          if (failed) throw failed.reason
          return
        }
        const [gltf, spacecraft] = results.map(result => result.value)
        model = gltf.scene; pilot.scale.setScalar(.8); pilot.add(model)
        reveal = createAstronautReveal(model)
        // Conceal the seated portion of the suit below the cabin while it clears the hatch.
        model.traverse(object => {
          for (const material of (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean)) {
            material.clippingPlanes = [cockpitFloor]
          }
        })
        ship.scale.setScalar(.55); ship.add(spacecraft.scene)
        shipMotion = createSpacecraftMotion(spacecraft)
        mixer = new THREE.AnimationMixer(model)
        const source = THREE.AnimationClip.findByName(gltf.animations, "Float")
        if (!source) throw new Error("Missing astronaut float animation")
        const clip = new THREE.AnimationClip("ContactFloat", source.duration, source.tracks.filter(track => track.name !== "Root.position"))
        mixer.clipAction(clip).setLoop(THREE.LoopRepeat, Infinity).play()
        // Frame the open canopy and final floating pose, including the full reach of the rig.
        const bounds = new THREE.Box3()
        for (let i = 0; i <= 8; i++) {
          pose(11 + i); mixer.setTime(clip.duration * i / 8); formation.updateMatrixWorld(true)
          bounds.union(new THREE.Box3().setFromObject(formation, true))
        }
        const center = bounds.getCenter(new THREE.Vector3())
        const reach = Math.max(Math.abs(bounds.min.x - center.x), Math.abs(bounds.max.x - center.x))
        const depth = Math.max(Math.abs(bounds.min.z - center.z), Math.abs(bounds.max.z - center.z))
        width = Math.hypot(reach, depth) * 2
        height = Math.hypot(bounds.max.y - bounds.min.y, width * .45)
        camera.position.copy(center).add(new THREE.Vector3(6, 3.2, 10))
        controls.target.copy(center); controls.update(); controls.saveState()
        elapsed = playing ? 0 : 11
        mixer.setTime(2); pose(11); formation.updateMatrixWorld(true)
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount); resize()
        warming = true
        try {
          pose(5.4); await warmScene(renderer, scene, camera)
          pose(11); await warmScene(renderer, scene, camera)
        } finally { warming = false; if (disposed) release() }
        if (disposed) return
        pose(elapsed)
        renderer.render(scene, camera); ready = true; setStatus("ready"); resume()
      } catch (error) { fail(error) }
    }
    preloadObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !started) initialize()
    }, { rootMargin: "180px" })
    preloadObserver.observe(mount)
    observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; mount.dataset.visible = String(visible)
      if (visible && !started) initialize()
      resume()
    })
    observer.observe(mount)
    document.addEventListener("visibilitychange", resume); motion.addEventListener("change", motionChanged)
    return () => {
      disposed = true; ready = false; request.abort(); cancelAnimationFrame(frame)
      observer.disconnect(); preloadObserver.disconnect(); resizeObserver?.disconnect(); controls?.dispose()
      document.removeEventListener("visibilitychange", resume); motion.removeEventListener("change", motionChanged)
      renderer?.domElement.removeEventListener("webglcontextlost", lost)
      renderer?.domElement.removeEventListener("keydown", keydown); renderer?.domElement.remove()
      if (!warming) release()
    }
  }, [attempt])
  return <div className={styles.world} data-contact-astronaut data-status={status}>
    <div ref={mountRef} className={styles.surface} data-contact-astronaut-surface data-ready={status === "ready"} />
    {status === "loading" && <div className={styles.loading} role="status" aria-label="Loading spacecraft and astronaut"><span /></div>}
    {status === "error" && <button type="button" className={styles.retry} onClick={() => setAttempt(value => value + 1)}>Retry spacecraft</button>}
  </div>
}
