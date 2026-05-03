export type Confidence = 'high' | 'medium' | 'low' | 'insufficient';

export interface ValuationResult {
  marketValue: number | null;
  confidence: Confidence;
  compCount: number;
  flaggedForReview: boolean;
  flagReason?: string;
}

function median(prices: number[]): number {
  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function removeOutliers(prices: number[]): number[] {
  if (prices.length < 4) return prices;
  const mean = prices.reduce((s, p) => s + p, 0) / prices.length;
  const std = Math.sqrt(
    prices.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / prices.length,
  );
  return prices.filter((p) => Math.abs(p - mean) <= 2 * std);
}

export function calculateValuation(
  rawPrices: number[],
  flaggedForReview: boolean,
  flagReason?: string,
): ValuationResult {
  if (rawPrices.length === 0) {
    return {
      marketValue: null,
      confidence: 'insufficient',
      compCount: 0,
      flaggedForReview: true,
      flagReason: flagReason ?? 'No comparable sales found',
    };
  }

  const cleaned = removeOutliers(rawPrices);
  const compCount = cleaned.length;

  if (compCount < 3) {
    return {
      marketValue: compCount > 0 ? Math.round(median(cleaned) * 100) / 100 : null,
      confidence: 'insufficient',
      compCount,
      flaggedForReview: true,
      flagReason: flagReason ?? `Only ${compCount} comparable sale${compCount === 1 ? '' : 's'} found`,
    };
  }

  const value = Math.round(median(cleaned) * 100) / 100;
  const confidence: Confidence =
    compCount >= 10 ? 'high' : compCount >= 5 ? 'medium' : 'low';

  return {
    marketValue: value,
    confidence,
    compCount,
    flaggedForReview: flaggedForReview || confidence === 'low',
    flagReason: flaggedForReview ? flagReason : undefined,
  };
}
