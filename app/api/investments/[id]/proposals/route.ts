import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createProposal } from '@/lib/proposals';
import { z } from 'zod';

const CreateProposalSchema = z.object({
  type: z.enum(['EXIT', 'RESERVE_PRICE', 'STORAGE_INSURANCE', 'DISPUTE']),
  description: z.string().min(10).max(2000),
  proposedValue: z.string().optional(),
});

// GET /api/investments/[id]/proposals — list proposals for an investment
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Must be a co-owner (holding) or admin/manager
    const isAdminOrManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';

    if (!isAdminOrManager) {
      const holding = await prisma.holding.findFirst({
        where: { investmentId: params.id, userId: session.user.id },
      });
      if (!holding) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const proposals = await prisma.proposal.findMany({
      where: {
        investmentId: params.id,
        // Non-admins only see OPEN and resolved proposals (not DRAFT)
        ...(isAdminOrManager ? {} : { status: { not: 'DRAFT' } }),
      },
      include: {
        raisedBy: { select: { id: true, name: true } },
        _count: { select: { votes: true } },
        votes: {
          where: { userId: session.user.id },
          select: { choice: true, votedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(proposals);
  } catch (err) {
    console.error('[GET /api/investments/[id]/proposals]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/investments/[id]/proposals — create a proposal
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = session.user.role === 'ADMIN';

    // Check co-ownership (investors must hold shares; admins can raise without holding)
    if (!isAdmin) {
      const holding = await prisma.holding.findFirst({
        where: { investmentId: params.id, userId: session.user.id },
      });
      if (!holding) return NextResponse.json({ error: 'Forbidden: you do not hold units in this investment' }, { status: 403 });
    }

    // Check investment exists and is locked
    const investment = await prisma.investment.findUnique({ where: { id: params.id } });
    if (!investment) return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    if (!investment.locked) {
      return NextResponse.json({ error: 'Proposals can only be raised for locked investments.' }, { status: 409 });
    }

    const body = await req.json();
    const parsed = CreateProposalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const proposal = await createProposal({
      investmentId: params.id,
      raisedById: session.user.id,
      type: parsed.data.type,
      description: parsed.data.description,
      proposedValue: parsed.data.proposedValue,
      isAdmin,
    });
    return NextResponse.json(proposal, { status: 201 });
  } catch (err) {
    const e = err as { message?: string };
    if (e.message && e.message !== 'Internal server error') {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    console.error('[POST /api/investments/[id]/proposals]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
