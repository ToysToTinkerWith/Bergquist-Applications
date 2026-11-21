import React, { useEffect, useRef } from "react"
import { Box } from "@mui/material"
import * as THREE from "three"

const TAU = Math.PI * 2

function seededRandom(seed) {
  let state = seed >>> 0

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function createStarField(count = 180) {
  const random = seededRandom(91238)
  const positions = []
  const colors = []

  for (let i = 0; i < count; i += 1) {
    const radius = 8 + random() * 22
    const theta = random() * TAU
    const phi = Math.acos(2 * random() - 1)
    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.cos(phi) * 0.62 + 2.2
    const z = radius * Math.sin(phi) * Math.sin(theta)
    const cool = random()

    positions.push(x, y, z)
    colors.push(0.52 + cool * 0.24, 0.62 + cool * 0.18, 0.95)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))

  return geometry
}

function makeBox(width, height, depth, color, emissive = 0x000000) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth, 2, 2, 2),
    new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: emissive ? 0.36 : 0,
      roughness: 0.42,
      metalness: 0.34,
    })
  )
}

function addEdges(mesh, color = 0xd8e5fe, opacity = 0.36) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    })
  )
  mesh.add(edges)
  return edges
}

function createRing(radius, color, opacity, segments = 160) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius * 0.68, 0, TAU)
  const points = curve.getPoints(segments).map((point) => new THREE.Vector3(point.x, 0, point.y))

  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    })
  )
}

function createComponentAsset() {
  const root = new THREE.Group()
  const panels = new THREE.Group()
  const orbit = new THREE.Group()
  root.add(panels, orbit)

  const mainPanel = makeBox(2.2, 1.28, 0.12, 0x172554, 0x1d4ed8)
  mainPanel.rotation.set(-0.08, -0.24, 0.02)
  addEdges(mainPanel, 0x9fb7ff, 0.26)
  panels.add(mainPanel)

  const modules = [
    [-0.66, 0.28, 0.13, 0.62, 0.3, 0x7c3aed, 0x6d28d9],
    [0.24, 0.28, 0.15, 0.86, 0.3, 0x22d3ee, 0x0891b2],
    [-0.42, -0.24, 0.17, 1.04, 0.24, 0x4f46e5, 0x4338ca],
    [0.58, -0.24, 0.19, 0.44, 0.24, 0xd8e5fe, 0x22d3ee],
  ]

  modules.forEach(([x, y, z, width, height, color, emissive]) => {
    const block = makeBox(width, height, 0.12, color, emissive)
    block.position.set(x, y, z)
    addEdges(block, 0xf7fbff, 0.2)
    panels.add(block)
  })

  const sidePanel = makeBox(0.82, 1.04, 0.1, 0x020617, 0x7c3aed)
  sidePanel.position.set(1.28, -0.08, -0.34)
  sidePanel.rotation.set(0.16, -0.72, 0.05)
  addEdges(sidePanel, 0x22d3ee, 0.28)
  panels.add(sidePanel)

  const topPanel = makeBox(0.9, 0.48, 0.1, 0x111827, 0x22d3ee)
  topPanel.position.set(-1.2, 0.8, -0.22)
  topPanel.rotation.set(0.28, 0.52, -0.08)
  addEdges(topPanel, 0xd8e5fe, 0.26)
  panels.add(topPanel)

  const ringA = createRing(1.9, 0x7c3aed, 0.38)
  ringA.rotation.set(1.16, 0.28, 0.36)
  orbit.add(ringA)

  const ringB = createRing(1.44, 0x22d3ee, 0.24)
  ringB.rotation.set(0.78, -0.62, -0.2)
  orbit.add(ringB)

  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * TAU
    const cube = makeBox(0.18, 0.18, 0.18, i % 2 ? 0x22d3ee : 0x7c3aed, i % 2 ? 0x22d3ee : 0x7c3aed)
    cube.position.set(Math.cos(angle) * 1.9, Math.sin(angle * 1.7) * 0.28, Math.sin(angle) * 1.18)
    cube.rotation.set(angle * 0.8, angle * 0.4, angle * 0.6)
    addEdges(cube, 0xffffff, 0.22)
    orbit.add(cube)
  }

  return {
    root,
    animate(elapsed, motionScale) {
      root.rotation.y = Math.sin(elapsed * 0.22) * 0.18
      root.rotation.x = Math.sin(elapsed * 0.18) * 0.06
      panels.position.y = Math.sin(elapsed * 1.15) * 0.05 * motionScale
      orbit.rotation.y += 0.006 * motionScale
      orbit.rotation.z = Math.sin(elapsed * 0.34) * 0.08
    },
  }
}

