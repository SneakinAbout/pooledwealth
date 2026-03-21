import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/permissions';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

const purchaseBodySchema = z.object({
  units: z.number().int().positive(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const authError = requireAuth(session);
    if (authError) return authError;

    if (!session!.user.kycApproved) {
      return NextResponse.json({ error: 'KYC approval required to invest' }, { status: 403 });
    }

    // Rate limit: 20 purchases per hour per user
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    if (!rateLimit(`purchase:${session!.user.id}:${ip}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const result = purchaseBodySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { units } = result.data;

    // Fast pre-check for early UX feedback (non-authoritative)
    const investment = await prisma.investment.findUnique({ where: { id: params.id } });
    if (!investment) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    if (investment.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Investment is not currently active' }, { status: 400 });
    }

    if (new Date() > investment.endDate) {
      return NextResponse.json({ error: 'Subscription period for this investment has ended' }, { status: 400 });
    }

    if (units < investment.minimumUnits) {
      return NextResponse.json(
        { error: `Minimum purchase is ${investment.minimumUnits} units` },
        { status: 400 }
      );
    }

    // Ensure wallet exists
    await prisma.wallet.upsert({
      where: { userId: session!.user.id },
      update: {},
      create: { userId: session!.user.id, balance: 0 },
    });

    // All authoritative checks + writes inside a single transaction to prevent race conditions
    const [holding, transaction] = await prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction for authoritative, consistent state
      const freshInvestment = await tx.investment.findUnique({ where: { id: params.id } });

      if (!freshInvestment || freshInvestment.status !== 'ACTIVE') {
        throw Object.assign(new Error('Investment is not currently active'), { status: 400 });
      }

      if (new Date() > freshInvestment.endDate) {
        throw Object.assign(new Error('Subscription period for this investment has ended'), { status: 400 });
      }

      if (units > freshInvestment.availableUnits) {
        throw Object.assign(
          new Error(`Only ${freshInvestment.availableUnits} units available`),
          { status: 400 }
        );
      }

      const totalCost = Number(freshInvestment.pricePerUnit) * units;
      const wallet = await tx.wallet.findUnique({ where: { userId: session!.user.id } });

      if (Number(wallet!.balance) < totalCost) {
        throw Object.assign(
          new Error(
            `Insufficient wallet balance. You need $${totalCost.toFixed(2)} but have $${Number(wallet!.balance).toFixed(2)}.`
          ),
          { status: 400, insufficientFunds: true }
        );
      }

      await tx.wallet.update({
        where: { id: wallet!.id },
        data: { balance: { decrement: totalCost } },
      });

      await tx.investment.update({
        where: { id: params.id },
        data: { availableUnits: { decrement: units } },
      });

      const existingHolding = await tx.holding.findFirst({
        where: { userId: session!.user.id, investmentId: params.id },
      });

      const holding = existingHolding
        ? await tx.holding.update({
            where: { id: existingHolding.id },
            data: {
              unitsPurchased: { increment: units },
              purchasePrice: { increment: totalCost },
            },
          })
        : await tx.holding.create({
            data: {
              userId: session!.user.id,
              investmentId: params.id,
              unitsPurchased: units,
              purchasePrice: totalCost,
            },
          });

      const transaction = await tx.transaction.create({
        data: {
          userId: session!.user.id,
          investmentId: params.id,
          type: 'PURCHASE',
          units,
          amount: totalCost,
          status: 'COMPLETED',
        },
      });

      return [holding, transaction];
    });

    return NextResponse.json({ success: true, holding, transaction }, { status: 201 });
  } catch (err) {
    const e = err as { status?: number; message?: string; insufficientFunds?: boolean };
    if (e.status) {
      return NextResponse.json(
        { error: e.message, ...(e.insufficientFunds ? { insufficientFunds: true } : {}) },
        { status: e.status }
      );
    }
    console.error('[POST /api/investments/[id]/purchase]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
