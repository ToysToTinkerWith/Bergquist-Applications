import React, { useEffect, useMemo, useState } from "react"
import { Box, CircularProgress, IconButton, Tooltip, Typography } from "@mui/material"
import PauseRoundedIcon from "@mui/icons-material/PauseRounded"
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded"
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded"
import MoonMesh from "./MoonMesh"
import { ASSET_ROOT, SHIP_ROOT, CREWS } from "./space/flightCrews"
import { preloadCrewModels } from "./space/crewAssets"

export default function MarsLandingScene({ crewId }) {
  const crew = CREWS.find(entry => entry.id === crewId) || CREWS[0]
  const [paused, setPaused] = useState(false)
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState({ status: "loading", phase: "approach" })
  useEffect(() => {
    const controller = new AbortController()
    preloadCrewModels([ASSET_ROOT + crew.missionAsset, SHIP_ROOT + crew.missionSpacecraft], controller.signal)
    return () => controller.abort()
  }, [crew])
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setPaused(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  const mission = useMemo(() => ({ crew, paused, revision, onState: setState }), [crew, paused, revision])
  return <Box data-testid="mars-mission" data-crew={crew.id} data-status={state.status}
    data-phase={state.phase} sx={{ position: "relative", minWidth: 0, width: "100%" }}>
    <MoonMesh compact planet="mars" minHeight={{ xs: 420, sm: 480, md: 560 }}
      enableWheelZoom={false} mission={mission} />
    <Box sx={{ display: "flex", px: 2, py: 1, minHeight: 60, flexWrap: "wrap",
      alignItems: "center", justifyContent: "center", gap: 1, color: "#c6b8ef" }}>
      <Typography sx={{ fontSize: 12, letterSpacing: 0, textAlign: "center" }}>{crew.name} / {crew.ship}</Typography>
      {state.status === "loading" && <CircularProgress size={16} color="inherit" aria-label="Loading Mars expedition" />}
      {state.status === "error" && <Typography role="status" sx={{ position: "absolute", bottom: 44,
        left: 0, right: 0, textAlign: "center", fontSize: 12 }}>Expedition unavailable</Typography>}
      <Tooltip title={paused ? "Play expedition" : "Pause expedition"}><span>
        <IconButton aria-label={paused ? "Play expedition" : "Pause expedition"}
          disabled={state.status !== "ready"} onClick={() => setPaused(value => !value)}
          sx={{ color: "inherit", width: 40, height: 40 }}>
          {paused ? <PlayArrowRoundedIcon fontSize="small" /> : <PauseRoundedIcon fontSize="small" />}
        </IconButton>
      </span></Tooltip>
      <Tooltip title={state.status === "error" ? "Retry expedition" : "Replay landing"}>
        <IconButton aria-label={state.status === "error" ? "Retry expedition" : "Replay landing"}
          disabled={state.status === "loading"} onClick={() => { setPaused(false); setRevision(value => value+1) }}
          sx={{ color: "inherit", width: 40, height: 40 }}><ReplayRoundedIcon fontSize="small" /></IconButton>
      </Tooltip>
    </Box>
  </Box>
}
