import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Schema = z.object({
  currentValue: z.number().positive('Value must be positive'),
});

// PATCH /api/investments/[id]/valuation — manager or admin only
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const investment = await prisma.investment.findUnique({ where: { id: params.id } });
  if (!investment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Managers can only update their own investments
  if (session.user.role === 'MANAGER' && investment.createdById !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.investment.update({
    where: { id: params.id },
    data: { currentValue: parsed.data.currentValue },
    select: { id: true, currentValue: true },
  });

  return NextResponse.json({ currentValue: Number(updated.currentValue) });
}
