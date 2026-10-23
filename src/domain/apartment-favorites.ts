import { APARTMENTS } from '../data/local-options.ts';
const knownIds = new Set(APARTMENTS.map(apartment => apartment.id));
export function normalizeFavoriteIds(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && knownIds.has(id)))] : [];
}
export function parseFavoriteChange(value: unknown): { communityId: string; saved: boolean } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some(key => key !== 'communityId' && key !== 'saved')) return null;
  return typeof body.communityId === 'string' && knownIds.has(body.communityId) && typeof body.saved === 'boolean' ? { communityId: body.communityId, saved: body.saved } : null;
}
