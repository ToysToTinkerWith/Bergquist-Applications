import { INTRO_QUESTION, INTRO_ANSWER } from "./assistantConversation"

export const DATA_SOURCES = [{ id: "traffic", label: "Website traffic", unit: "sessions" }]
export const SPACE_PRODUCTS = [
  { id: "scanner", name: "Orbital scanner", image: "/home/pioneer-products/orbital-scanner.webp", cents: 120000, cost: 62000 },
  { id: "helmet", name: "Pioneer EVA helmet", image: "/home/pioneer-products/eva-helmet.webp", cents: 240000, cost: 135000 },
  { id: "beacon", name: "Relay beacon", image: "/home/pioneer-products/relay-beacon.webp", cents: 320000, cost: 174000 },
]
export const ASSISTANT_QUESTIONS = [
  "What is Bergquist Applications?", "What are web components?",
  "How can I contact Bergquist Applications?", "Explain the technologies used in Bergquist Applications",
]
export const HARDWARE_ACTIONS = { data: ["trend", "bars", "table", "sync"], finance: [], ai: [] }
export const HARDWARE_LABELS = { data: ["TREND", "BAR", "TABLE", "REFRESH"], finance: [], ai: [] }

function initialData() {
  return { source: "traffic", view: "trend", rows: [], status: "loading", notice: "Connecting to Firebase Analytics...", generatedAt: null, limited: false }
}
function initialFinance() {
  return { view: "cashflow", period: "quarter", selected: "INV-105", history: [], notice: "Sample space-equipment sales / no real payments", invoices: [
    { id: "INV-101", product: "scanner", client: "Lunar Survey", quantity: 4, month: 0, cents: 480000, status: "matched" },
    { id: "INV-102", product: "helmet", client: "Pioneer Crew", quantity: 2, month: 0, cents: 480000, status: "matched" },
    { id: "INV-103", product: "beacon", client: "Outer Relay", quantity: 3, month: 1, cents: 960000, status: "paid" },
    { id: "INV-104", product: "scanner", client: "Mars Survey", quantity: 3, month: 1, cents: 360000, status: "paid" },
    { id: "INV-105", product: "helmet", client: "Pioneer Crew", quantity: 1, month: 2, cents: 240000, status: "pending" },
    { id: "INV-106", product: "beacon", client: "Outer Relay", quantity: 1, month: 2, cents: 320000, status: "pending" },
  ] }
}
function initialAI() { return { status: "idle", prompt: INTRO_QUESTION, answer: INTRO_ANSWER, error: "", route: null } }
export function createCockpitSystems() { return { data: initialData(), finance: initialFinance(), ai: initialAI() } }

export function dataSummary(data) {
  return { rows: data.rows, valid: data.rows, total: data.rows.reduce((sum, row) => sum + row.value, 0),
    pageViews: data.rows.reduce((sum, row) => sum + row.pageViews, 0), source: DATA_SOURCES[0] }
}
export function financeSummary(finance) {
  const months = [0, 1, 2].map(month => {
    const rows = finance.invoices.filter(row => row.month === month)
    const income = rows.filter(row => row.status !== "pending").reduce((sum, row) => sum + row.cents, 0)
    const expenses = rows.reduce((sum, row) => sum + SPACE_PRODUCTS.find(product => product.id === row.product).cost * row.quantity, 0)
    return { name: `Month ${month + 1}`, income, expenses, net: income - expenses }
  })
  const received = months.reduce((sum, row) => sum + row.income, 0), expenses = months.reduce((sum, row) => sum + row.expenses, 0)
  return { months, received, expenses, net: received - expenses,
    pending: finance.invoices.filter(row => row.status === "pending").reduce((sum, row) => sum + row.cents, 0),
    unmatched: finance.invoices.filter(row => row.status === "paid").length,
    matched: finance.invoices.filter(row => row.status === "matched").length,
    selected: finance.invoices.find(row => row.id === finance.selected) }
}
export function hardwareActionEnabled(systems, station, action) {
  if (station === "data") {
    if (action === "sync") return systems.data.status !== "loading"
    if (action === "export") return systems.data.rows.length > 0
  }
  if (station === "finance") {
    const summary = financeSummary(systems.finance)
    if (action === "receive") return summary.selected?.status === "pending"
    if (action === "reconcile") return summary.unmatched > 0
    if (action === "undo") return systems.finance.history.length > 0
  }
  return true
}
export function cockpitReducer(state, { station, type, value }) {
  if (!["data", "finance", "ai"].includes(station)) return state
  const current = state[station]
  let updated = current
  if (station === "data") {
    if (type === "view" && ["trend", "bars", "table"].includes(value)) updated = { ...current, view: value }
    if (["trend", "bars", "table"].includes(type)) updated = { ...current, view: type }
    if (type === "loading") updated = { ...current, status: "loading", notice: "Refreshing Firebase Analytics..." }
    if (type === "result") updated = { ...current, ...value, source: "traffic", status: "ready", notice: value.rows.length ? "Firebase Analytics / last 30 complete days" : "No website traffic reported for this period." }
    if (type === "error") updated = { ...current, status: "error", notice: value }
  }
  if (station === "finance") {
    if (type === "reset") updated = initialFinance()
    if (type === "select" && current.invoices.some(row => row.id === value)) updated = { ...current, selected: value }
    if (type === "receive" || type === "reconcile") {
      const summary = financeSummary(current)
      if (type === "receive" && summary.selected?.status !== "pending") return state
      if (type === "reconcile" && !summary.unmatched) return state
      updated = { ...current, history: [...current.history, { invoices: current.invoices, selected: current.selected }].slice(-20),
        invoices: current.invoices.map(row => type === "receive" && row.id === current.selected ? { ...row, status: "paid" }
          : type === "reconcile" && row.status === "paid" ? { ...row, status: "matched" } : row),
        notice: type === "receive" ? `${current.selected} payment recorded in sample ledger` : `${summary.unmatched} sample payments reconciled` }
    }
    if (type === "undo" && current.history.length) updated = { ...current, ...current.history[current.history.length - 1], history: current.history.slice(0, -1), notice: "Last ledger change undone" }
  }
  if (station === "ai" && type === "snapshot") updated = { ...current, ...value }
  return updated === current ? state : { ...state, [station]: updated }
}
export function exportCockpitData(state, station) {
  if (station === "data") return { name: "pioneer-website-traffic.csv", type: "text/csv", text: "date,sessions,page_views\n" + state.data.rows.map(row => `${row.id},${row.value},${row.pageViews}`).join("\n") }
  if (station === "finance") return { name: "pioneer-sample-quarter.csv", type: "text/csv", text: "invoice,product,quantity,amount_usd,status\n" + state.finance.invoices.map(row => `${row.id},${row.product},${row.quantity},${(row.cents / 100).toFixed(2)},${row.status}`).join("\n") }
  return { name: "pioneer-ai-answer.txt", type: "text/plain", text: state.ai.answer }
}
