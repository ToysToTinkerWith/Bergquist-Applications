import React from "react"
import Link from "next/link"
import { Box, Button, IconButton, MenuItem, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import SyncRoundedIcon from "@mui/icons-material/SyncRounded"
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded"
import UndoRoundedIcon from "@mui/icons-material/UndoRounded"
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded"
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded"
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded"
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded"
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded"
import AddCardRoundedIcon from "@mui/icons-material/AddCardRounded"
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend } from "recharts"
import { SPACE_PRODUCTS, dataSummary, financeSummary } from "../lib/cockpitSystems"

export const cockpitFonts = {
  fontFamily: "var(--font-site)", letterSpacing: 0,
  "& .MuiTypography-root, & .MuiButtonBase-root, & .MuiInputBase-root, & .MuiInputLabel-root, & table, & .recharts-wrapper": { fontFamily: "var(--font-site)", letterSpacing: 0 },
  "& h2.MuiTypography-root, & h3.MuiTypography-root, & h4.MuiTypography-root, & .component-link": { fontFamily: "var(--font-site)", fontWeight: 500, letterSpacing: 0 },
}
export function ComponentLink({ id, label, color }) {
  return <Link href={`/components#${id}-components`} passHref><Button component="a" className="component-link" variant="outlined"
    sx={{ fontFamily: "var(--font-site)", textTransform: "none", color, borderColor: color, borderRadius: 1, px: 2, py: 1, fontSize: 16, lineHeight: 1.4, maxWidth: "100%" }}>View {label} Components</Button></Link>
}
const fieldStyle = { "& .MuiInputBase-root": { color: "#e1e9ed", fontSize: 14 }, "& .MuiInputLabel-root": { color: "#90a4b1" }, "& fieldset": { borderColor: "#344149" }, "& .MuiSvgIcon-root": { color: "#9bb0bb" } }
const money = cents => `$${(cents / 100).toLocaleString("en-US")}`
const chartTooltip = { background: "#111217", border: "1px solid #383440", borderRadius: 4, color: "#e1e9ed", fontFamily: "var(--font-site)" }
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 13, "& th": { fontWeight: 400, color: "#8fa6b2", textAlign: "left" }, "& td, & th": { py: 1, borderBottom: "1px solid #223039" } }