function createDataAsset() {
  const root = new THREE.Group()
  const chart = new THREE.Group()
  const orbit = new THREE.Group()
  root.add(chart, orbit)

  const base = makeBox(2.65, 0.08, 1.2, 0x020617, 0x1d4ed8)
  base.position.y = -0.86
  addEdges(base, 0x9fb7ff, 0.18)
  chart.add(base)

  const barValues = [0.58, 1.12, 0.84, 1.48, 1.26]
  barValues.forEach((height, index) => {
    const bar = makeBox(
      0.28,
      height,
      0.28,
      index % 2 ? 0x22d3ee : 0x7c3aed,
      index % 2 ? 0x0891b2 : 0x6d28d9
    )
    bar.position.set(-0.96 + index * 0.48, -0.82 + height / 2, 0.04)
    addEdges(bar, 0xffffff, 0.18)
    chart.add(bar)
  })

  const linePoints = barValues.map(
    (height, index) => new THREE.Vector3(-0.96 + index * 0.48, -0.6 + height, 0.34)
  )
  const trendLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(linePoints),
    new THREE.LineBasicMaterial({
      color: 0xd8e5fe,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    })
  )
  chart.add(trendLine)

  linePoints.forEach((point, index) => {
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 24, 16),
      new THREE.MeshStandardMaterial({
        color: index % 2 ? 0xd8e5fe : 0x22d3ee,
        emissive: 0x22d3ee,
        emissiveIntensity: 0.46,
        roughness: 0.32,
        metalness: 0.2,
      })
    )
    node.position.copy(point)
    chart.add(node)
  })

  const ringA = createRing(1.72, 0x4f46e5, 0.34)
  ringA.rotation.set(1.1, 0.12, -0.42)
  orbit.add(ringA)

  const ringB = createRing(1.28, 0x22d3ee, 0.22)
  ringB.rotation.set(0.72, 0.76, 0.22)
  orbit.add(ringB)

  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * TAU
    const node = new THREE.Mesh(
      new THREE.SphereGeometry(i % 2 ? 0.055 : 0.075, 20, 12),
      new THREE.MeshStandardMaterial({
        color: i % 2 ? 0x7c3aed : 0x22d3ee,
        emissive: i % 2 ? 0x7c3aed : 0x22d3ee,
        emissiveIntensity: 0.55,
        roughness: 0.35,
        metalness: 0.28,
      })
    )
    node.position.set(Math.cos(angle) * 1.72, Math.sin(angle * 1.4) * 0.34, Math.sin(angle) * 1.08)
    orbit.add(node)
  }

  chart.rotation.set(-0.04, -0.42, 0.02)

  return {
    root,
    animate(elapsed, motionScale) {
      root.rotation.y = Math.sin(elapsed * 0.2) * 0.2
      chart.position.y = Math.sin(elapsed * 1.06) * 0.05 * motionScale
      orbit.rotation.y -= 0.005 * motionScale
      orbit.rotation.z = Math.sin(elapsed * 0.42) * 0.12
    },
  }
}

export default function HomeFeatureMesh({ variant = "components" }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || typeof window === "undefined") return

    let frameId = 0
    let disposed = false
    const startTime = window.performance.now()
    let lastFrameTime = startTime
    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x020014, 8, 32)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80)
    let renderer

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      })
    } catch {
      mount.setAttribute("data-webgl-unavailable", "true")
      return () => {
        mount.removeAttribute("data-webgl-unavailable")
      }
    }
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const root = new THREE.Group()
    scene.add(root)

    const stars = new THREE.Points(
      createStarField(),
      new THREE.PointsMaterial({
        size: 0.045,
        vertexColors: true,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
      })
    )
    scene.add(stars)

    scene.add(new THREE.AmbientLight(0x9fb7ff, 0.52))

    const keyLight = new THREE.DirectionalLight(0xfff0d2, 2.8)
    keyLight.position.set(-4.2, 4.8, 6)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x66cfff, 1.35)
    rimLight.position.set(5.8, 1.4, -4.8)
    scene.add(rimLight)

    const purpleLight = new THREE.DirectionalLight(0x8b5cf6, 0.82)
    purpleLight.position.set(1.2, -2.4, 4.5)
    scene.add(purpleLight)

    const asset = variant === "data" ? createDataAsset() : createComponentAsset()
    root.add(asset.root)

    const resize = () => {
      const rect = mount.getBoundingClientRect()
      const width = Math.max(1, Math.floor(rect.width))
      const height = Math.max(1, Math.floor(rect.height))
      const narrow = width < 520

      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.fov = narrow ? 46 : 42
      camera.position.set(0, 0.34, narrow ? 5.15 : 4.72)
      camera.lookAt(0, 0, 0)
      camera.updateProjectionMatrix()

      root.scale.setScalar(narrow ? 0.94 : 1.08)
    }

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
    observer?.observe(mount)
    window.addEventListener("resize", resize)
    resize()

    const render = () => {
      const now = window.performance.now()
      const delta = (now - lastFrameTime) / 1000
      const elapsed = (now - startTime) / 1000
      const motionScale = reducedMotion ? 0.18 : 1
      lastFrameTime = now

      stars.rotation.y += delta * 0.01
      stars.rotation.x = Math.sin(elapsed * 0.08) * 0.05
      asset.animate(elapsed, motionScale)

      if (!disposed) {
        renderer.render(scene, camera)
        frameId = window.requestAnimationFrame(render)
      }
    }

    render()

    return () => {
      disposed = true
      window.cancelAnimationFrame(frameId)
      observer?.disconnect()
      window.removeEventListener("resize", resize)

      scene.traverse((object) => {
        object.geometry?.dispose?.()
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose())
        } else {
          object.material?.dispose?.()
        }
      })

      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [variant])

  return (
    <Box
      data-home-feature-mesh={variant}
      sx={{
        position: "relative",
        width: "100%",
        minHeight: { xs: 300, sm: 330, md: 370 },
        overflow: "hidden",
        background:
          "radial-gradient(circle at 58% 30%, rgba(124,58,237,0.2), transparent 38%), radial-gradient(circle at 38% 72%, rgba(34,211,238,0.12), transparent 34%), linear-gradient(180deg, rgba(3,0,20,0.92) 0%, rgba(0,0,0,0.96) 100%)",
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
          },
        }}
      />
      <Box
        sx={{
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.38) 100%)",
        }}
      />
    </Box>
  )
}
