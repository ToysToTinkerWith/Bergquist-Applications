import { loadStripe } from '@stripe/stripe-js';

let stripePromise = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_TEST);
  }
  return stripePromise;
};

export default getStripe;