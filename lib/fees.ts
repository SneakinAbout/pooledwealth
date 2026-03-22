import { Decimal } from '@prisma/client/runtime/library';

export interface FeeSettings {
  managementFeePercent: Decimal | number; // annual % of AUM
  profitSharePercent: Decimal | number;   // % of profits on distributions
}

export interface DistributionBreakdown {
  grossAmount: number;
  costBasis: number;
  profit: number;
  profitShare: number;
  netAmount: number;
  profitSharePercent: number;
}

export interface ManagementFeeBreakdown {
  totalAUM: number;
  annualFee: number;
  monthlyFee: number;
  managementFeePercent: number;
}

/**
 * Calculates the profit share deducted from a distribution.
 * Profit share applies only to the gain above cost basis, not the full gross amount.
 * Management fee is NOT deducted here — it is charged separately on AUM monthly.
 */
export function calculateDistributionFees(
  grossAmount: number,
  settings: FeeSettings,
  costBasis: number = 0
): DistributionBreakdown {
  const profitPct = Number(settings.profitSharePercent);
  const profit = Math.max(0, grossAmount - costBasis);
  const profitShare = Math.round(profit * (profitPct / 100) * 100) / 100;
  const netAmount = Math.round((grossAmount - profitShare) * 100) / 100;

  return {
    grossAmount,
    costBasis,
    profit,
    profitShare,
    netAmount,
    profitSharePercent: profitPct,
  };
}

/**
 * Calculates the monthly management fee based on total AUM.
 * Annual rate / 12, applied to total invested capital.
 */
export function calculateMonthlyManagementFee(
  totalAUM: number,
  settings: FeeSettings
): ManagementFeeBreakdown {
  const annualPct = Number(settings.managementFeePercent);
  const annualFee = totalAUM * (annualPct / 100);
  const monthlyFee = annualFee / 12;

  return {
    totalAUM,
    annualFee: Math.round(annualFee * 100) / 100,
    monthlyFee: Math.round(monthlyFee * 100) / 100,
    managementFeePercent: annualPct,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}
