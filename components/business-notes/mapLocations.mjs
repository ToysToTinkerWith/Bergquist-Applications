export async function resolveAddress(geocoder, address) {
  try {
    const response = await geocoder.geocode({ address })
    const results = response.results || []
    // A partial or ambiguous match must remain an address, not a guessed pin.
    if (results.length !== 1 || results[0].partial_match) return { status: results.length ? "ambiguous" : "unresolved" }
    const result = results[0]
    const lat = result.geometry?.location?.lat(), lng = result.geometry?.location?.lng()
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return { status: "unresolved" }
    return {
      status: "resolved", position: { lat, lng }, formattedAddress: result.formatted_address || address,
      approximate: result.geometry?.location_type !== "ROOFTOP",
    }
  } catch { return { status: "unresolved" } }
}
