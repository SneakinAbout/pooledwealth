import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-medium text-[#6A5A40] mb-1.5 uppercase tracking-widest">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-[#1A1207] appearance-none cursor-pointer pr-9',
              'focus:outline-none focus:ring-2 focus:border-[#C9A84C] transition-colors duration-150',
              error
                ? 'border-[#C62828]/60 focus:ring-[#C62828]/30'
                : 'border-[#E8E2D6] hover:border-[#C9A84C]/40 focus:ring-[#C9A84C]/40',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white text-[#1A1207]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A7A60] pointer-events-none" />
        </div>
        {error && <p className="mt-1.5 text-xs text-[#C62828]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
