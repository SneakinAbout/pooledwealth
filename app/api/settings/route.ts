import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint — returns current platform settings (no sensitive data)
export async function GET() {
  try {
    const settings = await prisma.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!settings) return NextResponse.json({});

    return NextResponse.json({
      platformName: settings.platformName,
      supportEmail: settings.supportEmail,
      minDepositAmount: settings.minDepositAmount,
      maxDepositAmount: settings.maxDepositAmount,
      bankName: settings.bankName,
      bankAccountName: settings.bankAccountName,
      bankBSB: settings.bankBSB,
      bankAccountNumber: settings.bankAccountNumber,
      bankSwift: settings.bankSwift,
      managementFeePercent: Number(settings.managementFeePercent),
      profitSharePercent: Number(settings.profitSharePercent),
    });
  } catch (err) {
    console.error('[GET /api/settings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
