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

  const params = new URLSearchParams({
    'OPERATION-NAME': 'findCompletedItems',
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': appId,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'GLOBAL-ID': globalId,
    'keywords': query,
    'itemFilter(0).name': 'SoldItemsOnly',
    'itemFilter(0).value': 'true',
    'sortOrder': 'EndTimeSoonest',
    'paginationInput.entriesPerPage': '50',
  });

  const res = await fetch(
    `https://svcs.ebay.com/services/search/FindingService/v1?${params}`,
    { next: { revalidate: 0 } },
  );
  if (!res.ok) throw new Error(`eBay API ${globalId} error: ${res.status}`);

  const data = await res.json();
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

export async function searchAndExtractComps(
  _asset: AssetInput,
  classification: AssetClassification,
): Promise<CompResult> {
  // Search eBay AU first, fall back to eBay US if fewer than 3 results
  const [auItems, usItems] = await Promise.all([
    fetchSoldItems(classification.searchQuery, 'EBAY-AU').catch(() => [] as EbayItem[]),
    fetchSoldItems(classification.searchQuery, 'EBAY-ENGL').catch(() => [] as EbayItem[]),
  ]);

  const allItems = [
    ...auItems,
    // Only add US items not already covered by AU
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
