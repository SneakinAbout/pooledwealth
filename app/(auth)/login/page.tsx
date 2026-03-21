'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/investments';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1207]">Welcome back</h1>
        <p className="text-[#6A5A40] mt-1">Sign in to your account to continue</p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 mb-6 bg-[#FFEBEE] border border-[#C62828]/20 rounded-xl text-[#C62828] text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-[#8A7A60] hover:text-[#C9A84C] transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={loading} size="lg">
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#6A5A40]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[#C9A84C] hover:text-[#1A2B1F] font-medium transition-colors">
          Create account
        </Link>
      </p>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 pt-6 border-t border-[#E8E2D6]">
          <p className="text-xs text-[#8A7A60] text-center mb-3 font-medium">Test credentials</p>
          <div className="grid grid-cols-1 gap-1.5 text-xs text-[#6A5A40]">
            <div className="flex justify-between bg-[#EDE6D6] rounded-lg px-3 py-2 border border-[#E8E2D6]">
              <span className="text-[#8A7A60]">Admin</span>
              <span>admin@pooledwealth.com / password</span>
            </div>
            <div className="flex justify-between bg-[#EDE6D6] rounded-lg px-3 py-2 border border-[#E8E2D6]">
              <span className="text-[#8A7A60]">Manager</span>
              <span>manager@pooledwealth.com / password</span>
            </div>
            <div className="flex justify-between bg-[#EDE6D6] rounded-lg px-3 py-2 border border-[#E8E2D6]">
              <span className="text-[#8A7A60]">Investor</span>
              <span>alice@example.com / password</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
