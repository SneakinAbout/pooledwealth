import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { tallyProposal, closeProposal, PROPOSAL_CONFIG } from '@/lib/proposals';
import { z } from 'zod';

const VoteSchema = z.object({
  choice: z.enum(['FOR', 'AGAINST']),
});

// POST /api/investments/[id]/proposals/[proposalId]/vote — cast or change vote
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; proposalId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admins cannot vote
  if (session.user.role === 'ADMIN') {
    return NextResponse.json({ error: 'Admins cannot vote on proposals.' }, { status: 403 });
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: params.proposalId },
  });

  if (!proposal || proposal.investmentId !== params.id) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  if (proposal.status !== 'OPEN') {
    return NextResponse.json({ error: 'This proposal is not open for voting.' }, { status: 409 });
  }

  if (proposal.closesAt && proposal.closesAt < new Date()) {
    return NextResponse.json({ error: 'Voting period has ended.' }, { status: 409 });
  }

  // Must hold units
  const holding = await prisma.holding.findFirst({
    where: { investmentId: params.id, userId: session.user.id },
  });
  if (!holding || holding.unitsPurchased === 0) {
    return NextResponse.json({ error: 'You do not hold units in this investment.' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = VoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();

  // Upsert vote (allows changing before close)
  const vote = await prisma.vote.upsert({
    where: {
      proposalId_userId: {
        proposalId: params.proposalId,
        userId: session.user.id,
      },
    },
    update: {
      choice: parsed.data.choice,
      sharesAtVoteTime: holding.unitsPurchased,
      lastChangedAt: now,
    },
    create: {
      proposalId: params.proposalId,
      userId: session.user.id,
      choice: parsed.data.choice,
      sharesAtVoteTime: holding.unitsPurchased,
      votedAt: now,
      lastChangedAt: now,
    },
  });

  // Check for early close after every vote
  const tally = await tallyProposal(params.proposalId, proposal.type);

  if (tally.earlyCloseReached && !proposal.earlyCloseTriggered) {
    // Mark early close and finalize
    await prisma.proposal.update({
      where: { id: params.proposalId },
      data: {
        earlyCloseTriggered: true,
        closesAt: now,
      },
    });
    await closeProposal(params.proposalId);
  }

  return NextResponse.json({ vote, tally });
}

// DELETE /api/investments/[id]/proposals/[proposalId]/vote — retract vote
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; proposalId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const proposal = await prisma.proposal.findUnique({ where: { id: params.proposalId } });
  if (!proposal || proposal.status !== 'OPEN') {
    return NextResponse.json({ error: 'Cannot retract vote.' }, { status: 409 });
  }

  await prisma.vote.deleteMany({
    where: { proposalId: params.proposalId, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
