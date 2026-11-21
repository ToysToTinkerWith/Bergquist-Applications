import * as THREE from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { createPlanetSurface } from "../MoonMesh"
import { disposeModel } from "./crewAssets"
import { loadMuseumPreviews } from "./museumPreviews"

export const MUSEUM_COLLECTIONS = [
  { id: "Data", label: "Data", color: "#75d8ee", center: [-11, 9.4], columns: 2 },
  { id: "Design", label: "Design", color: "#f0cd87", center: [0, -9.6], columns: 4 },
  { id: "Financial", label: "Financial", color: "#92e3b7", center: [11, 9.4], columns: 2 },
  { id: "AI", label: "AI", color: "#baa7f2", center: [0, 17], columns: 1 },
]

export function museumLayout(items) {
  return MUSEUM_COLLECTIONS.flatMap(collection => {
    const members = items.filter(item => item.category === collection.id)
    const rows = Math.ceil(members.length / collection.columns)
    return members.map((item, index) => ({ ...item, color: collection.color,
      x: collection.center[0] + (index % collection.columns - (Math.min(members.length, collection.columns) - 1) / 2) * 5.8,
      z: collection.center[1] + ((rows - 1) / 2 - Math.floor(index / collection.columns)) * 5.8,
    }))
  })
}

