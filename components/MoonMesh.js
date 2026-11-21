import React, { useEffect, useRef, useState } from "react"
import {
  Box,
  Chip,
  IconButton,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material"
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded"
import GridOnRoundedIcon from "@mui/icons-material/GridOnRounded"
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded"
import ThreeDRotationRoundedIcon from "@mui/icons-material/ThreeDRotationRounded"
import * as THREE from "three"
import { createExpeditionStars } from "./space/expeditionStars"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"
import { createMarsMission } from "./space/marsMission"

const PLANET_RADIUS = 2.15

const DETAIL_LEVELS = {
  quick: { width: 160, height: 80 },
  balanced: { width: 288, height: 144 },
  high: { width: 448, height: 224 },
}

const PLANET_CONFIGS = {
  moon: {
    key: "moon",
    label: "Moon",
    albedoSrc: "/moon/lroc_color_2k.jpg",
    heightSrc: "/moon/ldem_3_8bit.jpg",
    mapLongitudeOffset: 0.22,
    materialColor: 0xf3eee1,
    accentColor: "#d8cfb8",
    defaultDetail: "quick",
    defaultCraterStrength: 0.7,
    defaultTerrainStrength: 0.86,
    defaultRotationSpeed: 0.07,
    bumpScale: 0.13,
    relief: {
      heightNeutral: 0.48,
      displacementScale: 0.145,
      fallbackScale: 0.06,
      secondaryNoiseScale: 0.0075,
      microScale: 0.0018,
      craterScaleWithMap: 0.34,
      craterScaleWithoutMap: 1,
      polarBlendStart: 0.18,
      polarBlendEnd: 0.55,
      min: -0.17,
      max: 0.12,
      polarMin: -0.026,
      polarMax: 0.018,
    },
    texture: {
      contrast: 1.34,
      saturation: 1.08,
      polarSoftenStart: 0.035,
      polarSoftenEnd: 0.26,
      polarSoftenStrength: 0.86,
    },
    craterBands: [
      { count: 30, minRadius: 0.09, maxRadius: 0.26, minDepth: 0.018, maxDepth: 0.066, rimScale: 0.42 },
      { count: 170, minRadius: 0.024, maxRadius: 0.092, minDepth: 0.006, maxDepth: 0.032, rimScale: 0.5 },
      { count: 360, minRadius: 0.007, maxRadius: 0.03, minDepth: 0.0018, maxDepth: 0.012, rimScale: 0.58 },
    ],
    initialRotation: [-0.12, 0.08, 0.03],
    lights: {
      ambient: { color: 0x7d8494, intensity: 0.22 },
      key: { color: 0xfff2d2, intensity: 3.15, position: [-4.8, 2.1, 5.8] },
      rim: { color: 0x7dd8ff, intensity: 0.42, position: [3.7, -1.2, -4.7] },
      fill: { color: 0x9fb7ff, intensity: 0.12, position: [1.2, -2.4, 3.1] },
    },
  },
  earth: {
    key: "earth",
    label: "Earth",
    albedoSrc: "/planets/earth_blue_marble_2k.jpg",
    heightSrc: "/planets/earth_blue_marble_height_1k.jpg",
    mapLongitudeOffset: 0.25,
    textureFlipY: true,
    materialColor: 0xffffff,
    accentColor: "#8fc7ff",
    defaultDetail: "quick",
    defaultCraterStrength: 0,
    defaultTerrainStrength: 0.58,
    defaultRotationSpeed: 0.055,
    bumpScale: 0.052,
    relief: {
      heightNeutral: 0.5,
      displacementScale: 0.078,
      fallbackScale: 0.02,
      secondaryNoiseScale: 0.0025,
      microScale: 0.0007,
      craterScaleWithMap: 0,
      craterScaleWithoutMap: 0,
      polarBlendStart: 0.16,
      polarBlendEnd: 0.5,
      min: -0.062,
      max: 0.055,
      polarMin: -0.018,
      polarMax: 0.02,
    },
    texture: {
      contrast: 1.14,
      saturation: 1.1,
      polarSoftenStart: 0.018,
      polarSoftenEnd: 0.11,
      polarSoftenStrength: 0.22,
    },
    craterBands: [],
    initialRotation: [-0.16, 0.12, 0.02],
    atmosphere: { color: 0x72c7ff, opacity: 0.13, scale: 1.023 },
    lights: {
      ambient: { color: 0x9fb5d4, intensity: 0.48 },
      key: { color: 0xfff1d7, intensity: 3.1, position: [-4.6, 2.2, 5.7] },
      rim: { color: 0x68c8ff, intensity: 0.5, position: [3.8, -1.2, -4.7] },
      fill: { color: 0x90b6ff, intensity: 0.28, position: [1.2, -2.4, 3.1] },
    },
  },
  mars: {
    key: "mars",
    label: "Mars",
    albedoSrc: "/planets/mars_viking_mdim21_2k.jpg",
    heightSrc: "/planets/mars_viking_mdim21_height_1k.jpg",
    mapLongitudeOffset: 0.96,
    materialColor: 0xffd2b1,
    accentColor: "#e09a6b",
    defaultDetail: "quick",
    defaultCraterStrength: 0.62,
    defaultTerrainStrength: 0.82,
    defaultRotationSpeed: 0.064,
    bumpScale: 0.105,
    relief: {
      heightNeutral: 0.5,
      displacementScale: 0.12,
      fallbackScale: 0.052,
      secondaryNoiseScale: 0.006,
      microScale: 0.0016,
      craterScaleWithMap: 0.28,
      craterScaleWithoutMap: 0.9,
      polarBlendStart: 0.16,
      polarBlendEnd: 0.54,
      min: -0.135,
      max: 0.115,
      polarMin: -0.024,
      polarMax: 0.026,
    },
    texture: {
      contrast: 1.26,
      saturation: 1.18,
      polarSoftenStart: 0.03,
      polarSoftenEnd: 0.19,
      polarSoftenStrength: 0.58,
    },
    craterBands: [
      { count: 22, minRadius: 0.11, maxRadius: 0.28, minDepth: 0.014, maxDepth: 0.052, rimScale: 0.38 },
      { count: 140, minRadius: 0.032, maxRadius: 0.11, minDepth: 0.005, maxDepth: 0.026, rimScale: 0.48 },
      { count: 320, minRadius: 0.009, maxRadius: 0.035, minDepth: 0.0015, maxDepth: 0.009, rimScale: 0.55 },
    ],
    initialRotation: [-0.13, 0.14, 0.02],
    atmosphere: { color: 0xffb27d, opacity: 0.075, scale: 1.018 },
    lights: {
      ambient: { color: 0xa08a7f, intensity: 0.25 },
      key: { color: 0xffe0b8, intensity: 3.05, position: [-4.7, 2.0, 5.8] },
      rim: { color: 0x6fc3ff, intensity: 0.34, position: [3.7, -1.2, -4.7] },
      fill: { color: 0xffaa7e, intensity: 0.1, position: [1.2, -2.4, 3.1] },
    },
  },
  mercury: {
    key: "mercury",
    label: "Mercury",
    albedoSrc: "/planets/mercury_sss_2k.jpg",
    heightSrc: "/planets/mercury_sss_height_1k.jpg",
    mapLongitudeOffset: 0.14,
    materialColor: 0xe5e0d7,
    accentColor: "#c8c0b6",
    defaultDetail: "quick",
    defaultCraterStrength: 0.82,
    defaultTerrainStrength: 0.84,
    defaultRotationSpeed: 0.05,
    bumpScale: 0.12,
    relief: {
      heightNeutral: 0.5,
      displacementScale: 0.12,
      fallbackScale: 0.056,
      secondaryNoiseScale: 0.0065,
      microScale: 0.0016,
      craterScaleWithMap: 0.32,
      craterScaleWithoutMap: 0.95,
      polarBlendStart: 0.18,
      polarBlendEnd: 0.55,
      min: -0.14,
      max: 0.11,
      polarMin: -0.024,
      polarMax: 0.02,
    },
    texture: {
      contrast: 1.2,
      saturation: 0.92,
      polarSoftenStart: 0.035,
      polarSoftenEnd: 0.22,
      polarSoftenStrength: 0.72,
    },
    craterBands: [
      { count: 26, minRadius: 0.08, maxRadius: 0.24, minDepth: 0.015, maxDepth: 0.055, rimScale: 0.42 },
      { count: 150, minRadius: 0.024, maxRadius: 0.086, minDepth: 0.005, maxDepth: 0.026, rimScale: 0.5 },
      { count: 340, minRadius: 0.007, maxRadius: 0.03, minDepth: 0.0016, maxDepth: 0.01, rimScale: 0.56 },
    ],
    initialRotation: [-0.12, 0.1, 0.02],
    lights: {
      ambient: { color: 0x85838a, intensity: 0.2 },
      key: { color: 0xffeed3, intensity: 3.3, position: [-4.8, 2.1, 5.8] },
      rim: { color: 0x88ccff, intensity: 0.34, position: [3.7, -1.2, -4.7] },
      fill: { color: 0xaab7ff, intensity: 0.1, position: [1.2, -2.4, 3.1] },
    },
  },
  venus: {
    key: "venus",
    label: "Venus",
    albedoSrc: "/planets/venus_surface_sss_2k.jpg",
    heightSrc: "/planets/venus_surface_sss_height_1k.jpg",
    mapLongitudeOffset: 0.32,
    materialColor: 0xffd8a3,
    accentColor: "#e9bc78",
    defaultDetail: "quick",
    defaultCraterStrength: 0.16,
    defaultTerrainStrength: 0.72,
    defaultRotationSpeed: 0.035,
    bumpScale: 0.082,
    relief: {
      heightNeutral: 0.5,
      displacementScale: 0.092,
      fallbackScale: 0.034,
      secondaryNoiseScale: 0.004,
      microScale: 0.0009,
      craterScaleWithMap: 0.09,
      craterScaleWithoutMap: 0.18,
      polarBlendStart: 0.16,
      polarBlendEnd: 0.52,
      min: -0.08,
      max: 0.078,
      polarMin: -0.018,
      polarMax: 0.018,
    },
    texture: {
      contrast: 1.2,
      saturation: 1.08,
      polarSoftenStart: 0.03,
      polarSoftenEnd: 0.2,
      polarSoftenStrength: 0.52,
    },
    craterBands: [
      { count: 16, minRadius: 0.07, maxRadius: 0.18, minDepth: 0.008, maxDepth: 0.022, rimScale: 0.34 },
      { count: 82, minRadius: 0.018, maxRadius: 0.064, minDepth: 0.002, maxDepth: 0.01, rimScale: 0.42 },
    ],
    initialRotation: [-0.12, 0.11, 0.02],
    atmosphere: { color: 0xffcf83, opacity: 0.18, scale: 1.028 },
    lights: {
      ambient: { color: 0xb29478, intensity: 0.32 },
      key: { color: 0xffdfad, intensity: 3.0, position: [-4.6, 2.2, 5.7] },
      rim: { color: 0xffbd77, intensity: 0.42, position: [3.8, -1.2, -4.7] },
      fill: { color: 0xffba84, intensity: 0.16, position: [1.2, -2.4, 3.1] },
    },
  },
  jupiter: {
    key: "jupiter",
    label: "Jupiter",
    albedoSrc: "/planets/jupiter_sss_2k.jpg",
    heightSrc: "/planets/jupiter_sss_height_1k.jpg",
    mapLongitudeOffset: 0.14,
    shapeScale: [1.08, 0.94, 1.08],
    materialColor: 0xffffff,
    accentColor: "#dcb98f",
    defaultDetail: "quick",
    defaultCraterStrength: 0,
    defaultTerrainStrength: 0.64,
    defaultRotationSpeed: 0.082,
    bumpScale: 0.048,
    relief: {
      heightNeutral: 0.5,
      displacementScale: 0.032,
      fallbackScale: 0.014,
      secondaryNoiseScale: 0.004,
      microScale: 0.0009,
      craterScaleWithMap: 0,
      craterScaleWithoutMap: 0,
      polarBlendStart: 0.1,
      polarBlendEnd: 0.38,
      min: -0.028,
      max: 0.032,
      polarMin: -0.012,
      polarMax: 0.012,
    },
    texture: {
      contrast: 1.16,
      saturation: 1.12,
      polarSoftenStart: 0.02,
      polarSoftenEnd: 0.14,
      polarSoftenStrength: 0.28,
    },
    craterBands: [],
    initialRotation: [-0.06, 0.08, 0.01],
    lights: {
      ambient: { color: 0xa59c95, intensity: 0.3 },
      key: { color: 0xffefd4, intensity: 2.8, position: [-4.6, 2.1, 5.8] },
      rim: { color: 0x79cfff, intensity: 0.34, position: [3.7, -1.2, -4.7] },
      fill: { color: 0xffd0a0, intensity: 0.12, position: [1.2, -2.4, 3.1] },
    },
  },
  saturn: {
    key: "saturn",
    label: "Saturn",
    albedoSrc: "/planets/saturn_sss_2k.jpg",
    heightSrc: "/planets/saturn_sss_height_1k.jpg",
    ringSrc: "/planets/saturn_ring_sss_2k.png",
    mapLongitudeOffset: 0.18,
    shapeScale: [1.1, 0.91, 1.1],
    materialColor: 0xffe4b8,
    accentColor: "#d6b27f",
    defaultDetail: "quick",
    defaultCraterStrength: 0,
    defaultTerrainStrength: 0.52,
    defaultRotationSpeed: 0.074,
    bumpScale: 0.034,
    relief: {
      heightNeutral: 0.5,
      displacementScale: 0.024,
      fallbackScale: 0.01,
      secondaryNoiseScale: 0.003,
      microScale: 0.0007,
      craterScaleWithMap: 0,
      craterScaleWithoutMap: 0,
      polarBlendStart: 0.1,
      polarBlendEnd: 0.36,
      min: -0.022,
      max: 0.024,
      polarMin: -0.01,
      polarMax: 0.01,
    },
    texture: {
      contrast: 1.12,
      saturation: 1.06,
      polarSoftenStart: 0.02,
      polarSoftenEnd: 0.14,
      polarSoftenStrength: 0.28,
    },
    craterBands: [],
    ring: {
      innerRadius: 2.72,
      outerRadius: 4.45,
      tilt: -0.42,
      opacity: 0.82,
    },
    initialRotation: [-0.08, 0.08, 0.02],
    lights: {
      ambient: { color: 0xb4a18d, intensity: 0.32 },
      key: { color: 0xffebc8, intensity: 2.85, position: [-4.5, 2.0, 5.8] },
      rim: { color: 0x7ecfff, intensity: 0.32, position: [3.7, -1.2, -4.7] },
      fill: { color: 0xffc993, intensity: 0.14, position: [1.2, -2.4, 3.1] },
    },
  },
  uranus: {
    key: "uranus",
    label: "Uranus",
    albedoSrc: "/planets/uranus_sss_2k.jpg",
    heightSrc: "/planets/uranus_sss_height_1k.jpg",
    mapLongitudeOffset: 0.2,
    shapeScale: [1.03, 0.98, 1.03],
    materialColor: 0xdbffff,
    accentColor: "#9fe7ea",
    defaultDetail: "quick",
    defaultCraterStrength: 0,
    defaultTerrainStrength: 0.38,
    defaultRotationSpeed: 0.058,
    bumpScale: 0.02,
    relief: {
      heightNeutral: 0.5,
      displacementScale: 0.014,
      fallbackScale: 0.008,
      secondaryNoiseScale: 0.002,
      microScale: 0.0004,
      craterScaleWithMap: 0,
      craterScaleWithoutMap: 0,
      polarBlendStart: 0.1,
      polarBlendEnd: 0.36,
      min: -0.014,
      max: 0.014,
      polarMin: -0.007,
      polarMax: 0.007,
    },
    texture: {
      contrast: 1.1,
      saturation: 1.12,
      polarSoftenStart: 0.02,
      polarSoftenEnd: 0.16,
      polarSoftenStrength: 0.2,
    },
    craterBands: [],
    atmosphere: { color: 0x8eeaf0, opacity: 0.1, scale: 1.018 },
    initialRotation: [-0.04, 0.1, -0.32],
    lights: {
      ambient: { color: 0x9ac5ca, intensity: 0.36 },
      key: { color: 0xe6ffff, intensity: 2.65, position: [-4.6, 2.1, 5.8] },
      rim: { color: 0xa4f7ff, intensity: 0.42, position: [3.7, -1.2, -4.7] },
      fill: { color: 0x9ad5ff, intensity: 0.16, position: [1.2, -2.4, 3.1] },
    },
  },
  neptune: {
    key: "neptune",
    label: "Neptune",
    albedoSrc: "/planets/neptune_sss_2k.jpg",
    heightSrc: "/planets/neptune_sss_height_1k.jpg",
    mapLongitudeOffset: 0.22,
    shapeScale: [1.03, 0.98, 1.03],
    materialColor: 0x9fc4ff,
    accentColor: "#7fa7ff",
    defaultDetail: "quick",
    defaultCraterStrength: 0,
    defaultTerrainStrength: 0.48,
    defaultRotationSpeed: 0.062,
    bumpScale: 0.028,
    relief: {
      heightNeutral: 0.5,
      displacementScale: 0.018,
      fallbackScale: 0.009,
      secondaryNoiseScale: 0.0025,
      microScale: 0.0005,
      craterScaleWithMap: 0,
      craterScaleWithoutMap: 0,
      polarBlendStart: 0.1,
      polarBlendEnd: 0.36,
      min: -0.016,
      max: 0.018,
      polarMin: -0.008,
      polarMax: 0.008,
    },
    texture: {
      contrast: 1.16,
      saturation: 1.2,
      polarSoftenStart: 0.02,
      polarSoftenEnd: 0.16,
      polarSoftenStrength: 0.2,
    },
    craterBands: [],
    atmosphere: { color: 0x6f9dff, opacity: 0.11, scale: 1.02 },
    initialRotation: [-0.05, 0.1, 0.12],
    lights: {
      ambient: { color: 0x7d96c0, intensity: 0.34 },
      key: { color: 0xddeaff, intensity: 2.7, position: [-4.6, 2.1, 5.8] },
      rim: { color: 0x80b7ff, intensity: 0.46, position: [3.7, -1.2, -4.7] },
      fill: { color: 0x8aa0ff, intensity: 0.14, position: [1.2, -2.4, 3.1] },
    },
  },
  sun: {
    key: "sun",
    label: "Sun",
    albedoSrc: "/planets/sun_sss_2k.jpg",
    heightSrc: "/planets/sun_sss_height_1k.jpg",
    mapLongitudeOffset: 0.2,
    materialColor: 0xffffff,
    accentColor: "#ffb133",
    defaultDetail: "quick",
    defaultCraterStrength: 0,
    defaultTerrainStrength: 0.46,
    defaultRotationSpeed: 0.045,
    bumpScale: 0.045,
    emissive: true,
    relief: {
      heightNeutral: 0.5,
      displacementScale: 0.034,
      fallbackScale: 0.016,
      secondaryNoiseScale: 0.005,
      microScale: 0.0014,
      craterScaleWithMap: 0,
      craterScaleWithoutMap: 0,
      polarBlendStart: 0.08,
      polarBlendEnd: 0.34,
      min: -0.03,
      max: 0.036,
      polarMin: -0.012,
      polarMax: 0.012,
    },
    texture: {
      contrast: 1.18,
      saturation: 1.2,
      polarSoftenStart: 0.018,
      polarSoftenEnd: 0.15,
      polarSoftenStrength: 0.38,
    },
    craterBands: [],
    atmosphere: { color: 0xff8a00, opacity: 0.3, scale: 1.055 },
    initialRotation: [-0.06, 0.08, 0.01],
    lights: {
      ambient: { color: 0xffbd4a, intensity: 0.7 },
      key: { color: 0xffd17a, intensity: 2.1, position: [-4.6, 2.1, 5.8] },
      rim: { color: 0xff7a00, intensity: 0.62, position: [3.7, -1.2, -4.7] },
      fill: { color: 0xff9a3f, intensity: 0.3, position: [1.2, -2.4, 3.1] },
    },
  },
}

const CRATER_FIELDS_BY_PLANET = {
  moon: makeCraterFields(PLANET_CONFIGS.moon.craterBands),
  earth: [],
  mars: makeCraterFields(PLANET_CONFIGS.mars.craterBands, 2600),
  mercury: makeCraterFields(PLANET_CONFIGS.mercury.craterBands, 5200),
  venus: makeCraterFields(PLANET_CONFIGS.venus.craterBands, 7800),
  jupiter: [],
  saturn: [],
  uranus: [],
  neptune: [],
  sun: [],
}

const BASIN_FIELDS = [
  { center: new THREE.Vector3(0.04, 0.1, 0.99).normalize(), radius: 0.58, weight: 1 },
  { center: new THREE.Vector3(-0.42, 0.34, 0.84).normalize(), radius: 0.34, weight: 0.72 },
  { center: new THREE.Vector3(0.45, -0.18, 0.87).normalize(), radius: 0.31, weight: 0.82 },
  { center: new THREE.Vector3(0.03, -0.52, 0.85).normalize(), radius: 0.24, weight: 0.64 },
  { center: new THREE.Vector3(-0.18, 0.64, 0.75).normalize(), radius: 0.22, weight: 0.58 },
]

const RAY_SYSTEMS = [
  { center: new THREE.Vector3(-0.24, -0.78, 0.57).normalize(), radius: 0.86, spokes: 22, twist: 5.2, strength: 0.72 },
  { center: new THREE.Vector3(0.72, -0.28, 0.63).normalize(), radius: 0.48, spokes: 14, twist: 3.8, strength: 0.42 },
  { center: new THREE.Vector3(-0.58, 0.43, 0.69).normalize(), radius: 0.38, spokes: 12, twist: 2.6, strength: 0.32 },
]

function seededRandom(seed) {
  const raw = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return raw - Math.floor(raw)
}

function makeCraterFields(bands = [], seedBase = 0) {
  const fields = []
  let offset = seedBase

  bands.forEach((band, bandIndex) => {
    for (let i = 0; i < band.count; i += 1) {
      const seed = offset + i * 9 + bandIndex * 197
      const a = seededRandom(seed + 1)
      const b = seededRandom(seed + 2)
      const c = seededRandom(seed + 3)
      const d = seededRandom(seed + 4)
      const e = seededRandom(seed + 5)
      const z = 1 - 2 * a
      const theta = Math.PI * 2 * b
      const ring = Math.sqrt(Math.max(0, 1 - z * z))
      const radius =
        band.minRadius + Math.pow(c, 1.7) * (band.maxRadius - band.minRadius)
      const depth = band.minDepth + d * (band.maxDepth - band.minDepth)

      fields.push({
        center: new THREE.Vector3(
          Math.cos(theta) * ring,
          Math.sin(theta) * ring,
          z
        ),
        radius,
        depth,
        rim: depth * (band.rimScale + e * 0.22),
        outerDot: Math.cos(radius * 1.34),
        peak: bandIndex === 0 && seededRandom(seed + 6) > 0.42,
      })
    }
    offset += band.count * 11
  })

  return fields
}

function smoothstep(edge0, edge1, value) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

function octaveWave(normal, frequency, seed) {
  return Math.sin(
    normal.x * (11.3 + seed) * frequency +
      normal.y * (17.1 + seed * 0.7) * frequency +
      normal.z * (13.7 + seed * 1.3) * frequency
  )
}

function surfaceNoise(normal) {
  return (
    octaveWave(normal, 0.45, 1.7) * 0.48 +
    octaveWave(normal, 0.9, 4.3) * 0.28 +
    octaveWave(normal, 1.75, 8.1) * 0.16 +
    octaveWave(normal, 3.2, 2.9) * 0.08 +
    octaveWave(normal, 7.8, 6.4) * 0.035
  )
}

function craterElevation(normal, craterStrength, craterFields = []) {
  let elevation = 0

  for (const crater of craterFields) {
    const dot = normal.dot(crater.center)
    if (dot < crater.outerDot) continue

    const angle = Math.acos(Math.max(-1, Math.min(1, dot)))
    const t = angle / crater.radius

    if (t < 1) {
      const bowlWall = 1 - smoothstep(0.22, 1, t)
      const softFloor = 1 - smoothstep(0, 0.28, t)
      elevation -= crater.depth * (bowlWall * 0.72 + softFloor * 0.28) * craterStrength
    }

    if (crater.peak && t < 0.18) {
      elevation += crater.depth * 0.36 * (1 - t / 0.18) * craterStrength
    }

    if (t >= 0.72 && t <= 1.24) {
      const rimFalloff = Math.exp(-Math.pow((t - 0.98) * 7.4, 2))
      elevation += crater.rim * rimFalloff * craterStrength
    }
  }

  return elevation
}

function basinAmount(normal) {
  return BASIN_FIELDS.reduce((amount, basin) => {
    const angle = Math.acos(
      Math.max(-1, Math.min(1, normal.dot(basin.center)))
    )
    const edge = Math.max(0, 1 - angle / basin.radius)
    return amount + edge * edge * basin.weight
  }, 0)
}

function rayAmount(normal) {
  return RAY_SYSTEMS.reduce((amount, ray) => {
    const dot = Math.max(-1, Math.min(1, normal.dot(ray.center)))
    const angle = Math.acos(dot)
    if (angle > ray.radius) return amount

    const tangent = new THREE.Vector3().crossVectors(ray.center, normal)
    const azimuth = Math.atan2(tangent.y + normal.x * 0.35, tangent.x - normal.y * 0.22)
    const spoke = Math.max(0, Math.cos(azimuth * ray.spokes + angle * ray.twist))
    const falloff = Math.pow(1 - angle / ray.radius, 1.9)

    return amount + Math.pow(spoke, 18) * falloff * ray.strength
  }, 0)
}

function sampleHeight(heightSampler, u, v) {
  if (!heightSampler) return 0.5

  const x = ((u % 1) + 1) % 1
  const y = THREE.MathUtils.clamp(1 - v, 0, 1)
  const px = x * (heightSampler.width - 1)
  const py = y * (heightSampler.height - 1)
  const x0 = Math.floor(px)
  const y0 = Math.floor(py)
  const x1 = Math.min(heightSampler.width - 1, x0 + 1)
  const y1 = Math.min(heightSampler.height - 1, y0 + 1)
  const tx = px - x0
  const ty = py - y0
  const read = (sampleX, sampleY) => {
    const index = (sampleY * heightSampler.width + sampleX) * 4
    return heightSampler.data[index] / 255
  }
  const a = THREE.MathUtils.lerp(read(x0, y0), read(x1, y0), tx)
  const b = THREE.MathUtils.lerp(read(x0, y1), read(x1, y1), tx)

  return THREE.MathUtils.lerp(a, b, ty)
}

function createImageSampler(image) {
  const canvas = document.createElement("canvas")
  canvas.width = image.naturalWidth || image.width
  canvas.height = image.naturalHeight || image.height

  const context = canvas.getContext("2d", { willReadFrequently: true })
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return {
    width: canvas.width,
    height: canvas.height,
    data: context.getImageData(0, 0, canvas.width, canvas.height).data,
  }
}

function tunePlanetPixel(r, g, b, config) {
  const texture = config.texture || {}
  const contrast = texture.contrast || 1
  const saturation = texture.saturation || 1
  const lum = r * 0.2126 + g * 0.7152 + b * 0.0722

  let nextR = (r - 128) * contrast + 128
  let nextG = (g - 128) * contrast + 128
  let nextB = (b - 128) * contrast + 128
  const nextLum = nextR * 0.2126 + nextG * 0.7152 + nextB * 0.0722

  nextR = nextLum + (nextR - nextLum) * saturation
  nextG = nextLum + (nextG - nextLum) * saturation
  nextB = nextLum + (nextB - nextLum) * saturation

  if (config.key === "moon") {
    const mareDarkening = lum < 132 ? 0.82 : 1
    const highlandLift = lum > 196 ? 1.04 : 1
    nextR *= mareDarkening * highlandLift
    nextG *= mareDarkening * highlandLift
    nextB *= mareDarkening * highlandLift
  }

  if (config.key === "earth") {
    const ocean = b > r * 1.18 && b > g * 1.04 && b - r > 18
    if (ocean) {
      nextR *= 0.82
      nextG *= 1.03
      nextB *= 1.14
    } else {
      nextR *= 1.03
      nextG *= 1.045
      nextB *= lum > 190 ? 1.02 : 0.93
    }
  }

  if (config.key === "mars") {
    const ice = lum > 168 && Math.abs(r - g) < 38 && Math.abs(g - b) < 58
    if (ice) {
      nextR *= 1.04
      nextG *= 1.04
      nextB *= 1.08
    } else {
      nextR *= 1.14
      nextG *= 0.98
      nextB *= 0.82
    }
  }

  if (config.key === "mercury") {
    const gray = nextR * 0.31 + nextG * 0.37 + nextB * 0.32
    nextR = gray * 1.04
    nextG = gray * 1.02
    nextB = gray * 0.98
  }

  if (config.key === "venus") {
    nextR *= 1.12
    nextG *= 1.03
    nextB *= 0.82
  }

  if (config.key === "jupiter") {
    nextR *= lum < 120 ? 1.1 : 1.04
    nextG *= 1.01
    nextB *= lum > 170 ? 1.06 : 0.94
  }

  if (config.key === "saturn") {
    nextR *= 1.06
    nextG *= 1.03
    nextB *= 0.94
  }

  if (config.key === "uranus") {
    nextR *= 0.84
    nextG *= 1.06
    nextB *= 1.12
  }

  if (config.key === "neptune") {
    nextR *= 0.82
    nextG *= 0.96
    nextB *= 1.2
  }

  if (config.key === "sun") {
    nextR = Math.max(nextR * 1.12, 190)
    nextG = Math.max(nextG * 1.04, 82)
    nextB *= 0.72
  }

  return [
    THREE.MathUtils.clamp(nextR, 0, 255),
    THREE.MathUtils.clamp(nextG, 0, 255),
    THREE.MathUtils.clamp(nextB, 0, 255),
  ]
}

function softenPolarTextureRows(data, width, height, texture = {}) {
  const strength = texture.polarSoftenStrength || 0
  if (strength <= 0) return

  const rowAverages = new Float32Array(height * 3)
  for (let y = 0; y < height; y += 1) {
    let r = 0
    let g = 0
    let b = 0

    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      r += data[index]
      g += data[index + 1]
      b += data[index + 2]
    }

    const rowIndex = y * 3
    rowAverages[rowIndex] = r / width
    rowAverages[rowIndex + 1] = g / width
    rowAverages[rowIndex + 2] = b / width
  }

  for (let y = 0; y < height; y += 1) {
    const polarDistance = Math.min(
      y / Math.max(1, height - 1),
      1 - y / Math.max(1, height - 1)
    )
    const polarSoften =
      1 -
      smoothstep(
        texture.polarSoftenStart || 0.035,
        texture.polarSoftenEnd || 0.18,
        polarDistance
      )
    if (polarSoften <= 0) continue

    const rowIndex = y * 3
    const blend = polarSoften * strength
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      data[index] = THREE.MathUtils.lerp(data[index], rowAverages[rowIndex], blend)
      data[index + 1] = THREE.MathUtils.lerp(
        data[index + 1],
        rowAverages[rowIndex + 1],
        blend
      )
      data[index + 2] = THREE.MathUtils.lerp(
        data[index + 2],
        rowAverages[rowIndex + 2],
        blend
      )
    }
  }
}

