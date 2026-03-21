import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UserDetailClient from './UserDetailClient';

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') redirect('/investments');

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      wallet: true,
      holdings: {
        include: {
          investment: { select: { id: true, title: true, category: true, pricePerUnit: true } },
        },
        orderBy: { purchasedAt: 'desc' },
      },
      transactions: {
        include: {
          investment: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      },
    },
  });

  if (!user) notFound();

  return (
    <UserDetailClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        kycApproved: user.kycApproved,
        feeDiscountPercent: Number(user.feeDiscountPercent),
        createdAt: user.createdAt.toISOString(),
        // Profile fields
        phone: user.phone ?? null,
        dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
        hasTfn: !!user.taxFileNumber,
        streetAddress: user.streetAddress ?? null,
        suburb: user.suburb ?? null,
        state: user.state ?? null,
        postcode: user.postcode ?? null,
        // Wallet
        walletBalance: user.wallet ? Number(user.wallet.balance) : 0,
        // Holdings
        holdings: user.holdings.map((h) => ({
          id: h.id,
          unitsPurchased: h.unitsPurchased,
          purchasePrice: Number(h.purchasePrice),
          purchasedAt: h.purchasedAt.toISOString(),
          investment: {
            id: h.investment.id,
            title: h.investment.title,
            category: h.investment.category,
            pricePerUnit: Number(h.investment.pricePerUnit),
          },
        })),
        // Transactions
        transactions: user.transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: Number(tx.amount),
          status: tx.status,
          units: tx.units ?? null,
          createdAt: tx.createdAt.toISOString(),
          investmentTitle: tx.investment?.title ?? null,
        })),
      }}
    />
  );
}
