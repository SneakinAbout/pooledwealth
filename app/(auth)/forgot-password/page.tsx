'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Request failed');
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#E8F5E9] mb-5">
          <CheckCircle2 className="h-7 w-7 text-[#2E7D32]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1207] mb-2">Check your email</h1>
        <p className="text-[#6A5A40] text-sm mb-6">
          If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox.
        </p>
        <Link href="/login" className="text-sm text-[#C9A84C] hover:text-[#1A2B1F] font-medium transition-colors">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1207]">Reset your password</h1>
        <p className="text-[#6A5A40] mt-1 text-sm">Enter your email and we'll send a reset link</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 mb-6 bg-[#FFEBEE] border border-[#C62828]/20 rounded-xl text-[#C62828] text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" className="w-full" loading={loading} size="lg">
          <Mail className="h-4 w-4 mr-2" />
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6A5A40]">
        Remember your password?{' '}
        <Link href="/login" className="text-[#C9A84C] hover:text-[#1A2B1F] font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
