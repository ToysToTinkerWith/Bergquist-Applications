// pages/api/checkout-sessions/index.js
import Stripe from "stripe"
import { getFirestore, admin } from "../../../lib/firebaseAdmin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST)

function toCents(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.round(n * 100))
}

function originFromUrl(u) {
  try {
    return new URL(String(u)).origin
  } catch {
    return ""
  }
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

    // Build Stripe line_items on the server
    const line_items = cart_items
      .filter((it) => it?.qty > 0 && toCents(it?.unitPrice) > 0 && it?.name)
      .map((it) => ({
        price_data: {
          currency: "usd",
          product_data: { name: it.name },
          unit_amount: toCents(it.unitPrice),
        },
        quantity: it.qty,
      }))

    if (!line_items.length) {
      return res.status(400).json({ message: "No priced items found in cart." })
    }

    // Create Firestore order doc FIRST (pending)
    const db = getFirestore()
    const orderRef = db.collection("orders").doc()
    const orderId = orderRef.id

    const subtotal = cart_items.reduce(
      (acc, it) => acc + (Number(it.unitPrice) || 0) * (Number(it.qty) || 0),
      0
    )

    await orderRef.set({
      orderId,
      status: "pending",
      currency: "usd",
      items: cart_items.map((it) => ({
        name: String(it.name || ""),
        unitPrice: Number(it.unitPrice) || 0,
        qty: Number(it.qty) || 0,
      })),
      subtotal,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Success URL goes to /order/<orderId> (placeholder replaced)
    const successUrlFinal = String(success_url || "").replace("{ORDER_ID}", orderId)

    // Cancel URL should always go to /components/restaurant-ordering/order on the same origin
    const baseOrigin = originFromUrl(cancel_url) || originFromUrl(success_url)
    if (!baseOrigin || !successUrlFinal) {
      return res.status(400).json({
        message:
          "success_url is required, and cancel_url (or success_url) must be a valid absolute URL to derive origin.",
      })
    }

    const cancelUrlFinal = `${baseOrigin}/components/restaurant-ordering/order`

    const TAX_RATE = 0.08

    function computeSubtotalCents(lineItems) {
      return lineItems.reduce((sum, li) => {
        const unit = li?.price_data?.unit_amount
        const qty = li?.quantity ?? 1
        if (!Number.isInteger(unit)) {
          throw new Error("line_item missing price_data.unit_amount (cents)")
        }
        return sum + unit * qty
      }, 0)
    }

    const subtotalCents = computeSubtotalCents(line_items)
    const taxCents = Math.round(subtotalCents * TAX_RATE)

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
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItemsWithTax,
      success_url: successUrlFinal,
      cancel_url: cancelUrlFinal,
      metadata: {
        orderId,
        subtotalCents: String(subtotalCents),
        taxCents: String(taxCents),
        taxRate: "0.08",
        targetCollection: "orders"
      },
    })

    // Store stripe session id on order (helpful for troubleshooting)
    await orderRef.update({
      stripeSessionId: session.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(200).json({ id: session.id })
  } catch (err) {
    return res.status(500).json({ statusCode: 500, message: err.message })
  }
}
