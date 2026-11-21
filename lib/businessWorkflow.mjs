export const WORKFLOW_KEY = "bergquist-business-workflow-v1"
export const services = [
  { id: "deck", name: "Deck care", rate: 350, unit: "100 sq ft" },
  { id: "exterior", name: "Exterior wash", rate: 220, unit: "100 sq ft" },
  { id: "garden", name: "Garden refresh", rate: 180, unit: "100 sq ft" },
]
export const extras = [{ id: "haul", name: "Debris removal", cents: 7500 }, { id: "report", name: "Photo condition report", cents: 3500 }]
export const money = cents => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(cents / 100)
export const steps = ["Scheduled", "Work in progress", "Ready for approval", "Complete"]
export const freshWorkflow = () => ({ version: 1, config: { service: "deck", size: 200, extras: [] }, request: null, quote: "draft", booking: null, progress: 0, approved: false, paid: false, owner: "Unassigned", note: "", documents: [] })
export function validConfig(c) {
  return c && services.some(s => s.id === c.service) && Number.isInteger(c.size) && c.size >= 100 && c.size <= 2000 && Array.isArray(c.extras) && new Set(c.extras).size === c.extras.length && c.extras.every(id => extras.some(e => e.id === id))
}
export function estimate(c) {
  if (!validConfig(c)) return 0
  return services.find(s => s.id === c.service).rate * c.size + extras.filter(e => c.extras.includes(e.id)).reduce((sum, e) => sum + e.cents, 0)
}
export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
export function appointmentDates(now = new Date()) {
  const dates = []
  for (let offset = 1; offset <= 30; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12)
    if (day.getDay() !== 0 && day.getDay() !== 6) dates.push(dateKey(day))
  }
  return dates
}
export function availableTimes(date, now = new Date()) { return appointmentDates(now).includes(date) ? ["09:00", "13:00", "15:00"] : [] }
export function validWorkflow(s) {
  return s?.version === 1 && validConfig(s.config) && (s.request === null || (typeof s.request?.name === "string" && s.request.name.trim().length > 0 && s.request.name.length <= 80 && typeof s.request.notes === "string" && s.request.notes.length <= 600 && validConfig(s.request.config)))
    && ["draft", "sent", "accepted"].includes(s.quote) && (s.quote === "draft" || s.request !== null)
    && (s.booking === null || (s.request !== null && /^\d{4}-\d{2}-\d{2}$/.test(s.booking?.date) && ["09:00", "13:00", "15:00"].includes(s.booking.time)))
    && Number.isInteger(s.progress) && s.progress >= 0 && s.progress <= 3 && (s.progress === 0 || s.booking !== null)
    && typeof s.approved === "boolean" && (!s.approved || (s.progress === 3 && s.booking !== null)) && (s.progress !== 3 || s.approved)
    && typeof s.paid === "boolean" && (!s.paid || s.approved) && ["Unassigned", "Alex", "Morgan"].includes(s.owner) && typeof s.note === "string" && s.note.length <= 600
    && Array.isArray(s.documents) && s.documents.length <= 3 && s.documents.every(d => d && typeof d.id === "string" && typeof d.name === "string" && d.name.length <= 120 && ["Site photo", "Project brief", "Access details"].includes(d.kind) && ["Pending review", "Approved", "Replacement requested"].includes(d.status) && (!d.preview || (typeof d.preview === "string" && d.preview.startsWith("data:image/jpeg;base64,") && d.preview.length < 400000)))
}
export function workflowStatus(s) {
  if (s.paid) return "Paid (demo)"
  if (s.approved) return "Complete"
  if (s.booking) return steps[s.progress]
  if (s.quote === "accepted") return "Ready to book"
  if (s.quote === "sent") return "Quote sent"
  return s.request ? "New inquiry" : "No request yet"
}
// Every state transition is checked here so browser reloads and alternate views follow the same rules.
export function transition(state, action, now = new Date()) {
  let next = state
  switch (action.type) {
    case "reset": return freshWorkflow()
    case "configure": if (validConfig(action.config)) next = { ...state, config: action.config }; break
    case "submit":
      if (!action.name?.trim() || action.name.length > 80 || typeof action.notes !== "string" || action.notes.length > 600) break
      next = { ...freshWorkflow(), config: state.config, request: { name: action.name.trim(), notes: action.notes.trim(), config: { ...state.config, extras: [...state.config.extras] } }, documents: state.request ? [] : state.documents }; break
    case "sendQuote": if (state.request && !state.booking && state.quote === "draft") next = { ...state, quote: "sent" }; break
    case "acceptQuote": if (state.quote === "sent") next = { ...state, quote: "accepted" }; break
    case "book":
      if (!availableTimes(action.date, now).includes(action.time) || state.progress > 0 || (state.quote === "sent")) break
      next = { ...state, request: state.request || { name: action.name?.trim() || "Sample customer", notes: "Consultation booked online", config: state.config }, booking: { date: action.date, time: action.time } }; break
    case "cancelBooking": if (state.booking && state.progress === 0) next = { ...state, booking: null }; break
    case "advance": if (state.booking && state.progress < 2) next = { ...state, progress: state.progress + 1 }; break
    case "approveWork": if (state.progress === 2) next = { ...state, progress: 3, approved: true }; break
    case "pay": if (state.approved && !state.paid) next = { ...state, paid: true }; break
    case "assign": if (["Unassigned", "Alex", "Morgan"].includes(action.owner)) next = { ...state, owner: action.owner }; break
    case "note": if (typeof action.note === "string" && action.note.length <= 600) next = { ...state, note: action.note }; break
    case "attach": if (state.documents.length < 3) next = { ...state, documents: [...state.documents, action.document] }; break
    case "reviewDocument": next = { ...state, documents: state.documents.map(d => d.id === action.id ? { ...d, status: action.status } : d) }; break
    case "removeDocument": next = { ...state, documents: state.documents.filter(d => d.id !== action.id) }; break
  }
  return validWorkflow(next) ? next : state
}
