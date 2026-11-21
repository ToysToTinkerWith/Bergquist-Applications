// Versioned together so every page picks up the latest complete, padded captures.
const businessPreviews = ["quote-builder", "appointment-booking", "customer-portal", "inquiry-pipeline", "service-configurator", "document-intake"]
export const componentPreview = key => key === "restaurant-ordering" ? "/work/italiana-ordering-20261020.webp" : businessPreviews.includes(key) ? `/work/business-demos/${key}.webp?v=20261030-visual` : `/home/lunar-museum/previews/optimized/${key === "interactive-design" ? "pioneer-flight-deck" : key}.webp?v=20260925-framed`
