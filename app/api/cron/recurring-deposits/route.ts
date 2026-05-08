import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendRecurringDepositReminder, sendRecurringDepositCancelled, sendPendingDepositsDigest } from '@/lib/email';
import { addDays, addWeeks } from 'date-fns';

function advanceDate(current: Date, frequency: 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY'): Date {
  if (frequency === 'WEEKLY') return addWeeks(current, 1);
  if (frequency === 'FORTNIGHTLY') return addDays(current, 14);
  const d = new Date(current);
  d.setMonth(d.getMonth() + 1);
  return d;
}

// Count backwards N weekdays (Mon–Fri) from date
function subtractBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let counted = 0;
  while (counted < days) {
    result.setDate(result.getDate() - 1);
    const dow = result.getDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) counted++;
  }
  return result;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // ── Step 1: Auto-create PENDING deposits for schedules that are due ──────────
  const due = await prisma.recurringDeposit.findMany({
    where: { status: 'ACTIVE', nextExpectedDate: { lte: now } },
    include: {
      user: {
        select: { id: true, name: true, email: true, depositCode: true },
      },
    },
  });

  let created = 0;

  for (const schedule of due) {
    const wallet = await prisma.wallet.upsert({
      where: { userId: schedule.userId },
      update: {},
      create: { userId: schedule.userId, balance: 0 },
    });

    // Create deposit + advance nextExpectedDate atomically so a second cron run
    // won't find this schedule in the `due` list again.
    await prisma.$transaction([
      prisma.deposit.create({
        data: {
          walletId: wallet.id,
          amount: schedule.amount,
          status: 'PENDING',
          type: 'BANK_TRANSFER',
          recurringDepositId: schedule.id,
          stripePaymentIntentId: schedule.user.depositCode
            ? `${schedule.user.depositCode}-${Date.now()}`
            : null,
        },
      }),
      prisma.recurringDeposit.update({
        where: { id: schedule.id },
        data: { nextExpectedDate: advanceDate(schedule.nextExpectedDate, schedule.frequency) },
      }),
    ]);

    created++;
  }

  // ── Step 2: Expire PENDING recurring deposits older than 5 business days ─────
  const expiryThreshold = subtractBusinessDays(now, 5);

  const stale = await prisma.deposit.findMany({
    where: {
      status: 'PENDING',
      type: 'BANK_TRANSFER',
      recurringDepositId: { not: null },
      createdAt: { lte: expiryThreshold },
    },
    include: {
      recurringDeposit: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  let expired = 0, cancelled = 0;

  for (const deposit of stale) {
    const schedule = deposit.recurringDeposit;

    await prisma.deposit.update({ where: { id: deposit.id }, data: { status: 'FAILED' } });

    if (!schedule || schedule.status !== 'ACTIVE') continue;

    const newMissedCount = schedule.missedCount + 1;

    if (newMissedCount >= 2) {
      await prisma.recurringDeposit.update({
        where: { id: schedule.id },
        data: {
          missedCount: newMissedCount,
          status: 'CANCELLED',
          cancelReason: 'Auto-cancelled after 2 unconfirmed deposits',
        },
      });
      sendRecurringDepositCancelled(
        schedule.user.email,
        schedule.user.name ?? 'there',
        schedule.frequency
      ).catch((err) => console.error('[cron/recurring-deposits] cancel email failed:', err));
      cancelled++;
    } else {
      await prisma.recurringDeposit.update({
        where: { id: schedule.id },
        data: { missedCount: newMissedCount },
      });
      sendRecurringDepositReminder(
        schedule.user.email,
        schedule.user.name ?? 'there',
        Number(schedule.amount),
        schedule.frequency,
        schedule.nextExpectedDate
      ).catch((err) => console.error('[cron/recurring-deposits] reminder email failed:', err));
      expired++;
    }
  }

  // ── Step 3: Daily pending-deposits digest to all admins ──────────────────────
  const pending = await prisma.deposit.findMany({
    where: { status: 'PENDING', type: 'BANK_TRANSFER' },
    include: {
      wallet: { include: { user: { select: { name: true, email: true } } } },
    },
    orderBy: { createdAt: 'asc' },
  });

  let adminNotified = 0;

  if (pending.length > 0) {
    const fmt = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
    const msPerDay = 24 * 60 * 60 * 1000;

    const rows = pending.map((d) => ({
      investorName: d.wallet.user.name,
      investorEmail: d.wallet.user.email,
      amount: fmt.format(Number(d.amount)),
      daysPending: Math.floor((now.getTime() - d.createdAt.getTime()) / msPerDay),
      isRecurring: d.recurringDepositId !== null,
    }));

    const totalAmount = fmt.format(pending.reduce((sum, d) => sum + Number(d.amount), 0));

    const today = new Intl.DateTimeFormat('en-AU', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'Australia/Sydney',
    }).format(now);

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { name: true, email: true },
    });

    for (const admin of admins) {
      sendPendingDepositsDigest(admin.email, admin.name, rows, totalAmount, today)
        .catch((err) => console.error('[cron/recurring-deposits] admin digest failed:', err));
      adminNotified++;
    }
  }

  return NextResponse.json({ created, expired, cancelled, adminNotified });
}

// cron-jobs.org sends GET by default — delegate to the same handler
export { POST as GET };
