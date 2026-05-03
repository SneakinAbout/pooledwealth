import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { classifyAsset } from '@/lib/valuation/classify';
import { searchAndExtractComps } from '@/lib/valuation/search';
import { calculateValuation } from '@/lib/valuation/calculate';
import { sendValuationSummary, type ValuationRow } from '@/lib/email';

// Called by cron-jobs.org on the 1st of each month.
// Protected by CRON_SECRET — set Authorization: Bearer <secret> in cron-jobs.org request headers.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const now = new Date();
  const priorMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthLabel = priorMonthStart.toLocaleString('en-AU', { month: 'long', year: 'numeric' });

  const investments = await prisma.investment.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      grade: true,
      edition: true,
      gradingCompany: true,
      certNumber: true,
      currentValue: true,
    },
    orderBy: { title: 'asc' },
  });

  const rows: ValuationRow[] = [];
  let updatedCount = 0;
  let flaggedCount = 0;
  let skippedCount = 0;

  for (const inv of investments) {
    try {
      const classification = await classifyAsset(inv);
      const comps = await searchAndExtractComps(inv, classification);
      const valuation = calculateValuation(comps.cleanPrices, comps.flaggedForReview, comps.flagReason);

      const oldValue = inv.currentValue ? parseFloat(inv.currentValue.toString()) : null;

      if (valuation.marketValue !== null) {
        await prisma.investment.update({
          where: { id: inv.id },
          data: { currentValue: new Decimal(valuation.marketValue) },
        });
        updatedCount++;
      } else {
        skippedCount++;
      }

      if (valuation.flaggedForReview) flaggedCount++;

      rows.push({
        id: inv.id,
        title: inv.title,
        category: inv.category,
        format: classification.format,
        oldValue: oldValue !== null ? formatAUD(oldValue) : null,
        newValue: valuation.marketValue !== null ? formatAUD(valuation.marketValue) : null,
        compCount: valuation.compCount,
        confidence: valuation.confidence,
        flaggedForReview: valuation.flaggedForReview,
        flagReason: valuation.flagReason,
      });

    } catch (err) {
      console.error(`[cron/valuate] Error on "${inv.title}":`, err);
      skippedCount++;
      rows.push({
        id: inv.id,
        title: inv.title,
        category: inv.category,
        format: 'unknown',
        oldValue: inv.currentValue ? formatAUD(parseFloat(inv.currentValue.toString())) : null,
        newValue: null,
        compCount: 0,
        confidence: 'insufficient',
        flaggedForReview: true,
        flagReason: `Error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  // Email all admins and managers
  const recipients = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'MANAGER'] }, emailVerified: { not: undefined } },
    select: { email: true, name: true },
  });

  for (const recipient of recipients) {
    await sendValuationSummary(
      recipient.email,
      recipient.name ?? 'there',
      monthLabel,
      rows,
      updatedCount,
      flaggedCount,
      skippedCount,
    ).catch((err) =>
      console.error(`[cron/valuate] Email failed for ${recipient.email}:`, err),
    );
  }

  console.log(`[cron/valuate] ${monthLabel}: updated=${updatedCount} flagged=${flaggedCount} skipped=${skippedCount}`);

  return NextResponse.json({ ok: true, month: monthLabel, updatedCount, flaggedCount, skippedCount });
}

function formatAUD(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
