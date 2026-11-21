import * as THREE from "three"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"
import { createModelCache, disposeModel } from "./modelCache"

const FINISHES = {
  italiana: { face: "#fff1cb", edge: "#b69555", depth: .22 },
  islandflourish: { face: "#efe7dc", edge: "#b99966", depth: .15 },
  darkcoin: { face: "#eef3f6", edge: "#8795a2", depth: .15, coin: true },
  comtree: { face: "#a4bda2", edge: "#557d65", depth: .23, layers: 2 },
  newstandard: { face: "#189968", edge: "#0b533c", depth: .23 },
  deniseprints: { depth: .08, art: true },
  upgradeaprons: { face: "#f0c16d", edge: "#8e5b2d", depth: .2 },
}

// Retain separate face/edge finishes while batching all disconnected logo contours.
function extrusion(shapes, scale, depth, bevel, curveSegments = 12) {
  const geometry = new THREE.ExtrudeGeometry(shapes, { depth: depth / scale, bevelEnabled: true,
    bevelSize: bevel / scale, bevelThickness: bevel / scale, bevelSegments: 4, steps: 1, curveSegments })
  const indices = [[], []]
  for (const group of geometry.groups) for (let i = group.start; i < group.start + group.count; i++) indices[group.materialIndex].push(i)
  geometry.clearGroups(); geometry.setIndex([...indices[0], ...indices[1]])
  geometry.addGroup(0, indices[0].length, 0); geometry.addGroup(indices[0].length, indices[1].length, 1)
  return geometry
}

const cache = createModelCache(async src => ({
  scene: await buildApplicationObject(src), animations: [],
}), { maxEntries: 6, maxBytes: 64 * 1024 * 1024 })

export async function createApplicationObject(src, signal) {
  return (await cache.acquire(src, signal)).scene
}

async function buildApplicationObject(src) {
  const id = src.split("/").pop().split(".")[0], finish = FINISHES[id]
  if (!finish) throw new Error("No 3D outline is available for this application")
  const root = new THREE.Group(); root.name = `${id} sculpted application emblem`
  try {
    for (let layer = 0; layer < (finish.layers || 1); layer++) {
      const response = await fetch(`/apps/objects/${id}-${layer}.svg`)
      if (!response.ok) throw new Error("Application outline could not load")
      const svg = new SVGLoader().parse(await response.text())
      const [, , width, height] = svg.xml.getAttribute("viewBox").split(/[ ,]+/).map(Number)
      const scale = 3.3 / Math.max(width, height), groups = new Map()
      for (const path of svg.paths) {
        if (!finish.art && path.color.r < .5) continue
        const color = finish.art ? `#${path.color.getHexString()}` : layer ? "#5c4138" : finish.face
        if (!groups.has(color)) groups.set(color, [])
        groups.get(color).push(...SVGLoader.createShapes(path))
      }
      if (finish.art) {
        const backing = new THREE.Mesh(new RoundedBoxGeometry(width * scale + .07, height * scale + .07, .24, 3, .035),
          new THREE.MeshPhysicalMaterial({ color: "#273b43", roughness: .28, metalness: .65, clearcoat: .7 }))
        backing.position.z = -.10; root.add(backing)
      }
      if (finish.coin) {
        const backing = new THREE.Mesh(new THREE.CylinderGeometry(1.76, 1.76, .26, 128),
          new THREE.MeshPhysicalMaterial({ color: "#28303b", roughness: .24, metalness: .9, clearcoat: .7 }))
        backing.rotation.x = Math.PI / 2; backing.position.z = -.06; root.add(backing)
        for (const z of [-.19, .075]) {
          const rim = new THREE.Mesh(new THREE.TorusGeometry(1.72, .035, 10, 128), new THREE.MeshStandardMaterial({ color: "#aebac7", metalness: .95, roughness: .21 }))
          rim.position.z = z; root.add(rim)
        }
      }
      for (const [color, shapes] of groups) {
        if (!shapes.length) continue
        if (id === "newstandard") {
          for (let i = 0; i < shapes.length; i++) {
            const bounds = new THREE.Box2().setFromPoints(shapes[i].getPoints(12))
            if (bounds.getSize(new THREE.Vector2()).x < width * .94) continue
            const radius = width / 2 - 3, ring = new THREE.Shape(), hole = new THREE.Path()
            ring.absarc(width / 2, height / 2, radius, 0, Math.PI * 2, false)
            hole.absarc(width / 2, height / 2, radius - width * .05, 0, Math.PI * 2, true)
            ring.holes.push(hole); shapes[i] = ring
          }
        }
        const shade = new THREE.Color(color), depth = finish.art ? .04 + shade.getHSL({}).l * .11 : finish.depth
        const geometry = extrusion(shapes, scale, depth, finish.art ? .004 : id === "islandflourish" || id === "newstandard" ? .007 : .013, id === "newstandard" ? 64 : 12)
        geometry.translate(-width / 2, -height / 2, 0); geometry.scale(scale, scale, scale)
        const face = new THREE.MeshPhysicalMaterial({ color, roughness: finish.art ? .42 : .25, metalness: finish.art ? .12 : .44, clearcoat: .8, clearcoatRoughness: .2 })
        const edge = new THREE.MeshPhysicalMaterial({ color: finish.art ? shade.clone().multiplyScalar(.68) : layer ? "#775547" : finish.edge,
          roughness: .21, metalness: .78, clearcoat: .65 })
        const mesh = new THREE.Mesh(geometry, [face, edge]); mesh.scale.y = -1
        mesh.position.z = finish.art ? .035 : finish.coin ? .075 : -.11 + layer * .09
        root.add(mesh)
      }
    }
    const bounds = new THREE.Box3().setFromObject(root), center = bounds.getCenter(new THREE.Vector3())
    root.children.forEach(child => child.position.sub(center))
    root.userData.size = bounds.getSize(new THREE.Vector3()).toArray()
    return root
  } catch (error) { disposeModel(root); throw error }
}
