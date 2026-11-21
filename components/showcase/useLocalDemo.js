import { useEffect, useState } from "react"

export default function useLocalDemo(key, initial, validate) {
  const [value, setValue] = useState(initial), [ready, setReady] = useState(false), [storageError, setStorageError] = useState("")
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        const parsed = JSON.parse(stored)
        if (!validate(parsed)) throw new Error("Invalid saved demo")
        setValue(parsed)
      }
    } catch { setStorageError("Saved demo unavailable. Changes will remain in this session.") }
    setReady(true)
  }, [key])
  useEffect(() => {
    if (!ready || storageError) return
    try { localStorage.setItem(key, JSON.stringify(value)) }
    catch { setStorageError("Browser storage is unavailable. Changes will remain in this session.") }
  }, [key, ready, value, storageError])
  return [value, setValue, { ready, storageError }]
}
