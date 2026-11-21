export const CREATIVE_MODES = Object.freeze(["promo-image", "promo-video", "comparison"])
export const CREATIVE_FORMATS = Object.freeze({ square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920] })
export const DEFAULT_BRAND = Object.freeze({ name: "Bergquist Applications", website: "bergquistapplications.com", accent: "#b293ee" })
const validId = value => typeof value === "string" && /^[a-zA-Z0-9_-]{1,80}$/.test(value)
const text = (value, max, required = false) => {
  if (typeof value !== "string" || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) || (required && !value.trim())) throw new TypeError("A creative field is missing or too long.")
  return value.trim()
}
export function normalizeCreativeInput(value) {
  if (!value || !CREATIVE_MODES.includes(value.mode) || !Object.hasOwn(CREATIVE_FORMATS, value.format)) throw new TypeError("Choose a valid creative mode and format.")
  if (!validId(value.noteId) || !Array.isArray(value.photoIds) || !value.photoIds.length || value.photoIds.length > 6 || value.photoIds.some(id => !validId(id)) || new Set(value.photoIds).size !== value.photoIds.length) throw new TypeError("Choose one to six original photos.")
  if (value.mode === "comparison" && value.photoIds.length !== 2) throw new TypeError("Choose exactly two photos, Before then After, for a comparison.")
  if (![12, 18].includes(value.duration)) throw new TypeError("Choose a supported video length.")
  if (!["professional", "warm", "bold", "minimal"].includes(value.tone)) throw new TypeError("Choose a valid tone.")
  if (!["Facebook", "Instagram", "LinkedIn"].includes(value.platform)) throw new TypeError("Choose a valid social platform.")
  const brand = value.brand || DEFAULT_BRAND
  if (typeof brand.accent !== "string" || !/^#[a-fA-F0-9]{6}$/.test(brand.accent)) throw new TypeError("Choose a valid brand color.")
  const website = text(brand.website || "", 100)
  if (website && !/^(https?:\/\/)?[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/[^\s?#]*)?$/i.test(website)) throw new TypeError("Use a website address without tracking parameters.")
  return { noteId: value.noteId, mode: value.mode, format: value.format, duration: value.duration, photoIds: value.photoIds, tone: value.tone, platform: value.platform, brief: text(value.brief || "", 2000), audience: text(value.audience || "", 180), brand: { name: text(brand.name, 70, true), website, accent: brand.accent } }
}
const string = { type: "string" }
export const creativePlanSchema = {
  type: "object", additionalProperties: false,
  properties: { headline: string, subheadline: string, eyebrow: string, callToAction: string, caption: string, layout: { type: "string", enum: ["hero", "split", "comparison"] }, theme: { type: "string", enum: ["paper", "ink"] }, heroPhotoId: string, photoOrder: { type: "array", items: string }, scenes: { type: "array", items: { type: "object", additionalProperties: false, properties: { photoId: string, headline: string, subheadline: string, label: string }, required: ["photoId", "headline", "subheadline", "label"] } }, rationale: string, cautions: { type: "array", items: string } },
  required: ["headline", "subheadline", "eyebrow", "callToAction", "caption", "layout", "theme", "heroPhotoId", "photoOrder", "scenes", "rationale", "cautions"],
}
export function normalizeCreativePlan(raw, input, example = false) {
  if (!raw || !["hero", "split", "comparison"].includes(raw.layout) || !["paper", "ink"].includes(raw.theme) || !input.photoIds.includes(raw.heroPhotoId)) throw new TypeError("The AI creative did not reference a selected photo.")
  if (!Array.isArray(raw.photoOrder) || !raw.photoOrder.length || raw.photoOrder.length > 6 || raw.photoOrder.some(id => !input.photoIds.includes(id)) || new Set(raw.photoOrder).size !== raw.photoOrder.length) throw new TypeError("The AI photo sequence is invalid.")
  if (!Array.isArray(raw.scenes) || raw.scenes.length < 3 || raw.scenes.length > 5 || raw.scenes.some(scene => !input.photoIds.includes(scene.photoId))) throw new TypeError("The AI storyboard is invalid.")
  if (!Array.isArray(raw.cautions) || raw.cautions.length > 5) throw new TypeError("The AI review notes are invalid.")
  const result = { headline: text(raw.headline, 70, true), subheadline: text(raw.subheadline, 150), eyebrow: text(raw.eyebrow, 30), callToAction: text(raw.callToAction, 42, true), caption: text(raw.caption, 2500, true), layout: input.mode === "comparison" ? "comparison" : raw.layout === "comparison" ? "split" : raw.layout, theme: raw.theme, heroPhotoId: raw.heroPhotoId, photoOrder: raw.photoOrder, scenes: raw.scenes.map(scene => ({ photoId: scene.photoId, headline: text(scene.headline, 65, true), subheadline: text(scene.subheadline, 120), label: text(scene.label, 28) })), rationale: text(raw.rationale, 500), cautions: raw.cautions.map(caution => text(caution, 240, true)) }
  if (example && !/^Example showcase — AI-generated photos, not a real job\./i.test(result.caption)) result.caption = "Example showcase — AI-generated photos, not a real job.\n\n" + result.caption
  return result
}
