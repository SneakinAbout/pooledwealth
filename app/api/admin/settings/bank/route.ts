import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';
import { bankSettingsSchema } from '@/lib/validations';
import { auditLog } from '@/lib/audit';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const body = await request.json();
    const result = bankSettingsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const current = await prisma.platformSettings.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!current) {
      return NextResponse.json({ error: 'No settings found' }, { status: 404 });
    }

    const updated = await prisma.platformSettings.update({
      where: { id: current.id },
      data: result.data,
    });

    await auditLog(session!.user.id, 'UPDATE_BANK_SETTINGS');

    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PUT /api/admin/settings/bank]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
