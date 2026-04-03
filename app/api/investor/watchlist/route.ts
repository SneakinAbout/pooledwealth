import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// GET /api/investor/watchlist — list saved investment IDs
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const items = await prisma.watchlistItem.findMany({
      where: { userId: session.user.id },
      select: { investmentId: true },
    });

    return NextResponse.json({ watchlist: items.map((i) => i.investmentId) });
  } catch (err) {
    console.error('[GET /api/investor/watchlist]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/investor/watchlist — toggle save/unsave
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = z.object({ investmentId: z.string().cuid() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid investment ID' }, { status: 400 });

    const { investmentId } = parsed.data;
    const userId = session.user.id;

    const existing = await prisma.watchlistItem.findUnique({
      where: { userId_investmentId: { userId, investmentId } },
    });

    if (existing) {
      await prisma.watchlistItem.delete({ where: { userId_investmentId: { userId, investmentId } } });
      return NextResponse.json({ saved: false });
    } else {
      await prisma.watchlistItem.create({ data: { userId, investmentId } });
      return NextResponse.json({ saved: true });
    }
  } catch (err) {
    console.error('[POST /api/investor/watchlist]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
