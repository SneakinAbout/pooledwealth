import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    include: { investment: { select: { title: true, category: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const rows = [
    ['Date', 'Type', 'Investment', 'Category', 'Units', 'Amount', 'Status'],
    ...transactions.map((tx) => [
      new Date(tx.createdAt).toISOString(),
      tx.type,
      tx.investment?.title ?? '',
      tx.investment?.category ?? '',
      tx.units ?? '',
      Number(tx.amount).toFixed(2),
      tx.status,
    ]),
  ];

  const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
