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
    content: `Today is ${todayStr}. Search for: ${classification.searchQuery} price buy

You have exactly ONE search. After it completes, output ONLY a price list — no explanations, no "I need to search more", no commentary.

Format every price found like:
- $245.00 (TCGPlayer)
- AUD $380 (eBay AU)

Include ALL prices: pre-order, market, buy-it-now, sealed box prices. If results are imperfect, still list every price you see.`,
  }];

  const toolConfig = [{ type: 'web_search_20250305' as const, name: 'web_search' as const, max_uses: 1 }];

  let searchResponse = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    tools: toolConfig,
    messages: searchMessages,
  });

  // Collect text from ALL turns (intermediate + final) so we don't miss prices
  // that appear before the model's concluding statement
  const allTextParts: string[] = [];

  while (searchResponse.stop_reason === 'pause_turn') {
    for (const block of searchResponse.content) {
      if (block.type === 'text' && block.text.trim()) allTextParts.push(block.text);
    }
    searchMessages.push({ role: 'assistant', content: searchResponse.content });
    searchResponse = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      tools: toolConfig,
      messages: searchMessages,
    });
  }

  for (const block of searchResponse.content) {
    if (block.type === 'text' && block.text.trim()) allTextParts.push(block.text);
  }

  const searchText = allTextParts.join('\n\n');
  console.log(`[search] found text (${searchText.length} chars): ${searchText.slice(0, 400)}`);

  if (!searchText || searchText.length < 10) {
    return noData('Search returned no results');
  }

  // ── Step 2: extract structured JSON from the prose response ───────────────
  const extractResponse = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: `Extract prices from the text below. Asset: "${asset.title}" (${classification.formatDescription}).

Rules:
- Convert USD→AUD by multiplying by ${USD_TO_AUD}
- Include pre-order, market, buy-it-now, and sealed product prices
- Exclude obviously wrong formats (e.g. single cards when looking for a booster box)
- Round to whole numbers
- Extract ANY prices present even if the text is incomplete or imperfect

Text:
${searchText}

Return ONLY this JSON (no markdown, no explanation):
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
