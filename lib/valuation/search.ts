import Anthropic from '@anthropic-ai/sdk';
import type { AssetClassification, AssetInput } from './classify';

export interface CompResult {
  cleanPrices: number[];
  rawListingsFound: number;
  filteredOut: number;
  flaggedForReview: boolean;
  flagReason?: string;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function searchAndExtractComps(
  asset: AssetInput,
  classification: AssetClassification,
): Promise<CompResult> {
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  const systemPrompt = `You are a collectible asset pricing specialist. Today is ${todayStr}.

Find recent SOLD/MARKET prices for the asset below by searching price tracking sites. These sites publish real transaction data as static pages that you can read.

Asset:
- Title: ${asset.title}
- Format: ${classification.format} (${classification.formatDescription})
- Category: ${asset.category}${asset.grade ? `\n- Grade: ${asset.grade}` : ''}${asset.gradingCompany ? ` (${asset.gradingCompany})` : ''}${asset.edition ? `\n- Edition: ${asset.edition}` : ''}

Search strategy — try these in order until you have 3+ prices:
1. PriceCharting: search "site:pricecharting.com ${classification.searchQuery}" — shows historical sold prices for sealed products and cards
2. TCGPlayer: search "site:tcgplayer.com ${classification.searchQuery} market price" — shows market prices for TCG products
3. General sold price search: search "${classification.searchQuery} sold price AUD 2025 OR 2024 OR 2026"

Filtering rules — only include prices matching the exact format:
- Sealed booster box: box prices only, not singles/packs/cases
- Graded card: exact grade + grader match (PSA 10 only if PSA 10 asset)
- Raw card: ungraded only
- Sneakers/watches: exact model, no fakes
- Always exclude: lots, bundles, damaged, fakes

Convert USD to AUD by multiplying by 1.55.

Respond with ONLY this JSON — no text before or after:
{"cleanPrices":[<AUD numbers>],"rawListingsFound":<int>,"filteredOut":<int>,"flaggedForReview":<bool>,"flagReason":<string or null>}`;

  const userMessage = `Find current market prices for: ${asset.title}
Search: ${classification.searchQuery}
Return ONLY the JSON.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  const toolConfig = [{
    type: 'web_search_20250305' as const,
    name: 'web_search' as const,
    max_uses: 3,
  }];

  let response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: systemPrompt,
    tools: toolConfig,
    messages,
  });

  // Server-side tool: Anthropic runs the search automatically.
  // Loop on pause_turn until end_turn — never inject tool results manually.
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

  let parsed: CompResult | null = null;
  try {
    parsed = JSON.parse(text.trim()) as CompResult;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]) as CompResult; } catch { /* fall through */ }
    }
  }

  if (!parsed) {
    return {
      cleanPrices: [],
      rawListingsFound: 0,
      filteredOut: 0,
      flaggedForReview: true,
      flagReason: 'Could not extract pricing data from search results',
    };
  }

  return parsed;
}
