import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhooks/stripe] STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[webhooks/stripe] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      if (paymentIntent.metadata.type === 'wallet_deposit') {
        const deposit = await prisma.deposit.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
          include: { wallet: true },
        });

        if (deposit && deposit.status === 'PENDING') {
          await prisma.$transaction(async (tx) => {
            await tx.deposit.update({
              where: { id: deposit.id },
              data: { status: 'COMPLETED' },
            });

            await tx.wallet.update({
              where: { id: deposit.walletId },
              data: { balance: { increment: deposit.amount } },
            });

            await tx.transaction.create({
              data: {
                userId: deposit.wallet.userId,
                type: 'DEPOSIT',
                amount: deposit.amount,
                status: 'COMPLETED',
                stripePaymentIntentId: paymentIntent.id,
              },
            });
          });
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      if (paymentIntent.metadata.type === 'wallet_deposit') {
        await prisma.deposit.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { status: 'FAILED' },
        });
      }
    }
  } catch (err) {
    console.error('[webhooks/stripe] Event processing failed:', err);
    return NextResponse.json({ error: 'Event processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
