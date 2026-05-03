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
- Maximum 5 words — eBay AND-searches every word, so fewer is better
- Use only the most distinctive identifiers: set name, product type, grade/grader if relevant
- For graded cards: "PSA 10 Charizard Base Set" (grader + grade + card + set, no filler)
- For sealed products: "Chaos Rising booster box" — skip "sealed", "TCG", "trading card game"
- For cases: "Base Set sealed case"
- For raw cards: "Charizard Base Set raw" — include "raw" to distinguish from graded
- For sneakers: brand + model only (e.g. "Nike Dunk Low Panda")
- For watches: brand + model ref (e.g. "Rolex Submariner 116610")`;

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
