import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNewInvestmentsDigest, type DigestInvestment } from '@/lib/email';

// Runs daily at 8am AEST (22:00 UTC previous day)
// Sends a digest of all investments that became ACTIVE in the past 24 hours
// to every user with notifyNewInvestments: true

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find investments that became ACTIVE in the last 24h
    const investments = await prisma.investment.findMany({
      where: {
        status: 'ACTIVE',
        updatedAt: { gte: since },
      },
      select: {
        id: true,
        title: true,
        category: true,
        pricePerUnit: true,
        totalUnits: true,
        availableUnits: true,
        targetReturn: true,
        endDate: true,
        imageUrl: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (investments.length === 0) {
      console.log('[cron/digest] No new investments today — skipping');
      return NextResponse.json({ sent: 0, skipped: true });
    }

    // Format investments for the email template
    const fmt = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });
    const dateFmt = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

    const digestInvestments: DigestInvestment[] = investments.map((inv) => ({
      id: inv.id,
      title: inv.title,
      category: inv.category,
      pricePerUnit: fmt.format(Number(inv.pricePerUnit)),
      totalUnits: inv.totalUnits,
      availableUnits: inv.availableUnits,
      targetReturn: Number(inv.targetReturn).toFixed(2),
      endDate: dateFmt.format(inv.endDate),
      imageUrl: inv.imageUrl,
    }));

    // Today's date for the email subject/header
    const today = new Intl.DateTimeFormat('en-AU', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date());

    // Find all users with notifications enabled (any role)
    const users = await prisma.user.findMany({
      where: { notifyNewInvestments: true, emailVerified: true },
      select: { id: true, name: true, email: true },
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await sendNewInvestmentsDigest(user.email, user.name, digestInvestments, today);
        sent++;
      } catch (err) {
        console.error(`[cron/digest] Failed to send to ${user.email}:`, err);
        failed++;
      }
    }

    console.log(`[cron/digest] Sent ${sent} digest emails (${failed} failed) for ${investments.length} new investments`);

    return NextResponse.json({ sent, failed, investments: investments.length });
  } catch (err) {
    console.error('[cron/digest]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
