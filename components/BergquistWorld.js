import React, { useEffect, useRef, useState } from "react"
import { Box } from "@mui/material"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"

const ASSET_PATH = "/home/bergquist-world/"

function worldFraming(width, height) {
  const narrow = width < 900
  return {
    span: narrow ? Math.max(13.8, 7.4 * height / width) : Math.max(7.8, 10.8 * height / width),
    x: narrow ? 0.5 : 0.725,
    y: narrow ? (width < 375 ? 0.67 : width < 600 ? 0.65 : 0.60) : 0.435,
  }
}

function disposeObject(root) {
  const geometries = new Set()
  const materials = new Set()
  const textures = new Set()
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry)
    const entries = Array.isArray(object.material) ? object.material : [object.material]
    entries.filter(Boolean).forEach((material) => {
      materials.add(material)
      Object.values(material).forEach((value) => {
        if (value?.isTexture) textures.add(value)
      })
    })
  })
  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
  textures.forEach((texture) => texture.dispose())
}

export default function BergquistWorld({ compact = false }) {
  const mountRef = useRef(null)
  const posterRef = useRef(null)
  const [status, setStatus] = useState("poster")

  useEffect(() => {
    const mount = mountRef.current
    const poster = posterRef.current
    const resize = () => {
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      const { span, x, y } = worldFraming(width, height)
      const size = 6.7 * height / span
      Object.assign(poster.style, {
        width: `${size}px`, height: `${size}px`, left: `${width * x}px`, top: `${height * y}px`,
      })
    }
    const observer = new ResizeObserver(resize)
    observer.observe(mount)
    resize()
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    setStatus("poster")
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 100)
    const controller = new AbortController()
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const pointerQuery = window.matchMedia("(pointer: fine)")
    let reducedMotion = motionQuery.matches
    let disposed = false
    let visible = true
    let contextLost = false
    let frameId = 0
    let previousTime = 0
    let elapsed = 0
    let world = null
    let orbit = null
    let renderer
    const pointer = new THREE.Vector2()
    const tilt = new THREE.Vector2()

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" })
    } catch {
      setStatus("fallback")
      return () => controller.abort()
    }

    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1 : 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.domElement.setAttribute("aria-hidden", "true")
    mount.appendChild(renderer.domElement)

    const root = new THREE.Group()
    scene.add(root)
    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const environment = pmrem.fromScene(room, 0.04)
    scene.environment = environment.texture
    scene.environmentIntensity = 0.65
    room.dispose()
    pmrem.dispose()

    scene.add(new THREE.HemisphereLight(0xc1ddff, 0x10051e, 0.9))
    const key = new THREE.DirectionalLight(0xd5eaff, 3.2)
    key.position.set(-4, 6, 5)
    scene.add(key)
    const cyan = new THREE.DirectionalLight(0x22d3ee, 3.6)
    cyan.position.set(4, 2, -2)
    scene.add(cyan)
    const violet = new THREE.DirectionalLight(0x8c4dff, 3)
    violet.position.set(-4, 0, -1)
    scene.add(violet)
    const warm = new THREE.DirectionalLight(0xffad77, 0.7)
    warm.position.set(2, -3, 4)
    scene.add(warm)

    // Deterministic, restrained stars keep the existing space setting.
    let seed = 8271
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }
    const positions = []
    for (let i = 0; i < 200; i += 1) {
      positions.push((random() - 0.5) * 28, (random() - 0.5) * 20, -8 - random() * 8)
    }
    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    scene.add(new THREE.Points(starGeometry, new THREE.PointsMaterial({
      color: 0xb3cfe8, size: 0.015, transparent: true, opacity: 0.5, depthWrite: false,
    })))

    const draw = () => {
      if (!disposed && !contextLost) renderer.render(scene, camera)
    }

    const animate = (now) => {
      frameId = 0
      if (disposed || !world || reducedMotion || !visible || document.hidden || contextLost) return
      const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0
      previousTime = now
      elapsed += delta
      tilt.lerp(pointer, 1 - Math.exp(-delta * 3))
      // A slow oscillation keeps the BA hub facing visitors throughout the motion.
      world.rotation.y = Math.sin(elapsed * 0.11) * 0.22 + tilt.x * 0.09
      root.rotation.x = tilt.y * 0.035
      root.rotation.y = tilt.x * 0.035
      if (orbit) orbit.rotation.y = elapsed * 0.035
      draw()
      frameId = window.requestAnimationFrame(animate)
    }

    const resume = () => {
      window.cancelAnimationFrame(frameId)
      frameId = 0
      previousTime = 0
      if (disposed || !world || !visible || document.hidden || contextLost) return
      if (reducedMotion) draw()
      else frameId = window.requestAnimationFrame(animate)
    }

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect()
      if (!width || !height) return
      // Size the world in screen space so neither tall phones nor wide monitors crop it.
      const { span, x, y } = worldFraming(width, height)
      const aspect = width / height
      camera.left = -span * aspect / 2
      camera.right = span * aspect / 2
      camera.top = span / 2
      camera.bottom = -span / 2
      camera.position.set(0.4, 4.4, 10.5)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()
      // View offsets position the scene without altering the model's proportions.
      camera.setViewOffset(width, height, width * (0.5 - x), height * (0.5 - y), width, height)
      renderer.setSize(Math.floor(width), Math.floor(height), false)
      draw()
    }

    const onPointerMove = (event) => {
      if (reducedMotion || !pointerQuery.matches || !visible) return
      const rect = mount.getBoundingClientRect()
      const inside = event.clientX >= rect.left && event.clientX <= rect.right &&
        event.clientY >= rect.top && event.clientY <= rect.bottom
      pointer.set(inside ? ((event.clientX - rect.left) / rect.width - 0.5) * 2 : 0,
        inside ? ((event.clientY - rect.top) / rect.height - 0.5) * 2 : 0)
    }

    const onMotionChange = (event) => {
      reducedMotion = event.matches
      if (reducedMotion) {
        pointer.set(0, 0)
        tilt.set(0, 0)
        root.rotation.set(0, 0, 0)
        if (world) world.rotation.y = 0
        if (orbit) orbit.rotation.y = 0
      }
      resume()
    }

    const onContextLost = (event) => {
      event.preventDefault()
      contextLost = true
      window.cancelAnimationFrame(frameId)
      setStatus("fallback")
    }
    const onContextRestored = () => {
      contextLost = false
      if (world) {
        draw()
        setStatus("ready")
        resume()
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      resume()
    })
    visibilityObserver.observe(mount)
    window.addEventListener("pointermove", onPointerMove, { passive: true })
    document.addEventListener("visibilitychange", resume)
    motionQuery.addEventListener("change", onMotionChange)
    renderer.domElement.addEventListener("webglcontextlost", onContextLost)
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored)
    resize()

    const load = async () => {
      const response = await fetch(`${ASSET_PATH}bergquist-world.glb`, { signal: controller.signal })
      if (!response.ok) throw new Error(`World asset returned ${response.status}`)
      const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), ASSET_PATH)
      if (disposed) {
        disposeObject(gltf.scene)
        return
      }
      world = gltf.scene.getObjectByName("WorldSurface")
      // Wrap the Blender assembly to preserve its authored tilt while it orbits.
      const assembly = gltf.scene.getObjectByName("OrbitalAssembly")
      if (!world || !assembly) {
        disposeObject(gltf.scene)
        throw new Error("World asset is missing its named assemblies")
      }
      orbit = new THREE.Group()
      assembly.parent.add(orbit)
      orbit.add(assembly)
      root.add(gltf.scene)
      draw()
      if (!contextLost) setStatus("ready")
      resume()
    }
    load().catch((error) => {
      if (!disposed && error.name !== "AbortError") {
        console.error("Bergquist world loading failed:", error)
        setStatus("fallback")
      }
    })

    return () => {
      disposed = true
      controller.abort()
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      window.removeEventListener("pointermove", onPointerMove)
      document.removeEventListener("visibilitychange", resume)
      motionQuery.removeEventListener("change", onMotionChange)
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost)
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored)
      disposeObject(scene)
      environment.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [compact])

  return (
    <Box
      data-testid="bergquist-world"
      data-bergquist-world="true"
      data-world-status={status}
      role="img"
      aria-label="Bergquist Applications world: a modular planet with illuminated circuitry, a BA hub, and orbiting web components."
      sx={{ position: "relative", width: "100%", minHeight: compact ? 360 : { xs: 540, sm: 660, md: 720 },
        overflow: "hidden", backgroundColor: "#010105" }}
    >
      <Box
        component="img"
        ref={posterRef}
        src={`${ASSET_PATH}poster.webp`}
        alt=""
        aria-hidden="true"
        fetchpriority="high"
        sx={{ position: "absolute", width: { xs: "90%", md: "70%" }, aspectRatio: "1",
          left: { xs: "50%", md: "72.5%" }, top: { xs: "65%", sm: "60%", md: "43.5%" },
          transform: "translate(-50%, -50%)", objectFit: "contain",
          opacity: status === "ready" ? 0 : 1, transition: "opacity 0.5s ease",
          "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}
      />
      <Box ref={mountRef} sx={{ position: "absolute", inset: 0,
        opacity: status === "ready" ? 1 : 0, transition: "opacity 0.65s ease",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        "& canvas": { display: "block", width: "100%", height: "100%" } }} />
    </Box>
  )
}
