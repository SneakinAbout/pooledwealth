import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplement = await prisma.assetSupplement.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { investment: { select: { title: true } } },
    });

    if (!supplement) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isPending = supplement.status === 'PENDING';
    const statusLabel = isPending
      ? '<span style="background:#FFF3E0;color:#E65100;padding:2px 10px;border-radius:20px;font-size:13px;font-weight:600">PENDING — Round not yet closed</span>'
      : '<span style="background:#E8F5E9;color:#2E7D32;padding:2px 10px;border-radius:20px;font-size:13px;font-weight:600">FINALISED — Ownership confirmed</span>';

    const paragraphs = supplement.agreementText
      .split('\n')
      .map((line) => {
        if (line.trim() === '') return '<br/>';
        if (/^\d+\. /.test(line.trim())) return `<h3 style="margin:20px 0 6px;color:#1A2B1F;font-size:14px">${line.trim()}</h3>`;
        if (line.trim() === line.trim().toUpperCase() && line.trim().length > 3) return `<h2 style="margin:0 0 4px;color:#1A2B1F;font-size:18px;letter-spacing:0.5px">${line.trim()}</h2>`;
        return `<p style="margin:0 0 8px;line-height:1.6">${line.trim()}</p>`;
      })
      .join('');

    let finalRegisterHtml = '';
    if (!isPending && supplement.finalOwnershipRegister) {
      const register = supplement.finalOwnershipRegister as Array<{ co_owner_ref: string; shares: number; percentage: string }>;
      const rows = register
        .map(
          (r) =>
            `<tr><td style="padding:6px 12px;border-bottom:1px solid #E8E2D6">${r.co_owner_ref}</td><td style="padding:6px 12px;border-bottom:1px solid #E8E2D6;text-align:right">${r.shares.toLocaleString()}</td><td style="padding:6px 12px;border-bottom:1px solid #E8E2D6;text-align:right">${r.percentage}</td></tr>`
        )
        .join('');
      finalRegisterHtml = `
      <div style="margin-top:32px;padding-top:24px;border-top:2px solid #1A2B1F">
        <h3 style="color:#1A2B1F;margin:0 0 12px">Final Ownership Register</h3>
        <p style="color:#6A5A40;font-size:12px;margin:0 0 12px">Anonymised — co-owner identities are confidential.</p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead>
            <tr style="background:#EDE6D6">
              <th style="padding:8px 12px;text-align:left;font-weight:600;color:#1A1207">Reference</th>
              <th style="padding:8px 12px;text-align:right;font-weight:600;color:#1A1207">Shares</th>
              <th style="padding:8px 12px;text-align:right;font-weight:600;color:#1A1207">Ownership %</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#6A5A40;font-size:12px;margin:12px 0 0">Finalised: ${new Date(supplement.finalisedAt!).toLocaleString('en-AU', { timeZone: 'UTC', dateStyle: 'long', timeStyle: 'short' })} UTC</p>
      </div>`;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Asset Co-Ownership Supplement — ${supplement.investment.title}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none; } }
    body { font-family: Georgia, serif; max-width: 780px; margin: 0 auto; padding: 40px; color: #1A1207; font-size: 13px; }
  </style>
</head>
<body>
  <div class="no-print" style="background:#1A2B1F;color:#C9A84C;padding:12px 20px;margin:-40px -40px 32px;text-align:center;font-family:sans-serif;font-size:13px">
    <strong>Pooled Wealth</strong> — Asset Co-Ownership Supplement &nbsp;·&nbsp;
    <button onclick="window.print()" style="background:#C9A84C;color:#1A2B1F;border:none;padding:6px 16px;border-radius:6px;font-weight:600;cursor:pointer;font-size:12px">Print / Save as PDF</button>
  </div>

  <div style="text-align:center;margin-bottom:24px">
    <h1 style="margin:0 0 4px;color:#1A2B1F;font-size:22px">Pooled Wealth</h1>
    <p style="margin:0;color:#8A7A60;font-size:12px">ABN [INSERT ABN]</p>
  </div>

  <div style="text-align:center;margin-bottom:8px">${statusLabel}</div>

  <hr style="border:none;border-top:2px solid #1A2B1F;margin:20px 0"/>

  <div style="font-size:13px;line-height:1.7">${paragraphs}</div>

  <div style="margin-top:32px;padding-top:24px;border-top:1px solid #E8E2D6">
    <h3 style="color:#1A2B1F;margin:0 0 12px;font-size:14px">Electronic Signature</h3>
    <table style="font-size:12px;color:#6A5A40;border-collapse:collapse">
      <tr><td style="padding:3px 16px 3px 0;font-weight:600;color:#1A1207">Signed by:</td><td>${supplement.fullNameAtSigning}</td></tr>
      <tr><td style="padding:3px 16px 3px 0;font-weight:600;color:#1A1207">Date:</td><td>${new Date(supplement.signedAt).toLocaleString('en-AU', { timeZone: 'UTC', dateStyle: 'long', timeStyle: 'short' })} UTC</td></tr>
      <tr><td style="padding:3px 16px 3px 0;font-weight:600;color:#1A1207">IP Address:</td><td>${supplement.ipAddress}</td></tr>
      <tr><td style="padding:3px 16px 3px 0;font-weight:600;color:#1A1207">Version:</td><td>${supplement.agreementVersion}</td></tr>
    </table>
  </div>

  ${finalRegisterHtml}

  <p style="color:#8A7A60;font-size:11px;margin-top:40px;text-align:center">
    This document was generated by Pooled Wealth. The electronic signature above constitutes a legally binding signature.
  </p>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[GET /api/investor/supplements/[id]/pdf]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
