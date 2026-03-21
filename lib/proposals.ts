import { prisma } from './prisma';
import { ProposalType, ProposalStatus } from '@prisma/client';

// ─── Constants ──────────────────────────────────────────────────────────────

export const PROPOSAL_CONFIG = {
  VOTING_WINDOW_DAYS: 7,
  MIN_PARTICIPATION_PERCENT: 25,   // % of total shares that must vote
  EARLY_CLOSE_PERCENT: 75,         // % same-way votes triggers early close
  THRESHOLDS: {
    EXIT: 50,
    RESERVE_PRICE: 50,
    STORAGE_INSURANCE: 50,
    DISPUTE: 33,
  },
  COOLDOWN_DAYS: {
    EXIT: 90,         // cooldown after a failed EXIT proposal
    RESERVE_PRICE: 30,
    STORAGE_INSURANCE: 0,
    DISPUTE: 0,
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the total units held by investors (excluding platform/admin holdings). */
export async function getTotalInvestorUnits(investmentId: string): Promise<number> {
  const holdings = await prisma.holding.findMany({
    where: { investmentId },
    include: { user: { select: { role: true } } },
  });
  // Exclude ADMIN & MANAGER platform holdings from vote weight
  return holdings
    .filter((h) => h.user.role === 'INVESTOR')
    .reduce((sum, h) => sum + h.unitsPurchased, 0);
}

/** Returns the units held by a specific user in an investment. */
export async function getUserUnits(investmentId: string, userId: string): Promise<number> {
  const holding = await prisma.holding.findFirst({
    where: { investmentId, userId },
  });
  return holding?.unitsPurchased ?? 0;
}

/** Checks whether a proposal type is on cooldown for this investment. */
export async function isOnCooldown(
  investmentId: string,
  type: ProposalType
): Promise<{ onCooldown: boolean; until?: Date }> {
  const cooldownDays = PROPOSAL_CONFIG.COOLDOWN_DAYS[type];
  if (!cooldownDays) return { onCooldown: false };

  const recentFailed = await prisma.proposal.findFirst({
    where: {
      investmentId,
      type,
      status: 'FAILED',
    },
    orderBy: { closesAt: 'desc' },
  });

  if (!recentFailed?.closesAt) return { onCooldown: false };

  const cooldownUntil = new Date(recentFailed.closesAt);
  cooldownUntil.setDate(cooldownUntil.getDate() + cooldownDays);

  if (cooldownUntil > new Date()) {
    return { onCooldown: true, until: cooldownUntil };
  }
  return { onCooldown: false };
}

/** Checks whether there's already an active (OPEN) proposal of this type. */
export async function hasActiveProposal(
  investmentId: string,
  type: ProposalType
): Promise<boolean> {
  const existing = await prisma.proposal.findFirst({
    where: { investmentId, type, status: { in: ['DRAFT', 'OPEN'] } },
  });
  return !!existing;
}

// ─── Tally ───────────────────────────────────────────────────────────────────

export interface ProposalTally {
  totalInvestorUnits: number;
  votedUnits: number;
  forUnits: number;
  againstUnits: number;
  participationPercent: number;
  forPercent: number;       // % of votes cast (not total shares)
  againstPercent: number;
  meetsParticipation: boolean;
  meetsThreshold: boolean;
  passed: boolean;
  earlyCloseReached: boolean;
}

export async function tallyProposal(
  proposalId: string,
  type: ProposalType
): Promise<ProposalTally> {
  const votes = await prisma.vote.findMany({ where: { proposalId } });
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    select: { investmentId: true },
  });

  const totalInvestorUnits = await getTotalInvestorUnits(proposal.investmentId);
  const forUnits = votes.filter((v) => v.choice === 'FOR').reduce((s, v) => s + v.sharesAtVoteTime, 0);
  const againstUnits = votes.filter((v) => v.choice === 'AGAINST').reduce((s, v) => s + v.sharesAtVoteTime, 0);
  const votedUnits = forUnits + againstUnits;

  const participationPercent = totalInvestorUnits > 0 ? (votedUnits / totalInvestorUnits) * 100 : 0;
  const forPercent = votedUnits > 0 ? (forUnits / votedUnits) * 100 : 0;
  const againstPercent = votedUnits > 0 ? (againstUnits / votedUnits) * 100 : 0;

  const threshold = PROPOSAL_CONFIG.THRESHOLDS[type];
  const meetsParticipation = participationPercent >= PROPOSAL_CONFIG.MIN_PARTICIPATION_PERCENT;
  // "ties fail" — must be strictly greater than threshold
  const meetsThreshold = forPercent > threshold;
  const passed = meetsParticipation && meetsThreshold;

  // Early close: 75% of total investor units voted the same way
  const earlyCloseReached =
    (forUnits / totalInvestorUnits) * 100 >= PROPOSAL_CONFIG.EARLY_CLOSE_PERCENT ||
    (againstUnits / totalInvestorUnits) * 100 >= PROPOSAL_CONFIG.EARLY_CLOSE_PERCENT;

  return {
    totalInvestorUnits,
    votedUnits,
    forUnits,
    againstUnits,
    participationPercent,
    forPercent,
    againstPercent,
    meetsParticipation,
    meetsThreshold,
    passed,
    earlyCloseReached,
  };
}

// ─── Close proposal ───────────────────────────────────────────────────────────

/** Closes an expired or early-closed proposal, setting the final status. */
export async function closeProposal(proposalId: string): Promise<ProposalStatus> {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    select: { type: true, status: true, investmentId: true },
  });

  if (proposal.status !== 'OPEN') return proposal.status;

  const tally = await tallyProposal(proposalId, proposal.type);

  let finalStatus: ProposalStatus;
  if (!tally.meetsParticipation) {
    finalStatus = 'INVALID'; // didn't reach quorum
  } else if (tally.passed) {
    finalStatus = 'PASSED';
  } else {
    finalStatus = 'FAILED';
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      status: finalStatus,
      earlyCloseTriggered: tally.earlyCloseReached,
    },
  });

  return finalStatus;
}

// ─── Create proposal ─────────────────────────────────────────────────────────

export interface CreateProposalInput {
  investmentId: string;
  raisedById: string;
  type: ProposalType;
  description: string;
  proposedValue?: string;
  /** Admins submit directly to OPEN; investors submit as DRAFT (removed for now — all go to OPEN via admin) */
  isAdmin?: boolean;
}

export async function createProposal(input: CreateProposalInput) {
  const { investmentId, raisedById, type, description, proposedValue, isAdmin } = input;

  // Check for active proposal of same type
  if (await hasActiveProposal(investmentId, type)) {
    throw new Error(`There is already an active ${type} proposal for this investment.`);
  }

  // Check cooldown
  const cooldown = await isOnCooldown(investmentId, type);
  if (cooldown.onCooldown) {
    throw new Error(
      `This proposal type is on cooldown until ${cooldown.until?.toLocaleDateString()}.`
    );
  }

  const now = new Date();
  const closesAt = new Date(now);
  closesAt.setDate(closesAt.getDate() + PROPOSAL_CONFIG.VOTING_WINDOW_DAYS);

  const status: ProposalStatus = isAdmin ? 'OPEN' : 'DRAFT';

  return prisma.proposal.create({
    data: {
      investmentId,
      raisedById,
      type,
      description,
      proposedValue,
      status,
      opensAt: status === 'OPEN' ? now : null,
      closesAt: status === 'OPEN' ? closesAt : null,
    },
    include: {
      raisedBy: { select: { id: true, name: true } },
      _count: { select: { votes: true } },
    },
  });
}
