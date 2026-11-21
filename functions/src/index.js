// functions/src/index.js
const Stripe = require("stripe")
const { onRequest } = require("firebase-functions/v2/https")
const { onInit } = require("firebase-functions/v2/core")
const { admin, db } = require("./firebaseAdmin")

let stripe

onInit(() => {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST, {
    // apiVersion: "2024-06-20",
  })
})

exports.stripeWebhook = onRequest(
  {
    region: "us-central1",
    timeoutSeconds: 60,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.set("Allow", "POST")
      return res.status(405).send("Method Not Allowed")
    }

    const sig = req.header("stripe-signature")
    if (!sig) {
      return res.status(400).json({
        error: "Missing Stripe-Signature header",
      })
    }

    let event
    try {
      const rawBody = req.rawBody
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET_TEST
      )
    } catch (err) {
      return res.status(400).json({
        error: `Webhook Error: ${err?.message || "Signature verification failed"}`,
      })
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object
        const orderId = session?.metadata?.orderId
        const requestedCollection = session?.metadata?.targetCollection

        if (!orderId) {
          return res.status(200).json({
            received: true,
            warning: "Missing metadata.orderId; no order updated",
          })
        }

        const targetCollection =
          requestedCollection === "testOrders" ? "testOrders" : "orders"

        const customerName =
          session?.customer_details?.name ||
          session?.shipping_details?.name ||
          null

        const customerEmail = session?.customer_details?.email || null

        const eventRef = db.collection("stripe_events").doc(event.id)
        const already = await eventRef.get()

        if (already.exists) {
          return res.status(200).json({
            received: true,
            deduped: true,
            targetCollection,
            orderId,
          })
        }

        await db.runTransaction(async (tx) => {
          tx.set(eventRef, {
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            type: event.type,
            livemode: event.livemode ?? null,
            orderId,
            targetCollection,
            sessionId: session.id,
          })

          tx.set(
            db.collection(targetCollection).doc(orderId),
            {
              status: "paid",
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              customerName,
              stripe: {
                eventId: event.id,
                sessionId: session.id,
                paymentIntent: session.payment_intent || null,
                amountTotal: session.amount_total ?? null,
                currency: session.currency || "usd",
                customerEmail,
                customerName,
                livemode: event.livemode ?? null,
                targetCollection,
              },
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          )
        })

        console.log("stripeWebhook completed", {
          orderId,
          targetCollection,
          livemode: event.livemode ?? null,
          sessionId: session.id,
        })
      }

      return res.status(200).json({ received: true })
    } catch (err) {
      console.error("stripeWebhook failed", err)
      return res.status(500).json({
        error: `Webhook failed: ${err?.message || "Unknown error"}`,
      })
    }
  }
)