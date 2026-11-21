import * as THREE from "three"
import { createSpacecraftMotion } from "./spacecraftMotion.js"
import { createCruiseExhaust } from "./cruiseExhaust.js"
import { astronautRevealAt, createAstronautReveal } from "./astronautReveal.js"

export const MOON_WAVE_STILL = 18.8
const smooth = (time, start, duration) => {
  const t = Math.max(0, Math.min(1, (time - start) / duration))
  return t * t * (3 - 2 * t)
}

export function moonMissionProgress(time) {
  const t = Math.max(0, time)
  return {
    phase: t < 5.2 ? "landing" : t < 7.2 ? "opening" : t < 10.4 ? "jumping" : t < 16.4 ? "walking" : "waving",
    descent: smooth(t, 0, 5.2),
    gear: smooth(t, .6, 3.8),
    canopy: smooth(t, 5.2, 2),
    jump: smooth(t, 7.2, 3.2),
    walk: smooth(t, 10.4, 6),
    walkingWeight: smooth(t, 9.8, .6) * (1 - smooth(t, 15.6, .8)),
    waveWeight: smooth(t, 15.6, .8),
    thrust: 1 - smooth(t, 4.1, 1.1),
  }
}

export function createAboutMoonMission({ astronaut, spacecraft, moon, crew }) {
  const root = new THREE.Group(), ship = new THREE.Group(), pilot = new THREE.Group()
  root.add(ship, pilot)
  ship.add(spacecraft.scene); spacecraft.scene.scale.setScalar(.58)
  pilot.add(astronaut.scene); astronaut.scene.scale.setScalar(.95)
  const reveal = createAstronautReveal(astronaut.scene)
  const motion = createSpacecraftMotion(spacecraft)
  const exhaust = createCruiseExhaust(spacecraft.scene, crew.id)
  const mixer = new THREE.AnimationMixer(astronaut.scene)
  const actions = ["Float", "Walk", "Wave"].map(name => {
    const source = THREE.AnimationClip.findByName(astronaut.animations, name)
    if (!source) throw new Error(`Missing Moon astronaut animation: ${name}`)
    const clip = source.clone()
    clip.tracks = clip.tracks.filter(track => {
      const binding = THREE.PropertyBinding.parseTrackName(track.name)
      return binding.nodeName !== "Root" || binding.propertyName !== "position"
    })
    return mixer.clipAction(clip).play()
  })
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0)
  const heightCache = new Map(), point = new THREE.Vector3()
  moon.updateWorldMatrix(true, false)
  function ground(x, z) {
    const key = `${x.toFixed(2)},${z.toFixed(2)}`
    if (!heightCache.has(key)) {
      ray.set(point.set(x, 35, z), down)
      const hit = ray.intersectObject(moon, false)[0]
      if (!hit) throw new Error("Moon landing path is outside the terrain")
      heightCache.set(key, hit.point.y)
    }
    return heightCache.get(key)
  }
  const landing = new THREE.Vector3(-.9, 0, -1.35)
  ship.position.copy(landing); ship.rotation.y = -.32
  motion.pose(1, 0); exhaust.update(0, 0); root.updateMatrixWorld(true)
  // Use deployed gear vertices, excluding the plume, to rest on the actual terrain.
  let shipLift = -Infinity
  spacecraft.scene.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return
    mesh.skeleton.update()
    const indices = mesh.geometry.attributes.skinIndex, weights = mesh.geometry.attributes.skinWeight
    for (let i = 0; i < indices.count; i++) {
      let gearWeight = 0
      for (let j = 0; j < 4; j++) if (/^Gear/.test(mesh.skeleton.bones[indices.getComponent(i, j)].name)) gearWeight += weights.getComponent(i, j)
      if (gearWeight < .8) continue
      mesh.getVertexPosition(i, point).applyMatrix4(mesh.matrixWorld)
      const { x, y, z } = point
      shipLift = Math.max(shipLift, ground(x, z) - y)
    }
  })
  if (!Number.isFinite(shipLift)) throw new Error("Missing lunar lander feet")
  landing.y = shipLift + .012
  const start = new THREE.Vector3(.7, ground(.7, 1.8), 1.8)
  const finish = new THREE.Vector3(1.4, ground(1.4, 3.9), 3.9)
  const cockpit = new THREE.Vector3(...crew.cockpit).add(new THREE.Vector3(0, -1.2, 0))
    .multiplyScalar(.58).applyAxisAngle(new THREE.Vector3(0, 1, 0), ship.rotation.y).add(landing)
  const exit = new THREE.CubicBezierCurve3(cockpit,
    cockpit.clone().add(new THREE.Vector3(.25, 2.45, .1)),
    start.clone().add(new THREE.Vector3(-.1, 1.8, -.2)), start)
  const feet = []
  astronaut.scene.traverse(mesh => {
    if (!mesh.isSkinnedMesh) return
    const indices = mesh.geometry.attributes.skinIndex, weights = mesh.geometry.attributes.skinWeight
    for (const side of ["L", "R"]) {
      const bone = mesh.skeleton.getBoneByName(`Foot${side}`) || mesh.skeleton.getBoneByName(`Foot.${side}`)
      if (!bone) continue
      const vertices = []
      for (let i = 0; i < indices.count; i++) {
        let weight = 0
        for (let j = 0; j < 4; j++) if (mesh.skeleton.bones[indices.getComponent(i, j)] === bone) weight += weights.getComponent(i, j)
        if (weight > .8) vertices.push(i)
      }
      feet.push({ mesh, bone, vertices })
    }
  })
  if (feet.length < 2) throw new Error("Missing lunar astronaut feet")
  let previousTime = 0
  function poseAt(time) {
    const state = moonMissionProgress(time)
    motion.pose(state.gear, state.canopy)
    ship.position.copy(landing).add(new THREE.Vector3(1.1, 2.8, -.7).multiplyScalar(1 - state.descent))
    ship.rotation.z = -.065 * (1 - state.descent)
    exhaust.update(Math.max(0, time - previousTime), state.thrust)
    previousTime = time
    const entrance = astronautRevealAt(time, 7.2, 2.4)
    pilot.visible = entrance.opacity > 0
    pilot.scale.setScalar(entrance.scale)
    reveal(entrance.opacity)
    const [float, walk, wave] = actions
    float.setEffectiveWeight(1 - state.walkingWeight - state.waveWeight)
    walk.setEffectiveWeight(state.walkingWeight)
    wave.setEffectiveWeight(state.waveWeight)
    float.time = Math.max(0, time - 7.2) % float.getClip().duration
    walk.time = Math.max(0, time - 9.8) * .65 % walk.getClip().duration
    wave.time = Math.max(0, time - 16.4) % wave.getClip().duration
    mixer.update(0)
    pilot.rotation.y = .4
    if (time < 10.4) exit.getPoint(state.jump, pilot.position)
    else {
      pilot.position.lerpVectors(start, finish, state.walk)
      pilot.position.y = ground(pilot.position.x, pilot.position.z)
      pilot.rotation.y = THREE.MathUtils.lerp(Math.atan2(finish.x - start.x, finish.z - start.z), .4, state.waveWeight)
    }
    root.updateMatrixWorld(true)
    let clearance = Infinity
    for (const { mesh, vertices } of feet) {
      mesh.skeleton.update()
      const sole = new THREE.Vector3(0, Infinity, 0)
      for (const index of vertices) {
        mesh.getVertexPosition(index, point).applyMatrix4(mesh.matrixWorld)
        if (point.y < sole.y) sole.copy(point)
      }
      clearance = Math.min(clearance, sole.y - ground(sole.x, sole.z))
    }
    const grounded = smooth(time, 9.8, .6)
    pilot.position.y += (.012 - clearance) * grounded
    root.updateMatrixWorld(true)
    return { ...state, time, pilotOpacity: entrance.opacity, pilotScale: entrance.scale,
      footClearance: clearance * (1 - grounded) + .012 * grounded,
      shipPosition: ship.position.toArray(), pilotPosition: pilot.position.toArray(), pilotVisible: pilot.visible }
  }
  return { root, ship, pilot, poseAt, dispose() { mixer.stopAllAction(); mixer.uncacheRoot(astronaut.scene) } }
}
