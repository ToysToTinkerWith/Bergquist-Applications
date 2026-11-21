import { useEffect, useRef, useState } from "react"
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined"
import MovieCreationOutlinedIcon from "@mui/icons-material/MovieCreationOutlined"
import CompareOutlinedIcon from "@mui/icons-material/CompareOutlined"
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined"
import { fetchNotePhotoBlob } from "./notePhotoClient"
import { isExampleSource } from "./socialMediaCanvas.mjs"
import { drawPromoImage, drawPromoVideoFrame, loadCreativeFonts, recordPromoVideo } from "./socialPromoCanvas.mjs"
import { CREATIVE_FORMATS, DEFAULT_BRAND } from "../../lib/businessSocialCreative.mjs"
import { s } from "../showcase/Workspace"
import m from "../../styles/business-social-media.module.css"

const modes = [
  { id: "promo-image", name: "Promo image", detail: "A branded campaign visual", icon: ImageOutlinedIcon },
  { id: "promo-video", name: "Promo video", detail: "A directed photo story", icon: MovieCreationOutlinedIcon },
  { id: "comparison", name: "Before & after", detail: "A side-by-side comparison", icon: CompareOutlinedIcon },
]
function loadImage(url, signal) {
  return new Promise((resolve, reject) => {
    const image = new Image(), clean = () => signal?.removeEventListener("abort", abort)
    const abort = () => { image.src = ""; reject(new DOMException("Cancelled", "AbortError")) }
    image.onload = () => { clean(); resolve(image) }; image.onerror = () => { clean(); reject(new Error("A photo or logo could not be opened.")) }
    if (signal?.aborted) { abort(); return }; signal?.addEventListener("abort", abort, { once: true }); image.src = url
  })
}
const canvasBlob = canvas => new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("The image could not be exported.")), "image/png"))

