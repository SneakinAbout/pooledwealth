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

  const systemPrompt = `You are a collectible asset valuation specialist. Search eBay sold listings and return a JSON result.

Asset: ${asset.title}
Format: ${classification.format} (${classification.formatDescription})
Category: ${asset.category}${asset.grade ? `\nGrade: ${asset.grade}` : ''}${asset.gradingCompany ? ` (${asset.gradingCompany})` : ''}${asset.edition ? `\nEdition: ${asset.edition}` : ''}

FILTERING RULES — only include comps that match this exact format:
- Graded card: same grade + same grader only (PSA 10 ≠ PSA 9)
- Raw card: ungraded only, exclude graded
- Booster box: sealed boxes only, exclude singles/packs/cases
- Sealed case: full cases only
- Sneakers/watches: same model, exclude fakes/replicas
- Always exclude: lots, bundles, damaged, altered, "for parts"

Return ONLY this JSON (no prose):
{"cleanPrices":[<AUD prices, convert USD×0.65>],"rawListingsFound":<int>,"filteredOut":<int>,"flaggedForReview":<bool>,"flagReason":"<string or null>"}`;

  const userMessage = `Search eBay completed/sold listings for: "${classification.searchQuery}" sold ${monthLabel} (${priorMonthStart.toDateString()} – ${priorMonthEnd.toDateString()}). Return the JSON.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  // web_search_20250305 works on Haiku 4.5 (much cheaper than Sonnet).
  // It's a server-side tool — Anthropic executes it automatically; loop on pause_turn.
  const toolConfig = [{ type: 'web_search_20250305' as const, name: 'web_search', max_uses: 1 }];

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
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return {
      cleanPrices: [],
      rawListingsFound: 0,
      filteredOut: 0,
      flaggedForReview: true,
      flagReason: 'No structured data returned',
    };
  }

  return JSON.parse(jsonMatch[0]) as CompResult;
}