export default function CockpitStationPanel({ station, category, systems, onAction, onClose, children }) {
  const state = systems[station.id], act = (type, value) => onAction(station.id, type, value)
  const data = station.id === "data" ? dataSummary(state) : null
  const finance = station.id === "finance" ? financeSummary(state) : null
  const tool = (name, type, Icon, disabled = false) => <Tooltip title={name}><span><IconButton aria-label={name} onClick={() => act(type)} disabled={disabled}
    sx={{ color: station.color, width: 40, height: 40, "&.Mui-disabled": { color: "#4b5962" } }}><Icon fontSize="small" /></IconButton></span></Tooltip>
  const metric = (label, value) => <Box sx={{ minWidth: 0 }}><Typography sx={{ fontSize: 12, color: "#95a8b3" }}>{label}</Typography><Typography sx={{ fontSize: { xs: 22, sm: 28 }, color: "#ecf1f3" }}>{value}</Typography></Box>
  return <Box component="section" data-station-panel={station.id} aria-label={`${station.label} control station`} sx={{ ...cockpitFonts, color: "#cfdae0", minWidth: 0, maxWidth: 1320, mx: "auto", px: { xs: 2, md: 4 }, pt: 3, pb: 5, borderTop: "1px solid #24303a" }}>
    <Box sx={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 1, mb: 2 }}>
      <Box sx={{ maxWidth: 780 }}><Typography component="h3" sx={{ fontSize: { xs: 23, sm: 30 }, color: station.color }}>{station.label} Components</Typography>
        <Typography sx={{ fontSize: 16, lineHeight: 1.7, color: "#b6c4ce", mt: 1 }}>{category?.desc}</Typography></Box>
      <Tooltip title="Cockpit overview"><IconButton aria-label="Close dashboard" onClick={onClose} sx={{ color: "#a2b2bd" }}><CloseRoundedIcon fontSize="small" /></IconButton></Tooltip>
    </Box>
    {data && <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Box><Typography sx={{ fontSize: 18 }}>Website traffic</Typography><Typography sx={{ fontSize: 12, color: "#91a6b4" }}>Firebase Analytics / last 30 complete days</Typography></Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ToggleButtonGroup exclusive size="small" value={state.view} onChange={(_, value) => value && act("view", value)} aria-label="Data visualization"
            sx={{ "& button": { color: "#a7b7c2", borderColor: "#334049", height: 40, px: 1.5 }, "& button.Mui-selected": { color: station.color, bgcolor: "#243039" } }}>
            {[["trend", "Trend view", ShowChartRoundedIcon], ["bars", "Bar view", BarChartRoundedIcon], ["table", "Table view", TableChartRoundedIcon]].map(([value, label, Icon]) =>
              <ToggleButton key={value} value={value} aria-label={label}><Tooltip title={label}><Icon fontSize="small" /></Tooltip></ToggleButton>)}
          </ToggleButtonGroup>
          {tool("Refresh website traffic", "sync", SyncRoundedIcon, state.status === "loading")}
          {tool("Export data CSV", "export", DownloadRoundedIcon, !data.rows.length)}
        </Box>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 2, py: 2, borderBlock: "1px solid #243039" }}>
        {metric("Sessions", state.generatedAt ? data.total.toLocaleString() : "Unavailable")}{metric("Page views", state.generatedAt ? data.pageViews.toLocaleString() : "Unavailable")}
      </Box>
      <Box data-traffic-view={state.view} sx={{ height: 300, my: 2, minWidth: 0, overflowY: state.view === "table" ? "auto" : "hidden" }}>
        {!data.rows.length ? <Box role="status" sx={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", px: 2 }}><Typography sx={{ color: "#94afbe" }}>{state.status === "loading" ? "Loading traffic..." : state.status === "error" ? state.notice : "No website traffic reported for this period."}</Typography></Box>
          : state.view === "table" ? <Box component="table" aria-label="Website traffic records" sx={tableStyle}><thead><tr><th>Date</th><th>Sessions</th><th>Page views</th></tr></thead><tbody>{data.rows.map(row => <tr key={row.id}><td>{row.id}</td><td>{row.value}</td><td>{row.pageViews}</td></tr>)}</tbody></Box>
          : <ResponsiveContainer width="100%" height="100%">{state.view === "bars" ? <BarChart data={data.rows} margin={{ top: 12, right: 15, left: -15, bottom: 5 }}><CartesianGrid stroke="#23323b" vertical={false} /><XAxis dataKey="id" tickFormatter={v => v.slice(5)} stroke="#91a6b4" minTickGap={35} /><YAxis stroke="#91a6b4" allowDecimals={false} /><ChartTooltip contentStyle={chartTooltip} /><Bar dataKey="value" name="Sessions" fill={station.color} isAnimationActive={false} /></BarChart>
          : <LineChart data={data.rows} margin={{ top: 12, right: 15, left: -15, bottom: 5 }}><CartesianGrid stroke="#23323b" vertical={false} /><XAxis dataKey="id" tickFormatter={v => v.slice(5)} stroke="#91a6b4" minTickGap={35} /><YAxis stroke="#91a6b4" allowDecimals={false} /><ChartTooltip contentStyle={chartTooltip} /><Line type="linear" dataKey="value" name="Sessions" stroke={station.color} strokeWidth={2} dot={data.rows.length < 12} isAnimationActive={false} /></LineChart>}</ResponsiveContainer>}
      </Box>
      <Typography role={state.status === "error" ? "alert" : "status"} sx={{ fontSize: 13, color: "#94afbe", mb: 1 }}>{state.notice}{state.generatedAt ? ` / Retrieved ${new Date(state.generatedAt).toLocaleString()}${state.status === "error" ? " (last available report)" : ""}` : ""}</Typography>
      {state.limited && <Typography sx={{ color: "#d9ba88", fontSize: 13 }}>Some data may be withheld by Google Analytics privacy thresholds.</Typography>}
    </>}
    {finance && <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}><Typography sx={{ fontSize: 18 }}>Cash flow / Quarter</Typography><Typography sx={{ color: "#97ad9e", fontSize: 12 }}>SAMPLE CATALOG / NO REAL PAYMENTS</Typography></Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(4,minmax(0,1fr))" }, gap: 2, my: 2, py: 2, borderBlock: "1px solid #243039" }}>
        {metric("Received", money(finance.received))}{metric("Expenses", money(finance.expenses))}{metric("Net cash flow", money(finance.net))}{metric("Outstanding", money(finance.pending))}
      </Box>
      <Box sx={{ height: 270, minWidth: 0 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={finance.months} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}><CartesianGrid stroke="#23323b" vertical={false} /><XAxis dataKey="name" stroke="#91a6b4" /><YAxis stroke="#91a6b4" tickFormatter={v => `$${v / 100000}k`} /><ChartTooltip contentStyle={chartTooltip} formatter={money} /><Legend /><Bar dataKey="income" name="Received" fill="#92e3b7" isAnimationActive={false} /><Bar dataKey="expenses" name="Expenses" fill="#b7a78c" isAnimationActive={false} /></BarChart></ResponsiveContainer></Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3,minmax(0,1fr))" }, gap: 3, my: 3 }}>
        {SPACE_PRODUCTS.map(product => <Box component="article" key={product.id} sx={{ minWidth: 0 }}>
          <Box component="img" src={product.image} alt={product.name} loading="lazy" sx={{ width: "100%", height: { xs: 220, sm: 240 }, objectFit: "contain", display: "block", bgcolor: "#080d12" }} />
          <Typography component="h4" sx={{ fontSize: 19, mt: 1.5, color: "#e1e9ed" }}>{product.name}</Typography>
          <Typography sx={{ fontSize: 14, color: "#92e3b7", mt: .5 }}>{money(product.cents)} / {state.invoices.filter(row => row.product === product.id).reduce((sum, row) => sum + row.quantity, 0)} ordered</Typography>
        </Box>)}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3 }}>
        <Box component="table" aria-label="Sample finance ledger" sx={tableStyle}><thead><tr><th>Invoice</th><th>Amount</th><th>Status</th></tr></thead><tbody>
          {state.invoices.map(row => <tr key={row.id}><td style={{ color: row.id === state.selected ? station.color : undefined }}>{row.id}</td><td>{money(row.cents)}</td><td>{row.status === "matched" ? "Reconciled" : row.status === "paid" ? "Paid" : "Unpaid"}</td></tr>)}
        </tbody></Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField select SelectProps={{ MenuProps: { PaperProps: { "data-cockpit-menu": true, sx: { fontFamily: "var(--font-site)", "& li": { fontFamily: "var(--font-site)" } } } } }} label="Invoice" size="small" value={state.selected} onChange={event => act("select", event.target.value)} sx={fieldStyle}>
            {state.invoices.map(row => <MenuItem value={row.id} key={row.id}>{row.id} / {row.client}</MenuItem>)}
          </TextField>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button size="small" startIcon={<AddCardRoundedIcon />} variant="outlined" disabled={finance.selected?.status !== "pending"} onClick={() => act("receive")} sx={{ color: station.color, borderColor: "#355b4c", textTransform: "none" }}>Record payment</Button>
            <Button size="small" startIcon={<DoneAllRoundedIcon />} disabled={!finance.unmatched} onClick={() => act("reconcile")} sx={{ color: station.color, textTransform: "none" }}>Reconcile ({finance.unmatched})</Button>
            {tool("Undo ledger change", "undo", UndoRoundedIcon, !state.history.length)}{tool("Export ledger CSV", "export", DownloadRoundedIcon)}{tool("Reset finance", "reset", RestartAltRoundedIcon)}
          </Box>
          <Typography role="status" sx={{ color: "#99b5a5", fontSize: 13 }}>{state.notice}</Typography>
        </Box>
      </Box>
    </>}
    {children}
    <Box sx={{ mt: 3 }}><ComponentLink id={station.id} label={station.label} color={station.color} /></Box>
  </Box>
}
