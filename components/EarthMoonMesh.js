import React, { useEffect, useRef } from "react"
import { Box } from "@mui/material"
import * as THREE from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { createExpeditionStars } from "./space/expeditionStars"
import { EARTH_MOON_TEXTURES } from "../lib/earthMoonAssets"

const TAU = Math.PI * 2
const EARTH_RADIUS = 2.15
const EARTH_MEAN_RADIUS_KM = 6371.0084
const MOON_MEAN_RADIUS_KM = 1737.4
const MOON_TO_EARTH_RADIUS_RATIO = MOON_MEAN_RADIUS_KM / EARTH_MEAN_RADIUS_KM
const MOON_RADIUS = EARTH_RADIUS * MOON_TO_EARTH_RADIUS_RATIO
const MOON_ORBIT_RADIUS = 4.65
const EARTH_SPIN_SECONDS = 18
const MOON_ORBIT_SECONDS = 46

function degToRad(value) {
  return (value * Math.PI) / 180
}

const MOON_INITIAL_PHASE = degToRad(300)

function textureLoaderPromise(loader, src) {
  return new Promise((resolve, reject) => {
    loader.load(src, resolve, undefined, reject)
  })
}

function prepareTexture(texture, renderer, flipY = false) {
  texture.flipY = flipY
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.min(
    8,
    renderer?.capabilities?.getMaxAnisotropy?.() || 1
  )
  texture.needsUpdate = true
}

function prepareHeightTexture(texture, renderer, flipY = false) {
  texture.flipY = flipY
  texture.anisotropy = Math.min(
    8,
    renderer?.capabilities?.getMaxAnisotropy?.() || 1
  )
  texture.needsUpdate = true
}

function createOrbitGeometry(radius) {
  const points = []

  for (let i = 0; i < 256; i += 1) {
    const angle = (i / 256) * TAU
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius * 0.96
      )
    )
  }

  return new THREE.BufferGeometry().setFromPoints(points)
}

