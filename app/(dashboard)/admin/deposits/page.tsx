export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import DepositsClient from './DepositsClient';
import { Landmark } from 'lucide-react';

export default async function AdminDepositsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/investments');

  const [deposits, users] = await Promise.all([
    prisma.deposit.findMany({
      where: { type: 'BANK_TRANSFER' },
      include: {
        wallet: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, depositCode: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const pending = deposits.filter((d) => d.status === 'PENDING').length;

  const serialised = deposits.map((d) => ({
    id: d.id,
    amount: Number(d.amount),
    status: d.status,
    reference: d.stripePaymentIntentId ?? '',
    createdAt: d.createdAt.toISOString(),
    user: d.wallet.user,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1207] mb-1">Bank Transfer Deposits</h1>
        <p className="text-[#6A5A40]">
          Review and approve or reject pending bank transfer deposit requests.
        </p>
        {pending > 0 && (
          <p className="text-yellow-400 text-sm mt-1">
            {pending} pending deposit{pending !== 1 ? 's' : ''} awaiting review
          </p>
        )}
      </div>

      <DepositsClient deposits={serialised} users={users} />
    </div>
  );
}
