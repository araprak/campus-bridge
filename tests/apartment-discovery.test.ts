import test from 'node:test';
import assert from 'node:assert/strict';
import { APARTMENTS, type ApartmentOption } from '../src/data/local-options.ts';
import {
  DEFAULT_HOUSING_FILTERS, HOUSING_SEARCH_MAX_LENGTH, filterApartments,
  parseHousingFilters, serializeHousingFilters, normalizeComparisonIds,
  parseComparisonSession, toggleComparison, planningCommunityPatch,
} from '../src/domain/apartment-discovery.ts';

function community(id: string, name: string, distanceMiles: number, overrides: Partial<ApartmentOption> = {}): ApartmentOption {
  return { ...APARTMENTS[0], id, name, distanceMiles, address: '100 Main St, Dallas, TX 75252', zip: '75252', ...overrides };
}

test('default discovery includes the current 30 communities and combines radius with name/address/ZIP search', () => {
  assert.equal(filterApartments({ ...DEFAULT_HOUSING_FILTERS }).length, 30);
  assert.equal(filterApartments({ ...DEFAULT_HOUSING_FILTERS, radius: 3 }).length, 20);
  assert.equal(filterApartments({ ...DEFAULT_HOUSING_FILTERS, radius: 5 }).length, 28);
  assert.deepEqual(filterApartments({ radius: 5, search: '  FRANKFORD  7575  75252 ', sort: 'distance' }).map(a => a.id), ['estates-on-frankford']);
  assert.deepEqual(filterApartments({ radius: 1, search: 'Estates on Frankford', sort: 'distance' }), []);
  assert.deepEqual(filterApartments({ ...DEFAULT_HOUSING_FILTERS, search: 'No community with this name' }), []);
});

test('search tolerates case, accents, apostrophes and repeated whitespace without changing source identities', () => {
  const source = [community('hunter', 'Húnter’s Court', 1.5)];
  assert.deepEqual(filterApartments({ ...DEFAULT_HOUSING_FILTERS, search: "HUNTER'S   court dallas" }, source), source);
  assert.equal(source[0].name, 'Húnter’s Court');
});

test('radius uses unrounded distance and excludes invalid measurements; ranking is stable independently of input order', () => {
  const source = [
    community('outside', 'Outside', 3.000001),
    community('b', 'Alpha', 3),
    community('c', 'Beta', 3),
    community('a', 'Alpha', 3),
    community('near', 'Zulu', 2.999999),
    community('unknown', 'Unknown', Number.NaN),
    community('infinite', 'Infinite', Infinity),
    community('negative', 'Negative', -1),
  ];
  const filters = { ...DEFAULT_HOUSING_FILTERS, radius: 3 as const };
  const originalIds = source.map(a => a.id);
  assert.deepEqual(filterApartments(filters, source).map(a => a.id), ['near', 'a', 'b', 'c']);
  assert.deepEqual(filterApartments(filters, [...source].reverse()).map(a => a.id), ['near', 'a', 'b', 'c']);
  assert.deepEqual(filterApartments({ ...filters, sort: 'name' }, source).map(a => a.id), ['a', 'b', 'c', 'near']);
  assert.deepEqual(source.map(a => a.id), originalIds);
});

test('malformed or unsupported URL controls fall back safely and search input is bounded', () => {
  for (const invalidRadius of ['', '-2', '0', '2', '10.0', '2e0', 'Infinity', 'NaN', '2 miles', '15foo']) {
    assert.equal(parseHousingFilters(new URLSearchParams({ housingRadius: invalidRadius })).radius, 10);
  }
  assert.deepEqual(parseHousingFilters(new URLSearchParams()), DEFAULT_HOUSING_FILTERS);
  assert.deepEqual(parseHousingFilters(new URLSearchParams('housingRadius=5&housingRadius=2&housingSort=rent&housingSearch=++Northside+++Richardson+')), { radius: 5, search: 'Northside Richardson', sort: 'distance' });
  assert.equal(parseHousingFilters(new URLSearchParams({ housingSearch: 'a'.repeat(1000) })).search.length, HOUSING_SEARCH_MAX_LENGTH);
  assert.equal(parseHousingFilters(new URLSearchParams('housingSearch=%E0%A4%A')).radius, 10);
});

