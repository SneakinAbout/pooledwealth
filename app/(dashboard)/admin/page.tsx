import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') redirect('/investments');

  const [
    totalUsers,
    walletAggregate,
    activeInvestments,
    totalInvestments,
    pendingDeposits,
    draftProposals,
    pendingKycUsers,
    recentTransactions,
    openProposals,
    totalDistributed,
    passedProposals,
    pendingWithdrawals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.investment.count({ where: { status: 'ACTIVE' } }),
    prisma.investment.count(),
    prisma.deposit.findMany({
      where: { status: 'PENDING', type: 'BANK_TRANSFER' },
      include: {
        wallet: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.proposal.findMany({
      where: { status: 'DRAFT' },
      include: {
        investment: { select: { id: true, title: true } },
        raisedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.user.findMany({
      where: { kycApproved: false, role: 'INVESTOR' },
      select: { id: true, name: true, email: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.transaction.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true } },
        investment: { select: { title: true } },
      },
    }),
    prisma.proposal.count({ where: { status: 'OPEN' } }),
    prisma.distribution.aggregate({ _sum: { netAmount: true } }),
    prisma.proposal.findMany({
      where: { status: 'PASSED' },
      include: {
        investment: { select: { id: true, title: true } },
        raisedBy: { select: { name: true } },
        _count: { select: { votes: true } },
      },
      orderBy: { closesAt: 'desc' },
      take: 50,
    }),
    prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const totalAUM = Number(walletAggregate._sum.balance ?? 0);
  const pendingActionsCount =
    pendingDeposits.length + draftProposals.length + pendingKycUsers.length + passedProposals.length + pendingWithdrawals.length;

  return (
    <AdminDashboardClient
      stats={{
        totalUsers,
        totalAUM,
        activeInvestments,
        totalInvestments,
        pendingActionsCount,
        openProposals,
        totalDistributed: Number(totalDistributed._sum.netAmount ?? 0),
      }}
      pendingDeposits={pendingDeposits.map((d) => ({
        id: d.id,
        amount: Number(d.amount),
        createdAt: d.createdAt.toISOString(),
        userName: d.wallet.user.name,
        userEmail: d.wallet.user.email,
        reference: d.stripePaymentIntentId ?? '',
      }))}
      draftProposals={draftProposals.map((p) => ({
        id: p.id,
        type: p.type,
        description: p.description,
        investmentId: p.investment.id,
        investmentTitle: p.investment.title,
        raisedByName: p.raisedBy.name,
        createdAt: p.createdAt.toISOString(),
      }))}
      pendingKycUsers={pendingKycUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt.toISOString(),
      }))}
      passedProposals={passedProposals.map((p) => ({
        id: p.id,
        type: p.type,
        description: p.description,
        investmentId: p.investment.id,
        investmentTitle: p.investment.title,
        raisedByName: p.raisedBy.name,
        closedAt: p.closesAt?.toISOString() ?? null,
        voteCount: p._count.votes,
      }))}
      pendingWithdrawals={pendingWithdrawals.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        bankAccountName: w.bankAccountName,
        bankBsb: w.bankBsb,
        bankAccountNumber: w.bankAccountNumber,
        createdAt: w.createdAt.toISOString(),
        downloadedAt: w.downloadedAt?.toISOString() ?? null,
        userName: w.user.name,
        userEmail: w.user.email,
        userId: w.user.id,
      }))}
      recentTransactions={recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        userName: t.user.name,
        investmentTitle: t.investment?.title ?? null,
        units: t.units ?? null,
      }))}
    />
  );
}
