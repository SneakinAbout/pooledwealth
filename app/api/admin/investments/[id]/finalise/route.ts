import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { sendSupplementFinalised } from '@/lib/email';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const investment = await prisma.investment.findUnique({ where: { id: params.id } });
    if (!investment) return NextResponse.json({ error: 'Investment not found' }, { status: 404 });

    // Get all PENDING supplements for this investment
    const pendingSupplements = await prisma.assetSupplement.findMany({
      where: { investmentId: params.id, status: 'PENDING' },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (pendingSupplements.length === 0) {
      return NextResponse.json({ error: 'No pending supplements found for this investment' }, { status: 400 });
    }

    // Build anonymous ownership register
    const finalOwnershipRegister = pendingSupplements.map((s, index) => ({
      co_owner_ref: `CO-${String(index + 1).padStart(3, '0')}`,
      shares: s.sharesPurchased,
      percentage: `${Number(s.ownershipPercentage).toFixed(4)}%`,
    }));

    const finalisedAt = new Date();

    // Update all pending supplements to FINALISED
    await prisma.assetSupplement.updateMany({
      where: { investmentId: params.id, status: 'PENDING' },
      data: {
        status: 'FINALISED',
        finalisedAt,
        finalOwnershipRegister,
      },
    });

    // Send email notifications (non-blocking — fire and forget)
    Promise.all(
      pendingSupplements.map((s) =>
        sendSupplementFinalised(s.user.email, s.user.name, investment.title, investment.id).catch((err) =>
          console.error(`Failed to send supplement finalised email to ${s.user.email}:`, err)
        )
      )
    );

    return NextResponse.json({
      success: true,
      finalisedCount: pendingSupplements.length,
    });
  } catch (err) {
    console.error('[POST /api/admin/investments/[id]/finalise]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
