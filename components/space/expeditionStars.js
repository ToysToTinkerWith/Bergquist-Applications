import * as THREE from "three"

// Preserve the journey's cool, fine-grained field at each scene's camera scale.
export function createExpeditionStars({ journey = false, orthographic = false, shellRadius = 0 } = {}) {
  let seed = 1491
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  const positions = new Float32Array(900 * 3)
  for (let i = 0; i < positions.length; i += 3) {
    if (shellRadius) {
      const y = random() * 2 - 1, angle = random() * Math.PI * 2
      const radius = shellRadius + random() * 20, ring = Math.sqrt(1 - y * y)
      positions[i] = Math.cos(angle) * ring * radius
      positions[i + 1] = y * radius
      positions[i + 2] = Math.sin(angle) * ring * radius
      continue
    }
    positions[i] = journey ? random() * 240 - 70 : (random() - .5) * (orthographic ? 30 : 90)
    positions[i + 1] = (random() - .5) * (journey ? 90 : orthographic ? 28 : 60)
    positions[i + 2] = journey ? -12 - random() * 100 : -12 - random() * (orthographic ? 16 : 48)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  const stars = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xc2d1e8,
    size: shellRadius ? .24 : orthographic ? .014 : .055, transparent: true, opacity: .65, depthTest: true, depthWrite: false, fog: false }))
  stars.name = "Expedition star field"
  return stars
}