function createEnhancedAlbedoTexture(image, renderer, config) {
  const canvas = document.createElement("canvas")
  canvas.width = image.naturalWidth || image.width
  canvas.height = image.naturalHeight || image.height

  const context = canvas.getContext("2d", { willReadFrequently: true })
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    const tuned = tunePlanetPixel(data[i], data[i + 1], data[i + 2], config)
    data[i] = tuned[0]
    data[i + 1] = tuned[1]
    data[i + 2] = tuned[2]
  }

  softenPolarTextureRows(data, canvas.width, canvas.height, config.texture)
  context.putImageData(imageData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  preparePlanetTexture(texture, {
    color: true,
    flipY: config.textureFlipY,
    renderer,
  })
  texture.generateMipmaps = true

  return texture
}

function vertexIndex(row, segment, segments) {
  return row * (segments + 1) + segment
}

function averageDuplicateNormals(geometry, segments, rings) {
  const normals = geometry.attributes.normal
  const average = new THREE.Vector3()

  for (let row = 0; row <= rings; row += 1) {
    const first = vertexIndex(row, 0, segments)
    const last = vertexIndex(row, segments, segments)

    average
      .set(
        normals.getX(first) + normals.getX(last),
        normals.getY(first) + normals.getY(last),
        normals.getZ(first) + normals.getZ(last)
      )
      .normalize()

    normals.setXYZ(first, average.x, average.y, average.z)
    normals.setXYZ(last, average.x, average.y, average.z)
  }

  for (const row of [0, rings]) {
    average.set(0, 0, 0)
    for (let segment = 0; segment <= segments; segment += 1) {
      const index = vertexIndex(row, segment, segments)
      average.add(
        new THREE.Vector3(
          normals.getX(index),
          normals.getY(index),
          normals.getZ(index)
        )
      )
    }
    average.normalize()
    for (let segment = 0; segment <= segments; segment += 1) {
      const index = vertexIndex(row, segment, segments)
      normals.setXYZ(index, average.x, average.y, average.z)
    }
  }

  normals.needsUpdate = true
}

