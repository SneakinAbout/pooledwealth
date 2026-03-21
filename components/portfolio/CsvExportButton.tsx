'use client';

import { Download } from 'lucide-react';

export default function CsvExportButton() {
  return (
    <a
      href="/api/investor/transactions/export"
      download
      className="inline-flex items-center gap-1.5 text-xs text-[#8A7A60] hover:text-[#1A1207] transition-colors px-2.5 py-1.5 rounded-lg border border-[#E8E2D6] hover:border-[#C9A84C] hover:bg-[#EDE6D6]"
    >
      <Download className="h-3.5 w-3.5" />
      Export CSV
    </a>
  );
}
