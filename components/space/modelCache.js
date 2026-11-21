import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js"

const sharedResources = new WeakSet()
const leases = new WeakMap()

function resources(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), skeletons = new Set()
  root.traverse(object => {
    if (object.geometry) geometries.add(object.geometry)
    if (object.skeleton) skeletons.add(object.skeleton)
    for (const material of (Array.isArray(object.material) ? object.material : [object.material]).filter(Boolean)) {
      materials.add(material)
      Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value) })
    }
  })
  return { geometries, materials, textures, skeletons }
}

function disposeResources(root, template = false) {
  const { geometries, materials, textures, skeletons } = resources(root)
  geometries.forEach(value => { if (template || !sharedResources.has(value)) value.dispose() })
  materials.forEach(value => value.dispose())
  textures.forEach(value => {
    if (template || !sharedResources.has(value)) { value.source?.data?.close?.(); value.dispose() }
  })
  skeletons.forEach(value => value.dispose())
}

export function disposeModel(root) {
  const release = []
  root.traverse(object => {
    if (leases.has(object)) { release.push(leases.get(object)); leases.delete(object) }
  })
  disposeResources(root)
  release.forEach(done => done())
}

function estimateBytes(root) {
  const { geometries, textures } = resources(root)
  const arrays = new Set()
  geometries.forEach(geometry => {
    if (geometry.index) arrays.add(geometry.index.array.buffer)
    Object.values(geometry.attributes).forEach(attribute => arrays.add((attribute.array || attribute.data.array).buffer))
    Object.values(geometry.morphAttributes).flat().forEach(attribute => arrays.add(attribute.array.buffer))
  })
  let bytes = [...arrays].reduce((sum, buffer) => sum + buffer.byteLength, 0)
  const sources = new Map()
  textures.forEach(texture => {
    // Three.js shares a GPU allocation for UV variants with the same source/sampler.
    const source = texture.source
    const key = JSON.stringify([texture.wrapS, texture.wrapT, texture.wrapR || 0,
      texture.magFilter, texture.minFilter, texture.anisotropy, texture.internalFormat,
      texture.format, texture.type, texture.generateMipmaps, texture.premultiplyAlpha,
      texture.flipY, texture.unpackAlignment, texture.colorSpace])
    if (!sources.has(source)) sources.set(source, new Set())
    if (sources.get(source).has(key)) return
    sources.get(source).add(key)
    const image = texture.image
    bytes += (image?.width || 1) * (image?.height || 1) * 4 * 4 / 3
  })
  return bytes
}

function waitFor(promise, signal) {
  if (!signal) return promise
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const abort = () => {
      signal.removeEventListener("abort", abort)
      reject(signal.reason || new DOMException("Aborted", "AbortError"))
    }
    signal.addEventListener("abort", abort, { once: true })
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort))
  })
}

// Templates own geometry and textures; instances own bones, materials and animations.
// An active scene pins its template so evicting another scene cannot break its GPU data.
export function createModelCache(loadTemplate, { maxEntries = 8, maxBytes = 128 * 1024 * 1024 } = {}) {
  const entries = new Map()
  let hits = 0, loads = 0, clock = 0
  const prune = () => {
    let bytes = [...entries.values()].reduce((sum, entry) => sum + entry.bytes, 0)
    const idle = [...entries.values()].filter(entry => entry.model && !entry.users).sort((a, b) => a.used - b.used)
    for (const entry of idle) {
      if (entries.size <= maxEntries && bytes <= maxBytes) break
      entries.delete(entry.key); bytes -= entry.bytes
      disposeResources(entry.model.scene, true)
    }
  }
  const borrow = (key, signal) => {
    signal?.throwIfAborted()
    let entry = entries.get(key)
    if (entry) hits++
    else {
      loads++
      entry = { key, users: 0, bytes: 0, used: 0, model: null }
      entries.set(key, entry)
      entry.promise = Promise.resolve().then(() => loadTemplate(key)).then(model => {
        entry.model = model; entry.bytes = estimateBytes(model.scene)
        const { geometries, textures } = resources(model.scene)
        geometries.forEach(value => sharedResources.add(value))
        textures.forEach(value => sharedResources.add(value))
        prune()
        return model
      }).catch(error => { entries.delete(key); throw error })
    }
    entry.users++; entry.used = ++clock
    const release = () => { entry.users--; entry.used = ++clock; prune() }
    return { entry, release }
  }
  return {
    async preload(key, signal) {
      const { entry, release } = borrow(key, signal)
      try { await waitFor(entry.promise, signal) } finally { release() }
    },
    async acquire(key, signal) {
      const { entry, release } = borrow(key, signal)
      try {
        const template = await waitFor(entry.promise, signal)
        signal?.throwIfAborted()
        const scene = cloneSkeleton(template.scene)
        const materials = new Map()
        scene.traverse(object => {
          if (!object.material) return
          const copy = original => {
            if (!materials.has(original)) materials.set(original, original.clone())
            return materials.get(original)
          }
          object.material = Array.isArray(object.material) ? object.material.map(copy) : copy(object.material)
        })
        leases.set(scene, release)
        return { scene, animations: template.animations.map(clip => clip.clone()) }
      } catch (error) { release(); throw error }
    },
    stats() {
      return { loads, hits, entries: entries.size,
        bytes: [...entries.values()].reduce((sum, entry) => sum + entry.bytes, 0),
        active: [...entries.values()].reduce((sum, entry) => sum + entry.users, 0) }
    },
    clear() {
      // Retire only idle entries; live scenes keep their ownership until release.
      for (const [key, entry] of entries) if (!entry.users && entry.model) {
        entries.delete(key); disposeResources(entry.model.scene, true)
      }
    },
  }
}
