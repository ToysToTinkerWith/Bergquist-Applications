export function museumParentView(category, key) {
  return key ? { category, key: "" } : { category: "all", key: "" }
}

export function museumClickView(category, key, hit) {
  if (key) return hit?.key === key ? { category, key } : museumParentView(category, key)
  if (category === "all") return { category: hit?.category || "all", key: "" }
  if (hit?.category === category) return { category, key: hit.key || "" }
  return museumParentView(category, key)
}
