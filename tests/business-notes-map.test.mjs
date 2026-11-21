import test from "node:test"
import assert from "node:assert/strict"
import { resolveAddress } from "../components/business-notes/mapLocations.mjs"

const match = (lat = 48.2, lng = -122.5) => ({ formatted_address: "A verified address", geometry: { location: { lat: () => lat, lng: () => lng }, location_type: "ROOFTOP" } })
const geocoder = results => ({ geocode: async () => ({ results }) })

test("only one complete geocoding match can become a map point", async () => {
  assert.deepEqual(await resolveAddress(geocoder([]), "Unknown"), { status: "unresolved" })
  assert.deepEqual(await resolveAddress(geocoder([match(), match()]), "Ambiguous"), { status: "ambiguous" })
  assert.deepEqual(await resolveAddress(geocoder([{ ...match(), partial_match: true }]), "Incomplete"), { status: "ambiguous" })
  assert.deepEqual(await resolveAddress(geocoder([match(NaN, -122.5)]), "Bad coordinates"), { status: "unresolved" })
  assert.deepEqual(await resolveAddress(geocoder([match(100, -122.5)]), "Out of bounds"), { status: "unresolved" })
})

test("successful coordinates come from the geocoder and service failure remains unplaced", async () => {
  let received
  const result = await resolveAddress({ geocode: async request => { received = request; return { results: [match()] } } }, "The address from the note")
  assert.deepEqual(received, { address: "The address from the note" })
  assert.deepEqual(result, { status: "resolved", position: { lat: 48.2, lng: -122.5 }, formattedAddress: "A verified address", approximate: false })
  assert.deepEqual(await resolveAddress({ geocode: async () => { throw new Error("Unavailable") } }, "Any address"), { status: "unresolved" })
})
