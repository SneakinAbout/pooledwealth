import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendRecurringDepositReminder, sendRecurringDepositCancelled } from '@/lib/email';
import { addDays, addWeeks } from 'date-fns';

function advanceDate(current: Date, frequency: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'): Date {
  if (frequency === 'WEEKLY') return addWeeks(current, 1);
  if (frequency === 'FORTNIGHTLY') return addDays(current, 14);
  const d = new Date(current);
  d.setMonth(d.getMonth() + 1);
  return d;
}

function windowStart(nextExpected: Date, frequency: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'): Date {
  if (frequency === 'WEEKLY') return addWeeks(nextExpected, -1);
  if (frequency === 'FORTNIGHTLY') return addDays(nextExpected, -14);
  const d = new Date(nextExpected);
  d.setMonth(d.getMonth() - 1);
  return d;
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const due = await prisma.recurringDeposit.findMany({
    where: { status: 'ACTIVE', nextExpectedDate: { lte: now } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          wallet: { select: { id: true } },
        },
      },
    },
  });

  let checked = 0, advanced = 0, missed = 0, cancelled = 0;

  for (const schedule of due) {
    checked++;
    const periodStart = windowStart(schedule.nextExpectedDate, schedule.frequency);

    // Check if a completed deposit arrived in the expected window
    const received = schedule.user.wallet
      ? await prisma.deposit.findFirst({
          where: {
            walletId: schedule.user.wallet.id,
            status: 'COMPLETED',
            type: 'BANK_TRANSFER',
            createdAt: { gte: periodStart, lte: schedule.nextExpectedDate },
          },
        })
      : null;

    if (received) {
      // Deposit received — reset and advance
      await prisma.recurringDeposit.update({
        where: { id: schedule.id },
        data: {
          missedCount: 0,
          nextExpectedDate: advanceDate(schedule.nextExpectedDate, schedule.frequency),
        },
      });
      advanced++;
    } else {
      const newMissedCount = schedule.missedCount + 1;

      if (newMissedCount >= 2) {
        // Auto-cancel after 2 consecutive misses
        await prisma.recurringDeposit.update({
          where: { id: schedule.id },
          data: { missedCount: newMissedCount, status: 'CANCELLED', cancelReason: 'Auto-cancelled after 2 missed deposits' },
        });
        sendRecurringDepositCancelled(
          schedule.user.email,
          schedule.user.name ?? 'there',
          schedule.frequency
        ).catch((err) => console.error('[cron/recurring-deposits] cancel email failed:', err));
        cancelled++;
      } else {
        // First miss — record and send reminder
        await prisma.recurringDeposit.update({
          where: { id: schedule.id },
          data: {
            missedCount: newMissedCount,
            nextExpectedDate: advanceDate(schedule.nextExpectedDate, schedule.frequency),
          },
        });
        sendRecurringDepositReminder(
          schedule.user.email,
          schedule.user.name ?? 'there',
          Number(schedule.amount),
          schedule.frequency,
          advanceDate(schedule.nextExpectedDate, schedule.frequency)
        ).catch((err) => console.error('[cron/recurring-deposits] reminder email failed:', err));
        missed++;
      }
    }
  }

  return NextResponse.json({ checked, advanced, missed, cancelled });
}

// cron-jobs.org sends GET by default — delegate to the same handler
export { POST as GET };
