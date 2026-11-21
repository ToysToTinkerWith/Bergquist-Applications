import React, { useEffect, useState } from "react"
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded"
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded"
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded"
import { Workspace } from "./Workspace"
import { appointmentDates } from "../../lib/businessWorkflow.mjs"
import { featureGallery } from "../../lib/featureGallery"
import d from "../../styles/simple-feature-demo.module.css"

const price = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
const sampleFile = { name: "Product photo.webp", url: "/home/pioneer-products/eva-helmet.webp", image: true }
const inquiries = [
  { name: "Jamie", initial: "J", subject: "A quote for my project", message: "I'd like to know more about your services and get a starting price." },
  { name: "Taylor", initial: "T", subject: "Your next available date", message: "Are you available next week? I would like to arrange a visit." },
  { name: "Morgan", initial: "M", subject: "A question about your services", message: "Can you help with an ongoing project, or do you only offer one-time visits?" },
]

export default function SimpleFeatureDemo({ componentKey }) {
  const feature = featureGallery[componentKey]
  const [pickedDate, setPickedDate] = useState(""), [time, setTime] = useState("")
  const [service, setService] = useState("Standard clean"), [rooms, setRooms] = useState(3), [name, setName] = useState("Jamie")
  const [size, setSize] = useState("Medium"), [extraCheese, setExtraCheese] = useState(false), [olives, setOlives] = useState(false)
  const [selected, setSelected] = useState(0), [replied, setReplied] = useState([])
  const [file, setFile] = useState(sampleFile), [approved, setApproved] = useState(false)
  const [done, setDone] = useState(false), [notice, setNotice] = useState(""), [error, setError] = useState("")
  useEffect(() => () => { if (file.url?.startsWith("blob:")) URL.revokeObjectURL(file.url) }, [file])
  function reset() {
    setPickedDate(""); setTime(""); setService("Standard clean"); setRooms(3); setName("Jamie")
    setSize("Medium"); setExtraCheese(false); setOlives(false); setSelected(0); setReplied([])
    setFile(sampleFile); setApproved(false); setDone(false); setNotice(""); setError("")
  }
  const dates = appointmentDates().slice(0, 5)
  const total = (service === "Standard clean" ? 40 : 60) * rooms
  const pizzaTotal = ({ Small: 14, Medium: 18, Large: 22 })[size] + (extraCheese ? 3 : 0) + (olives ? 2 : 0)
  const formatDay = date => new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  const success = (text) => { setDone(true); setNotice(text) }
  function chooseFile(event) {
    const chosen = event.target.files?.[0]; event.target.value = ""
    if (!chosen) return
    if (chosen.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(chosen.type)) { setError("Choose a JPG, PNG, WebP, or PDF up to 5 MB."); return }
    setFile({ name: chosen.name, image: chosen.type.startsWith("image/"), url: chosen.type.startsWith("image/") ? URL.createObjectURL(chosen) : "" })
    setApproved(false); setError(""); setNotice("File selected. It stays on this page; nothing is uploaded.")
  }
  return <Workspace title={feature.title} status="Interactive sample · Nothing is sent or charged" actions={<button className={d.reset} onClick={reset}><RestartAltRoundedIcon fontSize="small" />Start again</button>}>
    <div className={d.demo} data-simple-feature={componentKey}>
      <p className={d.instruction}>{feature.hint}</p>
      <div role="status" aria-live="polite">{notice && <p className={d.notice}><CheckRoundedIcon />{notice}</p>}</div>
      {error && <p className={d.error} role="alert">{error}</p>}

      {componentKey === "appointment-booking" && <div className={d.split}>
        <section className={d.panel}><div className={d.panelTitle}><CalendarMonthRoundedIcon /><h3>Book a visit</h3></div><p className={d.label}>1. Pick a day</p><div className={d.dates}>{dates.map(date => <button key={date} aria-pressed={pickedDate === date} onClick={() => { setPickedDate(date); setDone(false); setNotice("") }}><span>{new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" })}</span><strong>{new Date(`${date}T12:00:00`).getDate()}</strong></button>)}</div><p className={d.label}>2. Pick a time</p><div className={d.choices}>{["9:00 AM", "11:00 AM", "2:00 PM"].map(value => <button key={value} aria-pressed={time === value} onClick={() => { setTime(value); setDone(false); setNotice("") }}>{value}</button>)}</div><p className={d.fine}>Times use your device&apos;s local time.</p><button className={d.primary} disabled={!pickedDate || !time || done} onClick={() => success("Appointment confirmed in this sample.")}>{done ? "Confirmed" : "Confirm appointment"}</button></section>
        <aside className={d.result}><div className={d.largeIcon}>{done ? <CheckRoundedIcon /> : <CalendarMonthRoundedIcon />}</div><h3>{done ? "You're booked." : "Your next visit"}</h3><p>{pickedDate ? formatDay(pickedDate) : "Choose a day"}{time ? ` · ${time}` : ""}</p><span className={d.pill}>{done ? "Appointment confirmed" : "Choose a time. Skip the back-and-forth."}</span></aside>
      </div>}

      {componentKey === "quote-builder" && <div className={d.split}>
        <form className={d.panel} onSubmit={event => { event.preventDefault(); success("Sample request received. Your choices are ready for the business to review.") }}><h3>Get a cleaning estimate</h3><label className={d.field}>Service<select value={service} onChange={event => { setService(event.target.value); setDone(false); setNotice("") }}><option>Standard clean</option><option>Deep clean</option></select></label><label className={d.field}>Rooms <strong>{rooms}</strong><input type="range" min="1" max="5" value={rooms} onChange={event => { setRooms(Number(event.target.value)); setDone(false); setNotice("") }} /></label><label className={d.field}>Your name (sample)<input required maxLength={80} value={name} onChange={event => { setName(event.target.value); setDone(false); setNotice("") }} /></label><button className={d.primary} disabled={done || !name.trim()}>{done ? "Request received" : "Request this estimate"}</button></form>
        <aside className={d.result}><div className={d.largeIcon}>{done ? <CheckRoundedIcon /> : <span>$</span>}</div><p className={d.label}>Your sample estimate</p><strong className={d.price}>{price(total)}</strong><p>{service} · {rooms} {rooms === 1 ? "room" : "rooms"}</p><p className={d.fine}>Illustrative pricing only. A business would confirm the final scope and cost.</p></aside>
      </div>}

      {componentKey === "service-configurator" && <div className={d.split}>
        <div className={d.productImage}><img src="/restaurant/menu/items/neapolitan-house-special.webp" alt="Freshly baked pizza with toppings" /><span className={d.imageLabel}>Build your pizza</span></div>
        <section className={d.panel}><h3>Make it yours.</h3><p className={d.label}>Size</p><div className={d.choices}>{["Small", "Medium", "Large"].map(value => <button key={value} aria-pressed={size === value} onClick={() => { setSize(value); setDone(false); setNotice("") }}>{value}</button>)}</div><label className={d.check}><input type="checkbox" checked={extraCheese} onChange={event => { setExtraCheese(event.target.checked); setDone(false); setNotice("") }} />Extra cheese <span>+ $3</span></label><label className={d.check}><input type="checkbox" checked={olives} onChange={event => { setOlives(event.target.checked); setDone(false); setNotice("") }} />Olives <span>+ $2</span></label><div className={d.total}><span>Sample total</span><strong>{price(pizzaTotal)}</strong></div><button className={d.primary} disabled={done} onClick={() => success("Added to the sample order. No purchase was made.")}>{done ? "Added to order" : "Add to sample order"}</button></section>
      </div>}

      {componentKey === "customer-portal" && <div className={d.split}>
        <div className={d.projectPreview}><img src="/work/upgrade-aprons.webp" alt="Website design preview for a sample project review" /><span className={d.imageLabel}>Design preview</span></div>
        <section className={d.panel}><span className={d.pill}>{approved ? "Approved" : "Ready for your review"}</span><h3 className={d.projectTitle}>Website refresh</h3><ol className={d.steps}>{["Project started", "Design ready", "Design approved"].map((step, i) => <li key={step} data-complete={i < 2 || approved}><span>{i < 2 || approved ? <CheckRoundedIcon /> : "3"}</span>{step}</li>)}</ol><button className={d.primary} disabled={approved} onClick={() => { setApproved(true); setNotice("Design approved in the sample project.") }}>{approved ? "Design approved" : "Approve the design"}</button></section>
      </div>}

      {componentKey === "inquiry-pipeline" && <div className={d.split}>
        <section className={d.panel}><div className={d.panelTitle}><MailOutlineRoundedIcon /><h3>Your inquiries</h3></div><div className={d.inquiries}>{inquiries.map((inquiry, i) => <button key={inquiry.name} aria-pressed={selected === i} onClick={() => { setSelected(i); setNotice("") }}><span className={d.avatar}>{inquiry.initial}</span><span><strong>{inquiry.name}</strong><small>{inquiry.subject}</small></span><span className={d.dot} data-replied={replied.includes(i)} /></button>)}</div></section>
        <section className={d.panel}><span className={d.pill}>{replied.includes(selected) ? "Replied" : "Needs a reply"}</span><h3 className={d.projectTitle}>{inquiries[selected].subject}</h3><p className={d.message}>{inquiries[selected].message}</p><p className={d.sender}>From {inquiries[selected].name} · Sample inquiry</p><button className={d.primary} disabled={replied.includes(selected)} onClick={() => { setReplied(current => [...current, selected]); setNotice("Marked as replied. No message was sent.") }}>{replied.includes(selected) ? "Marked as replied" : "Mark as replied"}</button></section>
      </div>}

      {componentKey === "document-intake" && <div className={d.split}>
        <div className={d.fileImage}>{file.image ? <img src={file.url} alt={`Preview of ${file.name}`} /> : <FolderOpenRoundedIcon />}<span className={d.imageLabel}>{file.name}</span></div>
        <section className={d.panel}><div className={d.panelTitle}><FolderOpenRoundedIcon /><h3>Review a file</h3></div><p className={d.fileName}>{file.name}</p><span className={d.pill}>{approved ? "Approved" : "Ready for review"}</span><button className={d.primary} disabled={approved} onClick={() => { setApproved(true); setNotice("File approved in this sample.") }}>{approved ? "File approved" : "Approve file"}</button><label className={d.upload}>Try your own file<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={chooseFile} /></label><p className={d.fine}>Sample images or PDFs up to 5 MB. Images preview here; PDFs show their filename. Files stay on this page and are never uploaded.</p></section>
      </div>}
    </div>
  </Workspace>
}
