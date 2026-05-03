/**
 * Monthly valuation agent.
 * Runs on the 1st of each month — queries all ACTIVE investments, uses Claude Haiku
 * to classify each asset and search eBay sold listings from the prior month,
 * calculates a median market value, updates currentValue in the DB, then
 * sends a summary email to all admins and managers.
 *
 * Usage:
 *   npm run valuate
 *
 * Required env:
 *   ANTHROPIC_API_KEY
 *   DATABASE_URL
 *   RESEND_API_KEY
 *   NEXT_PUBLIC_APP_URL (optional, for email links)
 */

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { classifyAsset } from '../lib/valuation/classify';
import { searchAndExtractComps } from '../lib/valuation/search';
import { calculateValuation } from '../lib/valuation/calculate';
import { sendValuationSummary, type ValuationRow } from '../lib/email';

const prisma = new PrismaClient({
  log: ['error'],
});

function formatAUD(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getPriorMonthLabel(): string {
  const now = new Date();
  const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return prior.toLocaleString('en-AU', { month: 'long', year: 'numeric' });
}

async function run() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    process.exit(1);
  }

  const monthLabel = getPriorMonthLabel();
  console.log(`\n=== Pooled Wealth Valuation Agent — ${monthLabel} ===\n`);

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

  console.log(`Found ${investments.length} active investment(s) to value.\n`);

  const rows: ValuationRow[] = [];
  let updatedCount = 0;
  let flaggedCount = 0;
  let skippedCount = 0;

  for (const inv of investments) {
    console.log(`[${inv.id}] ${inv.title}`);

    try {
      // Step 1: classify asset type + build search query
      process.stdout.write('  → Classifying asset... ');
      const classification = await classifyAsset(inv);
      console.log(`${classification.format} — "${classification.searchQuery}"`);

      // Step 2: search eBay sold listings + extract + filter comps
      process.stdout.write('  → Searching eBay sold listings... ');
      const comps = await searchAndExtractComps(inv, classification);
      console.log(`${comps.rawListingsFound} found, ${comps.filteredOut} excluded, ${comps.cleanPrices.length} clean comps`);

      // Step 3: calculate median market value
      const valuation = calculateValuation(
        comps.cleanPrices,
        comps.flaggedForReview,
        comps.flagReason,
      );

      const oldValue = inv.currentValue ? parseFloat(inv.currentValue.toString()) : null;

      // Step 4: update DB
      if (valuation.marketValue !== null) {
        await prisma.investment.update({
          where: { id: inv.id },
          data: { currentValue: new Decimal(valuation.marketValue) },
        });
        updatedCount++;
        console.log(`  → Updated: ${formatAUD(valuation.marketValue)} (${valuation.confidence} confidence, ${valuation.compCount} comps)`);
      } else {
        skippedCount++;
        console.log(`  → Skipped: insufficient data`);
      }

      if (valuation.flaggedForReview) {
        flaggedCount++;
        console.log(`  ⚠ Flagged: ${valuation.flagReason}`);
      }

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
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ Error: ${message}`);
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
        flagReason: `Error: ${message}`,
      });
    }

    // Brief pause between investments to avoid hammering the search API
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updatedCount} | Flagged: ${flaggedCount} | Skipped: ${skippedCount}\n`);

  // Send email summary to all admins and managers
  const recipients = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'MANAGER'] }, emailVerified: { not: undefined } },
    select: { email: true, name: true },
  });

  if (recipients.length === 0) {
    console.log('No admin/manager recipients found — skipping email.');
  } else {
    console.log(`Sending summary email to ${recipients.length} recipient(s)...`);
    for (const recipient of recipients) {
      try {
        await sendValuationSummary(
          recipient.email,
          recipient.name ?? 'there',
          monthLabel,
          rows,
          updatedCount,
          flaggedCount,
          skippedCount,
        );
        console.log(`  ✓ Sent to ${recipient.email}`);
      } catch (err) {
        console.error(`  ✗ Failed to email ${recipient.email}: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  await prisma.$disconnect();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
