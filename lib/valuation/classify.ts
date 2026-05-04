import Anthropic from '@anthropic-ai/sdk';

export interface AssetClassification {
  format: string;
  searchQuery: string;
  formatDescription: string;
  priceChartingPath?: string; // e.g. "pokemon-chaos-rising/booster-box"
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
  "searchQuery": "<specific web search query to find this exact product — include set name + product type. For booster_box add '36 packs sealed'; for sealed_case add 'sealed case'; for booster_pack add 'single booster pack'. Keep under 12 words>",
  "formatDescription": "<one sentence describing what this asset is>",
  "priceChartingPath": "<the PriceCharting URL path after /game/ — e.g. 'pokemon-chaos-rising/booster-box' or 'pokemon-base-set/charizard' — use null if unsure>"
}

PriceCharting URL format rules:
- Base URL is https://www.pricecharting.com/game/[path]
- Pokemon sealed: "pokemon-[set-name-hyphenated]/booster-box" or "/sealed-case" or "/booster-pack"
- Pokemon cards: "pokemon-[set-name]/[card-name-hyphenated]"
- Graded cards append the grade: "pokemon-base-set/charizard?q=psa+10" (use null, graded lookup is complex)
- Sneakers: "shoes/[brand-model-hyphenated]"
- Video games: "[console]/[game-name]"
- Set name format: hyphenate, lowercase, no special chars (e.g. "Chaos Rising" → "chaos-rising", "Base Set" → "base-set")
- If you are not confident in the exact path, return null`;

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