function createWrappedSphereGeometry(config, segments, rings, options = {}) {
  const positions = []
  const uvs = []
  const indices = []
  const normal = new THREE.Vector3()
  const radius = config.radius || PLANET_RADIUS
  const relief = config.relief || PLANET_CONFIGS.moon.relief
  const craterFields = CRATER_FIELDS_BY_PLANET[config.key] || []
  const shapeScale = config.shapeScale || [1, 1, 1]

  for (let ring = 0; ring <= rings; ring += 1) {
    const v = 1 - ring / rings
    const phi = (ring / rings) * Math.PI
    const y = Math.cos(phi) * radius
    const ringRadius = Math.sin(phi) * radius

    for (let segment = 0; segment <= segments; segment += 1) {
      const u = segment / segments
      const theta = (u - config.mapLongitudeOffset) * Math.PI * 2

      normal
        .set(
          Math.cos(theta) * ringRadius,
          y,
          Math.sin(theta) * ringRadius
        )
        .normalize()

      const heightU = ring === 0 || ring === rings ? 0.5 : u
      const height = sampleHeight(options.heightSampler, heightU, v)
      const polarBlend = smoothstep(
        relief.polarBlendStart,
        relief.polarBlendEnd,
        Math.sin(phi)
      )
      const demRelief = options.heightSampler
        ? (height - relief.heightNeutral) *
          relief.displacementScale *
          options.terrainStrength *
          polarBlend
        : surfaceNoise(normal) *
          relief.fallbackScale *
          options.terrainStrength *
          polarBlend
      const fallbackTerrain =
        surfaceNoise(normal) *
        relief.secondaryNoiseScale *
        options.terrainStrength *
        polarBlend
      const microTerrain =
        Math.sin((normal.x * 1.9 - normal.y * 0.8 + normal.z * 1.4) * 164.0) *
        relief.microScale *
        options.terrainStrength *
        polarBlend
      const craters = craterElevation(
        normal,
        options.heightSampler
          ? options.craterStrength *
              relief.craterScaleWithMap *
              (0.28 + polarBlend * 0.72)
          : options.craterStrength *
              relief.craterScaleWithoutMap *
              (0.28 + polarBlend * 0.72),
        craterFields
      )
      const elevation = THREE.MathUtils.clamp(
        demRelief + fallbackTerrain + microTerrain + craters,
        THREE.MathUtils.lerp(relief.polarMin, relief.min, polarBlend),
        THREE.MathUtils.lerp(relief.polarMax, relief.max, polarBlend)
      )
      const displacedRadius = radius + elevation

      positions.push(
        normal.x * displacedRadius * shapeScale[0],
        normal.y * displacedRadius * shapeScale[1],
        normal.z * displacedRadius * shapeScale[2]
      )
      uvs.push(u, v)
    }
  }

  for (let ring = 0; ring < rings; ring += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      const a = vertexIndex(ring, segment, segments)
      const b = vertexIndex(ring, segment + 1, segments)
      const c = vertexIndex(ring + 1, segment, segments)
      const d = vertexIndex(ring + 1, segment + 1, segments)

      if (ring === 0) {
        indices.push(a, d, c)
      } else if (ring === rings - 1) {
        indices.push(a, b, c)
      } else {
        indices.push(a, b, d, a, d, c)
      }
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  )
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  averageDuplicateNormals(geometry, segments, rings)

  return geometry
}

