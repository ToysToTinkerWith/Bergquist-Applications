// pages/restaurant/admin/orders.jsx
import React, { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

// Update this import to match your Firebase client init path.
// Expecting it exports a `db` Firestore instance.
import { db } from "../../../Firebase/FirebaseInit"

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore"

function money(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return "—"
  const s = n.toFixed(2)
  return s.endsWith("00") ? `$${n.toFixed(0)}` : `$${s}`
}

function normalizeStatus(v) {
  return String(v || "").trim().toLowerCase()
}

function isCompleted(order) {
  const s = normalizeStatus(order?.status)
  return s === "completed" || s === "complete" || s === "fulfilled" || s === "done"
}

// NEW: "paid" checker (including common Stripe variants)
function isPaid(order) {
  const s = normalizeStatus(order?.status)
  return s === "paid" || s === "succeeded" || s === "payment_succeeded" || s === "payment succeeded"
}

function orderDisplayId(order) {
  return String(order?.orderId || order?.id || "—")
}

// Mirrors your Menu/Order page “category → image path” pattern.
const ITEM_IMAGE_BY_CATEGORY = {
  pizza: "/restaurant/menu/pizza.jpg",
  pasta: "/restaurant/menu/pasta.jpg",
  salads: "/restaurant/menu/salad.jpg",
  salad: "/restaurant/menu/salad.jpg",
  sandwiches: "/restaurant/menu/sandwich.jpg",
  sandwich: "/restaurant/menu/sandwich.jpg",
  beverages: "/restaurant/menu/beverage.jpg",
  beverage: "/restaurant/menu/beverage.jpg",
  appetizers: "/restaurant/menu/appetizer.jpg",
  appetizer: "/restaurant/menu/appetizer.jpg",
  desserts: "/restaurant/menu/pizza.jpg", // fallback if you don’t have a dessert image yet
  dessert: "/restaurant/menu/pizza.jpg",
}

function normalizeCat(v) {
  return String(v || "").trim().toLowerCase()
}

// Best-effort inference when items don’t carry a category.
function inferCategoryFromName(name) {
  const n = String(name || "").toLowerCase()

  if (n.includes("pizza") || n.includes("slice")) return "pizza"
  if (n.includes("ravioli") || n.includes("spaghetti") || n.includes("pasta") || n.includes("ziti")) return "pasta"
  if (n.includes("salad") || n.includes("caesar") || n.includes("spinach")) return "salads"
  if (n.includes("sandwich") || n.includes("hero") || n.includes("focaccia") || n.includes("steak")) return "sandwiches"

  if (
    n.includes("coffee") ||
    n.includes("tea") ||
    n.includes("juice") ||
    n.includes("water") ||
    n.includes("root beer") ||
    n.includes("ginger beer") ||
    n.includes("cider") ||
    n.includes("milk") ||
    n.includes("hot chocolate") ||
    n.includes("pellegrino") ||
    n.includes("limonata")
  )
    return "beverages"

  if (
    n.includes("bread") ||
    n.includes("antipasta") ||
    n.includes("portobella") ||
    n.includes("appetizer") ||
    n.includes("plate")
  )
    return "appetizers"

  if (n.includes("cake") || n.includes("cheesecake") || n.includes("dessert") || n.includes("chocolate")) return "desserts"

  return ""
}

// Resolve item image the same way as your Order page:
// 1) explicit item.image/img/imageUrl
// 2) category-ish fields
// 3) infer from name
// 4) fallback
function resolveItemImage(it) {
  const direct = it?.image || it?.img || it?.imageUrl || it?.imageURL
  if (direct) return String(direct)

  const cat =
    normalizeCat(it?.category) ||
    normalizeCat(it?.cat) ||
    normalizeCat(it?.menuCategory) ||
    normalizeCat(it?.section) ||
    normalizeCat(inferCategoryFromName(it?.name))

  return ITEM_IMAGE_BY_CATEGORY[cat] || "/restaurant/menu/pizza.jpg"
}

// Resolve customer name from likely fields
function resolveCustomerName(o) {
  const n =
    o?.customerName ||
    o?.customer?.name ||
    o?.stripe?.customerName ||
    o?.stripe?.customer?.name ||
    ""
  const s = String(n || "").trim()
  return s
}

// Convert Firestore Timestamp/Date-ish to ms (best effort)
function toMs(v) {
  try {
    if (!v) return 0
    if (typeof v === "object" && typeof v.toDate === "function") {
      const d = v.toDate()
      const ms = d?.getTime?.() || 0
      return Number.isFinite(ms) ? ms : 0
    }
    if (v instanceof Date) {
      const ms = v.getTime()
      return Number.isFinite(ms) ? ms : 0
    }
    if (typeof v === "number") return Number.isFinite(v) ? v : 0
    if (typeof v === "string") {
      const d = new Date(v)
      const ms = d.getTime()
      return Number.isFinite(ms) ? ms : 0
    }
  } catch {}
  return 0
}

function pad2(n) {
  const x = Math.max(0, Math.floor(Number(n) || 0))
  return x < 10 ? `0${x}` : String(x)
}

function formatDuration(ms) {
  const t = Math.max(0, Math.floor((Number(ms) || 0) / 1000))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  if (h > 0) return `${h}:${pad2(m)}:${pad2(s)}`
  return `${m}:${pad2(s)}`
}

// Money math in cents to avoid float wobble
function toCents(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100)
}

