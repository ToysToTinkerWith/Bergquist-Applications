// components/StripeCatalog.jsx
// Full code change
// - Similar visual theme to ApplicationsBarGraph
// - Pulls active Stripe products from /api/products/active
// - Local cart with qty controls
// - Uses /api/checkout-sessions to create Stripe Checkout Session
// - Sends item image through checkout payload so receipt page can display it
// - Responsive catalog + sticky cart
//
// Expected product API shape:
// [
//   {
//     id: "prod_...",
//     name: "Pizza",
//     description: "Hand-tossed crust...",
//     image: "https://...",
//     unitPrice: 12.99,
//     currency: "usd",
//     active: true
//   }
// ]

import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  Button,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout"
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined"
import RefreshIcon from "@mui/icons-material/Refresh"
import { motion } from "framer-motion"

// -------------------------- UI helpers --------------------------

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
    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
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
        if (entry?.isIntersecting) {
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

function GradientTitle({ children, variant = "h3", align = "left", sx = {} }) {
  return (
    <Typography
      variant={variant}
      align={align}
      sx={{
        fontFamily: "Bemora",
        letterSpacing: 1.1,
        lineHeight: 1.2,
        backgroundImage:
          "linear-gradient(90deg, #7C3AED 0%, #4F46E5 35%, #22D3EE 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        textShadow: "0 10px 35px rgba(0,0,0,0.55)",
        ...sx,
      }}
    >
      {children}
    </Typography>
  )
}

function SubText({ children, sx = {} }) {
  return (
    <Typography
      variant="body1"
      sx={{
        color: "rgba(216, 229, 254, 0.84)",
        lineHeight: 1.75,
        ...sx,
      }}
    >
      {children}
    </Typography>
  )
}

// -------------------------- helpers --------------------------

function formatMoney(n, currency = "usd") {
  const value = Number(n || 0)
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "usd").toUpperCase(),
  }).format(value)
}

function normalizeProduct(p) {
  return {
    id: String(p?.id || ""),
    name: String(p?.name || ""),
    description: String(p?.description || ""),
    image: String(p?.image || ""),
    unitPrice: Number(p?.unitPrice || 0),
    currency: String(p?.currency || "usd").toLowerCase(),
    active: Boolean(p?.active),
  }
}

function qtySafe(n) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.floor(x))
}

// -------------------------- Component --------------------------

