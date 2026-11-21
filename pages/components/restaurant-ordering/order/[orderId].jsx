// pages/components/restaurant-ordering/order/[orderId].jsx
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/router"
import { motion } from "framer-motion"

// NEW: Firestore realtime listener
import { db } from "../../../../Firebase/FirebaseInit"
import { doc, onSnapshot } from "firebase/firestore"

function money(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return "—"
  const s = n.toFixed(2)
  return s.endsWith("00") ? `$${n.toFixed(0)}` : `$${s}`
}

// Mirrors the Menu component’s category-image pattern (category → image path).
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
  return String(v || "")
    .trim()
    .toLowerCase()
}

// Best-effort category inference from item name when your order items don’t carry a category.
// If your order objects already include `category` or `image`, those will win.
function inferCategoryFromName(name) {
  const n = String(name || "").toLowerCase()

  if (n.includes("pizza") || n.includes("slice")) return "pizza"
  if (n.includes("ravioli") || n.includes("spaghetti") || n.includes("pasta") || n.includes("ziti")) return "pasta"
  if (n.includes("salad") || n.includes("caesar") || n.includes("spinach")) return "salads"
  if (n.includes("sandwich") || n.includes("hero") || n.includes("focaccia") || n.includes("steak"))
    return "sandwiches"
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
  if (n.includes("cake") || n.includes("cheesecake") || n.includes("dessert") || n.includes("chocolate"))
    return "desserts"

  return ""
}

// NEW: format Firestore Timestamp/Date-ish to readable string
function formatWhen(v) {
  try {
    if (v && typeof v === "object" && typeof v.toDate === "function") {
      return v.toDate().toLocaleString()
    }
    if (v instanceof Date) return v.toLocaleString()
    if (typeof v === "number") return new Date(v).toLocaleString()
    if (typeof v === "string") {
      const d = new Date(v)
      if (!Number.isNaN(d.getTime())) return d.toLocaleString()
    }
  } catch {}
  return ""
}

