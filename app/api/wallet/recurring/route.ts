import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/permissions';
import { z } from 'zod';

const upsertSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  frequency: z.enum(['WEEKLY', 'FORTNIGHTLY', 'MONTHLY']),
  // ISO date string for when the investor's first bank transfer will go out
  startDate: z.string().datetime({ message: 'Invalid start date' }),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const authError = requireAuth(session);
  if (authError) return authError;

  const schedule = await prisma.recurringDeposit.findUnique({
    where: { userId: session!.user.id },
  });

  if (!schedule) return NextResponse.json({ schedule: null });

  return NextResponse.json({
    schedule: {
      id: schedule.id,
      amount: Number(schedule.amount),
      frequency: schedule.frequency,
      nextExpectedDate: schedule.nextExpectedDate.toISOString(),
      missedCount: schedule.missedCount,
      status: schedule.status,
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const authError = requireAuth(session);
  if (authError) return authError;

  if (!session!.user.kycApproved) {
    return NextResponse.json({ error: 'KYC approval required' }, { status: 403 });
  }

  const body = await request.json();
  const result = upsertSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
  }

  const { amount, frequency, startDate } = result.data;
  const nextExpectedDate = new Date(startDate);

  // Must be in the future
  if (nextExpectedDate <= new Date()) {
    return NextResponse.json({ error: 'Start date must be in the future' }, { status: 400 });
  }

  const schedule = await prisma.recurringDeposit.upsert({
    where: { userId: session!.user.id },
    update: { amount, frequency, nextExpectedDate, missedCount: 0, status: 'ACTIVE', cancelReason: null },
    create: { userId: session!.user.id, amount, frequency, nextExpectedDate },
  });

  return NextResponse.json({
    schedule: {
      id: schedule.id,
      amount: Number(schedule.amount),
      frequency: schedule.frequency,
      nextExpectedDate: schedule.nextExpectedDate.toISOString(),
      missedCount: schedule.missedCount,
      status: schedule.status,
    },
  });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const authError = requireAuth(session);
  if (authError) return authError;

  await prisma.recurringDeposit.updateMany({
    where: { userId: session!.user.id, status: 'ACTIVE' },
    data: { status: 'CANCELLED', cancelReason: 'Cancelled by investor' },
  });

  return NextResponse.json({ ok: true });
}