export default function StripeCatalog({
  title = "Shop Catalog",
  subtitle = "Browse active products, build a cart, and pay with Stripe Checkout.",
  lastUpdated = "March 10, 2026",
  productsApi = "/api/products/active",
  checkoutApi = "/api/checkout-sessions",
  successPathTemplate = "/order/{ORDER_ID}",
  cancelPath = "/applications/restaurant/order",
  showPageSection = true,
  taxRate = 0.08,
}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState({})

  async function loadProducts() {
    try {
      setLoading(true)
      setError("")

      const res = await fetch(productsApi, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load products.")
      }

      const next = Array.isArray(data?.products)
        ? data.products.map(normalizeProduct).filter((p) => p.id && p.active)
        : Array.isArray(data)
          ? data.map(normalizeProduct).filter((p) => p.id && p.active)
          : []

      setProducts(next)
    } catch (err) {
      setError(err.message || "Could not load products.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    const q = String(search || "").trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => {
      const hay = `${p.name} ${p.description}`.toLowerCase()
      return hay.includes(q)
    })
  }, [products, search])

  const cartItems = useMemo(() => {
    return Object.values(cart)
      .map((item) => ({
        ...item,
        qty: qtySafe(item.qty),
      }))
      .filter((item) => item.qty > 0)
  }, [cart])

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [cartItems]
  )

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum + Number(item.unitPrice || 0) * Number(item.qty || 0),
        0
      ),
    [cartItems]
  )

  const tax = useMemo(() => subtotal * taxRate, [subtotal, taxRate])
  const total = useMemo(() => subtotal + tax, [subtotal, tax])

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev[product.id]
      const nextQty = qtySafe(existing?.qty || 0) + 1

      return {
        ...prev,
        [product.id]: {
          id: product.id,
          name: product.name,
          unitPrice: Number(product.unitPrice || 0),
          currency: product.currency || "usd",
          image: product.image || "",
          qty: nextQty,
        },
      }
    })
  }

  function changeQty(product, nextQty) {
    const safeQty = qtySafe(nextQty)

    setCart((prev) => {
      if (safeQty <= 0) {
        const copy = { ...prev }
        delete copy[product.id]
        return copy
      }

      return {
        ...prev,
        [product.id]: {
          id: product.id,
          name: product.name,
          unitPrice: Number(product.unitPrice || 0),
          currency: product.currency || "usd",
          image: product.image || "",
          qty: safeQty,
        },
      }
    })
  }

  function increment(product) {
    changeQty(product, qtySafe(cart?.[product.id]?.qty || 0) + 1)
  }

  function decrement(product) {
    changeQty(product, qtySafe(cart?.[product.id]?.qty || 0) - 1)
  }

  async function handleCheckout() {
    try {
      if (!cartItems.length) {
        setError("Your cart is empty.")
        return
      }

      setLoadingCheckout(true)
      setError("")

      const origin =
        typeof window !== "undefined" ? window.location.origin : ""

      if (!origin) {
        throw new Error("Could not determine site origin for checkout.")
      }

      const success_url = `${origin}${successPathTemplate}`
      const cancel_url = `${origin}${cancelPath}`

      console.log("cartItems for checkout:", cartItems)

      const res = await fetch(checkoutApi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart_items: cartItems.map((item) => ({
            name: item.name,
            unitPrice: Number(item.unitPrice || 0),
            qty: Number(item.qty || 0),
            image: item.image || "",
          })),
          success_url,
          cancel_url,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create checkout session.")
      }

      if (!data?.id) {
        throw new Error("Checkout session id was not returned.")
      }

      const stripeModule = await import("@stripe/stripe-js")
      const stripe = await stripeModule.loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_TEST
      )

      if (!stripe) {
        throw new Error("Stripe.js failed to initialize.")
      }

      const result = await stripe.redirectToCheckout({ sessionId: data.id })

      if (result?.error?.message) {
        throw new Error(result.error.message)
      }
    } catch (err) {
      setError(err.message || "Checkout failed.")
    } finally {
      setLoadingCheckout(false)
    }
  }

  const content = (
    <>
      <Box
        sx={{
          width: "100%",
          pt: { xs: 7, sm: 8, md: 10 },
          pb: { xs: 3, sm: 4 },
          px: { xs: 2, sm: 3, md: 4 },
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1200 }}>
          <RevealOnScroll>
            <Stack
              spacing={1.2}
              alignItems="center"
              sx={{ textAlign: "center", mb: 4 }}
            >
              <GradientTitle
                variant="h2"
                align="center"
                sx={{
                  fontSize: { xs: "2.15rem", sm: "2.8rem", md: "3.5rem" },
                  mb: 0.5,
                }}
              >
                {title}
              </GradientTitle>

              <SubText
                sx={{
                  maxWidth: 820,
                  fontSize: { xs: 15.5, sm: 17 },
                  color: "rgba(216, 229, 254, 0.76)",
                }}
              >
                {subtitle}
              </SubText>

              <Typography
                sx={{
                  color: "rgba(216, 229, 254, 0.55)",
                  fontSize: 13,
                  letterSpacing: 0.35,
                  mt: 0.3,
                }}
              >
                Last updated: {lastUpdated}
              </Typography>
            </Stack>
          </RevealOnScroll>

          <Stack spacing={{ xs: 2.5, sm: 3 }}>
            <RevealOnScroll delay={0.05}>
              <Box
                sx={{
                  position: "relative",
                  borderRadius: 3,
                  overflow: "hidden",
                  background:
                    "linear-gradient(180deg, rgba(124,58,237,0.08) 0%, rgba(34,211,238,0.03) 100%)",
                  border: "1px solid rgba(216, 229, 254, 0.12)",
                  boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
                  p: { xs: 2, sm: 2.5, md: 3 },
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  alignItems={{ xs: "stretch", md: "center" }}
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Stack spacing={0.75}>
                    <GradientTitle
                      variant="h5"
                      sx={{ letterSpacing: 0.8, textShadow: "none" }}
                    >
                      Product Catalog
                    </GradientTitle>
                    <SubText
                      sx={{ fontSize: 15, color: "rgba(216, 229, 254, 0.72)" }}
                    >
                      Active Stripe products are loaded from your backend API.
                    </SubText>
                  </Stack>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    alignItems={{ xs: "stretch", sm: "center" }}
                  >
                    <TextField
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search products..."
                      size="small"
                      variant="outlined"
                      sx={{
                        minWidth: { xs: "100%", sm: 240 },
                        "& .MuiOutlinedInput-root": {
                          color: "rgba(255,255,255,0.94)",
                          background: "rgba(0,0,0,0.28)",
                          borderRadius: 999,
                          "& fieldset": {
                            borderColor: "rgba(216, 229, 254, 0.14)",
                          },
                          "&:hover fieldset": {
                            borderColor: "rgba(216, 229, 254, 0.22)",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: "rgba(34,211,238,0.6)",
                          },
                        },
                        "& .MuiInputBase-input::placeholder": {
                          color: "rgba(216,229,254,0.52)",
                          opacity: 1,
                        },
                      }}
                    />

                    <Button
                      onClick={loadProducts}
                      startIcon={
                        loading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <RefreshIcon />
                        )
                      }
                      variant="outlined"
                      sx={{
                        borderRadius: 999,
                        textTransform: "none",
                        fontWeight: 800,
                        color: "rgba(216,229,254,0.92)",
                        borderColor: "rgba(216,229,254,0.16)",
                        background: "rgba(255,255,255,0.03)",
                        "&:hover": {
                          borderColor: "rgba(34,211,238,0.35)",
                          background: "rgba(255,255,255,0.06)",
                        },
                      }}
                    >
                      Refresh
                    </Button>
                  </Stack>
                </Stack>

                {error ? (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 2,
                      borderRadius: 2,
                      background: "rgba(60, 0, 0, 0.45)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {error}
                  </Alert>
                ) : null}

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "1fr",
                      md: "minmax(0, 1.8fr) minmax(320px, 0.95fr)",
                    },
                    gap: 2,
                    alignItems: "start",
                  }}
                >
                  <Box
                    sx={{
                      borderRadius: 3,
                      border: "1px solid rgba(216, 229, 254, 0.12)",
                      overflow: "hidden",
                      background: "rgba(0,0,0,0.35)",
                      p: { xs: 1.25, sm: 1.5 },
                    }}
                  >
                    {loading ? (
                      <Stack
                        spacing={1.5}
                        alignItems="center"
                        justifyContent="center"
                        sx={{ minHeight: 280 }}
                      >
                        <CircularProgress />
                        <Typography
                          sx={{
                            color: "rgba(216,229,254,0.72)",
                            fontWeight: 700,
                          }}
                        >
                          Loading products...
                        </Typography>
                      </Stack>
                    ) : filteredProducts.length ? (
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, minmax(0, 1fr))",
                          },
                          gap: 1.5,
                        }}
                      >
                        {filteredProducts.map((product, index) => {
                          const qty = qtySafe(cart?.[product.id]?.qty || 0)

                          return (
                            <Box
                              key={product.id}
                              component={motion.div}
                              initial={false}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.35,
                                delay: index * 0.02,
                              }}
                            >
                              <Card
                                sx={{
                                  height: "100%",
                                  borderRadius: 3,
                                  background:
                                    "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.03) 100%)",
                                  border: "1px solid rgba(216, 229, 254, 0.10)",
                                  boxShadow: "0 18px 55px rgba(0,0,0,0.35)",
                                  color: "white",
                                  overflow: "hidden",
                                }}
                              >
                                {product.image ? (
                                  <CardMedia
                                    component="img"
                                    image={product.image}
                                    alt={product.name}
                                    sx={{
                                      height: 210,
                                      objectFit: "cover",
                                      borderBottom:
                                        "1px solid rgba(216,229,254,0.08)",
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      height: 210,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      background:
                                        "radial-gradient(circle at center, rgba(124,58,237,0.22), rgba(0,0,0,0.32) 70%)",
                                      borderBottom:
                                        "1px solid rgba(216,229,254,0.08)",
                                    }}
                                  >
                                    <Inventory2OutlinedIcon
                                      sx={{
                                        fontSize: 56,
                                        color: "rgba(216,229,254,0.5)",
                                      }}
                                    />
                                  </Box>
                                )}

                                <CardContent sx={{ p: 1.5 }}>
                                  <Stack spacing={1.1}>
                                    <Stack
                                      direction="row"
                                      justifyContent="space-between"
                                      alignItems="flex-start"
                                      spacing={1}
                                    >
                                      <Typography
                                        sx={{
                                          color: "rgba(245,248,255,0.96)",
                                          fontWeight: 900,
                                          fontSize: 17,
                                          lineHeight: 1.2,
                                        }}
                                      >
                                        {product.name}
                                      </Typography>

                                      <Chip
                                        label={formatMoney(
                                          product.unitPrice,
                                          product.currency
                                        )}
                                        size="small"
                                        sx={{
                                          borderRadius: 999,
                                          fontWeight: 900,
                                          color: "rgba(216, 229, 254, 0.94)",
                                          background: "rgba(255,255,255,0.06)",
                                          border:
                                            "1px solid rgba(216, 229, 254, 0.14)",
                                        }}
                                      />
                                    </Stack>

                                    <Typography
                                      sx={{
                                        color: "rgba(216,229,254,0.72)",
                                        fontSize: 13.5,
                                        lineHeight: 1.5,
                                        minHeight: 42,
                                      }}
                                    >
                                      {product.description ||
                                        "No description provided."}
                                    </Typography>

                                    <Divider
                                      sx={{
                                        borderColor: "rgba(216,229,254,0.08)",
                                      }}
                                    />

                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      justifyContent="space-between"
                                      spacing={1}
                                    >
                                      <Stack
                                        direction="row"
                                        spacing={0.75}
                                        alignItems="center"
                                      >
                                        <IconButton
                                          onClick={() => decrement(product)}
                                          sx={{
                                            color: "rgba(216,229,254,0.92)",
                                            border:
                                              "1px solid rgba(216,229,254,0.14)",
                                            background: "rgba(255,255,255,0.03)",
                                            "&:hover": {
                                              background:
                                                "rgba(255,255,255,0.06)",
                                            },
                                          }}
                                        >
                                          <RemoveIcon />
                                        </IconButton>

                                        <Box
                                          sx={{
                                            minWidth: 34,
                                            textAlign: "center",
                                            color: "rgba(255,255,255,0.96)",
                                            fontWeight: 900,
                                            fontSize: 15,
                                          }}
                                        >
                                          {qty}
                                        </Box>

                                        <IconButton
                                          onClick={() => increment(product)}
                                          sx={{
                                            color: "rgba(216,229,254,0.92)",
                                            border:
                                              "1px solid rgba(216,229,254,0.14)",
                                            background: "rgba(255,255,255,0.03)",
                                            "&:hover": {
                                              background:
                                                "rgba(255,255,255,0.06)",
                                            },
                                          }}
                                        >
                                          <AddIcon />
                                        </IconButton>
                                      </Stack>

                                      <Button
                                        onClick={() => addToCart(product)}
                                        variant="contained"
                                        startIcon={<LocalMallOutlinedIcon />}
                                        sx={{
                                          borderRadius: 999,
                                          textTransform: "none",
                                          fontWeight: 900,
                                          px: 1.75,
                                          backgroundImage:
                                            "linear-gradient(90deg, rgba(124,58,237,0.92), rgba(34,211,238,0.82))",
                                          boxShadow:
                                            "0 12px 36px rgba(34,211,238,0.18)",
                                          "&:hover": {
                                            filter: "brightness(1.05)",
                                          },
                                        }}
                                      >
                                        Add
                                      </Button>
                                    </Stack>
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Box>
                          )
                        })}
                      </Box>
                    ) : (
                      <Stack
                        spacing={1.2}
                        alignItems="center"
                        justifyContent="center"
                        sx={{ minHeight: 240, textAlign: "center" }}
                      >
                        <Inventory2OutlinedIcon
                          sx={{ fontSize: 48, color: "rgba(216,229,254,0.45)" }}
                        />
                        <Typography
                          sx={{ color: "rgba(216,229,254,0.80)", fontWeight: 800 }}
                        >
                          No active products found.
                        </Typography>
                        <Typography
                          sx={{ color: "rgba(216,229,254,0.62)", fontSize: 14 }}
                        >
                          Check Stripe product status or your active-products API
                          route.
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  <Box
                    sx={{
                      position: { md: "sticky" },
                      top: { md: 24 },
                    }}
                  >
                    <Box
                      sx={{
                        borderRadius: 3,
                        border: "1px solid rgba(216, 229, 254, 0.12)",
                        overflow: "hidden",
                        background: "rgba(0,0,0,0.35)",
                        boxShadow: "0 18px 55px rgba(0,0,0,0.40)",
                        p: { xs: 1.5, sm: 1.75 },
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <GradientTitle variant="h6" sx={{ textShadow: "none" }}>
                            Cart
                          </GradientTitle>

                          <Chip
                            label={`${itemCount} item${itemCount === 1 ? "" : "s"}`}
                            size="small"
                            sx={{
                              borderRadius: 999,
                              fontWeight: 900,
                              color: "rgba(216, 229, 254, 0.94)",
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(216, 229, 254, 0.14)",
                            }}
                          />
                        </Stack>

                        <SubText
                          sx={{ fontSize: 14, color: "rgba(216,229,254,0.68)" }}
                        >
                          Review your selections before checkout.
                        </SubText>

                        <Divider sx={{ borderColor: "rgba(216,229,254,0.08)" }} />

                        {cartItems.length ? (
                          <Stack spacing={1}>
                            {cartItems.map((item) => (
                              <Box
                                key={item.id}
                                sx={{
                                  borderRadius: 2,
                                  px: 1.1,
                                  py: 1,
                                  background: "rgba(255,255,255,0.03)",
                                  border: "1px solid rgba(216,229,254,0.08)",
                                }}
                              >
                                <Stack spacing={0.75}>
                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    spacing={1}
                                  >
                                    <Typography
                                      sx={{
                                        color: "rgba(255,255,255,0.95)",
                                        fontWeight: 800,
                                        fontSize: 14,
                                        lineHeight: 1.25,
                                      }}
                                    >
                                      {item.name}
                                    </Typography>

                                    <Typography
                                      sx={{
                                        color: "rgba(216,229,254,0.82)",
                                        fontWeight: 900,
                                        fontSize: 13.5,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {formatMoney(
                                        Number(item.unitPrice || 0) *
                                          Number(item.qty || 0),
                                        item.currency
                                      )}
                                    </Typography>
                                  </Stack>

                                  <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                    alignItems="center"
                                  >
                                    <Stack
                                      direction="row"
                                      spacing={0.5}
                                      alignItems="center"
                                    >
                                      <IconButton
                                        onClick={() => {
                                          const product = products.find(
                                            (p) => p.id === item.id
                                          )
                                          if (product) decrement(product)
                                        }}
                                        size="small"
                                        sx={{
                                          color: "rgba(216,229,254,0.92)",
                                          border:
                                            "1px solid rgba(216,229,254,0.12)",
                                        }}
                                      >
                                        <RemoveIcon fontSize="small" />
                                      </IconButton>

                                      <Typography
                                        sx={{
                                          minWidth: 24,
                                          textAlign: "center",
                                          color: "rgba(255,255,255,0.94)",
                                          fontWeight: 900,
                                          fontSize: 14,
                                        }}
                                      >
                                        {item.qty}
                                      </Typography>

                                      <IconButton
                                        onClick={() => {
                                          const product = products.find(
                                            (p) => p.id === item.id
                                          )
                                          if (product) increment(product)
                                        }}
                                        size="small"
                                        sx={{
                                          color: "rgba(216,229,254,0.92)",
                                          border:
                                            "1px solid rgba(216,229,254,0.12)",
                                        }}
                                      >
                                        <AddIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>

                                    <Typography
                                      sx={{
                                        color: "rgba(216,229,254,0.62)",
                                        fontSize: 12.5,
                                      }}
                                    >
                                      {formatMoney(item.unitPrice, item.currency)} each
                                    </Typography>
                                  </Stack>
                                </Stack>
                              </Box>
                            ))}
                          </Stack>
                        ) : (
                          <Typography
                            sx={{
                              color: "rgba(216,229,254,0.68)",
                              fontWeight: 700,
                              fontSize: 14,
                              py: 1,
                            }}
                          >
                            Your cart is empty.
                          </Typography>
                        )}

                        <Divider sx={{ borderColor: "rgba(216,229,254,0.08)" }} />

                        <Stack spacing={0.8}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: "rgba(216,229,254,0.72)" }}>
                              Subtotal
                            </Typography>
                            <Typography
                              sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 800 }}
                            >
                              {formatMoney(subtotal)}
                            </Typography>
                          </Stack>

                          <Stack direction="row" justifyContent="space-between">
                            <Typography sx={{ color: "rgba(216,229,254,0.72)" }}>
                              Estimated tax ({Math.round(taxRate * 100)}%)
                            </Typography>
                            <Typography
                              sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 800 }}
                            >
                              {formatMoney(tax)}
                            </Typography>
                          </Stack>

                          <Stack direction="row" justifyContent="space-between">
                            <Typography
                              sx={{
                                color: "rgba(255,255,255,0.98)",
                                fontWeight: 900,
                              }}
                            >
                              Total
                            </Typography>
                            <Typography
                              sx={{
                                color: "rgba(255,255,255,0.98)",
                                fontWeight: 900,
                              }}
                            >
                              {formatMoney(total)}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Button
                          onClick={handleCheckout}
                          disabled={!cartItems.length || loadingCheckout}
                          fullWidth
                          variant="contained"
                          startIcon={
                            loadingCheckout ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <ShoppingCartCheckoutIcon />
                            )
                          }
                          sx={{
                            mt: 0.5,
                            borderRadius: 999,
                            py: 1.15,
                            textTransform: "none",
                            fontWeight: 900,
                            fontSize: 15,
                            backgroundImage:
                              "linear-gradient(90deg, rgba(124,58,237,0.96), rgba(34,211,238,0.84))",
                            boxShadow: "0 14px 40px rgba(34,211,238,0.20)",
                            "&:hover": {
                              filter: "brightness(1.05)",
                            },
                            "&.Mui-disabled": {
                              color: "rgba(255,255,255,0.45)",
                              background: "rgba(255,255,255,0.10)",
                            },
                          }}
                        >
                          {loadingCheckout ? "Redirecting..." : "Checkout"}
                        </Button>

                        <Typography
                          sx={{
                            color: "rgba(216,229,254,0.55)",
                            fontSize: 12.5,
                            lineHeight: 1.5,
                            textAlign: "center",
                          }}
                        >
                          Checkout is handled securely through Stripe.
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                </Box>

                <SubText
                  sx={{ mt: 1.75, fontSize: 14, color: "rgba(216,229,254,0.68)" }}
                >
                  Products are loaded from Stripe active products, then checkout
                  is created on your server through Stripe Checkout.
                </SubText>
              </Box>
            </RevealOnScroll>
          </Stack>
        </Box>
      </Box>
    </>
  )

  if (showPageSection) {
    return <Box sx={{ width: "100%", backgroundColor: "black" }}>{content}</Box>
  }

  return <Box sx={{ width: "100%" }}>{content}</Box>
}