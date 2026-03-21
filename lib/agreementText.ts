export const AGREEMENT_VERSION = 'MCA-v1.0';

export const AGREEMENT_SECTIONS = [
  {
    title: '1. Parties',
    body: `This Master Co-Ownership Agreement ("Agreement") is entered into between Pooled Wealth ABN [INSERT ABN] ("Admin") and the individual identified in the registered account ("Co-Owner"). This Agreement governs all fractional ownership interests the Co-Owner acquires on the Pooled Wealth platform.`,
  },
  {
    title: '2. Admin\'s Role and Limitations',
    body: `Admin acts solely as custodian and manager of physical assets on behalf of co-owners. Admin holds no beneficial ownership interest in any asset. Admin's role is strictly limited to physical custody, insurance, storage, implementing validly passed co-owner votes, and facilitating asset sales. Admin cannot sell, pledge, encumber, or otherwise deal with any asset without a validly passed co-owner vote. Admin acts as agent of the co-owners collectively and not as a principal.`,
  },
  {
    title: '3. Voting and Governance',
    body: `Co-owners have voting rights on all material decisions relating to each asset in which they hold shares, including exit and sale, reserve price, storage and insurance arrangements, and formal disputes. Voting weight is proportional to shares held. Admin cannot override a validly passed vote. Full voting rules are set out in the Platform Voting Policy, which forms part of this Agreement.`,
  },
  {
    title: '4. Custody and Insurance',
    body: `Admin will maintain each asset in secure, appropriate storage and will insure each asset for its full agreed value at all times. Co-owners may request written confirmation of storage location and insurance details for any asset in which they hold shares.`,
  },
  {
    title: '5. Sale and Distribution',
    body: `Assets will only be sold following a validly passed Exit vote at or above the approved reserve price. Sale proceeds will be distributed in the following order: (1) sale transaction costs; (2) return of capital to co-owners pro rata; (3) Admin profit share of 20% of net profit; (4) remaining net profit distributed to co-owners pro rata. Distribution will occur within 14 business days of Admin receiving sale proceeds.`,
  },
  {
    title: '6. Privacy and Co-Owner Register',
    body: `Admin maintains a private register of co-owners for each asset. Co-owner identities are confidential and will not be disclosed to other co-owners. Each co-owner will be provided with their own ownership details and aggregate information about total shares held by others, without identification of those co-owners. Admin will comply with valid legal orders requiring disclosure and will notify affected co-owners where legally permitted before doing so.`,
  },
  {
    title: '7. Transfer of Shares',
    body: `Co-owners may transfer their shares to third parties via the platform subject to the transferee executing a Deed of Accession. No transfer is permitted while an Exit vote is open on the relevant asset. Admin does not guarantee liquidity or the existence of a buyer.`,
  },
  {
    title: '8. Co-Owner Obligations',
    body: `Co-owners have no right to physical possession of any asset during the holding period. Co-owners must keep contact details current. Co-owners agree to be bound by majority vote outcomes on all assets in which they hold shares. Co-owners cannot individually instruct Admin — all instructions must be submitted via the platform voting process.`,
  },
  {
    title: '9. Risk Disclosure',
    body: `Co-Owner acknowledges that: collectible asset values can fall as well as rise; there is no guaranteed market for sale of any asset; the holding period is indefinite until an Exit vote passes; past appreciation of similar assets is not indicative of future performance; and the annual management fee is charged regardless of asset performance.`,
  },
  {
    title: '10. Tax',
    body: `Each co-owner is solely responsible for their own tax obligations arising from ownership and sale of their interest. Admin will provide annual statements of fees charged and distributions made. Admin makes no representation about the tax treatment of co-owners' interests.`,
  },
  {
    title: '11. Dispute Resolution',
    body: `Disputes are first referred to Admin for resolution within 14 days. If unresolved, parties agree to mediation before commencing legal proceedings. This Agreement is governed by the laws of Queensland, Australia. Jurisdiction is the courts of Queensland.`,
  },
  {
    title: '12. Admin Warranties',
    body: `Admin warrants that all assets listed on the platform are authentic, match their descriptions, are free of any security interest or encumbrance, are insured for full agreed value, and will not be commingled with Admin's own property.`,
  },
];

export function getAgreementPlainText(): string {
  return [
    'MASTER CO-OWNERSHIP AGREEMENT',
    `Agreement Version: ${AGREEMENT_VERSION}`,
    '',
    ...AGREEMENT_SECTIONS.flatMap((s) => [s.title, s.body, '']),
  ].join('\n');
}
