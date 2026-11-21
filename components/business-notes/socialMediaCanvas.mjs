export const VIDEO_SECONDS = 12
export const VIDEO_TYPES = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
export function containRect(imageWidth, imageHeight, x, y, width, height) {
  if (![imageWidth, imageHeight, width, height].every(value => Number.isFinite(value) && value > 0)) throw new Error("The photo dimensions are invalid.")
  const ratio = Math.min(width / imageWidth, height / imageHeight)
  return { x: x + (width - imageWidth * ratio) / 2, y: y + (height - imageHeight * ratio) / 2, width: imageWidth * ratio, height: imageHeight * ratio }
}
export function mediaPair(photos, beforeId, afterId) {
  const before = photos.find(photo => photo.id === beforeId), after = photos.find(photo => photo.id === afterId)
  if (!before || !after || before.id === after.id) throw new Error("Choose a different original photo for Before and After.")
  return [before, after]
}
export function isExampleSource(note) {
  return /\[EXAMPLE SHOWCASE\]/i.test(note?.text || "") || (note?.photos || []).some(photo => /example-(before|after)/i.test(photo.name || ""))
}
export function videoScene(seconds) { return seconds < 3 ? "before" : seconds < 7 ? "after" : seconds < 10 ? "comparison" : "closing" }

function words(ctx, value, x, y, width, size, maxLines = 2, color = "#f7f3ff") {
  ctx.fillStyle = color; ctx.font = `600 ${size}px Arial, sans-serif`
  const parts = String(value || "").split(/\s+/), lines = []; let line = ""
  for (const word of parts) {
    if (ctx.measureText((line + " " + word).trim()).width > width && line) { lines.push(line); line = word } else line = (line + " " + word).trim()
  }
  if (line) lines.push(line)
  lines.slice(0, maxLines).forEach((text, index) => { if (index === maxLines - 1 && lines.length > maxLines) text = text.slice(0, -3) + "…"; ctx.fillText(text, x, y + index * size * 1.24, width) })
}
function photo(ctx, source, x, y, width, height) {
  ctx.fillStyle = "#16141c"; ctx.fillRect(x, y, width, height)
  const fit = containRect(source.naturalWidth || source.width, source.naturalHeight || source.height, x, y, width, height)
  ctx.drawImage(source, fit.x, fit.y, fit.width, fit.height)
}
export function drawSocialFrame(canvas, { before, after, logo, title, example, scene = "comparison", progress = null }) {
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("This browser cannot draw the media draft.")
  const tall = canvas.height > canvas.width, height = tall ? 1350 : 1080
  ctx.save(); ctx.scale(canvas.width / 1080, canvas.height / height)
  ctx.fillStyle = "#0b0b10"; ctx.fillRect(0, 0, 1080, height)
  const gradient = ctx.createLinearGradient(0, 0, 1080, 0); gradient.addColorStop(0, "#b293ee"); gradient.addColorStop(1, "#82c6dc")
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1080, 9)
  ctx.drawImage(logo, 44, 38, 72, 72)
  words(ctx, "BERGQUIST APPLICATIONS", 134, 83, 890, 32, 1)
  words(ctx, example ? "WORKFLOW SHOWCASE" : "PROJECT UPDATE • DRAFT", 48, 163, 980, 22, 1, "#baa3e4")
  words(ctx, title || "From progress to post.", 48, 233, 984, 49, 2)
  if (scene === "comparison" || scene === "closing") {
    words(ctx, "BEFORE", 48, 345, 472, 25, 1, "#c8bbdc")
    words(ctx, example ? "AFTER CONCEPT" : "AFTER", 560, 345, 472, 25, 1, "#a9d6c7")
    photo(ctx, before, 48, 373, 472, 340); photo(ctx, after, 560, 373, 472, 340)
    words(ctx, scene === "closing" ? "Your photos. Your story." : "One note. A ready-to-review post.", 48, tall ? 831 : 805, 984, 42, 2)
    words(ctx, "See what your business notes can do.", 48, tall ? 912 : 878, 984, 26, 1, "#bfb5cd")
    if (tall) words(ctx, "bergquistapplications.com", 48, 1004, 984, 28, 1, "#baa3e4")
  } else {
    words(ctx, scene === "before" ? "BEFORE • THE STARTING POINT" : example ? "AFTER • THE FINISHED CONCEPT" : "AFTER • THE FINISHED WORK", 48, 345, 984, 25, 1, scene === "before" ? "#c8bbdc" : "#a9d6c7")
    photo(ctx, scene === "before" ? before : after, 48, 382, 984, 656)
  }
  const footer = height - 159
  ctx.fillStyle = "#251d34"; ctx.fillRect(32, footer, 1016, 116)
  words(ctx, example ? "EXAMPLE SHOWCASE • NOT A REAL JOB" : "SOCIAL MEDIA DRAFT • REVIEW BEFORE SHARING", 52, footer + 42, 976, 27, 1)
  words(ctx, example ? "AI-generated photos. Original uploads reused in this design." : "Original uploaded photos reused. No automatic publishing.", 52, footer + 82, 976, 21, 1, "#c4b6d8")
  if (progress !== null) { ctx.fillStyle = gradient; ctx.fillRect(0, height - 8, 1080 * Math.max(0, Math.min(1, progress)), 8) }
  ctx.restore()
}

