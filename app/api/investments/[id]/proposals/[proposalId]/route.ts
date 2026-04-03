import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tallyProposal } from '@/lib/proposals';

// GET /api/investments/[id]/proposals/[proposalId] — get a single proposal with tally
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; proposalId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdminOrManager = session.user.role === 'ADMIN' || session.user.role === 'MANAGER';

    const proposal = await prisma.proposal.findUnique({
      where: { id: params.proposalId },
      include: {
        raisedBy: { select: { id: true, name: true } },
        _count: { select: { votes: true } },
        votes: {
          where: { userId: session.user.id },
          select: { choice: true, votedAt: true, lastChangedAt: true },
        },
      },
    });

    if (!proposal || proposal.investmentId !== params.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Non-admins can't see DRAFT proposals unless they raised them
    if (!isAdminOrManager && proposal.status === 'DRAFT' && proposal.raisedById !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const tally = await tallyProposal(params.proposalId, proposal.type);

    return NextResponse.json({
      ...proposal,
      tally,
    });
  } catch (err) {
    console.error('[GET /api/investments/[id]/proposals/[proposalId]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
