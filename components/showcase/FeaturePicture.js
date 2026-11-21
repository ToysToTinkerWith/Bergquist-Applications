import React from "react"
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded"
import CheckRoundedIcon from "@mui/icons-material/CheckRounded"
import MailOutlineRoundedIcon from "@mui/icons-material/MailOutlineRounded"
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded"
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded"
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined"
import s from "../../styles/feature-gallery.module.css"

export default function FeaturePicture({ kind }) {
  const photo = "/restaurant/menu/items/neapolitan-house-special.webp"
  return <div className={s.picture} data-kind={kind} aria-hidden="true">
    <div className={s.glow} />
    {kind === "design" ? <img className={s.designPhoto} src="/home/lunar-museum/previews/optimized/pioneer-flight-deck.webp" alt="" loading="lazy" /> : <div className={s.miniWindow}>
      <div className={s.chrome}><i /><i /><i /><span>your website</span></div>
      {kind === "booking" && <div className={s.miniBody}><div className={s.miniHeading}><CalendarMonthRoundedIcon /><b>Choose a time</b></div><div className={s.week}>{["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => <span key={day} data-picked={i === 2}>{day}<strong>{12 + i}</strong></span>)}</div><div className={s.miniSlots}><span>9:00</span><span className={s.selected}>11:00</span><span>2:00</span></div></div>}
      {kind === "quote" && <div className={s.miniBody}><div className={s.miniHeading}><span className={s.roundIcon}>$</span><b>Your estimate</b></div><div className={s.quoteLine}><span>Service</span><strong>Deep clean</strong></div><div className={s.quoteLine}><span>Rooms</span><strong>3</strong></div><div className={s.miniRange}><span /></div><strong className={s.miniPrice}>$180<span>estimated</span></strong></div>}
      {kind === "store" && <div className={s.miniProducts}>{["orbital-scanner", "eva-helmet", "relay-beacon"].map((name, i) => <div key={name}><img src={`/home/pioneer-products/${name}.webp`} alt="" loading="lazy" /><span>{["$1,200", "$2,400", "$3,200"][i]}</span></div>)}<div className={s.miniCart}><ShoppingBagOutlinedIcon /><span>Added to cart</span><CheckRoundedIcon /></div></div>}
      {kind === "portal" && <div className={s.miniBody}><b>Your project</b><div className={s.miniProject}><img src="/work/upgrade-aprons.webp" alt="" loading="lazy" /><div><span>Website refresh</span><strong>Ready for review</strong></div></div><div className={s.progress}><span /></div><div className={s.progressLabels}><span>Started</span><span>Design</span><span>Launch</span></div></div>}
      {kind === "sales" && <div className={s.miniBody}><span className={s.smallLabel}>This month</span><strong className={s.miniPrice}>$12,840<small>↗ 18%</small></strong><svg className={s.chart} viewBox="0 0 300 95"><defs><linearGradient id="gallery-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#aa8de3" stopOpacity=".4" /><stop offset="100%" stopColor="#aa8de3" stopOpacity="0" /></linearGradient></defs><path d="M0 85 L30 72 L55 77 L85 47 L110 57 L140 40 L170 48 L195 22 L225 34 L250 15 L280 22 L300 5 L300 95 L0 95Z" fill="url(#gallery-chart-fill)" /><path d="M0 85 L30 72 L55 77 L85 47 L110 57 L140 40 L170 48 L195 22 L225 34 L250 15 L280 22 L300 5" fill="none" stroke="#c1a5f3" strokeWidth="3" /></svg></div>}
      {kind === "chat" && <div className={s.miniBody}><div className={s.miniHeading}><ChatBubbleOutlineRoundedIcon /><b>Here to help</b></div><div className={s.bubble}>Can I book online?</div><div className={s.reply}>Of course. Choose a time that works for you.<span>See available times ↗</span></div></div>}
      {kind === "notes" && <div className={s.miniBody}><div className={s.miniHeading}><ChatBubbleOutlineRoundedIcon /><b>One note. A clear plan.</b></div><div className={s.bubble}>Meet Taylor Friday at 2. Send an estimate.</div><div className={s.reply}>Your next steps<div className={s.miniSlots}><span className={s.selected}>Schedule</span><span>Tasks</span><span>Follow-ups</span></div></div></div>}
      {(kind === "food" || kind === "options") && <div className={s.foodPreview}><img src={photo} alt="" loading="lazy" /><div><b>{kind === "food" ? "Fresh from the menu" : "Make it yours"}</b><span>Handmade pizza</span>{kind === "options" ? <div className={s.optionPills}><span>S</span><span className={s.selected}>M</span><span>L</span></div> : <strong>$18.00</strong>}</div></div>}
      {kind === "inbox" && <div className={s.miniBody}><div className={s.miniHeading}><MailOutlineRoundedIcon /><b>New inquiries</b><span className={s.count}>3</span></div>{["Jamie", "Taylor", "Morgan"].map((name, i) => <div className={s.mailRow} key={name}><span>{name[0]}</span><div><b>{name}</b><small>{["I'd like a quote", "When are you available?", "A question about services"][i]}</small></div><i /></div>)}</div>}
      {kind === "files" && <div className={s.miniBody}><div className={s.miniHeading}><FolderOpenRoundedIcon /><b>Project files</b></div><div className={s.filePreview}><img src="/home/pioneer-products/eva-helmet.webp" alt="" loading="lazy" /><div><strong>Product photo</strong><span>Ready for your review</span></div></div><div className={s.approvePill}><CheckRoundedIcon />Looks good</div></div>}
    </div>}
    <span className={s.floatingBadge}><CheckRoundedIcon />{({ booking: "Appointment confirmed", quote: "A clear starting price", store: "Ready to order", portal: "One place for updates", sales: "Your numbers, clearly", notes: "Ready to organize", chat: "A useful next step", food: "Order received", options: "Your choices. Your price.", inbox: "No inquiry forgotten", files: "Approved", design: "Explore something new" })[kind]}</span>
  </div>
}
