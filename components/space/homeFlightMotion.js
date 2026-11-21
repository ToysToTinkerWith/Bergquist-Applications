import * as THREE from "three"

export function poseApproachFlight(ship, time, destination) {
  // Drift gently while the rig's +Z nose stays aimed at Mars, without banking.
  const phase = time * .18
  ship.position.set(Math.sin(phase) * .42, Math.sin(phase * .73) * .16, Math.sin(phase * .61) * .18)
  ship.lookAt(destination)
}

export function departureProgress(time) {
  const ease = (start, end) => THREE.MathUtils.smootherstep(time, start, end)
  return { canopy: ease(1, 3.6), exit: ease(3.6, 8.6), hover: ease(8.6, 10.6) }
}
