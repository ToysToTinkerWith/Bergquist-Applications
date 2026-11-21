import React, { useEffect, useMemo, useState } from "react"
import { subDays, format } from "date-fns"
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import { resolveAsset, fetchCandles, CandlestickChart } from "../TinymanPoolCandles"
import { Workspace, Tool, Select, Views, Metrics, Empty, s } from "./Workspace"
import { csvText, downloadFile } from "../../lib/componentDemos"

export default function MarketWorkspace() {
  const [source, setSource] = useState("sample"), [period, setPeriod] = useState("30"), [view, setView] = useState("candles"), [query, setQuery] = useState("ALGO"), [applied, setApplied] = useState("ALGO"), [revision, setRevision] = useState(0), [rows, setRows] = useState([]), [asset, setAsset] = useState("ALGO"), [status, setStatus] = useState("ready"), [error, setError] = useState("")
  const sample = useMemo(() => Array.from({ length: 90 }, (_, i) => {
    const open = .18 + i * .0004 + Math.sin(i * .63) * .008, close = open + Math.sin(i + .4) * .009
    return { time: subDays(new Date(), 89 - i).toISOString(), open, close, high: Math.max(open, close) + .004, low: Math.min(open, close) - .003, volume: 12000 + (i * 719 % 11000) }
  }), [])
  useEffect(() => {
    if (source === "sample") { setRows(sample.slice(-Number(period))); setAsset("ALGO"); setStatus("ready"); setError(""); return }
    let cancelled = false, timer
    setStatus("loading"); setError(""); setRows([])
    const load = async () => { const resolved = await resolveAsset(applied); const candles = await fetchCandles({ assetId: resolved.id, denominatingAssetId: 31566704, limitValue: Number(period) }); return { resolved, candles } }
    Promise.race([load(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Timed out")), 20000) })]).then(({ resolved, candles }) => { if (!cancelled) { setRows(candles); setAsset(resolved.unitName); setStatus("ready") } }).catch(() => { if (!cancelled) { setStatus("error"); setError("Market data is unavailable. Retry or switch to sample data.") } }).finally(() => clearTimeout(timer))
    return () => { cancelled = true; clearTimeout(timer) }
  }, [source, period, applied, revision, sample])
  const latest = rows[rows.length - 1], price = value => Number.isFinite(value) ? value.toFixed(4) : "-"
  const candleDate = row => new Date(row.time)
  return <Workspace title={`${asset} / USDC`} status={source === "sample" ? "Sample market data · Not live prices" : "Connected market data · Vestige"} actions={<>
    <Tool label="Refresh market data" disabled={status === "loading"} onClick={() => setRevision(value => value + 1)}><RefreshRoundedIcon /></Tool>
    <Tool label="Export candles" disabled={!rows.length} onClick={() => downloadFile("market-candles.csv", csvText(["Date", "Open", "High", "Low", "Close"], rows.map(row => [format(candleDate(row), "yyyy-MM-dd"), row.open, row.high, row.low, row.close])))}><FileDownloadRoundedIcon /></Tool>
  </>}>
    <div className={s.toolbar}><Select label="Data" value={source} onChange={setSource} options={[{ value: "sample", label: "Sample candles" }, { value: "live", label: "Live market" }]} /><Select label="Period" value={period} onChange={setPeriod} options={[14, 30, 90].map(value => ({ value, label: `${value} days` }))} />{source === "live" && <form className={s.row} onSubmit={event => { event.preventDefault(); if (query.trim()) { setApplied(query.trim()); setRevision(value => value + 1) } }}><label className={s.select}>Asset<input aria-label="Asset symbol or ID" value={query} onChange={event => setQuery(event.target.value)} style={{ maxWidth: 120, background: "#111217", color: "#eee", border: "1px solid #41414e", borderRadius: 5, padding: 10 }} /></label><button className={s.button} disabled={status === "loading" || !query.trim()}>Load</button></form>}</div>
    {status === "loading" ? <p role="status" className={s.notice}>Loading market data...</p> : error ? <p role="alert" className={s.error}>{error}</p> : rows.length ? <>
      <Metrics items={[{ label: "Last close", value: price(latest.close) }, { label: "Period high", value: price(Math.max(...rows.map(row => row.high))) }, { label: "Period low", value: price(Math.min(...rows.map(row => row.low))) }, { label: "Candles", value: rows.length }]} />
      <Views value={view} onChange={setView} options={[{ value: "candles", label: "Candles" }, { value: "table", label: "Table" }]} />
      {view === "candles" ? <div className={s.legacy} style={{ marginTop: 18 }}><CandlestickChart data={rows} height={340} quoteLabel="USDC" /></div> : <div className={s.tableWrap} style={{ maxHeight: 420 }}><table className={s.table}><thead><tr><th>Date</th><th>Open</th><th>High</th><th>Low</th><th>Close</th></tr></thead><tbody>{[...rows].reverse().map(row => <tr key={row.timestamp || row.time}><td>{format(candleDate(row), "MMM d")}</td>{["open", "high", "low", "close"].map(key => <td key={key}>{price(row[key])}</td>)}</tr>)}</tbody></table></div>}
    </> : <Empty title="No candles available" />}
  </Workspace>
}
