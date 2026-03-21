import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// GET /api/investor/kyc-documents — list own documents (metadata only)
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const docs = await prisma.kycDocument.findMany({
    where: { userId: session.user.id },
    select: { id: true, type: true, fileName: true, mimeType: true, uploadedAt: true },
    orderBy: { uploadedAt: 'desc' },
  });

  return NextResponse.json(docs.map((d) => ({ ...d, uploadedAt: d.uploadedAt.toISOString() })));
}

// POST /api/investor/kyc-documents — upload a document
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!type) return NextResponse.json({ error: 'Document type required' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'File must be JPEG, PNG, WEBP or PDF' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const doc = await prisma.kycDocument.create({
    data: {
      userId: session.user.id,
      type,
      fileName: file.name,
      fileData: buffer,
      mimeType: file.type,
    },
    select: { id: true, type: true, fileName: true, mimeType: true, uploadedAt: true },
  });

  return NextResponse.json({ ...doc, uploadedAt: doc.uploadedAt.toISOString() }, { status: 201 });
}
