'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#F7F4EE] disabled:opacity-40 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:  'bg-[#1A2B1F] text-[#C9A84C] hover:bg-[#2E4A35] focus:ring-[#C9A84C]/40 border-0',
      secondary:'bg-[#C9A84C] text-[#1A1207] hover:brightness-105 focus:ring-[#C9A84C]/40',
      ghost:    'bg-transparent border border-[#E8E2D6] text-[#6A5A40] hover:bg-[#EDE6D6] focus:ring-[#C9A84C]/30',
      danger:   'bg-[#FFEBEE] text-[#C62828] focus:ring-[#C62828]/30',
      outline:  'border border-[#C9A84C]/50 text-[#C9A84C] hover:bg-[#C9A84C]/10 hover:border-[#C9A84C] focus:ring-[#C9A84C]/40',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-sm gap-2',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="h-3.5 w-3.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
