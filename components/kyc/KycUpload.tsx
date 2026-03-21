'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const DOC_TYPES = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'DRIVERS_LICENSE', label: "Driver's Licence" },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'PROOF_OF_ADDRESS', label: 'Proof of Address (utility bill, bank statement)' },
];

interface KycDoc {
  id: string;
  type: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
}

export default function KycUpload() {
  const [docs, setDocs] = useState<KycDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [docType, setDocType] = useState(DOC_TYPES[0].value);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/investor/kyc-documents')
      .then((r) => r.json())
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', docType);

    try {
      const res = await fetch('/api/investor/kyc-documents', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setDocs((prev) => [data, ...prev]);
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const typeLabel = (val: string) => DOC_TYPES.find((d) => d.value === val)?.label ?? val;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-[#E3F2FD] border border-[#1565C0]/20 rounded-xl text-sm text-[#1565C0] flex gap-2.5">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          Upload government-issued ID and proof of address to complete identity verification (KYC).
          Files are stored securely and reviewed by our team.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="flex-1 bg-white border border-[#E8E2D6] rounded-xl px-3 py-2.5 text-sm text-[#1A1207] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
        >
          {DOC_TYPES.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          loading={uploading}
          onClick={() => fileRef.current?.click()}
          className="whitespace-nowrap"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {loading ? (
        <p className="text-sm text-[#8A7A60] py-4 text-center">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-[#8A7A60] py-4 text-center">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 bg-[#EDE6D6] rounded-xl border border-[#E8E2D6]">
              <div className="h-8 w-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                <FileText className="h-4 w-4 text-[#2E7D32]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1207] truncate">{doc.fileName}</p>
                <p className="text-xs text-[#8A7A60]">{typeLabel(doc.type)} · {formatDate(doc.uploadedAt)}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-[#2E7D32] flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
