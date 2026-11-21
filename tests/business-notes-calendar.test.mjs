import test from "node:test"
import assert from "node:assert/strict"
import { noteInstant, noteCalendarEvent, noteDisplayDate } from "../lib/businessNotesCalendar.mjs"

const event = { id: "n-item-1", kind: "event", title: "Project visit", date: "2026-11-10", time: "10:00", endDate: null, endTime: null, timeZone: "America/Los_Angeles", status: "open" }
test("timed notes become instants in their original zone instead of the viewer's zone", () => {
  assert.equal(noteInstant(event.date, event.time, event.timeZone), "2026-11-10T18:00:00.000Z")
  assert.equal(noteCalendarEvent(event).start, "2026-11-10T18:00:00.000Z")
  assert.equal(noteDisplayDate(event).toISOString(), "2026-11-10T18:00:00.000Z")
})
test("all-day multi-day events retain the last included day", () => {
  assert.deepEqual(noteCalendarEvent({ ...event, time: null, endDate: "2026-11-12" }), { id: event.id, title: event.title, start: "2026-11-10", end: "2026-11-13", allDay: true })
  assert.equal(noteCalendarEvent({ ...event, time: null, endDate: "2026-12-31" }).end, "2027-01-01")
})
test("missing dates, completed items, expenses and nonexistent DST times never become false calendar entries", () => {
  assert.equal(noteCalendarEvent({ ...event, date: null }), null)
  assert.equal(noteCalendarEvent({ ...event, status: "done" }), null)
  assert.equal(noteCalendarEvent({ ...event, kind: "expense" }), null)
  assert.equal(noteCalendarEvent({ ...event, date: "2026-03-08", time: "02:30" }), null)
  assert.equal(noteCalendarEvent({ ...event, timeZone: "not-a-zone" }), null)
})

test("dated active jobs appear in the calendar in their captured timezone", () => {
  for (const stage of [null, "new", "planned", "in-progress"]) {
    const item = { ...event, kind: "job", stage }
    assert.equal(noteCalendarEvent(item).start, "2026-11-10T18:00:00.000Z")
  }
  assert.equal(noteCalendarEvent({ ...event, kind: "job", time: null, endDate: "2026-11-12", stage: "planned" }).end, "2026-11-13")
})

test("completed or unscheduled jobs never create pending calendar entries", () => {
  assert.equal(noteCalendarEvent({ ...event, kind: "job", stage: "completed" }), null)
  assert.equal(noteCalendarEvent({ ...event, kind: "job", stage: "in-progress", status: "done" }), null)
  assert.equal(noteCalendarEvent({ ...event, kind: "job", stage: "new", date: null }), null)
})

test("social drafts never enter the scheduler, even when they contain dates or are reviewed", () => {
  for (const status of ["open", "done"]) {
    assert.equal(noteCalendarEvent({ ...event, kind: "social", platform: "LinkedIn", postText: "A project update", status }), null)
  }
  assert.equal(noteCalendarEvent({ ...event, kind: "unknown" }), null)
})

test("events, dated tasks and follow-ups keep their existing calendar behavior", () => {
  for (const kind of ["event", "task", "followup"]) {
    assert.equal(noteCalendarEvent({ ...event, kind }).start, "2026-11-10T18:00:00.000Z")
    assert.equal(noteCalendarEvent({ ...event, kind, status: "done" }), null)
  }
})
