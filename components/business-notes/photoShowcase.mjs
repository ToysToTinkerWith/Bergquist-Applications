export const SHOWCASE_NOTE = "[EXAMPLE SHOWCASE] This is a fictional deck-refresh workflow demonstration for Bergquist Applications. Both attached photos are AI-generated examples, not a real customer's property or a real completed job. In this fictional scenario the deck cleaning and natural cedar refinishing job is completed. The before photo shows weathered boards, moss staining, and leaves. The after concept shows cleaned, refinished surfaces. Create one completed example job and a Facebook social-post draft promoting what the Bergquist Applications notebook can do: turn job notes and original progress photos into a branded before/after collage and a short video compilation. Link BOTH original photos to the job and the social draft. Clearly say 'Example showcase — AI-generated photos, not a real job' in the post. Do not imply Bergquist Applications performed deck services. No customer, address, date, price, or testimonial is provided. Use the original uploaded photos in the collage and video, not newly generated replacement scenes."
export const SHOWCASE_PHOTOS = [
  { path: "/showcase/deck-refresh/example-before.png", name: "example-before-ai-generated.png", caption: "BEFORE — AI-generated example deck, weathered boards and moss staining. Workflow showcase, not a real job." },
  { path: "/showcase/deck-refresh/example-after.png", name: "example-after-ai-generated.png", caption: "AFTER CONCEPT — Matching AI-generated example deck, cleaned and refinished look. Workflow showcase, not a real job." },
]
export function labelShowcase(note) {
  if (!note.text.includes("[EXAMPLE SHOWCASE]")) return note
  const title = value => /^EXAMPLE\s*[—:-]/i.test(value) ? value : ("EXAMPLE — " + value).slice(0, 160)
  return { ...note, title: title(note.title), items: note.items.map(item => ({ ...item, title: title(item.title) })) }
}
