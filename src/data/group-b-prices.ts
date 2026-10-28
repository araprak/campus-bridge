import { APARTMENTS, ELECTRICITY_PROVIDERS } from './local-options.ts';
import { INTERNET_PROVIDERS } from './service-options.ts';
import { CELLULAR_PROVIDERS } from './cellular-options.ts';

export type PriceRange = { lowCents: number | null; highCents: number | null; sourceUrl: string; checkedOn: string | null; note: string };
export type FloorPlanPrice = PriceRange & { id: string; name: string; basis: 'unit' | 'person' };
const unknown = (sourceUrl: string, note = 'No verified public amount recorded. Ask for a written quote for your floor plan, lease dates and unit.'): PriceRange => ({ lowCents: null, highCents: null, sourceUrl, checkedOn: null, note });
/** Group B supplement only. Missing quotes are deliberately not inferred from a ZIP or a directory listing. */
export const GROUP_B_APARTMENT_PRICES = APARTMENTS.map(community => ({
  communityId: community.id, sourceUrl: community.url,
  floorPlans: [{ ...unknown(community.url), id: 'quote', name: 'My floor plan — quote needed', basis: 'unit' as const }] as FloorPlanPrice[],
  requiredMonthlyFees: unknown(community.url), application: unknown(community.url), admin: unknown(community.url), deposit: unknown(community.url),
}));
// A current advertised base rent is a planning reference, not a January availability promise.
const northside = GROUP_B_APARTMENT_PRICES.find(row => row.communityId === 'northside')!;
northside.floorPlans.push({ id: 'supernova-deluxe', name: 'Studio Supernova Deluxe · unfurnished', basis: 'unit', lowCents: 169600, highCents: 169600, sourceUrl: 'https://www.liveatnorthside.com/floor-plans/', checkedOn: '2026-10-27', note: 'Published base rent for the academic term, listed available now when checked. January availability, lease term and total required fees must be quoted. Other listed plans start August 2027 and are not used for a spring estimate.' });
northside.requiredMonthlyFees = { ...unknown('https://www.liveatnorthside.com/floor-plans/', 'Published required monthly fees vary $32.68–$309.08 by lease/plan. Ask which are already included in your total; do not add them twice.'), checkedOn: '2026-10-27' };
northside.application = { lowCents: 5000, highCents: 5000, sourceUrl: 'https://www.liveatnorthside.com/floor-plans/', checkedOn: '2026-10-27', note: 'Standard application fee. A limited offer waives application/admin fees on selected furnished plans; confirm your eligibility before overriding to zero.' };
northside.admin = { lowCents: 20000, highCents: 20000, sourceUrl: 'https://www.liveatnorthside.com/floor-plans/', checkedOn: '2026-10-27', note: 'Standard administrative fee; selected furnished plans advertise a waiver. Activity/move-in charges and other fees may also apply.' };
export type ProviderPrice = PriceRange & { id: string; name: string; upfrontCents?: number };
export const GROUP_B_ELECTRICITY_PRICES: ProviderPrice[] = ELECTRICITY_PROVIDERS.map(provider => ({ id: provider.id, name: provider.name, ...unknown(provider.url, 'Usage, service address, delivery charges and the Electricity Facts Label determine the bill. No address-independent typical bill is asserted.') }));
export const GROUP_B_INTERNET_PRICES: ProviderPrice[] = INTERNET_PROVIDERS.map(provider => ({ id: provider.id, name: provider.name, ...unknown(provider.sourceUrl) }));
Object.assign(GROUP_B_INTERNET_PRICES.find(row => row.id === 'att')!, { lowCents: 5000, highCents: 6000, sourceUrl: 'https://www.att.com/internet/fiber/', checkedOn: '2026-10-27', note: 'Internet 300 advertised $50/month with eligible AutoPay and paperless billing; $60 before that discount. Taxes/fees extra; address eligibility and other charges unconfirmed. Not an all-in upper bound.' });
Object.assign(GROUP_B_INTERNET_PRICES.find(row => row.id === 'spectrum')!, { lowCents: 3000, highCents: 4000, sourceUrl: 'https://www.spectrum.com/internet', checkedOn: '2026-10-27', note: 'Internet 100 advertised $30/month for one year for eligible new customers, plus $10 if Advanced WiFi is chosen. Activation/taxes extra; later standard rate and exact-address eligibility must be checked. Not an all-in upper bound.' });
export const GROUP_B_PHONE_PRICES: ProviderPrice[] = CELLULAR_PROVIDERS.map(provider => ({ id: provider.id, name: provider.name, ...unknown(provider.url) }));
Object.assign(GROUP_B_PHONE_PRICES.find(row => row.id === 'mint')!, { lowCents: 1500, highCents: 2500, upfrontCents: 4500, sourceUrl: 'https://www.mintmobile.com/plans/', checkedOn: '2026-10-27', note: '6GB three-month plan: new-customer $45 upfront ($15/month equivalent) for first three months; page lists $25/month regular price. Taxes/fees extra and later prepayment differs. Check compatible unlocked phone and coverage.' });
