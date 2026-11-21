import { useCallback, useEffect, useRef, useState } from "react"
import { NOTE_STORAGE_KEY, emptyWorkspace, validWorkspace, upsertNote, removeNote, updateItem } from "../../lib/businessNotes.mjs"
import { emptyOutbox, queueOperation, mergeCloudWorkspace, applyCanonicalResponse, cachedWorkspace, cachedOutbox } from "../../lib/businessNotesSync.mjs"

const REQUEST_TIMEOUT = 20000
const mutationId = () => "change-" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2))
const sessionName = (owner, version) => (owner?.uid || "signed-out") + ":" + version

export default function useBusinessNotes() {
  const [workspace, setWorkspace] = useState(emptyWorkspace)
  const [ready, setReady] = useState(false), [user, setUser] = useState(null)
  const [storageStatus, setStorageStatus] = useState("Checking workspace access…")
  const [accessStatus, setAccessStatus] = useState("checking"), [accessError, setAccessError] = useState("")
  const [sessionKey, setSessionKey] = useState("loading:0")
  const [cacheError, setCacheError] = useState(""), [syncError, setSyncError] = useState(""), [recoveryError, setRecoveryError] = useState("")
  const current = useRef(emptyWorkspace()), account = useRef(null), authOwner = useRef(null), key = useRef("")
  const session = useRef(0), liveSessionKey = useRef("loading:0"), writable = useRef(false), alive = useRef(true)
  const outbox = useRef(emptyOutbox()), blockedKeys = useRef(new Set()), controllers = useRef(new Set())
  const draining = useRef(null), refreshing = useRef(null), needsRefresh = useRef(false)
  const loadRef = useRef(null), refreshRef = useRef(null), drainRef = useRef(null)

  const active = useCallback(version => alive.current && session.current === version, [])
  const abortRequests = useCallback(() => { for (const controller of controllers.current) controller.abort(); controllers.current.clear() }, [])
  const setCurrent = useCallback(next => { current.current = next; setWorkspace(next) }, [])
  const persist = useCallback((storageKey, value) => {
    if (!storageKey || blockedKeys.current.has(storageKey)) {
      setCacheError("An unreadable browser copy could not be backed up. Keep this page open until account sync succeeds, or download your notes.")
      return false
    }
    try { localStorage.setItem(storageKey, JSON.stringify(value)); return true }
    catch { setCacheError("Browser backup is unavailable. Keep this page open until account sync succeeds, or download your notes."); return false }
  }, [])
  const persistWorkspace = useCallback(next => persist(key.current, next), [persist])
  const persistOutbox = useCallback(next => persist(key.current + ":outbox", next), [persist])

  const fetchJson = useCallback(async (url, options = {}) => {
    const controller = new AbortController()
    controllers.current.add(controller)
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      const data = await response.json()
      return { response, data }
    } catch (error) {
      if (controller.signal.aborted) throw new Error("The account request timed out. Your pending browser changes are retained.")
      throw error
    } finally { clearTimeout(timeout); controllers.current.delete(controller) }
  }, [])
  const tokenFor = useCallback(async owner => {
    let timeout
    try { return await Promise.race([owner.getIdToken(), new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error("Sign-in verification timed out. Try again.")), REQUEST_TIMEOUT) })]) }
    finally { clearTimeout(timeout) }
  }, [])

  const deny = useCallback((version, status, message) => {
    if (!active(version)) return
    const next = ++session.current
    liveSessionKey.current = sessionName(authOwner.current, next); setSessionKey(liveSessionKey.current)
    abortRequests(); account.current = null; writable.current = false
    outbox.current = emptyOutbox(); setCurrent(emptyWorkspace()); setReady(false)
    setAccessStatus(status); setAccessError(message); setStorageStatus("Workspace unavailable")
  }, [active, abortRequests, setCurrent])

  const checkAccessFailure = useCallback((version, response, data) => {
    const status = data?.code === "business_notes_unconfigured" ? "unconfigured" : response.status === 401 ? "signed-out" : response.status === 403 ? "denied" : null
    if (!status) return false
    deny(version, status, data.error || "This account cannot use the workspace.")
    return true
  }, [deny])

  const drain = useCallback(() => {
    const owner = account.current, version = session.current
    if (!owner || !active(version) || refreshing.current) return Promise.resolve()
    if (draining.current?.version === version) return draining.current.promise
    const run = { version, promise: null }
    draining.current = run
    run.promise = (async () => {
      while (active(version) && account.current?.uid === owner.uid && outbox.current.operations.length) {
        const operation = outbox.current.operations.find(item => item.action === "delete") || outbox.current.operations[0]
        setStorageStatus("Saving to your account…")
        try {
          const token = await tokenFor(owner)
          if (!active(version) || account.current?.uid !== owner.uid) return
          const { response, data } = await fetchJson("/api/business-workspace", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(operation) })
          if (!active(version)) return
          if (!response.ok) {
            if (checkAccessFailure(version, response, data)) return
            throw new Error(data.error || "Account sync is unavailable.")
          }
          const result = applyCanonicalResponse(current.current, outbox.current, operation, data.note)
          if (result.applied) {
            outbox.current = result.outbox
            const savedOutbox = persistOutbox(result.outbox)
            setCurrent(result.workspace)
            const savedWorkspace = persistWorkspace(result.workspace)
            if (savedOutbox && savedWorkspace) setCacheError("")
          }
          setSyncError("")
        } catch (error) {
          if (!active(version)) return
          setStorageStatus("Account sync pending · Browser changes retained")
          setSyncError(error.message || "Account sync is unavailable. Your pending changes are retained.")
          return
        }
      }
      if (active(version) && !outbox.current.operations.length) { setStorageStatus("Saved to your account"); setSyncError("") }
    })().finally(() => { if (draining.current === run) draining.current = null })
    return run.promise
  }, [active, tokenFor, fetchJson, checkAccessFailure, persistOutbox, persistWorkspace, setCurrent])
  drainRef.current = drain

  const refresh = useCallback(async () => {
    const owner = account.current, version = session.current
    if (!owner || !active(version)) return
    if (refreshing.current?.version === version) return refreshing.current.promise
    const run = { version, promise: null }
    refreshing.current = run
    writable.current = false; setReady(false)
    run.promise = (async () => {
      const inFlight = draining.current
      if (inFlight?.version === version) await inFlight.promise
      if (!active(version) || account.current?.uid !== owner.uid) return
      try {
        const token = await tokenFor(owner)
        if (!active(version)) return
        const { response, data } = await fetchJson("/api/business-workspace", { headers: { Authorization: "Bearer " + token } })
        if (!active(version)) return
        if (!response.ok) {
          if (checkAccessFailure(version, response, data)) return
          throw new Error(data.error || "Could not load account notes.")
        }
        if (!validWorkspace(data.workspace)) throw new Error("The account workspace could not be read safely.")
        const merged = mergeCloudWorkspace(data.workspace, outbox.current)
        setCurrent(merged)
        const savedWorkspace = persistWorkspace(merged), savedOutbox = persistOutbox(outbox.current)
        if (savedWorkspace && savedOutbox) setCacheError("")
        needsRefresh.current = false; setSyncError("")
        setStorageStatus(outbox.current.operations.length ? "Account sync pending" : "Saved to your account")
      } catch (error) {
        if (!active(version)) return
        needsRefresh.current = true
        setStorageStatus("Account unavailable · Browser copy retained")
        setSyncError(error.message || "Could not load account notes. Your pending changes are retained.")
      } finally {
        if (active(version) && account.current?.uid === owner.uid) { writable.current = true; setReady(true) }
      }
    })().finally(() => {
      if (refreshing.current === run) refreshing.current = null
      if (active(version) && !needsRefresh.current) void drainRef.current?.()
    })
    return run.promise
  }, [active, tokenFor, fetchJson, checkAccessFailure, persistWorkspace, persistOutbox, setCurrent])
  refreshRef.current = refresh

  useEffect(() => {
    alive.current = true
    let cancelled = false, unsubscribe
    function readPreserving(storageKey, parse, fallback) {
      let raw
      try { raw = localStorage.getItem(storageKey); return parse(raw) }
      catch {
        if (typeof raw === "string") {
          try { localStorage.setItem(storageKey + ":recovery:" + Date.now() + "-" + Math.random().toString(36).slice(2), raw); setRecoveryError("An unreadable saved browser copy was kept for recovery.") }
          catch { blockedKeys.current.add(storageKey); setRecoveryError("A previous browser copy could not be read. It has been left untouched for recovery.") }
        } else setCacheError("Browser storage is unavailable. Keep this page open until account sync succeeds, or download your notes.")
        return fallback()
      }
    }
    async function load(owner) {
      const version = ++session.current
      abortRequests(); draining.current = null; refreshing.current = null
      authOwner.current = owner && !owner.isAnonymous ? owner : null
      account.current = null; writable.current = false; needsRefresh.current = false
      liveSessionKey.current = sessionName(authOwner.current, version); setSessionKey(liveSessionKey.current)
      setUser(authOwner.current); setReady(false); setCurrent(emptyWorkspace()); outbox.current = emptyOutbox()
      setCacheError(""); setSyncError(""); setRecoveryError(""); setAccessError("")
      if (!authOwner.current) { setAccessStatus("signed-out"); setStorageStatus("Sign in to use business notes"); return }
      const candidate = authOwner.current
      setAccessStatus("checking"); setStorageStatus("Checking workspace access…")
      try {
        const token = await tokenFor(candidate)
        if (cancelled || !active(version)) return
        const { response, data } = await fetchJson("/api/business-notes-access", { headers: { Authorization: "Bearer " + token } })
        if (cancelled || !active(version)) return
        if (!response.ok || data.allowed !== true) {
          if (!checkAccessFailure(version, response, data)) deny(version, "error", data.error || "Workspace access could not be checked. Try again.")
          return
        }
        account.current = candidate; key.current = NOTE_STORAGE_KEY + ":" + candidate.uid
        const local = readPreserving(key.current, cachedWorkspace, emptyWorkspace)
        outbox.current = readPreserving(key.current + ":outbox", cachedOutbox, emptyOutbox)
        let restored = local
        try { restored = mergeCloudWorkspace(local, outbox.current) } catch { setSyncError("Some pending changes could not fit in this browser workspace. They have been retained for recovery.") }
        setCurrent(restored); setAccessStatus("allowed"); setStorageStatus("Loading your account…")
        await refreshRef.current?.()
      } catch (error) {
        if (cancelled || !active(version)) return
        deny(version, "error", error.message || "Workspace access could not be checked. Try again.")
      }
    }
    loadRef.current = load
    import("../../Firebase/FirebaseInit").then(async ({ auth }) => {
      const { onAuthStateChanged } = await import("firebase/auth")
      if (!cancelled) unsubscribe = onAuthStateChanged(auth, load, () => deny(session.current, "error", "Sign-in could not be checked. Reload the page and try again."))
    }).catch(() => { if (!cancelled) deny(session.current, "error", "Sign-in could not be loaded. Reload the page and try again.") })
    return () => { cancelled = true; alive.current = false; writable.current = false; session.current += 1; abortRequests(); unsubscribe?.() }
  }, [active, abortRequests, tokenFor, fetchJson, checkAccessFailure, deny, setCurrent])

  const requireWritable = useCallback(expectedSessionKey => {
    if (!writable.current || !account.current) throw new Error("Wait for your approved account workspace to finish loading.")
    if (expectedSessionKey && expectedSessionKey !== liveSessionKey.current) throw new Error("Your signed-in account changed. The note was not saved to a different workspace.")
  }, [])
  const commit = useCallback((next, operation) => {
    const pending = queueOperation(outbox.current, operation)
    const savedOutbox = persistOutbox(pending); outbox.current = pending
    setCurrent(next)
    const savedWorkspace = persistWorkspace(next)
    if (savedOutbox && savedWorkspace) setCacheError("")
    setSyncError("")
    setStorageStatus("Saving to your account…"); void drainRef.current?.()
  }, [persistOutbox, persistWorkspace, setCurrent])
  const saveNote = useCallback((note, expectedSessionKey) => {
    requireWritable(expectedSessionKey)
    commit(upsertNote(current.current, note), { action: "save", mutationId: mutationId(), note })
    return note
  }, [requireWritable, commit])
  const deleteNote = useCallback((noteId, expectedSessionKey) => {
    requireWritable(expectedSessionKey)
    commit(removeNote(current.current, noteId), { action: "delete", mutationId: mutationId(), noteId })
  }, [requireWritable, commit])
  const changeItem = useCallback((id, patch, expectedSessionKey) => {
    requireWritable(expectedSessionKey)
    const next = updateItem(current.current, id, patch)
    const note = next.notes.find(entry => entry.items.some(item => item.id === id))
    if (note) commit(next, { action: "save", mutationId: mutationId(), note })
  }, [requireWritable, commit])
  const retrySync = useCallback(() => {
    if (!account.current) return
    if (needsRefresh.current) return refreshRef.current?.()
    return drainRef.current?.()
  }, [])
  const retryAccess = useCallback(() => loadRef.current?.(authOwner.current), [])

  return { workspace, ready, user, storageStatus, storageError: [recoveryError, cacheError, syncError].filter(Boolean).join(" "), accessStatus, accessError, sessionKey, saveNote, deleteNote, changeItem, retrySync, retryAccess }
}

