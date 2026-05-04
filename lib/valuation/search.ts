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
// Step 1: Use web search to find the right PriceCharting URL
// ---------------------------------------------------------------------------

async function findPriceChartingUrl(searchQuery: string): Promise<string | null> {
  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: `Search for this exact query and return ONLY the first pricecharting.com URL you find — nothing else, just the URL:

site:pricecharting.com ${searchQuery}

Return ONLY the URL like: https://www.pricecharting.com/game/...
If no pricecharting.com URL is found, return: null`,
  }];

  const toolConfig = [{ type: 'web_search_20250305' as const, name: 'web_search' as const, max_uses: 1 }];

  let response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    tools: toolConfig,
    messages,
  });

  while (response.stop_reason === 'pause_turn') {
    messages.push({ role: 'assistant', content: response.content });
    response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      tools: toolConfig,
      messages,
    });
  }

  const text = response.content.find((b) => b.type === 'text')?.text?.trim() ?? '';
  const urlMatch = text.match(/https:\/\/www\.pricecharting\.com\/game\/[^\s"'<>]+/);
  const url = urlMatch?.[0] ?? null;
  console.log(`[findPriceChartingUrl] query="${searchQuery}" → ${url}`);
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
  // Step 1: find the PriceCharting URL via web search
  const pcUrl = await findPriceChartingUrl(classification.searchQuery).catch(() => null);

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
