export const ASSET_ROOT = "/home/identity-astronaut/"
export const SHIP_ROOT = "/home/identity-spacecraft/"
export const CHARACTER_ANIMATIONS = ["Idle", "Wave", "Walk", "Float"]
export const SHIP_ANIMATIONS = ["Cruise", "Landing", "Cockpit"]

export const CREWS = [
  { id: "eva", name: "Pioneer", pilot: "Pioneer EVA", ship: "Pioneer 01", asset: "astronaut.glb",
    spacecraft: "pioneer.glb", shipScale: 0.58, cockpit: [0, 1.45, 1.1],
    missionAsset: "astronaut-mission.glb", missionSpacecraft: "pioneer-mission.glb",
    description: "Pioneer EVA astronaut beside the larger Pioneer 01 orbital courier, with ivory ceramic panels, a black cockpit canopy, twin engines, and landing gear, lit by sunlight and an Earth-blue rim." },
  { id: "surveyor", name: "Aster", pilot: "Aster Survey EVA", ship: "Surveyor 02", asset: "surveyor.glb",
    spacecraft: "surveyor.glb", shipScale: 0.61, cockpit: [0, 1.435, 1.1],
    missionAsset: "surveyor-mission.glb", missionSpacecraft: "surveyor-mission.glb",
    description: "Tall, lean Aster survey astronaut in teal and coral, with a wrist scanner, sample vials and communications mast, beside the matching Surveyor 02 lander with four thruster pods, radar dish and sampling arm." },
  { id: "salvager", name: "Rivet", pilot: "Rivet Repair EVA", ship: "Forge 03", asset: "salvager.glb",
    spacecraft: "salvager.glb", shipScale: 0.60, cockpit: [0, 1.60, -.9],
    missionAsset: "salvager-mission.glb", missionSpacecraft: "salvager-mission.glb",
    description: "Compact, broad-chested Rivet repair astronaut in crimson and safety yellow, with magnetic boots, an arm-assist brace, tether reel and triple helmet lamps, beside the matching Forge 03 recovery tug with open docking forks, a towing winch and repair boom." },
]
