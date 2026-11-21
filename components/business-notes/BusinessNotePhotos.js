import { useEffect, useId, useRef, useState } from "react"
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material"
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined"
import PhotoOutlinedIcon from "@mui/icons-material/PhotoOutlined"
import { MAX_NOTE_PHOTOS, fetchNotePhotoBlob, prepareNotePhoto } from "./notePhotoClient"
import styles from "../../styles/business-note-photos.module.css"

function usePrivatePhotoSources(photos, noteId, user) {
  const [state, setState] = useState({ key: "", sources: {} }), [retry, setRetry] = useState(0)
  const photoRef = useRef(photos), userRef = useRef(user)
  photoRef.current = photos; userRef.current = user
  const fingerprint = photos.map(photo => `${photo.id}:${photo.dataUrl ? `${photo.dataUrl.length}:${photo.dataUrl.slice(-24)}` : "saved"}`).join("|")
  const key = `${user?.uid || "guest"}:${noteId || "draft"}:${fingerprint}`
  useEffect(() => {
    const controller = new AbortController(), urls = new Set()
    const currentPhotos = photoRef.current
    const sources = Object.fromEntries(currentPhotos.map(photo => [photo.id, photo.dataUrl ? { status: "ready", src: photo.dataUrl } : { status: "loading", src: "" }]))
    setState({ key, sources })
    void Promise.all(currentPhotos.filter(photo => !photo.dataUrl).map(async photo => {
      try {
        const blob = await fetchNotePhotoBlob(photo, { noteId, user: userRef.current, signal: controller.signal })
        if (controller.signal.aborted) return
        const src = URL.createObjectURL(blob)
        urls.add(src)
        setState(current => current.key === key ? { ...current, sources: { ...current.sources, [photo.id]: { status: "ready", src } } } : current)
      } catch (error) {
        if (!controller.signal.aborted) setState(current => current.key === key ? { ...current, sources: { ...current.sources, [photo.id]: { status: "error", src: "", error: error.message || "Photo could not be loaded." } } } : current)
      }
    }))
    return () => { controller.abort(); for (const url of urls) URL.revokeObjectURL(url) }
  }, [key, retry])
  return { sources: state.key === key ? state.sources : {}, retry: () => setRetry(value => value + 1) }
}

