import React, { useEffect, useRef, useState } from "react"
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded"
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { createPlanetSurface } from "./MoonMesh"
import { CREWS, SHIP_ROOT } from "./space/flightCrews"
import { loadCrewModel, disposeModel, warmScene, delay } from "./space/crewAssets"
import { createSpacecraftMotion } from "./space/spacecraftMotion"
import { createCruiseExhaust } from "./space/cruiseExhaust"
import { createExpeditionStars } from "./space/expeditionStars"
import { poseApproachFlight } from "./space/homeFlightMotion"
import styles from "../styles/approach-flight.module.css"

export default function ApproachFlight() {
  const mountRef = useRef(null), apiRef = useRef(null), selectedRef = useRef(0)
  const [selected, setSelected] = useState(0), [status, setStatus] = useState("loading")
  const [attempt, setAttempt] = useState(0)
  selectedRef.current = selected
  useEffect(() => {
    const mount = mountRef.current, request = new AbortController()
    const motionQuery = matchMedia("(prefers-reduced-motion: reduce)")
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1, .1, 450)
    const home = new THREE.Vector3(5, 3, -13)
    camera.layers.enable(1)
    camera.position.copy(home)
    let renderer, controls, environment, resizeObserver, observer, ship, shipMotion, exhaust, planets
    let disposed = false, started = false, ready = false, visible = false, playing = !motionQuery.matches
    let frame = 0, last = 0, time = 0, warmCount = 0, released = false, selection = 0
    const starFields = []
    const shipForward = new THREE.Vector3()
    setStatus("loading")
    const release = () => {
      if (released || warmCount) return
      released = true; disposeModel(scene); environment?.dispose()
      renderer?.dispose(); renderer?.forceContextLoss()
    }
    const pose = delta => {
      if (!planets) return
      const [earth, moon, mars] = planets
      earth.mesh.rotation.y = time * .022; mars.mesh.rotation.y = time * .012
      moon.group.position.set(Math.cos(time * .13) * 12, Math.sin(time * .13) * 2, -88 + Math.sin(time * .13) * 12)
      moon.mesh.rotation.y = -time * .13
      starFields.forEach(field => { field.position.z = -30 * Math.sin(time * .035) })
      shipMotion?.update(delta); exhaust?.update(delta, 1)
      if (ship) {
        poseApproachFlight(ship, time, mars.group.position)
        mount.dataset.shipPosition = ship.position.toArray().map(n => n.toFixed(4)).join(",")
        mount.dataset.shipAttitude = ship.rotation.toArray().slice(0, 3).map(n => n.toFixed(4)).join(",")
        mount.dataset.shipForward = shipForward.set(0, 0, 1).applyQuaternion(ship.quaternion).toArray().map(n => n.toFixed(7)).join(",")
        mount.dataset.marsPosition = mars.group.position.toArray().join(",")
      }
      mount.dataset.time = time.toFixed(3)
      mount.dataset.moonPosition = moon.group.position.toArray().map(n => n.toFixed(3)).join(",")
    }
    const draw = () => {
      if (!ready || disposed || !visible || document.hidden) return
      renderer.render(scene, camera)
      mount.dataset.frame = String(Number(mount.dataset.frame || 0) + 1)
      mount.dataset.azimuth = controls.getAzimuthalAngle().toFixed(4)
      for (const [name, planet] of [["earth", planets[0]], ["mars", planets[2]]]) {
        const point = planet.group.position.clone().project(camera)
        mount.dataset[`${name}Visible`] = String(Math.abs(point.x) < 1 && Math.abs(point.y) < 1 && point.z > -1 && point.z < 1)
      }
    }
    const tick = now => {
      frame = 0
      if (!ready || disposed || !visible || document.hidden || !playing) return
      if (!last || now - last >= 1000 / 30) {
        const delta = last ? Math.min((now - last) / 1000, .1) : 0
        last = now; time += delta; pose(delta); draw()
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
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      camera.aspect = width / height; camera.updateProjectionMatrix()
      renderer.setSize(width, height, false); draw()
    }
    const fail = error => {
      if (disposed || request.signal.aborted) return
      ready = false; cancelAnimationFrame(frame); setStatus("error")
      console.error("Approach flight unavailable", error)
    }
    const select = async index => {
      const generation = ++selection, crew = CREWS[index]
      let pending, previous
      ready = false; setStatus("loading"); cancelAnimationFrame(frame)
      try {
        await delay(ship && !motionQuery.matches ? 220 : 0, request.signal)
        pending = await loadCrewModel(SHIP_ROOT + crew.missionSpacecraft, request.signal)
        if (disposed || generation !== selection) { disposeModel(pending.scene); return }
        const nextMotion = createSpacecraftMotion(pending)
        nextMotion.select("Cruise", true)
        const nextExhaust = createCruiseExhaust(pending.scene, crew.id)
        nextExhaust.update(0, 1)
        // Preserve each rig's origin so nozzle attachments and folded landing gear stay aligned.
        pending.scene.scale.setScalar(.75)
        previous = ship
        if (previous) scene.remove(previous)
        scene.add(pending.scene)
        warmCount++
        try { await warmScene(renderer, scene, camera) } finally { warmCount--; if (disposed) release() }
        if (previous) { disposeModel(previous); previous = null }
        if (disposed) return
        ship = pending.scene; pending = null; shipMotion = nextMotion; exhaust = nextExhaust
        pose(0); renderer.render(scene, camera)
        mount.dataset.ship = crew.id
        ready = true; setStatus("ready"); resume()
      } catch (error) {
        if (pending) { scene.remove(pending.scene); disposeModel(pending.scene) }
        if (previous) { scene.add(previous); ship = previous }
        fail(error)
      }
    }
    const lost = event => { event.preventDefault(); fail(new Error("WebGL context lost")) }
    const motionChanged = event => { playing = !event.matches; resume() }
    const keydown = event => {
      if (!ready) return
      if (event.key === "Home") { camera.position.copy(home); controls.target.set(0, 0, 0) }
      else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target))
        spherical.theta += event.key === "ArrowLeft" ? -.16 : event.key === "ArrowRight" ? .16 : 0
        spherical.phi = THREE.MathUtils.clamp(spherical.phi + (event.key === "ArrowUp" ? -.12 : event.key === "ArrowDown" ? .12 : 0), .25, Math.PI - .25)
        camera.position.setFromSpherical(spherical).add(controls.target)
      } else return
      event.preventDefault(); controls.update(); draw()
    }
    const initialize = async () => {
      started = true
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" })
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1.15 : 1.4))
        renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .8
        const canvas = renderer.domElement
        canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", "Spacecraft cruising toward Mars, with Earth and its orbiting Moon behind it")
        canvas.tabIndex = 0; canvas.style.touchAction = "pan-y"
        canvas.addEventListener("webglcontextlost", lost); canvas.addEventListener("keydown", keydown)
        mount.appendChild(canvas)
        controls = new OrbitControls(camera, canvas)
        controls.enableZoom = false; controls.enablePan = false; controls.rotateSpeed = .55
        controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI - .25
        controls.addEventListener("change", draw); controls.update()
        const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment()
        try { environment = pmrem.fromScene(room, .04, .1, 100, { size: 128 }) } finally { room.dispose(); pmrem.dispose() }
        scene.environment = environment.texture; scene.environmentIntensity = .16
        scene.add(new THREE.AmbientLight(0x8fa7c8, .38))
        for (const [color, intensity, position] of [[0xffefd6, 3.5, [-15, 18, -10]], [0x67cfff, 1.15, [8, 3, 8]], [0x9683ea, .24, [0, -8, -5]]]) {
          const light = new THREE.DirectionalLight(color, intensity); light.position.set(...position); scene.add(light)
        }
        // Even after 60 units of cruise drift, every star stays beyond the planets.
        const field = createExpeditionStars({ shellRadius: 240 })
        scene.add(field); starFields.push(field)
        mount.dataset.starShellMinimum = "180"
        const planetAmbient = new THREE.AmbientLight(0xb8bdc5, .5)
        const planetSun = new THREE.DirectionalLight(0xffe9dc, 1.7)
        planetSun.position.set(-15, 18, -10)
        for (const light of [planetAmbient, planetSun]) { light.layers.set(1); scene.add(light) }
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(mount); resize()
        // Reuse cached splash textures; distant Mars does not need a 4K source.
        const results = await Promise.allSettled(["earth", "moon", "mars"].map(name => createPlanetSurface(name, renderer, request.signal, {
          albedoSrc: `/home/splash/${name}-color.webp`, heightSrc: `/home/splash/${name}-height.webp`,
        })))
        const failed = results.find(result => result.status === "rejected")
        if (disposed || failed) {
          results.forEach(result => { if (result.status === "fulfilled") disposeModel(result.value.group) })
          if (failed) throw failed.reason
          return
        }
        planets = results.map(result => result.value)
        for (const [index, radius, position] of [[0, 7, [0, 0, -88]], [1, 1.9, [12, 0, -88]], [2, 5, [0, 0, 82]]]) {
          const planet = planets[index]
          planet.group.traverse(object => { object.layers.set(1) })
          planet.mesh.material.envMapIntensity = 0
          planet.mesh.material.transparent = false
          planet.mesh.material.depthWrite = true
          if (index === 2) {
            const previous = planet.mesh.material
            planet.mesh.material = new THREE.MeshLambertMaterial({ map: previous.map, bumpMap: previous.bumpMap,
              bumpScale: previous.bumpScale * .4, color: 0xffffff, transparent: false, depthWrite: true })
            // The source map contains pale patches that read as glare at this distant scale.
            planet.mesh.material.onBeforeCompile = shader => {
              shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
                #include <map_fragment>
                float terrainLight = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
                vec3 dustHighlight = vec3(0.22, 0.085, 0.035) * (1.0 + terrainLight * 0.15);
                diffuseColor.rgb = mix(diffuseColor.rgb, dustHighlight, smoothstep(0.2, 0.65, terrainLight));
              `)
            }
            planet.mesh.material.customProgramCacheKey = () => "approach-matte-mars-v1"
            previous.dispose()
            planet.group.children.filter(child => child !== planet.mesh).forEach(child => { child.visible = false })
          }
          planet.mesh.geometry.computeBoundingSphere()
          planet.group.scale.setScalar(radius / planet.mesh.geometry.boundingSphere.radius)
          planet.group.position.set(...position); scene.add(planet.group)
        }
        mount.dataset.planetSurface = planets.every(planet => !planet.mesh.material.transparent && planet.mesh.material.depthWrite && planet.mesh.material.depthTest) ? "opaque" : "translucent"
        mount.dataset.marsMaterial = planets[2].mesh.material.type
        pose(0)
        apiRef.current = { select }
        await select(selectedRef.current)
      } catch (error) { fail(error) }
    }
    observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; mount.dataset.visible = String(visible)
      if (visible && !started) initialize()
      resume()
    }, { rootMargin: "120px" })
    observer.observe(mount)
    document.addEventListener("visibilitychange", resume); motionQuery.addEventListener("change", motionChanged)
    return () => {
      disposed = true; ready = false; request.abort(); selection++; apiRef.current = null
      cancelAnimationFrame(frame); observer.disconnect(); resizeObserver?.disconnect(); controls?.dispose()
      document.removeEventListener("visibilitychange", resume); motionQuery.removeEventListener("change", motionChanged)
      renderer?.domElement.removeEventListener("webglcontextlost", lost); renderer?.domElement.removeEventListener("keydown", keydown)
      renderer?.domElement.remove(); release()
    }
  }, [attempt])
  useEffect(() => { apiRef.current?.select(selected) }, [selected])
  const choose = direction => setSelected(value => (value + direction + CREWS.length) % CREWS.length)
  return <div className={styles.flight} data-approach-flight data-status={status}>
    <div className={styles.stage}>
      <div className={styles.surface} ref={mountRef} data-flight-surface data-ready={status === "ready"} />
      {status === "loading" && <div className={styles.loading} role="status" aria-label="Loading spacecraft flight"><span /></div>}
      {status === "error" && <div className={styles.error}><p>The flight could not load.</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Retry flight</button></div>}
    </div>
    <div className={styles.toolbar}>
      <button type="button" disabled={status !== "ready"} title="Previous spacecraft" aria-label="Previous spacecraft" onClick={() => choose(-1)}><ArrowBackRoundedIcon /></button>
      <span className={styles.shipName} aria-live="polite">{CREWS[selected].ship}</span>
      <button type="button" disabled={status !== "ready"} title="Next spacecraft" aria-label="Next spacecraft" onClick={() => choose(1)}><ArrowForwardRoundedIcon /></button>
    </div>
  </div>
}