export default function EarthMoonMesh({ compact = false, onReady, cinematic = false, entrance = false }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || typeof window === "undefined") return

    let disposed = false
    let frameId = 0
    let ready = false, visible = true
    let entranceStartedAt = 0
    const textureAssets = []
    const startTime = window.performance.now()
    let lastFrameTime = startTime
    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false
    mount.dataset.ready = "false"
    // Start network/decode work before creating the renderer and reflection environment.
    const loader = new THREE.TextureLoader()
    const textures = Promise.all(EARTH_MOON_TEXTURES.map(async ({ src, fallback }) => {
      const texture = await textureLoaderPromise(loader, src).catch(() => textureLoaderPromise(loader, fallback))
      if (disposed) texture.dispose()
      else textureAssets.push(texture)
      return texture
    }))
    textures.catch(() => {})

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x020014, 18, 72)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    let renderer

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      })
    } catch {
      disposed = true
      mount.setAttribute("data-webgl-unavailable", "true")
      return () => {
        mount.removeAttribute("data-webgl-unavailable")
      }
    }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.15 : compact ? 1.2 : 1.45))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = cinematic ? 0.68 : 0.78
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.tabIndex = 0
    canvas.setAttribute("role", "img")
    canvas.setAttribute("aria-label", "Earth and orbiting Moon. Drag or use arrow keys to rotate the view; Home resets it.")
    const controls = new OrbitControls(camera, canvas)
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = .08
    controls.rotateSpeed = .6
    controls.minPolarAngle = Math.PI * .18
    controls.maxPolarAngle = Math.PI * .82
    canvas.style.touchAction = "pan-y"
    let dragging = false
    const onStart = () => { dragging = true; canvas.style.cursor = "grabbing" }
    const onEnd = () => { dragging = false; canvas.style.cursor = "grab" }
    const onChange = () => {
      mount.dataset.viewAzimuth = controls.getAzimuthalAngle().toFixed(4)
      mount.dataset.viewPolar = controls.getPolarAngle().toFixed(4)
    }
    const onKeyDown = event => {
      if (event.key === "Home") {
        event.preventDefault()
        // Drain drag inertia before restoring the saved camera pose.
        controls.enableDamping = false; controls.update(); controls.reset(); controls.enableDamping = true
        return
      }
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return
      event.preventDefault()
      const offset = camera.position.clone().sub(controls.target)
      const spherical = new THREE.Spherical().setFromVector3(offset)
      spherical.theta += event.key === "ArrowLeft" ? .12 : event.key === "ArrowRight" ? -.12 : 0
      spherical.phi = THREE.MathUtils.clamp(spherical.phi + (event.key === "ArrowUp" ? -.12 : event.key === "ArrowDown" ? .12 : 0), controls.minPolarAngle, controls.maxPolarAngle)
      camera.position.copy(controls.target).add(offset.setFromSpherical(spherical))
      controls.update()
    }
    controls.addEventListener("start", onStart)
    controls.addEventListener("end", onEnd)
    controls.addEventListener("change", onChange)
    canvas.addEventListener("keydown", onKeyDown)

    // The homepage uses a darker light rig; embedded scenes retain studio lighting.
    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const environment = pmrem.fromScene(room, 0.04)
    scene.environment = environment.texture
    scene.environmentIntensity = cinematic ? 0.08 : 0.12
    room.dispose()
    pmrem.dispose()

    const root = new THREE.Group()
    root.scale.setScalar(entrance && !reducedMotion ? .68 : 1)
    scene.add(root)

    const earthSystem = new THREE.Group()
    earthSystem.rotation.order = "YXZ"
    earthSystem.rotation.x = degToRad(-5)
    earthSystem.rotation.y = degToRad(-14)
    root.add(earthSystem)

    const earthAxis = new THREE.Group()
    earthAxis.rotation.z = degToRad(23.44)
    earthSystem.add(earthAxis)

    const moonOrbit = new THREE.Group()
    moonOrbit.rotation.order = "YXZ"
    moonOrbit.rotation.x = degToRad(27)
    moonOrbit.rotation.y = degToRad(-18)
    moonOrbit.rotation.z = degToRad(-14)
    earthSystem.add(moonOrbit)

    const moonAxis = new THREE.Group()
    moonAxis.position.set(
      Math.cos(MOON_INITIAL_PHASE) * MOON_ORBIT_RADIUS,
      0,
      Math.sin(MOON_INITIAL_PHASE) * MOON_ORBIT_RADIUS * 0.96
    )
    moonAxis.rotation.z = degToRad(6.68)
    moonOrbit.add(moonAxis)

    const stars = createExpeditionStars()
    scene.add(stars)

    const ambientLight = new THREE.AmbientLight(0x94a7d4, cinematic ? 0.12 : 0.2)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfff0d2, cinematic ? 3.1 : 3.45)
    keyLight.position.set(-6.8, 3.1, 6.5)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x66cfff, cinematic ? 1.75 : 1.8)
    rimLight.position.set(5.4, 1.8, -5.2)
    scene.add(rimLight)

    const fillLight = new THREE.DirectionalLight(0x8e74ff, cinematic ? 0.24 : 0.28)
    fillLight.position.set(1.4, -3.8, 4.4)
    scene.add(fillLight)

    const orbitLine = new THREE.LineLoop(
      createOrbitGeometry(MOON_ORBIT_RADIUS),
      new THREE.LineBasicMaterial({
        color: 0xc9d8ff,
        transparent: true,
        opacity: 0.2,
        depthWrite: false,
      })
    )
    moonOrbit.add(orbitLine)

    let earth = null
    let earthAtmosphere = null
    let moon = null

    const resize = () => {
      const rect = mount.getBoundingClientRect()
      const width = Math.max(1, Math.floor(rect.width))
      const height = Math.max(1, Math.floor(rect.height))
      const narrow = width < 700

      renderer.setSize(width, height, false)
      if (cinematic) {
        renderer.toneMappingExposure = narrow ? 1.02 : 0.68
        scene.environmentIntensity = narrow ? 0.16 : 0.08
        ambientLight.intensity = narrow ? 0.22 : 0.12
        keyLight.intensity = narrow ? 3.85 : 3.1
        rimLight.intensity = narrow ? 2.35 : 1.75
        fillLight.intensity = narrow ? 0.46 : 0.24
      }
      camera.fov = 42
      camera.aspect = width / height
      camera.position.set(narrow ? -0.12 : -0.7, 2.25, 9.4)
      controls.target.set(narrow ? 0.34 : 0.82, compact ? 0 : -0.08, 0)
      controls.update()
      controls.saveState()
      camera.updateProjectionMatrix()

      const moonOrbitRadius = narrow ? 3.05 : MOON_ORBIT_RADIUS
      moonAxis.position.set(
        Math.cos(MOON_INITIAL_PHASE) * moonOrbitRadius,
        0,
        Math.sin(MOON_INITIAL_PHASE) * moonOrbitRadius * 0.96
      )
      orbitLine.scale.setScalar(moonOrbitRadius / MOON_ORBIT_RADIUS)

      earthSystem.position.set(narrow ? -0.18 : 1.55, compact ? 0 : narrow ? -0.42 : -0.12, 0)
      earthSystem.scale.setScalar(compact ? 0.9 : 1)
    }

    const loadTextures = async () => {
      const [earthTexture, earthHeight, moonTexture, moonHeight] =
        await textures

      if (disposed) {
        return
      }

      prepareTexture(earthTexture, renderer, true)
      prepareHeightTexture(earthHeight, renderer, true)
      prepareTexture(moonTexture, renderer)
      prepareHeightTexture(moonHeight, renderer)

      earth = new THREE.Mesh(
        new THREE.SphereGeometry(EARTH_RADIUS, 96, 48),
        new THREE.MeshStandardMaterial({
          map: earthTexture,
          bumpMap: earthHeight,
          bumpScale: 0.052,
          displacementMap: earthHeight,
          displacementScale: 0.018,
          color: 0xffffff,
          roughness: 0.72,
          metalness: 0,
        })
      )
      earth.rotation.y = degToRad(-18)
      earthAxis.add(earth)

      earthAtmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(EARTH_RADIUS * 1.035, 72, 36),
        new THREE.MeshBasicMaterial({
          color: 0x6bcfff,
          transparent: true,
          opacity: 0.17,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
      earthAxis.add(earthAtmosphere)

      moon = new THREE.Mesh(
        new THREE.SphereGeometry(MOON_RADIUS, 64, 32),
        new THREE.MeshStandardMaterial({
          map: moonTexture,
          bumpMap: moonHeight,
          bumpScale: 0.09,
          displacementMap: moonHeight,
          displacementScale: 0.025,
          color: 0xdedbd0,
          roughness: 0.95,
          metalness: 0,
        })
      )
      moon.rotation.y = degToRad(22)
      moonAxis.add(moon)
      renderer.render(scene, camera)
      entranceStartedAt = window.performance.now()
      ready = true
      mount.dataset.ready = "true"
      onReady?.()
      resume()
    }

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
    observer?.observe(mount)
    window.addEventListener("resize", resize)
    resize()

    const render = () => {
      frameId = 0
      if (disposed || !ready || !visible || document.hidden) return
      const now = window.performance.now()
      if (now - lastFrameTime < 1000 / 30) {
        frameId = window.requestAnimationFrame(render)
        return
      }
      const delta = Math.min((now - lastFrameTime) / 1000, .1)
      const elapsed = (now - startTime) / 1000
      const motionScale = dragging ? 0 : reducedMotion ? 0.12 : 1
      if (entrance && !reducedMotion) {
        const progress = Math.min(1, (now - entranceStartedAt) / 2200)
        root.scale.setScalar(.68 + .32 * (1 - Math.pow(1 - progress, 3)))
      }
      mount.dataset.entranceScale = root.scale.x.toFixed(4)

      lastFrameTime = now

      root.rotation.x = Math.sin(elapsed * 0.05) * 0.025
      root.rotation.y = -0.16 + Math.sin(elapsed * 0.04) * 0.04

      if (earth) {
        earth.rotation.y += delta * (TAU / EARTH_SPIN_SECONDS) * motionScale
      }

      if (earthAtmosphere) {
        earthAtmosphere.rotation.y += delta * 0.025 * motionScale
      }

      moonOrbit.rotation.y += delta * (TAU / MOON_ORBIT_SECONDS) * motionScale

      if (moon) {
        moon.rotation.y += delta * (TAU / MOON_ORBIT_SECONDS) * motionScale
      }

      controls.update()
      renderer.render(scene, camera)
      mount.dataset.frame = String(Number(mount.dataset.frame || 0) + 1)
      frameId = window.requestAnimationFrame(render)
    }

    const resume = () => {
      window.cancelAnimationFrame(frameId)
      lastFrameTime = window.performance.now() - 1000 / 30
      render()
    }
    const visibilityObserver = new IntersectionObserver(entries => {
      visible = entries[entries.length - 1].isIntersecting
      mount.dataset.visible = String(visible)
      resume()
    })
    visibilityObserver.observe(mount)
    document.addEventListener("visibilitychange", resume)
    loadTextures().catch((error) => {
      if (!disposed) console.error("Earth and moon texture loading failed:", error)
    })

    return () => {
      disposed = true
      window.cancelAnimationFrame(frameId)
      observer?.disconnect()
      visibilityObserver.disconnect()
      document.removeEventListener("visibilitychange", resume)
      window.removeEventListener("resize", resize)
      canvas.removeEventListener("keydown", onKeyDown)
      controls.removeEventListener("start", onStart)
      controls.removeEventListener("end", onEnd)
      controls.removeEventListener("change", onChange)
      controls.dispose()

      scene.traverse((object) => {
        object.geometry?.dispose?.()
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose())
        } else {
          object.material?.dispose?.()
        }
      })

      textureAssets.forEach((texture) => texture.dispose())
      environment.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [compact, onReady, cinematic, entrance])

  return (
    <Box
      data-testid="earth-moon-mesh"
      data-earth-moon-mesh="true"
      data-lighting={cinematic ? "cinematic" : "studio"}
      sx={{
        position: "relative",
        width: "100%",
        minHeight: compact ? 360 : { xs: 540, sm: 660, md: 720 },
        overflow: "hidden",
        background: "#000000",
      }}
    >
      <Box
        ref={mountRef}
        sx={{
          position: "absolute",
          inset: 0,
          "& canvas": {
            display: "block",
            width: "100% !important",
            height: "100% !important",
            cursor: "grab",
            outlineOffset: "-3px",
            "&:focus-visible": { outline: "2px solid #b0a0ec" },
          },
        }}
      />

    </Box>
  )
}
