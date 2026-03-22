'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Receipt,
  BarChart3,
  Settings,
  Landmark,
  Vote,
  ShieldCheck,
  ArrowUpRight,
  Activity,
  Sparkles,
  ArrowDownLeft,
  Download,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalUsers: number;
  totalAUM: number;
  activeInvestments: number;
  totalInvestments: number;
  pendingActionsCount: number;
  openProposals: number;
  totalDistributed: number;
}

interface PendingDeposit {
  id: string;
  amount: number;
  createdAt: string;
  userName: string;
  userEmail: string;
  reference: string;
}

interface DraftProposal {
  id: string;
  type: string;
  description: string;
  investmentId: string;
  investmentTitle: string;
  raisedByName: string;
  createdAt: string;
}

interface PassedProposal {
  id: string;
  type: string;
  description: string;
  investmentId: string;
  investmentTitle: string;
  raisedByName: string;
  closedAt: string | null;
  voteCount: number;
}

interface PendingKycUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface PendingWithdrawal {
  id: string;
  amount: number;
  bankAccountName: string;
  bankBsb: string;
  bankAccountNumber: string;
  createdAt: string;
  downloadedAt: string | null;
  userName: string;
  userEmail: string;
  userId: string;
}

interface RecentTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  userName: string;
  investmentTitle: string | null;
  units: number | null;
}