function fallbackPlanetColor(normal, config, targetColor) {
  const noise = surfaceNoise(normal)

  if (config.key === "earth") {
    const ocean = normal.z + noise * 0.42 > 0.12
    const snow = Math.abs(normal.y) > 0.82
    if (snow) {
      targetColor.setRGB(0.84, 0.88, 0.86)
    } else if (ocean) {
      targetColor.setRGB(0.06, 0.18, 0.36 + noise * 0.03)
    } else {
      targetColor.setRGB(0.25 + noise * 0.04, 0.39 + noise * 0.05, 0.19)
    }
    return targetColor
  }

  if (config.key === "mars") {
    const brightness = THREE.MathUtils.clamp(0.58 + noise * 0.11, 0.34, 0.86)
    targetColor.setRGB(brightness * 1.08, brightness * 0.63, brightness * 0.45)
    return targetColor
  }

  const basin = Math.min(1, basinAmount(normal))
  const rays = Math.min(1, rayAmount(normal))
  const brightness = THREE.MathUtils.clamp(
    0.62 + noise * 0.055 - basin * 0.28 + rays * 0.26,
    0.2,
    1
  )
  const warmth = 0.9 + basin * 0.08
  targetColor.setRGB(brightness * warmth, brightness * 0.98, brightness * 0.9)

  return targetColor
}

