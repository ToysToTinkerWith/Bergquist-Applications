// pages/contact.jsx  (or /pages/contact/index.jsx)
// Requires: @mui/material, framer-motion, next/head
// + your existing getStripe helper: /lib/get-stripe
//
// Update:
// - ADD: next/head SEO (title, description, canonical, OG/Twitter, JSON-LD)
// - CHANGE: comment out the entire "Pay Bergquist Applications" section (Payment card)
//   (email card remains)

import React, { useEffect, useRef, useState } from "react"
import Head from "next/head"
import { Box, Typography, TextField } from "@mui/material"
import { motion } from "framer-motion"
import getStripe from "../lib/get-stripe" // adjust path if needed (e.g. "../../lib/get-stripe")

function RevealOnScroll({
  children,
  delay = 0,
  threshold = 0.25,
  rootMargin = "0px 0px -12% 0px",
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (shown) return

    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setShown(true)
      return
    }

    const el = ref.current
    if (!el) {
      setShown(true)
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setShown(true)
          obs.disconnect()
        }
      },
      { threshold, root: null, rootMargin }
    )

    obs.observe(el)
    return () => {
      try {
        obs.disconnect()
      } catch {}
    }
  }, [shown, threshold, rootMargin])

  return (
    <Box
      ref={ref}
      component={motion.div}
      initial={false}
      animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
      transition={{ duration: 0.85, ease: "easeOut", delay }}
      sx={{ willChange: "transform, opacity" }}
    >
      {children}
    </Box>
  )
}

function toMoney(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return "—"
  return x.toLocaleString(undefined, { style: "currency", currency: "USD" })
}

// Use integer cents to avoid float rounding issues
function dollarsToCents(dollars) {
  const n = Number(dollars)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n * 100))
}

function centsToDollars(cents) {
  const n = Number(cents)
  if (!Number.isFinite(n)) return 0
  return n / 100
}

