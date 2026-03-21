export const SUPPLEMENT_VERSION = 'ACS-v1.0';

export interface SupplementData {
  assetName: string;
  edition?: string | null;
  grade?: string | null;
  gradingCompany?: string | null;
  certNumber?: string | null;
  acquisitionDate?: string | null;
  acquisitionPrice?: number | null;
  totalShares: number;
  sharesPurchased: number;
  sharePrice: number;
  ownershipPercentage: number;
  roundCloseDate: string;
  coOwnerName: string;
}

function fmtCurrency(value?: number | null): string {
  if (value == null) return '[NOT SPECIFIED]';
  return `$${value.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value?: string | null): string {
  if (!value) return '[NOT SPECIFIED]';
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function orBlank(value?: string | null, fallback = '[NOT SPECIFIED]'): string {
  return value?.trim() || fallback;
}

export function generateSupplementText(data: SupplementData): string {
  const {
    assetName,
    edition,
    grade,
    gradingCompany,
    certNumber,
    acquisitionDate,
    acquisitionPrice,
    totalShares,
    sharesPurchased,
    sharePrice,
    ownershipPercentage,
    roundCloseDate,
    coOwnerName,
  } = data;

  const assetDesc = [
    assetName,
    edition ? edition : null,
    grade ? grade : null,
  ]
    .filter(Boolean)
    .join(', ');

  return `ASSET CO-OWNERSHIP SUPPLEMENT
Version ${SUPPLEMENT_VERSION}

1. ASSET IDENTIFICATION

This Asset Co-Ownership Supplement ("Supplement") forms part of the Master Co-Ownership Agreement between Pooled Wealth ABN [INSERT ABN] ("Admin") and ${coOwnerName} ("Co-Owner"). This Supplement relates to the following specific asset: ${assetDesc}, graded by ${orBlank(gradingCompany)}, certificate number ${orBlank(certNumber)}, acquired by Admin on ${fmtDate(acquisitionDate)} for ${fmtCurrency(acquisitionPrice)}.

2. CO-OWNER'S INTEREST

Co-Owner is purchasing ${sharesPurchased.toLocaleString()} shares of ${totalShares.toLocaleString()} total shares issued for this asset, representing a ${ownershipPercentage.toFixed(4)}% undivided ownership interest as tenant in common with other co-owners. This interest is held directly by Co-Owner as their own property.

3. FEES APPLICABLE TO THIS ASSET

Annual management fee: 5% per annum of the acquisition price, charged monthly, covering all costs of custody, insurance, storage, and platform administration. No additional storage or insurance fees will be charged. Profit share: 20% of net profit on sale, calculated as gross sale proceeds minus acquisition cost minus cumulative management fees paid over the holding period, with the remainder distributed to co-owners pro rata.

4. PENDING STATUS

This Supplement is binding on Co-Owner from the date of signing. However it will remain in PENDING status until the investment round closes on ${fmtDate(roundCloseDate)}. The final ownership register, including total number of co-owners and their respective share allocations, will be confirmed and provided to Co-Owner within 5 business days of the round closing. A Finalised version of this Supplement will be issued at that time.

5. VOTING RIGHTS

Co-Owner holds voting rights on this asset proportional to their ownership percentage as set out above. Voting rights are governed by the Platform Voting Policy forming part of the Master Co-Ownership Agreement.

6. RISK ACKNOWLEDGEMENT

Co-Owner acknowledges having read and understood the risk disclosures in the Master Co-Ownership Agreement and confirms those disclosures apply to this specific asset.`;
}
