import { cn } from '@/lib/utils';
import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, rows = 4, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-xs font-medium text-[#6A5A40] mb-1.5 uppercase tracking-widest">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            'w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-[#1A1207] placeholder-[#8A7A60] resize-none',
            'focus:outline-none focus:ring-2 focus:border-[#C9A84C] transition-colors duration-150',
            error
              ? 'border-[#C62828]/60 focus:ring-[#C62828]/30'
              : 'border-[#E8E2D6] hover:border-[#C9A84C]/40 focus:ring-[#C9A84C]/40',
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

Textarea.displayName = 'Textarea';
export default Textarea;
