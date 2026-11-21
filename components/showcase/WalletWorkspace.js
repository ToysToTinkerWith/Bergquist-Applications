import React, { useState } from "react"
import dynamic from "next/dynamic"
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined"
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined"
import { Workspace, Views, Search, Tool, Metrics, Empty, s } from "./Workspace"

const ConnectedWallet = dynamic(() => import("../AlgorandWalletManager"), { ssr: false, loading: () => <p role="status">Loading wallet connection...</p> })
const assets = [{ name: "Algorand", symbol: "ALGO", amount: 850, decimals: 2 }, { name: "USD Coin", symbol: "USDC", amount: 420, decimals: 2 }]
const activity = [{ id: "demo-003", type: "Received", asset: "USDC", amount: "+120.00", date: "Sep 18" }, { id: "demo-002", type: "Sent", asset: "ALGO", amount: "-25.00", date: "Sep 16" }, { id: "demo-001", type: "Received", asset: "ALGO", amount: "+875.00", date: "Sep 12" }]
export default function WalletWorkspace() {
  const [mode, setMode] = useState("sample"), [view, setView] = useState("assets"), [search, setSearch] = useState(""), [hidden, setHidden] = useState(false)
  const filtered = assets.filter(asset => `${asset.name} ${asset.symbol}`.toLowerCase().includes(search.toLowerCase()))
  return <Workspace title="Wallet workspace" status={mode === "sample" ? "Sample wallet · No funds or transactions" : "Account connection"} actions={<Views label="Wallet mode" value={mode} onChange={setMode} options={[{ value: "sample", label: "Example wallet" }, { value: "connected", label: "My wallet" }]} />}>
    {mode === "connected" ? <div className={s.legacy}><ConnectedWallet /></div> : <>
      <Metrics items={[{ label: "ALGO balance", value: hidden ? "Hidden" : "850.00" }, { label: "USDC balance", value: hidden ? "Hidden" : "420.00" }, { label: "Assets", value: 2 }, { label: "Network", value: "Demo" }]} />
      <div className={s.toolbar}><Views value={view} onChange={setView} options={[{ value: "assets", label: "Assets" }, { value: "activity", label: "Activity" }]} />{view === "assets" && <Search label="Search assets" value={search} onChange={setSearch} />}<Tool label={hidden ? "Show balances" : "Hide balances"} onClick={() => setHidden(value => !value)}>{hidden ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}</Tool></div>
      {view === "assets" ? filtered.length ? <div className={s.tableWrap}><table className={s.table}><thead><tr><th>Asset</th><th>Symbol</th><th>Balance</th></tr></thead><tbody>{filtered.map(asset => <tr key={asset.symbol}><td>{asset.name}</td><td><span className={s.badge}>{asset.symbol}</span></td><td>{hidden ? "Hidden" : asset.amount.toFixed(asset.decimals)}</td></tr>)}</tbody></table></div> : <Empty title="No matching assets" onReset={() => setSearch("")} /> : <div className={s.tableWrap}><table className={s.table}><thead><tr><th>Activity</th><th>Asset</th><th>Amount</th><th>Date</th></tr></thead><tbody>{activity.map(row => <tr key={row.id}><td>{row.type}<small>{row.id}</small></td><td>{row.asset}</td><td>{hidden ? "Hidden" : row.amount}</td><td>{row.date}</td></tr>)}</tbody></table></div>}
    </>}
  </Workspace>
}
