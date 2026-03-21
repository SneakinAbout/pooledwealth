import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import UserTable from '@/components/admin/UserTable';
import { Users, ShieldCheck, Clock, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/investments');
  }

  const [users, walletAgg, pendingKyc, investorCount] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        kycApproved: true,
        createdAt: true,
        wallet: { select: { balance: true } },
        _count: { select: { holdings: true, transactions: true } },
        holdings: { select: { purchasePrice: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.user.count({ where: { kycApproved: false } }),
    prisma.user.count({ where: { role: 'INVESTOR' } }),
  ]);

  const totalAUM = Number(walletAgg._sum.balance ?? 0);

  const serializedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as 'ADMIN' | 'MANAGER' | 'INVESTOR',
    kycApproved: u.kycApproved,
    createdAt: u.createdAt.toISOString(),
    walletBalance: Number(u.wallet?.balance ?? 0),
    totalInvested: u.holdings.reduce((sum, h) => sum + Number(h.purchasePrice), 0),
    _count: u._count,
  }));

  const stats = [
    { label: 'Total Users', value: users.length.toString(), icon: Users, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10' },
    { label: 'Investors', value: investorCount.toString(), icon: Users, color: 'text-[#1565C0]', bg: 'bg-[#E3F2FD]' },
    { label: 'Pending KYC', value: pendingKyc.toString(), icon: Clock, color: 'text-[#E65100]', bg: 'bg-[#FFF3E0]' },
    { label: 'Total Wallet AUM', value: formatCurrency(totalAUM), icon: Wallet, color: 'text-[#2E7D32]', bg: 'bg-[#E8F5E9]' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1207] mb-1">User Management</h1>
        <p className="text-[#6A5A40]">{users.length} registered user{users.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#EDE6D6] border border-[#E8E2D6] rounded-xl p-5 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#6A5A40]">{label}</p>
              <p className={`text-lg font-bold font-mono-val ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <UserTable users={serializedUsers} currentUserId={session.user.id} />
      </Card>
    </div>
  );
}