function canvasMap(width, height, draw) {
  const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height
  draw(canvas.getContext("2d"), width, height)
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function labelMap(text, color, detail = "") {
  return canvasMap(1024, 120, (ctx, w, h) => {
    ctx.fillStyle = "#0a1015"; ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = color; ctx.font = `400 ${detail ? 72 : 44}px "Bemora", sans-serif`
    while (ctx.measureText(text).width > 950) {
      const size = parseInt(ctx.font.match(/\d+px/)[0]) - 1
      ctx.font = `400 ${size}px "Bemora", sans-serif`
    }
    ctx.textAlign = "center"; ctx.fillText(text, w / 2, detail ? 73 : 76)
    if (detail) { ctx.fillStyle = "#adbec8"; ctx.font = '24px "Helmet", sans-serif'; ctx.fillText(detail, w / 2, 108) }
  })
}

export async function createLunarMuseum(scene, renderer, items, signal) {
  const root = new THREE.Group(); root.name = "Lunar component museum"; scene.add(root)
  try { return await buildMuseum(root, renderer, items, signal) }
  catch (error) { root.removeFromParent(); disposeModel(root); throw error }
}

async function buildMuseum(root, renderer, items, signal) {
  const materials = {
    ceramic: new THREE.MeshStandardMaterial({ color: "#d1d6d4", roughness: .6, metalness: .35 }),
    graphite: new THREE.MeshStandardMaterial({ color: "#161e25", roughness: .74, metalness: .5 }),
    metal: new THREE.MeshStandardMaterial({ color: "#687784", roughness: .4, metalness: .7 }),
  }
  const add = (parent, geometry, material, position = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position)
    mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh
  }
  const box = (parent, size, position, material) => add(parent, new RoundedBoxGeometry(...size, 2, .045), material, position)
  const resources = await Promise.allSettled([
    ...["moon", "earth"].map(async planet => {
      const surface = await createPlanetSurface(planet, renderer, signal)
      root.add(surface.group)
      return surface
    }),
    loadMuseumPreviews(items, signal),
    Promise.all([document.fonts.load('40px "Bemora"'), document.fonts.load('24px "Helmet"')]),
  ])
  signal.throwIfAborted()
  const failure = resources.find(result => result.status === "rejected")
  if (failure) throw failure.reason
  const [moon, earth, images] = resources.map(result => result.value)
  moon.group.scale.setScalar(30 / 2.15); moon.group.position.y = -30; root.add(moon.group)
  moon.group.updateMatrixWorld(true)
  root.add(earth.group); signal.throwIfAborted(); earth.group.scale.setScalar(3.1)
  const ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0)
  const ground = (x, z) => {
    ray.set(new THREE.Vector3(x, 20, z), down)
    return ray.intersectObject(moon.mesh, false)[0]?.point.y ?? -30 + Math.sqrt(Math.max(0, 900 - x * x - z * z))
  }
  const stations = new Map(), collections = new Map(), categorySigns = new Map(), hitTargets = [], collectionTargets = [], missing = []
  const hitMaterial = new THREE.MeshBasicMaterial({ visible: false })
  const layout = museumLayout(items)
  for (const item of layout) {
    signal.throwIfAborted()
    const y = Math.max(-1.4, ground(item.x, item.z) + .42)
    const pod = new THREE.Group(); pod.position.set(item.x, y, item.z); root.add(pod)
    const light = new THREE.MeshBasicMaterial({ color: item.color, toneMapped: false })
    add(pod, new THREE.CylinderGeometry(2.55, 2.65, .22, 40), materials.graphite)
    add(pod, new THREE.CylinderGeometry(2.35, 2.35, .04, 40), materials.metal, [0, .13, 0])
    const ringMaterial = new THREE.MeshBasicMaterial({ color: item.color, transparent: true, opacity: .3, toneMapped: false })
    const ring = add(pod, new THREE.TorusGeometry(2.48, .032, 6, 64), ringMaterial, [0, .15, 0]); ring.rotation.x = Math.PI / 2
    for (const [x, z] of [[-1.8, -1.3], [1.8, -1.3], [-1.8, 1.3], [1.8, 1.3]]) {
      const floor = ground(item.x + x, item.z + z), height = Math.max(.2, y - floor)
      add(pod, new THREE.CylinderGeometry(.075, .1, height, 8), materials.metal, [x, -height / 2, z])
      add(pod, new THREE.CylinderGeometry(.27, .32, .12, 12), materials.graphite, [x, floor - y + .06, z])
    }
    box(pod, [.3, 1.2, .3], [0, .65, 0], materials.ceramic)
    const frame = new THREE.Group(); frame.position.y = 2.5; frame.rotation.x = -.18; pod.add(frame)
    const back = box(frame, [4.7, 3.65, .22], [0, 0, 0], materials.ceramic)
    box(frame, [4.53, 3.48, .08], [0, 0, .13], materials.graphite)
    box(frame, [4.4, .035, .025], [0, 1.69, .19], light)
    const image = images.get(item.key)
    if (!image) missing.push(item.key)
    signal.throwIfAborted()
    const map = canvasMap(window.innerWidth < 700 ? 512 : 960, window.innerWidth < 700 ? 320 : 600, (ctx, width, height) => {
      ctx.fillStyle = "#05090d"; ctx.fillRect(0, 0, width, height)
      if (image) {
        const scale = Math.min(width / image.width, height / image.height)
        ctx.drawImage(image, (width - image.width * scale) / 2, (height - image.height * scale) / 2, image.width * scale, image.height * scale)
      } else {
        ctx.fillStyle = item.color; ctx.font = '28px "Helmet"'; ctx.textAlign = "center"; ctx.fillText("Preview unavailable", width / 2, height / 2)
      }
    })
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    const screen = add(frame, new THREE.PlaneGeometry(4.4, 2.75), new THREE.MeshBasicMaterial({ map, toneMapped: false }), [0, .2, .18])
    const caption = add(frame, new THREE.PlaneGeometry(4.4, .515), new THREE.MeshBasicMaterial({ map: labelMap(item.title, item.color), toneMapped: false }), [0, -1.46, .18])
    for (const mesh of [screen, caption, back]) { mesh.userData.componentKey = item.key; hitTargets.push(mesh) }
    for (const x of [-2.26, 2.26]) for (const sy of [-1.68, 1.68]) {
      const bolt = add(frame, new THREE.CylinderGeometry(.035, .035, .025, 6), materials.metal, [x, sy, .13]); bolt.rotation.x = Math.PI / 2
    }
    const center = new THREE.Vector3(item.x, y + 2.5, item.z)
    const hitArea = new THREE.Mesh(new THREE.BoxGeometry(5.3, 5, 5.3), hitMaterial)
    hitArea.position.copy(center); hitArea.position.y -= .3
    hitArea.userData.componentKey = item.key; hitArea.userData.collectionOnly = true; root.add(hitArea); hitTargets.push(hitArea)
    stations.set(item.key, { item, center, ring, bounds: new THREE.Box3().setFromCenterAndSize(center, new THREE.Vector3(5.3, 4.4, 3)) })
    if (!collections.has(item.category)) collections.set(item.category, new THREE.Box3())
    collections.get(item.category).union(stations.get(item.key).bounds)
  }
  for (const collection of MUSEUM_COLLECTIONS) {
    const members = layout.filter(item => item.category === collection.id)
    if (!members.length) continue
    const z = Math.min(...members.map(item => item.z)) - 3.2, x = collection.center[0]
    const y = 5.1
    const sign = add(root, new THREE.PlaneGeometry(8.4, .984), new THREE.MeshBasicMaterial({
      map: labelMap(collection.label.toUpperCase(), collection.color, `${String(members.length).padStart(2, "0")} EXHIBITS`), toneMapped: false,
    }), [x, y, z])
    const signParts = [sign]
    for (const side of [-1, 1]) {
      const floor = ground(x + side * 4, z)
      const support = add(root, new THREE.CylinderGeometry(.05, .07, y - floor, 8), materials.metal, [x + side * 4, (y + floor) / 2, z])
      support.userData.categorySupport = true; support.castShadow = false; signParts.push(support)
    }
    sign.userData.category = collection.id
    sign.castShadow = false; categorySigns.set(collection.id, signParts)
    hitTargets.push(sign)
    const bounds = collections.get(collection.id).clone().expandByScalar(.5)
    const region = new THREE.Mesh(new THREE.BoxGeometry(...bounds.getSize(new THREE.Vector3()).toArray()), hitMaterial)
    region.position.copy(bounds.getCenter(new THREE.Vector3())); region.userData.category = collection.id
    root.add(region); collectionTargets.push(region)
  }
  // The same lunar surface is sampled for every footpad and illuminated walkway.
  for (const collection of MUSEUM_COLLECTIONS) {
    const points = Array.from({ length: 24 }, (_, index) => {
      const t = index / 23, x = collection.center[0] * t, z = collection.center[1] * t
      return new THREE.Vector3(x, ground(x, z) + .09, z)
    })
    add(root, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, .035, 6, false), new THREE.MeshBasicMaterial({ color: collection.color, toneMapped: false }))
  }
  const starsGeometry = new THREE.BufferGeometry(), starsPositions = []
  let seed = 1972
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  for (let i = 0; i < 2400; i++) {
    const theta = random() * Math.PI * 2, u = random() * 2 - 1, r = 140 + random() * 90, ring = Math.sqrt(1 - u * u) * r
    starsPositions.push(Math.cos(theta) * ring, u * r, Math.sin(theta) * ring)
  }
  starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starsPositions, 3))
  const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ size: .17, color: "#c3d6e9", transparent: true, opacity: .8, depthWrite: false, toneMapped: false }))
  root.add(stars)
  // Bake repeated structural pieces by material; keep exhibit hit targets and highlights independent.
  root.updateMatrixWorld(true)
  for (const material of Object.values(materials)) {
    const meshes = []
    root.traverse(object => { if (object.isMesh && object.material === material && !object.userData.componentKey && !object.userData.categorySupport) meshes.push(object) })
    if (!meshes.length) continue
    const geometries = meshes.map(mesh => (mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld))
    const merged = new THREE.Mesh(mergeGeometries(geometries, false), material)
    merged.castShadow = merged.receiveShadow = true; root.add(merged)
    geometries.forEach(geometry => geometry.dispose())
    meshes.forEach(mesh => { mesh.removeFromParent(); mesh.geometry.dispose() })
  }
  return {
    root, stations, collections, hitTargets, collectionTargets, missing,
    highlight(key, category = "all") {
      stations.forEach((station, id) => { station.ring.material.opacity = key === id ? 1 : .3 })
      categorySigns.forEach((parts, id) => { parts.forEach(part => { part.visible = category === "all" || category === id }) })
    },
    update(time) {
      const angle = -.2 + time * .016
      earth.group.position.set(75 * Math.sin(angle), -30 + 75 * Math.cos(angle) * .4, -75 * Math.cos(angle) * Math.sqrt(.84))
      earth.mesh.rotation.y = time * .055
      stars.rotation.y = time * .0008
      return earth.group.position.toArray()
    },
  }
}
