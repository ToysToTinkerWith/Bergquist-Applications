function loadImage(src, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = "async"
    const cleanup = () => { image.onload = image.onerror = null; signal.removeEventListener("abort", abort) }
    const abort = () => { cleanup(); image.removeAttribute("src"); reject(new DOMException("Preview load aborted", "AbortError")) }
    image.onload = () => { cleanup(); resolve(image) }
    image.onerror = () => { cleanup(); reject(new Error(`Preview unavailable: ${src}`)) }
    signal.addEventListener("abort", abort, { once: true })
    if (signal.aborted) { abort(); return }
    image.src = src
  })
}

export async function loadMuseumPreviews(items, signal, load = loadImage) {
  const images = new Map()
  let index = 0
  // Bound image decoding while overlapping it with planet and font preparation.
  const workers = Array.from({ length: Math.min(4, items.length) }, async () => {
    while (index < items.length) {
      signal.throwIfAborted()
      const { key } = items[index++]
      try {
        images.set(key, await load(`/home/lunar-museum/previews/optimized/${key}.webp`, signal))
      } catch (error) {
        signal.throwIfAborted()
        try { images.set(key, await load(`/home/lunar-museum/previews/${key}.png`, signal)) }
        catch { signal.throwIfAborted() }
      }
    }
  })
  const results = await Promise.allSettled(workers)
  const failure = results.find(result => result.status === "rejected")
  if (failure) throw failure.reason
  return images
}
