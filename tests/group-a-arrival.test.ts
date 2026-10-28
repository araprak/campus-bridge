import test from 'node:test';
import assert from 'node:assert/strict';
import { arrivalRouteUrl, expansionReadiness, expansionWorksheetText, parseGroupAArrivalRoute } from '../src/domain/group-a-arrival.ts';
import { APARTMENTS } from '../src/data/local-options.ts';
import { GROUP_A_ON_CAMPUS_HOUSING } from '../src/data/group-a-housing.ts';
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

const savedRoute = { version: 1, airport: 'DFW', travel: 'transit', destinationKind: 'community', campusId: 'su', communityId: APARTMENTS[0].id, customDestination: '', arrivalDate: '2027-01-10', checklist: ['first-night', 'documents'] };
test('account arrival data accepts catalog choices and strips extra identity or owner fields', () => {
  assert.deepEqual(parseGroupAArrivalRoute({ ...savedRoute, user_id: 'someone-else', email: 'not-stored@example.test', customDestination: 'Unused address', checklist: ['documents', 'documents'] }), { ...savedRoute, checklist: ['documents'] });
  assert.deepEqual(parseGroupAArrivalRoute({ ...savedRoute, destinationKind: 'custom', customDestination: ' 123 Main St, Richardson, TX ' }), { ...savedRoute, destinationKind: 'custom', customDestination: '123 Main St, Richardson, TX' });
});
test('account arrival data rejects malformed dates, catalog IDs, enums and checklist values', () => {
  for (const patch of [{ version: 2 }, { airport: 'OTHER' }, { travel: 'flying' }, { campusId: 'unknown' }, { communityId: 'unknown' }, { destinationKind: 'unknown' }, { destinationKind: 'custom', customDestination: ' ' }, { customDestination: 'x'.repeat(301) }, { customDestination: 'one\ntwo' }, { arrivalDate: '2027-02-30' }, { arrivalDate: '0000-01-01' }, { arrivalDate: '2027-13-01' }, { checklist: ['unknown'] }, { checklist: ['documents', 4] }]) assert.equal(parseGroupAArrivalRoute({ ...savedRoute, ...patch }), null, JSON.stringify(patch));
  assert.equal(parseGroupAArrivalRoute(null), null);
  assert.equal(parseGroupAArrivalRoute([]), null);
});
test('on-campus Group A pins retain published UTD map references and distinguish buildings from assigned homes', () => {
  assert.equal(GROUP_A_ON_CAMPUS_HOUSING.length, 4);
  assert.equal(new Set(GROUP_A_ON_CAMPUS_HOUSING.map(item => item.id)).size, 4);
  for (const item of GROUP_A_ON_CAMPUS_HOUSING) {
    assert.equal(item.layer, 'campus');
    assert.equal(new URL(item.url!).hostname, 'housing.utdallas.edu');
    assert.equal(new URL(item.sourceUrl).hostname, 'map.concept3d.com');
    assert.match(item.reviewedOn, /^2026-10-27$/);
    assert.match(item.note!, /assigned|availability|eligibility/);
    assert.ok(item.latitude > 32.98 && item.latitude < 32.992);
    assert.ok(item.longitude > -96.756 && item.longitude < -96.75);
  }
  assert.match(GROUP_A_ON_CAMPUS_HOUSING.find(item => item.id.includes('village'))!.note!, /Housing Office, not every apartment/);
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
