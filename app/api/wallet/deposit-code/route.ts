import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAuth } from '@/lib/permissions';
import { assignDepositCode } from '@/lib/depositCode';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const authError = requireAuth(session);
    if (authError) return authError;

    if (!session!.user.kycApproved) {
      return NextResponse.json({ error: 'KYC approval required' }, { status: 403 });
    }

    const depositCode = await assignDepositCode(session!.user.id);

    return NextResponse.json({ depositCode });
  } catch (err) {
    console.error('[GET /api/wallet/deposit-code]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
