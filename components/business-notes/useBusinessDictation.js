import { useCallback, useEffect, useRef, useState } from "react"
import { createDictationController } from "./dictationController.mjs"

export default function useBusinessDictation({ onFinal, language = "en-US" }) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState("")
  const [error, setError] = useState("")
  const finalRef = useRef(onFinal)
  const controller = useRef(null)
  finalRef.current = onFinal

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(Boolean(Recognition))
    setListening(false)
    setInterim("")
    if (!Recognition) return undefined
    const session = createDictationController({
      createRecognition: () => new Recognition(),
      onFinal: text => finalRef.current?.(text),
      onInterim: setInterim,
      onListening: setListening,
      onError: setError,
      language,
    })
    controller.current = session
    const stopWhenHidden = () => { if (document.hidden) session.stop() }
    document.addEventListener("visibilitychange", stopWhenHidden)
    return () => {
      document.removeEventListener("visibilitychange", stopWhenHidden)
      session.dispose()
      if (controller.current === session) controller.current = null
    }
  }, [language])

  const start = useCallback(() => {
    if (!controller.current) {
      setError("Voice input is not supported in this browser. You can still type your note.")
      return
    }
    controller.current.start()
  }, [])
  const stop = useCallback(options => controller.current?.stop(options), [])
  const clearError = useCallback(() => setError(""), [])
  return { supported, listening, interim, error, start, stop, clearError }
}
