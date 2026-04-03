import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const agreement = await prisma.masterAgreement.findUnique({ where: { userId: session.user.id } });
  if (!agreement) return NextResponse.json({ error: 'No signed agreement found' }, { status: 404 });

  const agreedAt = new Date(agreement.agreedAt).toLocaleString('en-AU', {
    timeZone: 'UTC',
    dateStyle: 'long',
    timeStyle: 'long',
  }) + ' UTC';

  // Format agreement text as HTML paragraphs
  const bodyHtml = agreement.agreementText
    .split('\n')
    .map((line) => {
      if (!line.trim()) return '';
      if (line.startsWith('MASTER') || line.startsWith('Agreement Version')) {
        return `<p class="header-line">${line}</p>`;
      }
      // Section headings: start with a digit and a dot
      if (/^\d+\./.test(line)) return `<h3>${line}</h3>`;
      return `<p>${line}</p>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Master Co-Ownership Agreement — Pooled Wealth</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; font-size: 13px; line-height: 1.7; color: #1a1a1a; padding: 60px; max-width: 800px; margin: auto; }
    .header-line { font-weight: bold; font-size: 15px; margin-bottom: 4px; }
    h1 { font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #1a1a1a; padding-bottom: 8px; }
    h3 { font-size: 13px; font-weight: bold; margin-top: 20px; margin-bottom: 6px; }
    p { margin-bottom: 10px; }
    .signature-block { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
    .signature-block p { margin-bottom: 6px; font-size: 12px; }
    .signature-name { font-size: 16px; font-style: italic; margin-bottom: 4px; }
    @media print {
      body { padding: 40px; }
      @page { margin: 40px; }
    }
  </style>
</head>
<body>
  <h1>Master Co-Ownership Agreement</h1>
  ${bodyHtml}
  <div class="signature-block">
    <p><strong>Electronically signed by:</strong></p>
    <p class="signature-name">${agreement.fullNameAtSigning}</p>
    <p><strong>Date &amp; Time (UTC):</strong> ${agreedAt}</p>
    <p><strong>IP Address:</strong> ${agreement.ipAddress}</p>
    <p><strong>Agreement Version:</strong> ${agreement.agreementVersion}</p>
    <p><strong>Record ID:</strong> ${agreement.id}</p>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (err) {
    console.error('[GET /api/investor/agreement/pdf]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
