import React, { useState } from "react"
import dynamic from "next/dynamic"
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material"
import { CREWS } from "./space/flightCrews"

const Loading = () => <Box sx={{ height: 600, bgcolor: "black" }} />
const EarthMoon = dynamic(() => import("./EarthMoonMesh"), { ssr: false, loading: Loading })
const Expedition = dynamic(() => import("./IdentityAstronaut"), { ssr: false, loading: Loading })
const MarsLanding = dynamic(() => import("./MarsLandingScene"), { ssr: false, loading: Loading })
const FlightDeck = dynamic(() => import("./PioneerCockpit"), { ssr: false, loading: Loading })
const Journey = dynamic(() => import("./HorizonsJourney"), { ssr: false, loading: Loading })

export default function HomeDesignComponent({ componentKey }) {
  const [crewId, setCrewId] = useState("eva")
  const hasCrewSelector = ["mars-landing", "pioneer-flight-deck", "solar-system-journey"].includes(componentKey)
  return <Box data-home-design={componentKey} sx={{ width: "100%", minWidth: 0, bgcolor: "black", py: { xs: 2, sm: 3 },
    "& canvas:focus-visible": { outline: "2px solid #b0a0ec", outlineOffset: -3 } }}>
    {hasCrewSelector && <FormControl size="small" sx={{ m: 2, minWidth: 220,
      maxWidth: "calc(100% - 32px)",
      "& .MuiInputBase-root, & .MuiInputLabel-root": { color: "#c8c4d6", fontFamily: "var(--font-site)" },
      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#3d374e" }, "& .MuiSvgIcon-root": { color: "#b0a0ec" } }}>
      <InputLabel id={`crew-${componentKey}`}>Expedition crew</InputLabel>
      <Select labelId={`crew-${componentKey}`} label="Expedition crew" value={crewId} onChange={event => setCrewId(event.target.value)}>
        {CREWS.map(crew => <MenuItem key={crew.id} value={crew.id}>{crew.name}</MenuItem>)}
      </Select>
    </FormControl>}
    {componentKey === "earth-moon-world" && <EarthMoon />}
    {componentKey === "expedition-showcase" && <Expedition />}
    {componentKey === "mars-landing" && <MarsLanding crewId={crewId} />}
    {componentKey === "pioneer-flight-deck" && <FlightDeck crewId={crewId} />}
    {componentKey === "solar-system-journey" && <Journey crewId={crewId} />}
  </Box>
}
