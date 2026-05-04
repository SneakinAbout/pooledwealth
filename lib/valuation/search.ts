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

export async function searchAndExtractComps(
  asset: AssetInput,
  classification: AssetClassification,
): Promise<CompResult> {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  // ── Step 1: search and collect raw price information ──────────────────────
  const searchMessages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: `Today is ${todayStr}. Find current market prices for:

"${asset.title}"
Format: ${classification.formatDescription}

Search for: ${classification.searchQuery} price

Search multiple sources — pricecharting.com, tcgplayer.com, cardmarket.com, buylists, or any retail/resale site.
Pre-order prices and current buy-it-now prices are valid.
Collect every price you find and list them.`,
  }];

  const toolConfig = [{ type: 'web_search_20250305' as const, name: 'web_search' as const, max_uses: 3 }];

  let searchResponse = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    tools: toolConfig,
    messages: searchMessages,
  });

  while (searchResponse.stop_reason === 'pause_turn') {
    searchMessages.push({ role: 'assistant', content: searchResponse.content });
    searchResponse = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      tools: toolConfig,
      messages: searchMessages,
    });
  }

  const searchText = searchResponse.content.find((b) => b.type === 'text')?.text ?? '';
  console.log(`[search] found text (${searchText.length} chars): ${searchText.slice(0, 300)}`);

  if (!searchText || searchText.length < 20) {
    return noData('Search returned no results');
  }

  // ── Step 2: extract structured JSON from the prose response ───────────────
  const extractResponse = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Extract all prices from the text below for "${asset.title}" (${classification.formatDescription}).

Rules:
- Convert USD to AUD by multiplying by ${USD_TO_AUD}
- Include pre-order prices, market prices, buy-it-now prices
- Exclude prices for wrong format (e.g. single cards when asset is a booster box)
- Round to whole numbers

Text:
${searchText}

Return ONLY this JSON (no other text):
{"cleanPrices":[<AUD integers>],"rawListingsFound":<int>,"filteredOut":<int>,"flaggedForReview":<bool>,"flagReason":<string or null>}`,
    }],
  });

  const extractText = extractResponse.content.find((b) => b.type === 'text')?.text ?? '';
  console.log(`[extract] ${extractText.slice(0, 200)}`);

  let parsed: CompResult | null = null;
  try {
    parsed = JSON.parse(extractText.trim()) as CompResult;
  } catch {
    const m = extractText.match(/\{[\s\S]*\}/);
    if (m) try { parsed = JSON.parse(m[0]) as CompResult; } catch { /* fall through */ }
  }

  return parsed ?? noData('Could not parse price data');
}

function noData(reason: string): CompResult {
  return { cleanPrices: [], rawListingsFound: 0, filteredOut: 0, flaggedForReview: true, flagReason: reason };
}
