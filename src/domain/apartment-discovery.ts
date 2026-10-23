import { APARTMENTS, type ApartmentOption } from '../data/local-options.ts';

import { housingZipCenter } from '../data/housing-zip-centers.ts';

export const HOUSING_RADII = [1, 3, 5, 10, 15] as const;
export type HousingRadius = typeof HOUSING_RADII[number];
export type HousingSort = 'distance' | 'name';
export type HousingFilters = { radius: HousingRadius; search: string; sort: HousingSort; zip?: string };
export const DEFAULT_HOUSING_FILTERS: Readonly<HousingFilters> = Object.freeze({ radius: 10, search: '', sort: 'distance' });
export const HOUSING_SEARCH_MAX_LENGTH = 120;
export const COMPARISON_LIMIT = 3;
export const COMPARISON_SESSION_KEYS = {
  demo: 'campusbridge.housing.compare.v1.demo',
  // Legacy shared key: discard its contents because their owner is unknown.
  account: 'campusbridge.housing.compare.v1.account',
} as const;

/** Use only the authenticated server identity, never a profile answer or email. */
export function comparisonSessionKey(mode: 'demo' | 'account', accountId?: string): string | null {
  if (mode === 'demo') return COMPARISON_SESSION_KEYS.demo;
  if (!accountId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId)) return null;
  return `${COMPARISON_SESSION_KEYS.account}.${accountId.toLowerCase()}`;
}

type ComparisonStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function readComparisonStorage(storage: ComparisonStorage, key: string | null): string[] {
  try { storage.removeItem(COMPARISON_SESSION_KEYS.account); } catch { /* Legacy cleanup may be blocked. */ }
  if (!key) return [];
  try { return parseComparisonSession(storage.getItem(key)); } catch { return []; }
}

export function writeComparisonStorage(storage: ComparisonStorage, key: string | null, ids: readonly string[]): void {
  if (!key) return;
  try { storage.setItem(key, JSON.stringify(normalizeComparisonIds(ids))); } catch { /* Keep this tab's in-memory selection. */ }
}

export function clearComparisonStorage(storage: ComparisonStorage, key: string | null): void {
  try { storage.removeItem(COMPARISON_SESSION_KEYS.account); } catch { /* Its owner is unknown. */ }
  if (!key) return;
  try { storage.removeItem(key); } catch { /* Browser storage must not block signing out or deletion. */ }
}

function cleanSearch(value: string) {
  return value.replace(/\s+/g, ' ').trim().slice(0, HOUSING_SEARCH_MAX_LENGTH).trim();
}

function searchText(value: string) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** Only supported controls enter exploration state. Repeated query keys follow URLSearchParams' first-value rule. */
export function parseHousingFilters(params: Pick<URLSearchParams, 'get'>): HousingFilters {
  const radiusValue = params.get('housingRadius');
  const radius = HOUSING_RADII.find(value => String(value) === radiusValue) ?? DEFAULT_HOUSING_FILTERS.radius;
  return {
    radius,
    ...(housingZipCenter(params.get('housingZip') ?? '') ? { zip: params.get('housingZip')! } : {}),
    search: cleanSearch(params.get('housingSearch') ?? ''),
    sort: params.get('housingSort') === 'name' ? 'name' : 'distance',
  };
}

/** Return a fresh query; unrelated topic/task parameters survive changing or clearing housing filters. */
export function serializeHousingFilters(filters: HousingFilters, currentQuery: string | URLSearchParams = ''): URLSearchParams {
  const params = new URLSearchParams(currentQuery);
  const search = cleanSearch(filters.search);
  params.delete('housingRadius');
  params.delete('housingSearch');
  params.delete('housingSort');
  params.delete('housingZip');
  if (housingZipCenter(filters.zip)) params.set('housingZip', filters.zip!);
  if (HOUSING_RADII.includes(filters.radius) && filters.radius !== DEFAULT_HOUSING_FILTERS.radius) params.set('housingRadius', String(filters.radius));
  if (search) params.set('housingSearch', search);
  if (filters.sort === 'name') params.set('housingSort', filters.sort);
  return params;
}