function PhotoGrid({ photos, noteId, user, disabled = false, onChange }) {
  const { sources, retry } = usePrivatePhotoSources(photos, noteId, user)
  const [selectedId, setSelectedId] = useState(null), [downloading, setDownloading] = useState(false), [downloadError, setDownloadError] = useState("")
  const viewerTitleId = useId(), downloadRequest = useRef(null), downloadSequence = useRef(0)
  const selected = photos.find(photo => photo.id === selectedId), selectedSource = selected && sources[selected.id]
  useEffect(() => {
    setSelectedId(null); setDownloading(false); setDownloadError("")
    return () => { downloadSequence.current += 1; downloadRequest.current?.abort() }
  }, [noteId, user?.uid])
  async function downloadPhoto(photo) {
    if (downloading) return
    const controller = new AbortController(), current = ++downloadSequence.current
    downloadRequest.current?.abort(); downloadRequest.current = controller
    setDownloading(true); setDownloadError("")
    try {
      let blob
      if (photo.dataUrl) {
        if (!/^data:image\/jpeg;base64,/.test(photo.dataUrl)) throw new Error("This photo cannot be downloaded safely.")
        blob = await (await fetch(photo.dataUrl, { signal: controller.signal })).blob()
      } else blob = await fetchNotePhotoBlob(photo, { noteId, user, signal: controller.signal })
      if (controller.signal.aborted || downloadSequence.current !== current) return
      const url = URL.createObjectURL(blob), anchor = document.createElement("a")
      anchor.href = url
      anchor.download = (String(photo.name || "Business photo").replace(/\.[^.]*$/, "").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").slice(0, 150) || "Business photo") + ".jpg"
      document.body.appendChild(anchor); anchor.click(); anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) { if (!controller.signal.aborted && downloadSequence.current === current) setDownloadError(error.message || "The photo could not be downloaded.") }
    finally { if (downloadSequence.current === current) { setDownloading(false); downloadRequest.current = null } }
  }
  const failed = photos.some(photo => sources[photo.id]?.status === "error")
  if (!photos.length) return null
  return <>
    <ul className={styles.grid}>
      {photos.map((photo, index) => {
        const source = sources[photo.id]
        return <li key={photo.id} className={styles.card}>
          <button type="button" className={styles.thumbnail} disabled={!source?.src} aria-label={`View full photo ${index + 1}: ${photo.name}`} onClick={() => { setSelectedId(photo.id); setDownloadError("") }}>
            {source?.src ? <img src={source.src} alt={photo.caption || photo.description || photo.name || "Business note photo"} /> : <span className={styles.placeholder}><PhotoOutlinedIcon /><span>{source?.status === "error" ? "Photo unavailable" : "Loading photo…"}</span></span>}
            {source?.src && <span className={styles.viewHint}>View full photo</span>}
          </button>
          <div className={styles.cardBody}><div className={styles.nameRow}><span title={photo.name}>{photo.name || `Photo ${index + 1}`}</span>{onChange && <button type="button" className={styles.remove} aria-label={`Remove photo ${index + 1}: ${photo.name}`} disabled={disabled} onClick={() => onChange(photos.filter(item => item.id !== photo.id))}><CloseRoundedIcon fontSize="small" /></button>}</div>
            {onChange ? <label className={styles.captionLabel}>Photo context<textarea maxLength={500} rows={2} disabled={disabled} value={photo.caption || ""} onChange={event => onChange(photos.map(item => item.id === photo.id ? { ...item, caption: event.target.value } : item))} placeholder="What should AI know about this photo?" /></label> : photo.caption && <p className={styles.caption}>{photo.caption}</p>}
            {photo.description && <p className={styles.description}>{photo.description}</p>}
            {source?.status === "error" && <p className={styles.error}>{source.error}</p>}
          </div>
        </li>
      })}
    </ul>
    {failed && <button type="button" className={styles.retry} onClick={retry}>Retry loading photos</button>}
    <Dialog open={Boolean(selected)} onClose={() => setSelectedId(null)} fullWidth maxWidth="lg" aria-labelledby={viewerTitleId}>
      <DialogTitle id={viewerTitleId} sx={{ pr: 7, overflowWrap: "anywhere" }}>{selected?.name || "Photo"}<IconButton aria-label="Close photo" onClick={() => setSelectedId(null)} sx={{ position: "absolute", right: 10, top: 10 }}><CloseRoundedIcon /></IconButton></DialogTitle>
      <DialogContent>{selected && <div className={styles.viewer}>{selectedSource?.src ? <img src={selectedSource.src} alt={selected.caption || selected.description || selected.name} /> : <p>The photo is unavailable. Close this view and retry loading photos.</p>}{selected.caption && <p className={styles.viewerCaption}>{selected.caption}</p>}{selected.description && <p className={styles.description}>{selected.description}</p>}<button type="button" className={styles.action} disabled={downloading || !selectedSource?.src} onClick={() => downloadPhoto(selected)}><FileDownloadOutlinedIcon fontSize="small" />{downloading ? "Preparing download…" : "Download photo"}</button>{downloadError && <p className={styles.error} role="alert">{downloadError}</p>}</div>}</DialogContent>
    </Dialog>
  </>
}

export function NotePhotoGallery({ photos = [], noteId, user }) {
  return <PhotoGrid photos={photos} noteId={noteId} user={user} />
}

export default function BusinessNotePhotos({ photos = [], onChange, disabled = false, user, noteId, onBusyChange }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("")
  const upload = useRef(null), generation = useRef(0), busyRef = useRef(false), busyCallback = useRef(onBusyChange)
  busyCallback.current = onBusyChange
  useEffect(() => {
    generation.current += 1; busyRef.current = false; setBusy(false); setError(""); busyCallback.current?.(false)
    return () => { generation.current += 1; busyRef.current = false; busyCallback.current?.(false) }
  }, [noteId, user?.uid])
  async function addFiles(event) {
    const files = Array.from(event.target.files || []); event.target.value = ""
    if (!files.length || disabled || busyRef.current) return
    if (files.length + photos.length > MAX_NOTE_PHOTOS) { setError(`A note can have up to ${MAX_NOTE_PHOTOS} photos. Remove a photo or choose fewer files.`); return }
    const current = generation.current, prepared = [], failures = []
    busyRef.current = true; setBusy(true); setError(""); busyCallback.current?.(true)
    try {
      for (const file of files) {
        if (generation.current !== current) return
        try { prepared.push(await prepareNotePhoto(file)) } catch (failure) { failures.push(`${file.name}: ${failure.message}`) }
      }
      if (generation.current !== current) return
      if (prepared.length) onChange([...photos, ...prepared])
      if (failures.length) setError(failures.join(" ").slice(0, 800))
    } finally {
      if (generation.current === current) { busyRef.current = false; setBusy(false); busyCallback.current?.(false) }
    }
  }
  return <section className={styles.composer} aria-label="Photos for your business note">
    <div className={styles.toolbar}><div><strong>Add the details you can see.</strong><p>Include a job photo, receipt, or progress update. Add context for AI below each photo.</p></div><span>{photos.length} / {MAX_NOTE_PHOTOS}</span></div>
    <div className={styles.actions}><button type="button" className={styles.action} disabled={disabled || busy || photos.length >= MAX_NOTE_PHOTOS} onClick={() => upload.current?.click()}><AddPhotoAlternateOutlinedIcon fontSize="small" />Add photos</button><small>JPEG, PNG, or WebP · up to 10 MB each</small></div>
    <input ref={upload} className={styles.hidden} type="file" accept="image/*" multiple onChange={addFiles} disabled={disabled || busy} aria-label="Add business note photos" />
    {busy && <p role="status" className={styles.progress}>Preparing your photos…</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <PhotoGrid photos={photos} onChange={onChange} disabled={disabled || busy} noteId={noteId} user={user} />
  </section>
}
