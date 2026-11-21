import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Box,
  IconButton,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material"
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded"
import KeyboardArrowLeftRoundedIcon from "@mui/icons-material/KeyboardArrowLeftRounded"
import KeyboardArrowRightRoundedIcon from "@mui/icons-material/KeyboardArrowRightRounded"
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded"
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded"
import ThreeDRotationRoundedIcon from "@mui/icons-material/ThreeDRotationRounded"
import * as THREE from "three"

const TAU = Math.PI * 2
const MOVE_LIMIT = 2.4
const DEPTH_LIMIT = 1.8

const ANIMATION_OPTIONS = [
  { value: "idle", label: "Idle" },
  { value: "wave", label: "Wave" },
  { value: "walk", label: "Walk" },
  { value: "float", label: "Float" },
  { value: "salute", label: "Salute" },
]

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function lerp(current, target, amount) {
  return current + (target - current) * amount
}

function degToRad(value) {
  return (value * Math.PI) / 180
}

function seededRandom(seed) {
  let state = seed >>> 0

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function createStarField() {
  const random = seededRandom(47291)
  const positions = []
  const colors = []

  for (let i = 0; i < 520; i += 1) {
    const radius = 28 + random() * 48
    const theta = random() * TAU
    const phi = Math.acos(2 * random() - 1)
    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.cos(phi) * 0.64 + 6
    const z = radius * Math.sin(phi) * Math.sin(theta)
    const cool = random()

    positions.push(x, y, z)
    colors.push(0.58 + cool * 0.28, 0.64 + cool * 0.2, 0.94 + cool * 0.06)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))

  return geometry
}

function createCapsule(radius, length, material, capSegments = 12, radialSegments = 28) {
  return new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments),
    material
  )
}

function createJoint(material, radius = 0.2) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), material)
}

function createLimbSegment(length, radius, material, scale = { x: 1, y: 1, z: 1 }) {
  const group = new THREE.Group()
  const segment = createCapsule(radius, length - radius * 2, material, 10, 24)
  segment.position.y = -length / 2
  segment.scale.set(scale.x || 1, scale.y || 1, scale.z || 1)
  group.add(segment)
  return group
}

function createHose(start, control, end, material) {
  const curve = new THREE.QuadraticBezierCurve3(start, control, end)
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.026, 10, false), material)
}

function createSuitTexture(seed, baseColor, threadColor) {
  if (typeof document === "undefined") return null

  const random = seededRandom(seed)
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 256

  const context = canvas.getContext("2d")
  if (!context) return null

  context.fillStyle = baseColor
  context.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 1800; i += 1) {
    const shade = 190 + random() * 52
    context.fillStyle = `rgba(${shade}, ${shade}, ${shade + 8}, ${0.018 + random() * 0.04})`
    context.fillRect(random() * 256, random() * 256, 1 + random() * 2.5, 1 + random() * 2.5)
  }

  context.strokeStyle = threadColor
  context.lineWidth = 1
  context.globalAlpha = 0.24
  for (let offset = -256; offset < 512; offset += 22) {
    context.beginPath()
    context.moveTo(offset, 256)
    context.lineTo(offset + 256, 0)
    context.stroke()
  }

  context.globalAlpha = 0.18
  for (let y = 12; y < 256; y += 30) {
    context.beginPath()
    context.moveTo(0, y + random() * 4)
    context.lineTo(256, y + random() * 4)
    context.stroke()
  }
  context.globalAlpha = 1

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2.7, 3.6)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true

  return texture
}

function createPatchTexture(kind) {
  if (typeof document === "undefined") return null

  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 80

  const context = canvas.getContext("2d")
  if (!context) return null

  context.clearRect(0, 0, canvas.width, canvas.height)

  if (kind === "flag") {
    context.fillStyle = "#f8fafc"
    context.fillRect(0, 0, 128, 80)
    context.fillStyle = "#dc2626"
    for (let y = 0; y < 80; y += 12) {
      context.fillRect(0, y, 128, 6)
    }
    context.fillStyle = "#1d4ed8"
    context.fillRect(0, 0, 54, 42)
    context.fillStyle = "#f8fafc"
    for (let y = 8; y < 38; y += 10) {
      for (let x = 8; x < 50; x += 10) {
        context.beginPath()
        context.arc(x, y, 1.6, 0, TAU)
        context.fill()
      }
    }
  } else {
    context.fillStyle = "#111827"
    context.fillRect(0, 0, 128, 80)
    context.strokeStyle = "#8bdcff"
    context.lineWidth = 5
    context.strokeRect(5, 5, 118, 70)
    context.fillStyle = "#f8fafc"
    context.font = "bold 32px Arial"
    context.textAlign = "center"
    context.textBaseline = "middle"
    context.fillText(kind === "eva" ? "EVA" : "BA", 64, 42)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createPatchMesh(material, width, height) {
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material)
}

function createFrontPanel(width, height, depth, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
}

function addRibbedSleeve(parent, radius, startY, count, spacing, material, zScale = 0.82) {
  for (let i = 0; i < count; i += 1) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.014, 8, 36), material)
    rib.rotation.x = Math.PI / 2
    rib.position.y = startY - i * spacing
    rib.scale.z = zScale
    parent.add(rib)
  }
}

