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
// PriceCharting direct fetch
// ---------------------------------------------------------------------------

async function fetchPriceCharting(path: string): Promise<number[]> {
  const url = `https://www.pricecharting.com/game/${path}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; valuation-bot/1.0)' },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    console.log(`[PriceCharting] HTTP ${res.status} for ${path}`);
    return [];
  }

  const html = await res.text();

  // Extract all js-price span values (these are real transaction prices on the page)
  const priceRegex = /<span[^>]*class="[^"]*js-price[^"]*"[^>]*>\s*\$([\d,]+\.?\d*)\s*</g;
  const prices: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = priceRegex.exec(html)) !== null) {
    const p = parseFloat(m[1].replace(/,/g, ''));
    if (p > 0) prices.push(p);
  }

  console.log(`[PriceCharting] ${path} → ${prices.length} prices: ${prices.slice(0, 5).join(', ')}`);
  return prices;
}

// ---------------------------------------------------------------------------
// Web search fallback (Anthropic web_search_20250305)
// ---------------------------------------------------------------------------

async function fetchViaWebSearch(
  asset: AssetInput,
  classification: AssetClassification,
): Promise<CompResult> {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  const systemPrompt = `You are a collectible asset pricing specialist. Today is ${todayStr}.

Find current market prices for the asset below. Search price-tracking sites and return ONLY a JSON object.

Asset:
- Title: ${asset.title}
- Format: ${classification.format} (${classification.formatDescription})
- Category: ${asset.category}${asset.grade ? `\n- Grade: ${asset.grade}` : ''}${asset.gradingCompany ? ` (${asset.gradingCompany})` : ''}

Search: "site:pricecharting.com ${classification.searchQuery}" then "tcgplayer.com ${classification.searchQuery} market price"

If the product is a new/upcoming release, pre-order sold prices are valid market data — include them.
Convert USD to AUD ×1.55.

Respond with ONLY this JSON — no text before or after:
{"cleanPrices":[<AUD numbers>],"rawListingsFound":<int>,"filteredOut":<int>,"flaggedForReview":<bool>,"flagReason":<string or null>}`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: `Find prices for: ${asset.title}. Return ONLY the JSON.` },
  ];

  const toolConfig = [{ type: 'web_search_20250305' as const, name: 'web_search' as const, max_uses: 3 }];

  let response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: systemPrompt,
    tools: toolConfig,
    messages,
  });

  while (response.stop_reason === 'pause_turn') {
    messages.push({ role: 'assistant', content: response.content });
    response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      tools: toolConfig,
      messages,
    });
  }

  const text = response.content.find((b) => b.type === 'text')?.text ?? '';
  console.log(`[webSearch] stop_reason=${response.stop_reason} preview="${text.slice(0, 150)}"`);

  let parsed: CompResult | null = null;
  try { parsed = JSON.parse(text.trim()) as CompResult; } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) try { parsed = JSON.parse(m[0]) as CompResult; } catch { /* fall through */ }
  }

  return parsed ?? {
    cleanPrices: [], rawListingsFound: 0, filteredOut: 0,
    flaggedForReview: true, flagReason: 'Web search returned no structured data',
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function searchAndExtractComps(
  asset: AssetInput,
  classification: AssetClassification,
): Promise<CompResult> {
  // 1. Try PriceCharting direct fetch if we have a path
  if (classification.priceChartingPath) {
    const usdPrices = await fetchPriceCharting(classification.priceChartingPath).catch(() => [] as number[]);
    if (usdPrices.length > 0) {
      const audPrices = usdPrices.map(p => Math.round(p * USD_TO_AUD));
      return {
        cleanPrices: audPrices,
        rawListingsFound: usdPrices.length,
        filteredOut: 0,
        flaggedForReview: audPrices.length < 3,
        flagReason: audPrices.length < 3 ? `Only ${audPrices.length} price${audPrices.length !== 1 ? 's' : ''} found on PriceCharting` : undefined,
      };
    }
    console.log(`[PriceCharting] No prices found for path "${classification.priceChartingPath}" — falling back to web search`);
  }

  // 2. Fall back to web search
  return fetchViaWebSearch(asset, classification);
}
