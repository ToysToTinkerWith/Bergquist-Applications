import { buffer } from "micro"
import * as admin from "firebase-admin"

const serviceAccount = require("../../../../permissions.json")

const app = !admin.apps.length ? 
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount) 
})
:
admin.app();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_SIGNING_SECRET;

const fulfillOrder = async (session) => {

    return await app.firestore().collection("clients").doc(session.metadata.clientId)
    .collection("jobs").doc(session.metadata.jobId).update({
        status: "Paid"
    })
}

export default async (req, res) => {
    if (req.method === "POST") {
        const requestBuffer = await buffer(req)
        const payload = requestBuffer.toString()
        const sig = req.headers["stripe-signature"]

        let event

        try {
            event = stripe.webhooks.constructEvent(payload, sig, endpointSecret)
        }

        catch (err) {
            console.log("ERROR", err.message)
            return res.status(400).send(err.message)
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object

            return await fulfillOrder(session).then(() => res.status(200).send("Successful Payment"))
            .catch((err) => res.status(400).send(err.message));
        }

        else {
            return res.status(200).send(event.type)
        }

    }
}

export const config = {
    api: {
        bodyParser: false,
        externalResovler: true,
    }
}