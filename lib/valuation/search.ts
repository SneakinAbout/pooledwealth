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
    content: `Today is ${todayStr}. Search for: ${classification.searchQuery} buy ebay.com.au pokevault

You have exactly ONE search. Scan EVERY result on the page and list a price for each separate listing or retailer you see. Do not stop after the first one.

Output ONLY a price list — one line per listing, no explanations:
- AUD $355 (eBay AU — seller: cards4u)
- AUD $340 (pokevault.com.au)
- $220 USD (TCGPlayer)
- AUD $380 (eBay AU — seller: ozpokemon)

Include pre-order, market, and buy-it-now prices. If a result shows multiple listings at different prices, list each price separately.`,
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
Format type: ${classification.format}

Rules:
- Convert USD→AUD by multiplying by ${USD_TO_AUD}
- Include pre-order, market, and buy-it-now prices for the EXACT product type
- Round to whole numbers
- Extract ANY matching prices even if the text is incomplete

Format-specific exclusion rules (IMPORTANT):
${classification.format === 'booster_box'
  ? '- booster_box: EXCLUDE "bundle", "blister pack", "Elite Trainer Box", "ETB", "booster bundle", single packs. A booster box has 36 packs and should cost $150–600 AUD. Reject any price under $120 AUD as it is almost certainly the wrong product.'
  : classification.format === 'sealed_case'
  ? '- sealed_case: EXCLUDE individual booster boxes. A sealed case has 6 booster boxes and should cost $900+ AUD.'
  : classification.format === 'booster_pack'
  ? '- booster_pack: EXCLUDE box prices. A single booster pack should cost $5–20 AUD.'
  : '- Exclude prices for clearly different product types (e.g. single cards when asset is a sealed box).'
}

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