function createPlanetGeometry({
  config = PLANET_CONFIGS.moon,
  detail = "balanced",
  craterStrength = 0.95,
  terrainStrength = 0.78,
  heightSampler = null,
} = {}) {
  const selected = DETAIL_LEVELS[detail] || DETAIL_LEVELS.balanced
  const geometry = createWrappedSphereGeometry(
    config,
    selected.width,
    selected.height,
    {
      craterStrength,
      terrainStrength,
      heightSampler,
    }
  )
  const position = geometry.attributes.position
  if (!heightSampler) {
    const color = new THREE.Color()
    const colors = []
    const normal = new THREE.Vector3()

    for (let i = 0; i < position.count; i += 1) {
      normal.set(position.getX(i), position.getY(i), position.getZ(i)).normalize()

      fallbackPlanetColor(normal, config, color)
      colors.push(color.r, color.g, color.b)
    }

    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))
  }
  geometry.computeBoundingSphere()

  return geometry
}

function createStarField() {
  const geometry = new THREE.BufferGeometry()
  const positions = []
  const colors = []
  const color = new THREE.Color()

  for (let i = 0; i < 900; i += 1) {
    const u = seededRandom(i * 3 + 17)
    const v = seededRandom(i * 3 + 23)
    const radius = 18 + seededRandom(i * 3 + 31) * 36
    const theta = u * Math.PI * 2
    const phi = Math.acos(2 * v - 1)

    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    )

    const intensity = 0.36 + seededRandom(i * 7 + 9) * 0.56
    color.setRGB(intensity * 0.86, intensity * 0.9, intensity)
    colors.push(color.r, color.g, color.b)
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))

  return geometry
}

function geometryToObj(geometry, config) {
  const indexed = geometry.index
  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  const uv = geometry.attributes.uv
  const lines = [
    `# Procedural ${config.label.toLowerCase()} mesh`,
    `# Generated by Bergquist Applications ${config.label} Mesh component`,
  ]

  for (let i = 0; i < position.count; i += 1) {
    lines.push(
      `v ${position.getX(i).toFixed(6)} ${position.getY(i).toFixed(6)} ${position
        .getZ(i)
        .toFixed(6)}`
    )
  }

  if (uv) {
    for (let i = 0; i < uv.count; i += 1) {
      lines.push(`vt ${uv.getX(i).toFixed(6)} ${uv.getY(i).toFixed(6)}`)
    }
  }

  if (normal) {
    for (let i = 0; i < normal.count; i += 1) {
      lines.push(
        `vn ${normal.getX(i).toFixed(6)} ${normal.getY(i).toFixed(6)} ${normal
          .getZ(i)
          .toFixed(6)}`
      )
    }
  }

  const faceVertex = (index) => {
    const faceIndex = index + 1
    return uv && normal
      ? `${faceIndex}/${faceIndex}/${faceIndex}`
      : String(faceIndex)
  }

  if (indexed) {
    for (let i = 0; i < indexed.count; i += 3) {
      lines.push(
        `f ${faceVertex(indexed.getX(i))} ${faceVertex(
          indexed.getX(i + 1)
        )} ${faceVertex(indexed.getX(i + 2))}`
      )
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      lines.push(`f ${faceVertex(i)} ${faceVertex(i + 1)} ${faceVertex(i + 2)}`)
    }
  }

  return lines.join("\n")
}

function formatCount(value) {
  return new Intl.NumberFormat("en-US").format(value || 0)
}

