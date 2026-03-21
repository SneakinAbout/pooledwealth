import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/permissions';
import { refundAndRelist } from '@/lib/investmentActions';
import { auditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const investment = await prisma.investment.findUnique({ where: { id: params.id } });
    if (!investment) return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    if (investment.locked) {
      return NextResponse.json({ error: 'This investment is locked. Unlock it before issuing refunds.' }, { status: 409 });
    }

    const result = await refundAndRelist(params.id);

    await auditLog(session!.user.id, 'REFUND_AND_RELIST', params.id, result);

    return NextResponse.json(result);
  } catch (err) {
    const e = err as { message?: string };
    if (e.message === 'Investment not found') {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }
    console.error('[POST /api/admin/investments/[id]/refund]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
