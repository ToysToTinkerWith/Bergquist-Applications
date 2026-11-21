const messages = {
  "not-allowed": "Microphone access was denied. Allow microphone access in your browser, then try again.",
  "service-not-allowed": "Your browser’s speech service is unavailable. You can still type your note.",
  "audio-capture": "No working microphone was found. Check your microphone and try again.",
  network: "Voice recognition could not connect. Check your connection and try again.",
  "no-speech": "No speech was detected. Try speaking closer to your microphone.",
  "language-not-supported": "Your browser does not support that dictation language.",
}

// Kept separate from React so asynchronous recognition lifecycles can be tested.
export function createDictationController({
  createRecognition,
  onFinal = () => {},
  onInterim = () => {},
  onListening = () => {},
  onError = () => {},
  language = "en-US",
  schedule = setTimeout,
  unschedule = clearTimeout,
  maxRestarts = 3,
}) {
  let recognition = null
  let wanted = false
  let disposed = false
  let restartTimer = null
  let finishTimer = null
  let generation = 0
  let emptyRestarts = 0
  let stopping = false

  const clearRestart = () => {
    if (restartTimer !== null) unschedule(restartTimer)
    restartTimer = null
  }
  const clearFinish = () => {
    if (finishTimer !== null) unschedule(finishTimer)
    finishTimer = null
  }
  const detach = instance => {
    if (!instance) return
    instance.onstart = instance.onresult = instance.onerror = instance.onend = null
  }

  function begin() {
    if (!wanted || disposed) return
    const currentGeneration = ++generation
    let instance
    try { instance = createRecognition() } catch {
      wanted = false
      onListening(false)
      onError("Voice recognition is unavailable. You can still type your note.")
      return
    }
    recognition = instance
    stopping = false
    instance.lang = language
    instance.continuous = true
    instance.interimResults = true
    instance.maxAlternatives = 1
    const delivered = new Set()
    const active = () => !disposed && generation === currentGeneration

    instance.onstart = () => {
      if (!active()) return
      if (!wanted) {
        try { instance.stop() } catch {}
        return
      }
      onListening(true)
    }
    instance.onresult = event => {
      if (!active()) return
      const finals = []
      const interim = []
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index]
        const text = String(result?.[0]?.transcript || "").trim()
        if (!text) continue
        if (result.isFinal) {
          if (index >= (event.resultIndex || 0) && !delivered.has(index)) {
            delivered.add(index)
            finals.push(text)
          }
        } else interim.push(text)
      }
      if (finals.length) {
        emptyRestarts = 0
        onError("")
        onFinal(finals.join(" "))
      }
      onInterim(interim.join(" "))
    }
    instance.onerror = event => {
      if (!active()) return
      // Aborting a stopped or disposed session is expected, not a user error.
      if (event?.error === "aborted" && !wanted) return
      wanted = false
      clearRestart()
      clearFinish()
      generation += 1
      detach(instance)
      if (recognition === instance) recognition = null
      stopping = false
      try { instance.abort() } catch {}
      onListening(false)
      onInterim("")
      onError(messages[event?.error] || "Voice recognition stopped. Try again, or continue typing your note.")
    }
    instance.onend = () => {
      if (!active()) return
      clearFinish()
      detach(instance)
      if (recognition === instance) recognition = null
      stopping = false
      onInterim("")
      if (!wanted) { onListening(false); return }
      if (emptyRestarts >= maxRestarts) {
        wanted = false
        onListening(false)
        onError("Dictation paused. Tap the microphone to continue.")
        return
      }
      // A short browser reconnect is still an active dictation session.
      onListening(true)
      emptyRestarts += 1
      restartTimer = schedule(() => {
        restartTimer = null
        begin()
      }, 250)
    }
    try { instance.start() } catch (error) {
      wanted = false
      recognition = null
      detach(instance)
      onListening(false)
      onError(error?.name === "NotAllowedError" || error?.name === "SecurityError"
        ? messages["not-allowed"]
        : "Voice recognition could not start. Try again, or continue typing your note.")
    }
  }

  return {
    start() {
      if (disposed || wanted) return
      wanted = true
      emptyRestarts = 0
      onError("")
      onInterim("")
      // Reserve the session while its permission prompt or start event is pending.
      // The host must not process a note before the final speech result arrives.
      onListening(true)
      begin()
    },
    stop({ discardPending = false } = {}) {
      wanted = false
      clearRestart()
      if (discardPending) {
        clearFinish()
        generation += 1
        detach(recognition)
        try { recognition?.abort() } catch {}
        recognition = null
        stopping = false
        onListening(false)
        onInterim("")
        return
      }
      if (stopping) return
      // stop(), unlike abort(), lets the browser return a final pending phrase.
      if (recognition) {
        stopping = true
        const instance = recognition, pendingGeneration = generation
        finishTimer = schedule(() => {
          finishTimer = null
          if (disposed || !stopping || generation !== pendingGeneration) return
          generation += 1
          detach(instance)
          try { instance.abort() } catch {}
          if (recognition === instance) recognition = null
          stopping = false
          onListening(false)
          onInterim("")
          onError("The browser took too long to finish dictation. Review the text before continuing.")
        }, 2500)
        try { recognition.stop() } catch {
          clearFinish()
          try { recognition.abort() } catch {}
          detach(recognition)
          recognition = null
          stopping = false
          onListening(false)
        }
      } else onListening(false)
      onInterim("")
    },
    dispose() {
      wanted = false
      disposed = true
      generation += 1
      clearRestart()
      clearFinish()
      detach(recognition)
      try { recognition?.abort() } catch {}
      recognition = null
    },
  }
}