export default function OrderPage() {
  const router = useRouter()
  const { orderId, canceled } = router.query

  const oid = useMemo(() => (Array.isArray(orderId) ? orderId[0] : orderId) || "", [orderId])

  const [order, setOrder] = useState(null)
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(true)

  // kept (but no longer used for polling); harmless if you want to remove later
  const inFlight = useRef(false)

  // NEW: image modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalImg, setModalImg] = useState("")

  const openImg = (src) => {
    if (!src) return
    setModalImg(String(src))
    setModalOpen(true)
  }
  const closeImg = () => {
    setModalOpen(false)
    setModalImg("")
  }

  const status = useMemo(() => {
    const s = order?.status || (canceled ? "canceled" : "pending")
    return String(s || "pending").toLowerCase()
  }, [order?.status, canceled])

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

  // Resolve an item image the same “category image” way your Menu does:
  // 1) explicit item.image/item.img
  // 2) item.category (or common alternates)
  // 3) infer from name
  // 4) fallback
  const resolveItemImage = (it) => {
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

  // Customer name display resolution
  const customerName = useMemo(() => {
    const n =
      order?.customerName ||
      order?.customer?.name ||
      order?.stripe?.customerName ||
      order?.stripe?.customer?.name ||
      ""
    return String(n || "").trim()
  }, [order])

  // NEW: completed time label (shows if present)
  const completedLabel = useMemo(() => {
    const v = order?.completedAt || order?.completed_at || order?.completed_on || order?.stripe?.completedAt || null
    return formatWhen(v)
  }, [order])

  // NEW: compute subtotal/tax/total (8% tax) for summary
  const TAX_RATE = 0.08

  const subtotal = useMemo(() => {
    const v = order?.subtotal ?? order?.total
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }, [order])

  const tax = useMemo(() => {
    // round to cents for display + total math consistency
    const raw = subtotal * TAX_RATE
    return Math.round(raw * 100) / 100
  }, [subtotal])

  const grandTotal = useMemo(() => {
    return Math.round((subtotal + tax) * 100) / 100
  }, [subtotal, tax])

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
      if (s === "paid") {
        return {
          ...pillBase,
          borderColor: "rgba(214,177,104,.30)",
          background: "rgba(214,177,104,.08)",
          color: tokens.gold,
        }
      }
      if (s === "canceled") {
        return {
          ...pillBase,
          borderColor: "rgba(244,240,230,.18)",
          background: "rgba(0,0,0,.30)",
          color: "rgba(244,240,230,.70)",
        }
      }
      if (s === "completed" || s === "complete" || s === "fulfilled" || s === "done") {
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

      frame: {
        position: "relative",
        maxWidth: 860,
        margin: "0 auto",
      },

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

      title: {
        margin: 0,
        fontSize: 16,
        lineHeight: 1.06,
        letterSpacing: ".02em",
      },

      // small info row under the Order title
      metaRow: {
        marginTop: 10,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
      },

      metaPill: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 10px",
        borderRadius: 999,
        border: "1px solid rgba(244,240,230,.14)",
        background: "rgba(0,0,0,.22)",
        fontSize: 12,
        letterSpacing: ".10em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        color: "rgba(244,240,230,.85)",
      },

      statusPill: pillByStatus,

      bodyCard: {
        marginTop: 12,
        border: `1px solid ${tokens.line2}`,
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(244,240,230,.055), rgba(244,240,230,.02))",
        boxShadow: `0 18px 60px ${tokens.shadow}`,
        overflow: "hidden",
      },

      bodyHeader: {
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

      bodyTitle: {
        margin: 0,
        fontSize: 18,
        letterSpacing: ".02em",
      },

      bodyContent: {
        padding: "10px 12px 14px",
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

      itemsWrap: {
        marginTop: 10,
        display: "grid",
        gap: 10,
      },

      itemCard: {
        padding: 12,
        border: "1px solid rgba(244,240,230,.10)",
        borderRadius: 14,
        background: "linear-gradient(180deg, rgba(244,240,230,.03), rgba(0,0,0,.0))",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.03)",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        minWidth: 0,
      },

      itemImgBtn: {
        width: 58,
        height: 58,
        borderRadius: 12,
        border: "1px solid rgba(244,240,230,.12)",
        background: "rgba(0,0,0,.25)",
        flex: "0 0 auto",
        padding: 0,
        cursor: "pointer",
        overflow: "hidden",
        boxShadow: "0 10px 24px rgba(0,0,0,.35)",
      },

      itemImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "scale(1.03)",
        display: "block",
        pointerEvents: "none",
        userSelect: "none",
      },

      itemLeft: { minWidth: 0, flex: 1 },

      itemName: {
        fontSize: 15,
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

      itemRight: { flex: "0 0 auto", marginLeft: "auto" },

      pricePill: {
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

      summaryRow: {
        marginTop: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        paddingTop: 10,
        borderTop: "1px solid rgba(244,240,230,.10)",
      },

      summaryLabel: {
        fontSize: 12,
        letterSpacing: ".18em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,.62)",
      },

      summaryValue: {
        fontSize: 13,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,.90)",
        whiteSpace: "nowrap",
      },

      totalRow: {
        marginTop: 10,
        paddingTop: 12,
        borderTop: "1px solid rgba(244,240,230,.10)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      },

      totalLabel: {
        fontSize: 12,
        letterSpacing: ".18em",
        textTransform: "uppercase",
        color: "rgba(244,240,230,.62)",
      },

      // MODAL
      modalOverlay: {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,.70)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      },

      modalCard: {
        width: "min(920px, 96vw)",
        maxHeight: "88vh",
        borderRadius: 18,
        border: "1px solid rgba(244,240,230,.14)",
        background: "linear-gradient(180deg, rgba(244,240,230,.06), rgba(0,0,0,.18))",
        boxShadow: `0 30px 90px ${tokens.shadow}`,
        overflow: "hidden",
      },

      modalImgWrap: {
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,.30)",
        display: "grid",
        placeItems: "center",
      },

      modalImg: {
        width: "100%",
        height: "auto",
        maxHeight: "88vh",
        objectFit: "contain",
        display: "block",
        userSelect: "none",
      },
    }
  }, [tokens])

  // NEW: realtime subscription to the order doc
  useEffect(() => {
    if (!oid) return

    setErr("")
    setLoading(true)

    const ref = doc(db, "orders", oid)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setOrder(null)
          setErr("Order not found")
          setLoading(false)
          return
        }
        setOrder({ id: snap.id, ...snap.data() })
        setLoading(false)
      },
      (e) => {
        console.error(e)
        setErr(e?.message || "Failed to load order")
        setLoading(false)
      }
    )

    return () => unsub?.()
  }, [oid])

  // NEW: close modal on Escape
  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e) => {
      if (e.key === "Escape") closeImg()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [modalOpen])

  const shouldShowCompleted =
    status === "completed" || status === "complete" || status === "fulfilled" || status === "done"

  return (
    <div style={styles.shell}>
      <div style={styles.bgTexture} aria-hidden="true" />

      {/* NEW: image modal (click anywhere to close) */}
      {modalOpen ? (
        <motion.div
          style={styles.modalOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.14 }}
          onClick={closeImg} // anywhere inside/outside closes
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            style={styles.modalCard}
            initial={{ opacity: 0, y: 10, scale: 0.985, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <div style={styles.modalImgWrap}>
              {modalImg ? <img src={modalImg} alt="Item" style={styles.modalImg} draggable="false" /> : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}

      <div style={styles.frame}>
        <motion.header
          style={styles.headerCard}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.22 }}
        >
          <div style={styles.headerTop}>
            <div style={{ minWidth: 0 }}>
              <div style={styles.kicker}>Order</div>
              <h6 style={styles.title}>Order #{oid || "—"}</h6>

              <div style={styles.metaRow}>
                {customerName ? (
                  <div style={styles.metaPill}>
                    Customer:{" "}
                    <span style={{ color: tokens.ink, letterSpacing: ".02em", textTransform: "none" }}>
                      {customerName}
                    </span>
                  </div>
                ) : null}

                {/* NEW: completed time pill */}
                {shouldShowCompleted && completedLabel ? (
                  <div style={styles.metaPill}>
                    Completed:{" "}
                    <span style={{ color: tokens.ink, letterSpacing: ".02em", textTransform: "none" }}>
                      {completedLabel}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div style={styles.statusPill(status)}>
              Status: {status}
              {loading ? <span style={{ opacity: 0.7 }}>· Updating</span> : null}
            </div>
          </div>
        </motion.header>

        <motion.section
          style={styles.bodyCard}
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.22, delay: 0.03 }}
          aria-live="polite"
        >
          <div style={styles.bodyHeader}>
            <h2 style={styles.bodyTitle}>Items</h2>
            {/* NEW: show grand total (subtotal + 8% tax) */}
            <div style={styles.pricePill}>Total: {money(grandTotal)}</div>
          </div>

          <div style={styles.bodyContent}>
            {err ? <div style={styles.alert}>{err}</div> : null}
            {loading && !order ? <div style={styles.alert}>Loading…</div> : null}

            {order ? (
              <>
                <div style={styles.itemsWrap}>
                  {(order.items || []).map((it, idx) => {
                    const imgSrc = resolveItemImage(it)
                    return (
                      <motion.div
                        key={idx}
                        style={styles.itemCard}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                      >
                        {imgSrc ? (
                          <motion.button
                            type="button"
                            style={styles.itemImgBtn}
                            onClick={() => openImg(imgSrc)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            aria-label={`View image for ${it?.name || "item"}`}
                          >
                            <img style={styles.itemImg} src={imgSrc} alt={it?.name || "Item"} draggable="false" />
                          </motion.button>
                        ) : (
                          <div style={styles.itemImgBtn} aria-hidden="true" />
                        )}

                        <div style={styles.itemLeft}>
                          <div style={styles.itemName}>{it?.name || "Item"}</div>
                          <div style={styles.itemMeta}>
                            Qty {it?.qty ?? 0} · {money(it?.unitPrice)}
                          </div>
                        </div>

                        <div style={styles.itemRight}>
                          <div style={styles.pricePill}>{money(it?.unitPrice)}</div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* NEW: summary breakdown */}
                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Subtotal</div>
                  <div style={styles.summaryValue}>{money(subtotal)}</div>
                </div>

                <div style={styles.summaryRow}>
                  <div style={styles.summaryLabel}>Tax (8%)</div>
                  <div style={styles.summaryValue}>{money(tax)}</div>
                </div>

                <div style={styles.totalRow}>
                  <div style={styles.totalLabel}>Total</div>
                  <div style={styles.pricePill}>{money(grandTotal)}</div>
                </div>
              </>
            ) : null}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
