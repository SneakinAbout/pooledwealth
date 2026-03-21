'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found.');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setStatus('success');
        } else {
          const data = await res.json();
          setErrorMsg(data.error || 'Verification failed');
          setStatus('error');
        }
      })
      .catch(() => {
        setErrorMsg('Network error. Please try again.');
        setStatus('error');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-10 w-10 text-[#C9A84C] animate-spin mx-auto mb-4" />
        <p className="text-[#6A5A40]">Verifying your email…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#E8F5E9] mb-5">
          <CheckCircle2 className="h-7 w-7 text-[#2E7D32]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1207] mb-2">Email verified!</h1>
        <p className="text-[#6A5A40] text-sm mb-6">Your email address has been verified successfully.</p>
        <Link
          href="/investments"
          className="inline-flex items-center gap-1.5 bg-[#1A2B1F] text-[#C9A84C] px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1A2B1F]/90 transition-colors"
        >
          Browse Assets
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#FFEBEE] mb-5">
        <XCircle className="h-7 w-7 text-[#C62828]" />
      </div>
      <h1 className="text-2xl font-bold text-[#1A1207] mb-2">Verification failed</h1>
      <p className="text-[#C62828] text-sm mb-4">{errorMsg}</p>
      <Link href="/login" className="text-sm text-[#C9A84C] hover:text-[#1A2B1F] font-medium transition-colors">
        Go to sign in
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