export default function ContactPage({
  maxWidth = 1200,
  minHeight = "100vh",
  email = "abergquist96@gmail.com",
}) {
  // ---------------- SEO ----------------
  const SITE_NAME = "Bergquist Applications"
  const SITE_URL = "https://bergquistapplications.com"
  const PAGE_PATH = "/contact"
  const PAGE_URL = `${SITE_URL}${PAGE_PATH}`

  const TITLE = `Contact | ${SITE_NAME}`
  const DESCRIPTION = "Contact Bergquist Applications for modern website and web application development."
  const OG_IMAGE = `${SITE_URL}/og/bergquist-applications.jpg`

  const jsonLdContactPage = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: TITLE,
    url: PAGE_URL,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  }

  // -------------- UI / Logic --------------
  const gradient = "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)"
  const TAX_RATE = 0.08

  const [amount, setAmount] = useState("")
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState("")

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(email)
      } else {
        const ta = document.createElement("textarea")
        ta.value = email
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
      }
    } catch {
      // no-op
    }
  }

  const clampAmountInput = (raw) => {
    if (raw === "") return ""
    const n = Number(raw)
    if (!Number.isFinite(n)) return ""
    if (n < 0) return "0"
    return raw
  }

  // --- Display-only tax math in cents (Checkout charges subtotal ONLY) ---
  const subtotalCents = dollarsToCents(amount)
  const taxCents = Math.round(subtotalCents * TAX_RATE)
  const totalCents = subtotalCents + taxCents

  const subtotal = centsToDollars(subtotalCents)
  const tax = centsToDollars(taxCents)
  const total = centsToDollars(totalCents)

  const redirectToCheckout = async () => {
    setPayError("")

    if (!(subtotalCents > 0)) {
      setPayError("Enter an amount greater than $0.")
      return
    }

    try {
      setPaying(true)

      const response = await fetch("/api/checkout-sessions/direct", {
        method: "POST",
        body: JSON.stringify({
          success_url: window.location.href,
          cancel_url: window.location.href,
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Bergquist Applications Services",
                  description: `Entered amount: ${toMoney(
                    subtotal
                  )}. (8% tax estimate shown on page, not charged in checkout.)`,
                },
                unit_amount: subtotalCents, // ✅ ONLY raw amount goes to Stripe
              },
              quantity: 1,
            },
          ],
          payment_method_types: ["card"],
          mode: "payment",
        }),
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const txt = await response.text().catch(() => "")
        throw new Error(txt || "Failed to create checkout session.")
      }

      const session = await response.json()
      if (!session?.id) throw new Error("Missing session id from /api/checkout-sessions response.")

      const stripe = await getStripe()
      const { error } = await stripe.redirectToCheckout({ sessionId: session.id })
      if (error) throw error
    } catch (e) {
      setPayError(e?.message || "Payment failed. Please try again.")
      setPaying(false)
    }
  }

  const payDisabled = paying || !(subtotalCents > 0)

  return (
    <Box sx={{ width: "100%", backgroundColor: "black", minHeight }}>
      {/* SEO HEAD */}
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="canonical" href={PAGE_URL} />

        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={PAGE_URL} />
        <meta property="og:image" content={OG_IMAGE} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />

        <meta name="theme-color" content="#000000" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdContactPage) }}
        />
      </Head>

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
        {/* Ambient glow blobs */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.25, ease: "easeOut" }}
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          {/* top-left glow */}
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
          {/* bottom-right glow */}
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
          {/* subtle center vignette */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(0,0,0,0.85) 78%, rgba(0,0,0,1) 100%)",
            }}
          />
        </Box>

        {/* Content */}
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
          <RevealOnScroll delay={0.05}>
            <Box sx={{ width: "100%", textAlign: "center" }}>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: "Bemora",
                  letterSpacing: 2,
                  lineHeight: 1.2,
                  backgroundImage: gradient,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                  mb: 1.25,
                }}
              >
                Contact
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: "rgba(216, 229, 254, 0.86)",
                  lineHeight: 1.6,
                  maxWidth: 760,
                  mx: "auto",
                }}
              >
                Email is the fastest way to reach Bergquist Applications.
              </Typography>
            </Box>
          </RevealOnScroll>

          {/* Email card */}
          <RevealOnScroll delay={0.18}>
            <Box
              sx={{
                width: "100%",
                maxWidth: 860,
                mt: { xs: 4, sm: 5 },
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
                  EMAIL
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "stretch", sm: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      component="a"
                      href={`mailto:${email}`}
                      sx={{
                        display: "inline-block",
                        textDecoration: "none",
                        fontFamily: "Bemora",
                        fontSize: { xs: 22, sm: 24, md: 28 },
                        letterSpacing: 0.6,
                        backgroundImage: gradient,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                        wordBreak: "break-word",
                      }}
                    >
                      {email}
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        color: "rgba(216, 229, 254, 0.75)",
                        lineHeight: 1.6,
                      }}
                    >
                      Tap to open your mail client.
                    </Typography>
                  </Box>

                  <Box
                    component={motion.button}
                    onClick={handleCopy}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(0,0,0,0.35)",
                      color: "rgba(216, 229, 254, 0.92)",
                      borderRadius: 14,
                      padding: "12px 16px",
                      cursor: "pointer",
                      fontFamily: "Bemora",
                      letterSpacing: 1.2,
                      boxShadow: "0 14px 36px rgba(0,0,0,0.55)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                    aria-label="Copy email"
                    title="Copy email"
                  >
                    COPY
                  </Box>
                </Box>
              </Box>
            </Box>
          </RevealOnScroll>

          {/* -------------------------------------------------------------------- */}
          {/* PAYMENT SECTION (COMMENTED OUT)                                       */}
          {/* -------------------------------------------------------------------- */}
          {/*
          <RevealOnScroll delay={0.24}>
            <Box
              sx={{
                width: "100%",
                maxWidth: 860,
                mt: { xs: 3, sm: 3.5 },
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
                  PAYMENT
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "stretch", md: "center" },
                    justifyContent: "space-between",
                    gap: 2.25,
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: "Bemora",
                        letterSpacing: 0.8,
                        fontSize: { xs: 20, sm: 22, md: 24 },
                        backgroundImage: gradient,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                        mb: 0.75,
                      }}
                    >
                      Pay Bergquist Applications
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(216, 229, 254, 0.78)",
                        lineHeight: 1.65,
                        maxWidth: 620,
                        mb: 1,
                      }}
                    >
                      Enter an amount in USD and you’ll be redirected to Stripe Checkout to complete payment by card
                    </Typography>

                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(216, 229, 254, 0.72)",
                        lineHeight: 1.65,
                      }}
                    >
                      An 8% tax will be added to the total
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: "stretch",
                      gap: 1.25,
                      minWidth: { xs: "100%", md: 380 },
                    }}
                  >
                    <TextField
                      value={amount}
                      onChange={(e) => setAmount(clampAmountInput(e.target.value))}
                      type="number"
                      inputProps={{ min: 0, step: "0.01" }}
                      label="Amount (USD)"
                      autoComplete="off"
                      fullWidth
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                          backgroundColor: "rgba(0,0,0,0.28)",
                          backdropFilter: "blur(10px)",
                          WebkitBackdropFilter: "blur(10px)",
                          "& > fieldset": { border: "1px solid rgba(255,255,255,0.14)" },
                          "&:hover > fieldset": { border: "1px solid rgba(255,255,255,0.22)" },
                          "&.Mui-focused > fieldset": { border: "1px solid rgba(34,211,238,0.35)" },
                          "& input": {
                            color: "rgba(216, 229, 254, 0.92)",
                            fontFamily: "Bemora",
                            letterSpacing: 0.8,
                          },
                        },
                        "& .MuiInputLabel-root": { color: "rgba(216, 229, 254, 0.72)" },
                        "& .MuiInputLabel-root.Mui-focused": { color: "rgba(216, 229, 254, 0.82)" },
                      }}
                    />

                    <Box
                      component={motion.button}
                      onClick={redirectToCheckout}
                      disabled={payDisabled}
                      whileHover={payDisabled ? undefined : { y: -2 }}
                      whileTap={payDisabled ? undefined : { scale: 0.98 }}
                      style={{
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: payDisabled ? "rgba(0,0,0,0.22)" : "rgba(0,0,0,0.35)",
                        color: payDisabled ? "rgba(216, 229, 254, 0.45)" : "rgba(216, 229, 254, 0.92)",
                        borderRadius: 14,
                        padding: "12px 16px",
                        cursor: payDisabled ? "not-allowed" : "pointer",
                        fontFamily: "Bemora",
                        letterSpacing: 1.2,
                        boxShadow: "0 14px 36px rgba(0,0,0,0.55)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        whiteSpace: "nowrap",
                        width: 160,
                        minWidth: 160,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      aria-label="Pay Bergquist Applications"
                      title="Pay Bergquist Applications"
                    >
                      {paying ? "REDIRECTING…" : "PAY"}
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    pt: 1.75,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                    gap: 1.25,
                  }}
                >
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: 2.2, color: "rgba(216, 229, 254, 0.6)" }}>
                      SUBTOTAL
                    </Typography>
                    <Typography sx={{ color: "rgba(216, 229, 254, 0.9)", fontFamily: "Bemora" }}>
                      {toMoney(subtotal)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: 2.2, color: "rgba(216, 229, 254, 0.6)" }}>
                      TAX (8%) EST.
                    </Typography>
                    <Typography sx={{ color: "rgba(216, 229, 254, 0.9)", fontFamily: "Bemora" }}>
                      {toMoney(tax)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: 2.2, color: "rgba(216, 229, 254, 0.6)" }}>
                      TOTAL EST.
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Bemora",
                        letterSpacing: 0.6,
                        backgroundImage: gradient,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        textShadow: "0 10px 35px rgba(0,0,0,0.55)",
                      }}
                    >
                      {toMoney(total)}
                    </Typography>
                  </Box>
                </Box>

                {!!payError && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 1.5, color: "rgba(255, 120, 120, 0.9)", lineHeight: 1.6 }}
                  >
                    {payError}
                  </Typography>
                )}
              </Box>
            </Box>
          </RevealOnScroll>
          */}

          {/* Subtle footer line */}
          <RevealOnScroll delay={0.32}>
            <Box
              sx={{
                mt: { xs: 5, sm: 6 },
                width: "100%",
                maxWidth: 860,
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(124,58,237,0.35) 20%, rgba(34,211,238,0.28) 50%, rgba(79,70,229,0.35) 80%, rgba(0,0,0,0) 100%)",
                opacity: 0.9,
              }}
            />
          </RevealOnScroll>
        </Box>
      </Box>
    </Box>
  )
}
