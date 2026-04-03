import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { z } from 'zod';

const createSchema = z.object({
  amount: z.number().positive(),
  extractedAt: z.string().datetime(),
  bankRef: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * POST /api/admin/trust/fee-extractions
 * Records a management fee sweep from trust → general account.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { amount, extractedAt, bankRef, notes } = parsed.data;

    const extraction = await prisma.trustFeeExtraction.create({
      data: {
        amount,
        extractedAt: new Date(extractedAt),
        bankRef: bankRef ?? null,
        notes: notes ?? null,
        recordedById: session!.user.id,
      },
    });

    return NextResponse.json({ success: true, extraction }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/admin/trust/fee-extractions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/trust/fee-extractions
 * Lists all management fee extraction records.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const extractions = await prisma.trustFeeExtraction.findMany({
      include: { recordedBy: { select: { name: true } } },
      orderBy: { extractedAt: 'desc' },
    });

    return NextResponse.json({
      extractions: extractions.map((e) => ({
        id: e.id,
        amount: Number(e.amount),
        extractedAt: e.extractedAt.toISOString(),
        bankRef: e.bankRef,
        notes: e.notes,
        recordedBy: e.recordedBy?.name ?? null,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error('[GET /api/admin/trust/fee-extractions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
