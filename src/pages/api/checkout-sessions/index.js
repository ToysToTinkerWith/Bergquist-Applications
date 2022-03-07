import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
        console.log(req.body)
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: req.body.line_items,
        success_url: req.body.success_url,
        cancel_url: req.body.cancel_url,
        automatic_tax: {
            enabled: true
        },
        shipping_address_collection: {
            allowed_countries: ['US', 'CA'],
          },
        metadata: req.body.metadata
      });

      res.status(200).json(session);
    } catch (err) {
      res.status(500).json({ statusCode: 500, message: err.message });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}