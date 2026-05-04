import type { AssetClassification, AssetInput } from './classify';

export interface CompResult {
  cleanPrices: number[];
  rawListingsFound: number;
  filteredOut: number;
  flaggedForReview: boolean;
  flagReason?: string;
}

const USD_TO_AUD = 1.55;
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' };

const PRODUCT_SLUGS: Record<string, string> = {
  booster_box: 'booster-box',
  sealed_booster_box: 'booster-box',
  booster_pack: 'booster-pack',
  sealed_case: 'sealed-case',
  complete_set: 'complete-set',
  single_card_raw: '',      // handled differently
  single_card_graded: '',
};

const STRIP_WORDS = new Set([
  'pokemon', 'tcg', 'trading', 'card', 'game', 'sealed', 'factory',
  'booster', 'box', 'pack', 'case', 'set', 'complete', 'graded',
  'english', 'japanese', 'korean', 'chinese', 'the', 'a', 'an',
]);

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Extract all js-price values from PriceCharting HTML
function parsePrices(html: string): number[] {
  const re = /class="[^"]*js-price[^"]*"[^>]*>\s*\$([\d,]+\.?\d*)/g;
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const p = parseFloat(m[1].replace(/,/g, ''));
    if (p > 1) out.push(p);
  }
  return out;
}

// Try fetching a PriceCharting URL and return prices (empty = not found / no prices)
async function tryPriceChartingUrl(url: string): Promise<number[]> {
  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 86400 } } as RequestInit);
    if (!res.ok) return [];
    const prices = parsePrices(await res.text());
    console.log(`[PC] ${url} → ${prices.length} prices`);
    return prices;
  } catch {
    return [];
  }
}

// Build URL slug candidates from fewest to most words,
// starting from the END of the set name (most specific part)
function buildCandidates(searchQuery: string, productSlug: string): string[] {
  const words = searchQuery.split(/\s+/).filter(w => !STRIP_WORDS.has(w.toLowerCase()));
  const candidates: string[] = [];
  // Try from the end: last 2 words, last 3, last 4, full
  for (let n = 2; n <= words.length; n++) {
    const slug = toSlug(words.slice(words.length - n).join(' '));
    candidates.push(`https://www.pricecharting.com/game/pokemon-${slug}/${productSlug}`);
  }
  // Also try full slug without "pokemon-" prefix (some non-Pokemon items)
  const fullSlug = toSlug(words.join(' '));
  candidates.push(`https://www.pricecharting.com/game/${fullSlug}/${productSlug}`);
  return candidates;
}

export async function searchAndExtractComps(
  _asset: AssetInput,
  classification: AssetClassification,
): Promise<CompResult> {
  const productSlug = PRODUCT_SLUGS[classification.format];

  // Try PriceCharting for supported formats
  if (productSlug) {
    // Check hint from classify first
    if (classification.priceChartingPath) {
      const hintUrl = `https://www.pricecharting.com/game/${classification.priceChartingPath}`;
      const prices = await tryPriceChartingUrl(hintUrl);
      if (prices.length > 0) return toResult(prices);
    }

    // Try constructed URL candidates
    const candidates = buildCandidates(classification.searchQuery, productSlug);
    for (const url of candidates) {
      const prices = await tryPriceChartingUrl(url);
      if (prices.length > 0) return toResult(prices);
    }
  }

  console.log(`[search] No PriceCharting data found for "${classification.searchQuery}"`);
  return {
    cleanPrices: [],
    rawListingsFound: 0,
    filteredOut: 0,
    flaggedForReview: true,
    flagReason: 'No pricing data found — manual valuation required',
  };
}

function toResult(usdPrices: number[]): CompResult {
  const audPrices = usdPrices.map(p => Math.round(p * USD_TO_AUD));
  return {
    cleanPrices: audPrices,
    rawListingsFound: usdPrices.length,
    filteredOut: 0,
    flaggedForReview: audPrices.length < 3,
    flagReason: audPrices.length < 3
      ? `Only ${audPrices.length} price${audPrices.length !== 1 ? 's' : ''} found`
      : undefined,
  };
}
