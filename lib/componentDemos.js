import { addDays, format, startOfDay } from "date-fns"

export const DEMO_PRODUCTS = [
  { id: "scanner", name: "Orbital scanner", category: "Navigation", cents: 120000, stock: 8, image: "/home/pioneer-products/orbital-scanner.webp", description: "Compact terrain mapping for the next expedition." },
  { id: "helmet", name: "Pioneer EVA helmet", category: "Equipment", cents: 240000, stock: 5, image: "/home/pioneer-products/eva-helmet.webp", description: "A wide-view visor with integrated communications." },
  { id: "beacon", name: "Relay beacon", category: "Navigation", cents: 320000, stock: 12, image: "/home/pioneer-products/relay-beacon.webp", description: "A portable communications link for remote teams." },
]
export const money = cents => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100)
export function makeSalesRows(days = 90, now = new Date()) {
  const end = startOfDay(now)
  return Array.from({ length: days }, (_, index) => {
    const day = addDays(end, index - days + 1), seed = Math.floor(day.getTime() / 86400000)
    return DEMO_PRODUCTS.map((product, p) => {
      const units = ((seed * (p + 3) + p * 7) % 11 + 11) % 11
      return { date: format(day, "yyyy-MM-dd"), product: product.id, name: product.name, units, revenue: units * product.cents }
    })
  }).flat()
}
export function summarizeSales(rows) {
  return rows.reduce((total, row) => ({ units: total.units + row.units, revenue: total.revenue + row.revenue }), { units: 0, revenue: 0 })
}
export function cartTotals(cart) {
  const items = DEMO_PRODUCTS.map(product => ({ ...product, quantity: Math.max(0, Math.min(product.stock, Math.floor(Number(cart[product.id]) || 0))) })).filter(item => item.quantity > 0)
  const subtotal = items.reduce((sum, item) => sum + item.cents * item.quantity, 0)
  return { items, count: items.reduce((sum, item) => sum + item.quantity, 0), subtotal, shipping: 0, total: subtotal }
}
export function makeCalendarEvents(now = new Date()) {
  return [
    [0, 10, "Project discovery", "Meeting", "Goals, priorities, and the first prototype."],
    [1, 14, "Prototype review", "Review", "Review the booking flow and collect feedback."],
    [3, 9, "Design handoff", "Milestone", "Approve the visual direction and component selection."],
    [6, 11, "Launch checklist", "Review", "Accessibility, mobile, and content checks."],
  ].map(([offset, hour, title, category, notes], index) => {
    const start = addDays(startOfDay(now), offset); start.setHours(hour)
    const end = new Date(start.getTime() + 3600000)
    return { id: `sample-${index}`, title, category, notes, start: format(start, "yyyy-MM-dd'T'HH:mm"), end: format(end, "yyyy-MM-dd'T'HH:mm"), allDay: false }
  })
}
export function eventIsValid(event) {
  return Boolean(event && typeof event.id === "string" && event.id && typeof event.title === "string" && event.title.trim() && event.title.length <= 100 && typeof event.start === "string" && typeof event.end === "string" && typeof event.notes === "string" && typeof event.allDay === "boolean" && ["Meeting", "Review", "Milestone"].includes(event.category) && Number.isFinite(Date.parse(event.start)) && Date.parse(event.end) > Date.parse(event.start))
}
export function overlaps(a, b) { return a.id !== b.id && Date.parse(a.start) < Date.parse(b.end) && Date.parse(a.end) > Date.parse(b.start) }
export function csvText(headers, rows) {
  const cell = value => {
    let text = String(value ?? "")
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`
    return `"${text.replace(/"/g, '""')}"`
  }
  return [headers, ...rows].map(row => row.map(cell).join(",")).join("\r\n")
}
export function downloadFile(filename, content, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type })), link = document.createElement("a")
  link.href = url; link.download = filename; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function calendarText(events) {
  const escape = text => String(text || "").replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
  const utc = value => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const date = value => String(value).slice(0, 10).replace(/-/g, "")
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bergquist Applications//Scheduler Demo//EN", ...events.flatMap(event => [
    "BEGIN:VEVENT", `UID:${escape(event.id)}@bergquist-demo`, `DTSTAMP:${utc(new Date())}`,
    event.allDay ? `DTSTART;VALUE=DATE:${date(event.start)}` : `DTSTART:${utc(event.start)}`,
    event.allDay ? `DTEND;VALUE=DATE:${date(event.end)}` : `DTEND:${utc(event.end)}`,
    `SUMMARY:${escape(event.title)}`, `DESCRIPTION:${escape(event.notes)}`, "END:VEVENT",
  ]), "END:VCALENDAR"]
  // Calendar content lines are folded by UTF-8 octet count, not character count.
  return lines.map(line => {
    const chunks = []; let chunk = "", bytes = 0
    for (const character of line) {
      const size = new TextEncoder().encode(character).length
      if (bytes + size > 74) { chunks.push(chunk); chunk = " "; bytes = 1 }
      chunk += character; bytes += size
    }
    return [...chunks, chunk].join("\r\n")
  }).join("\r\n") + "\r\n"
}
