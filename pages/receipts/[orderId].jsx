// pages/receipts/[orderId].jsx
// Requires: @mui/material, framer-motion, firebase/firestore
// Reads: Firestore collection "testOrders", doc id from URL param [orderId]
// Example: http://localhost:3000/receipts/XSZBja1kv16DnwY29Dpu

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import { Box, Typography, Divider, Button } from "@mui/material"
import { motion } from "framer-motion"

import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../../Firebase/FirebaseInit" // <-- adjust if needed

export default function ReceiptPage({ maxWidth = 1200, minHeight = "100vh" }) {
  const router = useRouter()
  const { orderId } = router.query

  const gradient = "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)"

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")

  useEffect(() => {
    if (!router.isReady) return
    if (!orderId) return

    setLoading(true)
    setErr("")

    const ref = doc(db, "testOrders", String(orderId))

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setOrder(null)
          setErr("Receipt not found.")
          setLoading(false)
          return
        }
        setOrder({ id: snap.id, ...snap.data() })
        setLoading(false)
      },
      (e) => {
        setOrder(null)
        setErr(e?.message || "Failed to load receipt.")
        setLoading(false)
      }
    )

    return () => {
      try {
        unsub()
      } catch {}
    }
  }, [router.isReady, orderId])

  const receipt = useMemo(() => {
    const o = order || {}
    const stripe = o.stripe || {}
    const currency = String(stripe.currency || o.currency || "usd").toUpperCase()

    const totalCents =
      typeof stripe.totalCents === "number"
        ? stripe.totalCents
        : typeof stripe.amountTotal === "number"
          ? stripe.amountTotal
          : typeof o.totalCents === "number"
            ? o.totalCents
            : null

    const subtotalCents =
      typeof stripe.subtotalCents === "number"
        ? stripe.subtotalCents
        : typeof o.subtotalCents === "number"
          ? o.subtotalCents
          : null

    const taxCents =
      typeof stripe.taxCents === "number"
        ? stripe.taxCents
        : typeof o.taxCents === "number"
          ? o.taxCents
          : null

    const taxRate =
      typeof stripe.taxRate === "number"
        ? stripe.taxRate
        : typeof o.taxRate === "number"
          ? o.taxRate
          : null

    const derivedSubtotalCents =
      subtotalCents ??
      (totalCents != null && taxCents != null
        ? Math.max(0, totalCents - taxCents)
        : null)

    const derivedTaxCents =
      taxCents ??
      (totalCents != null && subtotalCents != null
        ? Math.max(0, totalCents - subtotalCents)
        : null)

    const derivedTotalCents =
      totalCents ??
      (subtotalCents != null && taxCents != null
        ? subtotalCents + taxCents
        : null)

    const items = Array.isArray(o.items)
      ? o.items.map((item, idx) => {
          const unitAmount =
            typeof item?.unitAmount === "number"
              ? item.unitAmount
              : typeof item?.unitPrice === "number"
                ? Math.round(item.unitPrice * 100)
                : null

          const qty =
            typeof item?.qty === "number"
              ? item.qty
              : Number(item?.qty) || 0

          const lineTotalCents =
            typeof item?.lineTotal === "number"
              ? Math.round(item.lineTotal * 100)
              : unitAmount != null && qty > 0
                ? unitAmount * qty
                : null

          return {
            id: `${idx}-${item?.name || "item"}`,
            name: String(item?.name || "Item"),
            qty,
            unitAmount,
            lineTotalCents,
            image: typeof item?.image === "string" ? item.image : "",
          }
        })
      : []

    return {
      status: String(o.status || "—"),
      orderId: String(o.orderId || o.id || orderId || "—"),
      currency,

      customerName: String(stripe.customerName || o.customerName || "—"),
      customerEmail: String(stripe.customerEmail || o.customerEmail || "—"),

      paymentIntent: String(stripe.paymentIntent || "—"),
      sessionId: String(stripe.sessionId || stripe.stripeSessionId || "—"),
      eventId: String(stripe.eventId || "—"),
      livemode: !!stripe.livemode,

      subtotalCents: derivedSubtotalCents,
      taxCents: derivedTaxCents,
      totalCents: derivedTotalCents,
      taxRate,
      items,

      createdAt: o.createdAt || null,
      paidAt: o.paidAt || o.updatedAt || null,
      updatedAt: o.updatedAt || null,
    }
  }, [order, orderId])

  const money = (cents, currencyCode) => {
    if (typeof cents !== "number" || !Number.isFinite(cents)) return "—"
    const v = cents / 100
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode || "USD",
      }).format(v)
    } catch {
      return `$${v.toFixed(2)}`
    }
  }

  const fmtDateTime = (ts) => {
    if (!ts) return "—"
    try {
      if (typeof ts?.toDate === "function") return ts.toDate().toLocaleString()
      const d = ts instanceof Date ? ts : new Date(ts)
      if (Number.isNaN(d.getTime())) return "—"
      return d.toLocaleString()
    } catch {
      return "—"
    }
  }

  const DetailRow = ({ label, value, mono = false }) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 2,
        py: 0.75,
      }}
    >
      <Typography
        variant="body2"
        sx={{ color: "rgba(216, 229, 254, 0.72)", letterSpacing: 0.6 }}
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: "rgba(216, 229, 254, 0.92)",
          fontFamily: mono
            ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
            : "Bemora",
          letterSpacing: mono ? 0 : 0.6,
          textAlign: "right",
          wordBreak: "break-word",
          maxWidth: "65%",
        }}
      >
        {value}
      </Typography>
    </Box>
  )

  const BackToFinanceButton = ({ fullWidth = false }) => (
    <Button
      onClick={() => router.push("/finance")}
      variant="outlined"
      fullWidth={fullWidth}
      sx={{
        borderRadius: 999,
        textTransform: "none",
        px: 2.5,
        py: 1,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 14px 40px rgba(0,0,0,0.28)",
        "&:hover": {
          background: "rgba(8,8,8,0.9)",
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 18px 50px rgba(0,0,0,0.38)",
        },
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          component="span"
          sx={{
            fontFamily: "Bemora",
            fontSize: 28,
            lineHeight: 1,
            transform: "translateY(-1px)",
            backgroundImage: gradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          ←
        </Box>

        <Box
          component="span"
          sx={{
            fontFamily: "Bemora",
            letterSpacing: 0.8,
            lineHeight: 1,
            fontSize: 15.5,
            backgroundImage: gradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Back to Finance
        </Box>
      </Box>
    </Button>
  )

  return (
    <Box sx={{ width: "100%", backgroundColor: "black", minHeight }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minHeight,
          display: "flex",
          justifyContent: "center",
          backgroundColor: "black",
          overflow: "hidden",
        }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.25, ease: "easeOut" }}
          sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <Box
            component={motion.div}
            animate={{ y: [0, 10, 0], opacity: [0.85, 0.95, 0.85] }}
            transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
            sx={{
              position: "absolute",
              left: "-12%",
              top: "-18%",
              width: { xs: 420, sm: 560, md: 720 },
              height: { xs: 420, sm: 560, md: 720 },
              borderRadius: "50%",
              filter: "blur(40px)",
              background:
                "radial-gradient(circle at 30% 30%, rgba(124,58,237,0.35) 0%, rgba(79,70,229,0.16) 40%, rgba(0,0,0,0) 70%)",
            }}
          />
          <Box
            component={motion.div}
            animate={{ y: [0, -12, 0], opacity: [0.8, 0.92, 0.8] }}
            transition={{ duration: 9.5, ease: "easeInOut", repeat: Infinity }}
            sx={{
              position: "absolute",
              right: "-18%",
              bottom: "-22%",
              width: { xs: 520, sm: 680, md: 860 },
              height: { xs: 520, sm: 680, md: 860 },
              borderRadius: "50%",
              filter: "blur(44px)",
              background:
                "radial-gradient(circle at 65% 65%, rgba(34,211,238,0.26) 0%, rgba(79,70,229,0.14) 38%, rgba(0,0,0,0) 72%)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,1) 100%)",
            }}
          />
        </Box>

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth,
            px: { xs: 2, sm: 4 },
            pt: { xs: 10, sm: 12, md: 14 },
            pb: { xs: 10, sm: 12, md: 14 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            sx={{ width: "100%", textAlign: "center" }}
          >
            <Typography
              variant="h3"
              sx={{
                fontFamily: "Bemora",
                letterSpacing: 1.6,
                lineHeight: 1.2,
                backgroundImage: gradient,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                mb: 1.1,
              }}
            >
              Receipt
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "rgba(216, 229, 254, 0.86)",
                lineHeight: 1.65,
                maxWidth: 860,
                mx: "auto",
                wordBreak: "break-word",
              }}
            >
              {orderId ? `Receipt • ${orderId}` : "Loading…"}
            </Typography>

            <Box
              sx={{
                mt: 2.5,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <BackToFinanceButton />
            </Box>
          </Box>

          <Box sx={{ width: "100%", maxWidth: 860, mt: { xs: 4, sm: 5 } }}>
            {loading && (
              <Box
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                sx={{
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.65) 100%)",
                  boxShadow: "0 18px 55px rgba(0,0,0,0.65)",
                  p: { xs: 2.5, sm: 3.25, md: 4 },
                }}
              >
                <Typography
                  variant="overline"
                  sx={{
                    display: "block",
                    letterSpacing: 2.4,
                    color: "rgba(216, 229, 254, 0.72)",
                    mb: 1,
                  }}
                >
                  LOADING
                </Typography>
                <Typography
                  sx={{ color: "rgba(216, 229, 254, 0.85)", lineHeight: 1.65 }}
                >
                  Fetching receipt data from Firestore…
                </Typography>
              </Box>
            )}

            {!loading && !!err && (
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: "easeOut" }}
                sx={{
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.65) 100%)",
                  boxShadow: "0 18px 55px rgba(0,0,0,0.65)",
                  overflow: "hidden",
                }}
              >
                <Box sx={{ height: 3, backgroundImage: gradient, opacity: 0.9 }} />
                <Box sx={{ p: { xs: 2.5, sm: 3.25, md: 4 } }}>
                  <Typography
                    variant="overline"
                    sx={{
                      display: "block",
                      letterSpacing: 2.4,
                      color: "rgba(216, 229, 254, 0.72)",
                      mb: 1,
                    }}
                  >
                    ERROR
                  </Typography>
                  <Typography
                    sx={{ color: "rgba(255, 120, 120, 0.9)", lineHeight: 1.6 }}
                  >
                    {err}
                  </Typography>

                  <Box sx={{ mt: 2.25 }}>
                    <BackToFinanceButton fullWidth />
                  </Box>
                </Box>
              </Box>
            )}

            {!loading && !err && order && (
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, ease: "easeOut" }}
                sx={{
                  width: "100%",
                  borderRadius: 4,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 45%, rgba(0,0,0,0.65) 100%)",
                  boxShadow: "0 18px 55px rgba(0,0,0,0.65)",
                }}
              >
                <Box sx={{ height: 3, backgroundImage: gradient, opacity: 0.9 }} />

                <Box sx={{ p: { xs: 2.5, sm: 3.25, md: 4 } }}>
                  <Typography
                    variant="overline"
                    sx={{
                      display: "block",
                      letterSpacing: 2.4,
                      color: "rgba(216, 229, 254, 0.72)",
                      mb: 1,
                    }}
                  >
                    ORDER RECEIPT
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      sx={{
                        fontFamily: "Bemora",
                        letterSpacing: 0.8,
                        fontSize: { xs: 20, sm: 22, md: 26 },
                        backgroundImage: gradient,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                        mb: 0.5,
                      }}
                    >
                      {receipt.status === "paid" ? "Payment Confirmed" : "Order"}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(216, 229, 254, 0.78)",
                        lineHeight: 1.65,
                        wordBreak: "break-word",
                      }}
                    >
                      Order ID:{" "}
                      <span
                        style={{
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        }}
                      >
                        {receipt.orderId}
                      </span>{" "}
                      • {receipt.currency}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      alignItems: "stretch",
                      gap: 2.5,
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        minWidth: 0,
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(0,0,0,0.28)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        p: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(216, 229, 254, 0.72)",
                          letterSpacing: 1.2,
                          mb: 1.25,
                        }}
                      >
                        AMOUNT PAID
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: "Bemora",
                          fontSize: { xs: 34, sm: 40, md: 44 },
                          letterSpacing: 1,
                          lineHeight: 1.05,
                          backgroundImage: gradient,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                          textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                        }}
                      >
                        {money(receipt.totalCents, receipt.currency)}
                      </Typography>

                      <Box sx={{ mt: 1.5 }}>
                        <DetailRow
                          label="Subtotal"
                          value={money(receipt.subtotalCents, receipt.currency)}
                        />
                        <DetailRow
                          label="Tax"
                          value={`${money(receipt.taxCents, receipt.currency)}${
                            typeof receipt.taxRate === "number"
                              ? `  (${Math.round(receipt.taxRate * 100)}%)`
                              : ""
                          }`}
                        />
                        <Divider
                          sx={{ my: 1.25, borderColor: "rgba(255,255,255,0.10)" }}
                        />
                        <DetailRow
                          label="Total"
                          value={money(receipt.totalCents, receipt.currency)}
                        />
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        flex: 1,
                        minWidth: { xs: "100%", md: 380 },
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(0,0,0,0.22)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        p: 2,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(216, 229, 254, 0.72)",
                          letterSpacing: 1.2,
                          mb: 1.25,
                        }}
                      >
                        DETAILS
                      </Typography>

                      <br />

                      <DetailRow label="Customer" value={receipt.customerName} />
                      <DetailRow label="Email" value={receipt.customerEmail} mono />
                      <DetailRow label="Status" value={receipt.status} />
                      <DetailRow label="Paid at" value={fmtDateTime(receipt.paidAt)} />
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mt: 2.5,
                      borderRadius: 3,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(0,0,0,0.22)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: "1px solid rgba(255,255,255,0.10)",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(216, 229, 254, 0.72)",
                          letterSpacing: 1.2,
                        }}
                      >
                        LINE ITEMS
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2 }}>
                      {!receipt.items.length ? (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "rgba(216, 229, 254, 0.72)",
                            lineHeight: 1.65,
                          }}
                        >
                          No line items found.
                        </Typography>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                          {receipt.items.map((item) => (
                            <Box
                              key={item.id}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1.5,
                                borderRadius: 2.5,
                                border: "1px solid rgba(255,255,255,0.08)",
                                background: "rgba(255,255,255,0.03)",
                                px: { xs: 1.25, sm: 1.5 },
                                py: { xs: 1.25, sm: 1.5 },
                              }}
                            >
                              <Box
                                sx={{
                                  width: { xs: 56, sm: 68 },
                                  height: { xs: 56, sm: 68 },
                                  minWidth: { xs: 56, sm: 68 },
                                  borderRadius: 2,
                                  overflow: "hidden",
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  background: item.image
                                    ? `center / cover no-repeat url(${item.image})`
                                    : "linear-gradient(135deg, rgba(124,58,237,0.22), rgba(34,211,238,0.14))",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {!item.image && (
                                  <Typography
                                    sx={{
                                      fontFamily: "Bemora",
                                      fontSize: 18,
                                      color: "rgba(216, 229, 254, 0.9)",
                                    }}
                                  >
                                    {String(item.name || "I").charAt(0).toUpperCase()}
                                  </Typography>
                                )}
                              </Box>

                              <Box
                                sx={{
                                  flex: 1,
                                  minWidth: 0,
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 0.35,
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: "rgba(216, 229, 254, 0.94)",
                                    fontFamily: "Bemora",
                                    letterSpacing: 0.5,
                                    fontSize: { xs: 15, sm: 16 },
                                    lineHeight: 1.25,
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {item.name}
                                </Typography>

                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "rgba(216, 229, 254, 0.72)",
                                    lineHeight: 1.55,
                                  }}
                                >
                                  {money(item.unitAmount, receipt.currency)} each • Qty {item.qty}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  minWidth: { xs: 84, sm: 110 },
                                  textAlign: "right",
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: "rgba(216, 229, 254, 0.94)",
                                    fontFamily:
                                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                                    fontSize: { xs: 13, sm: 14 },
                                    letterSpacing: 0.2,
                                  }}
                                >
                                  {money(item.lineTotalCents, receipt.currency)}
                                </Typography>
                              </Box>
                            </Box>
                          ))}

                          <Divider
                            sx={{
                              my: 0.25,
                              borderColor: "rgba(255,255,255,0.10)",
                            }}
                          />

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.6,
                              px: { xs: 0.25, sm: 0.5 },
                            }}
                          >
                            <DetailRow
                              label="Items subtotal"
                              value={money(receipt.subtotalCents, receipt.currency)}
                            />
                            <DetailRow
                              label="Sales tax"
                              value={`${money(receipt.taxCents, receipt.currency)}${
                                typeof receipt.taxRate === "number"
                                  ? `  (${Math.round(receipt.taxRate * 100)}%)`
                                  : ""
                              }`}
                            />
                            <Divider
                              sx={{
                                my: 0.5,
                                borderColor: "rgba(255,255,255,0.10)",
                              }}
                            />
                            <DetailRow
                              label="Grand total"
                              value={money(receipt.totalCents, receipt.currency)}
                            />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mt: 2.5,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <BackToFinanceButton />
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}