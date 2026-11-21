import { MathUtils } from "three"

export function astronautRevealAt(time, start, duration) {
  const opacity = MathUtils.clamp(MathUtils.smootherstep(time, start, start + duration), 0, 1)
  return { opacity, scale: .52 + .48 * opacity }
}

export function createAstronautReveal(root) {
  const materials = new Map(), meshes = []
  root.traverse(object => {
    if (object.isMesh) meshes.push({ object, castShadow: object.castShadow })
    for (const material of (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean)) {
      if (!materials.has(material)) materials.set(material, {
        opacity: material.opacity, transparent: material.transparent, depthWrite: material.depthWrite,
      })
    }
  })
  return opacity => {
    const fading = opacity < 1
    for (const [material, original] of materials) {
      const transparent = fading || original.transparent
      if (material.transparent !== transparent) { material.transparent = transparent; material.needsUpdate = true }
      material.opacity = original.opacity * opacity
      material.depthWrite = fading ? false : original.depthWrite
    }
    // Avoid a full-strength shadow while the suit is still appearing.
    for (const { object, castShadow } of meshes) object.castShadow = !fading && castShadow
  }
}
