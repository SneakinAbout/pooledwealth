import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/permissions';

// GET /api/admin/users/[id]/kyc-documents — list user's KYC documents
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const permError = requireAdmin(session);
    if (permError) return permError;

    const docs = await prisma.kycDocument.findMany({
      where: { userId: params.id },
      select: { id: true, type: true, fileName: true, mimeType: true, uploadedAt: true },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(docs.map((d) => ({ ...d, uploadedAt: d.uploadedAt.toISOString() })));
  } catch (err) {
    console.error('[GET /api/admin/users/[id]/kyc-documents]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
