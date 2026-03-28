import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/permissions';
import { stripe } from '@/lib/stripe';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const authError = requireAuth(session);
    if (authError) return authError;

    if (!session!.user.kycApproved) {
      return NextResponse.json({ error: 'KYC approval required to deposit' }, { status: 403 });
    }

    // Rate limit: 10 deposits per hour per user
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    if (!rateLimit(`deposit:${session!.user.id}:${ip}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // Use platform settings for dynamic min/max validation
    const settings = await prisma.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    const minDeposit = settings?.minDepositAmount ?? 10;
    const maxDeposit = settings?.maxDepositAmount ?? 100000;

    const depositSchema = z.object({
      amount: z
        .number()
        .min(minDeposit, `Minimum deposit is $${minDeposit}`)
        .max(maxDeposit, `Maximum deposit is $${maxDeposit.toLocaleString()}`),
    });

    const body = await request.json();
    const result = depositSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { amount } = result.data;

    // Ensure wallet exists
    const wallet = await prisma.wallet.upsert({
      where: { userId: session!.user.id },
      update: {},
      create: { userId: session!.user.id, balance: 0 },
    });

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: 'aud',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: session!.user.id,
        walletId: wallet.id,
        type: 'wallet_deposit',
      },
    });

    // Record pending deposit
    await prisma.deposit.create({
      data: {
        walletId: wallet.id,
        amount,
        status: 'PENDING',
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('[POST /api/wallet/deposit]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
