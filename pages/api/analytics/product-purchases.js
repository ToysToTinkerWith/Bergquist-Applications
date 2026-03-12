// pages/api/analytics/product-purchases.js

import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST)

const ALLOWED_PRODUCT_NAMES = ["Moon", "Saturn", "Edge of Space"]
const ALLOWED_NAME_SET = new Set(ALLOWED_PRODUCT_NAMES)

function safeDays(value, fallback = 90) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(365, Math.max(1, Math.floor(n)))
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}

function toDayKey(unixSeconds) {
  const d = new Date(unixSeconds * 1000)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function startOfUtcDayUnixFromDays(days) {
  const now = new Date()
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  start.setUTCDate(start.getUTCDate() - (days - 1))
  return Math.floor(start.getTime() / 1000)
}

function rangeDays(startUnix, endUnix) {
  const days = []
  let cursor = startUnix

  while (cursor <= endUnix) {
    days.push(toDayKey(cursor))
    cursor += 86400
  }

  return days
}

async function getAllActiveProducts() {
  const products = []
  let startingAfter = undefined
  let hasMore = true

  while (hasMore) {
    const page = await stripe.products.list({
      active: true,
      limit: 100,
      starting_after: startingAfter,
    })

    products.push(...(page.data || []))
    hasMore = Boolean(page.has_more)
    startingAfter =
      page.data && page.data.length
        ? page.data[page.data.length - 1].id
        : undefined
  }

  return products
}

async function getAllCompletedSessions({ startUnix }) {
  const sessions = []
  let startingAfter = undefined
  let hasMore = true

  while (hasMore) {
    const page = await stripe.checkout.sessions.list({
      limit: 100,
      status: "complete",
      created: { gte: startUnix },
      starting_after: startingAfter,
    })

    sessions.push(...(page.data || []))
    hasMore = Boolean(page.has_more)
    startingAfter =
      page.data && page.data.length
        ? page.data[page.data.length - 1].id
        : undefined
  }

  return sessions
}

async function getAllLineItemsForSession(sessionId) {
  const all = []
  let startingAfter = undefined
  let hasMore = true

  while (hasMore) {
    const page = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
      expand: ["data.price.product"],
      starting_after: startingAfter,
    })

    all.push(...(page.data || []))
    hasMore = Boolean(page.has_more)
    startingAfter =
      page.data && page.data.length
        ? page.data[page.data.length - 1].id
        : undefined
  }

  return all
}

function resolveAllowedName({
  productId,
  productName,
  description,
  activeProductIds,
  activeAllowedNameMap,
}) {
  const normalizedProductName = normalizeName(productName)
  const normalizedDescription = normalizeName(description)

  if (productId && activeProductIds.has(productId)) {
    if (activeAllowedNameMap.has(normalizedProductName)) {
      return activeAllowedNameMap.get(normalizedProductName)
    }
  }

  if (activeAllowedNameMap.has(normalizedProductName)) {
    return activeAllowedNameMap.get(normalizedProductName)
  }

  if (activeAllowedNameMap.has(normalizedDescription)) {
    return activeAllowedNameMap.get(normalizedDescription)
  }

  return null
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed." })
  }

  try {
    const days = safeDays(req.query.days, 90)
    const debug = String(req.query.debug || "") === "1"

    const startUnix = startOfUtcDayUnixFromDays(days)
    const nowUnix = Math.floor(Date.now() / 1000)
    const endUnix = Math.floor(nowUnix / 86400) * 86400

    const activeProducts = await getAllActiveProducts()

    const allowedActiveProducts = activeProducts.filter((p) =>
      ALLOWED_NAME_SET.has(String(p?.name || "").trim())
    )

    const activeProductIds = new Set(allowedActiveProducts.map((p) => p.id))

    const activeAllowedNameMap = new Map(
      allowedActiveProducts.map((p) => [normalizeName(p.name), p.name])
    )

    const sessions = await getAllCompletedSessions({ startUnix })

    const qtyByProduct = new Map()
    const qtyByDayAndProduct = new Map()

    for (const name of ALLOWED_PRODUCT_NAMES) {
      qtyByProduct.set(name, 0)
    }

    const debugRows = []
    let totalLineItemsSeen = 0
    let matchedLineItems = 0

    for (const session of sessions) {
      if (session.payment_status !== "paid") continue

      const lineItems = await getAllLineItemsForSession(session.id)
      const dayKey = toDayKey(session.created)

      for (const li of lineItems) {
        totalLineItemsSeen += 1

        const qty = Number(li.quantity || 0)
        if (!qty) continue

        const productObj = li?.price?.product
        const productId =
          productObj && typeof productObj === "object" ? productObj.id : null
        const productName =
          productObj && typeof productObj === "object" ? productObj.name : ""
        const description = li?.description || ""

        const allowedName = resolveAllowedName({
          productId,
          productName,
          description,
          activeProductIds,
          activeAllowedNameMap,
        })

        if (debug && debugRows.length < 50) {
          debugRows.push({
            sessionId: session.id,
            paymentStatus: session.payment_status,
            dayKey,
            quantity: qty,
            description,
            productId,
            productName,
            matchedAllowedName: allowedName,
          })
        }

        if (!allowedName) continue

        matchedLineItems += 1

        qtyByProduct.set(allowedName, (qtyByProduct.get(allowedName) || 0) + qty)

        const compoundKey = `${dayKey}__${allowedName}`
        qtyByDayAndProduct.set(
          compoundKey,
          (qtyByDayAndProduct.get(compoundKey) || 0) + qty
        )
      }
    }

    const totals = ALLOWED_PRODUCT_NAMES.map((productName) => ({
      productKey: productName,
      productName,
      totalQty: qtyByProduct.get(productName) || 0,
    }))

    const allDays = rangeDays(startUnix, endUnix)

    const series = allDays.map((day) => {
      const row = { date: day }

      for (const productName of ALLOWED_PRODUCT_NAMES) {
        row[productName] =
          qtyByDayAndProduct.get(`${day}__${productName}`) || 0
      }

      return row
    })

    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      range: {
        days,
        startUnix,
        endUnix,
      },
      totals,
      series,
      topProducts: ALLOWED_PRODUCT_NAMES,
      activeCatalogCount: allowedActiveProducts.length,
      debug: debug
        ? {
            allowedActiveProducts: allowedActiveProducts.map((p) => ({
              id: p.id,
              name: p.name,
              active: p.active,
            })),
            totalSessionsChecked: sessions.length,
            totalLineItemsSeen,
            matchedLineItems,
            sampleLineItems: debugRows,
          }
        : undefined,
    })
  } catch (err) {
    console.error("product-purchases analytics error:", err)
    return res.status(500).json({
      message: err?.message || "Failed to build Stripe purchase analytics.",
    })
  }
}