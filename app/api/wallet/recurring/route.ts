import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/permissions';
import { z } from 'zod';
import { addDays, addWeeks } from 'date-fns';

function nextDateFromNow(frequency: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'): Date {
  const now = new Date();
  if (frequency === 'WEEKLY') return addWeeks(now, 1);
  if (frequency === 'FORTNIGHTLY') return addDays(now, 14);
  // MONTHLY
  const d = new Date(now);
  d.setMonth(d.getMonth() + 1);
  return d;
}

const upsertSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  frequency: z.enum(['WEEKLY', 'FORTNIGHTLY', 'MONTHLY']),
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

  const { amount, frequency } = result.data;
  const nextExpectedDate = nextDateFromNow(frequency);

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