export default function BusinessSocialStudio({ note, user, platform = "Facebook", onUseCaption }) {
  const photos = note?.photos || [], example = isExampleSource(note)
  const [mode, setMode] = useState("promo-image"), [format, setFormat] = useState("portrait"), [duration, setDuration] = useState(12)
  const [brief, setBrief] = useState(""), [audience, setAudience] = useState(""), [tone, setTone] = useState("professional")
  const [brand, setBrand] = useState({ ...DEFAULT_BRAND }), [logoData, setLogoData] = useState("")
  const [selected, setSelected] = useState(() => photos.map(photo => photo.id))
  const [beforeId, setBeforeId] = useState(() => photos.find(photo => /before/i.test(photo.name + photo.caption))?.id || photos[0]?.id || "")
  const [afterId, setAfterId] = useState(() => photos.find(photo => /after/i.test(photo.name + photo.caption))?.id || photos[1]?.id || "")
  const [plan, setPlan] = useState(null), [poster, setPoster] = useState(""), [video, setVideo] = useState(""), [extension, setExtension] = useState("mp4")
  const [busy, setBusy] = useState(""), [progress, setProgress] = useState(0), [error, setError] = useState(""), [notice, setNotice] = useState(""), [stale, setStale] = useState(false)
  const request = useRef(null), urls = useRef(new Set()), source = useRef(null), canvas = useRef(null), logoInput = useRef(null), logoRequest = useRef(null)
  const selectedIds = mode === "comparison" ? [beforeId, afterId] : selected
  const settingsKey = JSON.stringify([user?.uid, note?.id, note?.text, photos.map(photo => [photo.id, photo.caption, photo.description, photo.size]), mode, format, duration, brief, audience, tone, brand, logoData, selectedIds, platform])
  useEffect(() => {
    setPlan(null); setPoster(""); setVideo(""); setError(""); setNotice(""); setStale(false); setBusy(""); source.current = null
    return () => { request.current?.abort(); request.current = null; urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear() }
  }, [settingsKey])
  useEffect(() => () => logoRequest.current?.abort(), [])
  useEffect(() => {
    const ids = photos.map(photo => photo.id)
    setSelected(current => { const next = current.filter(id => ids.includes(id)); return next.length === current.length ? current : next.length ? next : ids })
    if (!ids.includes(beforeId)) setBeforeId(ids[0] || "")
    if (!ids.includes(afterId)) setAfterId(ids[1] || ids[0] || "")
  }, [photos.map(photo => photo.id).join("|")])
  function localUrl(blob) { const url = URL.createObjectURL(blob); urls.current.add(url); return url }
  function preview(setter, next) { setter(old => { if (old && urls.current.has(old)) { URL.revokeObjectURL(old); urls.current.delete(old) } return next }) }
  function editPlan(key, value) { setPlan(current => ({ ...current, [key]: value })); setStale(true); setNotice("") }
  function brandValue(key, value) { setBrand(current => ({ ...current, [key]: value })) }
  function togglePhoto(id) { setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]) }
  async function uploadLogo(event) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) { setError("Choose a PNG, JPEG, or WebP logo under 2 MB."); return }
    const controller = new AbortController(); logoRequest.current?.abort(); logoRequest.current = controller; setBusy("logo"); setError("")
    const url = URL.createObjectURL(file), timer = setTimeout(() => controller.abort(), 10000)
    try {
      const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
      const actual = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? "image/jpeg" : [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte) ? "image/png" : String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" ? "image/webp" : ""
      if (actual !== file.type) throw new Error("Choose a valid PNG, JPEG, or WebP logo.")
      const image = await loadImage(url, controller.signal)
      if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error("Choose a smaller logo image.")
      const target = document.createElement("canvas"), ratio = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight))
      target.width = Math.max(1, Math.round(image.naturalWidth * ratio)); target.height = Math.max(1, Math.round(image.naturalHeight * ratio)); target.getContext("2d").drawImage(image, 0, 0, target.width, target.height)
      if (!controller.signal.aborted) setLogoData(target.toDataURL("image/png"))
    } catch (failure) { if (!controller.signal.aborted) setError(failure.message) }
    finally { clearTimeout(timer); URL.revokeObjectURL(url); if (logoRequest.current === controller) { logoRequest.current = null; setBusy("") } }
  }
  async function prepare(controller) {
    const images = {}
    await Promise.all(selectedIds.map(async id => { const photo = photos.find(photo => photo.id === id); if (!photo) throw new Error("Choose an original photo from this note."); images[id] = await loadImage(localUrl(await fetchNotePhotoBlob(photo, { noteId: note.id, user, signal: controller.signal })), controller.signal) }))
    const [logo] = await Promise.all([loadImage(logoData || "/brand/bergquist-orbital-icon.webp", controller.signal), loadCreativeFonts()])
    if (controller.signal.aborted) throw new DOMException("Cancelled", "AbortError")
    return { images, logo, brand: { ...brand }, mode, selectedIds: [...selectedIds], example }
  }
  async function render(nextPlan, assets) {
    const [width, height] = CREATIVE_FORMATS[format]; canvas.current.width = width; canvas.current.height = height
    if (mode === "promo-video") drawPromoVideoFrame(canvas.current, { ...assets, plan: nextPlan }, 0, duration); else drawPromoImage(canvas.current, { ...assets, plan: nextPlan })
    return await canvasBlob(canvas.current)
  }
  async function generate() {
    if (request.current || busy) return
    if (!selectedIds.length || mode === "comparison" && (beforeId === afterId || !beforeId || !afterId)) { setError(mode === "comparison" ? "Choose different Before and After photos." : "Choose at least one photo."); return }
    const controller = new AbortController(); request.current = controller; setBusy("planning"); setError(""); setNotice("")
    const timer = setTimeout(() => controller.abort(), 65000)
    try {
      const token = await user.getIdToken()
      const response = await fetch("/api/business-social-creative", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ noteId: note.id, mode, format, duration, brief, audience, tone, brand, photoIds: selectedIds, platform }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "The creative could not be drafted.")
      const assets = await prepare(controller), blob = await render(data.plan, assets)
      if (controller.signal.aborted || request.current !== controller) return
      source.current = assets; setPlan(data.plan); setStale(false); preview(setPoster, localUrl(blob)); preview(setVideo, ""); setNotice("AI creative ready. Review the copy and visual before exporting.")
    } catch (failure) { if (request.current === controller) setError(controller.signal.aborted ? "Creative generation stopped. Your saved note and photos are unchanged." : failure.message || "The creative is unavailable.") }
    finally { clearTimeout(timer); if (request.current === controller) { request.current = null; setBusy("") } }
  }
  async function exportMedia() {
    if (!plan || !source.current || request.current || busy) return
    const controller = new AbortController(); request.current = controller; setBusy(mode === "promo-video" ? "recording" : "rendering"); setError(""); setProgress(0)
    const timer = setTimeout(() => controller.abort(), (duration + 15) * 1000)
    try {
      const blob = await render(plan, source.current); if (controller.signal.aborted || request.current !== controller) return
      preview(setPoster, localUrl(blob)); setStale(false); preview(setVideo, "")
      if (mode === "promo-video") { const result = await recordPromoVideo(canvas.current, { ...source.current, plan }, { signal: controller.signal, duration, onProgress: setProgress }); if (!controller.signal.aborted && request.current === controller) { preview(setVideo, localUrl(result.blob)); setExtension(result.extension) } }
    } catch (failure) { if (request.current === controller) setError(controller.signal.aborted ? "Media creation stopped. Your saved work is unchanged." : failure.message) }
    finally { clearTimeout(timer); if (request.current === controller) { request.current = null; setBusy("") } }
  }
  async function useCaption() {
    setBusy("saving"); setError("")
    try { await onUseCaption?.(plan.caption); setNotice("The AI caption is saved with this social draft for review.") } catch (failure) { setError(failure.message || "The caption could not be saved.") } finally { setBusy("") }
  }
  if (!photos.length) return <p className={m.empty}>Add a photo to the original note to create a branded promo image or video.</p>
  const selectedMode = modes.find(value => value.id === mode), ModeIcon = selectedMode.icon, [width, height] = CREATIVE_FORMATS[format], filename = "bergquist-" + (example ? "example-" : "") + mode
  return <section className={m.studio} aria-label="AI social creative studio">
    <header className={m.studioHeading}><div><span>CREATIVE STUDIO</span><h4>Choose what the AI creates.</h4><p>Your note sets the context. Your photos and brand set the look.</p></div><span className={m.privateBadge}>Private draft</span></header>
    <div className={m.modeGrid} role="group" aria-label="Social creative mode">{modes.map(value => { const Icon = value.icon; return <button key={value.id} type="button" aria-pressed={mode === value.id} disabled={Boolean(busy) || value.id === "comparison" && photos.length < 2} onClick={() => { setMode(value.id); if (value.id === "promo-video") setFormat("story") }}><Icon /><strong>{value.name}</strong><small>{value.detail}</small></button> })}</div>
    {example && <p className={m.disclosure}>Example showcase. The source photos are AI-generated, and every export is labeled “not a real job.”</p>}
    <div className={m.workbench}><div className={m.controls}>
      <fieldset disabled={Boolean(busy)} className={m.fields}><legend>Creative brief</legend><label>What should this post communicate?<textarea rows={3} maxLength={2000} value={brief} onChange={event => setBrief(event.target.value)} placeholder="Highlight the finished work, show an important detail, or promote a specific service. The original note is included automatically." /></label><label>Audience<input maxLength={180} value={audience} onChange={event => setAudience(event.target.value)} placeholder="Who are you trying to reach?" /></label><div className={m.fieldRow}><label>Tone<select value={tone} onChange={event => setTone(event.target.value)}><option value="professional">Professional</option><option value="warm">Warm & approachable</option><option value="bold">Bold & confident</option><option value="minimal">Minimal & refined</option></select></label><label>Format<select value={format} onChange={event => setFormat(event.target.value)}><option value="square">Square · 1:1</option><option value="portrait">Portrait · 4:5</option><option value="story">Story / Reel · 9:16</option></select></label></div>{mode === "promo-video" && <label>Video length<select value={duration} onChange={event => setDuration(Number(event.target.value))}><option value={12}>12 seconds</option><option value={18}>18 seconds</option></select></label>}</fieldset>
      <fieldset disabled={Boolean(busy)} className={m.fields}><legend>{mode === "comparison" ? "Comparison originals" : "Photos the AI can use"}</legend>{mode === "comparison" ? <div className={m.fieldRow}><label>Before photo<select value={beforeId} onChange={event => setBeforeId(event.target.value)}>{photos.map(photo => <option key={photo.id} value={photo.id}>{photo.name}</option>)}</select></label><label>After photo<select value={afterId} onChange={event => setAfterId(event.target.value)}>{photos.map(photo => <option key={photo.id} value={photo.id}>{photo.name}</option>)}</select></label></div> : <div className={m.photoChoices}>{photos.map((photo, index) => <label key={photo.id}><input type="checkbox" checked={selected.includes(photo.id)} onChange={() => togglePhoto(photo.id)} /><span><strong>Photo {index + 1}</strong><small>{photo.caption || photo.name}</small></span></label>)}</div>}</fieldset>
      <details className={m.brandDetails}><summary>Company logo & branding <span>{brand.name}</span></summary><fieldset disabled={Boolean(busy)} className={m.fields}><label>Company name<input maxLength={70} value={brand.name} onChange={event => brandValue("name", event.target.value)} /></label><label>Company website<input maxLength={100} value={brand.website} onChange={event => brandValue("website", event.target.value)} /></label><label className={m.colorLabel}>Brand accent<input type="color" value={brand.accent} onChange={event => brandValue("accent", event.target.value)} /><span>{brand.accent}</span></label><div className={m.logoRow}><img src={logoData || "/brand/bergquist-orbital-icon.webp"} alt="Company logo used in this creative" /><button type="button" className={s.button} onClick={() => logoInput.current?.click()}>Choose company logo</button>{logoData && <button type="button" className={s.button} onClick={() => setLogoData("")}>Use Bergquist logo</button>}</div><p className={m.help}>PNG with transparency works best. Logos stay in this tab and appear in your exports.</p></fieldset><input ref={logoInput} hidden type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose company logo" onChange={uploadLogo} disabled={Boolean(busy)} /></details>
      <div className={m.generateRow}><button type="button" className={s.primary} disabled={Boolean(busy) || !selectedIds.length} onClick={generate}><AutoAwesomeOutlinedIcon fontSize="small" />{plan ? "Regenerate AI creative" : "Generate AI creative"}</button>{busy && <button type="button" className={s.button} onClick={() => { request.current?.abort(); logoRequest.current?.abort() }}>Stop</button>}</div>
      {busy && <p className={m.status} role="status">{busy === "planning" ? "AI is reading your note and photos and directing the creative…" : busy === "recording" ? "Rendering the promo video… " + progress + "% · Keep this tab visible." : busy === "saving" ? "Saving the caption…" : busy === "logo" ? "Preparing the company logo…" : "Updating the visual…"}</p>}{error && <p role="alert" className={s.error}>{error}</p>}{notice && <p role="status" className={m.notice}>{notice}</p>}
    </div><div className={m.previewColumn}><div className={m.previewHeading}><strong>{selectedMode.name}</strong><span>{width} × {height}</span></div>{poster ? <div className={m.previewStage} style={{ "--creative-ratio": width + "/" + height }}>{video && !stale ? <video controls playsInline preload="metadata" src={video} poster={poster} aria-label="AI-directed promo video" /> : <img src={poster} alt={example ? "Branded AI example creative with original synthetic photos and not-a-real-job disclosure" : "AI-directed branded creative using the original uploaded photos"} />}</div> : <div className={m.previewEmpty}><ModeIcon /><strong>Your creative takes shape here.</strong><p>Choose a mode, add direction, and let AI build the concept from your note and selected photos.</p></div>}{plan && <><div className={m.exportRow}><button type="button" className={s.primary} disabled={Boolean(busy)} onClick={exportMedia}>{mode === "promo-video" ? stale ? "Update & render video" : "Render promo video" : "Update image preview"}</button>{poster && !stale && mode !== "promo-video" && <a href={poster} download={filename + ".png"}>Download promo image PNG</a>}{video && !stale && <a href={video} download={filename + "." + extension}>Download promo video {extension.toUpperCase()}</a>}</div>{stale && <p className={m.help}>Copy changed. Update the visual before downloading.</p>}<p className={m.help}>{plan.rationale}</p></>}</div></div>
    {plan && <div className={m.planEditor}><div className={m.planHeading}><div><span>AI ART DIRECTION</span><h5>Make it yours before sharing.</h5></div><span>{plan.theme === "paper" ? "Editorial light" : "Cinematic dark"}</span></div><fieldset disabled={Boolean(busy)} className={m.fields}><div className={m.planGrid}><label>Headline<input maxLength={70} value={plan.headline} onChange={event => editPlan("headline", event.target.value)} /></label><label>Call to action<input maxLength={42} value={plan.callToAction} onChange={event => editPlan("callToAction", event.target.value)} /></label><label>Supporting copy<textarea rows={2} maxLength={150} value={plan.subheadline} onChange={event => editPlan("subheadline", event.target.value)} /></label><label>Visual style<select value={plan.theme} onChange={event => editPlan("theme", event.target.value)}><option value="paper">Editorial light</option><option value="ink">Cinematic dark</option></select></label></div><label>AI post caption<textarea rows={5} maxLength={2800} value={plan.caption} onChange={event => { setPlan(current => ({ ...current, caption: event.target.value })); setNotice("") }} /></label></fieldset><button type="button" className={s.button} disabled={Boolean(busy) || !plan.caption.trim()} onClick={useCaption}>Use this caption in the saved draft</button>{mode === "promo-video" && <div className={m.storyboard}><h5>Video storyboard</h5><ol>{plan.scenes.map((scene, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{scene.headline}</strong><small>{scene.subheadline}</small><em>{photos.find(photo => photo.id === scene.photoId)?.name}</em></div></li>)}<li><span>{String(plan.scenes.length + 1).padStart(2, "0")}</span><div><strong>Brand closing card</strong><small>{plan.callToAction}</small></div></li></ol></div>}{plan.cautions.length > 0 && <div className={m.cautions}><strong>Before sharing</strong><ul>{plan.cautions.map((value, index) => <li key={index}>{value}</li>)}</ul></div>}</div>}
    <canvas ref={canvas} width={1080} height={1350} hidden /><p className={m.footnote}>AI directs the copy, photo selection, and storyboard. The studio composes your original photos and exact logo with refined typography, color, and motion. Videos are silent photo promos. Creative settings and media stay in this tab; download to keep them. Captions can be saved to your account. Nothing publishes automatically.</p>
  </section>
}