function centsToMoney(c) {
  const n = Number(c)
  if (!Number.isFinite(n)) return 0
  return n / 100
}

// Deterministic accent from id (so each order feels distinct)
function accentFromId(id) {
  const s = String(id || "")
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  const a = 0.10 + (h % 9) * 0.01 // 0.10..0.18
  const b = 0.06 + (h % 7) * 0.01 // 0.06..0.12
  return { goldA: a, inkA: b }
}

export default function RestaurantOrdersAdmin() {
  const [orders, setOrders] = useState([])
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState("")
  const [nowMs, setNowMs] = useState(() => Date.now())

  // NEW: image modal state
  const [imgModal, setImgModal] = useState({
    open: false,
    src: "",
    alt: "",
  })

  // Tick for the "active for" timer
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // NEW: close modal on Escape
  useEffect(() => {
    if (!imgModal.open) return
    const onKeyDown = (e) => {
      if (e.key === "Escape") setImgModal({ open: false, src: "", alt: "" })
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [imgModal.open])

  const tokens = useMemo(
    () => ({
      ink: "#f4f0e6",
      ink2: "rgba(244,240,230,.76)",
      ink3: "rgba(244,240,230,.60)",
      line2: "rgba(244,240,230,.12)",
      gold: "rgba(214,177,104,.95)",
      shadow: "rgba(0,0,0,.55)",
      fontFamily: 'ui-serif, Georgia, "Times New Roman", Times, serif',
    }),
    []
  )

  const styles = useMemo(() => {
    const pillBase = {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "7px 10px",
      borderRadius: 999,
      border: "1px solid rgba(244,240,230,.14)",
      background: "rgba(0,0,0,.22)",
      fontSize: 12,
      letterSpacing: ".14em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }

    const pillByStatus = (s) => {
      const st = normalizeStatus(s)
      if (st === "paid" || st === "succeeded" || st === "payment_succeeded" || st === "payment succeeded") {
        return {
          ...pillBase,
          borderColor: "rgba(214,177,104,.30)",
          background: "rgba(214,177,104,.08)",
          color: tokens.gold,
        }
      }
      if (st === "canceled") {
        return {
          ...pillBase,
          borderColor: "rgba(244,240,230,.18)",
          background: "rgba(0,0,0,.30)",
          color: "rgba(244,240,230,.70)",
        }
      }
      if (st === "completed" || st === "complete" || st === "fulfilled" || st === "done") {
        return {
          ...pillBase,
          borderColor: "rgba(214,177,104,.26)",
          background: "rgba(214,177,104,.06)",
          color: "rgba(244,240,230,.90)",
        }
      }
      return {
        ...pillBase,
        borderColor: "rgba(244,240,230,.16)",
        background: "rgba(0,0,0,.22)",
        color: "rgba(244,240,230,.80)",
      }
    }

    const btnBase = {
      appearance: "none",
      border: "1px solid rgba(244,240,230,.14)",
      background: "rgba(0,0,0,.22)",
      color: "rgba(244,240,230,.88)",
      borderRadius: 999,
      padding: "9px 12px",
      fontSize: 12,
      letterSpacing: ".14em",
      textTransform: "uppercase",
      cursor: "pointer",
      userSelect: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      whiteSpace: "nowrap",
      outline: "none",
    }

    const btnGold = {
      ...btnBase,
      borderColor: "rgba(214,177,104,.32)",
      background: "linear-gradient(180deg, rgba(214,177,104,.16), rgba(0,0,0,.16))",
      color: tokens.gold,
    }

    return {
      shell: {
        position: "relative",
        minHeight: "100vh",
        background:
          "radial-gradient(1200px 700px at 20% 0%, rgba(244,240,230,.07), transparent 60%)," +
          "radial-gradient(900px 600px at 80% 20%, rgba(214,177,104,.08), transparent 55%)," +
          "linear-gradient(180deg, #050506 0%, #09090b 65%, #070708 100%)",
        color: tokens.ink,
        fontFamily: tokens.fontFamily,
        padding: 18,
      },

      bgTexture: {
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(2px 2px at 10% 20%, rgba(244,240,230,.08), transparent 55%)," +
          "radial-gradient(2px 2px at 60% 40%, rgba(244,240,230,.06), transparent 55%)," +
          "radial-gradient(2px 2px at 30% 70%, rgba(244,240,230,.05), transparent 55%)," +
          "radial-gradient(2px 2px at 80% 80%, rgba(244,240,230,.06), transparent 55%)," +
          "linear-gradient(90deg, rgba(255,255,255,.02), rgba(255,255,255,0))",
        opacity: 0.55,
        pointerEvents: "none",
        mixBlendMode: "screen",
      },

      frame: { position: "relative", maxWidth: 980, margin: "0 auto" },

      headerCard: {
        border: `1px solid ${tokens.line2}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(244,240,230,.06), rgba(244,240,230,.02))",
        boxShadow: `0 18px 60px ${tokens.shadow}`,
        padding: "14px 14px 12px",
        overflow: "hidden",
      },

      headerTop: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      },

      kicker: {
        letterSpacing: ".18em",
        textTransform: "uppercase",
        fontSize: 12,
        color: tokens.ink3,
        marginBottom: 6,
      },

      title: { margin: 0, fontSize: 26, lineHeight: 1.06, letterSpacing: ".02em" },

      subtitle: {
        marginTop: 8,
        fontSize: 12,
        color: tokens.ink2,
        letterSpacing: ".08em",
        textTransform: "uppercase",
      },

      alert: {
        marginTop: 10,
        padding: "10px 12px",
        borderRadius: 14,
        border: "1px solid rgba(244,240,230,.12)",
        background: "rgba(0,0,0,.22)",
        color: "rgba(244,240,230,.85)",
        fontSize: 13,
        lineHeight: 1.35,
      },

      sectionCard: {
        marginTop: 12,
        border: `1px solid ${tokens.line2}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(244,240,230,.055), rgba(244,240,230,.02))",
        boxShadow: `0 18px 60px ${tokens.shadow}`,
        overflow: "hidden",
      },

      sectionHeader: {
        padding: "14px 14px 10px",
        background:
          "radial-gradient(700px 180px at 25% 0%, rgba(214,177,104,.10), transparent 70%)," +
          "radial-gradient(800px 220px at 80% 10%, rgba(244,240,230,.06), transparent 70%)," +
          "rgba(0,0,0,.18)",
        borderBottom: `1px solid ${tokens.line2}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        flexWrap: "wrap",
      },

      sectionTitle: { margin: 0, fontSize: 18, letterSpacing: ".02em" },
      sectionContent: { padding: "10px 12px 14px" },

      listWrap: { display: "grid", gap: 12 },

      orderCard: {
        padding: 12,
        border: "1px solid rgba(244,240,230,.14)",
        borderRadius: 16,
        background:
          "radial-gradient(900px 260px at 20% 0%, rgba(214,177,104,.07), transparent 55%)," +
          "linear-gradient(180deg, rgba(244,240,230,.045), rgba(0,0,0,.02))",
        boxShadow: "0 18px 46px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.035)",
        minWidth: 0,
        position: "relative",
        overflow: "hidden",
      },

      orderInnerFrame: {
        position: "absolute",
        inset: 0,
        borderRadius: 16,
        pointerEvents: "none",
        border: "1px solid rgba(214,177,104,.10)",
        opacity: 0.7,
        mixBlendMode: "screen",
      },

      orderAccent: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
        background: "rgba(214,177,104,.14)",
        boxShadow: "0 0 22px rgba(214,177,104,0.10)",
      },

      orderCornerGlow: {
        position: "absolute",
        right: -60,
        top: -60,
        width: 180,
        height: 180,
        borderRadius: 999,
        background: "radial-gradient(circle, rgba(214,177,104,0.16), transparent 62%)",
        filter: "blur(2px)",
        pointerEvents: "none",
        opacity: 0.8,
      },

      orderTop: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
        flexWrap: "wrap",
      },

      orderId: {
        fontSize: 15,
        letterSpacing: ".02em",
        color: "rgba(244,240,230,.92)",
        lineHeight: 1.2,
        wordBreak: "break-word",
        margin: 0,
      },

      orderMeta: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 1.35,
        color: "rgba(244,240,230,.66)",
      },

      customerLine: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 1.35,
        color: "rgba(244,240,230,.72)",
        letterSpacing: ".02em",
      },

      orderMeta2: {
        marginTop: 6,
        fontSize: 12,
        lineHeight: 1.35,
        color: "rgba(244,240,230,.56)",
        letterSpacing: ".06em",
        textTransform: "uppercase",
      },

      timePill: {
        marginTop: 8,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 10px",
        borderRadius: 999,
        border: "1px solid rgba(244,240,230,.14)",
        background: "rgba(0,0,0,.22)",
        fontSize: 12,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,.84)",
        whiteSpace: "nowrap",
      },

      pill: pillByStatus,

      btn: btnBase,
      btnGold,

      row: {
        marginTop: 10,
        paddingTop: 10,
        borderTop: "1px solid rgba(244,240,230,.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        flexWrap: "wrap",
      },

      totalPill: {
        fontSize: 13,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: tokens.gold,
        padding: "7px 10px",
        borderRadius: 999,
        border: "1px solid rgba(214,177,104,.30)",
        background: "rgba(214,177,104,.08)",
        whiteSpace: "nowrap",
      },

      breakdown: {
        marginTop: 10,
        paddingTop: 10,
        borderTop: "1px solid rgba(244,240,230,.10)",
        display: "grid",
        gap: 6,
      },

      breakdownRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        fontSize: 13,
        lineHeight: 1.3,
        color: "rgba(244,240,230,.70)",
      },

      breakdownLabel: {
        letterSpacing: ".06em",
        textTransform: "uppercase",
        fontSize: 12,
        color: "rgba(244,240,230,.62)",
      },

      breakdownValue: { color: "rgba(244,240,230,.90)" },

      itemsWrap: { marginTop: 10, display: "grid", gap: 10 },

      itemCard: {
        padding: 12,
        border: "1px solid rgba(244,240,230,.12)",
        borderRadius: 14,
        background: "linear-gradient(180deg, rgba(244,240,230,.035), rgba(0,0,0,0.0))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        minWidth: 0,
      },

      // NEW: clickable image (cursor + subtle hover)
      itemImgBtn: {
        border: "none",
        padding: 0,
        margin: 0,
        background: "transparent",
        cursor: "pointer",
        flex: "0 0 auto",
        borderRadius: 12,
        outline: "none",
      },

      itemImg: {
        width: 52,
        height: 52,
        borderRadius: 12,
        border: "1px solid rgba(244,240,230,.12)",
        background: "rgba(0,0,0,.25)",
        objectFit: "cover",
        transform: "scale(1.03)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
        display: "block",
      },

      itemLeft: { minWidth: 0, flex: 1 },

      itemName: {
        fontSize: 14,
        letterSpacing: ".02em",
        color: "rgba(244,240,230,.92)",
        lineHeight: 1.2,
        wordBreak: "break-word",
      },

      itemMeta: {
        marginTop: 6,
        fontSize: 13,
        lineHeight: 1.35,
        color: "rgba(244,240,230,.66)",
      },

      btnShineWrap: {
        position: "relative",
        overflow: "hidden",
        isolation: "isolate",
      },

      btnShineSweep: {
        position: "absolute",
        inset: -2,
        pointerEvents: "none",
        opacity: 0.0,
        background:
          "linear-gradient(120deg, transparent 0%, rgba(214,177,104,0.45) 18%, rgba(244,240,230,0.22) 28%, transparent 45%)",
        transform: "translateX(-140%)",
        filter: "blur(0.2px)",
        mixBlendMode: "screen",
        zIndex: 0,
      },

      // NEW: modal overlay + image frame
      modalOverlay: {
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      },

      modalFrame: {
        position: "relative",
        maxWidth: "min(920px, 96vw)",
        maxHeight: "min(680px, 86vh)",
        borderRadius: 18,
        border: "1px solid rgba(244,240,230,0.14)",
        background:
          "radial-gradient(900px 400px at 25% 0%, rgba(214,177,104,0.10), transparent 60%)," +
          "linear-gradient(180deg, rgba(244,240,230,0.05), rgba(0,0,0,0.35))",
        boxShadow: "0 26px 90px rgba(0,0,0,0.65)",
        overflow: "hidden",
        cursor: "pointer", // per request: clicking inside closes too
      },

      modalImg: {
        width: "100%",
        height: "100%",
        display: "block",
        objectFit: "contain",
        background: "rgba(0,0,0,0.30)",
      },

      modalCaption: {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 10,
        padding: "8px 10px",
        borderRadius: 14,
        border: "1px solid rgba(244,240,230,0.12)",
        background: "rgba(0,0,0,0.45)",
        color: "rgba(244,240,230,0.86)",
        fontSize: 12,
        letterSpacing: ".08em",
        textTransform: "uppercase",
        lineHeight: 1.35,
        pointerEvents: "none",
      },
    }
  }, [tokens])

  useEffect(() => {
    setErr("")
    setLoading(true)

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

        // IMPORTANT CHANGE:
        // Only show orders that are PAID or COMPLETED.
        // (We do this client-side so you don’t need to add Firestore composite indexes
        // or change your write logic.)
        const filtered = list.filter((o) => isPaid(o) || isCompleted(o))

        setOrders(filtered)
        setLoading(false)
      },
      (e) => {
        console.error(e)
        setErr(e?.message || "Failed to load orders")
        setLoading(false)
      }
    )

    return () => unsub?.()
  }, [])

  const { activeOrders, completedOrders } = useMemo(() => {
    const active = []
    const completed = []
    for (const o of orders) {
      if (isCompleted(o)) completed.push(o)
      else active.push(o) // remaining are "paid" (since we filtered)
    }
    return { activeOrders: active, completedOrders: completed }
  }, [orders])

  async function markCompleted(orderDocId) {
    if (!orderDocId) return
    if (busyId) return
    setBusyId(orderDocId)
    setErr("")
    try {
      await updateDoc(doc(db, "orders", orderDocId), {
        status: "completed",
        completedAt: serverTimestamp(),
      })
    } catch (e) {
      setErr(e?.message || "Failed to mark completed")
    } finally {
      setBusyId("")
    }
  }

  function openImageModal(src, alt) {
    if (!src) return
    setImgModal({ open: true, src: String(src), alt: String(alt || "") })
  }

  function closeImageModal() {
    setImgModal({ open: false, src: "", alt: "" })
  }

  const renderOrderCard = (o) => {
    const displayId = orderDisplayId(o)
    const status = normalizeStatus(o?.status || "pending")
    const items = Array.isArray(o?.items) ? o.items : []

    // Add 8% tax on top of the existing base amount (treated as pre-tax)
    const baseAmount = o?.subtotal ?? o?.total ?? 0
    const baseCents = toCents(baseAmount)
    const taxCents = Math.round(baseCents * 0.08)
    const totalWithTaxCents = baseCents + taxCents

    const itemCount = items.reduce((acc, it) => acc + Number(it?.qty || 0), 0)
    const customerName = resolveCustomerName(o)

    const createdMs =
      toMs(o?.paidAt) || 0
    const completedMs =
      toMs(o?.completedAt) || toMs(o?.completed_at) || toMs(o?.stripe?.completedAt) || 0

    const createdLabel = createdMs ? new Date(createdMs).toLocaleString() : ""
    const completedLabel = completedMs ? new Date(completedMs).toLocaleString() : ""

    const active = !isCompleted(o)
    const activeDurationMs = createdMs ? (active ? nowMs - createdMs : 0) : 0
    const completedDurationMs = createdMs && completedMs ? completedMs - createdMs : 0

    const { goldA, inkA } = accentFromId(o?.id || displayId)

    // Keep shadows consistent so Framer Motion can interpolate
    const btnShadowBase = "0 10px 28px rgba(0,0,0,0.35), 0 0 18px rgba(214,177,104,0.10)"
    const btnShadowHover = "0 14px 34px rgba(0,0,0,0.42), 0 0 22px rgba(214,177,104,0.18)"
    const btnShadowBusy = "0 0 0 rgba(0,0,0,0.00), 0 0 0 rgba(214,177,104,0.00)"

    return (
      <motion.div
        key={o.id}
        style={{
          ...styles.orderCard,
          borderColor: isCompleted(o) ? "rgba(214,177,104,0.20)" : "rgba(244,240,230,0.16)",
        }}
        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.18 }}
        whileHover={{
          y: -3,
          boxShadow:
            "0 22px 60px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            ...styles.orderAccent,
            background: `rgba(214,177,104,${goldA})`,
            boxShadow: `0 0 26px rgba(214,177,104,${Math.max(0.08, goldA - 0.02)})`,
          }}
        />

        <div
          aria-hidden="true"
          style={{
            ...styles.orderCornerGlow,
            background: `radial-gradient(circle, rgba(214,177,104,${Math.max(
              0.08,
              goldA - 0.02
            )}), transparent 62%)`,
            opacity: 0.9,
          }}
        />

        <div
          aria-hidden="true"
          style={{
            ...styles.orderInnerFrame,
            borderColor: `rgba(244,240,230,${Math.max(0.08, inkA)})`,
          }}
        />

        <div style={styles.orderTop}>
          <div style={{ minWidth: 0 }}>
            <p style={styles.orderId}>Order #{displayId}</p>

            {customerName ? (
              <div style={styles.customerLine}>
                Customer:{" "}
                <span style={{ color: "rgba(244,240,230,.92)" }}>{customerName}</span>
              </div>
            ) : null}

            <div style={styles.orderMeta}>
              {items.length} line item{items.length === 1 ? "" : "s"} · {itemCount} total qty ·{" "}
              Subtotal {money(centsToMoney(baseCents))}
            </div>

            {active ? (
              createdMs ? (
                <div style={styles.timePill}>
                  Active for:{" "}
                  <span style={{ color: "rgba(244,240,230,.92)" }}>
                    {formatDuration(activeDurationMs)}
                  </span>
                </div>
              ) : (
                <div style={styles.timePill}>Active for: —</div>
              )
            ) : (
              <div style={styles.timePill}>
                Completed:{" "}
                <span style={{ color: "rgba(244,240,230,.92)" }}>
                  {completedLabel || "—"}
                </span>
                {createdMs && completedMs ? (
                  <>
                    {" "}
                    · Duration{" "}
                    <span style={{ color: "rgba(244,240,230,.92)" }}>
                      {formatDuration(completedDurationMs)}
                    </span>
                  </>
                ) : null}
              </div>
            )}

            {createdLabel && active ? (
              <div style={styles.orderMeta2}>Created: {createdLabel}</div>
            ) : null}
          </div>

          <div style={styles.pill(status)}>Status: {status || "pending"}</div>
        </div>

        {/* Items with pictures */}
        {items.length ? (
          <div style={styles.itemsWrap}>
            {items.map((it, idx) => {
              const imgSrc = resolveItemImage(it)
              const alt = it?.name || "Item"
              return (
                <motion.div
                  key={idx}
                  style={styles.itemCard}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                >
                  {imgSrc ? (
                    <motion.button
                      type="button"
                      style={styles.itemImgBtn}
                      onClick={() => openImageModal(imgSrc, alt)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={`View image for ${alt}`}
                    >
                      <img
                        style={styles.itemImg}
                        src={imgSrc}
                        alt={alt}
                        draggable="false"
                      />
                    </motion.button>
                  ) : (
                    <div style={styles.itemImg} aria-hidden="true" />
                  )}

                  <div style={styles.itemLeft}>
                    <div style={styles.itemName}>{it?.name || "Item"}</div>
                    <div style={styles.itemMeta}>
                      Qty {it?.qty ?? 0} · {money(it?.unitPrice)}
                    </div>
                  </div>

                  <div style={styles.totalPill}>{money(it?.unitPrice)}</div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div style={{ ...styles.orderMeta, marginTop: 10 }}>No items on this order.</div>
        )}

        {/* Subtotal/Tax/Total breakdown */}
        <div style={styles.breakdown}>
          <div style={styles.breakdownRow}>
            <div style={styles.breakdownLabel}>Subtotal</div>
            <div style={styles.breakdownValue}>{money(centsToMoney(baseCents))}</div>
          </div>
          <div style={styles.breakdownRow}>
            <div style={styles.breakdownLabel}>Tax (8%)</div>
            <div style={styles.breakdownValue}>{money(centsToMoney(taxCents))}</div>
          </div>
          <div style={styles.breakdownRow}>
            <div style={styles.breakdownLabel}>Total</div>
            <div style={{ ...styles.breakdownValue, color: "rgba(214,177,104,.95)" }}>
              {money(centsToMoney(totalWithTaxCents))}
            </div>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.totalPill}>Total: {money(centsToMoney(totalWithTaxCents))}</div>

          {!isCompleted(o) ? (
            <motion.button
              type="button"
              style={{
                ...styles.btnGold,
                ...styles.btnShineWrap,
                opacity: busyId && busyId !== o.id ? 0.55 : 1,
                cursor: busyId && busyId !== o.id ? "not-allowed" : "pointer",
                boxShadow: busyId === o.id ? btnShadowBusy : btnShadowBase,
              }}
              onClick={() => markCompleted(o.id)}
              disabled={Boolean(busyId && busyId !== o.id)}
              whileTap={{ scale: 0.98 }}
              whileHover={{
                y: -1,
                boxShadow: btnShadowHover,
              }}
              transition={{ duration: 0.12 }}
            >
              <motion.span
                aria-hidden="true"
                style={styles.btnShineSweep}
                animate={{
                  opacity: [0.0, 0.35, 0.0],
                  x: ["-140%", "140%", "140%"],
                }}
                transition={{
                  duration: 2.8,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 1.2,
                }}
              />

              <span style={{ position: "relative", zIndex: 1 }}>
                {busyId === o.id ? "Updating…" : "Mark Completed"}
              </span>
            </motion.button>
          ) : (
            <div style={styles.pill("completed")}>Completed</div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div style={styles.shell}>
      <div style={styles.bgTexture} aria-hidden="true" />

      {/* NEW: Image modal (click anywhere inside OR outside closes) */}
      <AnimatePresence initial={false}>
        {imgModal.open ? (
          <motion.div
            key="img-modal"
            style={styles.modalOverlay}
            onClick={closeImageModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <motion.div
              style={styles.modalFrame}
              onClick={closeImageModal}
              initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(6px)" }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <img style={styles.modalImg} src={imgModal.src} alt={imgModal.alt || "Image"} />
              {imgModal.alt ? (
                <div style={styles.modalCaption}>{imgModal.alt}</div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div style={styles.frame}>
        <motion.header
          style={styles.headerCard}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.22 }}
        >
          <div style={styles.headerTop}>
            <div style={{ minWidth: 0 }}>
              <div style={styles.kicker}>Admin</div>
              <h1 style={styles.title}>Orders</h1>
              <div style={styles.subtitle}>
                {loading
                  ? "Loading…"
                  : `${orders.length} total · ${activeOrders.length} active · ${completedOrders.length} completed`}
              </div>
            </div>

            <div style={styles.pill("paid")}>Realtime: On</div>
          </div>

          {err ? <div style={styles.alert}>{err}</div> : null}
        </motion.header>

        {/* ACTIVE ORDERS */}
        <section style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Active Orders</h2>
            <div style={styles.totalPill}>{activeOrders.length} active</div>
          </div>

          <div style={styles.sectionContent}>
            {loading ? <div style={styles.alert}>Loading orders…</div> : null}

            {!loading && activeOrders.length === 0 ? (
              <div style={styles.alert}>No active orders.</div>
            ) : (
              <div style={styles.listWrap}>
                <AnimatePresence initial={false}>
                  {activeOrders.map((o) => renderOrderCard(o))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>

        {/* COMPLETED ORDERS */}
        <section style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Completed Orders</h2>
            <div style={styles.totalPill}>{completedOrders.length} completed</div>
          </div>

          <div style={styles.sectionContent}>
            {!loading && completedOrders.length === 0 ? (
              <div style={styles.alert}>No completed orders yet.</div>
            ) : (
              <div style={styles.listWrap}>
                <AnimatePresence initial={false}>
                  {completedOrders.map((o) => renderOrderCard(o))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
