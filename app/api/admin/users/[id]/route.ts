import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { updateUserRoleSchema } from '@/lib/validations';
import { auditLog } from '@/lib/audit';
import { sendKycApproved } from '@/lib/email';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

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
            investment: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      ...user,
      password: undefined,
      wallet: user.wallet ? { ...user.wallet, balance: Number(user.wallet.balance) } : null,
      holdings: user.holdings.map((h) => ({
        ...h,
        purchasePrice: Number(h.purchasePrice),
        purchasedAt: h.purchasedAt.toISOString(),
        investment: { ...h.investment, pricePerUnit: Number(h.investment.pricePerUnit) },
      })),
      transactions: user.transactions.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
        createdAt: tx.createdAt.toISOString(),
      })),
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/admin/users/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const body = await request.json();
    const result = updateUserRoleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const prevUser = await prisma.user.findUnique({ where: { id: params.id }, select: { kycApproved: true } });

    const user = await prisma.user.update({
      where: { id: params.id },
      data: result.data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        kycApproved: true,
      },
    });

    // Send KYC approval email if status changed to approved
    if (result.data.kycApproved && !prevUser?.kycApproved) {
      sendKycApproved(user.email, user.name ?? 'there').catch(() => {});
    }

    await auditLog(session!.user.id, 'UPDATE_USER', params.id, result.data);

    return NextResponse.json(user);
  } catch (err) {
    console.error('[PUT /api/admin/users/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