export function housingDistanceMiles(apartment: ApartmentOption, filters: Pick<HousingFilters, 'zip'>): number {
  const center = housingZipCenter(filters.zip);
  if (!center) return apartment.distanceMiles;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const arc = Math.sin(radians(apartment.latitude - center.latitude) / 2) ** 2
    + Math.cos(radians(center.latitude)) * Math.cos(radians(apartment.latitude)) * Math.sin(radians(apartment.longitude - center.longitude) / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

const names = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/** Filters combine with AND. Distance eligibility and ranking always use the unrounded source value. */
export function filterApartments(filters: HousingFilters, apartments: readonly ApartmentOption[] = APARTMENTS): ApartmentOption[] {
  const tokens = searchText(cleanSearch(filters.search)).split(' ').filter(Boolean);
  const radius = HOUSING_RADII.includes(filters.radius) ? filters.radius : DEFAULT_HOUSING_FILTERS.radius;
  return apartments.filter(apartment => {
    const distance = housingDistanceMiles(apartment, filters);
    if (!Number.isFinite(distance) || distance < 0 || distance > radius) return false;
    const haystack = searchText(`${apartment.name} ${apartment.address} ${apartment.zip}`);
    return tokens.every(token => haystack.includes(token));
  }).sort((a, b) => {
    const nameOrder = names.compare(a.name, b.name);
    const idOrder = a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    return filters.sort === 'name'
      ? nameOrder || housingDistanceMiles(a, filters) - housingDistanceMiles(b, filters) || idOrder
      : housingDistanceMiles(a, filters) - housingDistanceMiles(b, filters) || nameOrder || idOrder;
  });
}

/** Session content is untrusted and may refer to removed communities. Keep only three unique current IDs. */
export function normalizeComparisonIds(value: unknown, apartments: readonly ApartmentOption[] = APARTMENTS): string[] {
  if (!Array.isArray(value)) return [];
  const validIds = new Set(apartments.map(apartment => apartment.id));
  const ids: string[] = [];
  for (const id of value) {
    if (typeof id === 'string' && validIds.has(id) && !ids.includes(id)) ids.push(id);
    if (ids.length === COMPARISON_LIMIT) break;
  }
  return ids;
}

export function parseComparisonSession(raw: string | null, apartments: readonly ApartmentOption[] = APARTMENTS): string[] {
  if (!raw) return [];
  try {
    return normalizeComparisonIds(JSON.parse(raw), apartments);
  } catch {
    return [];
  }
}

export type ComparisonChange = { ids: string[]; status: 'added' | 'removed' | 'full' | 'invalid' };

export function toggleComparison(current: readonly string[], id: string, apartments: readonly ApartmentOption[] = APARTMENTS): ComparisonChange {
  const ids = normalizeComparisonIds(current, apartments);
  if (!apartments.some(apartment => apartment.id === id)) return { ids, status: 'invalid' };
  if (ids.includes(id)) return { ids: ids.filter(existing => existing !== id), status: 'removed' };
  if (ids.length === COMPARISON_LIMIT) return { ids, status: 'full' };
  return { ids: [...ids, id], status: 'added' };
}

export type PlanningCommunityPatch = { housingCommunity: string; housingZip: string; leaseStartDate: '' };

/** Only an explicit planning-home change needs a save. Re-selecting a home must preserve its lease date. */
export function planningCommunityPatch(current: { housingCommunity?: string }, nextId: string, apartments: readonly ApartmentOption[] = APARTMENTS): PlanningCommunityPatch | null {
  if ((current.housingCommunity ?? '') === nextId) return null;
  if (nextId === '') return { housingCommunity: '', housingZip: '', leaseStartDate: '' };
  const apartment = apartments.find(option => option.id === nextId);
  if (!apartment) return null;
  return { housingCommunity: apartment.id, housingZip: apartment.zip, leaseStartDate: '' };
}