test('query serialization round-trips search text and preserves unrelated navigation while reset clears only exploration filters', () => {
  const current = new URLSearchParams('topic=housing&task=lease&ref=one&ref=two&housingRadius=2&housingRadius=15&housingSort=unknown');
  const updated = serializeHousingFilters({ radius: 5, search: 'A&B #1 + Plaza', sort: 'name' }, current);
  assert.deepEqual(parseHousingFilters(updated), { radius: 5, search: 'A&B #1 + Plaza', sort: 'name' });
  assert.equal(updated.get('topic'), 'housing');
  assert.equal(updated.get('task'), 'lease');
  assert.deepEqual(updated.getAll('ref'), ['one', 'two']);
  assert.deepEqual(updated.getAll('housingRadius'), ['5']);
  assert.deepEqual(current.getAll('housingRadius'), ['2', '15']);
  const reset = serializeHousingFilters({ ...DEFAULT_HOUSING_FILTERS }, updated);
  assert.equal(reset.toString(), 'topic=housing&task=lease&ref=one&ref=two');
  assert.deepEqual(parseHousingFilters(reset), DEFAULT_HOUSING_FILTERS);
});

test('comparison session rejects malformed values, deduplicates valid communities and caps restored selections at three', () => {
  const valid = APARTMENTS.slice(0, 4).map(a => a.id);
  for (const raw of [null, '', '{', 'null', '123', '"northside"', '{}', '{"ids":["northside"]}']) {
    assert.deepEqual(parseComparisonSession(raw), []);
  }
  assert.deepEqual(parseComparisonSession(JSON.stringify(['removed-community', null, 42, valid[0], valid[0], ...valid.slice(1)])), valid.slice(0, 3));
  assert.deepEqual(normalizeComparisonIds({ [valid[0]]: true }), []);
});

test('comparison rejects a fourth community, supports removal/replacement and never mutates its selection input', () => {
  const ids = APARTMENTS.slice(0, 4).map(a => a.id);
  const selected = Object.freeze(ids.slice(0, 3));
  assert.deepEqual(toggleComparison(selected, ids[3]), { ids: ids.slice(0, 3), status: 'full' });
  assert.deepEqual(toggleComparison(selected, 'unknown'), { ids: ids.slice(0, 3), status: 'invalid' });
  const removed = toggleComparison(selected, ids[1]);
  assert.deepEqual(removed, { ids: [ids[0], ids[2]], status: 'removed' });
  assert.deepEqual(toggleComparison(removed.ids, ids[3]), { ids: [ids[0], ids[2], ids[3]], status: 'added' });
  assert.deepEqual(selected, ids.slice(0, 3));
});

test('only a real planning-community change clears its lease; re-selecting the same home is a no-op', () => {
  const first = APARTMENTS[0];
  const next = APARTMENTS[1];
  const saved = Object.freeze({ housingCommunity: first.id, housingZip: first.zip, leaseStartDate: '2027-01-15' });
  assert.equal(planningCommunityPatch(saved, first.id), null);
  assert.equal(saved.leaseStartDate, '2027-01-15');
  assert.equal(planningCommunityPatch(saved, 'unknown'), null);
  assert.deepEqual(planningCommunityPatch(saved, next.id), { housingCommunity: next.id, housingZip: next.zip, leaseStartDate: '' });
  assert.deepEqual(planningCommunityPatch(saved, ''), { housingCommunity: '', housingZip: '', leaseStartDate: '' });
  assert.equal(planningCommunityPatch({}, ''), null);
  assert.deepEqual(planningCommunityPatch({}, next.id), { housingCommunity: next.id, housingZip: next.zip, leaseStartDate: '' });
  assert.deepEqual(saved, { housingCommunity: first.id, housingZip: first.zip, leaseStartDate: '2027-01-15' });
});