function loadTexture(loader, src) {
  return new Promise((resolve, reject) => {
    loader.load(src, resolve, undefined, reject)
  })
}

function preparePlanetTexture(
  texture,
  { color = false, flipY = false, renderer } = {}
) {
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.flipY = flipY
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace
  texture.anisotropy = Math.min(
    8,
    renderer?.capabilities?.getMaxAnisotropy?.() || 1
  )
  texture.needsUpdate = true
}

function framePlanetView({ camera, group, mount, compact, mission = false }) {
  if (!camera || !group) return

  const width = mount?.getBoundingClientRect?.().width || 1200
  const narrow = width < 700

  if (mission) {
    const height = mount?.getBoundingClientRect?.().height || 560
    const span = Math.max(7.3, 5.9/(width/height))
    group.position.set(0, -.45, 0)
    camera.position.set(0, .65, span/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))))
    camera.lookAt(0, .25, 0)
    camera.updateProjectionMatrix()
    return
  }

  group.position.set(narrow ? 0 : 0.62, narrow ? -0.32 : -0.08, 0)
  camera.position.set(0, 0.18, compact ? 9.35 : narrow ? 14.35 : 9.05)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
}

function createPlanetMaterial(config, wireframe) {
  return new THREE.MeshStandardMaterial({
    color: config.materialColor,
    vertexColors: true,
    metalness: 0,
    roughness: config.emissive ? 0.78 : 1,
    emissive: config.emissive ? 0xff6f00 : 0x000000,
    emissiveIntensity: config.emissive ? 1.15 : 0,
    wireframe,
  })
}

