import { APARTMENTS } from '../data/local-options.ts';
import { CAMPUS_PLACES } from '../data/campus-guide.ts';

export const ROUTE_MODES = ['walking', 'bicycling', 'driving', 'transit'] as const;
export type RouteMode = typeof ROUTE_MODES[number];
export const ROUTE_MODE_LABELS: Record<RouteMode, string> = { walking: 'Walking', bicycling: 'Cycling', driving: 'Driving', transit: 'Transit' };
export const CAMPUS_ROUTE_DESTINATION = 'UT Dallas Student Union, Richardson, TX 75080';

export function defaultRouteOrigin(answers: {housingLocation: string; housingCommunity?: string}): string {
  const community = answers.housingLocation === 'off_campus' ? APARTMENTS.find(item => item.id === answers.housingCommunity) : undefined;
  return community ? `${community.name}, ${community.address}` : CAMPUS_ROUTE_DESTINATION;
}

export function campusDestination(id: string): string {
  const place = CAMPUS_PLACES.find(item => item.id === id);
  return place ? `${place.name}, ${place.address}` : CAMPUS_ROUTE_DESTINATION;
}

/** Pure link creation. No geolocation, requests, storage, or navigation occurs here. */
export function campusRouteUrl(origin: string, destination: string, mode: RouteMode): string | null {
  const start = origin.trim();
  const end = destination.trim();
  if (!start || !end || start.length > 300 || end.length > 300 || !ROUTE_MODES.includes(mode)) return null;
  const params = new URLSearchParams({api: '1', origin: start, destination: end, travelmode: mode});
  const url = `https://www.google.com/maps/dir/?${params.toString()}`;
  return url.length <= 2048 ? url : null;
}