export async function recordSocialVideo(canvas, assets, { signal, onProgress = () => {} } = {}) {
  if (typeof MediaRecorder === "undefined" || !canvas.captureStream) throw new Error("Video export is unavailable in this browser. You can still download the collage.")
  const mimeType = VIDEO_TYPES.find(type => MediaRecorder.isTypeSupported(type))
  if (!mimeType) throw new Error("This browser has no supported video encoder. Try Chrome or Edge, or download the collage.")
  if (document.hidden) throw new Error("Keep this tab visible while creating the video.")
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError")
  drawSocialFrame(canvas, { ...assets, scene: "before", progress: 0 })
  const stream = canvas.captureStream(24), chunks = []
  try {
    return await new Promise((resolve, reject) => {
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4500000 })
      let interval, watchdog, ended = false, failure = null
      const clean = () => { clearInterval(interval); clearTimeout(watchdog); signal?.removeEventListener("abort", abort); document.removeEventListener("visibilitychange", hidden) }
      const fail = error => { failure = error; if (recorder.state !== "inactive") recorder.stop(); else { ended = true; clean(); reject(error) } }
      const abort = () => fail(new DOMException("Video creation cancelled", "AbortError"))
      const hidden = () => { if (document.hidden) fail(new Error("Video creation stopped when the tab was hidden. Keep it visible and try again.")) }
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => fail(new Error("The browser could not encode this video. Try again or download the collage."))
      recorder.onstop = () => {
        if (ended) return; ended = true; clean()
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType })
        if (failure) reject(failure)
        else if (!blob.size) reject(new Error("The video encoder returned an empty file."))
        else resolve({ blob, extension: blob.type.includes("mp4") ? "mp4" : "webm" })
      }
      signal?.addEventListener("abort", abort, { once: true }); document.addEventListener("visibilitychange", hidden)
      try { recorder.start(250) } catch (error) { clean(); reject(error); return }
      const started = performance.now()
      interval = setInterval(() => {
        if (ended || failure) return
        const elapsed = (performance.now() - started) / 1000
        drawSocialFrame(canvas, { ...assets, scene: videoScene(elapsed), progress: elapsed / VIDEO_SECONDS })
        onProgress(Math.min(100, Math.floor(elapsed / VIDEO_SECONDS * 100)))
        if (elapsed >= VIDEO_SECONDS && recorder.state === "recording") recorder.stop()
      }, 1000 / 24)
      watchdog = setTimeout(() => fail(new Error("Video encoding timed out. Try again.")), 20000)
    })
  } finally { for (const track of stream.getTracks()) track.stop() }
}
