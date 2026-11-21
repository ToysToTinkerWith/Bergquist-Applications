import * as THREE from "three"

function rotationAt(gltf, clipName, boneName, time) {
  const clip = THREE.AnimationClip.findByName(gltf.animations, clipName)
  const track = clip?.tracks.find(track => {
    const path = THREE.PropertyBinding.parseTrackName(track.name)
    return path.nodeName === boneName && path.propertyName === "quaternion"
  })
  if (!track) throw new Error(`Missing spacecraft mechanism: ${clipName}/${boneName}`)
  return new THREE.Quaternion().fromArray(track.createInterpolant().evaluate(time))
}

export function createSpacecraftMotion(gltf) {
  const gear = ["GearNose", "GearL", "GearR"].map(name => ({
    bone: gltf.scene.getObjectByName(name),
    folded: rotationAt(gltf, "Cruise", name, 0),
    deployed: rotationAt(gltf, "Landing", name, 3.9),
  }))
  const canopy = gltf.scene.getObjectByName("Canopy")
  const closed = rotationAt(gltf, "Cruise", "Canopy", 0)
  const open = rotationAt(gltf, "Cockpit", "Canopy", 3.9)
  const root = gltf.scene.getObjectByName("ShipRoot")
  const rootPosition = root.position.clone()
  let deployment = 0, opening = 0, command = "Cruise", clock = 0, drift = 0, thrust = 0

  function pose(legs, lid, bob = 0) {
    deployment = THREE.MathUtils.clamp(legs, 0, 1)
    opening = THREE.MathUtils.clamp(lid, 0, 1)
    gear.forEach(item => item.bone.quaternion.slerpQuaternions(item.folded, item.deployed, deployment))
    canopy.quaternion.slerpQuaternions(closed, open, opening)
    root.position.copy(rootPosition)
    root.position.y += bob
  }

  function select(name, snap = false) {
    if (!["Cruise", "Landing", "Cockpit"].includes(name)) return
    command = name
    if (snap) {
      pose(name === "Cruise" ? 0 : 1, name === "Cockpit" ? 1 : 0)
      thrust = name === "Cruise" ? 1 : 0
    }
  }

  function approach(value, target, delta) {
    const next = THREE.MathUtils.damp(value, target, 3.5, delta)
    return Math.abs(next-target) < .001 ? target : next
  }

  return {
    select, pose,
    update(delta) {
      clock += delta
      // Close the canopy before retracting gear; open it only after touchdown configuration.
      const gearTarget = command !== "Cruise" || opening > .015 ? 1 : 0
      const canopyTarget = command === "Cockpit" && deployment > .985 ? 1 : 0
      deployment = approach(deployment, gearTarget, delta)
      opening = approach(opening, canopyTarget, delta)
      drift = approach(drift, command === "Cruise" ? 1 : 0, delta)
      thrust = approach(thrust, command === "Cruise" && deployment < .15 && opening < .015 ? 1 : 0, delta)
      pose(deployment, opening, .06*Math.sin(clock*Math.PI/2)*drift)
    },
    state: () => ({ gear: deployment, canopy: opening, command, thrust }),
  }
}
