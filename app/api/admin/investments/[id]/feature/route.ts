import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const inv = await prisma.investment.findUnique({ where: { id: params.id }, select: { featuredOnHome: true } });
    if (!inv) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.investment.update({
      where: { id: params.id },
      data: { featuredOnHome: !inv.featuredOnHome },
      select: { featuredOnHome: true },
    });

    return NextResponse.json({ featuredOnHome: updated.featuredOnHome });
  } catch (err) {
    console.error('[POST /api/admin/investments/[id]/feature]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
