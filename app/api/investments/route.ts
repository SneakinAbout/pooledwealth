import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireManagerOrAbove } from '@/lib/permissions';
import { investmentSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const session = await getServerSession(authOptions);
    const isPublicOrInvestor =
      !session || session.user.role === 'INVESTOR';

    const where: Record<string, unknown> = {};

    if (isPublicOrInvestor) {
      where.status = 'ACTIVE';
    } else if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const investments = await prisma.investment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { holdings: true },
        },
      },
    });

    return NextResponse.json(investments);
  } catch (err) {
    console.error('[GET /api/investments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireManagerOrAbove(session);
    if (permError) return permError;

    const body = await request.json();
    const result = investmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    const investment = await prisma.investment.create({
      data: {
        ...data,
        availableUnits: data.totalUnits,
        status: data.status ?? 'DRAFT',
        imageUrl: data.imageUrl || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        createdById: session!.user.id,
      },
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (err) {
    console.error('[POST /api/investments]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
