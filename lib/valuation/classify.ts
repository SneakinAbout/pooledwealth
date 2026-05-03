import Anthropic from '@anthropic-ai/sdk';

export interface AssetClassification {
  format: string;
  searchQuery: string;
  formatDescription: string;
}

export interface AssetInput {
  id: string;
  title: string;
  description: string;
  category: string;
  grade?: string | null;
  edition?: string | null;
  gradingCompany?: string | null;
  certNumber?: string | null;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function classifyAsset(asset: AssetInput): Promise<AssetClassification> {
  const prompt = `You are an expert asset valuation specialist. Analyse this investment asset and return a JSON classification.

Asset details:
- Title: ${asset.title}
- Description: ${asset.description}
- Category: ${asset.category}
${asset.grade ? `- Grade: ${asset.grade}` : ''}
${asset.edition ? `- Edition: ${asset.edition}` : ''}
${asset.gradingCompany ? `- Grading company: ${asset.gradingCompany}` : ''}
${asset.certNumber ? `- Cert number: ${asset.certNumber}` : ''}

Return ONLY valid JSON in this exact shape:
{
  "format": "<one of: single_card_graded | single_card_raw | booster_pack | booster_box | sealed_case | complete_set | sealed_product | memorabilia | collectible_figure | sports_card_graded | sports_card_raw | comic_book | sneakers | watch | art | wine | whisky | other>",
  "searchQuery": "<the exact eBay search query to find comparable sold listings — be specific, include grade/company/edition if relevant, keep under 80 chars>",
  "formatDescription": "<one sentence describing what this asset is, e.g. 'PSA 10 graded Pokemon card' or 'factory sealed booster box'>"
}

Rules for searchQuery:
- For graded cards: include grader + grade (e.g. "PSA 10 Charizard Base Set Unlimited")
- For sealed products: include "sealed" and the exact product type (e.g. "sealed Base Set Booster Box")
- For cases: include "sealed case" (e.g. "Pokemon Base Set Sealed Case")
- For raw/ungraded cards: include "ungraded" or "raw" to exclude graded results
- For sneakers: include size if known, brand, and model
- For watches: include brand, model reference, and condition`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Haiku returned no JSON for asset "${asset.title}": ${text}`);

  return JSON.parse(jsonMatch[0]) as AssetClassification;
}
