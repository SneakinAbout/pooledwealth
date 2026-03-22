import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

// GET /api/admin/pending-count
// Returns the total number of items needing admin attention.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const [deposits, withdrawals, kyc, proposals, passed] = await Promise.all([
      prisma.deposit.count({ where: { status: 'PENDING', type: 'BANK_TRANSFER' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { kycApproved: false, role: 'INVESTOR' } }),
      prisma.proposal.count({ where: { status: 'DRAFT' } }),
      prisma.proposal.count({ where: { status: 'PASSED' } }),
    ]);

    return NextResponse.json({
      total: deposits + withdrawals + kyc + proposals + passed,
      deposits,
      withdrawals,
      kyc,
      proposals,
      passed,
    });
  } catch (err) {
    console.error('[GET /api/admin/pending-count]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
