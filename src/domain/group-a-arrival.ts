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
