import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { feeSettingsSchema } from '@/lib/validations';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    // Return all settings history
    const settings = await prisma.platformSettings.findMany({
      include: {
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(settings);
  } catch (err) {
    console.error('[GET /api/admin/settings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const body = await request.json();
    const result = feeSettingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const settings = await prisma.platformSettings.create({
      data: {
        managementFeePercent: result.data.managementFeePercent,
        profitSharePercent: result.data.profitSharePercent,
        updatedById: session!.user.id,
      },
      include: {
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Keep only the 50 most recent settings rows to prevent unbounded table growth.
    // We use findMany to get the cutoff id, then deleteMany — Prisma doesn't support
    // DELETE with OFFSET directly.
    const allRows = await prisma.platformSettings.findMany({
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });
    if (allRows.length > 50) {
      const toDelete = allRows.slice(50).map((r) => r.id);
      await prisma.platformSettings.deleteMany({ where: { id: { in: toDelete } } });
    }

    return NextResponse.json(settings);
  } catch (err) {
    console.error('[PUT /api/admin/settings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
