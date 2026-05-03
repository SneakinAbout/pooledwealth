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
  const todayStr = now.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  const systemPrompt = `You are a collectible asset valuation specialist. Today is ${todayStr}.

Your task is to find ACTUAL COMPLETED SALE PRICES for the asset below — not asking prices, not presales, not current listings. Real transactions that have already closed.

Asset being valued:
- Title: ${asset.title}
- Format: ${classification.format} (${classification.formatDescription})
- Category: ${asset.category}${asset.grade ? `\n- Grade: ${asset.grade}` : ''}${asset.gradingCompany ? ` (${asset.gradingCompany})` : ''}${asset.edition ? `\n- Edition: ${asset.edition}` : ''}

Search strategy — try these sources in order:
1. eBay Australia completed/sold listings: search "ebay.com.au ${classification.searchQuery} sold completed"
2. eBay US completed listings: search "ebay.com ${classification.searchQuery} completed sold"
3. Price history sites: search "${classification.searchQuery} sold price worthpoint OR pricecharting OR cardmarket"

Filtering rules — ONLY include comps matching this exact format:
- Sealed booster box: sealed boxes only — exclude singles, packs, cases, opened
- Graded card: same grade + same grader exactly (PSA 10 ≠ PSA 9)
- Raw card: ungraded copies only
- Always exclude: presales, lots, bundles, damaged, fake, "for parts"
- Convert USD to AUD at rate ×1.55 (AUD is weaker than USD)

You MUST respond with ONLY this JSON object — zero prose before or after it:
{"cleanPrices":[<AUD numbers>],"rawListingsFound":<int>,"filteredOut":<int>,"flaggedForReview":<bool>,"flagReason":<string or null>}

If you find zero sold prices after searching, still return the JSON with empty cleanPrices and a flagReason explaining what you found.`;

  const userMessage = `Find completed sale prices for: ${asset.title}
Search term: ${classification.searchQuery}
Target period: recent sales (ideally ${monthLabel}, but use any recent sales if that month has few results)

Search now and return ONLY the JSON.`;

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
