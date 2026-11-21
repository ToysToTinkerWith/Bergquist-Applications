import test from "node:test"
import assert from "node:assert/strict"
import { createDictationController } from "../components/business-notes/dictationController.mjs"

function fixture() {
  const sessions = [], final = [], errors = [], listening = [], timers = new Map()
  let timerId = 0
  const controller = createDictationController({
    createRecognition: () => {
      const session = { start() { this.onstart?.() }, stop() { this.stopped = true }, abort() { this.aborted = true } }
      sessions.push(session)
      return session
    },
    onFinal: value => final.push(value),
    onError: value => errors.push(value),
    onListening: value => listening.push(value),
    schedule: callback => { timers.set(++timerId, callback); return timerId },
    unschedule: id => timers.delete(id),
  })
  return { controller, sessions, final, errors, listening, timers, runTimer() { const [id, fn] = timers.entries().next().value; timers.delete(id); fn() } }
}

const result = (text, isFinal = true) => Object.assign([{ transcript: text }], { isFinal })

test("dictation delivers finalized speech once and preserves a final phrase after Stop", () => {
  const f = fixture()
  assert.equal(f.sessions.length, 0, "does not request a microphone before Start")
  f.controller.start()
  const first = f.sessions[0]
  first.onresult({ resultIndex: 0, results: [result("Call Alex"), result("tomorrow", false)] })
  first.onresult({ resultIndex: 0, results: [result("Call Alex"), result("tomorrow", false)] })
  assert.deepEqual(f.final, ["Call Alex"])
  f.controller.stop()
  assert.equal(first.stopped, true)
  assert.equal(first.aborted, undefined, "Stop asks for a final phrase rather than discarding it")
  assert.equal(f.listening.at(-1), true, "keeps processing disabled until pending finalization ends")
  first.onresult({ resultIndex: 1, results: [result("Call Alex"), result("tomorrow at noon")] })
  first.onend()
  assert.deepEqual(f.final, ["Call Alex", "tomorrow at noon"])
  assert.equal(f.timers.size, 0)
  assert.equal(f.listening.at(-1), false)
})

test("switching or clearing a composer discards late speech from the prior note", () => {
  const f = fixture()
  f.controller.start()
  const first = f.sessions[0], lateResult = first.onresult
  f.controller.stop({ discardPending: true })
  assert.equal(first.aborted, true)
  lateResult({ resultIndex: 0, results: [result("Old note speech")] })
  assert.deepEqual(f.final, [])
  assert.equal(f.listening.at(-1), false)
  f.controller.start()
  f.sessions[1].onresult({ resultIndex: 0, results: [result("New note speech")] })
  assert.deepEqual(f.final, ["New note speech"])
})

test("permission failure never restarts a microphone session", () => {
  const f = fixture()
  f.controller.start()
  f.sessions[0].onerror({ error: "not-allowed" })
  f.sessions[0].onend?.()
  assert.match(f.errors.at(-1), /denied/)
  assert.equal(f.timers.size, 0)
  assert.equal(f.listening.at(-1), false)
})

test("a browser that never ends a stopped session cannot block processing or append later", () => {
  const f = fixture()
  f.controller.start()
  const session = f.sessions[0], staleResult = session.onresult
  f.controller.stop()
  assert.equal(f.listening.at(-1), true)
  f.runTimer()
  assert.equal(f.listening.at(-1), false)
  assert.match(f.errors.at(-1), /too long/)
  staleResult({ resultIndex: 0, results: [result("Too late")] })
  assert.deepEqual(f.final, [])
})

test("empty automatic restarts are bounded and disposal cancels pending work", () => {
  const f = fixture()
  f.controller.start()
  for (let i = 0; i < 3; i += 1) {
    f.sessions.at(-1).onend()
    assert.equal(f.listening.at(-1), true, "does not enable processing during a reconnect")
    f.runTimer()
  }
  f.sessions.at(-1).onend()
  assert.equal(f.sessions.length, 4)
  assert.equal(f.timers.size, 0)
  assert.match(f.errors.at(-1), /paused/)
  f.controller.start()
  const session = f.sessions.at(-1), staleResult = session.onresult
  session.onend()
  assert.equal(f.timers.size, 1)
  f.controller.dispose()
  assert.equal(f.timers.size, 0)
  staleResult({ resultIndex: 0, results: [result("Should not append")] })
  assert.deepEqual(f.final, [])
})
