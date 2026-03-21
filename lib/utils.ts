import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatCurrency(amount: number | string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount));
}

export function calculateProgress(total: number, available: number): number {
  if (total === 0) return 0;
  const sold = total - available;
  return Math.round((sold / total) * 100);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'text-emerald-400 bg-emerald-400/10';
    case 'DRAFT':
      return 'text-yellow-400 bg-yellow-400/10';
    case 'CLOSED':
      return 'text-blue-400 bg-blue-400/10';
    case 'ARCHIVED':
      return 'text-gray-400 bg-gray-400/10';
    case 'COMPLETED':
      return 'text-emerald-400 bg-emerald-400/10';
    case 'PENDING':
      return 'text-yellow-400 bg-yellow-400/10';
    case 'FAILED':
      return 'text-red-400 bg-red-400/10';
    default:
      return 'text-gray-400 bg-gray-400/10';
  }
}

export function getTransactionTypeColor(type: string): string {
  switch (type) {
    case 'PURCHASE':
      return 'text-blue-400 bg-blue-400/10';
    case 'DISTRIBUTION':
      return 'text-emerald-400 bg-emerald-400/10';
    case 'REDEMPTION':
      return 'text-orange-400 bg-orange-400/10';
    case 'FEE':
      return 'text-red-400 bg-red-400/10';
    default:
      return 'text-gray-400 bg-gray-400/10';
  }
}
