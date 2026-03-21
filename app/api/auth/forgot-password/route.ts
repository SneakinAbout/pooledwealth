import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rateLimit';
import { sendPasswordReset } from '@/lib/email';
import crypto from 'crypto';
import { z } from 'zod';

const Schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!rateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: true }); // Don't reveal rate limit to attackers
  }

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 });

  const { email } = parsed.data;

  // Always return ok to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    await sendPasswordReset(user.email, user.name ?? 'there', token);
  }

  return NextResponse.json({ ok: true });
}