interface Props {
  stats: Stats;
  pendingDeposits: PendingDeposit[];
  draftProposals: DraftProposal[];
  passedProposals: PassedProposal[];
  pendingKycUsers: PendingKycUser[];
  pendingWithdrawals: PendingWithdrawal[];
  recentTransactions: RecentTransaction[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TX_TYPE_LABEL: Record<string, string> = {
  PURCHASE: 'Purchase',
  REDEMPTION: 'Redemption',
  FEE: 'Fee',
  DISTRIBUTION: 'Distribution',
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
};

const TX_TYPE_COLOR: Record<string, string> = {
  PURCHASE: 'text-[#1565C0]',
  REDEMPTION: 'text-orange-600',
  FEE: 'text-[#8A7A60]',
  DISTRIBUTION: 'text-[#2E7D32]',
  DEPOSIT: 'text-[#2E7D32]',
  WITHDRAWAL: 'text-red-600',
};

const PROPOSAL_TYPE_LABEL: Record<string, string> = {
  EXIT: 'Exit',
  RESERVE_PRICE: 'Reserve Price',
  STORAGE_INSURANCE: 'Storage & Insurance',
  DISPUTE: 'Dispute',
};

const QUICK_LINKS = [
  { label: 'Investments', href: '/admin/investments', icon: Building2, desc: 'Manage all assets' },
  { label: 'Users', href: '/admin/users', icon: Users, desc: 'KYC & roles' },
  { label: 'Bank Deposits', href: '/admin/deposits', icon: Landmark, desc: 'Approve transfers' },
  { label: 'Distributions', href: '/admin/distributions', icon: DollarSign, desc: 'Pay out returns' },
  { label: 'Fee Collection', href: '/admin/fees', icon: Receipt, desc: 'Charge management fees' },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, desc: 'Platform metrics' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, desc: 'Platform configuration' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboardClient({
  stats,
  pendingDeposits: initialDeposits,
  draftProposals: initialProposals,
  passedProposals: initialPassed,
  pendingKycUsers: initialKyc,
  pendingWithdrawals: initialWithdrawals,
  recentTransactions,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'deposits' | 'proposals' | 'passed' | 'kyc' | 'withdrawals'>('deposits');
  const [deposits, setDeposits] = useState(initialDeposits);
  const [proposals, setProposals] = useState(initialProposals);
  const [passedProposals, setPassedProposals] = useState(initialPassed);
  const [kycUsers, setKycUsers] = useState(initialKyc);
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [rejectProposalId, setRejectProposalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const totalPending = deposits.length + proposals.length + passedProposals.length + kycUsers.length + withdrawals.length;

  // ── Deposit actions ──────────────────────────────────────────────────────

  async function handleDeposit(id: string, action: 'approve' | 'reject') {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/deposits/${id}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? 'Action failed');
        return;
      }
      toast.success(action === 'approve' ? 'Deposit approved' : 'Deposit rejected');
      setDeposits((prev) => prev.filter((d) => d.id !== id));
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  // ── Proposal actions ─────────────────────────────────────────────────────

  async function handleProposal(
    p: DraftProposal,
    action: 'open' | 'reject',
    reason?: string
  ) {
    setLoadingId(p.id);
    try {
      const res = await fetch(
        `/api/admin/investments/${p.investmentId}/proposals/${p.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...(reason ? { reason } : {}) }),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? 'Action failed');
        return;
      }
      toast.success(action === 'open' ? 'Proposal opened for voting' : 'Proposal rejected');
      setProposals((prev) => prev.filter((pr) => pr.id !== p.id));
      setRejectProposalId(null);
      setRejectReason('');
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  // ── KYC actions ──────────────────────────────────────────────────────────

  async function handleKyc(userId: string) {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycApproved: true }),
      });
      if (!res.ok) {
        toast.error('Failed to approve KYC');
        return;
      }
      toast.success('KYC approved');
      setKycUsers((prev) => prev.filter((u) => u.id !== userId));
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  // ── Implement passed proposal ────────────────────────────────────────────

  async function handleImplement(p: PassedProposal) {
    setLoadingId(p.id);
    try {
      const res = await fetch(
        `/api/admin/investments/${p.investmentId}/proposals/${p.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'implement' }),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? 'Action failed');
        return;
      }
      toast.success('Marked as implemented');
      setPassedProposals((prev) => prev.filter((pr) => pr.id !== p.id));
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  // ── Download CSV ─────────────────────────────────────────────────────────

  async function handleDownloadCsv() {
    setDownloadingCsv(true);
    try {
      const res = await fetch('/api/admin/withdrawals/download', { method: 'POST' });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? 'Download failed');
        return;
      }
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `withdrawals-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      // Mark all not-yet-downloaded rows as downloaded in local state
      const now = new Date().toISOString();
      setWithdrawals((prev) => prev.map((w) => ({ ...w, downloadedAt: w.downloadedAt ?? now })));
      toast.success('CSV downloaded — rows marked as sent to bank');
    } finally {
      setDownloadingCsv(false);
    }
  }

  // ── Withdrawal actions ───────────────────────────────────────────────────

  async function handleWithdrawal(id: string, action: 'approve' | 'reject') {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? 'Action failed');
        return;
      }
      toast.success(action === 'approve' ? 'Withdrawal approved' : 'Withdrawal rejected & refunded');
      setWithdrawals((prev) => prev.filter((w) => w.id !== id));
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  // ── Tab config ───────────────────────────────────────────────────────────

  const tabs = [
    { key: 'deposits' as const, label: 'Bank Deposits', count: deposits.length, icon: Landmark },
    { key: 'withdrawals' as const, label: 'Withdrawals', count: withdrawals.length, icon: ArrowDownLeft },
    { key: 'proposals' as const, label: 'Draft Proposals', count: proposals.length, icon: Vote },
    { key: 'passed' as const, label: 'To Implement', count: passedProposals.length, icon: Sparkles },
    { key: 'kyc' as const, label: 'KYC Pending', count: kycUsers.length, icon: ShieldCheck },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1207]">Admin Dashboard</h1>
        <p className="text-sm text-[#8A7A60] mt-0.5">Platform overview and pending actions</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total AUM', value: formatCurrency(stats.totalAUM), icon: DollarSign, color: 'bg-[#E8F5E9] text-[#2E7D32]' },
          { label: 'Investments', value: `${stats.activeInvestments} / ${stats.totalInvestments}`, icon: Building2, color: 'bg-[#E3F2FD] text-[#1565C0]' },
          { label: 'Users', value: stats.totalUsers.toString(), icon: Users, color: 'bg-[#FDF8ED] text-[#C9A84C]' },
          {
            label: 'Pending',
            value: totalPending.toString(),
            icon: AlertCircle,
            color: totalPending > 0 ? 'bg-red-50 text-red-600' : 'bg-[#EDE6D6] text-[#8A7A60]',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#8A7A60] mb-1">{label}</p>
                <p className="text-base sm:text-xl font-bold text-[#1A1207] tabular-nums truncate">{value}</p>
              </div>
              <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 sm:p-4 flex items-center gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-[#FDF8ED] flex items-center justify-center flex-shrink-0">
            <Vote className="h-4 w-4 sm:h-5 sm:w-5 text-[#C9A84C]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#8A7A60]">Open Votes</p>
            <p className="text-sm sm:text-lg font-bold text-[#1A1207] truncate">{stats.openProposals} proposals</p>
          </div>
        </Card>
        <Card className="p-3 sm:p-4 flex items-center gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#2E7D32]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#8A7A60]">Distributed</p>
            <p className="text-sm sm:text-lg font-bold text-[#1A1207] truncate">{formatCurrency(stats.totalDistributed)}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Queue — left, 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-0 overflow-hidden">
            {/* Tabs — scrollable on mobile */}
            <div className="flex overflow-x-auto border-b border-[#E8E2D6] scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                const shortLabel: Record<string, string> = {
                  deposits: 'Deposits',
                  withdrawals: 'Withdrawals',
                  proposals: 'Proposals',
                  passed: 'Implement',
                  kyc: 'KYC',
                };
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
                      active
                        ? 'border-[#C9A84C] text-[#1A1207] bg-[#FDF8ED]'
                        : 'border-transparent text-[#8A7A60] hover:text-[#1A1207] hover:bg-[#F7F4EE]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{shortLabel[tab.key]}</span>
                    {tab.count > 0 && (
                      <span className={`h-4 min-w-[1rem] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        active ? 'bg-[#C9A84C] text-[#1A1207]' : 'bg-[#EDE6D6] text-[#6A5A40]'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="divide-y divide-[#E8E2D6]">

              {/* ── Deposits ── */}
              {activeTab === 'deposits' && (
                deposits.length === 0 ? (
                  <EmptyState icon={Landmark} message="No pending bank deposits" />
                ) : (
                  deposits.map((dep) => (
                    <div key={dep.id} className="p-4 flex items-center gap-4">
                      <div className="h-9 w-9 rounded-full bg-[#E3F2FD] flex items-center justify-center flex-shrink-0">
                        <Landmark className="h-4 w-4 text-[#1565C0]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1207] truncate">{dep.userName}</p>
                        <p className="text-xs text-[#8A7A60] truncate">{dep.userEmail}</p>
                        {dep.reference && (
                          <p className="text-[10px] mt-0.5">
                            <span className="text-[#8A7A60]">Ref: </span>
                            <code className="font-mono text-[#1A1207] bg-[#EDE6D6] px-1 rounded">{dep.reference}</code>
                          </p>
                        )}
                        <p className="text-[10px] text-[#8A7A60] mt-0.5">{formatDate(dep.createdAt)}</p>
                      </div>
                      <div className="text-right flex-shrink-0 mr-3">
                        <p className="text-base font-bold text-[#1A1207] tabular-nums">{formatCurrency(dep.amount)}</p>
                        <p className="text-[10px] text-[#8A7A60]">Bank transfer</p>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleDeposit(dep.id, 'approve')}
                          disabled={loadingId === dep.id}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeposit(dep.id, 'reject')}
                          disabled={loadingId === dep.id}
                          className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3 w-3" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )
              )}

              {/* ── Proposals ── */}
              {activeTab === 'proposals' && (
                proposals.length === 0 ? (
                  <EmptyState icon={Vote} message="No draft proposals awaiting review" />
                ) : (
                  proposals.map((p) => (
                    <div key={p.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#FDF8ED] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Vote className="h-4 w-4 text-[#C9A84C]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#EDE6D6] text-[#6A5A40] uppercase tracking-wide">
                              {PROPOSAL_TYPE_LABEL[p.type] ?? p.type}
                            </span>
                            <Link
                              href={`/investments/${p.investmentId}`}
                              className="text-xs text-[#1565C0] hover:underline truncate flex items-center gap-0.5"
                            >
                              {p.investmentTitle}
                              <ArrowUpRight className="h-3 w-3 flex-shrink-0" />
                            </Link>
                          </div>
                          <p className="text-sm text-[#1A1207] line-clamp-2">{p.description}</p>
                          <p className="text-[10px] text-[#8A7A60] mt-1">
                            Raised by {p.raisedByName} · {formatDate(p.createdAt)}
                          </p>
                        </div>
                      </div>

                      {rejectProposalId === p.id ? (
                        <div className="ml-12 space-y-2">
                          <textarea
                            className="w-full text-xs border border-[#C8BEA8] rounded-xl p-2.5 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
                            rows={2}
                            placeholder="Reason for rejection..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setRejectProposalId(null); setRejectReason(''); }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleProposal(p, 'reject', rejectReason)}
                              disabled={loadingId === p.id || rejectReason.trim().length < 5}
                              className="flex-1 text-red-600 hover:bg-red-50"
                            >
                              Confirm Reject
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="ml-12 flex gap-2">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleProposal(p, 'open')}
                            disabled={loadingId === p.id}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Open for Voting
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setRejectProposalId(p.id)}
                            className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )
              )}

              {/* ── Passed Proposals ── */}
              {activeTab === 'passed' && (
                passedProposals.length === 0 ? (
                  <EmptyState icon={Sparkles} message="No passed proposals awaiting implementation" />
                ) : (
                  passedProposals.map((p) => (
                    <div key={p.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Sparkles className="h-4 w-4 text-[#2E7D32]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9] uppercase tracking-wide">
                              PASSED · {PROPOSAL_TYPE_LABEL[p.type] ?? p.type}
                            </span>
                            <Link
                              href={`/investments/${p.investmentId}`}
                              className="text-xs text-[#1565C0] hover:underline truncate flex items-center gap-0.5"
                            >
                              {p.investmentTitle}
                              <ArrowUpRight className="h-3 w-3 flex-shrink-0" />
                            </Link>
                          </div>
                          <p className="text-sm text-[#1A1207] line-clamp-2">{p.description}</p>
                          <p className="text-[10px] text-[#8A7A60] mt-1">
                            Raised by {p.raisedByName}
                            {p.closedAt ? ` · Closed ${formatDate(p.closedAt)}` : ''}
                            {' · '}{p.voteCount} votes
                          </p>
                        </div>
                      </div>
                      <div className="ml-12">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleImplement(p)}
                          disabled={loadingId === p.id}
                          className="flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Mark as Implemented
                        </Button>
                      </div>
                    </div>
                  ))
                )
              )}

              {/* ── Withdrawals ── */}
              {activeTab === 'withdrawals' && (
                withdrawals.length === 0 ? (
                  <EmptyState icon={ArrowDownLeft} message="No pending withdrawal requests" />
                ) : (
                  <>
                    {/* Bulk download bar */}
                    <div className="px-4 py-3 bg-[#F7F4EE] border-b border-[#E8E2D6] flex items-center justify-between gap-3">
                      <div className="text-xs text-[#6A5A40]">
                        <span className="font-medium text-[#1A1207]">{withdrawals.filter((w) => !w.downloadedAt).length}</span> not yet sent to bank
                        {' · '}
                        <span className="font-medium text-[#2E7D32]">{withdrawals.filter((w) => w.downloadedAt).length}</span> already downloaded
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleDownloadCsv}
                        disabled={downloadingCsv || withdrawals.every((w) => w.downloadedAt)}
                        className="flex items-center gap-1.5 flex-shrink-0"
                      >
                        <Download className="h-3 w-3" />
                        {downloadingCsv ? 'Downloading…' : 'Download CSV'}
                      </Button>
                    </div>

                    {withdrawals.map((w) => (
                      <div key={w.id} className="p-4 flex items-start gap-4">
                        <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <ArrowDownLeft className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-[#1A1207]">{formatCurrency(w.amount)}</p>
                            <Link href={`/admin/users/${w.userId}`} className="text-xs text-[#1565C0] hover:underline truncate">
                              {w.userName}
                            </Link>
                            {/* Download status badge */}
                            {w.downloadedAt ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F5E9] text-[#2E7D32]">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Sent to bank
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                                <Download className="h-2.5 w-2.5" />
                                Not downloaded
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8A7A60] truncate mt-0.5">{w.bankAccountName} · BSB {w.bankBsb} · {w.bankAccountNumber}</p>
                          <p className="text-[10px] text-[#8A7A60] mt-0.5">
                            Requested {formatDate(w.createdAt)}
                            {w.downloadedAt && (
                              <> · Downloaded {formatDate(w.downloadedAt)}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleWithdrawal(w.id, 'approve')}
                            disabled={loadingId === w.id}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleWithdrawal(w.id, 'reject')}
                            disabled={loadingId === w.id}
                            className="flex items-center gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )
              )}

              {/* ── KYC ── */}
              {activeTab === 'kyc' && (
                kycUsers.length === 0 ? (
                  <EmptyState icon={ShieldCheck} message="No pending KYC applications" />
                ) : (
                  kycUsers.map((u) => (
                    <div key={u.id} className="p-4 flex items-center gap-4">
                      <div className="h-9 w-9 rounded-full bg-[#1A2B1F]/10 flex items-center justify-center flex-shrink-0 text-[#1A2B1F] text-sm font-bold">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1A1207] truncate">{u.name}</p>
                        <p className="text-xs text-[#8A7A60] truncate">{u.email}</p>
                        <p className="text-[10px] text-[#8A7A60] mt-0.5">Registered {formatDate(u.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleKyc(u.id)}
                          disabled={loadingId === u.id}
                          className="flex items-center gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Approve
                        </Button>
                        <Link href={`/admin/users/${u.id}`}>
                          <Button size="sm" variant="ghost" className="text-[#6A5A40]">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#E8E2D6]">
              <Activity className="h-4 w-4 text-[#8A7A60]" />
              <h2 className="text-sm font-semibold text-[#1A1207]">Recent Activity</h2>
            </div>
            <div className="divide-y divide-[#E8E2D6]">
              {recentTransactions.length === 0 ? (
                <EmptyState icon={Activity} message="No recent transactions" />
              ) : (
                recentTransactions.map((tx) => (
                  <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${TX_TYPE_COLOR[tx.type] ?? 'text-[#6A5A40]'}`}>
                          {TX_TYPE_LABEL[tx.type] ?? tx.type}
                        </span>
                        <StatusDot status={tx.status} />
                      </div>
                      <p className="text-xs text-[#6A5A40] truncate mt-0.5">
                        {tx.userName}
                        {tx.investmentTitle ? ` · ${tx.investmentTitle}` : ''}
                        {tx.units ? ` · ${tx.units} units` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-[#1A1207]">
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[10px] text-[#8A7A60]">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Links — right, 1/3 width */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[#8A7A60] px-1">Quick Links</h2>
          {QUICK_LINKS.map(({ label, href, icon: Icon, desc }) => (
            <Link key={href} href={href}>
              <Card className="p-3.5 flex items-center gap-3 hover:border-[#C9A84C]/50 hover:bg-[#FDF8ED] transition-all cursor-pointer group">
                <div className="h-9 w-9 rounded-xl bg-[#1A2B1F] flex items-center justify-center flex-shrink-0 group-hover:bg-[#2E4A35] transition-colors">
                  <Icon className="h-4 w-4 text-[#C9A84C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1207] truncate">{label}</p>
                  <p className="text-[10px] text-[#8A7A60] truncate">{desc}</p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-[#C8BEA8] group-hover:text-[#C9A84C] transition-colors flex-shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      <Icon className="h-7 w-7 text-[#C8BEA8] mb-2" />
      <p className="text-sm text-[#8A7A60]">{message}</p>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'COMPLETED' ? 'bg-[#2E7D32]' :
    status === 'PENDING' ? 'bg-[#C9A84C]' :
    'bg-red-500';
  return <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${color}`} />;
}
