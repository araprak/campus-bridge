import test from 'node:test';
import assert from 'node:assert/strict';
import { CAR_TRANSPORTERS, internetGuide, INTERNET_PROVIDERS, filterInternetProviders } from '../src/data/service-options.ts';

test('internet guide uses the selected community over an unrelated manual ZIP', () => {
  const guide = internetGuide('estates-on-frankford', '75080');
  assert.equal(guide.area, 'Dallas');
  assert.equal(guide.zip, '75252');
  assert.match(guide.providers.find(provider => provider.id === 'att')!.sourceUrl, /\/dallas$/);
  assert.match(guide.locationNote, /does not confirm service/);
});

test('published community internet arrangements are shown as lease questions', () => {
  assert.match(internetGuide('northside').communityNote!.summary, /before ordering separate service/);
  assert.match(internetGuide('maa-eastside').communityNote!.summary, /required recurring fee/);
  assert.equal(internetGuide('palencia').communityNote, undefined);
});

test('unresearched ZIPs do not turn generic providers into confirmed local service', () => {
  for (const zip of ['10001', '00000', 'toString', '75082']) {
    const guide = internetGuide('missing', zip);
    assert.equal(guide.area, null);
    assert.match(guide.locationNote, /not established local coverage/);
    assert.equal(guide.communityNote, undefined);
  }
});

test('shipping comparison exposes broker identity and a matching federal registration link', () => {
  assert.equal(CAR_TRANSPORTERS.length, 3);
  for (const company of CAR_TRANSPORTERS) {
    assert.equal(company.type, 'Broker');
    const record = new URL(company.registration.url);
    assert.equal(record.hostname, 'safer.fmcsa.dot.gov');
    assert.equal(record.searchParams.get('query_string'), company.registration.usdot);
    assert.match(company.registration.mc, /^\d+$/);
    assert.equal(new URL(company.url).protocol, 'https:');
  }
});


test('internet search covers multiple connection types without claiming local eligibility', () => {
  assert.deepEqual(filterInternetProviders(INTERNET_PROVIDERS, '  T-Mobile ', 'Wireless').map(provider => provider.id), ['tmobile']);
  assert.equal(filterInternetProviders(INTERNET_PROVIDERS, 'T-Mobile', 'Wired').length, 0);
  const satellites = filterInternetProviders(INTERNET_PROVIDERS, '', 'Satellite').map(provider => provider.id);
  for (const id of ['starlink', 'hughesnet', 'viasat']) assert.ok(satellites.includes(id));
  assert.ok(filterInternetProviders(INTERNET_PROVIDERS, 'fiber').some(provider => provider.id === 'frontier'));
  assert.equal(filterInternetProviders(INTERNET_PROVIDERS, 'unknown-provider').length, 0);
});
