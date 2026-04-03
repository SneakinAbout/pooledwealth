import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { z } from 'zod';

const patchSchema = z.object({
  // Record asset sale proceeds entering the trust bank account
  saleProceeds: z.number().positive().optional(),
  saleProceedsRef: z.string().max(200).optional(),

  // Record profit share sweep: trust → general account
  profitShareSweptAt: z.string().datetime().optional(),
  profitShareSweptRef: z.string().max(200).optional(),
});

/**
 * PATCH /api/admin/distributions/[id]
 * Records sale proceeds received into trust and/or profit share sweep to general account.
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

    const existing = await prisma.distribution.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
    }

    const data = parsed.data;
    const updated = await prisma.distribution.update({
      where: { id: params.id },
      data: {
        ...(data.saleProceeds !== undefined && { saleProceeds: data.saleProceeds }),
        ...(data.saleProceedsRef !== undefined && { saleProceedsRef: data.saleProceedsRef }),
        ...(data.profitShareSweptAt !== undefined && { profitShareSweptAt: new Date(data.profitShareSweptAt) }),
        ...(data.profitShareSweptRef !== undefined && { profitShareSweptRef: data.profitShareSweptRef }),
        ...(data.profitShareSweptAt !== undefined && { profitShareSweptById: session!.user.id }),
      },
    });

    return NextResponse.json({ success: true, distribution: updated });
  } catch (err) {
    console.error('[PATCH /api/admin/distributions/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
