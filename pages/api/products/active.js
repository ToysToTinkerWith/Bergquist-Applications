// pages/api/products/active.js

import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST)

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    return res.status(405).end("Method Not Allowed")
  }

  try {
    const products = await stripe.products.list({
      active: true,
      limit: 100,
      expand: ["data.default_price"],
    })

    const normalized = products.data
      .map((product) => {
        const defaultPrice = product.default_price

        if (!defaultPrice || typeof defaultPrice !== "object") return null
        if (!defaultPrice.id) return null
        if (!Number.isInteger(defaultPrice.unit_amount)) return null

        return {
          id: product.id,
          name: product.name || "",
          description: product.description || "",
          image:
            Array.isArray(product.images) && product.images.length
              ? product.images[0]
              : "",
          unitPrice: Number(defaultPrice.unit_amount || 0) / 100,
          unitAmount: Number(defaultPrice.unit_amount || 0),
          currency: defaultPrice.currency || "usd",
          active: Boolean(product.active),
          priceId: defaultPrice.id,
        }
      })
      .filter(Boolean)

    return res.status(200).json({ products: normalized })
  } catch (err) {
    return res.status(500).json({
      message: err.message || "Failed to load active Stripe products.",
    })
  }
}