import React from "react"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import { Dialog, DialogTitle, DialogContent, IconButton, Tooltip, useMediaQuery } from "@mui/material"
import CloseRoundedIcon from "@mui/icons-material/CloseRounded"
import SearchRoundedIcon from "@mui/icons-material/SearchRounded"
import s from "../../styles/component-workspace.module.css"

const theme = createTheme({
  palette: { mode: "dark", primary: { main: "#b0a0ec", contrastText: "#111016" }, background: { default: "#050607", paper: "#111217" }, text: { primary: "#f0eff5", secondary: "#acb1c0" }, divider: "#30313c" },
  typography: { fontFamily: '"Outfit", Arial, sans-serif', button: { textTransform: "none", letterSpacing: 0 }, h6: { fontSize: 22, fontWeight: 500 } },
  shape: { borderRadius: 6 },
  components: { MuiDialog: { styleOverrides: { paper: { backgroundImage: "none", border: "1px solid #383440", borderRadius: 8 } } }, MuiButton: { styleOverrides: { root: { letterSpacing: 0, boxShadow: "none" } } } },
})

export function WorkspaceTheme({ children }) { return <ThemeProvider theme={theme}>{children}</ThemeProvider> }
export function Workspace({ title, status, actions, children }) {
  return <div className={s.workspace} data-workspace>
    <div className={s.heading}><div><h2>{title}</h2>{status && <p className={s.status}>{status}</p>}</div><div className={s.actions}>{actions}</div></div>
    {children}
  </div>
}
export function Tool({ label, children, ...props }) {
  return <Tooltip title={label}><span><button type="button" className={s.iconButton} aria-label={label} {...props}>{children}</button></span></Tooltip>
}
export function Search({ label, value, onChange }) {
  return <div className={s.search}><SearchRoundedIcon aria-hidden="true" /><input type="search" aria-label={label} placeholder={label} value={value} onChange={event => onChange(event.target.value)} />{value && <Tool label="Clear search" onClick={() => onChange("")}><CloseRoundedIcon fontSize="small" /></Tool>}</div>
}
export function Select({ label, value, onChange, options, ...props }) {
  return <label className={s.select}><span>{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)} {...props}>{options.map(item => <option key={item.value ?? item} value={item.value ?? item}>{item.label ?? item}</option>)}</select></label>
}
export function Views({ label = "View", value, onChange, options }) {
  return <div className={s.views} role="group" aria-label={label}>{options.map(({ value: id, label: name, icon: Icon }) => <button type="button" key={id} aria-pressed={value === id} onClick={() => onChange(id)}>{Icon && <Icon fontSize="small" />}{name}</button>)}</div>
}
export function Empty({ title = "No results", children, onReset }) {
  return <div className={s.empty}><h3>{title}</h3>{children && <p>{children}</p>}{onReset && <button className={s.button} onClick={onReset}>Clear filters</button>}</div>
}
export function Modal({ title, open, onClose, children }) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")
  return <Dialog open={open} onClose={onClose} transitionDuration={reducedMotion ? 0 : 180} fullWidth maxWidth="sm" aria-labelledby="workspace-dialog-title">
    <DialogTitle id="workspace-dialog-title" sx={{ pr: 7 }}>{title}<IconButton aria-label="Close dialog" onClick={onClose} sx={{ position: "absolute", right: 10, top: 10 }}><CloseRoundedIcon /></IconButton></DialogTitle>
    <DialogContent className={s.dialog}>{children}</DialogContent>
  </Dialog>
}
export function Metrics({ items }) {
  return <dl className={s.metrics}>{items.map(({ label, value, detail }) => <div key={label}><dt>{label}</dt><dd>{value}</dd>{detail && <small>{detail}</small>}</div>)}</dl>
}
export { s }
