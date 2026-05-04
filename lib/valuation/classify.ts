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

Rules for searchQuery — this is used for a WEB SEARCH (Google), not eBay API, so be specific:
- Include enough detail to find the exact product on price-tracking sites like PriceCharting or TCGPlayer
- Include the product format so results match the right item type
- For Pokemon sealed products: include set name + product type (e.g. "Pokemon Mega Evolution Chaos Rising booster box")
- For graded cards: include grader + grade + card name + set (e.g. "PSA 10 Charizard Base Set booster box")
- For sneakers: include brand + full model name (e.g. "Nike Air Jordan 1 Retro High OG Chicago")
- For watches: include brand + model + reference number (e.g. "Rolex Submariner Date 116610LN")
- DO include format words like "booster box", "sealed case", "graded" — they help find the right product page
- Keep under 10 words total`;

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
