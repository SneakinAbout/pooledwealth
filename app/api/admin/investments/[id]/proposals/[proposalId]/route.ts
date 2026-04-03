import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { auditLog } from '@/lib/audit';
import { z } from 'zod';

const RejectSchema = z.object({
  action: z.literal('reject'),
  reason: z.string().min(5).max(500),
});

const OpenSchema = z.object({
  action: z.literal('open'),
});

const ImplementSchema = z.object({
  action: z.literal('implement'),
});

const ActionSchema = z.discriminatedUnion('action', [RejectSchema, OpenSchema, ImplementSchema]);

// PATCH /api/admin/investments/[id]/proposals/[proposalId]
// actions: "reject" (DRAFT→INVALID), "open" (DRAFT→OPEN), "implement" (PASSED→IMPLEMENTED)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; proposalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const proposal = await prisma.proposal.findUnique({ where: { id: params.proposalId } });
    if (!proposal || proposal.investmentId !== params.id) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { action } = parsed.data;

    if (action === 'reject') {
      if (proposal.status !== 'DRAFT') {
        return NextResponse.json({ error: 'Only DRAFT proposals can be rejected.' }, { status: 409 });
      }
      const updated = await prisma.proposal.update({
        where: { id: params.proposalId },
        data: {
          status: 'INVALID',
          adminRejectionReason: parsed.data.reason,
        },
      });
      await auditLog(session!.user.id, 'REJECT_PROPOSAL', params.proposalId, { reason: parsed.data.reason });
      return NextResponse.json(updated);
    }

    if (action === 'open') {
      if (proposal.status !== 'DRAFT') {
        return NextResponse.json({ error: 'Only DRAFT proposals can be opened.' }, { status: 409 });
      }
      const now = new Date();
      const closesAt = new Date(now);
      closesAt.setDate(closesAt.getDate() + 7);

      const updated = await prisma.proposal.update({
        where: { id: params.proposalId },
        data: { status: 'OPEN', opensAt: now, closesAt },
      });
      await auditLog(session!.user.id, 'OPEN_PROPOSAL', params.proposalId, {});
      return NextResponse.json(updated);
    }

    if (action === 'implement') {
      if (proposal.status !== 'PASSED') {
        return NextResponse.json({ error: 'Only PASSED proposals can be marked implemented.' }, { status: 409 });
      }
      const updated = await prisma.proposal.update({
        where: { id: params.proposalId },
        data: { status: 'IMPLEMENTED', implementedAt: new Date() },
      });
      await auditLog(session!.user.id, 'IMPLEMENT_PROPOSAL', params.proposalId, {});
      return NextResponse.json(updated);
    }
  } catch (err) {
    console.error('[PATCH /api/admin/investments/[id]/proposals/[proposalId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