function addSuitSeam(parent, width, y, z, material) {
  const seam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.018, 0.018), material)
  seam.position.set(0, y, z)
  parent.add(seam)
  return seam
}

function createGlove(side, materials) {
  const glove = new THREE.Group()

  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), materials.glove)
  palm.position.set(0, -0.04, 0.02)
  palm.scale.set(0.82, 1.02, 0.62)
  glove.add(palm)

  for (let i = 0; i < 4; i += 1) {
    const finger = createCapsule(0.024, 0.18, materials.glove, 6, 12)
    finger.position.set(-0.075 + i * 0.05, -0.2, 0.045)
    finger.rotation.x = degToRad(8)
    glove.add(finger)
  }

  const thumb = createCapsule(0.032, 0.2, materials.glove, 6, 12)
  thumb.position.set(side * -0.13, -0.08, 0.035)
  thumb.rotation.z = side * degToRad(55)
  thumb.rotation.x = degToRad(-18)
  glove.add(thumb)

  return glove
}

function addButtonCluster(parent, material, startX, startY, startZ) {
  const colors = [0x22d3ee, 0x7c3aed, 0xfff2d2, 0x4f46e5]

  colors.forEach((color, index) => {
    const buttonMaterial = material.clone()
    buttonMaterial.color.setHex(color)
    buttonMaterial.emissive.setHex(color)
    buttonMaterial.emissiveIntensity = 0.22

    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.018, 16),
      buttonMaterial
    )
    button.rotation.x = Math.PI / 2
    button.position.set(startX + (index % 2) * 0.13, startY - Math.floor(index / 2) * 0.11, startZ)
    parent.add(button)
  })
}

function createArm(side, materials) {
  const shoulder = new THREE.Group()
  shoulder.name = side < 0 ? "leftShoulder" : "rightShoulder"

  const shoulderJoint = createJoint(materials.suitSecondary, 0.16)
  shoulderJoint.scale.set(1.08, 0.9, 0.82)
  shoulder.add(shoulderJoint)

  const upper = createLimbSegment(1.12, 0.145, materials.suit, {
    x: 0.92,
    y: 1,
    z: 0.76,
  })
  addRibbedSleeve(upper, 0.14, -0.18, 5, 0.07, materials.seam, 0.72)
  shoulder.add(upper)

  const missionPatch = createPatchMesh(
    side < 0 ? materials.flagPatch : materials.evaPatch,
    0.18,
    0.115
  )
  missionPatch.position.set(side * 0.09, -0.36, 0.125)
  missionPatch.rotation.y = side * degToRad(10)
  upper.add(missionPatch)

  const elbow = new THREE.Group()
  elbow.name = side < 0 ? "leftElbow" : "rightElbow"
  elbow.position.y = -1.12
  shoulder.add(elbow)

  const elbowJoint = createJoint(materials.flex, 0.14)
  elbowJoint.scale.set(0.92, 0.86, 0.78)
  elbow.add(elbowJoint)
  addRibbedSleeve(elbow, 0.14, -0.03, 4, 0.04, materials.seam, 0.76)

  const lower = createLimbSegment(0.98, 0.13, materials.suitSecondary, {
    x: 0.9,
    y: 1,
    z: 0.74,
  })
  addRibbedSleeve(lower, 0.125, -0.6, 4, 0.055, materials.seam, 0.72)
  elbow.add(lower)

  const wrist = new THREE.Group()
  wrist.position.y = -0.98
  elbow.add(wrist)

  const glove = createGlove(side, materials)
  wrist.add(glove)

  const cuff = new THREE.Mesh(
    new THREE.TorusGeometry(0.145, 0.026, 10, 32),
    materials.trim
  )
  cuff.rotation.x = Math.PI / 2
  cuff.position.y = -0.7
  cuff.scale.z = 0.76
  elbow.add(cuff)

  return { shoulder, elbow, wrist }
}

function createLeg(side, materials) {
  const hip = new THREE.Group()
  hip.name = side < 0 ? "leftHip" : "rightHip"

  const hipJoint = createJoint(materials.flex, 0.17)
  hipJoint.scale.set(0.95, 0.8, 0.76)
  hip.add(hipJoint)

  const upper = createLimbSegment(1.32, 0.165, materials.suit, {
    x: 0.92,
    y: 1,
    z: 0.78,
  })
  addRibbedSleeve(upper, 0.155, -0.16, 4, 0.065, materials.seam, 0.76)
  addSuitSeam(upper, 0.18, -0.55, 0.13, materials.trim)
  hip.add(upper)

  const knee = new THREE.Group()
  knee.name = side < 0 ? "leftKnee" : "rightKnee"
  knee.position.y = -1.32
  hip.add(knee)

  const kneeJoint = createJoint(materials.flex, 0.155)
  kneeJoint.scale.set(0.92, 0.78, 0.74)
  knee.add(kneeJoint)
  addRibbedSleeve(knee, 0.152, -0.04, 5, 0.04, materials.seam, 0.76)

  const lower = createLimbSegment(1.22, 0.145, materials.suitSecondary, {
    x: 0.88,
    y: 1,
    z: 0.74,
  })
  addRibbedSleeve(lower, 0.138, -0.58, 5, 0.055, materials.seam, 0.72)
  knee.add(lower)

  const ankle = new THREE.Group()
  ankle.position.y = -1.22
  knee.add(ankle)

  const ankleCuff = new THREE.Mesh(
    new THREE.TorusGeometry(0.145, 0.032, 10, 34),
    materials.trim
  )
  ankleCuff.rotation.x = Math.PI / 2
  ankleCuff.scale.z = 0.76
  ankleCuff.position.y = 0.02
  ankle.add(ankleCuff)

  const boot = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.24, 0.58),
    materials.boot
  )
  boot.position.set(0, -0.13, 0.16)
  boot.rotation.x = degToRad(-4)
  ankle.add(boot)

  const toe = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.16, 0.32),
    materials.boot
  )
  toe.position.set(0, -0.16, 0.43)
  toe.rotation.x = degToRad(-7)
  ankle.add(toe)

  const sole = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.055, 0.72),
    materials.flex
  )
  sole.position.set(0, -0.285, 0.2)
  ankle.add(sole)

  return { hip, knee, ankle }
}

