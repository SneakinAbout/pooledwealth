import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { auditLog } from '@/lib/audit';
import { z } from 'zod';

const schema = z.object({
  feeDiscountPercent: z.number().min(0).max(100),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { feeDiscountPercent: result.data.feeDiscountPercent },
      select: { id: true, feeDiscountPercent: true },
    });

    await auditLog(session!.user.id, 'UPDATE_FEE_DISCOUNT', params.id, {
      feeDiscountPercent: result.data.feeDiscountPercent,
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error('[PUT /api/admin/users/[id]/discount]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
