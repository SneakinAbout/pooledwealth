import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/permissions';
import { autoAllocateToPlatform } from '@/lib/investmentActions';
import { auditLog } from '@/lib/audit';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const result = await autoAllocateToPlatform(params.id);

    await auditLog(session!.user.id, 'AUTO_ALLOCATE', params.id, result);

    return NextResponse.json(result);
  } catch (err) {
    const e = err as { message?: string };
    if (e.message === 'Investment not found' || e.message === 'No platform admin user found') {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e.message === 'No unallocated units remaining') {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error('[POST /api/admin/investments/[id]/auto-allocate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
