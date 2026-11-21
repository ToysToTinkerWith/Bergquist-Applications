export async function readAssistantResponse(response, onAnswer) {
  if (!response.ok || !response.headers.get("content-type")?.includes("application/x-ndjson")) {
    const payload = await response.json()
    if (!response.ok) throw new Error(response.status < 500 && payload?.error
      ? payload.error : "The assistant is temporarily unavailable. Please try again.")
    return payload
  }
  const reader = response.body.getReader(), decoder = new TextDecoder()
  let buffer = "", partialAnswer = "", payload
  const consume = line => {
    if (!line.trim()) return
    const event = JSON.parse(line)
    if (event.type === "error") throw new Error(event.error)
    if (event.type === "answer") {
      if (typeof event.answer === "string") partialAnswer = event.answer
      else if (typeof event.delta === "string") partialAnswer += event.delta
      onAnswer(partialAnswer)
    }
    if (event.type === "done") payload = event.payload
  }
  // Keep the read loop outside try/finally: Next 12's ES5 transform otherwise
  // runs cleanup at the loop's back edge and releases the reader too early.
  const drain = async () => {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      let newline
      while ((newline = buffer.indexOf("\n")) !== -1) {
        consume(buffer.slice(0, newline)); buffer = buffer.slice(newline + 1)
      }
      if (done) break
    }
    consume(buffer)
    if (!payload) throw new Error("The answer was interrupted. Please try again.")
    return payload
  }
  try {
    return await drain()
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
