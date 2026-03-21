'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle2 } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface AgreementRecord {
  id: string;
  fullNameAtSigning: string;
  agreedAt: string;
  ipAddress: string;
  agreementVersion: string;
}

export default function MyDocuments() {
  const [agreement, setAgreement] = useState<AgreementRecord | null | undefined>(undefined);

  useEffect(() => {
    fetch('/api/investor/agreement')
      .then((r) => r.json())
      .then((d) => setAgreement(d.agreement ?? null))
      .catch(() => setAgreement(null));
  }, []);

  if (agreement === undefined) return null;

  return (
    <Card>
      <CardTitle className="mb-5">My Documents</CardTitle>

      {agreement === null ? (
        <div className="text-center py-6">
          <p className="text-sm text-[#6A5A40] mb-3">You have not yet signed the Master Co-Ownership Agreement.</p>
          <a href="/investor/agreement">
            <Button size="sm">Sign Agreement</Button>
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 border border-[#E8E2D6] rounded-xl bg-[#FDFBF7]">
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
              <p className="text-xs text-[#6A5A40]">IP: {agreement.ipAddress}</p>
            </div>
            <a href="/api/investor/agreement/pdf" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download PDF
              </Button>
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}
