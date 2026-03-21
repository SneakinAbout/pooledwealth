import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { auditLog } from '@/lib/audit';
import { chargeManagementFees } from '@/lib/chargeManagementFees';

function calcEffectiveFee(totalInvested: number, annualPct: number, discountPct: number) {
  const gross = Math.round((totalInvested * (annualPct / 100) / 12) * 100) / 100;
  const effective = Math.round(gross * (1 - discountPct / 100) * 100) / 100;
  return { gross, effective };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const [settings, users] = await Promise.all([
      prisma.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } }),
      prisma.user.findMany({
        where: { holdings: { some: {} } },
        include: {
          holdings: { select: { purchasePrice: true } },
          wallet: { select: { balance: true } },
        },
      }),
    ]);

    const annualPct = Number(settings?.managementFeePercent ?? 2);

    const breakdown = users.map((u) => {
      const totalInvested = u.holdings.reduce((sum, h) => sum + Number(h.purchasePrice), 0);
      const discountPct = Number(u.feeDiscountPercent) || 0;
      const { gross, effective } = calcEffectiveFee(totalInvested, annualPct, discountPct);
      const walletBalance = Number(u.wallet?.balance ?? 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        totalInvested,
        grossFee: gross,
        discountPercent: discountPct,
        effectiveFee: effective,
        walletBalance,
        canPay: walletBalance >= effective,
        hasInvestments: totalInvested > 0,
      };
    }).filter((u) => u.hasInvestments);

    const totalFee = breakdown.reduce((s, u) => s + u.effectiveFee, 0);
    const collectible = breakdown.filter((u) => u.canPay).reduce((s, u) => s + u.effectiveFee, 0);

    return NextResponse.json({ annualPct, breakdown, totalFee, collectible });
  } catch (err) {
    console.error('[GET /api/admin/fees]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const { charged, skipped, totalCollected } = await chargeManagementFees();

    await auditLog(session!.user.id, 'COLLECT_FEES', undefined, {
      charged,
      skipped,
      totalCollected,
    });

    return NextResponse.json({ charged, skipped, totalCollected });
  } catch (err) {
    console.error('[POST /api/admin/fees]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
