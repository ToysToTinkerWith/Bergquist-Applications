const dayAfter = date => new Date(Date.parse(date + "T12:00:00Z") + 86400000).toISOString().slice(0, 10)
const scheduledKinds = new Set(["event", "task", "followup", "job"])

export function noteInstant(date, time, timeZone) {
  if (!date || !time) return null
  const wall = Date.parse(date + "T" + time + ":00Z")
  if (!Number.isFinite(wall)) return null
  let instant = wall
  try {
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
    const represent = value => {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(value)).map(part => [part.type, part.value]))
      return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second))
    }
    for (let i = 0; i < 4; i++) { const correction = wall - represent(instant); if (!correction) break; instant += correction }
    // A nonexistent wall time during a DST jump must be clarified, not shifted.
    return represent(instant) === wall ? new Date(instant).toISOString() : null
  } catch { return null }
}

export function noteCalendarEvent(item) {
  if (!item.date || !scheduledKinds.has(item.kind) || item.status === "done" || (item.kind === "job" && item.stage === "completed")) return null
  const start = item.time ? noteInstant(item.date, item.time, item.timeZone) : item.date
  if (!start) return null
  const end = item.time && item.endTime ? noteInstant(item.endDate || item.date, item.endTime, item.timeZone)
    : !item.time && item.endDate ? dayAfter(item.endDate) : undefined
  if (item.time && item.endTime && !end) return null
  return { id: item.id, title: item.title, start, ...(end ? { end } : {}), allDay: !item.time }
}

export function noteDisplayDate(item) {
  const instant = item.time ? noteInstant(item.date, item.time, item.timeZone) : null
  return instant ? new Date(instant) : item.date ? new Date(item.date + "T12:00:00") : null
}

export function noteDisplayTime(item) {
  const instant = item.time ? noteInstant(item.date, item.time, item.timeZone) : null
  return instant ? new Date(instant).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : ""
}
