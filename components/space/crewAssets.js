import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import { ASSET_ROOT, SHIP_ROOT } from "./flightCrews"
import { createModelCache, disposeModel } from "./modelCache"
export { disposeModel } from "./modelCache"

const lowMemory = typeof window !== "undefined" && (window.innerWidth < 700 || (navigator.deviceMemory || 8) <= 4)
const cache = createModelCache(async url => {
  const decoder = new DRACOLoader().setDecoderPath(`${ASSET_ROOT}draco/`).setWorkerLimit(1)
  let gltf
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Crew asset returned ${response.status}`)
    const buffer = await response.arrayBuffer()
    gltf = await new GLTFLoader().setDRACOLoader(decoder).parseAsync(buffer, url.slice(0, url.lastIndexOf("/") + 1))
    let hasSkin = false
    gltf.scene.traverse(object => {
      if (object.isSkinnedMesh) hasSkin = true
      if (object.isMesh) { object.frustumCulled = false; object.castShadow = object.receiveShadow = true }
      for (const material of (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean)) {
        if (/Black visor|Black canopy/.test(material.name)) material.envMapIntensity = .12
      }
    })
    if (!hasSkin) throw new Error("Crew asset has no skin")
    return { scene: gltf.scene, animations: gltf.animations }
  } catch (error) { if (gltf) disposeModel(gltf.scene); throw error }
  finally { decoder.dispose() }
}, { maxEntries: 12, maxBytes: (lowMemory ? 128 : 256) * 1024 * 1024 })

export const loadCrewModel = (url, signal) => cache.acquire(url, signal)
export const getCrewAssetStats = () => cache.stats()
export const preloadCrewModels = (urls, signal) => Promise.allSettled(urls.map(url => cache.preload(url, signal)))

export async function loadCrew(entry, signal) {
  const results = await Promise.allSettled([
    loadCrewModel(ASSET_ROOT + entry.asset, signal),
    loadCrewModel(SHIP_ROOT + entry.spacecraft, signal),
  ])
  const failure = results.find(result => result.status === "rejected")
  if (failure || signal?.aborted) {
    results.forEach(result => { if (result.status === "fulfilled") disposeModel(result.value.scene) })
    if (failure) throw failure.reason
    signal.throwIfAborted()
  }
  return { astronaut: results[0].value, spacecraft: results[1].value }
}

// Upload textures and render shadows offscreen before exposing a new model.
export async function warmScene(renderer, scene, camera) {
  await renderer.compileAsync(scene, camera)
  renderOffscreen(renderer, scene, camera)
}

export function renderOffscreen(renderer, scene, camera) {
  const target = new THREE.WebGLRenderTarget(128, 128)
  const previous = renderer.getRenderTarget()
  try {
    renderer.setRenderTarget(target)
    renderer.render(scene, camera)
  } finally {
    renderer.setRenderTarget(previous)
    target.dispose()
  }
}

export function delay(ms, signal) {
  return new Promise(resolve => {
    const done = () => { clearTimeout(timer); signal?.removeEventListener("abort", done); resolve() }
    const timer = setTimeout(done, ms)
    signal?.addEventListener("abort", done, { once: true })
    if (signal?.aborted) done()
  })
}
