// pages/api/checkout-sessions/index.js

import Stripe from "stripe"
import { getFirestore, admin } from "../../../lib/firebaseAdmin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST)

function originFromUrl(u) {
  try {
    return new URL(String(u)).origin
  } catch {
    return ""
  }
}

function qtySafe(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

function amountToCents(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n * 100))
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).end("Method Not Allowed")
  }

  try {
    const { cart_items = [], success_url, cancel_url } = req.body || {}

    if (!Array.isArray(cart_items) || cart_items.length === 0) {
      return res.status(400).json({ message: "cart_items required" })
    }

    console.log("incoming cart_items:", cart_items)

    const validCart = cart_items
      .map((item) => ({
        name: String(item?.name || item?.title || "").trim(),
        qty: qtySafe(item?.qty ?? item?.quantity),
        unitAmount: amountToCents(item?.unitPrice ?? item?.price),
        image:
          typeof item?.image === "string"
            ? item.image
            : typeof item?.img === "string"
            ? item.img
            : "",
      }))
      .filter((item) => item.name && item.qty > 0 && item.unitAmount > 0)

    if (!validCart.length) {
      return res.status(400).json({
        message:
          "No valid cart items found. Each item must include a name, price/unitPrice, and qty > 0.",
      })
    }

    const currencies = ["usd"]
    const currency = currencies[0]

    const resolvedItems = validCart.map((item) => ({
      name: item.name,
      unitAmount: item.unitAmount,
      unitPrice: item.unitAmount / 100,
      currency,
      qty: item.qty,
      image: item.image,
    }))

    const line_items = resolvedItems.map((item) => {
      const productData = {
        name: item.name,
      }

      if (item.image) {
        productData.images = [item.image]
      }

      return {
        price_data: {
          currency,
          product_data: productData,
          unit_amount: item.unitAmount,
        },
        quantity: item.qty,
      }
    })

    console.log("resolvedItems:", resolvedItems)

    const subtotalCents = resolvedItems.reduce(
      (sum, item) => sum + item.unitAmount * item.qty,
      0
    )

    const TAX_RATE = 0.08
    const taxCents = Math.round(subtotalCents * TAX_RATE)

    const lineItemsWithTax = [
      ...line_items,
      {
        price_data: {
          currency,
          product_data: { name: `Sales Tax (${Math.round(TAX_RATE * 100)}%)` },
          unit_amount: taxCents,
        },
        quantity: 1,
      },
    ]

    const db = getFirestore()
    const orderRef = db.collection("testOrders").doc()
    const orderId = orderRef.id

    const subtotal = subtotalCents / 100
    const tax = taxCents / 100
    const total = (subtotalCents + taxCents) / 100

    await orderRef.set({
      orderId,
      status: "pending",
      currency,
      items: resolvedItems.map((item) => ({
        name: item.name,
        unitPrice: item.unitPrice,
        unitAmount: item.unitAmount,
        qty: item.qty,
        lineTotal: (item.unitAmount * item.qty) / 100,
        ...(item.image ? { image: item.image } : {}),
      })),
      subtotal,
      subtotalCents,
      tax,
      taxCents,
      taxRate: TAX_RATE,
      total,
      totalCents: subtotalCents + taxCents,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const baseOrigin = originFromUrl(cancel_url) || originFromUrl(success_url)

    if (!baseOrigin) {
      return res.status(400).json({
        message:
          "success_url is required, and cancel_url (or success_url) must be a valid absolute URL to derive origin.",
      })
    }

    const successUrlFinal = `${baseOrigin}/receipts/${orderId}`
    const cancelUrlFinal = `${baseOrigin}/finance`

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItemsWithTax,
      success_url: successUrlFinal,
      cancel_url: cancelUrlFinal,
      metadata: {
        orderId,
        subtotalCents: String(subtotalCents),
        taxCents: String(taxCents),
        totalCents: String(subtotalCents + taxCents),
        taxRate: String(TAX_RATE),
        targetCollection: "testOrders",
      },
    })

    await orderRef.update({
      stripeSessionId: session.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(200).json({ id: session.id })
  } catch (err) {
    console.error("checkout session creation failed:", err)
    return res.status(500).json({
      statusCode: 500,
      message: err.message || "Failed to create checkout session.",
    })
  }
}