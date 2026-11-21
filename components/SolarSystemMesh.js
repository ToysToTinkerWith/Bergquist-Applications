import React, { useEffect, useRef } from "react"
import { Box } from "@mui/material"
import * as THREE from "three"

const TAU = Math.PI * 2
const EARTH_RADIUS_KM = 6371.0084
const EARTH_SPIN_SECONDS = 14
const EARTH_ORBIT_SECONDS = 70
const DISTANCE_POWER = 0.54
const SIZE_POWER = 0.72
const VISUAL_ORBIT_TILTS_DEG = {
  mercury: 13,
  venus: -7,
  earth: 5,
  mars: 16,
  jupiter: -8,
  saturn: 22,
  uranus: -18,
  neptune: 11,
}

const VISUAL_ORBIT_NODES_DEG = {
  mercury: -26,
  venus: 18,
  earth: -10,
  mars: 34,
  jupiter: -24,
  saturn: 48,
  uranus: -40,
  neptune: 26,
}

const PLANETS = [
  {
    key: "mercury",
    label: "Mercury",
    texture: "/planets/mercury_sss_2k.jpg",
    radiusKm: 2439.4,
    orbitAu: 0.38709927,
    eccentricity: 0.20563593,
    inclinationDeg: 7.00497902,
    nodeDeg: 48.33076593,
    meanLongitudeDeg: 252.2503235,
    meanLongitudeRateDeg: 149472.67411175,
    perihelionDeg: 77.45779628,
    perihelionRateDeg: 0.16047689,
    rotationDays: 58.6462,
    orbitalYears: 0.2408467,
    axialTiltDeg: 0.03,
    color: 0xd6d0c3,
  },
  {
    key: "venus",
    label: "Venus",
    texture: "/planets/venus_surface_sss_2k.jpg",
    radiusKm: 6051.8,
    orbitAu: 0.72333566,
    eccentricity: 0.00677672,
    inclinationDeg: 3.39467605,
    nodeDeg: 76.67984255,
    meanLongitudeDeg: 181.9790995,
    meanLongitudeRateDeg: 58517.81538729,
    perihelionDeg: 131.60246718,
    perihelionRateDeg: 0.00268329,
    rotationDays: -243.018,
    orbitalYears: 0.61519726,
    axialTiltDeg: 177.4,
    atmosphere: 0xffc676,
    color: 0xffc979,
  },
  {
    key: "earth",
    label: "Earth",
    texture: "/planets/earth_blue_marble_2k.jpg",
    moonTexture: "/moon/lroc_color_2k.jpg",
    radiusKm: 6371.0084,
    orbitAu: 1.00000261,
    eccentricity: 0.01671123,
    inclinationDeg: -0.00001531,
    nodeDeg: 0,
    meanLongitudeDeg: 100.46457166,
    meanLongitudeRateDeg: 35999.37244981,
    perihelionDeg: 102.93768193,
    perihelionRateDeg: 0.32327364,
    rotationDays: 0.99726968,
    orbitalYears: 1.0000174,
    axialTiltDeg: 23.44,
    flipY: true,
    atmosphere: 0x79d8ff,
    color: 0xffffff,
  },
  {
    key: "mars",
    label: "Mars",
    texture: "/planets/mars_viking_mdim21_2k.jpg",
    radiusKm: 3389.5,
    orbitAu: 1.52371034,
    eccentricity: 0.0933941,
    inclinationDeg: 1.84969142,
    nodeDeg: 49.55953891,
    meanLongitudeDeg: -4.55343205,
    meanLongitudeRateDeg: 19140.30268499,
    perihelionDeg: -23.94362959,
    perihelionRateDeg: 0.44441088,
    rotationDays: 1.02595676,
    orbitalYears: 1.8808476,
    axialTiltDeg: 25.19,
    color: 0xff9b64,
  },
  {
    key: "jupiter",
    label: "Jupiter",
    texture: "/planets/jupiter_sss_2k.jpg",
    radiusKm: 69911,
    orbitAu: 5.202887,
    eccentricity: 0.04838624,
    inclinationDeg: 1.30439695,
    nodeDeg: 100.47390909,
    meanLongitudeDeg: 34.39644051,
    meanLongitudeRateDeg: 3034.74612775,
    perihelionDeg: 14.72847983,
    perihelionRateDeg: 0.21252668,
    rotationDays: 0.41354,
    orbitalYears: 11.862615,
    axialTiltDeg: 3.13,
    squashY: 0.94,
    color: 0xffdfb5,
  },
  {
    key: "saturn",
    label: "Saturn",
    texture: "/planets/saturn_sss_2k.jpg",
    ringTexture: "/planets/saturn_ring_sss_2k.png",
    radiusKm: 58232,
    orbitAu: 9.53667594,
    eccentricity: 0.05386179,
    inclinationDeg: 2.48599187,
    nodeDeg: 113.66242448,
    meanLongitudeDeg: 49.95424423,
    meanLongitudeRateDeg: 1222.49362201,
    perihelionDeg: 92.59887831,
    perihelionRateDeg: -0.41897216,
    rotationDays: 0.44401,
    orbitalYears: 29.447498,
    axialTiltDeg: 26.73,
    squashY: 0.91,
    color: 0xffdca7,
  },
  {
    key: "uranus",
    label: "Uranus",
    texture: "/planets/uranus_sss_2k.jpg",
    radiusKm: 25362,
    orbitAu: 19.18916464,
    eccentricity: 0.04725744,
    inclinationDeg: 0.77263783,
    nodeDeg: 74.01692503,
    meanLongitudeDeg: 313.23810451,
    meanLongitudeRateDeg: 428.48202785,
    perihelionDeg: 170.9542763,
    perihelionRateDeg: 0.40805281,
    rotationDays: -0.71833,
    orbitalYears: 84.016846,
    axialTiltDeg: 97.77,
    squashY: 0.98,
    atmosphere: 0x8eeaf0,
    color: 0xc7fbff,
  },
  {
    key: "neptune",
    label: "Neptune",
    texture: "/planets/neptune_sss_2k.jpg",
    radiusKm: 24622,
    orbitAu: 30.06992276,
    eccentricity: 0.00859048,
    inclinationDeg: 1.77004347,
    nodeDeg: 131.78422574,
    meanLongitudeDeg: -55.12002969,
    meanLongitudeRateDeg: 218.45945325,
    perihelionDeg: 44.96476227,
    perihelionRateDeg: -0.32241464,
    rotationDays: 0.67125,
    orbitalYears: 164.79132,
    axialTiltDeg: 28.32,
    squashY: 0.98,
    atmosphere: 0x6e99ff,
    color: 0x85a9ff,
  },
]

