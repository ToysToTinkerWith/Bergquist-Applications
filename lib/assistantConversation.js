export const MAX_ASSISTANT_PROMPT = 6000
export function assistantLinkLabel(route) {
  const labels = {
    "/": "Visit the home page to explore what we can build",
    "/contact": "Visit the contact page to get started",
    "/about": "Visit the about page to meet your developer",
    "/components": "Explore website features on the components page",
    "/applications": "Visit the projects page to see examples of our work",
    "/applications/upgrade-aprons": "Explore the Upgrade Aprons website project",
  }
  if (labels[route.href]) return labels[route.href]
  if (route.href.startsWith("/components/")) return `Try ${route.label} in the interactive demo`
  if (route.href.startsWith("/applications/")) return `Explore the ${route.label} project`
  return `Visit the ${route.label} page to learn more`
}
export const INTRO_QUESTION = "What are web components?"
export const INTRO_ANSWER = "Web components are the useful building blocks of a website, like a booking calendar, a payment button, or a contact form.\n\nWe tailor these pieces to your business so customers can get things done easily and your team saves time."
export function introductoryHistory() {
  return [{ role: "user", content: INTRO_QUESTION }, { role: "assistant", content: INTRO_ANSWER }]
}

export function normalizeConversationHistory(value) {
  if (!Array.isArray(value)) return []
  let remaining = 18000
  return value
    .filter(entry => ["user", "assistant"].includes(entry?.role) && typeof entry.content === "string")
    .slice(-12)
    .reverse()
    .map(entry => {
      const content = entry.content.trim().slice(0, Math.min(4000, remaining))
      remaining -= content.length
      return { role: entry.role, content }
    })
    .filter(entry => entry.content)
    .reverse()
}

export function safeAssistantRoute(route) {
  if (typeof route?.href !== "string" || typeof route?.label !== "string") return null
  if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/?)*$/.test(route.href)) return null
  if (/^\/(?:services|whidbey-island-web-design)(?:\/|$)/.test(route.href)) return null
  const label = route.label.trim().slice(0, 100)
  return label ? { href: route.href, label } : null
}