function createAstronautRig() {
  const suitMap = createSuitTexture(8192, "#f2f4ef", "rgba(148, 163, 184, 0.48)")
  const secondaryMap = createSuitTexture(4187, "#dfe5ee", "rgba(100, 116, 139, 0.42)")

  const materials = {
    suit: new THREE.MeshStandardMaterial({
      color: 0xf3f5ef,
      map: suitMap,
      bumpMap: suitMap,
      bumpScale: 0.012,
      roughness: 0.88,
      metalness: 0.02,
    }),
    suitSecondary: new THREE.MeshStandardMaterial({
      color: 0xe0e6ef,
      map: secondaryMap,
      bumpMap: secondaryMap,
      bumpScale: 0.01,
      roughness: 0.9,
      metalness: 0.02,
    }),
    trim: new THREE.MeshStandardMaterial({
      color: 0x8cc8ff,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.12,
      roughness: 0.48,
      metalness: 0.18,
    }),
    seam: new THREE.MeshStandardMaterial({
      color: 0x50627b,
      roughness: 0.76,
      metalness: 0.08,
    }),
    flex: new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.72,
      metalness: 0.06,
    }),
    glove: new THREE.MeshStandardMaterial({
      color: 0xf7f7f0,
      map: suitMap,
      roughness: 0.82,
      metalness: 0.02,
    }),
    boot: new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.68,
      metalness: 0.08,
    }),
    pack: new THREE.MeshStandardMaterial({
      color: 0xd7dde7,
      roughness: 0.78,
      metalness: 0.04,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: 0x9aa8b8,
      roughness: 0.44,
      metalness: 0.42,
    }),
    controlPanel: new THREE.MeshStandardMaterial({
      color: 0x151827,
      roughness: 0.5,
      metalness: 0.18,
    }),
    visor: new THREE.MeshPhysicalMaterial({
      color: 0x24150a,
      emissive: 0xffb84d,
      emissiveIntensity: 0.12,
      roughness: 0.08,
      metalness: 0.65,
      transparent: true,
      opacity: 0.86,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      side: THREE.DoubleSide,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x8bdcff,
      transparent: true,
      opacity: 0.18,
      roughness: 0.04,
      metalness: 0,
      transmission: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    flagPatch: new THREE.MeshBasicMaterial({
      map: createPatchTexture("flag"),
      transparent: true,
      side: THREE.DoubleSide,
    }),
    evaPatch: new THREE.MeshBasicMaterial({
      map: createPatchTexture("eva"),
      transparent: true,
      side: THREE.DoubleSide,
    }),
    namePatch: new THREE.MeshBasicMaterial({
      map: createPatchTexture("ba"),
      transparent: true,
      side: THREE.DoubleSide,
    }),
  }

  const root = new THREE.Group()
  const body = new THREE.Group()
  body.position.y = 0
  root.add(body)

  const torso = new THREE.Group()
  torso.position.y = 1.02
  body.add(torso)

  const torsoShell = createCapsule(0.48, 1.18, materials.suit, 16, 42)
  torsoShell.scale.set(1.04, 1, 0.66)
  torsoShell.position.y = 0.02
  torso.add(torsoShell)

  const hardUpperTorso = createFrontPanel(0.86, 0.88, 0.1, materials.suitSecondary)
  hardUpperTorso.position.set(0, 0.08, 0.34)
  torso.add(hardUpperTorso)

  const shoulderYoke = createFrontPanel(1.18, 0.16, 0.54, materials.suitSecondary)
  shoulderYoke.position.set(0, 0.52, 0)
  torso.add(shoulderYoke)

  const chestHarness = createFrontPanel(0.96, 0.045, 0.035, materials.seam)
  chestHarness.position.set(0, 0.4, 0.415)
  torso.add(chestHarness)

  const leftStrap = createFrontPanel(0.055, 0.76, 0.035, materials.seam)
  leftStrap.position.set(-0.32, 0.04, 0.425)
  leftStrap.rotation.z = degToRad(-5)
  torso.add(leftStrap)

  const rightStrap = createFrontPanel(0.055, 0.76, 0.035, materials.seam)
  rightStrap.position.set(0.32, 0.04, 0.425)
  rightStrap.rotation.z = degToRad(5)
  torso.add(rightStrap)

  const torsoTrimTop = new THREE.Mesh(
    new THREE.TorusGeometry(0.45, 0.026, 12, 48),
    materials.trim
  )
  torsoTrimTop.rotation.x = Math.PI / 2
  torsoTrimTop.position.y = 0.49
  torsoTrimTop.scale.z = 0.64
  torso.add(torsoTrimTop)

  addRibbedSleeve(torso, 0.43, -0.37, 5, 0.055, materials.seam, 0.62)

  const chestPanel = createFrontPanel(0.48, 0.35, 0.075, materials.controlPanel)
  chestPanel.position.set(0.12, 0.05, 0.45)
  torso.add(chestPanel)
  addButtonCluster(torso, materials.trim, 0.01, 0.13, 0.505)

  const displayStrip = createFrontPanel(0.3, 0.04, 0.022, materials.trim)
  displayStrip.position.set(0.12, 0.22, 0.505)
  torso.add(displayStrip)

  const namePatch = createPatchMesh(materials.namePatch, 0.24, 0.15)
  namePatch.position.set(-0.24, 0.25, 0.405)
  torso.add(namePatch)

  const belt = createFrontPanel(1.0, 0.14, 0.62, materials.flex)
  belt.position.y = -0.55
  torso.add(belt)

  const beltBuckle = createFrontPanel(0.2, 0.16, 0.04, materials.metal)
  beltBuckle.position.set(0, -0.55, 0.34)
  torso.add(beltBuckle)

  const backpack = createFrontPanel(0.72, 1.16, 0.34, materials.pack)
  backpack.position.set(0, 0.02, -0.48)
  torso.add(backpack)

  ;[-0.28, 0.28].forEach((x) => {
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.105, 1.04, 24),
      materials.metal
    )
    tank.position.set(x, 0.02, -0.72)
    torso.add(tank)

    const tankBandTop = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.012, 8, 24),
      materials.trim
    )
    tankBandTop.rotation.x = Math.PI / 2
    tankBandTop.position.set(x, 0.38, -0.72)
    torso.add(tankBandTop)

    const tankBandBottom = tankBandTop.clone()
    tankBandBottom.position.y = -0.34
    torso.add(tankBandBottom)
  })

  const packLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 20, 12),
    materials.trim
  )
  packLight.position.set(0.2, 0.4, -0.82)
  torso.add(packLight)

  const pelvis = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.36, 0.42, 12, 32),
    materials.suitSecondary
  )
  pelvis.rotation.z = Math.PI / 2
  pelvis.scale.z = 0.62
  pelvis.position.y = 0.16
  body.add(pelvis)

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.27, 0.26, 36),
    materials.trim
  )
  neck.position.y = 1.76
  body.add(neck)

  const collarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.05, 12, 52),
    materials.flex
  )
  collarRing.rotation.x = Math.PI / 2
  collarRing.position.y = 1.72
  collarRing.scale.z = 0.72
  body.add(collarRing)

  const head = new THREE.Group()
  head.position.y = 2.22
  body.add(head)

  const helmetShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.43, 56, 32),
    materials.suit
  )
  helmetShell.scale.set(1.04, 1.02, 0.9)
  head.add(helmetShell)

  const helmetGlass = new THREE.Mesh(
    new THREE.SphereGeometry(0.445, 56, 32),
    materials.glass
  )
  helmetGlass.scale.set(1.04, 1.02, 0.9)
  head.add(helmetGlass)

  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.31, 44, 24),
    materials.visor
  )
  visor.position.set(0, 0.03, 0.34)
  visor.scale.set(1.2, 0.62, 0.18)
  head.add(visor)

  const visorTrim = new THREE.Mesh(
    new THREE.TorusGeometry(0.335, 0.024, 12, 56),
    materials.trim
  )
  visorTrim.position.z = 0.35
  visorTrim.scale.set(1.06, 0.58, 1)
  head.add(visorTrim)

  const visorReflection = createFrontPanel(0.22, 0.022, 0.012, materials.trim)
  visorReflection.position.set(-0.07, 0.15, 0.405)
  visorReflection.rotation.z = degToRad(-6)
  head.add(visorReflection)

  const browSeal = createFrontPanel(0.54, 0.048, 0.035, materials.flex)
  browSeal.position.set(0, 0.245, 0.34)
  head.add(browSeal)

  const helmetRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.31, 0.036, 12, 44),
    materials.flex
  )
  helmetRim.rotation.x = Math.PI / 2
  helmetRim.position.y = -0.42
  helmetRim.scale.z = 0.72
  head.add(helmetRim)

  ;[-1, 1].forEach((side) => {
    const helmetPort = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.08, 24),
      materials.metal
    )
    helmetPort.rotation.z = Math.PI / 2
    helmetPort.position.set(side * 0.43, -0.03, 0.02)
    head.add(helmetPort)

    const shoulderConnector = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 18, 12),
      materials.metal
    )
    shoulderConnector.position.set(side * 0.38, -0.2, 0.16)
    head.add(shoulderConnector)
  })

  const leftArm = createArm(-1, materials)
  const rightArm = createArm(1, materials)
  leftArm.shoulder.position.set(-0.66, 1.55, 0)
  rightArm.shoulder.position.set(0.66, 1.55, 0)
  body.add(leftArm.shoulder, rightArm.shoulder)

  const leftLeg = createLeg(-1, materials)
  const rightLeg = createLeg(1, materials)
  leftLeg.hip.position.set(-0.28, 0.14, 0)
  rightLeg.hip.position.set(0.28, 0.14, 0)
  body.add(leftLeg.hip, rightLeg.hip)

  const leftHose = createHose(
    new THREE.Vector3(-0.24, 1.77, -0.04),
    new THREE.Vector3(-0.78, 1.46, -0.54),
    new THREE.Vector3(-0.32, 0.62, -0.72),
    materials.trim
  )
  const rightHose = createHose(
    new THREE.Vector3(0.24, 1.77, -0.04),
    new THREE.Vector3(0.78, 1.46, -0.54),
    new THREE.Vector3(0.32, 0.62, -0.72),
    materials.trim
  )
  const chestHose = createHose(
    new THREE.Vector3(0.42, 1.08, 0.34),
    new THREE.Vector3(0.82, 0.95, -0.12),
    new THREE.Vector3(0.42, 0.48, -0.62),
    materials.metal
  )
  body.add(leftHose, rightHose, chestHose)

  const helmetCamera = createFrontPanel(0.13, 0.07, 0.08, materials.metal)
  helmetCamera.position.set(0.16, 0.39, 0.14)
  helmetCamera.rotation.z = degToRad(-6)
  head.add(helmetCamera)

  const helmetLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 16, 10),
    materials.trim
  )
  helmetLight.position.set(0.2, 0.39, 0.19)
  head.add(helmetLight)

  root.scale.setScalar(0.98)

  return {
    root,
    body,
    head,
    torso,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
  }
}

