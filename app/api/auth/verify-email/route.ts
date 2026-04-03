import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const Schema = z.object({ token: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid token' }, { status: 400 });

    const { token } = parsed.data;
    const record = await prisma.emailVerifyToken.findUnique({ where: { token } });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired verification link' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true, emailVerifiedAt: new Date() } }),
      prisma.emailVerifyToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/auth/verify-email]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
