import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}

export default function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-[#EDE6D6] text-[#6A5A40]',
    success: 'bg-[#E8F5E9] text-[#2E7D32]',
    warning: 'bg-[#FFF3E0] text-[#E65100]',
    danger:  'bg-[#FFEBEE] text-[#C62828]',
    info:    'bg-[#E3F2FD] text-[#1565C0]',
    purple:  'bg-[#EDE6D6] text-[#6A5A40]',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    ACTIVE:    { label: 'Active',     variant: 'success' },
    DRAFT:     { label: 'Draft',      variant: 'warning' },
    CLOSED:    { label: 'Closed',     variant: 'info' },
    EXITED:    { label: 'Exited',     variant: 'default' },
    FAILED:    { label: 'Failed',     variant: 'danger' },
    ARCHIVED:  { label: 'Archived',   variant: 'default' },
    COMPLETED: { label: 'Completed',  variant: 'default' },
    PENDING:   { label: 'Pending',    variant: 'warning' },
  };

  const config = map[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
