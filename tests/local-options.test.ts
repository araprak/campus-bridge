import test from 'node:test';
import assert from 'node:assert/strict';
import { APARTMENTS, CAMPUS_REFERENCE, campusDistanceMiles, electricityGuide } from '../src/data/local-options.ts';

test('local community selection drives the saved ZIP context and city-specific provider link', () => {
  const selected = electricityGuide('northside', '10001');
  assert.equal(selected.zip, '75080');
  assert.equal(selected.area, 'Richardson');
  assert.match(selected.providers.find(p=>p.id==='reliant')!.url, /\/richardson$/);
  const dallas = electricityGuide('palencia', '75080');
  assert.equal(dallas.area, 'Dallas');
  assert.match(dallas.providers.find(p=>p.id==='reliant')!.url, /\/dallas$/);
});

test('unresolved ZIPs and unknown community IDs never claim matched provider coverage', () => {
  for (const zip of ['10001','00000','75082','toString','']) {
    const guide = electricityGuide('missing-community',zip);
    assert.equal(guide.area,null);
    assert.match(guide.heading,/General DFW/);
    if(zip) assert.match(guide.locationNote,/not results matched/);
    assert.doesNotMatch(guide.providers.find(p=>p.id==='reliant')!.url,/\/richardson$|\/dallas$/);
  }
});

test('curated communities have unique identifiers and positive sorted distances within the stated radius', () => {
  assert.equal(APARTMENTS.length,30);
  assert.equal(new Set(APARTMENTS.map(a=>a.id)).size,APARTMENTS.length);
  assert.equal(new Set(APARTMENTS.map(a=>a.address)).size,APARTMENTS.length);
  for(const [i,apartment] of APARTMENTS.entries()) {
    assert.ok(apartment.distanceMiles>0 && apartment.distanceMiles<=15);
    if(i) assert.ok(APARTMENTS[i-1].distanceMiles<=apartment.distanceMiles);
    assert.equal(new URL(apartment.url).protocol,'https:');
    assert.ok(Number.isFinite(apartment.latitude) && apartment.latitude > 32 && apartment.latitude < 34);
    assert.ok(Number.isFinite(apartment.longitude) && apartment.longitude > -98 && apartment.longitude < -96);
    assert.equal(new URL(apartment.coordinateSourceUrl).protocol,'https:');
    assert.match(apartment.coordinateNote,/confirm the leasing entrance/);
    assert.equal(electricityGuide(apartment.id).zip,apartment.zip);
  }
});


test('housing distances use the shared property locations and sort before display rounding', async () => {
  const { COMMUNITY_TRANSIT } = await import('../src/data/community-transit.ts');
  assert.equal(campusDistanceMiles(CAMPUS_REFERENCE),0);
  for (const apartment of APARTMENTS) {
    assert.equal(apartment.distanceMiles,campusDistanceMiles(apartment));
    const transit = COMMUNITY_TRANSIT[apartment.id];
    if (transit) {
      assert.equal(apartment.latitude,transit.reference.latitude);
      assert.equal(apartment.longitude,transit.reference.longitude);
    }
  }
  const frankford=APARTMENTS.find(a=>a.id==='estates-on-frankford')!;
  assert.equal(frankford.distanceMiles.toFixed(1),'2.1');
  assert.ok(APARTMENTS.findIndex(a=>a.id==='estates-of-richardson') < APARTMENTS.findIndex(a=>a.id==='pradera'));
});
