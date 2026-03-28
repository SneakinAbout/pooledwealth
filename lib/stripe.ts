import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export async function createPaymentIntent(
  amount: number,
  metadata: Record<string, string>
) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // convert to cents
    currency: 'aud',
    automatic_payment_methods: { enabled: true },
    metadata,
  });
}