const SUN = {
  key: "sun",
  label: "Sun",
  texture: "/planets/sun_sss_2k.jpg",
  radius: 2.15,
  rotationDays: 25,
}

function degToRad(value) {
  return (value * Math.PI) / 180
}

function normalizeRadians(value) {
  return ((value % TAU) + TAU) % TAU
}

function seededRandom(seed) {
  let state = seed >>> 0

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

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

function orbitRadiusFromAu(orbitAu) {
  return 2.9 + Math.pow(orbitAu, DISTANCE_POWER) * 3.25
}

function planetRadiusFromKm(radiusKm) {
  return Math.max(
    0.12,
    Math.pow(radiusKm / EARTH_RADIUS_KM, SIZE_POWER) * 0.34
  )
}

function meanAnomalyAtDate(body, dateMs) {
  const j2000Ms = Date.UTC(2000, 0, 1, 12, 0, 0)
  const centuries = (dateMs - j2000Ms) / (36525 * 24 * 60 * 60 * 1000)
  const longitude =
    body.meanLongitudeDeg + body.meanLongitudeRateDeg * centuries
  const perihelion =
    body.perihelionDeg + body.perihelionRateDeg * centuries

  return normalizeRadians(degToRad(longitude - perihelion))
}

function solveEccentricAnomaly(meanAnomaly, eccentricity) {
  let eccentricAnomaly = meanAnomaly

  for (let i = 0; i < 8; i += 1) {
    eccentricAnomaly -=
      (eccentricAnomaly -
        eccentricity * Math.sin(eccentricAnomaly) -
        meanAnomaly) /
      (1 - eccentricity * Math.cos(eccentricAnomaly))
  }

  return eccentricAnomaly
}

function createOrbitGeometry(semiMajorAxis, eccentricity) {
  const points = []
  const semiMinorAxis =
    semiMajorAxis * Math.sqrt(Math.max(0, 1 - eccentricity * eccentricity))

  for (let i = 0; i < 192; i += 1) {
    const angle = (i / 192) * TAU
    points.push(
      new THREE.Vector3(
        semiMajorAxis * (Math.cos(angle) - eccentricity),
        0,
        semiMinorAxis * Math.sin(angle)
      )
    )
  }

  return new THREE.BufferGeometry().setFromPoints(points)
}

function createStarField() {
  const random = seededRandom(90210)
  const positions = []
  const colors = []

  for (let i = 0; i < 620; i += 1) {
    const radius = 58 + random() * 62
    const theta = random() * TAU
    const phi = Math.acos(2 * random() - 1)
    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.cos(phi) * 0.56 + 12
    const z = radius * Math.sin(phi) * Math.sin(theta)
    const warmth = random()

    positions.push(x, y, z)
    colors.push(0.72 + warmth * 0.28, 0.78 + warmth * 0.18, 0.92 + warmth * 0.08)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))

  return geometry
}

