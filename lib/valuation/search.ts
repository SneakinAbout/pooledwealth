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

  const systemPrompt = `You are a specialist in collectible and alternative asset valuations. Your job is to find eBay sold listings for a specific asset, extract the sold prices, and filter out bad comparables.

Asset being valued:
- Title: ${asset.title}
- Format: ${classification.format} (${classification.formatDescription})
- Category: ${asset.category}
${asset.grade ? `- Grade: ${asset.grade}` : ''}
${asset.gradingCompany ? `- Grading company: ${asset.gradingCompany}` : ''}
${asset.edition ? `- Edition: ${asset.edition}` : ''}

You must EXCLUDE comps that are a DIFFERENT FORMAT than this asset. For example:
- If this is a SEALED BOOSTER BOX, exclude singles, packs, and cases — only include booster box sales
- If this is a PSA 10 graded card, only include the SAME grade from the SAME grader — not PSA 9, not raw
- If this is a RAW/ungraded card, exclude graded copies
- If this is a SINGLE CARD, exclude bundles, lots, complete sets
- Exclude: damaged, altered, fake, replica, for-parts listings
- Exclude: bulk lots, "lot of X" listings unless this asset IS a lot
- Exclude: listings with suspiciously low prices (likely fake/damaged) or suspiciously high (likely error)

After searching and filtering, return ONLY a JSON object with this exact shape:
{
  "cleanPrices": [<array of valid sold prices in AUD, converted from USD at 0.65 if needed>],
  "rawListingsFound": <total number of listings you found before filtering>,
  "filteredOut": <number excluded>,
  "flaggedForReview": <true if fewer than 3 valid comps found>,
  "flagReason": "<optional: why flagged, e.g. 'Only 1 comp found' or 'All results were different format'>"
}`;

  const userMessage = `Search eBay for sold listings of this asset from ${monthLabel} (the prior calendar month: ${priorMonthStart.toDateString()} to ${priorMonthEnd.toDateString()}).

Search query to use: "${classification.searchQuery}" site:ebay.com sold

Search for eBay completed/sold listings. Extract all sold prices, convert to AUD if in USD (use rate 0.65), filter bad comps as instructed, then return the JSON result.`;

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  let response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    tools: [{ type: 'web_search_20260209', name: 'web_search' }],
    messages,
  });

  // web_search_20260209 is a server-side tool — Anthropic executes it automatically.
  // Loop on pause_turn (not tool_use) until end_turn; never inject tool results manually.
  while (response.stop_reason === 'pause_turn') {
    messages.push({ role: 'assistant', content: response.content });
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      tools: [{ type: 'web_search_20260209', name: 'web_search' }],
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
      flagReason: 'Haiku returned no structured data',
    };
  }

  return JSON.parse(jsonMatch[0]) as CompResult;
}
