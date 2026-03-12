// pages/api/orders/[orderId].js
import { getFirestore } from "../../../lib/firebaseAdmin"

export default async function handler(req, res) {
  const { orderId } = req.query
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" })

  try {
    const db = getFirestore()
    const snap = await db.collection("orders").doc(String(orderId)).get()
    if (!snap.exists) return res.status(404).json({ message: "Order not found" })

    return res.status(200).json({ order: snap.data() })
  } catch (err) {
    return res.status(500).json({ message: err.message || "Internal error" })
  }
}
