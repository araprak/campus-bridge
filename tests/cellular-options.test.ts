import test from 'node:test';
import assert from 'node:assert/strict';
import { CELLULAR_PROVIDERS, filterCellularProviders, filterCellularForNeeds } from '../src/data/cellular-options.ts';

test('the cellular directory covers major networks, prepaid brands and separate travel options', () => {
  for (const id of ['att', 'tmobile', 'verizon', 'boost', 'cricket', 'metro', 'mint', 'visible', 'us-mobile', 'tello', 'google-fi', 'ultra', 'red-pocket', 'h2o', 'lyca', 'spectrum', 'optimum']) {
    assert.ok(CELLULAR_PROVIDERS.some(provider => provider.id === id), `Missing ${id}`);
  }
  assert.equal(new Set(CELLULAR_PROVIDERS.map(provider => provider.id)).size, CELLULAR_PROVIDERS.length);
  const travel = filterCellularProviders('', 'Travel eSIM');
  assert.ok(travel.length >= 3);
  assert.ok(travel.every(provider => /eSIM/.test(provider.description)));
  assert.ok(!travel.some(provider => provider.id === 'att'));
});

test('phone needs conservatively exclude travel/app numbers and optional bundles without claiming prices', () => {
  const narrowed = filterCellularForNeeds(CELLULAR_PROVIDERS, {usNumber: true, noInternetBundle: true});
  assert.ok(narrowed.length > 0);
  assert.ok(narrowed.every(provider => provider.group !== 'Travel eSIM' && provider.group !== 'Internet bundles' && provider.id !== 'textnow'));
  assert.equal(filterCellularForNeeds(CELLULAR_PROVIDERS, {usNumber: false, noInternetBundle: false}).length, CELLULAR_PROVIDERS.length);
  assert.deepEqual(filterCellularForNeeds(filterCellularProviders('', 'Travel eSIM'), {usNumber: true, noInternetBundle: false}), []);
});

test('provider searches ignore case and whitespace and combine words with the selected group', () => {
  assert.deepEqual(filterCellularProviders('  RED   pocket ').map(provider => provider.id), ['red-pocket']);
  assert.deepEqual(filterCellularProviders('international', 'Major networks'), []);
  assert.ok(filterCellularProviders('international', 'Prepaid & flexible').length > 0);
  assert.deepEqual(filterCellularProviders('no-such-provider-xyz'), []);
  assert.equal(filterCellularProviders('   ').length, CELLULAR_PROVIDERS.length);
});

test('provider links are public HTTPS pages without personal data or tracking parameters', () => {
  for (const provider of CELLULAR_PROVIDERS) {
    const url = new URL(provider.url);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.search, '');
    assert.equal(url.username, '');
  }
});