function setRotation(object, target, blend = 0.22) {
  object.rotation.x = lerp(object.rotation.x, target.x || 0, blend)
  object.rotation.y = lerp(object.rotation.y, target.y || 0, blend)
  object.rotation.z = lerp(object.rotation.z, target.z || 0, blend)
}

function applyAstronautPose(rig, animation, elapsed, blend = 0.24) {
  const wave = Math.sin(elapsed * 5.4)
  const walk = Math.sin(elapsed * 4.6)
  const walkOpposite = Math.sin(elapsed * 4.6 + Math.PI)
  const float = Math.sin(elapsed * 1.5)

  const base = {
    body: { x: 0, y: 0, z: Math.sin(elapsed * 0.8) * 0.025 },
    torso: { x: 0, y: 0, z: 0 },
    head: { x: 0.02 * Math.sin(elapsed * 0.9), y: 0.08 * Math.sin(elapsed * 0.65), z: 0 },
    leftShoulder: { x: 0, y: 0, z: 0.24 },
    rightShoulder: { x: 0, y: 0, z: -0.24 },
    leftElbow: { x: -0.08, y: 0, z: -0.16 },
    rightElbow: { x: -0.08, y: 0, z: 0.16 },
    leftHip: { x: 0.06, y: 0, z: 0.06 },
    rightHip: { x: -0.06, y: 0, z: -0.06 },
    leftKnee: { x: 0.18, y: 0, z: 0 },
    rightKnee: { x: 0.18, y: 0, z: 0 },
  }

  if (animation === "wave") {
    base.body.z = 0.04 * Math.sin(elapsed * 1.2)
    base.rightShoulder = { x: 0.18 * wave, y: 0.06 * wave, z: -2.1 }
    base.rightElbow = { x: 0.1 * wave, y: 0, z: -0.92 - Math.abs(wave) * 0.38 }
    base.leftShoulder = { x: 0.08, y: 0, z: 0.36 }
    base.leftElbow = { x: -0.08, y: 0, z: -0.28 }
  }

  if (animation === "walk") {
    base.body.x = 0.045 * walk
    base.body.z = 0.035 * walk
    base.leftShoulder = { x: walkOpposite * 0.58, y: 0, z: 0.24 }
    base.rightShoulder = { x: walk * 0.58, y: 0, z: -0.24 }
    base.leftElbow = { x: -0.25 - Math.max(0, walk) * 0.2, y: 0, z: -0.1 }
    base.rightElbow = { x: -0.25 - Math.max(0, walkOpposite) * 0.2, y: 0, z: 0.1 }
    base.leftHip = { x: walk * 0.7, y: 0, z: 0.06 }
    base.rightHip = { x: walkOpposite * 0.7, y: 0, z: -0.06 }
    base.leftKnee = { x: 0.2 + Math.max(0, -walk) * 0.78, y: 0, z: 0 }
    base.rightKnee = { x: 0.2 + Math.max(0, walk) * 0.78, y: 0, z: 0 }
  }

  if (animation === "float") {
    base.body.x = Math.sin(elapsed * 0.7) * 0.06
    base.body.z = Math.sin(elapsed * 0.9) * 0.08
    base.torso = { x: Math.sin(elapsed * 0.55) * 0.07, y: 0, z: Math.sin(elapsed * 0.8) * 0.045 }
    base.leftShoulder = { x: -0.1 + float * 0.06, y: 0.04, z: 0.38 }
    base.rightShoulder = { x: 0.1 - float * 0.06, y: -0.04, z: -0.38 }
    base.leftElbow = { x: -0.28, y: 0, z: -0.16 + float * 0.05 }
    base.rightElbow = { x: -0.28, y: 0, z: 0.16 - float * 0.05 }
    base.leftHip = { x: -0.14 + float * 0.05, y: 0, z: 0.08 }
    base.rightHip = { x: 0.14 - float * 0.05, y: 0, z: -0.08 }
    base.leftKnee = { x: 0.34 + float * 0.06, y: 0, z: 0.03 }
    base.rightKnee = { x: 0.34 - float * 0.06, y: 0, z: -0.03 }
  }

  if (animation === "salute") {
    base.body.z = -0.02
    base.head = { x: -0.03, y: -0.12, z: 0 }
    base.rightShoulder = { x: -0.08, y: -0.08, z: -1.28 }
    base.rightElbow = { x: -0.18, y: 0.08, z: -1.34 }
    base.leftShoulder = { x: 0.04, y: 0, z: 0.28 }
    base.leftElbow = { x: -0.12, y: 0, z: -0.26 }
  }

  setRotation(rig.body, base.body, blend)
  setRotation(rig.torso, base.torso, blend)
  setRotation(rig.head, base.head, blend)
  setRotation(rig.leftArm.shoulder, base.leftShoulder, blend)
  setRotation(rig.rightArm.shoulder, base.rightShoulder, blend)
  setRotation(rig.leftArm.elbow, base.leftElbow, blend)
  setRotation(rig.rightArm.elbow, base.rightElbow, blend)
  setRotation(rig.leftLeg.hip, base.leftHip, blend)
  setRotation(rig.rightLeg.hip, base.rightHip, blend)
  setRotation(rig.leftLeg.knee, base.leftKnee, blend)
  setRotation(rig.rightLeg.knee, base.rightKnee, blend)
}

