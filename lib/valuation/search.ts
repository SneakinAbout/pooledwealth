import type { AssetClassification, AssetInput } from './classify';

export interface CompResult {
  cleanPrices: number[];
  rawListingsFound: number;
  filteredOut: number;
  flaggedForReview: boolean;
  flagReason?: string;
}

const EBAY_TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const EBAY_BROWSE_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

// ── eBay OAuth (client credentials — no user login required) ─────────────────
async function getEbayToken(): Promise<string> {
  const clientId = process.env.EBAY_APP_ID;
  const clientSecret = process.env.EBAY_CERT_ID;
  if (!clientId || !clientSecret) throw new Error('EBAY_APP_ID or EBAY_CERT_ID not set');

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(EBAY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay token ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json() as { access_token: string };
  return json.access_token;
}

// ── Search both AU and US marketplaces ───────────────────────────────────────
interface EbayItem {
  title: string;
  price: { value: string; currency: string };
  condition?: string;
  buyingOptions?: string[];
}

interface EbaySearchResult {
  itemSummaries?: EbayItem[];
  total?: number;
}

async function searchMarketplace(
  token: string,
  query: string,
  marketplaceId: 'EBAY_AU' | 'EBAY_US',
): Promise<EbayItem[]> {
  const params = new URLSearchParams({
    q: query,
    filter: 'buyingOptions:{FIXED_PRICE}',
    limit: '50',
    sort: 'price',
  });

  const res = await fetch(`${EBAY_BROWSE_URL}?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': marketplaceId,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[ebay:${marketplaceId}] ${res.status}: ${text.slice(0, 200)}`);
    return [];
  }

  const data = await res.json() as EbaySearchResult;
  return data.itemSummaries ?? [];
}

// ── Price filtering — strip wrong sub-products ───────────────────────────────
const USD_TO_AUD = 1.55;

function toAUD(item: EbayItem): number {
  const raw = parseFloat(item.price.value);
  return item.price.currency === 'USD' ? Math.round(raw * USD_TO_AUD) : Math.round(raw);
}

function isRelevant(item: EbayItem, format: string): boolean {
  const t = item.title.toLowerCase();

  if (format === 'booster_box') {
    if (t.includes('elite trainer') || t.includes(' etb')) return false;
    if (t.includes('booster bundle') || t.includes('blister')) return false;
    if (t.includes('single') || t.includes(' pack ') && !t.includes('pack box')) return false;
  }

  if (format === 'booster_pack') {
    if (t.includes('box') || t.includes('case')) return false;
  }

  if (format === 'sealed_case') {
    if (!t.includes('case') && !t.includes('display')) return false;
  }

  return true;
}

function priceInRange(aud: number, format: string): boolean {
  if (format === 'booster_box')  return aud >= 120 && aud <= 800;
  if (format === 'sealed_case')  return aud >= 800;
  if (format === 'booster_pack') return aud >= 4 && aud <= 60;
  return aud > 0;
}

// ── Main entry point ─────────────────────────────────────────────────────────
export async function searchAndExtractComps(
  _asset: AssetInput,
  classification: AssetClassification,
): Promise<CompResult> {
  if (!process.env.EBAY_APP_ID || !process.env.EBAY_CERT_ID) {
    return noData('eBay credentials not configured');
  }

  try {
    const token = await getEbayToken();

    // Search AU + US in parallel
    const [auItems, usItems] = await Promise.all([
      searchMarketplace(token, classification.searchQuery, 'EBAY_AU'),
      searchMarketplace(token, classification.searchQuery, 'EBAY_US'),
    ]);

    const allItems = [...auItems, ...usItems];
    console.log(`[ebay] ${auItems.length} AU + ${usItems.length} US = ${allItems.length} raw items`);
    allItems.slice(0, 8).forEach((item, i) =>
      console.log(`  [${i}] ${item.title} — ${item.price.currency} ${item.price.value}`)
    );

    const rawListingsFound = allItems.length;

    const cleanPrices: number[] = [];
    let filteredOut = 0;

    for (const item of allItems) {
      const aud = toAUD(item);
      if (!isRelevant(item, classification.format) || !priceInRange(aud, classification.format)) {
        filteredOut++;
        continue;
      }
      cleanPrices.push(aud);
    }

    console.log(`[ebay] ${cleanPrices.length} clean prices: ${cleanPrices.join(', ')}`);

    const tooFew = cleanPrices.length < 2;
    return {
      cleanPrices,
      rawListingsFound,
      filteredOut,
      flaggedForReview: tooFew,
      flagReason: tooFew
        ? `Only ${cleanPrices.length} comparable listing${cleanPrices.length === 1 ? '' : 's'} found`
        : undefined,
    };
  } catch (err) {
    console.error('[ebay] error:', err);
    return noData(err instanceof Error ? err.message : 'eBay search failed');
  }
}

function noData(reason: string): CompResult {
  return { cleanPrices: [], rawListingsFound: 0, filteredOut: 0, flaggedForReview: true, flagReason: reason };
}
