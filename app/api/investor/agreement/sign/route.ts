import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AGREEMENT_VERSION, getAgreementPlainText } from '@/lib/agreementText';
import { z } from 'zod';

const schema = z.object({
  fullName: z.string().min(2, 'Please enter your full legal name'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.masterAgreement.findUnique({ where: { userId: session.user.id } });
    if (existing) return NextResponse.json({ error: 'Agreement already signed' }, { status: 409 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';

    const agreement = await prisma.masterAgreement.create({
      data: {
        userId: session.user.id,
        fullNameAtSigning: parsed.data.fullName,
        ipAddress: ip,
        agreementVersion: AGREEMENT_VERSION,
        agreementText: getAgreementPlainText(),
      },
    });

    return NextResponse.json({ ok: true, agreedAt: agreement.agreedAt });
  } catch (err) {
    console.error('[POST /api/investor/agreement/sign]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
