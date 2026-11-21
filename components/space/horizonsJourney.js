import * as THREE from "three"
import { createSpacecraftMotion } from "./spacecraftMotion"

export const JOURNEY_DURATION = 108
export const JOURNEY_STOPS = [
  { id: "earth", label: "Earth", time: 0, position: [0, -1.2, 0], scale: 1 },
  { id: "mars", label: "Mars", time: 21, position: [16, -1, -.8], scale: .8 },
  { id: "jupiter", label: "Jupiter", time: 42, position: [35, -.7, -1.2], scale: 1.42 },
  { id: "saturn", label: "Saturn", time: 61, position: [57, -.6, -1.6], scale: 1.18 },
  { id: "uranus", label: "Uranus", time: 81, position: [78, -.6, -.4], scale: 1.02 },
  { id: "neptune", label: "Neptune", time: 101, position: [97, -.6, -.6], scale: 1.02 },
]
const UP = new THREE.Vector3(0, 1, 0)
const SHIP_SCALE = .28
const PILOT_SCALE = .36
const NORMAL = new THREE.Vector3(.12, .9, .42).normalize()
const clamp = THREE.MathUtils.clamp
const ease = (start, end, time) => THREE.MathUtils.smoothstep(time, start, end)
const point = values => new THREE.Vector3(...values)

export function journeyPhase(time) {
  if (time < 3) return { planet: "earth", label: "Earth / Boarding", phase: "walking" }
  if (time < 6) return { planet: "earth", label: "Earth / Boarding", phase: "boarding" }
  if (time < 8) return { planet: "earth", label: "Earth / Preflight", phase: "preflight" }
  if (time < 13) return { planet: "earth", label: "Earth / Liftoff", phase: "launch" }
  if (time < 18) return { planet: "mars", label: "En route to Mars", phase: "transfer" }
  if (time < 23) return { planet: "mars", label: "Mars / Arrival", phase: "landing" }
  if (time < 26) return { planet: "mars", label: "Mars / Touchdown", phase: "landed" }
  if (time < 29) return { planet: "mars", label: "Mars / Departure", phase: "launch" }
  if (time < 37) return { planet: "jupiter", label: "En route to Jupiter", phase: "transfer" }
  if (time < 47) return { planet: "jupiter", label: "Jupiter / Flyby", phase: "flyby" }
  if (time < 56) return { planet: "saturn", label: "En route to Saturn", phase: "transfer" }
  if (time < 67) return { planet: "saturn", label: "Saturn / Ring passage", phase: "flyby" }
  if (time < 76) return { planet: "uranus", label: "En route to Uranus", phase: "transfer" }
  if (time < 86) return { planet: "uranus", label: "Uranus / Flyby", phase: "flyby" }
  if (time < 96) return { planet: "neptune", label: "En route to Neptune", phase: "transfer" }
  return { planet: "neptune", label: time >= JOURNEY_DURATION ? "Neptune / Journey complete" : "Neptune / Arrival", phase: time >= JOURNEY_DURATION ? "complete" : "flyby" }
}

function attitude(normal, direction) {
  const forward = direction.clone().addScaledVector(normal, -direction.dot(normal)).normalize()
  const right = new THREE.Vector3().crossVectors(normal, forward).normalize()
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, normal, forward))
}

