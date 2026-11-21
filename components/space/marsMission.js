import * as THREE from "three"
import { disposeModel, loadCrew, renderOffscreen } from "./crewAssets"
import { createSpacecraftMotion } from "./spacecraftMotion"

const UP = new THREE.Vector3(0, 1, 0)
const SHIP_SCALE = .19
const PILOT_SCALE = .19
const LANDING_NORMAL = new THREE.Vector3(-.34, .78, .52).normalize()
const smooth = value => { const t = THREE.MathUtils.clamp(value, 0, 1); return t*t*(3-2*t) }

export function missionPhase(time) {
  if (time < 4.8) return "approach"
  if (time < 7.6) return "landing"
  if (time < 9.8) return "cockpit"
  if (time < 14.8) return "egress"
  return "walking"
}

function orientation(normal, direction) {
  const forward = direction.clone().addScaledVector(normal, -direction.dot(normal)).normalize()
  const right = new THREE.Vector3().crossVectors(normal, forward).normalize()
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, normal, forward))
}

export function createMarsMission({ scene, group, moon, renderer, camera, mount, onState }) {
  const probe = new THREE.Mesh(moon.geometry, new THREE.MeshBasicMaterial())
  const ray = new THREE.Raycaster()
  const radiusCache = new Map()
  let request = null, disposed = false, current = null, selected = null, revision = -1
  let elapsed = 0, paused = false, status = "loading", lastPhase = "", generation = 0

  function report(nextStatus = status) {
    status = nextStatus
    const phase = missionPhase(elapsed)
    mount.dataset.missionStatus = status
    mount.dataset.missionPhase = phase
    mount.dataset.missionTime = elapsed.toFixed(3)
    mount.dataset.missionCrew = selected?.id || ""
    if (nextStatus !== "ready" || phase !== lastPhase) {
      onState({ status, phase, crew: selected?.id })
      lastPhase = phase
    }
  }

  function surfaceRadius(normal) {
    const key = normal.toArray().map(value => Math.round(value*600)).join(",")
    if (radiusCache.has(key)) return radiusCache.get(key)
    probe.geometry = moon.geometry
    ray.set(normal.clone().multiplyScalar(4), normal.clone().negate())
    const hit = ray.intersectObject(probe, false)[0]
    const radius = hit?.point.length() || 2.15
    radiusCache.set(key, radius)
    return radius
  }

  function release() {
    if (!current) return
    group.remove(current.root)
    current.mixer.stopAllAction()
    current.mixer.uncacheRoot(current.astronaut.scene)
    disposeModel(current.root)
    current = null
  }

  function poseAt(time) {
    if (!current) return
    elapsed = time
    const { shipAnchor, pilotAnchor, motion, mixer, float, walk, entry } = current
    const normal = LANDING_NORMAL
    const forward = new THREE.Vector3(.45, 0, 1)
    const attitude = orientation(normal, forward)
    const landing = normal.clone().multiplyScalar(surfaceRadius(normal)+.958*SHIP_SCALE)
    const approach = new THREE.CubicBezierCurve3(
      landing.clone().add(new THREE.Vector3(2.0, 1.55, -.1)),
      landing.clone().add(new THREE.Vector3(1.8, 1.55, .3)),
      landing.clone().addScaledVector(normal, .9).add(new THREE.Vector3(.4, 0, .1)),
      landing.clone().addScaledVector(normal, .54)
    )
    if (time < 4.8) {
      shipAnchor.position.copy(approach.getPoint(smooth(time/4.8)))
      shipAnchor.quaternion.copy(attitude).multiply(new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1), -.14*(1-smooth(time/4.8))))
    } else {
      shipAnchor.position.copy(landing).addScaledVector(normal, .54*(1-smooth((time-4.8)/2.8)))
      shipAnchor.quaternion.copy(attitude)
    }
    const gear = smooth((time-3.8)/3.0)
    const canopy = smooth((time-7.6)/2.2)
    motion.pose(gear, canopy)

    // Egress starts inside the actual crew-specific cockpit, then arcs clear of the hull.
    const walkStartNormal = landing.clone().add(new THREE.Vector3(.38, 0, 1).applyQuaternion(attitude).multiplyScalar(.70)).normalize()
    const walkStart = walkStartNormal.clone().multiplyScalar(surfaceRadius(walkStartNormal)+.008)
    const cockpit = new THREE.Vector3(...entry.cockpit).add(new THREE.Vector3(0, -1.2, 0))
      .multiplyScalar(SHIP_SCALE).applyQuaternion(attitude).add(landing)
    const exit = new THREE.CubicBezierCurve3(cockpit,
      cockpit.clone().addScaledVector(normal, .72),
      walkStart.clone().addScaledVector(walkStartNormal, .65), walkStart)
    pilotAnchor.visible = time >= 9.8
    if (time < 14.8) {
      const t = smooth((time-9.8)/5)
      pilotAnchor.position.copy(exit.getPoint(t))
      pilotAnchor.quaternion.copy(attitude).slerp(orientation(walkStartNormal,
        new THREE.Vector3(walkStartNormal.z, 0, -walkStartNormal.x)), smooth((t-.65)/.35))
    } else {
      const walkingTime = time-14.8
      const distance = walkingTime < 1 ? walkingTime*walkingTime/2 : walkingTime-.5
      const theta = Math.atan2(walkStartNormal.x, walkStartNormal.z)+distance*.12
      const radius = Math.sqrt(1-walkStartNormal.y**2)
      const n = new THREE.Vector3(radius*Math.sin(theta), walkStartNormal.y, radius*Math.cos(theta))
      const tangent = new THREE.Vector3(Math.cos(theta), 0, -Math.sin(theta))
      pilotAnchor.position.copy(n).multiplyScalar(surfaceRadius(n)+.008)
      pilotAnchor.quaternion.copy(orientation(n, tangent))
    }
    const walking = smooth((time-14.1)/.7)
    float.setEffectiveWeight(1-walking)
    walk.setEffectiveWeight(walking)
    float.time = Math.max(0, time-9.8)%float.getClip().duration
    walk.time = Math.max(0, time-14.1)%walk.getClip().duration
    mixer.update(0)
    current.root.updateMatrixWorld(true)
    mount.dataset.gearDeployment = gear.toFixed(4)
    mount.dataset.canopyOpening = canopy.toFixed(4)
    mount.dataset.pilotVisible = String(pilotAnchor.visible)
    mount.dataset.pilotPosition = pilotAnchor.position.toArray().map(v => v.toFixed(4)).join(",")
    mount.dataset.shipPosition = shipAnchor.position.toArray().map(v => v.toFixed(4)).join(",")
    report()
  }

  return {
    async setCrew(entry, nextRevision = 0) {
      if (selected?.id === entry.id && revision === nextRevision) return
      if (selected?.id === entry.id && current && status === "ready") {
        revision = nextRevision
        poseAt(0)
        return
      }
      selected = entry
      revision = nextRevision
      request?.abort()
      request = new AbortController()
      const signal = request.signal
      const ownGeneration = ++generation
      lastPhase = ""
      report("loading")
      // Remove the previous expedition without replacing the planet or its textures.
      release()
      let pending = null
      try {
        pending = await loadCrew({ ...entry, asset: entry.missionAsset, spacecraft: entry.missionSpacecraft }, signal)
        signal.throwIfAborted()
        const { astronaut, spacecraft } = pending
        const root = new THREE.Group(), shipAnchor = new THREE.Group(), pilotAnchor = new THREE.Group()
        shipAnchor.add(spacecraft.scene)
        spacecraft.scene.scale.setScalar(SHIP_SCALE)
        pilotAnchor.add(astronaut.scene)
        astronaut.scene.scale.setScalar(PILOT_SCALE)
        root.add(shipAnchor, pilotAnchor)
        const mixer = new THREE.AnimationMixer(astronaut.scene)
        const clip = name => {
          const source = THREE.AnimationClip.findByName(astronaut.animations, name).clone()
          if (name === "Float") source.tracks = source.tracks.filter(track => {
            const binding = THREE.PropertyBinding.parseTrackName(track.name)
            return binding.nodeName !== "Root" || binding.propertyName !== "position"
          })
          return mixer.clipAction(source).play()
        }
        const next = { root, shipAnchor, pilotAnchor, astronaut, spacecraft, mixer,
          float: clip("Float"), walk: clip("Walk"), motion: createSpacecraftMotion(spacecraft), entry }
        // Compile the detached pair with the destination scene's actual light rig.
        await renderer.compileAsync(root, camera, scene)
        signal.throwIfAborted()
        current = next
        pending = null
        radiusCache.clear()
        group.add(root)
        poseAt(paused ? 14.8 : 0)
        pilotAnchor.visible = true
        renderOffscreen(renderer, scene, camera)
        poseAt(paused ? 14.8 : 0)
        lastPhase = ""
        report("ready")
        renderer.render(scene, camera)
      } catch (error) {
        if (pending) { disposeModel(pending.astronaut.scene); disposeModel(pending.spacecraft.scene) }
        if (disposed || ownGeneration !== generation || error.name === "AbortError") return
        release()
        report("error")
        console.error("Mars expedition failed:", error)
      }
    },
    setPaused(value) { paused = value; mount.dataset.missionPaused = String(value) },
    update(delta) { if (current && status === "ready" && !paused) poseAt(elapsed+Math.min(delta, .25)) },
    poseAt,
    dispose() {
      disposed = true
      generation++
      request?.abort()
      release()
      probe.material.dispose()
    },
  }
}
