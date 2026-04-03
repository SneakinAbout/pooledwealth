import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/permissions';
import { rateLimit } from '@/lib/rateLimit';
import { z } from 'zod';
import { generateSupplementText, SUPPLEMENT_VERSION } from '@/lib/supplementText';

const purchaseBodySchema = z.object({
  units: z.number().int().positive(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
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

    // Check master agreement exists
    const masterAgreement = await prisma.masterAgreement.findUnique({
      where: { userId: session!.user.id },
    });
    if (!masterAgreement) {
      return NextResponse.json(
        { error: 'You must sign the Master Co-Ownership Agreement before purchasing.', requiresAgreement: true },
        { status: 403 }
      );
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

    const { units, fullName } = result.data;

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
    const [holding, transaction, supplement] = await prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction for authoritative, consistent state
      const freshInvestment = await tx.investment.findUnique({ where: { id: params.id } });

      if (!freshInvestment || freshInvestment.status !== 'ACTIVE') {
        throw Object.assign(new Error('Investment is not currently active'), { status: 400 });
      }

      if (new Date() > freshInvestment.endDate) {
        throw Object.assign(new Error('Subscription period for this investment has ended'), { status: 400 });
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

      // Atomically deduct wallet balance only if sufficient funds exist (prevents race condition)
      const walletUpdated = await tx.wallet.updateMany({
        where: { id: wallet!.id, balance: { gte: totalCost } },
        data: { balance: { decrement: totalCost } },
      });
      if (walletUpdated.count === 0) {
        throw Object.assign(new Error('Insufficient wallet balance'), { status: 400, insufficientFunds: true });
      }

      // Atomically decrement availableUnits only if enough remain (prevents oversell race condition)
      const investmentUpdated = await tx.investment.updateMany({
        where: { id: params.id, availableUnits: { gte: units } },
        data: { availableUnits: { decrement: units } },
      });
      if (investmentUpdated.count === 0) {
        throw Object.assign(
          new Error(`Only ${freshInvestment.availableUnits} units available`),
          { status: 400 }
        );
      }

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

      const txRecord = await tx.transaction.create({
        data: {
          userId: session!.user.id,
          investmentId: params.id,
          type: 'PURCHASE',
          units,
          amount: totalCost,
          status: 'COMPLETED',
        },
      });

      // Generate and store the supplement
      const ownershipPercentage = (units / freshInvestment.totalUnits) * 100;
      const agreementText = generateSupplementText({
        assetName: freshInvestment.title,
        edition: freshInvestment.edition,
        grade: freshInvestment.grade,
        gradingCompany: freshInvestment.gradingCompany,
        certNumber: freshInvestment.certNumber,
        acquisitionDate: freshInvestment.acquisitionDate?.toISOString() ?? null,
        acquisitionPrice: freshInvestment.acquisitionPrice ? Number(freshInvestment.acquisitionPrice) : null,
        totalShares: freshInvestment.totalUnits,
        sharesPurchased: units,
        sharePrice: Number(freshInvestment.pricePerUnit),
        ownershipPercentage,
        roundCloseDate: freshInvestment.endDate.toISOString(),
        coOwnerName: fullName,
      });

      const supplement = await tx.assetSupplement.create({
        data: {
          userId: session!.user.id,
          investmentId: params.id,
          sharesPurchased: units,
          totalShares: freshInvestment.totalUnits,
          ownershipPercentage,
          fullNameAtSigning: fullName,
          ipAddress: ip,
          agreementVersion: SUPPLEMENT_VERSION,
          agreementText,
          status: 'PENDING',
        },
      });

      return [holding, txRecord, supplement];
    });

    return NextResponse.json({ success: true, holding, transaction, supplementId: supplement.id }, { status: 201 });
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
