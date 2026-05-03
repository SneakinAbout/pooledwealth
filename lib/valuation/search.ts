import type { AssetClassification, AssetInput } from './classify';

export interface CompResult {
  cleanPrices: number[];
  rawListingsFound: number;
  filteredOut: number;
  flaggedForReview: boolean;
  flagReason?: string;
}

const USD_TO_AUD = 1.55;

// Bad-comp keywords that always disqualify a listing
const GLOBAL_EXCLUDES = [
  'damaged', 'fake', 'replica', 'for parts', 'not working', 'incomplete',
  'altered', 'restored', 'reprint', 'custom', 'proxy',
];

// Format-specific inclusion/exclusion rules
const FORMAT_RULES: Record<string, { mustInclude?: string[]; mustExclude?: string[] }> = {
  booster_box:        { mustInclude: ['box'], mustExclude: ['case', ' pack ', 'single', 'lot of', 'bundle'] },
  sealed_booster_box: { mustInclude: ['box'], mustExclude: ['case', ' pack ', 'single', 'lot of', 'bundle'] },
  booster_pack:       { mustInclude: ['pack'], mustExclude: ['box', 'case', 'lot of', 'bundle'] },
  sealed_case:        { mustInclude: ['case'], mustExclude: ['single', 'pack', 'lot of'] },
  complete_set:       { mustExclude: ['incomplete', 'partial'] },
  single_card_graded: { mustExclude: ['lot', 'bundle', 'case', 'box'] },
  single_card_raw:    { mustExclude: ['psa', 'bgs', 'cgc', 'sgc', 'ace', 'lot', 'bundle', 'case', 'box'] },
  sports_card_graded: { mustExclude: ['lot', 'bundle', 'case', 'box'] },
  sports_card_raw:    { mustExclude: ['psa', 'bgs', 'cgc', 'sgc', 'lot', 'bundle'] },
  sneakers:           { mustExclude: ['fake', 'replica', 'used', 'worn', 'display', 'lace'] },
  watch:              { mustExclude: ['parts', 'repair', 'broken', 'replica', 'movement only'] },
};

interface EbayItem {
  title: string;
  priceAUD: number;
  endTime: string;
}

async function fetchSoldItems(query: string, globalId: string): Promise<EbayItem[]> {
  const appId = process.env.EBAY_APP_ID;
  if (!appId) throw new Error('EBAY_APP_ID not configured');

  // Build URL manually — URLSearchParams encodes ( ) to %28 %29 which eBay rejects
  const url =
    `https://svcs.ebay.com/services/search/FindingService/v1` +
    `?OPERATION-NAME=findCompletedItems` +
    `&SERVICE-VERSION=1.0.0` +
    `&SECURITY-APPNAME=${encodeURIComponent(appId)}` +
    `&RESPONSE-DATA-FORMAT=JSON` +
    `&GLOBAL-ID=${globalId}` +
    `&keywords=${encodeURIComponent(query)}` +
    `&itemFilter(0).name=SoldItemsOnly` +
    `&itemFilter(0).value=true` +
    `&sortOrder=EndTimeSoonest` +
    `&paginationInput.entriesPerPage=50`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`eBay API ${globalId} error: ${res.status}`);

  const data = await res.json();
  const ack = data?.findCompletedItemsResponse?.[0]?.ack?.[0];
  const totalEntries = data?.findCompletedItemsResponse?.[0]?.paginationOutput?.[0]?.totalEntries?.[0];
  const errorMsg = data?.findCompletedItemsResponse?.[0]?.errorMessage?.[0]?.error?.[0]?.message?.[0];
  console.log(`[eBay ${globalId}] query="${query}" ack=${ack} total=${totalEntries}${errorMsg ? ` error=${errorMsg}` : ''}`);

  const items: unknown[] = data?.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item ?? [];
  const isAU = globalId === 'EBAY-AU';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return items.flatMap((item: any) => {
    const rawPrice = parseFloat(item?.sellingStatus?.[0]?.convertedCurrentPrice?.[0]?.['__value__'] ?? '0');
    if (!rawPrice) return [];
    const currency: string = item?.sellingStatus?.[0]?.convertedCurrentPrice?.[0]?.['@currencyId'] ?? '';
    const priceAUD = (currency === 'USD' || !isAU) ? rawPrice * USD_TO_AUD : rawPrice;
    return [{
      title: (item?.title?.[0] as string) ?? '',
      priceAUD,
      endTime: (item?.listingInfo?.[0]?.endTime?.[0] as string) ?? '',
    }];
  });
}

function filterComps(items: EbayItem[], format: string): { clean: EbayItem[]; excluded: number } {
  const rules = FORMAT_RULES[format] ?? {};
  let excluded = 0;

  const clean = items.filter((item) => {
    const t = item.title.toLowerCase();

    if (GLOBAL_EXCLUDES.some((kw) => t.includes(kw))) { excluded++; return false; }
    if (rules.mustExclude?.some((kw) => t.includes(kw))) { excluded++; return false; }
    if (rules.mustInclude && !rules.mustInclude.some((kw) => t.includes(kw))) { excluded++; return false; }
    if (item.priceAUD < 1 || item.priceAUD > 1_000_000) { excluded++; return false; }

    return true;
  });

  return { clean, excluded };
}

// Strip filler words and return the N most distinctive tokens for a fallback query
function trimQuery(query: string, maxWords = 4): string {
  const fillers = new Set(['sealed', 'factory', 'tcg', 'trading', 'card', 'game', 'the', 'a', 'an', 'graded', 'raw', 'ungraded']);
  const words = query.split(/\s+/).filter(w => !fillers.has(w.toLowerCase()));
  return words.slice(0, maxWords).join(' ');
}

export async function searchAndExtractComps(
  _asset: AssetInput,
  classification: AssetClassification,
): Promise<CompResult> {
  const query = classification.searchQuery;

  // Search eBay AU + US in parallel with full query
  let [auItems, usItems] = await Promise.all([
    fetchSoldItems(query, 'EBAY-AU').catch(() => [] as EbayItem[]),
    fetchSoldItems(query, 'EBAY-US').catch(() => [] as EbayItem[]),
  ]);

  // If full query returns nothing, retry with a shorter 4-word version
  if (auItems.length === 0 && usItems.length === 0) {
    const short = trimQuery(query);
    if (short !== query) {
      console.log(`[eBay] Full query returned 0 — retrying with shortened query: "${short}"`);
      [auItems, usItems] = await Promise.all([
        fetchSoldItems(short, 'EBAY-AU').catch(() => [] as EbayItem[]),
        fetchSoldItems(short, 'EBAY-US').catch(() => [] as EbayItem[]),
      ]);
    }
  }

  const allItems = [
    ...auItems,
    ...(auItems.length < 5 ? usItems : []),
  ];

  const rawListingsFound = allItems.length;
  const { clean, excluded } = filterComps(allItems, classification.format);

  return {
    cleanPrices: clean.map((i) => Math.round(i.priceAUD)),
    rawListingsFound,
    filteredOut: excluded,
    flaggedForReview: clean.length < 3,
    flagReason: clean.length < 3
      ? `Only ${clean.length} comparable sale${clean.length !== 1 ? 's' : ''} found after filtering`
      : undefined,
  };
}
