import test from 'node:test';
import assert from 'node:assert/strict';
import { APARTMENTS } from '../src/data/local-options.ts';
import { HOUSING_RADII, DEFAULT_HOUSING_FILTERS, filterApartments, housingDistanceMiles, parseHousingFilters, serializeHousingFilters } from '../src/domain/apartment-discovery.ts';
import { HOUSING_ZIP_CENTERS, validateHousingZip } from '../src/data/housing-zip-centers.ts';
import { HOUSING_COST_FIELDS, estimateHousingCost, initialHousingCost } from '../src/domain/housing-cost.ts';
import { normalizeFavoriteIds, parseFavoriteChange } from '../src/domain/apartment-favorites.ts';

test('ZIP search uses official area points, supports the requested radii and rejects unsupported locations', () => {
  assert.deepEqual(HOUSING_RADII, [1, 3, 5, 10, 15]);
  assert.deepEqual(validateHousingZip(' 75080 '), { zip: '75080' });
  for (const value of ['', '7508', '750800', '75abc', '75080-1234', '10001', '99999']) assert.ok(validateHousingZip(value).error, value);
  assert.equal(new Set(HOUSING_ZIP_CENTERS.map(point => point.zip)).size, HOUSING_ZIP_CENTERS.length);
  assert.deepEqual(HOUSING_ZIP_CENTERS.find(point => point.zip === '75080'), { zip: '75080', latitude: 32.976063, longitude: -96.74208 });
  const center = HOUSING_ZIP_CENTERS.find(point => point.zip === '75252')!;
  const atCenter = { ...APARTMENTS[0], ...center };
  assert.equal(housingDistanceMiles(atCenter, { zip: '75252' }), 0);
  assert.equal(housingDistanceMiles(atCenter, {}), APARTMENTS[0].distanceMiles);
  const filters = { ...DEFAULT_HOUSING_FILTERS, zip: center.zip, radius: 1 as const };
  const matches = filterApartments(filters);
  assert.ok(matches.length > 0);
  assert.ok(matches.every(apartment => housingDistanceMiles(apartment, filters) <= 1));
  assert.notDeepEqual(matches.map(a => a.id), filterApartments({ ...filters, zip: undefined }).map(a => a.id));
  assert.deepEqual(filterApartments({ ...filters, search: 'no match anywhere' }), []);
  assert.deepEqual(filterApartments({ ...DEFAULT_HOUSING_FILTERS, radius: 1 }), []);
});

test('ZIP query round-trips preserve unrelated query state and invalid ZIPs never become search centers', () => {
  const filters = { ...DEFAULT_HOUSING_FILTERS, zip: '75252', radius: 3 as const };
  const query = serializeHousingFilters(filters, 'topic=housing&housingZip=10001');
  assert.deepEqual(parseHousingFilters(query), filters);
  assert.equal(query.get('topic'), 'housing');
  assert.equal(parseHousingFilters(new URLSearchParams('housingZip=10001')).zip, undefined);
  assert.equal(serializeHousingFilters(DEFAULT_HOUSING_FILTERS, query).get('housingZip'), null);
});

test('cost estimator keeps unknown amounts distinct from zero and separates recurring and one-time costs', () => {
  const input = initialHousingCost();
  assert.equal(estimateHousingCost(input).monthly, null);
  input.monthly.rent = { status: 'amount', amount: '1800' };
  input.monthly.internet = { status: 'included', amount: '' };
  input.oneTime = { status: 'amount', amount: '500' };
  const partial = estimateHousingCost(input);
  assert.equal(partial.monthly, 1800);
  assert.equal(partial.complete, false);
  assert.equal(partial.oneTime, 500);
  assert.ok(partial.unknown.includes('Electricity'));
  assert.ok(!partial.unknown.includes('Internet'));
  input.basis = 'whole_unit'; input.people = '3';
  assert.equal(estimateHousingCost(input).monthly, 600);
  assert.equal(estimateHousingCost(input).oneTime, 500 / 3);
  for (const field of HOUSING_COST_FIELDS) input.monthly[field.id] = { status: 'included', amount: '' };
  assert.equal(estimateHousingCost(input).monthly, 0);
  assert.equal(estimateHousingCost(input).complete, true);
});

test('invalid cost inputs and invalid sharing assumptions cannot appear as known totals', () => {
  for (const value of ['', '-1', 'Infinity', 'NaN', '1e3', '2.001', '1000001']) {
    const input = initialHousingCost(); input.monthly.rent = { status: 'amount', amount: value };
    assert.equal(estimateHousingCost(input).monthly, null, value);
  }
  const input = initialHousingCost(); input.monthly.rent = { status: 'amount', amount: '1500' }; input.basis = 'whole_unit';
  for (const value of ['', '0', '-1', '1.5', '21', 'abc']) {
    input.people = value; assert.equal(estimateHousingCost(input).validShare, false, value); assert.equal(estimateHousingCost(input).monthly, null);
  }
});

test('favorite changes accept only current identities and never accept a caller-supplied account owner', () => {
  const ids = APARTMENTS.slice(0, 4).map(a => a.id);
  assert.deepEqual(normalizeFavoriteIds([...ids, ids[0], 'unknown', 42]), ids);
  assert.deepEqual(parseFavoriteChange({ communityId: ids[0], saved: true }), { communityId: ids[0], saved: true });
  for (const value of [null, [], {}, { communityId: 'unknown', saved: true }, { communityId: ids[0], saved: 'true' }, { communityId: ids[0], saved: true, user_id: 'other' }]) assert.equal(parseFavoriteChange(value), null);
  assert.equal(normalizeFavoriteIds(ids).length, 4, 'Favorites are independent of the three-item comparison limit');
});
