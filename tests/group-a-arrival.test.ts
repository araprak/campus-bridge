import test from 'node:test';
import assert from 'node:assert/strict';
import { arrivalRouteUrl, expansionReadiness, expansionWorksheetText } from '../src/domain/group-a-arrival.ts';
import { ARRIVAL_AIRPORTS, ARRIVAL_TRAVEL_OPTIONS } from '../src/data/group-a-arrival.ts';

test('airport routes encode the selected airport, exact destination and chosen travel mode', () => {
  for (const airport of Object.keys(ARRIVAL_AIRPORTS) as (keyof typeof ARRIVAL_AIRPORTS)[]) {
    for (const travel of Object.keys(ARRIVAL_TRAVEL_OPTIONS) as (keyof typeof ARRIVAL_TRAVEL_OPTIONS)[]) {
      const route = new URL(arrivalRouteUrl(airport, '  123 A & B Street, Richardson, TX  ', travel)!);
      assert.equal(route.origin, 'https://www.google.com');
      assert.equal(route.pathname, '/maps/dir/');
      assert.equal(route.searchParams.get('origin'), ARRIVAL_AIRPORTS[airport].origin);
      assert.equal(route.searchParams.get('destination'), '123 A & B Street, Richardson, TX');
      assert.equal(route.searchParams.get('travelmode'), travel === 'transit' ? 'transit' : 'driving');
      assert.equal(route.searchParams.has('key'), false);
    }
  }
});

test('arrival directions reject missing, oversized, invalid or control-character inputs', () => {
  assert.equal(arrivalRouteUrl('DFW', ' ', 'transit'), null);
  assert.equal(arrivalRouteUrl('DAL', 'x'.repeat(301), 'pickup'), null);
  assert.equal(arrivalRouteUrl('DFW', 'one\ntwo', 'car'), null);
  assert.equal(arrivalRouteUrl('DFW', '路'.repeat(300), 'car'), null);
  assert.equal(arrivalRouteUrl('other' as 'DFW', 'UT Dallas', 'transit'), null);
  assert.equal(arrivalRouteUrl('DFW', 'UT Dallas', 'fly' as 'transit'), null);
});

test('research readiness counts unique known criteria and does not treat unknown checks as evidence', () => {
  assert.deepEqual(expansionReadiness(['need', 'need', 'unknown']), { completed: 1, total: 4, ready: false });
  assert.equal(expansionReadiness(['need', 'owner', 'sources', 'test']).ready, true);
});

test('research export records missing evidence, selected checks and bounded notes without profile data', () => {
  const text = expansionWorksheetText({ concept: 'premium', campus: 'UT Dallas', problem: 'x'.repeat(2200), evidence: '', measure: 'Interview 5 students by November 2', checked: ['need'] });
  assert.match(text, /Research only/);
  assert.match(text, /Optional planning convenience/);
  assert.match(text, /Evidence and owner: Not recorded/);
  assert.match(text, /\[x\] I have recorded/);
  assert.match(text, /\[ \] A responsible/);
  assert.ok(!text.includes('x'.repeat(2001)));
});