export function createHorizonsJourney({ astronaut, spacecraft, entry, planets }) {
  const root = new THREE.Group(), ship = new THREE.Group(), pilot = new THREE.Group()
  root.name = `${entry.name} Horizons expedition`
  spacecraft.scene.scale.setScalar(SHIP_SCALE); astronaut.scene.scale.setScalar(PILOT_SCALE)
  ship.add(spacecraft.scene); pilot.add(astronaut.scene); root.add(ship, pilot)
  const motion = createSpacecraftMotion(spacecraft)
  const mixer = new THREE.AnimationMixer(astronaut.scene)
  const actions = ["Walk", "Float", "Idle"].map(name => {
    const source = THREE.AnimationClip.findByName(astronaut.animations, name)
    if (!source) throw new Error(`Missing astronaut animation: ${name}`)
    const clip = source.clone()
    clip.tracks = clip.tracks.filter(track => {
      const binding = THREE.PropertyBinding.parseTrackName(track.name)
      return binding.nodeName !== "Root" || binding.propertyName !== "position"
    })
    return mixer.clipAction(clip).play()
  })
  const ray = new THREE.Raycaster()
  function ground(key, normal) {
    const planet = planets.get(key)
    planet.group.updateMatrixWorld(true)
    const center = planet.group.position
    ray.set(center.clone().addScaledVector(normal, 10), normal.clone().negate())
    const hit = ray.intersectObject(planet.mesh, false)[0]
    if (!hit) throw new Error(`Unable to find ${key} landing surface`)
    return hit.point
  }
  const earthCenter = planets.get("earth").group.position.clone()
  const groundAttitude = attitude(NORMAL, new THREE.Vector3(1, 0, .25))
  const earthLanding = ground("earth", NORMAL).addScaledVector(NORMAL, .958 * SHIP_SCALE)
  const marsLanding = ground("mars", NORMAL).addScaledVector(NORMAL, .958 * SHIP_SCALE)
  const normalAt = local => point(local).multiplyScalar(SHIP_SCALE).applyQuaternion(groundAttitude).add(earthLanding).sub(earthCenter).normalize()
  const startNormal = normalAt([-4.7, 0, 2.7]), endNormal = normalAt([-2.9, 0, 1.1])
  const walkPoints = Array.from({ length: 25 }, (_, i) => {
    const normal = startNormal.clone().lerp(endNormal, i / 24).normalize()
    return ground("earth", normal).addScaledVector(normal, .009)
  })
  const walkPath = new THREE.CatmullRomCurve3(walkPoints)
  const boardingAttitude = attitude(endNormal, walkPath.getTangent(1))
  const cockpit = point(entry.cockpit).add(new THREE.Vector3(0, -1.6, 0)).multiplyScalar(SHIP_SCALE)
    .applyQuaternion(groundAttitude).add(earthLanding)
  const hop = new THREE.CubicBezierCurve3(walkPoints.at(-1),
    walkPoints.at(-1).clone().addScaledVector(NORMAL, 1.06),
    cockpit.clone().addScaledVector(NORMAL, 1.3), cockpit)
  const earthExit = earthLanding.clone().add(new THREE.Vector3(4.4, 2.0, 1.1))
  const launch = new THREE.CubicBezierCurve3(earthLanding, earthLanding.clone().addScaledVector(NORMAL, 2.1),
    earthExit.clone().add(new THREE.Vector3(-2.4, .5, 0)), earthExit)
  const marsEntry = marsLanding.clone().add(new THREE.Vector3(-3.8, 2.1, 1.3))
  const approach = new THREE.CubicBezierCurve3(marsEntry, marsEntry.clone().add(new THREE.Vector3(2, 0, 0)),
    marsLanding.clone().addScaledVector(NORMAL, 1.7), marsLanding)
  const marsExit = marsLanding.clone().add(new THREE.Vector3(4.2, 2.1, 1.1))
  const marsLaunch = new THREE.CubicBezierCurve3(marsLanding, marsLanding.clone().addScaledVector(NORMAL, 2),
    marsExit.clone().add(new THREE.Vector3(-1.8, .4, 0)), marsExit)

  const flybys = JOURNEY_STOPS.slice(2).map(stop => {
    const center = point(stop.position)
    const radius = stop.id === "saturn" ? 7.3 : stop.id === "jupiter" ? 4.4 : 3.7
    return new THREE.CatmullRomCurve3(Array.from({ length: 33 }, (_, i) => {
      const a = Math.PI * (.85 - .7 * i / 32)
      return center.clone().add(new THREE.Vector3(Math.cos(a) * radius, (stop.id === "saturn" ? 2.65 : 1.65) + Math.sin(i / 32 * Math.PI) * .5, Math.sin(a) * radius))
    }))
  })
  const transfer = (a, b) => new THREE.CubicBezierCurve3(a, a.clone().lerp(b, .32).add(new THREE.Vector3(0, 1.4, 1.4)),
    a.clone().lerp(b, .68).add(new THREE.Vector3(0, 1.4, 1.4)), b)
  // Match the adjoining tangents so steering follows one continuous flight path.
  const cruiseTransfer = (from, to) => {
    const a = from.getPoint(1), b = to.getPoint(0), handle = a.distanceTo(b) * .38
    return new THREE.CubicBezierCurve3(a, a.clone().addScaledVector(from.getTangent(1), handle),
      b.clone().addScaledVector(to.getTangent(0), -handle), b)
  }
  const transfers = [transfer(earthExit, marsEntry), cruiseTransfer(marsLaunch, flybys[0]),
    ...flybys.slice(0, -1).map((curve, i) => cruiseTransfer(curve, flybys[i + 1]))]
  const segments = [
    [8, 13, launch, "earth", "earth"], [13, 18, transfers[0], "earth", "mars"],
    [18, 23, approach, "mars", "mars"], [26, 29, marsLaunch, "mars", "mars"],
    [29, 37, transfers[1], "mars", "jupiter"], [37, 47, flybys[0], "jupiter", "jupiter"],
    [47, 56, transfers[2], "jupiter", "saturn"], [56, 67, flybys[1], "saturn", "saturn"],
    [67, 76, transfers[3], "saturn", "uranus"], [76, 86, flybys[2], "uranus", "uranus"],
    [86, 96, transfers[4], "uranus", "neptune"], [96, JOURNEY_DURATION, flybys[3], "neptune", "neptune"],
  ]
  const exhaust = new THREE.Group(); ship.add(exhaust)
  const flameMaterial = new THREE.MeshBasicMaterial({ color: entry.id === "salvager" ? 0xffb969 : entry.id === "surveyor" ? 0x70f0dd : 0x8edbff,
    transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })
  // Nozzle coordinates are taken from the existing Blender spacecraft definitions.
  const nozzles = entry.id === "surveyor"
    ? [-1, 1].flatMap(side => [-1.38, 1.96].map(z => ({ at: [side * 2.83, .21, -z], vertical: true })))
    : [-1, 1].map(side => ({ at: entry.id === "salvager" ? [side * 2.15, .78, -3.78] : [side * 2.05, .53, -3.98], vertical: false }))
  const plumes = nozzles.map(({ at, vertical }) => {
    const anchor = new THREE.Group(); anchor.position.copy(point(at).multiplyScalar(SHIP_SCALE)); exhaust.add(anchor)
    const plume = new THREE.Mesh(new THREE.ConeGeometry(.14, .9, 24, 1, true), flameMaterial)
    if (!vertical) anchor.rotation.x = Math.PI / 2
    plume.rotation.z = Math.PI; plume.position.y = -.45
    anchor.add(plume)
    return anchor
  })
  const planetBounds = new Map([...planets].map(([id, planet]) => [id, new THREE.Box3().setFromObject(planet.group)]))
  const shipDirection = new THREE.Vector3(), flightAttitude = new THREE.Quaternion()
  function encounterView(key, position) {
    const bounds = planetBounds.get(key).clone()
    bounds.expandByPoint(position.clone().add(new THREE.Vector3(1.6, 1.25, 1.6)))
    bounds.expandByPoint(position.clone().sub(new THREE.Vector3(1.6, .55, 1.6)))
    const size = bounds.getSize(new THREE.Vector3()), target = bounds.getCenter(new THREE.Vector3())
    return { target, height: size.y / 2 + .4, width: size.x + .8, depth: bounds.max.z - target.z }
  }
  function poseAt(input) {
    const time = clamp(input, 0, JOURNEY_DURATION)
    const state = journeyPhase(time)
    const segment = segments.find(([start, end]) => time >= start && time < end) || (time >= JOURNEY_DURATION ? segments.at(-1) : null)
    let focus, thrust = 0
    ship.quaternion.copy(groundAttitude)
    if (segment) {
      const [start, end, curve, from, to] = segment
      const cruise = start >= 29
      let t = cruise ? clamp((time - start) / (end - start), 0, 1) : ease(start, end, time)
      // Accelerate away from Mars, then cruise through the outer-planet junctions.
      if (start === 29) t = (t < .2 ? t * t / .4 : t - .1) / .9
      ship.position.copy(cruise ? curve.getPointAt(t) : curve.getPoint(t))
      shipDirection.copy(cruise ? curve.getTangentAt(t) : curve.getTangent(t)).normalize()
      flightAttitude.copy(attitude(UP, shipDirection))
      // Blend attitude independently of the mechanisms, avoiding a reset at each phase boundary.
      if (start === 8 || start === 26) ship.quaternion.slerp(flightAttitude, ease(start, start + 2, time))
      else if (start === 18) {
        const incoming = attitude(UP, transfers[0].getTangent(1))
        ship.quaternion.slerpQuaternions(incoming, flightAttitude, ease(18, 18.9, time)).slerp(groundAttitude, ease(18, 21, time))
      }
      else {
        const index = segments.indexOf(segment)
        const previous = segments[index - 1]
        ship.quaternion.copy(flightAttitude)
        if (!cruise && previous && previous[1] === start) {
          const incoming = attitude(UP, previous[2].getTangent(1))
          ship.quaternion.slerpQuaternions(incoming, flightAttitude, ease(start, start + .9, time))
        }
      }
      thrust = start === 18 ? 1 - ease(21, 23, time) : time >= JOURNEY_DURATION ? .08 : .65
      if (from !== to) {
        const startView = encounterView(from, curve.getPoint(0)), endView = encounterView(to, curve.getPoint(1))
        const nearStart = 1 - ease(0, .3, t), nearEnd = ease(.7, 1, t)
        const target = ship.position.clone().lerp(startView.target, nearStart).lerp(endView.target, nearEnd)
        focus = { target, height: THREE.MathUtils.lerp(2.6, startView.height, nearStart) + (endView.height - 2.6) * nearEnd,
          width: THREE.MathUtils.lerp(6, startView.width, nearStart) + (endView.width - 6) * nearEnd,
          depth: THREE.MathUtils.lerp(1.6, startView.depth, nearStart) + (endView.depth - 1.6) * nearEnd }
      }
    } else ship.position.copy(time < 8 ? earthLanding : marsLanding)
    if (!focus) focus = encounterView(state.planet, ship.position)
    const gear = time < 8 ? 1 : time < 13 ? 1 - ease(9, 11, time) : time < 23 ? ease(19, 22, time) : time < 26 ? 1 : 1 - ease(27, 29, time)
    const canopy = 1 - ease(6, 8, time)
    motion.pose(gear, canopy)
    pilot.visible = time < 7.5
    if (time < 3) {
      const t = clamp(time / 3, 0, 1)
      pilot.position.copy(walkPath.getPoint(t))
      pilot.quaternion.copy(attitude(pilot.position.clone().sub(earthCenter).normalize(), walkPath.getTangent(t)))
    } else {
      pilot.position.copy(hop.getPoint(ease(3, 6, time)))
      pilot.position.addScaledVector(NORMAL, -.16 * ease(6, 7.3, time))
      pilot.quaternion.slerpQuaternions(boardingAttitude, groundAttitude, ease(3, 4.1, time))
    }
    const floating = ease(2.8, 3.3, time)
    actions.forEach((action, i) => {
      action.setEffectiveWeight(i === 0 ? 1 - floating : i === 1 ? floating : 0)
      action.time = (i === 0 ? time * .9 : Math.max(0, time - 3)) % action.getClip().duration
    })
    mixer.update(0)
    exhaust.visible = thrust > 0
    plumes.forEach(plume => { plume.scale.y = thrust * (1 + Math.sin(time * 25) * .08) })
    flameMaterial.opacity = .35 + thrust * .25
    root.updateMatrixWorld(true)
    return { ...state, time, gear, canopy, pilotVisible: pilot.visible, shipPosition: ship.position.toArray(),
      pilotPosition: pilot.position.toArray(), focus: focus.target.clone(), halfHeight: focus.height, viewWidth: focus.width, depth: focus.depth }
  }
  return { root, ship, pilot, poseAt, stop() { mixer.stopAllAction(); mixer.uncacheRoot(astronaut.scene) } }
}
