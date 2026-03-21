import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireManagerOrAbove, requireAdmin } from '@/lib/permissions';
import { investmentSchemaBase } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    // Only managers and admins see the creator's email (staff-facing detail)
    const includeEmail =
      session?.user.role === 'ADMIN' || session?.user.role === 'MANAGER';

    const investment = await prisma.investment.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, ...(includeEmail && { email: true }) },
        },
        _count: {
          select: { holdings: true },
        },
      },
    });

    if (!investment) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    return NextResponse.json(investment);
  } catch (err) {
    console.error('[GET /api/investments/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireManagerOrAbove(session);
    if (permError) return permError;

    const body = await request.json();

    const existing = await prisma.investment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    // Manager can only edit their own investments; admin can edit all
    if (
      session!.user.role === 'MANAGER' &&
      existing.createdById !== session!.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = investmentSchemaBase.partial().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = result.data;
    const updateData: Record<string, unknown> = { ...data };

    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.imageUrl === '') updateData.imageUrl = null;

    const investment = await prisma.investment.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(investment);
  } catch (err) {
    console.error('[PUT /api/investments/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const existing = await prisma.investment.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
    }

    // Soft delete — archive instead
    const investment = await prisma.investment.update({
      where: { id: params.id },
      data: { status: 'ARCHIVED' },
    });

    return NextResponse.json(investment);
  } catch (err) {
    console.error('[DELETE /api/investments/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
