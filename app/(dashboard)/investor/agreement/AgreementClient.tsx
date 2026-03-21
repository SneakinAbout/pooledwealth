'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileText, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { AGREEMENT_SECTIONS, AGREEMENT_VERSION } from '@/lib/agreementText';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function AgreementClient() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    if (atBottom) setScrolledToBottom(true);
  }, []);

  async function handleSign() {
    if (!fullName.trim()) { toast.error('Please enter your full legal name'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/investor/agreement/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign');
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sign agreement');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[#E8F5E9] mb-6">
          <CheckCircle2 className="h-8 w-8 text-[#2E7D32]" />
        </div>
        <h2 className="text-2xl font-bold text-[#1A1207] mb-3">Agreement Signed</h2>
        <p className="text-[#6A5A40] mb-8">
          Your Master Co-Ownership Agreement has been signed and saved to your account.
          You can view it anytime under <strong>Settings → My Documents</strong>.
        </p>
        <Button onClick={() => router.push('/investments')} size="lg">
          Browse Assets →
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="h-5 w-5 text-[#C9A84C]" />
          <h1 className="text-2xl font-bold text-[#1A1207]">Master Co-Ownership Agreement</h1>
        </div>
        <p className="text-[#6A5A40] text-sm">
          Version {AGREEMENT_VERSION} — Please read the full agreement before signing.
        </p>
      </div>

      {/* Scrollable agreement */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-[480px] overflow-y-auto border border-[#E8E2D6] rounded-2xl bg-white p-8 text-sm text-[#1A1207] leading-relaxed space-y-6 scroll-smooth"
        >
          <div className="text-center pb-4 border-b border-[#E8E2D6]">
            <h2 className="text-lg font-bold">MASTER CO-OWNERSHIP AGREEMENT</h2>
            <p className="text-xs text-[#6A5A40] mt-1">Version {AGREEMENT_VERSION}</p>
          </div>

          {AGREEMENT_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-[#1A1207] mb-2">{section.title}</h3>
              <p className="text-[#3A2A10] leading-relaxed">{section.body}</p>
            </div>
          ))}

          <div className="pt-4 border-t border-[#E8E2D6] text-xs text-[#8A7A60]">
            End of agreement.
          </div>
        </div>

        {/* Scroll indicator */}
        {!scrolledToBottom && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
            <span className="text-xs text-[#8A7A60] bg-white px-2 py-0.5 rounded-full border border-[#E8E2D6]">
              Scroll to read the full agreement
            </span>
            <ChevronDown className="h-4 w-4 text-[#C9A84C] animate-bounce" />
          </div>
        )}
      </div>

      {/* Signature section */}
      <div className={`border rounded-2xl p-6 space-y-4 transition-all ${scrolledToBottom ? 'border-[#C9A84C]/40 bg-[#FDFBF7]' : 'border-[#E8E2D6] bg-[#F7F4EE] opacity-60 pointer-events-none'}`}>
        <div>
          <h3 className="font-semibold text-[#1A1207] mb-1">Electronic Signature</h3>
          <p className="text-xs text-[#6A5A40]">
            By typing your full legal name and clicking &quot;I Agree&quot;, you confirm you have read and agree to be bound by this Agreement.
          </p>
        </div>

        <Input
          label="Full Legal Name"
          placeholder="e.g. Jane Marie Smith"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={!scrolledToBottom}
        />

        <Button
          onClick={handleSign}
          loading={loading}
          disabled={!scrolledToBottom || !fullName.trim()}
          size="lg"
          className="w-full"
        >
          I Agree — Sign Agreement
        </Button>

        <p className="text-[10px] text-[#8A7A60] text-center">
          Your name, timestamp, and IP address will be recorded as your electronic signature.
        </p>
      </div>
    </div>
  );
}
