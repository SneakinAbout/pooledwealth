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
  const priorMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const priorMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const monthLabel = priorMonthStart.toLocaleString('en-AU', { month: 'long', year: 'numeric' });

  const systemPrompt = `You are a collectible asset valuation specialist. Your task:
1. Search for recent SOLD prices of the asset described below on eBay (ebay.com or ebay.com.au).
2. Extract every sold price you find, converting USD to AUD using rate 0.65 if needed.
3. Filter out bad comps per the rules below.
4. Respond with ONLY a valid JSON object — no explanation, no prose, nothing else before or after.

Asset being valued:
- Title: ${asset.title}
- Format: ${classification.format} (${classification.formatDescription})
- Category: ${asset.category}${asset.grade ? `\n- Grade: ${asset.grade}` : ''}${asset.gradingCompany ? ` (${asset.gradingCompany})` : ''}${asset.edition ? `\n- Edition: ${asset.edition}` : ''}

Filtering rules — ONLY include comps matching this exact format:
- Graded card: same grade + same grader (PSA 10 ≠ PSA 9, PSA ≠ BGS)
- Raw/ungraded card: exclude any graded copies
- Sealed booster box: sealed boxes only — exclude singles, packs, cases, opened boxes
- Sealed case: full cases only
- Sneakers/watches: same model and condition, exclude fakes
- Always exclude: lots, bundles, damaged, altered, "for parts", suspicious outliers

Required JSON format (output NOTHING else):
{"cleanPrices":[<numbers in AUD>],"rawListingsFound":<int>,"filteredOut":<int>,"flaggedForReview":<bool>,"flagReason":<string or null>}`;

  const userMessage = `Search eBay sold/completed listings for this asset and return the JSON valuation data.

Asset: ${asset.title}
Suggested search: ${classification.searchQuery} ebay sold completed listings ${monthLabel}

Search eBay (try both ebay.com.au and ebay.com) for recently sold listings of this exact item. Extract all sold prices, filter per the rules, then output ONLY the JSON — no other text.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  const toolConfig = [{ type: 'web_search_20250305' as const, name: 'web_search' as const, max_uses: 2 }];

  let response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1500,
    system: systemPrompt,
    tools: toolConfig,
    messages,
  });

  // Server-side tool: loop on pause_turn until end_turn — no manual tool results needed.
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

  // Try strict JSON parse first, then fall back to regex extraction
  let parsed: CompResult | null = null;
  try {
    parsed = JSON.parse(text.trim()) as CompResult;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]) as CompResult;
      } catch {
        // fall through to null
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
