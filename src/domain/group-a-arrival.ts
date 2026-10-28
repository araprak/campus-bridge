import { APARTMENTS } from '../data/local-options.ts';
import { CAMPUS_PLACES } from '../data/campus-guide.ts';
import { ARRIVAL_AIRPORTS, ARRIVAL_TRAVEL_OPTIONS, EXPANSION_CHECKS, EXPANSION_CONCEPTS, type ArrivalAirport, type ArrivalTravel } from '../data/group-a-arrival.ts';

export function arrivalRouteUrl(airport: ArrivalAirport, destination: string, travel: ArrivalTravel): string | null {
  if (!Object.hasOwn(ARRIVAL_AIRPORTS, airport) || !Object.hasOwn(ARRIVAL_TRAVEL_OPTIONS, travel)) return null;
  const end = destination.trim();
  if (!end || end.length > 300 || /[\u0000-\u001f\u007f]/.test(end)) return null;
  const params = new URLSearchParams({ api: '1', origin: ARRIVAL_AIRPORTS[airport].origin, destination: end, travelmode: travel === 'transit' ? 'transit' : 'driving' });
  const url = `https://www.google.com/maps/dir/?${params.toString()}`;
  return url.length <= 2048 ? url : null;
}

export function expansionReadiness(checked: string[]): { completed: number; total: number; ready: boolean } {
  const completed = EXPANSION_CHECKS.filter(item => checked.includes(item.id)).length;
  return { completed, total: EXPANSION_CHECKS.length, ready: completed === EXPANSION_CHECKS.length };
}

/** Export only the worksheet; never include student identity, location or profile state. */
export function expansionWorksheetText(input: { concept: string; campus: string; problem: string; evidence: string; measure: string; checked: string[] }): string {
  const concept = EXPANSION_CONCEPTS.find(item => item.id === input.concept) || EXPANSION_CONCEPTS[0];
  const clean = (value: string) => value.trim().slice(0, 2000);
  return [
    'CampusBridge — Group A research worksheet',
    'Status: Research only. This worksheet does not launch a campus or paid service.',
    `Concept: ${concept.title}`,
    `Campus or audience: ${clean(input.campus) || 'Not specified'}`,
    `Problem to validate: ${clean(input.problem) || 'Not recorded'}`,
    `Evidence and owner: ${clean(input.evidence) || 'Not recorded'}`,
    `Pilot success measure and decision date: ${clean(input.measure) || 'Not recorded'}`,
    '',
    'Validation checklist',
    ...EXPANSION_CHECKS.map(item => `${input.checked.includes(item.id) ? '[x]' : '[ ]'} ${item.label}`),
    '',
    'Do not include personal student information in shared research notes.',
  ].join('\n');
}

const GROUP_A_CAMPUS_IDS = CAMPUS_PLACES.map(item => item.id);
const GROUP_A_COMMUNITY_IDS = APARTMENTS.map(item => item.id);

export type GroupAArrivalRoute = {
  version: 1;
  airport: ArrivalAirport;
  travel: ArrivalTravel;
  destinationKind: 'campus' | 'community' | 'custom';
  campusId: string;
  communityId: string;
  customDestination: string;
  arrivalDate: string;
  checklist: string[];
};
export const ARRIVAL_CHECK_IDS = ['first-night', 'phone', 'money', 'orientation', 'documents', 'backup'] as const;
export function parseGroupAArrivalRoute(value: unknown): GroupAArrivalRoute | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || typeof v.airport !== 'string' || !Object.hasOwn(ARRIVAL_AIRPORTS, v.airport)
    || typeof v.travel !== 'string' || !Object.hasOwn(ARRIVAL_TRAVEL_OPTIONS, v.travel)
    || !['campus', 'community', 'custom'].includes(String(v.destinationKind))
    || typeof v.campusId !== 'string' || !GROUP_A_CAMPUS_IDS.includes(v.campusId)
    || typeof v.communityId !== 'string' || !GROUP_A_COMMUNITY_IDS.includes(v.communityId)
    || typeof v.customDestination !== 'string' || v.customDestination.length > 300 || /[\u0000-\u001f\u007f]/.test(v.customDestination)
    || typeof v.arrivalDate !== 'string' || (v.arrivalDate !== '' && (!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(v.arrivalDate) || !Number.isFinite(Date.parse(v.arrivalDate + 'T12:00:00Z')) || new Date(v.arrivalDate + 'T12:00:00Z').toISOString().slice(0, 10) !== v.arrivalDate))
    || !Array.isArray(v.checklist) || v.checklist.length > ARRIVAL_CHECK_IDS.length || v.checklist.some(item => typeof item !== 'string' || !(ARRIVAL_CHECK_IDS as readonly string[]).includes(item))) return null;
  if (v.destinationKind === 'custom' && !arrivalRouteUrl(v.airport as ArrivalAirport, v.customDestination, v.travel as ArrivalTravel)) return null;
  return { version: 1, airport: v.airport as ArrivalAirport, travel: v.travel as ArrivalTravel, destinationKind: v.destinationKind as GroupAArrivalRoute['destinationKind'], campusId: v.campusId, communityId: v.communityId, customDestination: v.destinationKind === 'custom' ? v.customDestination.trim() : '', arrivalDate: v.arrivalDate, checklist: [...new Set(v.checklist as string[])] };
}
