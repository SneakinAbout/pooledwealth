import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const agreement = await prisma.masterAgreement.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      fullNameAtSigning: true,
      agreedAt: true,
      ipAddress: true,
      agreementVersion: true,
    },
  });

  return NextResponse.json({ agreement: agreement ?? null });
}
