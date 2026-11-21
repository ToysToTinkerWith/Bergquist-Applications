export const projectTypes = Object.freeze([
  "A new website", "An application", "Web components", "An existing website", "Let's explore",
])

export const CONTACT_FIELD_LIMITS = Object.freeze({ name: 100, email: 200, company: 120, message: 1200 })

const singleLineControls = /[\x00-\x1f\x7f\u2028\u2029]/

export function isContactEmail(value) {
  if (typeof value !== "string" || value.length > 200 || singleLineControls.test(value)) return false
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(value)
    && !value.startsWith(".") && !value.includes("..") && !value.includes(".@")
}

export function validateContactSubmission(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Please provide the contact form fields." }
  if (body.website !== undefined && body.website !== "") return { error: "The contact submission was rejected." }
  const fields = {}
  for (const [key, limit] of Object.entries(CONTACT_FIELD_LIMITS)) {
    const value = body[key] === undefined && key === "company" ? "" : body[key]
    if (typeof value !== "string" || value.length > limit) return { error: `Please check ${key} (maximum ${limit} characters).` }
    if (key !== "message" && singleLineControls.test(value)) return { error: `Please enter a single line for ${key}.` }
    if (key === "message" && /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) return { error: "Please remove control characters from your message." }
    fields[key] = value.trim()
    if (key !== "company" && !fields[key]) return { error: `Please enter your ${key}.` }
  }
  if (!isContactEmail(fields.email)) return { error: "Please enter a valid email address." }
  if (!projectTypes.includes(body.project)) return { error: "Please select a project type." }
  fields.project = body.project
  return { fields }
}

export function formatContactSubmission(fields) {
  return {
    subject: `Project inquiry: ${fields.project}`,
    text: [
      `Name: ${fields.name}`, `Email: ${fields.email}`, `Business: ${fields.company || "(not provided)"}`,
      `Project: ${fields.project}`, "", "Message:", fields.message,
    ].join("\n"),
  }
}
