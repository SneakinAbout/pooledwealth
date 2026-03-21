'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Shield, User, Briefcase, Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'INVESTOR';
  kycApproved: boolean;
  createdAt: string;
  walletBalance: number;
  totalInvested: number;
  _count: { holdings: number; transactions: number };
}

const roleIcons = { ADMIN: Shield, MANAGER: Briefcase, INVESTOR: User };
const roleColors = { ADMIN: 'danger' as const, MANAGER: 'info' as const, INVESTOR: 'default' as const };

export default function UserTable({ users: initialUsers, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [kycFilter, setKycFilter] = useState('ALL');

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesKyc =
      kycFilter === 'ALL' ||
      (kycFilter === 'APPROVED' && u.kycApproved) ||
      (kycFilter === 'PENDING' && !u.kycApproved);
    return matchesSearch && matchesRole && matchesKyc;
  });

  const quickKyc = async (user: UserRow, approved: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: user.role, kycApproved: approved }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, kycApproved: approved } : u));
      toast.success(`KYC ${approved ? 'approved' : 'revoked'}`);
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A7A60]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-white border border-[#E8E2D6] rounded-lg pl-9 pr-4 py-2 text-sm text-[#1A1207] placeholder-[#8A7A60] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40 focus:border-[#C9A84C]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-[#E8E2D6] rounded-lg px-3 py-2 text-sm text-[#1A1207] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="INVESTOR">Investor</option>
        </select>
        <select
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value)}
          className="bg-white border border-[#E8E2D6] rounded-lg px-3 py-2 text-sm text-[#1A1207] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
        >
          <option value="ALL">All KYC</option>
          <option value="APPROVED">KYC Approved</option>
          <option value="PENDING">KYC Pending</option>
        </select>
      </div>

      <p className="text-xs text-[#8A7A60] mb-3">{filtered.length} user{filtered.length !== 1 ? 's' : ''} shown</p>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E8E2D6] text-left">
              <th className="pb-3 text-[#6A5A40] font-medium">User</th>
              <th className="pb-3 text-[#6A5A40] font-medium">Role</th>
              <th className="pb-3 text-[#6A5A40] font-medium">KYC</th>
              <th className="pb-3 text-[#6A5A40] font-medium text-right">Wallet</th>
              <th className="pb-3 text-[#6A5A40] font-medium text-right">Invested</th>
              <th className="pb-3 text-[#6A5A40] font-medium text-right">Holdings</th>
              <th className="pb-3 text-[#6A5A40] font-medium">Joined</th>
              <th className="pb-3 text-[#6A5A40] font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2D6]">
            {filtered.map((user) => {
              const RoleIcon = roleIcons[user.role];
              const isSelf = user.id === currentUserId;
              return (
                <tr key={user.id} className="hover:bg-[#EDE6D6]/50 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] text-xs font-bold flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1207]">{user.name} {isSelf && <span className="text-xs text-[#8A7A60]">(you)</span>}</p>
                        <p className="text-xs text-[#6A5A40]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5">
                    <Badge variant={roleColors[user.role]}>
                      <RoleIcon className="h-3 w-3 mr-1 inline" />
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={user.kycApproved ? 'success' : 'warning'}>
                        {user.kycApproved ? 'Approved' : 'Pending'}
                      </Badge>
                      {!isSelf && (
                        <button
                          onClick={() => quickKyc(user, !user.kycApproved)}
                          className={cn(
                            'transition-colors',
                            user.kycApproved ? 'text-[#8A7A60] hover:text-[#C62828]' : 'text-[#8A7A60] hover:text-[#2E7D32]'
                          )}
                          title={user.kycApproved ? 'Revoke KYC' : 'Approve KYC'}
                        >
                          {user.kycApproved
                            ? <XCircle className="h-4 w-4" />
                            : <CheckCircle className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 text-right font-medium text-[#2E7D32] font-mono-val">
                    {formatCurrency(user.walletBalance)}
                  </td>
                  <td className="py-3.5 text-right font-medium font-mono-val">
                    {formatCurrency(user.totalInvested)}
                  </td>
                  <td className="py-3.5 text-right text-[#1A1207]">
                    {user._count.holdings}
                  </td>
                  <td className="py-3.5 text-[#6A5A40] text-xs whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-3.5 text-right">
                    <Link href={`/admin/users/${user.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#6A5A40] text-sm">No users match your filters.</div>
        )}
      </div>
    </>
  );
}