export default function AstronautMesh({
  compact = false,
  variant = "library",
  minHeight,
}) {
  const mountRef = useRef(null)
  const poseRef = useRef("idle")
  const positionRef = useRef({ x: 0, y: 0, z: 0 })
  const turnRef = useRef(0)
  const [pose, setPose] = useState("idle")
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 })
  const [turn, setTurn] = useState(0)

  const isIdentityVariant = variant === "identity"
  const isIdentityCardVariant = variant === "identityCard"
  const isIdentityControlVariant = isIdentityVariant || isIdentityCardVariant
  const poseOptions = useMemo(() => ANIMATION_OPTIONS, [])

  useEffect(() => {
    poseRef.current = pose
  }, [pose])

  useEffect(() => {
    positionRef.current = position
  }, [position])

  useEffect(() => {
    turnRef.current = turn
  }, [turn])

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
    scene.fog = new THREE.Fog(0x030014, 18, 58)

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.45))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    const stars = new THREE.Points(
      createStarField(),
      new THREE.PointsMaterial({
        size: compact ? 0.046 : 0.064,
        vertexColors: true,
        transparent: true,
        opacity: 0.74,
        depthWrite: false,
      })
    )
    scene.add(stars)

    const rig = createAstronautRig()
    const modelRoot = new THREE.Group()
    modelRoot.add(rig.root)
    scene.add(modelRoot)

    const platform = new THREE.Mesh(
      new THREE.RingGeometry(1.55, 1.63, 96),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    )
    platform.rotation.x = Math.PI / 2
    platform.position.y = -2.4
    modelRoot.add(platform)

    const verticalGuide = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -2.5, 0),
        new THREE.Vector3(0, 2.95, 0),
      ]),
      new THREE.LineBasicMaterial({
        color: 0x7c3aed,
        transparent: true,
        opacity: compact ? 0.08 : 0.14,
        depthWrite: false,
      })
    )
    modelRoot.add(verticalGuide)

    scene.add(new THREE.AmbientLight(0x9fb7ff, 0.45))

    const keyLight = new THREE.DirectionalLight(0xfff1d7, 3.7)
    keyLight.position.set(-4.4, 4.2, 5.6)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x65d7ff, 1.1)
    rimLight.position.set(5.8, 1.4, -4.4)
    scene.add(rimLight)

    const purpleFill = new THREE.DirectionalLight(0x8b5cf6, 0.62)
    purpleFill.position.set(0.8, -2.4, 4.8)
    scene.add(purpleFill)

    const resize = () => {
      const rect = mount.getBoundingClientRect()
      const width = Math.max(1, Math.floor(rect.width))
      const height = Math.max(1, Math.floor(rect.height))
      const narrow = width < 720

      renderer.setSize(width, height, false)
      camera.fov = isIdentityControlVariant
        ? isIdentityCardVariant
          ? narrow
            ? 49
            : 44
          : narrow
            ? 47
            : 40
        : narrow
          ? 49
          : 42
      camera.aspect = width / height
      camera.position.set(
        0,
        isIdentityControlVariant
          ? isIdentityCardVariant
            ? narrow
              ? 1.36
              : 1.28
            : narrow
              ? 1.22
              : 1.1
          : narrow
            ? 1.35
            : 1.16,
        isIdentityControlVariant
          ? isIdentityCardVariant
            ? narrow
              ? 9
              : 8.7
            : narrow
              ? 8.65
              : 8.25
          : narrow
            ? 8.5
            : 8
      )
      camera.lookAt(0, isIdentityControlVariant ? 0.05 : 0.2, 0)
      camera.updateProjectionMatrix()

      modelRoot.scale.setScalar(
        compact
          ? 0.76
          : isIdentityCardVariant
            ? narrow
              ? 0.55
              : 0.58
            : isIdentityVariant
              ? narrow
                ? 0.76
                : 0.78
              : narrow
                ? 0.94
                : 0.98
      )
      modelRoot.userData.sceneLift = compact
        ? 0
        : isIdentityCardVariant
          ? narrow
            ? 0.58
            : 0.42
        : isIdentityVariant
          ? narrow
            ? 0.36
            : -0.02
          : narrow
            ? 0.82
            : 0
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
      const motionScale = reducedMotion ? 0.15 : 1
      const target = positionRef.current

      lastFrameTime = now

      modelRoot.position.x = lerp(modelRoot.position.x, target.x, 0.12)
      modelRoot.position.y = lerp(
        modelRoot.position.y,
        target.y +
          (modelRoot.userData.sceneLift || 0) +
          Math.sin(elapsed * 1.25) * 0.055 * motionScale,
        0.12
      )
      modelRoot.position.z = lerp(modelRoot.position.z, target.z, 0.12)
      modelRoot.rotation.y = lerp(
        modelRoot.rotation.y,
        degToRad(turnRef.current) + Math.sin(elapsed * 0.32) * 0.06,
        0.1
      )
      modelRoot.rotation.z = lerp(
        modelRoot.rotation.z,
        Math.sin(elapsed * 0.62) * 0.025 * motionScale,
        0.08
      )
      stars.rotation.y += delta * 0.006
      stars.rotation.x = Math.sin(elapsed * 0.04) * 0.04

      applyAstronautPose(rig, poseRef.current, elapsed * motionScale)

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
  }, [compact, isIdentityVariant, isIdentityCardVariant, isIdentityControlVariant])

  const nudge = (dx, dy, dz = 0) => {
    setPosition((prev) => ({
      x: clamp(prev.x + dx, -MOVE_LIMIT, MOVE_LIMIT),
      y: clamp(prev.y + dy, -MOVE_LIMIT, MOVE_LIMIT),
      z: clamp(prev.z + dz, -DEPTH_LIMIT, DEPTH_LIMIT),
    }))
  }

  const reset = () => {
    setPose("idle")
    setPosition({ x: 0, y: 0, z: 0 })
    setTurn(0)
  }

  return (
    <Box
      data-testid="astronaut-mesh"
      data-astronaut-mesh="true"
      sx={{
        position: "relative",
        width: "100%",
        minHeight:
          minHeight ||
          (compact
            ? 360
            : isIdentityCardVariant
              ? { xs: 350, sm: 360, md: 370 }
            : isIdentityVariant
              ? { xs: 560, sm: 600, md: 620 }
              : { xs: 760, sm: 760, md: 780 }),
        overflow: "hidden",
        background:
          "radial-gradient(circle at 62% 28%, rgba(124,58,237,0.24), transparent 38%), radial-gradient(circle at 36% 72%, rgba(34,211,238,0.12), transparent 34%), linear-gradient(180deg, #030014 0%, #01010a 48%, #000000 100%)",
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
            "linear-gradient(180deg, rgba(2,0,18,0.04) 0%, rgba(0,0,0,0) 42%, rgba(3,0,20,0.5) 100%)",
        }}
      />

      {!compact ? (
        <Box
          sx={{
            position: "absolute",
            left: isIdentityControlVariant
              ? isIdentityCardVariant
                ? { xs: 8, sm: 10 }
                : { xs: 10, sm: 14, md: 16 }
              : { xs: 12, sm: 18, md: 24 },
            right: isIdentityControlVariant
              ? isIdentityCardVariant
                ? { xs: 8, sm: 10 }
                : { xs: 10, sm: 14, md: 16 }
              : { xs: 12, sm: "auto" },
            bottom: isIdentityControlVariant
              ? isIdentityCardVariant
                ? { xs: 8, sm: 10 }
                : { xs: 10, sm: 14, md: 16 }
              : { xs: 12, sm: 18, md: 24 },
            width: isIdentityControlVariant
              ? isIdentityCardVariant
                ? { xs: "calc(100% - 16px)", sm: "calc(100% - 20px)" }
                : { xs: "calc(100% - 20px)", sm: "calc(100% - 28px)", md: "calc(100% - 32px)" }
              : { xs: "calc(100% - 24px)", sm: 520 },
            p: isIdentityCardVariant
              ? { xs: 0.75, sm: 0.85 }
              : isIdentityVariant
                ? { xs: 1, sm: 1.15 }
                : { xs: 1.3, sm: 1.6 },
            borderRadius: 1,
            border: "1px solid rgba(216,229,254,0.15)",
            background:
              "linear-gradient(180deg, rgba(8,9,22,0.82) 0%, rgba(5,7,15,0.68) 100%)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 18px 44px rgba(0,0,0,0.35)",
          }}
        >
          <Stack spacing={1.4} sx={{ minWidth: 0 }}>
            <Stack
              direction={{ xs: "column", sm: isIdentityControlVariant ? "column" : "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
              useFlexGap
            >
              <ToggleButtonGroup
                value={pose}
                exclusive
                onChange={(event, nextPose) => {
                  if (nextPose) setPose(nextPose)
                }}
                size="small"
                sx={{
                  flexWrap: "wrap",
                  gap: 0.6,
                  "& .MuiToggleButtonGroup-grouped": {
                    m: "0 !important",
                    border: "1px solid rgba(216,229,254,0.14) !important",
                    borderRadius: "6px !important",
                    px: isIdentityCardVariant ? 0.72 : isIdentityVariant ? 0.9 : 1.2,
                    py: isIdentityCardVariant ? 0.48 : isIdentityVariant ? 0.55 : 0.65,
                    minWidth: isIdentityCardVariant ? 50 : isIdentityVariant ? 58 : 64,
                    color: "rgba(216,229,254,0.78)",
                    fontFamily: "Helmet",
                    fontSize: isIdentityCardVariant ? 9.5 : isIdentityVariant ? 10 : 11,
                    letterSpacing: isIdentityCardVariant ? 0.35 : isIdentityVariant ? 0.55 : 0.8,
                    "&.Mui-selected": {
                      color: "rgba(4,7,18,0.94)",
                      background:
                        "linear-gradient(90deg, rgba(124,58,237,0.95) 0%, rgba(34,211,238,0.96) 100%)",
                    },
                  },
                }}
              >
                {poseOptions.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>

              <Stack direction="row" spacing={0.8} justifyContent="flex-end">
                <Tooltip title="Turn astronaut">
                  <IconButton
                    onClick={() => setTurn((value) => clamp(value + 45, -180, 180))}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 1,
                      color: "rgba(216,229,254,0.88)",
                      border: "1px solid rgba(216,229,254,0.16)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <ThreeDRotationRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Reset astronaut">
                  <IconButton
                    onClick={reset}
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 1,
                      color: "rgba(216,229,254,0.88)",
                      border: "1px solid rgba(216,229,254,0.16)",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <RestartAltRoundedIcon sx={{ fontSize: 19 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>

            {!isIdentityControlVariant ? (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.6}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 34px)",
                    gridTemplateRows: "repeat(3, 34px)",
                    gap: 0.5,
                    justifyContent: { xs: "center", sm: "start" },
                  }}
                >
                  <Box />
                  <Tooltip title="Move up">
                    <IconButton
                      onClick={() => nudge(0, 0.25)}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 1,
                        color: "rgba(216,229,254,0.9)",
                        border: "1px solid rgba(216,229,254,0.14)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <KeyboardArrowUpRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Box />
                  <Tooltip title="Move left">
                    <IconButton
                      onClick={() => nudge(-0.25, 0)}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 1,
                        color: "rgba(216,229,254,0.9)",
                        border: "1px solid rgba(216,229,254,0.14)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <KeyboardArrowLeftRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Box />
                  <Tooltip title="Move right">
                    <IconButton
                      onClick={() => nudge(0.25, 0)}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 1,
                        color: "rgba(216,229,254,0.9)",
                        border: "1px solid rgba(216,229,254,0.14)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <KeyboardArrowRightRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Box />
                  <Tooltip title="Move down">
                    <IconButton
                      onClick={() => nudge(0, -0.25)}
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: 1,
                        color: "rgba(216,229,254,0.9)",
                        border: "1px solid rgba(216,229,254,0.14)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <KeyboardArrowDownRoundedIcon />
                    </IconButton>
                  </Tooltip>
                  <Box />
                </Box>

                <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                  {[
                    ["X", position.x, -MOVE_LIMIT, MOVE_LIMIT, (value) => setPosition((prev) => ({ ...prev, x: value }))],
                    ["Y", position.y, -MOVE_LIMIT, MOVE_LIMIT, (value) => setPosition((prev) => ({ ...prev, y: value }))],
                    ["Z", position.z, -DEPTH_LIMIT, DEPTH_LIMIT, (value) => setPosition((prev) => ({ ...prev, z: value }))],
                  ].map(([label, value, min, max, onChange]) => (
                    <Stack
                      key={label}
                      direction="row"
                      spacing={1.1}
                      alignItems="center"
                      sx={{ minWidth: 0 }}
                    >
                      <Typography
                        sx={{
                          width: 16,
                          color: "rgba(216,229,254,0.78)",
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        {label}
                      </Typography>
                      <Slider
                        size="small"
                        min={min}
                        max={max}
                        step={0.05}
                        value={value}
                        onChange={(event, nextValue) => onChange(nextValue)}
                        sx={{
                          color: "#22D3EE",
                          "& .MuiSlider-track": {
                            background:
                              "linear-gradient(90deg, #7C3AED 0%, #22D3EE 100%)",
                          },
                          "& .MuiSlider-thumb": {
                            width: 13,
                            height: 13,
                            boxShadow: "0 0 0 5px rgba(34,211,238,0.12)",
                          },
                        }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            ) : null}
          </Stack>
        </Box>
      ) : null}
    </Box>
  )
}
