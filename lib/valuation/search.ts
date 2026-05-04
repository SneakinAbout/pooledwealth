import Anthropic from '@anthropic-ai/sdk';
import type { AssetClassification, AssetInput } from './classify';

export interface CompResult {
  cleanPrices: number[];
  rawListingsFound: number;
  filteredOut: number;
  flaggedForReview: boolean;
  flagReason?: string;
}

const USD_TO_AUD = 1.55;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---------------------------------------------------------------------------
// Step 1: Find PriceCharting URL — try constructed slugs, then web search
// ---------------------------------------------------------------------------

const PRODUCT_TYPE_SLUGS: Record<string, string> = {
  booster_box: 'booster-box',
  sealed_booster_box: 'booster-box',
  booster_pack: 'booster-pack',
  sealed_case: 'sealed-case',
  complete_set: 'complete-set',
};

// Strip common filler words to derive the set name portion
const STRIP_WORDS = new Set([
  'pokemon', 'tcg', 'trading', 'card', 'game', 'sealed', 'factory',
  'booster', 'box', 'pack', 'case', 'set', 'complete', 'graded',
  'english', 'japanese', 'korean', 'chinese',
]);

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function tryFetchUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; valuation-bot/1.0)' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function findPriceChartingUrl(
  searchQuery: string,
  format: string,
  hintPath?: string,
): Promise<string | null> {
  const productSlug = PRODUCT_TYPE_SLUGS[format];
  const base = 'https://www.pricecharting.com/game';

  // 1. Use hint from classify if provided
  if (hintPath) {
    const url = `${base}/${hintPath}`;
    if (await tryFetchUrl(url)) {
      console.log(`[findPriceChartingUrl] hint path works: ${url}`);
      return url;
    }
  }

  // 2. Construct URL candidates from search query words
  if (productSlug) {
    const words = searchQuery.split(/\s+/).filter(w => !STRIP_WORDS.has(w.toLowerCase()));
    // Try progressively shorter set-name slugs (e.g. all words → drop first → drop last)
    const candidates: string[] = [];
    for (let len = words.length; len >= 1; len--) {
      candidates.push(`pokemon-${toSlug(words.slice(0, len).join(' '))}/${productSlug}`);
      if (len !== words.length) {
        candidates.push(`pokemon-${toSlug(words.slice(words.length - len).join(' '))}/${productSlug}`);
      }
    }

    const seen = new Set<string>();
    const unique = candidates.filter(c => !seen.has(c) && seen.add(c));
    for (const path of unique) {
      const url = `${base}/${path}`;
      if (await tryFetchUrl(url)) {
        console.log(`[findPriceChartingUrl] constructed URL works: ${url}`);
        return url;
      }
    }
  }

  // 3. Fall back to web search
  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: `Search: site:pricecharting.com ${searchQuery}
Return ONLY the first pricecharting.com/game/ URL found, or "null" if none.`,
  }];

  const toolConfig = [{ type: 'web_search_20250305' as const, name: 'web_search' as const, max_uses: 1 }];
  let response = await client.messages.create({
    model: 'claude-haiku-4-5', max_tokens: 128, tools: toolConfig, messages,
  });
  while (response.stop_reason === 'pause_turn') {
    messages.push({ role: 'assistant', content: response.content });
    response = await client.messages.create({
      model: 'claude-haiku-4-5', max_tokens: 128, tools: toolConfig, messages,
    });
  }
  const text = response.content.find((b) => b.type === 'text')?.text ?? '';
  const match = text.match(/https:\/\/www\.pricecharting\.com\/game\/[^\s"'<>]+/);
  const url = match?.[0] ?? null;
  console.log(`[findPriceChartingUrl] web search fallback → ${url}`);
  return url;
}

// ---------------------------------------------------------------------------
// Step 2: Fetch PriceCharting page and extract js-price values
// ---------------------------------------------------------------------------

async function fetchPriceCharting(url: string): Promise<number[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; valuation-bot/1.0)' },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    console.log(`[PriceCharting] HTTP ${res.status} for ${url}`);
    return [];
  }

  const html = await res.text();

  const priceRegex = /<span[^>]*class="[^"]*js-price[^"]*"[^>]*>\s*\$([\d,]+\.?\d*)\s*</g;
  const prices: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = priceRegex.exec(html)) !== null) {
    const p = parseFloat(m[1].replace(/,/g, ''));
    if (p > 0) prices.push(p);
  }

  console.log(`[PriceCharting] ${url} → ${prices.length} prices found, sample: ${prices.slice(0, 5).join(', ')}`);
  return prices;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function searchAndExtractComps(
  asset: AssetInput,
  classification: AssetClassification,
): Promise<CompResult> {
  // Step 1: find the PriceCharting URL
  const pcUrl = await findPriceChartingUrl(
    classification.searchQuery,
    classification.format,
    classification.priceChartingPath ?? undefined,
  ).catch(() => null);

  // Step 2: if found, fetch the page and parse prices
  if (pcUrl) {
    const usdPrices = await fetchPriceCharting(pcUrl).catch(() => [] as number[]);
    if (usdPrices.length > 0) {
      const audPrices = usdPrices.map(p => Math.round(p * USD_TO_AUD));
      return {
        cleanPrices: audPrices,
        rawListingsFound: usdPrices.length,
        filteredOut: 0,
        flaggedForReview: audPrices.length < 3,
        flagReason: audPrices.length < 3
          ? `Only ${audPrices.length} price${audPrices.length !== 1 ? 's' : ''} found on PriceCharting`
          : undefined,
      };
    }
  }

  // Step 3: no PriceCharting data — flag for manual review
  console.log(`[search] No PriceCharting data for "${classification.searchQuery}" — flagging for review`);
  return {
    cleanPrices: [],
    rawListingsFound: 0,
    filteredOut: 0,
    flaggedForReview: true,
    flagReason: pcUrl
      ? 'PriceCharting page found but no prices could be extracted'
      : 'No PriceCharting listing found for this asset',
  };
}
