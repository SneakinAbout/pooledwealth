import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendInvestmentUpdate } from '@/lib/email';

const CreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  body: z.string().min(10, 'Body must be at least 10 characters'),
});

// GET /api/investments/[id]/updates — public (anyone with access to investment)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await prisma.investmentUpdate.findMany({
      where: { investmentId: params.id },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      updates.map((u) => ({
        id: u.id,
        title: u.title,
        body: u.body,
        createdAt: u.createdAt.toISOString(),
        authorName: u.createdBy.name,
      }))
    );
  } catch (err) {
    console.error('[GET /api/investments/[id]/updates]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/investments/[id]/updates — manager/admin only
export async function POST(
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
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const investment = await prisma.investment.findUnique({
      where: { id: params.id },
      select: { id: true, title: true },
    });
    if (!investment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const update = await prisma.investmentUpdate.create({
      data: {
        investmentId: params.id,
        createdById: session.user.id,
        title: parsed.data.title,
        body: parsed.data.body,
      },
      include: { createdBy: { select: { name: true } } },
    });

    // Notify all holders
    const holders = await prisma.holding.findMany({
      where: { investmentId: params.id },
      include: { user: { select: { email: true, name: true } } },
      distinct: ['userId'],
    });

    for (const h of holders) {
      sendInvestmentUpdate(h.user.email, h.user.name ?? 'there', investment.title, parsed.data.title, params.id).catch(() => {});
    }

    return NextResponse.json({
      id: update.id,
      title: update.title,
      body: update.body,
      createdAt: update.createdAt.toISOString(),
      authorName: update.createdBy.name,
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/investments/[id]/updates]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
