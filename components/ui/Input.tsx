import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-[#6A5A40] mb-1.5 uppercase tracking-widest">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-[#1A1207] placeholder-[#8A7A60]',
            'focus:outline-none focus:ring-2 focus:border-[#C9A84C] transition-colors duration-150',
            error
              ? 'border-[#C62828]/60 focus:ring-[#C62828]/30'
              : 'border-[#C8BEA8] hover:border-[#C9A84C]/60 focus:ring-[#C9A84C]/40',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-[#C62828]">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-[#8A7A60]">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
