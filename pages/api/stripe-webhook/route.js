// app/api/stripe-webhook/route.js
import Stripe from "stripe"
import { NextResponse } from "next/server"
import { getFirestore, admin } from "../../../lib/firebaseAdmin"

export const runtime = "nodejs"          // IMPORTANT: Stripe + Admin SDK require node runtime
export const dynamic = "force-dynamic"   // avoid any caching behavior

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST)

export async function POST(request) {
  const sig = request.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json(
      { error: "Missing Stripe-Signature header" },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_TEST
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET_TEST" },
      { status: 500 }
    )
  }

  let event
  try {
    // Get exact raw bytes (required for signature verification)
    const buf = Buffer.from(await request.arrayBuffer())
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook Error: ${err?.message || "Signature verification failed"}` },
      { status: 400 }
    )
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object
      const orderId = session?.metadata?.orderId

      if (orderId) {
        const db = getFirestore()
        await db.collection("orders").doc(orderId).set(
          {
            status: "paid",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            stripe: {
              eventId: event.id,
              sessionId: session.id,
              paymentIntent: session.payment_intent || null,
              amountTotal: session.amount_total || null,
              currency: session.currency || "usd",
              customerEmail: session.customer_details?.email || null,
              livemode: event.livemode ?? null,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        )
      } else {
        // Return 200 so Stripe doesn't retry forever; reconcile later
        return NextResponse.json(
          { received: true, warning: "Missing metadata.orderId; no order updated" },
          { status: 200 }
        )
      }
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (err) {
    // 500 triggers Stripe retry (better than timing out)
    return NextResponse.json(
      { error: `Webhook failed: ${err?.message || "Unknown error"}` },
      { status: 500 }
    )
  }
}