function createRingGeometry(innerRadius, outerRadius, segments = 192, bands = 5) {
  const positions = []
  const uvs = []
  const indices = []

  for (let band = 0; band <= bands; band += 1) {
    const t = band / bands
    const radius = THREE.MathUtils.lerp(innerRadius, outerRadius, t)

    for (let segment = 0; segment <= segments; segment += 1) {
      const angle = (segment / segments) * TAU
      positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
      uvs.push(t, 0.5)
    }
  }

  for (let band = 0; band < bands; band += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const a = band * (segments + 1) + segment
      const b = a + 1
      const c = (band + 1) * (segments + 1) + segment
      const d = c + 1
      indices.push(a, c, b, b, c, d)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

function setBodyPosition(entry, meanAnomaly) {
  const eccentricAnomaly = solveEccentricAnomaly(
    normalizeRadians(meanAnomaly),
    entry.body.eccentricity
  )
  const semiMinorAxis =
    entry.orbitRadius *
    Math.sqrt(Math.max(0, 1 - entry.body.eccentricity * entry.body.eccentricity))

  entry.axis.position.set(
    entry.orbitRadius *
      (Math.cos(eccentricAnomaly) - entry.body.eccentricity),
    0,
    semiMinorAxis * Math.sin(eccentricAnomaly)
  )
}

export default function SolarSystemMesh({ compact = false }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || typeof window === "undefined") return

    let disposed = false
    let frameId = 0
    const textureAssets = []
    const movingBodies = []
    const clock = new THREE.Clock()
    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x010104, 55, 150)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 220)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.15 : 1.35))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const root = new THREE.Group()
    scene.add(root)

    const stars = new THREE.Points(
      createStarField(),
      new THREE.PointsMaterial({
        size: compact ? 0.05 : 0.07,
        vertexColors: true,
        depthWrite: false,
        transparent: true,
        opacity: 0.82,
      })
    )
    scene.add(stars)

    scene.add(new THREE.AmbientLight(0x7f8da3, 0.22))

    const sunLight = new THREE.PointLight(0xffd18a, 7.2, 95, 1.4)
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x9fcfff, 0.85)
    rimLight.position.set(-18, 22, 24)
    scene.add(rimLight)

    const resize = () => {
      const rect = mount.getBoundingClientRect()
      const width = Math.max(1, Math.floor(rect.width))
      const height = Math.max(1, Math.floor(rect.height))
      const narrow = width < 700

      renderer.setSize(width, height, false)
      camera.fov = narrow ? 55 : 44
      camera.aspect = width / height
      camera.position.set(narrow ? -8 : -18, narrow ? 36 : 24, narrow ? 78 : 58)
      camera.lookAt(0, narrow ? -0.5 : -1.2, 0)
      camera.updateProjectionMatrix()
    }

    const loader = new THREE.TextureLoader()
    const loadAllTextures = async () => {
      const sunTexture = await textureLoaderPromise(loader, SUN.texture)
      prepareTexture(sunTexture, renderer)
      textureAssets.push(sunTexture)

      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(SUN.radius, 64, 32),
        new THREE.MeshBasicMaterial({
          map: sunTexture,
          color: 0xffffff,
        })
      )
      scene.add(sun)

      const sunGlow = new THREE.Mesh(
        new THREE.SphereGeometry(SUN.radius * 1.24, 48, 24),
        new THREE.MeshBasicMaterial({
          color: 0xff9b24,
          transparent: true,
          opacity: 0.16,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      )
      scene.add(sunGlow)

      movingBodies.push({
        body: SUN,
        mesh: sun,
        spinSpeed:
          (TAU / EARTH_SPIN_SECONDS) *
          (0.99726968 / Math.abs(SUN.rotationDays)),
      })

      for (const body of PLANETS) {
        const [planetTexture, ringTexture, moonTexture] = await Promise.all([
          textureLoaderPromise(loader, body.texture),
          body.ringTexture ? textureLoaderPromise(loader, body.ringTexture) : null,
          body.moonTexture ? textureLoaderPromise(loader, body.moonTexture) : null,
        ])

        if (disposed) {
          planetTexture.dispose()
          ringTexture?.dispose()
          moonTexture?.dispose()
          return
        }

        prepareTexture(planetTexture, renderer, body.flipY)
        textureAssets.push(planetTexture)

        const orbitRadius = orbitRadiusFromAu(body.orbitAu)
        const planetRadius = planetRadiusFromKm(body.radiusKm)
        const orbitGroup = new THREE.Group()
        orbitGroup.rotation.order = "YXZ"
        orbitGroup.rotation.y = degToRad(
          body.nodeDeg + (VISUAL_ORBIT_NODES_DEG[body.key] || 0)
        )
        orbitGroup.rotation.x = degToRad(
          body.inclinationDeg + (VISUAL_ORBIT_TILTS_DEG[body.key] || 0)
        )
        root.add(orbitGroup)

        const orbitLine = new THREE.LineLoop(
          createOrbitGeometry(orbitRadius, body.eccentricity),
          new THREE.LineBasicMaterial({
            color: 0xd8e5fe,
            transparent: true,
            opacity: body.orbitAu < 2 ? 0.18 : 0.11,
            depthWrite: false,
          })
        )
        orbitGroup.add(orbitLine)

        const axis = new THREE.Group()
        axis.rotation.z = degToRad(body.axialTiltDeg || 0)
        orbitGroup.add(axis)

        const planet = new THREE.Mesh(
          new THREE.SphereGeometry(planetRadius, 48, 24),
          new THREE.MeshStandardMaterial({
            map: planetTexture,
            color: body.color,
            roughness: 0.88,
            metalness: 0,
          })
        )
        planet.scale.y = body.squashY || 1
        axis.add(planet)

        if (body.atmosphere) {
          const atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(planetRadius * 1.08, 36, 18),
            new THREE.MeshBasicMaterial({
              color: body.atmosphere,
              transparent: true,
              opacity: 0.12,
              side: THREE.BackSide,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            })
          )
          axis.add(atmosphere)
        }

        if (ringTexture) {
          prepareTexture(ringTexture, renderer)
          textureAssets.push(ringTexture)
          const ring = new THREE.Mesh(
            createRingGeometry(planetRadius * 1.42, planetRadius * 2.34),
            new THREE.MeshBasicMaterial({
              map: ringTexture,
              transparent: true,
              opacity: 0.78,
              side: THREE.DoubleSide,
              depthWrite: false,
            })
          )
          ring.rotation.x = degToRad(26.73)
          axis.add(ring)
        }

        const entry = {
          body,
          axis,
          mesh: planet,
          orbitRadius,
          meanAnomaly: meanAnomalyAtDate(body, Date.now()),
          orbitSpeed: TAU / (EARTH_ORBIT_SECONDS * body.orbitalYears),
          spinSpeed:
            Math.sign(body.rotationDays || 1) *
            (TAU / EARTH_SPIN_SECONDS) *
            (0.99726968 / Math.abs(body.rotationDays || 1)),
        }

        setBodyPosition(entry, entry.meanAnomaly)
        movingBodies.push(entry)

        if (moonTexture) {
          prepareTexture(moonTexture, renderer)
          textureAssets.push(moonTexture)
          const moonOrbit = new THREE.Group()
          axis.add(moonOrbit)

          const moon = new THREE.Mesh(
            new THREE.SphereGeometry(planetRadius * 0.28, 28, 14),
            new THREE.MeshStandardMaterial({
              map: moonTexture,
              color: 0xded9ca,
              roughness: 0.96,
            })
          )
          moon.position.set(planetRadius * 2.65, 0, 0)
          moonOrbit.add(moon)

          movingBodies.push({
            body: { key: "moon", label: "Moon" },
            mesh: moon,
            moonOrbit,
            spinSpeed: (TAU / EARTH_SPIN_SECONDS) * (0.99726968 / 27.321661),
            moonOrbitSpeed:
              (TAU / EARTH_SPIN_SECONDS) * (0.99726968 / 27.321661),
          })
        }
      }
    }

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
    observer?.observe(mount)
    window.addEventListener("resize", resize)
    resize()

    loadAllTextures().catch((error) => {
      if (!disposed) {
        console.error("Solar system texture loading failed:", error)
      }
    })

    const render = () => {
      const delta = clock.getDelta()
      const elapsed = clock.elapsedTime
      const motionScale = reducedMotion ? 0.08 : 1

      root.rotation.x = -0.1 + Math.sin(elapsed * 0.045) * 0.025
      root.rotation.y = -0.36 + Math.sin(elapsed * 0.06) * 0.055
      root.rotation.z = -0.045
      stars.rotation.y += delta * 0.006

      for (const entry of movingBodies) {
        if (entry.orbitSpeed) {
          setBodyPosition(
            entry,
            entry.meanAnomaly + elapsed * entry.orbitSpeed * motionScale
          )
        }

        if (entry.spinSpeed && entry.mesh) {
          entry.mesh.rotation.y += delta * entry.spinSpeed * motionScale
        }

        if (entry.moonOrbitSpeed && entry.moonOrbit) {
          entry.moonOrbit.rotation.y += delta * entry.moonOrbitSpeed * motionScale
        }
      }

      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(render)
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

      textureAssets.forEach((texture) => texture.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [compact])

  return (
    <Box
      data-testid="solar-system-mesh"
      data-solar-system-mesh="true"
      sx={{
        position: "relative",
        width: "100%",
        minHeight: compact
          ? 360
          : { xs: 540, sm: 660, md: 720 },
        overflow: "hidden",
        background:
          "radial-gradient(circle at 62% 28%, rgba(124,58,237,0.24), transparent 40%), radial-gradient(circle at 32% 72%, rgba(34,211,238,0.12), transparent 36%), linear-gradient(180deg, #030014 0%, #01010a 48%, #000000 100%)",
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
            "linear-gradient(180deg, rgba(2,0,18,0.06) 0%, rgba(0,0,0,0) 42%, rgba(3,0,20,0.46) 100%)",
        }}
      />
    </Box>
  )
}
