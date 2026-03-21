'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { registerSchema, type RegisterInput } from '@/lib/validations';
import { AlertCircle, CheckSquare, Square } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { termsAccepted: undefined as unknown as true },
  });
  const termsAccepted = watch('termsAccepted');

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Registration failed');

      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      router.push(signInResult?.ok ? '/investments' : '/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1207]">Create your account</h1>
        <p className="text-[#6A5A40] mt-1">Start investing in authenticated collectibles</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 mb-6 bg-[#FFEBEE] border border-[#C62828]/20 rounded-xl text-[#C62828] text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Jane Smith"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Repeat password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>

        <div className="mt-1">
          <button
            type="button"
            onClick={() => setValue('termsAccepted', termsAccepted ? (undefined as unknown as true) : true)}
            className="flex items-start gap-2.5 text-left w-full group"
          >
            <span className="mt-0.5 flex-shrink-0 text-[#C9A84C]">
              {termsAccepted
                ? <CheckSquare className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                : <Square className="h-[18px] w-[18px] text-[#8A7A60] group-hover:text-[#C9A84C] transition-colors" />}
            </span>
            <span className="text-sm text-[#6A5A40] leading-snug">
              I agree to the{' '}
              <Link href="/terms" className="text-[#C9A84C] hover:underline" target="_blank" onClick={(e) => e.stopPropagation()}>
                Terms &amp; Conditions
              </Link>{' '}and{' '}
              <Link href="/privacy" className="text-[#C9A84C] hover:underline" target="_blank" onClick={(e) => e.stopPropagation()}>
                Privacy Policy
              </Link>
            </span>
          </button>
          {errors.termsAccepted && (
            <p className="mt-1 text-xs text-[#C62828] ml-7">{errors.termsAccepted.message as string}</p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2" loading={loading} size="lg">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6A5A40]">
        Already have an account?{' '}
        <Link href="/login" className="text-[#C9A84C] hover:text-[#1A2B1F] font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
