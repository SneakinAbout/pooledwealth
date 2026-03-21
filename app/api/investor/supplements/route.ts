import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supplements = await prisma.assetSupplement.findMany({
    where: { userId: session.user.id },
    orderBy: { signedAt: 'desc' },
    select: {
      id: true,
      sharesPurchased: true,
      totalShares: true,
      ownershipPercentage: true,
      fullNameAtSigning: true,
      signedAt: true,
      agreementVersion: true,
      status: true,
      finalisedAt: true,
      investment: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
        },
      },
    },
  });

  return NextResponse.json({
    supplements: supplements.map((s) => ({
      ...s,
      ownershipPercentage: Number(s.ownershipPercentage),
      signedAt: s.signedAt.toISOString(),
      finalisedAt: s.finalisedAt?.toISOString() ?? null,
    })),
  });
}
