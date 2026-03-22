import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

// POST /api/admin/withdrawals/download
// Returns a CSV of all PENDING withdrawals and marks them as downloaded.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const withdrawals = await prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    if (withdrawals.length === 0) {
      return NextResponse.json({ error: 'No pending withdrawals' }, { status: 404 });
    }

    // Mark all as downloaded (only update rows not yet downloaded)
    await prisma.withdrawal.updateMany({
      where: { status: 'PENDING', downloadedAt: null },
      data: { downloadedAt: new Date() },
    });

    // Build CSV
    const headers = [
      'Reference ID',
      'User Name',
      'Email',
      'Amount (AUD)',
      'BSB',
      'Account Name',
      'Account Number',
      'Request Date',
    ];

    const escape = (val: string | number) =>
      `"${String(val).replace(/"/g, '""')}"`;

    const rows = withdrawals.map((w) => [
      escape(w.id),
      escape(w.user.name),
      escape(w.user.email),
      escape(Number(w.amount).toFixed(2)),
      escape(w.bankBsb),
      escape(w.bankAccountName),
      escape(w.bankAccountNumber),
      escape(new Date(w.createdAt).toLocaleString('en-AU')),
    ]);

    const csv = [headers.map(escape).join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="withdrawals-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error('[POST /api/admin/withdrawals/download]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
