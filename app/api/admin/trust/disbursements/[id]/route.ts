import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { z } from 'zod';

const patchSchema = z.object({
  vendorAmount: z.number().positive().optional(),
  disbursedAt: z.string().datetime().optional(),
  disbursementRef: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * PATCH /api/admin/trust/disbursements/[id]
 * Records the vendor payment for an investment (trust → vendor).
 * Profit share is tracked per Distribution, not here.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const existing = await prisma.trustDisbursement.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Disbursement record not found' }, { status: 404 });
    }

    const data = parsed.data;
    const updated = await prisma.trustDisbursement.update({
      where: { id: params.id },
      data: {
        ...(data.vendorAmount !== undefined && { vendorAmount: data.vendorAmount }),
        ...(data.disbursedAt !== undefined && { disbursedAt: new Date(data.disbursedAt) }),
        ...(data.disbursementRef !== undefined && { disbursementRef: data.disbursementRef }),
        ...(data.notes !== undefined && { notes: data.notes }),
        recordedById: session!.user.id,
      },
    });

    return NextResponse.json({ success: true, disbursement: updated });
  } catch (err) {
    console.error('[PATCH /api/admin/trust/disbursements/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
