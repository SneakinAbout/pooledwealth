import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'] as const;

const ProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(), // ISO date string
  taxFileNumber: z.string().max(12).optional().nullable(), // e.g. "123 456 789"
  streetAddress: z.string().max(200).optional().nullable(),
  suburb: z.string().max(100).optional().nullable(),
  state: z.enum(AU_STATES).optional().nullable(),
  postcode: z.string().regex(/^\d{4}$/, 'Postcode must be 4 digits').optional().nullable(),
  bankAccountName: z.string().max(100).optional().nullable(),
  bankBsb: z.string().regex(/^\d{3}-\d{3}$/, 'BSB must be in format XXX-XXX').optional().nullable(),
  bankAccountNumber: z.string().max(20).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable(),
  notifyNewInvestments: z.boolean().optional(),
});

// GET /api/investor/profile
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        taxFileNumber: true,
        streetAddress: true,
        suburb: true,
        state: true,
        postcode: true,
        kycApproved: true,
        createdAt: true,
        bankAccountName: true,
        bankBsb: true,
        bankAccountNumber: true,
        bio: true,
        linkedinUrl: true,
        notifyNewInvestments: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Mask TFN — only show last 3 digits
    const maskedTfn = user.taxFileNumber
      ? `••• ••• ${user.taxFileNumber.replace(/\D/g, '').slice(-3)}`
      : null;

    // Mask bank account number — only show last 3 digits
    const maskedAccount = user.bankAccountNumber
      ? `••••••${user.bankAccountNumber.slice(-3)}`
      : null;

    return NextResponse.json({
      ...user,
      dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
      taxFileNumber: maskedTfn,
      hasTfn: !!user.taxFileNumber,
      bankAccountNumber: maskedAccount,
      hasBankAccount: !!(user.bankAccountName && user.bankBsb && user.bankAccountNumber),
    });
  } catch (err) {
    console.error('[GET /api/investor/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/investor/profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { dateOfBirth, taxFileNumber, ...rest } = parsed.data;

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...rest,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        // Only update TFN if explicitly provided (non-null string)
        ...(taxFileNumber !== undefined ? { taxFileNumber: taxFileNumber ?? null } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        streetAddress: true,
        suburb: true,
        state: true,
        postcode: true,
        kycApproved: true,
      },
    });

    return NextResponse.json({
      ...updated,
      dateOfBirth: updated.dateOfBirth?.toISOString() ?? null,
    });
  } catch (err) {
    console.error('[PUT /api/investor/profile]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