function createPlanetAtmosphere(config) {
  if (!config.atmosphere) return null

  const geometry = new THREE.SphereGeometry(
    (config.radius || PLANET_RADIUS) * config.atmosphere.scale,
    96,
    48
  )
  const material = new THREE.MeshBasicMaterial({
    color: config.atmosphere.color,
    transparent: true,
    opacity: config.atmosphere.opacity,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  return new THREE.Mesh(geometry, material)
}

function createRingGeometry(innerRadius, outerRadius, segments = 288, bands = 8) {
  const positions = []
  const uvs = []
  const indices = []

  for (let band = 0; band <= bands; band += 1) {
    const t = band / bands
    const radius = THREE.MathUtils.lerp(innerRadius, outerRadius, t)

    for (let segment = 0; segment <= segments; segment += 1) {
      const angle = (segment / segments) * Math.PI * 2
      positions.push(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      )
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
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  )
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()

  return geometry
}

function createPlanetRing(config, texture, renderer) {
  if (!config.ring || !texture) return null

  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = Math.min(
    8,
    renderer?.capabilities?.getMaxAnisotropy?.() || 1
  )
  texture.needsUpdate = true

  const ring = new THREE.Mesh(
    createRingGeometry(config.ring.innerRadius, config.ring.outerRadius),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: config.ring.opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  )
  ring.rotation.x = config.ring.tilt

  return ring
}

// Shared with the Horizons journey so terrain, texture treatment, and rings stay identical.
export async function createPlanetSurface(planet, renderer, signal, textureSources = {}) {
  const original = PLANET_CONFIGS[planet]
  const config = original && { ...original, ...textureSources }
  if (!config) throw new Error(`Unknown planet: ${planet}`)
  const loader = new THREE.TextureLoader()
  const results = await Promise.allSettled([
    loadTexture(loader, config.albedoSrc),
    config.heightSrc ? loadTexture(loader, config.heightSrc) : null,
    config.ringSrc ? loadTexture(loader, config.ringSrc) : null,
  ])
  const textures = results.filter(result => result.status === "fulfilled").map(result => result.value).filter(Boolean)
  const group = new THREE.Group()
  try {
    signal?.throwIfAborted()
    const failure = results.find(result => result.status === "rejected")
    if (failure) throw failure.reason
    const [albedo, height, ringMap] = results.map(result => result.value)
    if (height) preparePlanetTexture(height, { flipY: config.textureFlipY, renderer })
    const enhanced = createEnhancedAlbedoTexture(albedo.image, renderer, config)
    textures.push(enhanced)
    const geometry = createPlanetGeometry({ config, detail: "quick",
      craterStrength: config.defaultCraterStrength, terrainStrength: config.defaultTerrainStrength,
      heightSampler: height ? createImageSampler(height.image) : null })
    const material = createPlanetMaterial(config, false)
    material.map = enhanced; material.bumpMap = height; material.bumpScale = config.bumpScale
    material.vertexColors = false; material.color.set(0xffffff)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.receiveShadow = true
    group.add(mesh)
    const atmosphere = createPlanetAtmosphere(config)
    if (atmosphere) group.add(atmosphere)
    const ring = createPlanetRing(config, ringMap, renderer)
    if (ring) group.add(ring)
    group.rotation.set(...config.initialRotation)
    group.name = config.label
    group.userData.planet = planet
    group.userData.albedo = config.albedoSrc
    group.userData.height = config.heightSrc
    albedo.dispose()
    for (const texture of [enhanced, height, ringMap].filter(Boolean)) renderer.initTexture(texture)
    return { group, mesh, ring, config }
  } catch (error) {
    textures.forEach(texture => texture.dispose())
    group.traverse(object => { object.geometry?.dispose(); object.material?.dispose() })
    throw error
  }
}

export default function MoonMesh({
  compact = false,
  planet = "moon",
  minHeight = null,
  enableWheelZoom = true,
  mission = null,
}) {
  const config = PLANET_CONFIGS[planet] || PLANET_CONFIGS.moon
  const hasCraters = (CRATER_FIELDS_BY_PLANET[config.key] || []).length > 0
  const mountRef = useRef(null)
  const rendererRef = useRef(null)
  const sceneRef = useRef(null)
  const cameraRef = useRef(null)
  const groupRef = useRef(null)
  const moonRef = useRef(null)
  const starsRef = useRef(null)
  const settingsRef = useRef(null)
  const textureAssetsRef = useRef(null)
  const missionRef = useRef(mission)
  missionRef.current = mission
  const missionControllerRef = useRef(null)
  const textureRevisionRef = useRef(0)
  const [mapError, setMapError] = useState(false)
  const [mapRetry, setMapRetry] = useState(0)
  const hasMission = Boolean(mission && config.key === "mars")
  const [detail, setDetail] = useState(config.defaultDetail)
  const [craterStrength, setCraterStrength] = useState(
    config.defaultCraterStrength
  )
  const [terrainStrength, setTerrainStrength] = useState(
    config.defaultTerrainStrength
  )
  const [rotationSpeed, setRotationSpeed] = useState(
    config.defaultRotationSpeed
  )
  const [wireframe, setWireframe] = useState(false)
  const [autoSpin, setAutoSpin] = useState(true)
  const [mapsReady, setMapsReady] = useState(false)
  const [meshStats, setMeshStats] = useState({ vertices: 0, triangles: 0 })

  useEffect(() => {
    setDetail(config.defaultDetail)
    setCraterStrength(config.defaultCraterStrength)
    setTerrainStrength(config.defaultTerrainStrength)
    setRotationSpeed(config.defaultRotationSpeed)
    setWireframe(false)
    setAutoSpin(true)
    setMapsReady(false)
  }, [config])

  useEffect(() => {
    settingsRef.current = { autoSpin, rotationSpeed }
  }, [autoSpin, rotationSpeed])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined
    setMapError(false)
    setMapsReady(false)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: !hasMission,
      powerPreference: "high-performance",
    })
    renderer.setClearColor(0x030306, 1)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = hasMission ? 0.8 : 0.92
    if (hasMission) {
      renderer.setClearColor(0x000000, 1)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.15 : 1.4))
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
    }
    rendererRef.current = renderer
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x030306, 12, 34)
    sceneRef.current = scene
    let environment = null
    if (hasMission) {
      const pmrem = new THREE.PMREMGenerator(renderer)
      const room = new RoomEnvironment()
      environment = pmrem.fromScene(room, .04)
      scene.environment = environment.texture
      scene.environmentIntensity = .12
      room.dispose()
      pmrem.dispose()
    }

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(0, 0.18, compact ? 8.55 : 8.25)
    cameraRef.current = camera

    const stars = hasMission ? createExpeditionStars() : new THREE.Points(
      createStarField(),
      new THREE.PointsMaterial({
        size: compact ? 0.018 : 0.024,
        vertexColors: true,
        depthWrite: false,
      })
    )
    scene.add(stars)
    starsRef.current = stars

    const group = new THREE.Group()
    group.rotation.set(...config.initialRotation)
    scene.add(group)
    groupRef.current = group

    const moonMaterial = createPlanetMaterial(config, wireframe)
    const moon = new THREE.Mesh(
      createPlanetGeometry({
        config,
        detail: config.defaultDetail,
        craterStrength: config.defaultCraterStrength,
        terrainStrength: config.defaultTerrainStrength,
      }),
      moonMaterial
    )
    moon.receiveShadow = true
    group.add(moon)
    moonRef.current = moon

    const atmosphere = createPlanetAtmosphere(config)
    if (atmosphere) group.add(atmosphere)

    let disposed = false
    const textureLoader = new THREE.TextureLoader()

    Promise.allSettled([
      loadTexture(textureLoader, config.albedoSrc),
      config.heightSrc ? loadTexture(textureLoader, config.heightSrc) : null,
      config.ringSrc ? loadTexture(textureLoader, config.ringSrc) : null,
    ])
      .then(results => {
        const failure = results.find(result => result.status === "rejected")
        if (failure) {
          results.forEach(result => { if (result.status === "fulfilled") result.value?.dispose() })
          throw failure.reason
        }
        return results.map(result => result.value)
      })
      .then(([albedoTexture, heightTexture, ringTexture]) => {
        if (disposed) {
          albedoTexture.dispose()
          heightTexture?.dispose()
          ringTexture?.dispose()
          return
        }

        preparePlanetTexture(albedoTexture, {
          color: true,
          flipY: config.textureFlipY,
          renderer,
        })
        if (heightTexture) {
          preparePlanetTexture(heightTexture, {
            flipY: config.textureFlipY,
            renderer,
          })
        }
        const enhancedAlbedoTexture = createEnhancedAlbedoTexture(
          albedoTexture.image,
          renderer,
          config
        )
        albedoTexture.dispose()

        textureAssetsRef.current = {
          albedoTexture: enhancedAlbedoTexture,
          heightTexture,
          heightSampler: heightTexture ? createImageSampler(heightTexture.image) : null,
        }

        moonMaterial.map = enhancedAlbedoTexture
        moonMaterial.bumpMap = heightTexture
        moonMaterial.bumpScale = config.bumpScale
        if (config.emissive) {
          moonMaterial.emissiveMap = enhancedAlbedoTexture
        }
        moonMaterial.vertexColors = false
        moonMaterial.color.set(0xffffff)
        moonMaterial.needsUpdate = true

        const ring = createPlanetRing(config, ringTexture, renderer)
        if (ring && groupRef.current) {
          groupRef.current.add(ring)
        }

        if (!ring && ringTexture) {
          ringTexture.dispose()
        }

        if (ringTexture) {
          textureAssetsRef.current.ringTexture = ringTexture
        }
        setMapsReady(true)
      })
      .catch((error) => {
        if (disposed) return
        setMapError(true)
        missionRef.current?.onState({ status: "error", phase: "approach", crew: missionRef.current.crew.id })
        console.error(`${config.label} texture loading failed:`, error)
      })

    const ambient = new THREE.AmbientLight(
      config.lights.ambient.color,
      config.lights.ambient.intensity
    )
    scene.add(ambient)

    const key = new THREE.DirectionalLight(
      config.lights.key.color,
      config.lights.key.intensity
    )
    key.position.set(...config.lights.key.position)
    if (hasMission) {
      key.castShadow = true
      const shadowSize = window.innerWidth < 700 ? 1024 : 2048
      key.shadow.mapSize.set(shadowSize, shadowSize)
      Object.assign(key.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: .1, far: 24 })
      key.shadow.bias = -.00015
      key.shadow.normalBias = .003
    }
    scene.add(key)

    const rim = new THREE.DirectionalLight(
      config.lights.rim.color,
      config.lights.rim.intensity
    )
    rim.position.set(...config.lights.rim.position)
    scene.add(rim)

    const fill = new THREE.PointLight(
      config.lights.fill.color,
      config.lights.fill.intensity,
      12
    )
    fill.position.set(...config.lights.fill.position)
    scene.add(fill)

    if (hasMission) {
      missionControllerRef.current = createMarsMission({ scene, group, moon, renderer, camera, mount,
        onState: state => missionRef.current?.onState(state) })
      missionRef.current?.onState({ status: "loading", phase: "approach", crew: missionRef.current.crew.id })
    }

    const drag = {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    }

    const resize = () => {
      const rect = mount.getBoundingClientRect()
      const width = Math.max(1, Math.floor(rect.width))
      const height = Math.max(1, Math.floor(rect.height))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      framePlanetView({ camera, group, mount, compact, mission: hasMission })
    }

    const onPointerDown = (event) => {
      drag.active = true
      drag.x = event.clientX
      drag.y = event.clientY
      renderer.domElement.setPointerCapture?.(event.pointerId)
    }

    const onPointerMove = (event) => {
      if (!drag.active || !groupRef.current) return
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      drag.x = event.clientX
      drag.y = event.clientY
      drag.vx = dx * 0.006
      drag.vy = dy * 0.004
      groupRef.current.rotation.y += drag.vx
      groupRef.current.rotation.x = THREE.MathUtils.clamp(
        groupRef.current.rotation.x + drag.vy,
        -1.08,
        1.08
      )
    }

    const onPointerUp = (event) => {
      drag.active = false
      renderer.domElement.releasePointerCapture?.(event.pointerId)
    }

    const onWheel = (event) => {
      event.preventDefault()
      if (!cameraRef.current) return
      cameraRef.current.position.z = THREE.MathUtils.clamp(
        cameraRef.current.position.z + event.deltaY * 0.005,
        4.3,
        14.5
      )
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown)
    renderer.domElement.addEventListener("pointermove", onPointerMove)
    renderer.domElement.addEventListener("pointerup", onPointerUp)
    renderer.domElement.addEventListener("pointerleave", onPointerUp)
    renderer.domElement.style.touchAction = "pan-y"
    renderer.domElement.style.userSelect = "none"
    if (enableWheelZoom) {
      renderer.domElement.addEventListener("wheel", onWheel, { passive: false })
    }

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null
    observer?.observe(mount)
    window.addEventListener("resize", resize)
    resize()

    let frameId = 0
    const clock = new THREE.Clock()
    let inView = !hasMission

    const render = () => {
      frameId = 0
      if (disposed || (hasMission && (!inView || document.hidden))) return
      const delta = Math.min(clock.getDelta(), .25)
      const settings = settingsRef.current || {
        autoSpin: true,
        rotationSpeed: config.defaultRotationSpeed,
      }

      if (groupRef.current && settings.autoSpin && !hasMission) {
        groupRef.current.rotation.y += delta * settings.rotationSpeed
      }

      if (starsRef.current && !hasMission) {
        starsRef.current.rotation.y += delta * 0.008
        starsRef.current.rotation.x += delta * 0.003
      }

      missionControllerRef.current?.update(delta)

      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(render)
    }

    const resume = () => {
      window.cancelAnimationFrame(frameId)
      clock.getDelta()
      render()
    }
    const visibility = hasMission ? new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= .45
      mount.dataset.missionVisible = String(inView)
      resume()
    }, { threshold: [0, .45] }) : null
    visibility?.observe(mount)
    if (hasMission) document.addEventListener("visibilitychange", resume)

    render()

    return () => {
      disposed = true
      window.cancelAnimationFrame(frameId)
      visibility?.disconnect()
      document.removeEventListener("visibilitychange", resume)
      missionControllerRef.current?.dispose()
      missionControllerRef.current = null
      environment?.dispose()
      key.shadow?.dispose()
      observer?.disconnect()
      window.removeEventListener("resize", resize)
      renderer.domElement.removeEventListener("pointerdown", onPointerDown)
      renderer.domElement.removeEventListener("pointermove", onPointerMove)
      renderer.domElement.removeEventListener("pointerup", onPointerUp)
      renderer.domElement.removeEventListener("pointerleave", onPointerUp)
      if (enableWheelZoom) {
        renderer.domElement.removeEventListener("wheel", onWheel)
      }

      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose()
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose())
          } else {
            object.material.dispose()
          }
        }
      })

      if (textureAssetsRef.current) {
        textureAssetsRef.current.albedoTexture?.dispose()
        textureAssetsRef.current.heightTexture?.dispose()
        textureAssetsRef.current.ringTexture?.dispose()
        textureAssetsRef.current = null
      }

      renderer.dispose()
      renderer.domElement.remove()
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
      groupRef.current = null
      moonRef.current = null
      starsRef.current = null
    }
  }, [compact, config, enableWheelZoom, hasMission, mapRetry])

  useEffect(() => {
    const moon = moonRef.current
    if (!moon) return

    const nextGeometry = createPlanetGeometry({
      config,
      detail,
      craterStrength,
      terrainStrength,
      heightSampler: textureAssetsRef.current?.heightSampler || null,
    })
    const previousGeometry = moon.geometry
    moon.geometry = nextGeometry
    previousGeometry?.dispose()

    setMeshStats({
      vertices: nextGeometry.attributes.position.count,
      triangles: nextGeometry.index
        ? Math.floor(nextGeometry.index.count / 3)
        : Math.floor(nextGeometry.attributes.position.count / 3),
    })
  }, [config, detail, craterStrength, terrainStrength, mapsReady])

  useEffect(() => {
    const controller = missionControllerRef.current
    if (!controller || !mission) return
    if (mapError) {
      if (textureRevisionRef.current !== mission.revision) {
        textureRevisionRef.current = mission.revision
        setMapRetry(value => value+1)
      }
      return
    }
    textureRevisionRef.current = mission.revision
    controller.setPaused(mission.paused)
    if (mapsReady) controller.setCrew(mission.crew, mission.revision)
  }, [mission, mapsReady, mapError])

  useEffect(() => {
    if (moonRef.current?.material) {
      moonRef.current.material.wireframe = wireframe
      moonRef.current.material.needsUpdate = true
    }
  }, [wireframe])

  function handleReset() {
    setDetail(config.defaultDetail)
    setCraterStrength(config.defaultCraterStrength)
    setTerrainStrength(config.defaultTerrainStrength)
    setRotationSpeed(config.defaultRotationSpeed)
    setWireframe(false)
    setAutoSpin(true)

    if (groupRef.current) {
      groupRef.current.rotation.set(...config.initialRotation)
    }

    framePlanetView({
      camera: cameraRef.current,
      group: groupRef.current,
      mount: mountRef.current,
      compact,
      mission: hasMission,
    })
  }

  function handleDownloadObj() {
    const geometry = moonRef.current?.geometry
    if (!geometry || typeof window === "undefined") return

    const blob = new Blob([geometryToObj(geometry, config)], {
      type: "text/plain;charset=utf-8",
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${config.key}-mesh-${detail}.obj`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        minHeight:
          minHeight ??
          (compact
            ? 700
            : { xs: "calc(100vh - 150px)", sm: "calc(100vh - 170px)", md: 720 }),
        overflow: "hidden",
        background: "#000000",
      }}
    >
      <Box
        ref={mountRef}
        data-testid="planet-mesh-canvas"
        data-planet-mesh-canvas={config.key}
        role={hasMission ? "img" : undefined}
        aria-label={hasMission ? `${mission.crew.name} and ${mission.crew.ship} arriving on Mars, with landing gear, an opening cockpit and an astronaut exploring the surface` : undefined}
        sx={{
          position: "absolute",
          inset: 0,
          cursor: "grab",
          "&:active": {
            cursor: "grabbing",
          },
          "& canvas": {
            width: "100% !important",
            height: "100% !important",
            display: "block",
          },
        }}
      />

      <Box
        sx={{
          display: hasMission ? "none" : "block",
          pointerEvents: "none",
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.56) 0%, rgba(0,0,0,0.08) 46%, rgba(0,0,0,0.42) 100%)",
        }}
      />

      {!compact ? (
        <Stack
          spacing={1.4}
          sx={{
            position: "absolute",
            left: { xs: 12, sm: 18, md: 24 },
            top: { xs: 12, sm: 18, md: 24 },
            width: { xs: "calc(100% - 24px)", sm: 360 },
            maxWidth: "calc(100% - 24px)",
            borderRadius: "8px",
            border: "1px solid rgba(242,238,225,0.16)",
            background: "rgba(5,5,8,0.76)",
            boxShadow: "0 20px 55px rgba(0,0,0,0.34)",
            backdropFilter: "blur(14px)",
            p: { xs: 1.1, sm: 1.5 },
          }}
        >
          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
            <Chip
              size="small"
              label={`${formatCount(meshStats.vertices)} vertices`}
              sx={{
                color: "rgba(255,255,255,0.88)",
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <Chip
              size="small"
              label={`${formatCount(meshStats.triangles)} faces`}
              sx={{
                color: "rgba(255,255,255,0.88)",
                background: "rgba(255,255,255,0.08)",
              }}
            />
          </Stack>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={detail}
            onChange={(event, nextDetail) => {
              if (nextDetail) setDetail(nextDetail)
            }}
            sx={{
              width: "100%",
              "& .MuiToggleButtonGroup-grouped": {
                flex: 1,
                color: "rgba(255,255,255,0.72)",
                borderColor: "rgba(242,238,225,0.16)",
                borderRadius: "8px",
                textTransform: "none",
                minHeight: 44,
                "&.Mui-selected": {
                  color: "#d6c9ff",
                  background: "#211c2e",
                },
                "&.Mui-selected:hover": {
                  background: "#2c253d",
                },
              },
            }}
          >
            <ToggleButton value="quick">Quick</ToggleButton>
            <ToggleButton value="balanced">Balanced</ToggleButton>
            <ToggleButton value="high">High</ToggleButton>
          </ToggleButtonGroup>

          {hasCraters ? (
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.76)",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Craters
              </Typography>
              <Slider
                min={0.2}
                max={1.55}
                step={0.05}
                value={craterStrength}
                onChange={(event, value) => setCraterStrength(value)}
                sx={{
                  color: "#b0a0ec",
                  height: 6,
                  "& .MuiSlider-thumb": { width: 16, height: 16 },
                }}
              />
            </Box>
          ) : null}

          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.76)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Terrain
            </Typography>
            <Slider
              min={0.1}
              max={1.35}
              step={0.05}
              value={terrainStrength}
              onChange={(event, value) => setTerrainStrength(value)}
              sx={{
                color: "#b0a0ec",
                height: 6,
                "& .MuiSlider-thumb": { width: 16, height: 16 },
              }}
            />
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title={autoSpin ? "Pause rotation" : "Resume rotation"}>
              <IconButton
                aria-label={autoSpin ? "Pause rotation" : "Resume rotation"}
                onClick={() => setAutoSpin((current) => !current)}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "8px",
                  color: autoSpin ? "#b0a0ec" : "rgba(255,255,255,0.68)",
                  border: "1px solid rgba(242,238,225,0.16)",
                }}
              >
                <ThreeDRotationRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title={wireframe ? "Solid mesh" : "Wireframe mesh"}>
              <IconButton
                aria-label={wireframe ? "Show solid mesh" : "Show wireframe mesh"}
                onClick={() => setWireframe((current) => !current)}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "8px",
                  color: wireframe ? "#b0a0ec" : "rgba(255,255,255,0.68)",
                  border: "1px solid rgba(242,238,225,0.16)",
                }}
              >
                <GridOnRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Reset view">
              <IconButton
                aria-label={`Reset ${config.label.toLowerCase()} mesh view`}
                onClick={handleReset}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "8px",
                  color: "rgba(255,255,255,0.72)",
                  border: "1px solid rgba(242,238,225,0.16)",
                }}
              >
                <RestartAltRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Box sx={{ flex: 1 }} />

            <Tooltip title="Download OBJ">
              <IconButton
                aria-label={`Download ${config.label.toLowerCase()} mesh OBJ`}
                onClick={handleDownloadObj}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "8px",
                  color: "#f0e2bd",
                  border: "1px solid rgba(242,238,225,0.22)",
                  background: "rgba(222,211,183,0.1)",
                  "&:hover": {
                    background: "rgba(222,211,183,0.16)",
                  },
                }}
              >
                <DownloadRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.76)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              Spin
            </Typography>
            <Slider
              min={0}
              max={1.1}
              step={0.02}
              value={rotationSpeed}
              onChange={(event, value) => setRotationSpeed(value)}
              sx={{
                color: "#d7e4ff",
                height: 6,
                "& .MuiSlider-thumb": { width: 16, height: 16 },
              }}
            />
          </Box>
        </Stack>
      ) : null}
    </Box>
  )
}
