// pages/api/checkout-sessions/index.js
import Stripe from "stripe"
import crypto from "crypto"
import { getFirestore, admin } from "../../../lib/firebaseAdmin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST)

function isAbsoluteUrl(u) {
  try {
    // eslint-disable-next-line no-new
    new URL(String(u))
    return true
  } catch {
    return false
  }
}

function originFromUrl(u) {
  try {
    return new URL(String(u)).origin
  } catch {
    return ""
  }
}

function makeOrderId() {
  return crypto.randomBytes(12).toString("hex")
}

function assertValidLineItems(line_items) {
  if (!Array.isArray(line_items) || line_items.length === 0) {
    return { ok: false, message: "line_items required" }
  }

  for (const li of line_items) {
    const unit = li?.price_data?.unit_amount
    const qty = li?.quantity

    if (!Number.isInteger(unit) || unit <= 0) {
      return {
        ok: false,
        message: "Each line_item must include price_data.unit_amount (positive integer cents).",
      }
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      return { ok: false, message: "Each line_item must include quantity (positive integer)." }
    }
    const currency = li?.price_data?.currency
    if (currency && String(currency).toLowerCase() !== "usd") {
      return { ok: false, message: "Only usd currency is supported by this endpoint." }
    }
    const name = li?.price_data?.product_data?.name
    if (!name || !String(name).trim()) {
      return { ok: false, message: "Each line_item must include price_data.product_data.name." }
    }
  }

  return { ok: true }
}

function computeSubtotalCents(line_items) {
  return line_items.reduce((sum, li) => {
    const unit = li.price_data.unit_amount
    const qty = li.quantity
    return sum + unit * qty
  }, 0)
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).end("Method Not Allowed")
  }

  try {
    const {
      success_url,
      cancel_url,
      line_items = [],
      mode = "payment",
      payment_method_types = ["card"],
    } = req.body || {}

    // Validate URLs (Stripe requires absolute URLs)
    if (!isAbsoluteUrl(success_url) || !isAbsoluteUrl(cancel_url)) {
      return res.status(400).json({
        message: "success_url and cancel_url must be valid absolute URLs.",
      })
    }

    // Validate incoming line_items
    const check = assertValidLineItems(line_items)
    if (!check.ok) return res.status(400).json({ message: check.message })

    // Compute subtotal from what the client sent
    const subtotalCents = computeSubtotalCents(line_items)
    if (!Number.isInteger(subtotalCents) || subtotalCents <= 0) {
      return res.status(400).json({ message: "Subtotal must be > 0." })
    }

    // Create Firestore order doc FIRST (pending)
    const db = getFirestore()
    const orderRef = db.collection("orders").doc()
    const orderId = orderRef.id || makeOrderId()

    // Store a simplified item list in Firestore (cents + qty)
    const items = line_items.map((li) => ({
      name: String(li?.price_data?.product_data?.name || ""),
      unit_amount: Number(li?.price_data?.unit_amount || 0), // cents
      qty: Number(li?.quantity || 0),
      currency: String(li?.price_data?.currency || "usd").toLowerCase(),
    }))

    const TAX_RATE = 0.08
    const taxCents = Math.round(subtotalCents * TAX_RATE)

    await orderRef.set({
      orderId,
      status: "pending",
      currency: "usd",
      subtotalCents,
      taxCents,
      taxRate: TAX_RATE,
      totalCents: subtotalCents + taxCents,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Success URL now goes to /receipts/[orderId]
    // Allow placeholder replacement if caller provides it, otherwise force receipts path.
    const baseOrigin = originFromUrl(cancel_url) || originFromUrl(success_url)
    if (!baseOrigin) {
      return res.status(400).json({
        message:
          "cancel_url (or success_url) must be a valid absolute URL to derive origin.",
      })
    }

    const successUrlFinal = `${baseOrigin}/receipts/${orderId}`

    // Cancel URL behavior (keep your existing restaurant redirect)
    const cancelUrlFinal = `${baseOrigin}/contact`

    console.log(successUrlFinal)
    console.log(cancelUrlFinal)

    // Add tax as a separate line item
    const lineItemsWithTax = [
      ...line_items,
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Sales Tax (8%)" },
          unit_amount: taxCents,
        },
        quantity: 1,
      },
    ]

    const session = await stripe.checkout.sessions.create({
      mode: String(mode || "payment"),
      payment_method_types: Array.isArray(payment_method_types) ? payment_method_types : ["card"],
      line_items: lineItemsWithTax,
      success_url: successUrlFinal,
      cancel_url: cancelUrlFinal,
      metadata: {
        orderId,
        subtotalCents: String(subtotalCents),
        taxCents: String(taxCents),
        taxRate: String(TAX_RATE),
      },
    })

    // Store stripe session id on order (helpful for troubleshooting)
    await orderRef.update({
      stripeSessionId: session.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(200).json({ id: session.id, orderId })
  } catch (err) {
    return res.status(500).json({ statusCode: 500, message: err.message })
  }
}
