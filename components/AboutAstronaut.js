import React, { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { ASSET_ROOT, CREWS } from "./space/flightCrews"
import { loadCrewModel, disposeModel } from "./space/crewAssets"
import { createExpeditionStars } from "./space/expeditionStars"
import styles from "../styles/about-moon-landing.module.css"

export default function AboutAstronaut() {
  const mountRef = useRef(null)
  const [status, setStatus] = useState("loading"), [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const mount = mountRef.current, request = new AbortController()
    const preference = matchMedia("(prefers-reduced-motion: reduce)")
    const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-2, 2, 2, -2, .1, 100)
    const pilot = new THREE.Group(); scene.add(pilot)
    let renderer, controls, environment, mixer, model, observer, resizeObserver
    let disposed = false, visible = false, frame = 0, last = 0, elapsed = 0, span = 4
    setStatus("loading")
    const draw = () => {
      if (disposed || !model || !visible || document.hidden) return
      renderer.render(scene, camera)
      mount.dataset.angle = controls.getAzimuthalAngle().toFixed(4)
    }
    const tick = now => {
      frame = 0
      if (disposed || !visible || document.hidden || preference.matches) return
      const delta = last ? Math.min((now - last) / 1000, .05) : 0
      last = now; elapsed += delta; mixer?.update(delta)
      pilot.position.y = Math.sin(elapsed * .7) * .055
      pilot.rotation.z = -.08 + Math.sin(elapsed * .45) * .025
      draw(); frame = requestAnimationFrame(tick)
    }
    const resume = () => {
      cancelAnimationFrame(frame); last = 0; draw()
      if (model && visible && !document.hidden && !preference.matches) frame = requestAnimationFrame(tick)
    }
    const resize = () => {
      if (!renderer || disposed) return
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      const aspect = width / height, view = Math.max(span, span * .7 / aspect)
      camera.left = -view * aspect / 2; camera.right = view * aspect / 2
      camera.top = view / 2; camera.bottom = -view / 2; camera.updateProjectionMatrix()
      renderer.setSize(width, height, false); draw()
    }
    const keydown = event => {
      if (!controls || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key)) return
      event.preventDefault()
      if (event.key === "Home") controls.reset()
      else {
        const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target))
        if (event.key === "ArrowLeft") spherical.theta -= .15
        if (event.key === "ArrowRight") spherical.theta += .15
        if (event.key === "ArrowUp") spherical.phi -= .15
        if (event.key === "ArrowDown") spherical.phi += .15
        spherical.makeSafe(); camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); controls.update()
      }
      draw()
    }
    const fail = error => { if (!disposed) { cancelAnimationFrame(frame); setStatus("error"); console.error("About astronaut unavailable", error) } }
    const lost = event => { event.preventDefault(); fail(new Error("WebGL context lost")) }
    async function initialize() {
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" })
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
        renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping
        const canvas = renderer.domElement
        canvas.tabIndex = 0; canvas.setAttribute("role", "img")
        canvas.setAttribute("aria-label", "Astronaut floating among stars. Drag to rotate around the astronaut, or use the arrow keys. Home resets the view.")
        canvas.style.touchAction = "none"
        canvas.addEventListener("keydown", keydown); canvas.addEventListener("webglcontextlost", lost); mount.appendChild(canvas)
        const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment()
        try { environment = pmrem.fromScene(room, .04) } finally { room.dispose(); pmrem.dispose() }
        scene.environment = environment.texture; scene.environmentIntensity = .35
        scene.add(new THREE.AmbientLight(0xb1bde8, .9))
        const key = new THREE.DirectionalLight(0xfff1df, 3); key.position.set(-4, 6, 8); scene.add(key)
        const rim = new THREE.DirectionalLight(0x9bc9ff, 2); rim.position.set(5, 2, -5); scene.add(rim)
        const stars = createExpeditionStars({ orthographic: true }); stars.material.size = 1.6; stars.material.sizeAttenuation = false; camera.add(stars); scene.add(camera)
        const asset = await loadCrewModel(ASSET_ROOT + CREWS[0].asset, request.signal)
        if (disposed) { disposeModel(asset.scene); return }
        model = asset.scene; pilot.add(model)
        mixer = new THREE.AnimationMixer(model)
        const clip = asset.animations.find(item => /float/i.test(item.name)) || asset.animations[0]
        if (clip) { mixer.clipAction(clip).play(); mixer.update(.1) }
        model.updateMatrixWorld(true)
        const box = new THREE.Box3().setFromObject(model, true), size = box.getSize(new THREE.Vector3())
        model.position.sub(box.getCenter(new THREE.Vector3()))
        span = Math.max(size.y, size.x) * 1.3
        pilot.rotation.z = -.08
        camera.position.set(0, 0, 12)
        controls = new OrbitControls(camera, canvas)
        controls.enablePan = false; controls.enableZoom = false; controls.rotateSpeed = .65
        controls.update(); controls.saveState(); controls.addEventListener("change", draw)
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount); resize()
        setStatus("ready"); resume()
      } catch (error) { if (!request.signal.aborted) fail(error) }
    }
    observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; resume() }); observer.observe(mount)
    document.addEventListener("visibilitychange", resume); preference.addEventListener("change", resume)
    initialize()
    return () => {
      disposed = true; request.abort(); cancelAnimationFrame(frame); observer.disconnect(); resizeObserver?.disconnect()
      document.removeEventListener("visibilitychange", resume); preference.removeEventListener("change", resume)
      controls?.dispose(); mixer?.stopAllAction(); if (model) mixer?.uncacheRoot(model)
      renderer?.domElement.removeEventListener("keydown", keydown); renderer?.domElement.removeEventListener("webglcontextlost", lost)
      disposeModel(scene); environment?.dispose(); renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove()
    }
  }, [attempt])
  return <div className={styles.world} data-about-astronaut data-status={status}>
    <div ref={mountRef} className={styles.surface} data-ready={status === "ready"} />
    {status === "loading" && <div className={styles.loading} role="status" aria-label="Loading astronaut"><span /></div>}
    {status === "error" && <div className={styles.error} role="status"><p>Astronaut unavailable.</p><button className={styles.retry} onClick={() => setAttempt(value => value + 1)}>Retry loading</button></div>}
  </div>
}
