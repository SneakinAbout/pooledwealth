import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { classifyAsset } from '@/lib/valuation/classify';
import { searchAndExtractComps } from '@/lib/valuation/search';
import { calculateValuation } from '@/lib/valuation/calculate';

// POST /api/investments/[id]/valuation — run AI valuation preview (no DB write)
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const investment = await prisma.investment.findUnique({
      where: { id: params.id },
      select: {
        id: true, title: true, description: true, category: true,
        grade: true, edition: true, gradingCompany: true, certNumber: true,
        currentValue: true,
      },
    });
    if (!investment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const classification = await classifyAsset(investment);
    const comps = await searchAndExtractComps(investment, classification);
    const valuation = calculateValuation(comps.cleanPrices, comps.flaggedForReview, comps.flagReason);

    return NextResponse.json({
      format: classification.format,
      formatDescription: classification.formatDescription,
      searchQuery: classification.searchQuery,
      marketValue: valuation.marketValue,
      confidence: valuation.confidence,
      compCount: valuation.compCount,
      flaggedForReview: valuation.flaggedForReview,
      flagReason: valuation.flagReason,
      currentValue: investment.currentValue ? Number(investment.currentValue) : null,
      rawListingsFound: comps.rawListingsFound,
      filteredOut: comps.filteredOut,
    });
  } catch (err) {
    console.error('[POST /api/investments/[id]/valuation]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const Schema = z.object({
  currentValue: z.number().positive('Value must be positive'),
});

// PATCH /api/investments/[id]/valuation — manager or admin only
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const investment = await prisma.investment.findUnique({ where: { id: params.id } });
    if (!investment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Managers can only update their own investments
    if (session.user.role === 'MANAGER' && investment.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.investment.update({
      where: { id: params.id },
      data: { currentValue: parsed.data.currentValue },
      select: { id: true, currentValue: true },
    });

    return NextResponse.json({ currentValue: Number(updated.currentValue) });
  } catch (err) {
    console.error('[PATCH /api/investments/[id]/valuation]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
