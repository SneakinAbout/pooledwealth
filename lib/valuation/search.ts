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

  const systemPrompt = `You are a collectible asset valuation specialist. Today is ${todayStr}.

Your task: find the current market value of the asset below by searching price tracking and marketplace sites. You need ACTUAL TRANSACTION PRICES — not asking prices or presales.

Asset:
- Title: ${asset.title}
- Format: ${classification.format} (${classification.formatDescription})
- Category: ${asset.category}${asset.grade ? `\n- Grade: ${asset.grade}` : ''}${asset.gradingCompany ? ` (${asset.gradingCompany})` : ''}${asset.edition ? `\n- Edition: ${asset.edition}` : ''}

Search these sources in order (stop once you have 3+ prices):
1. pricecharting.com — search "site:pricecharting.com ${classification.searchQuery}" — shows historical sold prices
2. TCGPlayer market price — search "tcgplayer.com ${classification.searchQuery} market price"
3. Google Shopping sold data — search "${classification.searchQuery} sealed booster box sold price AUD"

Filtering rules:
- Only include prices for the EXACT same product format (sealed box ≠ singles ≠ cases)
- Convert USD to AUD by multiplying by 1.55
- Exclude obvious outliers (damaged, fake, "for parts")

You MUST respond with ONLY this JSON — zero words before or after:
{"cleanPrices":[<AUD numbers>],"rawListingsFound":<int>,"filteredOut":<int>,"flaggedForReview":<bool>,"flagReason":<string or null>}`;

  const userMessage = `Find market prices for: ${asset.title}
Search term: ${classification.searchQuery}

Search pricecharting.com first, then TCGPlayer, then general price searches. Return ONLY the JSON.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  const toolConfig = [{ type: 'web_search_20250305' as const, name: 'web_search' as const, max_uses: 3 }];

  let response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1500,
    system: systemPrompt,
    tools: toolConfig,
    messages,
  });

  while (response.stop_reason === 'pause_turn') {
    messages.push({ role: 'assistant', content: response.content });
    response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,
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
      try {
        parsed = JSON.parse(jsonMatch[0]) as CompResult;
      } catch {
        // fall through
      }
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
