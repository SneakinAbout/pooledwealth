'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Wallet,
  User,
  MapPin,
  Receipt,
  Calendar,
  Phone,
  FileText,
  Building2,
  Settings2,
  Download,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = ['INVESTOR', 'MANAGER', 'ADMIN'] as const;

interface Holding {
  id: string;
  unitsPurchased: number;
  purchasePrice: number;
  purchasedAt: string;
  investment: { id: string; title: string; category: string; pricePerUnit: number };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  units: number | null;
  createdAt: string;
  investmentTitle: string | null;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  kycApproved: boolean;
  feeDiscountPercent: number;
  createdAt: string;
  phone: string | null;
  dateOfBirth: string | null;
  hasTfn: boolean;
  streetAddress: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  walletBalance: number;
  holdings: Holding[];
  transactions: Transaction[];
}

const TX_TYPE_COLOR: Record<string, string> = {
  PURCHASE: 'text-[#1565C0]',
  REDEMPTION: 'text-orange-600',
  FEE: 'text-[#8A7A60]',
  DISTRIBUTION: 'text-[#2E7D32]',
  DEPOSIT: 'text-[#2E7D32]',
  WITHDRAWAL: 'text-red-600',
};

interface KycDoc {
  id: string;
  type: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
}

function KycDocSection({ userId }: { userId: string }) {
  const [docs, setDocs] = useState<KycDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}/kyc-documents`)
      .then((r) => r.json())
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <p className="text-sm text-[#8A7A60] text-center py-4">Loading…</p>;
  if (docs.length === 0) return <p className="text-sm text-[#8A7A60] text-center py-4">No documents uploaded</p>;

  return (
    <div className="space-y-2 mt-2">
      {docs.map((doc) => (
        <a
          key={doc.id}
          href={`/api/admin/kyc-documents/${doc.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 bg-[#EDE6D6] rounded-xl border border-[#E8E2D6] hover:border-[#C9A84C]/40 transition-colors group"
        >
          <FileText className="h-4 w-4 text-[#6A5A40] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#1A1207] truncate">{doc.fileName}</p>
            <p className="text-[10px] text-[#8A7A60]">{doc.type.replace('_', ' ')} · {formatDate(doc.uploadedAt)}</p>
          </div>
          <Download className="h-3.5 w-3.5 text-[#8A7A60] group-hover:text-[#C9A84C] transition-colors flex-shrink-0" />
        </a>
      ))}
    </div>
  );
}

