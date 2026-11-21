import { containRect, VIDEO_TYPES } from "./socialMediaCanvas.mjs"

let fontPromise
export function loadCreativeFonts() {
  if (!fontPromise) fontPromise = (async () => {
    try {
      const font = new FontFace("CreativeOutfit", "url(/fonts/outfit-latin.woff2)", { weight: "100 900" })
      document.fonts.add(await font.load())
    } catch { /* System fonts remain available if the local font cannot load. */ }
  })()
  return fontPromise
}
const font = (size, weight = 500) => `${weight} ${size}px CreativeOutfit, Arial, sans-serif`
export function fitCreativeText(ctx, value, width, maxSize, minSize, maxLines) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean)
  let lines = [], size = maxSize
  for (; size >= minSize; size -= 2) {
    ctx.font = font(size, 600); lines = []; let line = ""
    for (const word of words) {
      if (line && ctx.measureText(line + " " + word).width > width) { lines.push(line); line = word } else line = (line + " " + word).trim()
    }
    if (line) lines.push(line)
    if (lines.length <= maxLines && lines.every(line => ctx.measureText(line).width <= width)) return { lines, size }
  }
  size = minSize; ctx.font = font(size, 600); lines = lines.slice(0, maxLines)
  lines = lines.map((line, index) => {
    const needsEllipsis = ctx.measureText(line).width > width || index === maxLines - 1
    if (!needsEllipsis) return line
    while (line && ctx.measureText(line + "…").width > width) line = line.slice(0, -1)
    return line.replace(/[\s.,;:-]+$/, "") + "…"
  })
  return { lines, size }
}
function text(ctx, value, x, y, width, size, maxLines, color, weight = 500) {
  const fitted = fitCreativeText(ctx, value, width, size, Math.max(20, size - 18), maxLines)
  ctx.fillStyle = color; ctx.font = font(fitted.size, weight)
  fitted.lines.forEach((line, i) => ctx.fillText(line, x, y + i * fitted.size * 1.12))
  return fitted.lines.length * fitted.size * 1.12
}
function box(ctx, x, y, w, h, radius, fill) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fillStyle = fill; ctx.fill()
}
function theme(plan, brand) {
  return plan.theme === "paper" ? { bg: "#f4f1eb", ink: "#1d2025", muted: "#676971", line: "#dcd8d1", panel: "#e8e4de", accent: brand.accent }
    : { bg: "#101116", ink: "#f6f3ec", muted: "#a5a7b2", line: "#31333e", panel: "#1c1e27", accent: brand.accent }
}
function sourcePhoto(ctx, image, x, y, width, height, palette, phase = 1) {
  box(ctx, x, y, width, height, 16, palette.panel)
  const rect = containRect(image.naturalWidth || image.width, image.naturalHeight || image.height, x + 8, y + 8, width - 16, height - 16)
  const scale = 0.98 + 0.02 * Math.max(0, Math.min(1, phase))
  const w = rect.width * scale, h = rect.height * scale
  ctx.drawImage(image, rect.x + (rect.width - w) / 2, rect.y + (rect.height - h) / 2, w, h)
}
function logo(ctx, image, x, y, size, palette) {
  box(ctx, x, y, size, size, 12, palette.bg)
  const r = containRect(image.naturalWidth || image.width, image.naturalHeight || image.height, x, y, size, size)
  ctx.drawImage(image, r.x, r.y, r.width, r.height)
}
function brandHeader(ctx, assets, palette, width, step) {
  logo(ctx, assets.logo, 52, 43, 62, palette)
  text(ctx, assets.brand.name, 132, 83, width - 330, 30, 1, palette.ink, 600)
  if (step) text(ctx, step, width - 148, 80, 98, 22, 1, palette.muted)
  ctx.strokeStyle = palette.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(52, 130); ctx.lineTo(width - 52, 130); ctx.stroke()
}
function disclosure(ctx, assets, palette, width, height) {
  if (assets.example) {
    box(ctx, 32, height - 87, width - 64, 61, 7, palette.ink)
    text(ctx, "EXAMPLE SHOWCASE · AI-GENERATED PHOTOS · NOT A REAL JOB", 52, height - 49, width - 104, 22, 1, palette.bg, 600)
  } else {
    text(ctx, assets.brand.website || assets.brand.name, 52, height - 43, width - 104, 22, 1, palette.muted)
  }
}
function cta(ctx, value, x, y, maxWidth, palette) {
  ctx.font = font(24, 600)
  const labelWidth = Math.min(maxWidth - 82, ctx.measureText(value).width)
  const w = Math.min(maxWidth, labelWidth + 82)
  box(ctx, x, y - 39, w, 58, 29, palette.ink)
  text(ctx, value, x + 24, y, w - 76, 24, 1, palette.bg, 600)
  ctx.strokeStyle = palette.bg; ctx.lineWidth = 2.4
  const right = x + w - 24
  ctx.beginPath(); ctx.moveTo(right - 15, y - 8); ctx.lineTo(right, y - 8); ctx.moveTo(right - 7, y - 15); ctx.lineTo(right, y - 8); ctx.lineTo(right - 7, y - 1); ctx.stroke()
}
export function drawPromoImage(canvas, assets) {
  const { plan, brand, images, logo: logoImage } = assets
  const width = 1080, height = canvas.height / canvas.width * width, palette = theme(plan, brand)
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("The image canvas is unavailable.")
  ctx.save(); ctx.scale(canvas.width / width, canvas.height / height)
  ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, width, height)
  brandHeader(ctx, { ...assets, logo: logoImage }, palette, width)
  const copyHeight = height > 1500 ? 420 : height > 1150 ? 356 : 310
  const photoTop = 185, photoHeight = height - photoTop - copyHeight - 112
  text(ctx, plan.eyebrow.toUpperCase(), 52, 166, 976, 20, 1, palette.muted, 600)
  if (assets.mode === "comparison") {
    const [before, after] = assets.selectedIds
    sourcePhoto(ctx, images[before], 52, photoTop + 32, 468, photoHeight - 32, palette)
    sourcePhoto(ctx, images[after], 560, photoTop + 32, 468, photoHeight - 32, palette)
    text(ctx, "BEFORE", 52, photoTop + 14, 468, 20, 1, palette.muted, 600)
    text(ctx, assets.example ? "AFTER CONCEPT" : "AFTER", 560, photoTop + 14, 468, 20, 1, palette.muted, 600)
  } else sourcePhoto(ctx, images[plan.heroPhotoId], 52, photoTop, 976, photoHeight, palette)
  const copyY = photoTop + photoHeight + 65
  const headlineHeight = text(ctx, plan.headline, 52, copyY, 976, height > 1150 ? 74 : 54, 2, palette.ink, 600)
  const subY = copyY + headlineHeight + 5
  text(ctx, plan.subheadline, 54, subY, 930, 28, 2, palette.muted, 400)
  cta(ctx, plan.callToAction, 52, height - 149, 690, palette)
  if (brand.website && assets.example) text(ctx, brand.website.replace(/^https?:\/\//, ""), 760, height - 149, 268, 20, 1, palette.muted)
  disclosure(ctx, assets, palette, width, height)
  ctx.fillStyle = palette.accent; ctx.fillRect(0, 0, 1080, 7)
  ctx.restore()
}

export function sceneAt(plan, seconds, duration) {
  const count = plan.scenes.length + 1, beat = duration / count, index = Math.min(count - 1, Math.max(0, Math.floor(seconds / beat)))
  return { index, phase: Math.min(1, Math.max(0, (seconds - index * beat) / beat)), beat }
}
function drawVideoScene(canvas, assets, index, phase, totalProgress, alpha = 1) {
  const { plan, brand, images } = assets, width = 1080, height = canvas.height / canvas.width * width
  const palette = theme(plan, brand), ctx = canvas.getContext("2d"), scene = plan.scenes[index]
  ctx.save(); ctx.scale(canvas.width / width, canvas.height / height); ctx.globalAlpha = alpha
  ctx.fillStyle = palette.bg; ctx.fillRect(0, 0, width, height)
  brandHeader(ctx, assets, palette, width, String(index + 1).padStart(2, "0") + " / " + String(plan.scenes.length + 1).padStart(2, "0"))
  const lift = (1 - Math.min(1, phase * 7)) * 16
  if (!scene) {
    const size = Math.min(160, height * .12)
    logo(ctx, assets.logo, 52, 200, size, palette)
    text(ctx, plan.headline, 52, height * .45 + lift, 976, 84, 3, palette.ink, 600)
    text(ctx, plan.subheadline, 56, height * .69 + lift, 900, 32, 3, palette.muted, 400)
    cta(ctx, plan.callToAction, 52, height - 213, 800, palette)
    if (brand.website) text(ctx, brand.website.replace(/^https?:\/\//, ""), 52, height - 136, 976, 27, 1, palette.muted)
  } else {
    const photoTop = height > 1500 ? 330 : height > 1150 ? 265 : 205
    const photoHeight = height - photoTop - 380
    text(ctx, scene.label.toUpperCase(), 52, photoTop - 34 + lift, 976, 22, 1, palette.muted, 600)
    sourcePhoto(ctx, images[scene.photoId], 52, photoTop, 976, Math.max(290, photoHeight), palette, phase)
    const y = photoTop + Math.max(290, photoHeight) + 73
    const h = text(ctx, scene.headline, 52, y + lift, 976, 66, 2, palette.ink, 600)
    text(ctx, scene.subheadline, 54, y + h + 15 + lift, 946, 29, 2, palette.muted, 400)
  }
  disclosure(ctx, assets, palette, width, height)
  ctx.fillStyle = palette.accent; ctx.fillRect(0, 0, width * Math.max(0, Math.min(1, totalProgress)), 7)
  ctx.restore()
}
export function drawPromoVideoFrame(canvas, assets, seconds, duration) {
  const state = sceneAt(assets.plan, seconds, duration)
  const fade = Math.min(1, state.phase * state.beat / .45)
  if (state.index > 0 && fade < 1) {
    drawVideoScene(canvas, assets, state.index - 1, 1, seconds / duration)
    drawVideoScene(canvas, assets, state.index, state.phase, seconds / duration, fade)
  } else drawVideoScene(canvas, assets, state.index, state.phase, seconds / duration)
}
export async function recordPromoVideo(canvas, assets, { duration = 12, signal, onProgress = () => {} } = {}) {
  if (typeof MediaRecorder === "undefined" || !canvas.captureStream) throw new Error("Video export is unavailable in this browser.")
  const mimeType = VIDEO_TYPES.find(type => MediaRecorder.isTypeSupported(type))
  if (!mimeType) throw new Error("This browser has no supported video encoder. Try Chrome or Edge.")
  if (document.hidden) throw new Error("Keep the tab visible while recording the promo video.")
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError")
  drawPromoVideoFrame(canvas, assets, 0, duration)
  const stream = canvas.captureStream(30)
  try {
    return await new Promise((resolve, reject) => {
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6500000 }), chunks = []
      let timer, watchdog, done = false, failure
      const cleanup = () => { clearInterval(timer); clearTimeout(watchdog); signal?.removeEventListener("abort", abort); document.removeEventListener("visibilitychange", hidden) }
      const fail = error => { if (done) return; failure = error; if (recorder.state !== "inactive") recorder.stop(); else { done = true; cleanup(); reject(error) } }
      const abort = () => fail(new DOMException("Cancelled", "AbortError"))
      const hidden = () => { if (document.hidden) fail(new Error("Recording stopped because the tab was hidden. Keep it visible and try again.")) }
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      recorder.onerror = () => fail(new Error("The video encoder failed. Try again or create a promo image."))
      recorder.onstop = () => { if (done) return; done = true; cleanup(); const blob = new Blob(chunks, { type: recorder.mimeType || mimeType }); if (failure) reject(failure); else if (!blob.size) reject(new Error("The video file is empty.")); else resolve({ blob, extension: blob.type.includes("mp4") ? "mp4" : "webm" }) }
      signal?.addEventListener("abort", abort, { once: true }); document.addEventListener("visibilitychange", hidden)
      try { recorder.start(250) } catch (error) { cleanup(); reject(error); return }
      const start = performance.now()
      timer = setInterval(() => {
        if (done || failure) return
        const elapsed = Math.min(duration, (performance.now() - start) / 1000)
        try { drawPromoVideoFrame(canvas, assets, elapsed, duration) } catch { fail(new Error("A video frame could not be rendered.")); return }
        onProgress(Math.min(100, Math.round(elapsed / duration * 100)))
        if (elapsed >= duration && recorder.state === "recording") recorder.stop()
      }, 1000 / 30)
      watchdog = setTimeout(() => fail(new Error("Video creation timed out.")), (duration + 10) * 1000)
    })
  } finally { stream.getTracks().forEach(track => track.stop()) }
}
