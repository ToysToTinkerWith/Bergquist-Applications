import React, { useEffect, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded"
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded"
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded"
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded"
import TableRowsRoundedIcon from "@mui/icons-material/TableRowsRounded"
import { Workspace, Tool, Select, Views, Empty, Metrics, s } from "./Workspace"
import { DEMO_PRODUCTS, makeSalesRows, summarizeSales, money, csvText, downloadFile } from "../../lib/componentDemos"

export default function SalesWorkspace() {
  const sample = useMemo(() => makeSalesRows(180), [])
  const [days, setDays] = useState("30"), [product, setProduct] = useState("all"), [metric, setMetric] = useState("revenue"), [view, setView] = useState("trend"), [source, setSource] = useState("sample"), [revision, setRevision] = useState(0)
  const [connected, setConnected] = useState([]), [names, setNames] = useState([]), [status, setStatus] = useState("ready"), [error, setError] = useState(""), [updated, setUpdated] = useState("")
  useEffect(() => {
    if (source === "sample") { setStatus("ready"); setError(""); return }
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 20000)
    setStatus("loading"); setError(""); setConnected([])
    fetch(`/api/analytics/product-purchases?days=${days}`, { signal: controller.signal }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error("Connected sales are unavailable. Try again or use sample data.")
      if (!Array.isArray(data.series) || !Array.isArray(data.topProducts)) throw new Error("The sales response could not be read.")
      if (controller.signal.aborted) return
      const keys = data.topProducts.filter(item => typeof item === "string")
      setNames(keys); setConnected(data.series.filter(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date)).flatMap(row => keys.map(name => ({ date: row.date, name, product: name, units: Math.max(0, Number(row[name]) || 0), revenue: 0 })))); setUpdated(data.generatedAt || ""); setStatus("ready")
    }).catch(() => { if (!cancelled) { setStatus("error"); setError("Connected sales are unavailable. Try again or use sample data.") } }).finally(() => clearTimeout(timer))
    let cancelled = false
    return () => { cancelled = true; controller.abort(); clearTimeout(timer) }
  }, [source, days, revision])
  const options = source === "sample" ? DEMO_PRODUCTS.map(item => ({ value: item.id, label: item.name })) : names.map(name => ({ value: name, label: name }))
  const base = source === "sample" ? sample.slice(-Number(days) * DEMO_PRODUCTS.length) : connected
  const rows = base.filter(row => product === "all" || row.product === product)
  const totals = summarizeSales(rows)
  const previous = source === "sample" ? summarizeSales(sample.slice(-Number(days) * 2 * DEMO_PRODUCTS.length, -Number(days) * DEMO_PRODUCTS.length).filter(row => product === "all" || row.product === product)) : null
  const growth = previous?.[metric] ? `${((totals[metric] / previous[metric] - 1) * 100).toFixed(1)}% vs previous ${days} days` : undefined
  const chart = [...rows.reduce((map, row) => { const day = map.get(row.date) || { date: row.date, units: 0, revenue: 0 }; day.units += row.units; day.revenue += row.revenue; map.set(row.date, day); return map }, new Map()).values()].sort((a, b) => a.date.localeCompare(b.date))
  const products = [...rows.reduce((map, row) => { const item = map.get(row.product) || { id: row.product, name: row.name, units: 0, revenue: 0 }; item.units += row.units; item.revenue += row.revenue; map.set(row.product, item); return map }, new Map()).values()].sort((a, b) => b[metric] - a[metric])
  const display = value => metric === "revenue" ? money(value) : value.toLocaleString()
  const chartContent = <><CartesianGrid stroke="#292530" vertical={false} /><XAxis dataKey="date" tickFormatter={value => format(parseISO(value), "MMM d")} tick={{ fill: "#aaa2b7", fontSize: 11 }} minTickGap={36} axisLine={false} tickLine={false} /><YAxis width={64} tick={{ fill: "#aaa2b7", fontSize: 11 }} tickFormatter={value => metric === "revenue" ? `$${Math.round(value / 100000)}k` : value} axisLine={false} tickLine={false} /><Tooltip formatter={value => [display(value), metric === "revenue" ? "Revenue" : "Units"]} labelFormatter={value => format(parseISO(value), "MMM d, yyyy")} /></>
  return <Workspace title="Sales overview" status={source === "sample" ? "Sample sales · USD" : `Stripe test data${updated && !Number.isNaN(Date.parse(updated)) ? ` · Updated ${format(new Date(updated), "h:mm a")}` : ""}`} actions={<>
    {source === "connected" && <Tool label="Refresh sales" disabled={status === "loading"} onClick={() => setRevision(value => value + 1)}><RefreshRoundedIcon /></Tool>}
    <Tool label="Export sales" disabled={status !== "ready" || !rows.length} onClick={() => downloadFile("sales-report.csv", csvText(["Date", "Product", "Units", ...(source === "sample" ? ["Revenue USD"] : [])], rows.map(row => [row.date, row.name, row.units, ...(source === "sample" ? [row.revenue / 100] : [])])))}><FileDownloadRoundedIcon /></Tool>
  </>}>
    <div className={s.toolbar}><Select label="Data" value={source} onChange={value => { setSource(value); setProduct("all"); setMetric(value === "connected" ? "units" : "revenue") }} options={[{ value: "sample", label: "Sample sales" }, { value: "connected", label: "Stripe test data" }]} /><Select label="Period" value={days} onChange={setDays} options={[7, 30, 90].map(value => ({ value, label: `Last ${value} days` }))} /><Select label="Product" value={product} onChange={setProduct} options={[{ value: "all", label: "All products" }, ...options]} /></div>
    {status === "loading" ? <p className={s.notice} role="status">Loading connected sales...</p> : error ? <div className={s.error} role="alert">{error}<div className={s.actions} style={{ marginTop: 12 }}><button className={s.button} onClick={() => setRevision(value => value + 1)}>Retry</button><button className={s.button} onClick={() => { setSource("sample"); setProduct("all"); setMetric("revenue") }}>Use sample data</button></div></div> : <>
      <Metrics items={[{ label: "Revenue", value: source === "sample" ? money(totals.revenue) : "Not provided", detail: metric === "revenue" ? growth : undefined }, { label: "Units sold", value: totals.units.toLocaleString(), detail: metric === "units" ? growth : undefined }, { label: "Products", value: products.filter(item => item.units > 0).length }, { label: "Best seller", value: [...products].sort((a, b) => b.units - a.units)[0]?.units ? [...products].sort((a, b) => b.units - a.units)[0].name : "None yet" }]} />
      {!chart.length || !totals.units ? <Empty title="No sales in this period" /> : <>
        <div className={s.heading}><Select label="Measure" value={metric} onChange={setMetric} options={source === "sample" ? [{ value: "revenue", label: "Revenue" }, { value: "units", label: "Units sold" }] : [{ value: "units", label: "Units sold" }]} /><Views value={view} onChange={setView} options={[{ value: "trend", label: "Trend", icon: ShowChartRoundedIcon }, { value: "bars", label: "Bars", icon: BarChartRoundedIcon }, { value: "table", label: "Table", icon: TableRowsRoundedIcon }]} /></div>
        {view === "table" ? <div className={s.tableWrap} style={{ maxHeight: 360 }}><table className={s.table}><thead><tr><th>Date</th><th>Units sold</th>{source === "sample" && <th>Revenue</th>}</tr></thead><tbody>{chart.map(row => <tr key={row.date}><td>{format(parseISO(row.date), "MMM d, yyyy")}</td><td>{row.units}</td>{source === "sample" && <td>{money(row.revenue)}</td>}</tr>)}</tbody></table></div> : <div className={s.chart} role="img" aria-label={`${metric === "revenue" ? "Revenue" : "Units sold"} ${view} for ${days} days`}><ResponsiveContainer width="100%" height="100%">{view === "trend" ? <AreaChart data={chart}>{chartContent}<Area dataKey={metric} type="monotone" stroke="#b0a0ec" fill="#a08bc9" fillOpacity={.12} strokeWidth={2} isAnimationActive={false} /></AreaChart> : <BarChart data={chart}>{chartContent}<Bar dataKey={metric} fill="#a799ce" radius={[3, 3, 0, 0]} isAnimationActive={false} /></BarChart>}</ResponsiveContainer></div>}
        <h3 style={{ marginTop: 28 }}>Product performance</h3><div className={s.tableWrap}><table className={s.table}><thead><tr><th>Product</th><th>Units</th>{source === "sample" && <th>Revenue</th>}<th>Share of units</th></tr></thead><tbody>{products.map(item => <tr key={item.id}><td>{item.name}</td><td>{item.units}</td>{source === "sample" && <td>{money(item.revenue)}</td>}<td>{(item.units / totals.units * 100).toFixed(1)}%</td></tr>)}</tbody></table></div>
      </>}
    </>}
  </Workspace>
}