export default function UserDetailClient({ user: initialUser }: { user: UserDetail }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [approvingKyc, setApprovingKyc] = useState(false);
  const [editRole, setEditRole] = useState(initialUser.role);
  const [savingRole, setSavingRole] = useState(false);
  const [editDiscount, setEditDiscount] = useState(initialUser.feeDiscountPercent);
  const [savingDiscount, setSavingDiscount] = useState(false);

  const totalInvested = user.holdings.reduce((sum, h) => sum + h.purchasePrice, 0);

  async function handleApproveKyc() {
    setApprovingKyc(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role, kycApproved: true }),
      });
      if (!res.ok) {
        toast.error('Failed to approve KYC');
        return;
      }
      toast.success('KYC approved');
      setUser((u) => ({ ...u, kycApproved: true }));
      router.refresh();
    } finally {
      setApprovingKyc(false);
    }
  }

  async function handleSaveDiscount() {
    setSavingDiscount(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role, kycApproved: user.kycApproved, feeDiscountPercent: editDiscount }),
      });
      if (!res.ok) { toast.error('Failed to update discount'); return; }
      toast.success('Fee discount updated');
      setUser((u) => ({ ...u, feeDiscountPercent: editDiscount }));
      router.refresh();
    } finally {
      setSavingDiscount(false);
    }
  }

  async function handleSaveRole() {
    setSavingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole, kycApproved: user.kycApproved }),
      });
      if (!res.ok) {
        toast.error('Failed to update role');
        return;
      }
      toast.success('Role updated');
      setUser((u) => ({ ...u, role: editRole }));
      router.refresh();
    } finally {
      setSavingRole(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-[#6A5A40] hover:text-[#1A1207] text-sm transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#1A2B1F] flex items-center justify-center text-[#C9A84C] text-2xl font-bold flex-shrink-0">
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1207]">{user.name}</h1>
            <p className="text-sm text-[#8A7A60]">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#1A2B1F] text-[#C9A84C] uppercase tracking-wide">
                {user.role}
              </span>
              {user.kycApproved ? (
                <span className="flex items-center gap-1 text-xs text-[#2E7D32] font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" /> KYC Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                  <ShieldAlert className="h-3.5 w-3.5" /> KYC Pending
                </span>
              )}
            </div>
          </div>
        </div>

        {!user.kycApproved && (
          <Button
            onClick={handleApproveKyc}
            disabled={approvingKyc}
            loading={approvingKyc}
            className="flex items-center gap-2"
          >
            <ShieldCheck className="h-4 w-4" />
            Approve KYC
          </Button>
        )}
      </div>

      {/* KYC pending banner */}
      {!user.kycApproved && (
        <div className="flex items-start gap-3 p-4 bg-[#FFF8E1] border border-[#FFECB3] rounded-2xl">
          <Shield className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#7B5800]">Identity verification pending</p>
            <p className="text-xs text-[#7B5800] mt-0.5">
              Review the personal details and address below before approving KYC.
              Once approved, this user will be able to invest on the platform.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Personal Details */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-[#1A2B1F] flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-[#C9A84C]" />
              </div>
              <h2 className="text-sm font-bold text-[#1A1207]">Personal Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoRow icon={User} label="Full Name" value={user.name} />
              <InfoRow icon={Receipt} label="Email" value={user.email} />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={user.phone ?? <span className="text-[#C8BEA8] italic">Not provided</span>}
              />
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                value={user.dateOfBirth ? formatDate(user.dateOfBirth) : <span className="text-[#C8BEA8] italic">Not provided</span>}
              />
              <InfoRow
                icon={FileText}
                label="Tax File Number"
                value={
                  user.hasTfn
                    ? <span className="text-[#2E7D32] font-medium flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Provided</span>
                    : <span className="text-orange-600 italic">Not provided</span>
                }
              />
              <InfoRow
                icon={Calendar}
                label="Member Since"
                value={formatDate(user.createdAt)}
              />
            </div>
          </Card>

          {/* Address */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-[#1A2B1F] flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-[#C9A84C]" />
              </div>
              <h2 className="text-sm font-bold text-[#1A1207]">Residential Address</h2>
            </div>
            {user.streetAddress ? (
              <div className="text-sm text-[#1A1207] space-y-0.5">
                <p>{user.streetAddress}</p>
                <p>
                  {[user.suburb, user.state, user.postcode].filter(Boolean).join(' ')}
                </p>
                <p className="text-[#8A7A60]">Australia</p>
              </div>
            ) : (
              <p className="text-sm text-[#C8BEA8] italic">No address provided</p>
            )}
          </Card>

          {/* Holdings */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#E8E2D6]">
              <Building2 className="h-4 w-4 text-[#8A7A60]" />
              <h2 className="text-sm font-semibold text-[#1A1207]">Investment Holdings</h2>
              <span className="ml-auto text-[10px] text-[#8A7A60]">{user.holdings.length} holding{user.holdings.length !== 1 ? 's' : ''}</span>
            </div>
            {user.holdings.length === 0 ? (
              <p className="text-sm text-[#8A7A60] text-center py-8">No holdings yet</p>
            ) : (
              <div className="divide-y divide-[#E8E2D6]">
                {user.holdings.map((h) => (
                  <div key={h.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <Link href={`/investments/${h.investment.id}`} className="text-sm font-medium text-[#1A1207] hover:text-[#1565C0] truncate block">
                        {h.investment.title}
                      </Link>
                      <p className="text-xs text-[#8A7A60]">{h.investment.category} · {h.unitsPurchased} units · {formatDate(h.purchasedAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-[#1A1207]">{formatCurrency(h.purchasePrice)}</p>
                      <p className="text-[10px] text-[#8A7A60]">cost basis</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Transactions */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-[#E8E2D6]">
              <Receipt className="h-4 w-4 text-[#8A7A60]" />
              <h2 className="text-sm font-semibold text-[#1A1207]">Recent Transactions</h2>
            </div>
            {user.transactions.length === 0 ? (
              <p className="text-sm text-[#8A7A60] text-center py-8">No transactions yet</p>
            ) : (
              <div className="divide-y divide-[#E8E2D6]">
                {user.transactions.map((tx) => (
                  <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${TX_TYPE_COLOR[tx.type] ?? 'text-[#6A5A40]'}`}>
                          {tx.type}
                        </span>
                        <StatusBadge status={tx.status} />
                      </div>
                      <p className="text-xs text-[#8A7A60] truncate mt-0.5">
                        {tx.investmentTitle ?? '—'}
                        {tx.units ? ` · ${tx.units} units` : ''}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-[#1A1207]">{formatCurrency(tx.amount)}</p>
                      <p className="text-[10px] text-[#8A7A60]">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right column — summary */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-4 w-4 text-[#8A7A60]" />
              <h2 className="text-sm font-semibold text-[#1A1207]">Account Summary</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Wallet Balance', value: formatCurrency(user.walletBalance), highlight: true },
                { label: 'Total Invested', value: formatCurrency(totalInvested) },
                { label: 'Holdings', value: user.holdings.length.toString() },
                { label: 'Fee Discount', value: `${user.feeDiscountPercent}%` },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-[#F0EBE3] last:border-0">
                  <span className="text-xs text-[#8A7A60]">{label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${highlight ? 'text-[#2E7D32]' : 'text-[#1A1207]'}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {!user.kycApproved && (
              <Button
                onClick={handleApproveKyc}
                disabled={approvingKyc}
                loading={approvingKyc}
                className="w-full mt-4 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Approve KYC
              </Button>
            )}

            {user.kycApproved && (
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#2E7D32] bg-[#E8F5E9] rounded-xl py-2.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                KYC Verified
              </div>
            )}

            {/* KYC Documents */}
            <div className="mt-4 pt-4 border-t border-[#F0EBE3]">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-3.5 w-3.5 text-[#8A7A60]" />
                <span className="text-xs font-semibold text-[#1A1207]">KYC Documents</span>
              </div>
              <KycDocSection userId={user.id} />
            </div>

            {/* Role editor */}
            <div className="mt-4 pt-4 border-t border-[#F0EBE3]">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-3.5 w-3.5 text-[#8A7A60]" />
                <span className="text-xs font-semibold text-[#1A1207]">Change Role</span>
              </div>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as typeof editRole)}
                className="w-full text-sm border border-[#C8BEA8] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 text-[#1A1207] mb-2"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <Button
                size="sm"
                className="w-full"
                onClick={handleSaveRole}
                disabled={savingRole || editRole === user.role}
                loading={savingRole}
              >
                Save Role
              </Button>
            </div>

            {/* Fee discount editor */}
            <div className="mt-4 pt-4 border-t border-[#F0EBE3]">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-3.5 w-3.5 text-[#8A7A60]" />
                <span className="text-xs font-semibold text-[#1A1207]">Fee Discount</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(Number(e.target.value))}
                  className="flex-1 text-sm border border-[#C8BEA8] rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 text-[#1A1207]"
                />
                <span className="text-sm text-[#8A7A60]">%</span>
              </div>
              <Button
                size="sm"
                className="w-full mt-2"
                onClick={handleSaveDiscount}
                disabled={savingDiscount || editDiscount === user.feeDiscountPercent}
                loading={savingDiscount}
              >
                Save Discount
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-[#8A7A60] flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <span className="text-sm text-[#1A1207]">{value}</span>
    </div>
  );
}
