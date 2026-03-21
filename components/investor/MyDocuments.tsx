'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface AgreementRecord {
  id: string;
  fullNameAtSigning: string;
  agreedAt: string;
  ipAddress: string;
  agreementVersion: string;
}

interface SupplementRecord {
  id: string;
  sharesPurchased: number;
  totalShares: number;
  ownershipPercentage: number;
  fullNameAtSigning: string;
  signedAt: string;
  agreementVersion: string;
  status: 'PENDING' | 'FINALISED';
  finalisedAt: string | null;
  investment: {
    id: string;
    title: string;
    imageUrl: string | null;
  };
}

export default function MyDocuments() {
  const [agreement, setAgreement] = useState<AgreementRecord | null | undefined>(undefined);
  const [supplements, setSupplements] = useState<SupplementRecord[] | undefined>(undefined);

  useEffect(() => {
    fetch('/api/investor/agreement')
      .then((r) => r.json())
      .then((d) => setAgreement(d.agreement ?? null))
      .catch(() => setAgreement(null));

    fetch('/api/investor/supplements')
      .then((r) => r.json())
      .then((d) => setSupplements(d.supplements ?? []))
      .catch(() => setSupplements([]));
  }, []);

  if (agreement === undefined || supplements === undefined) return null;

  return (
    <Card>
      <CardTitle className="mb-5">My Documents</CardTitle>

      {/* Master Agreement */}
      {agreement === null ? (
        <div className="text-center py-6 border border-[#E8E2D6] rounded-xl bg-[#FDFBF7] mb-4">
          <p className="text-sm text-[#6A5A40] mb-3">You have not yet signed the Master Co-Ownership Agreement.</p>
          <a href="/investor/agreement">
            <Button size="sm">Sign Agreement</Button>
          </a>
        </div>
      ) : (
        <div className="flex items-start gap-4 p-4 border border-[#E8E2D6] rounded-xl bg-[#FDFBF7] mb-4">
          <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-[#1A1207] text-sm">Master Co-Ownership Agreement</p>
              <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full font-medium">Signed</span>
            </div>
            <p className="text-xs text-[#6A5A40]">Version: {agreement.agreementVersion}</p>
            <p className="text-xs text-[#6A5A40]">
              Signed by: <span className="font-medium text-[#1A1207]">{agreement.fullNameAtSigning}</span>
            </p>
            <p className="text-xs text-[#6A5A40]">
              Date:{' '}
              {new Date(agreement.agreedAt).toLocaleString('en-AU', {
                timeZone: 'UTC',
                dateStyle: 'long',
                timeStyle: 'short',
              })}{' '}
              UTC
            </p>
          </div>
          <a href="/api/investor/agreement/pdf" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
          </a>
        </div>
      )}

      {/* Asset Supplements */}
      {supplements.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#6A5A40] uppercase tracking-wider">
            Co-Ownership Supplements ({supplements.length})
          </p>
          {supplements.map((s) => (
            <div key={s.id} className="flex items-start gap-4 p-4 border border-[#E8E2D6] rounded-xl bg-[#FDFBF7]">
              <div
                className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                  s.status === 'FINALISED' ? 'bg-[#E8F5E9]' : 'bg-[#FFF3E0]'
                }`}
              >
                {s.status === 'FINALISED' ? (
                  <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
                ) : (
                  <Clock className="h-5 w-5 text-[#E65100]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-semibold text-[#1A1207] text-sm truncate">{s.investment.title}</p>
                  {s.status === 'FINALISED' ? (
                    <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                      Finalised — ownership confirmed
                    </span>
                  ) : (
                    <span className="text-[10px] bg-[#FFF3E0] text-[#E65100] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                      Pending — round not yet closed
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6A5A40]">
                  {s.sharesPurchased.toLocaleString()} of {s.totalShares.toLocaleString()} shares ·{' '}
                  {Number(s.ownershipPercentage).toFixed(4)}% interest
                </p>
                <p className="text-xs text-[#6A5A40]">Version: {s.agreementVersion}</p>
                <p className="text-xs text-[#6A5A40]">
                  Signed:{' '}
                  {new Date(s.signedAt).toLocaleString('en-AU', {
                    timeZone: 'UTC',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}{' '}
                  UTC
                </p>
                {s.status === 'FINALISED' && s.finalisedAt && (
                  <p className="text-xs text-[#2E7D32]">
                    Finalised:{' '}
                    {new Date(s.finalisedAt).toLocaleString('en-AU', {
                      timeZone: 'UTC',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    UTC
                  </p>
                )}
              </div>
              <a
                href={`/api/investor/supplements/${s.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <Button variant="secondary" size="sm">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  PDF
                </Button>
              </a>
            </div>
          ))}
        </div>
      )}

      {agreement !== null && supplements.length === 0 && (
        <p className="text-sm text-[#8A7A60] text-center py-3">
          No co-ownership supplements yet. They will appear here after your first investment.
        </p>
      )}
    </Card>
  );
}
