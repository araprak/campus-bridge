import test from 'node:test';
import assert from 'node:assert/strict';
import { APARTMENTS } from '../src/data/local-options.ts';
import { COMMUNITY_TRANSIT, COMET_WEST_ROUTE, getCommunityTransit, transitScheduleNotice, TRANSIT_FEED_PERIODS } from '../src/data/community-transit.ts';
import { NEIGHBORHOOD_PLACES, neighborhoodPlaces, neighborhoodDirections } from '../src/data/neighborhood-places.ts';
import { internetGuide, INTERNET_PROVIDERS } from '../src/data/service-options.ts';

const communityIds = APARTMENTS.map(community => community.id);

test('route guidance distinguishes arrivals beyond the published schedule and expired snapshots', () => {
  assert.equal(transitScheduleNotice('2026-10-18', '2026-10-04').status, 'within_snapshot');
  assert.equal(transitScheduleNotice('2026-12-06', '2026-12-06').status, 'within_snapshot');
  const january = transitScheduleNotice('2027-01-15', '2026-10-04');
  assert.equal(january.status, 'future_arrival');
  assert.match(january.text, /Your arrival is after/);
  for (const arrival of ['2026-09-01', '2026-12-07', '2027-01-15']) {
    const expired = transitScheduleNotice(arrival, '2026-12-07');
    assert.equal(expired.status, 'expired');
    assert.match(expired.text, /current service has not been verified/);
  }
});
test('published transit periods cover the October handoff without claiming December or January service', () => {
  assert.equal(TRANSIT_FEED_PERIODS[0].end, '2026-10-18');
  assert.equal(TRANSIT_FEED_PERIODS[1].start, '2026-10-19');
  assert.equal(transitScheduleNotice('2026-11-01', '2026-10-15').status, 'within_snapshot');
  assert.equal(transitScheduleNotice('2026-12-06', '2026-10-19').status, 'within_snapshot');
  assert.equal(transitScheduleNotice('2026-12-07', '2026-10-19').status, 'future_arrival');
  assert.equal(transitScheduleNotice('2026-12-06', '2026-12-07').status, 'expired');
  assert.equal(transitScheduleNotice('2026-10-01', '2026-10-01').status, 'outside_snapshot');
});
const radians = (degrees: number) => degrees * Math.PI / 180;
function greatCircleMiles(a: {latitude: number; longitude: number}, b: {latitude: number; longitude: number}) {
  const h = Math.sin(radians(b.latitude - a.latitude) / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude))
    * Math.sin(radians(b.longitude - a.longitude) / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

test('only researched communities have transit guides, with routes served by their listed stops', () => {
  assert.equal(communityIds.length, 30);
  const researched = ['estates-on-frankford', 'palencia', 'northside', 'marquis-at-waterview', 'james-at-canyon-creek', 'pradera', 'estates-of-richardson', 'maa-eastside'];
  assert.deepEqual(Object.keys(COMMUNITY_TRANSIT).sort(), researched.sort());
  for (const community of APARTMENTS) {
    const guide = getCommunityTransit(community.id);
    if (!researched.includes(community.id)) { assert.equal(guide, undefined, `${community.id}: do not invent a route`); continue; }
    assert.ok(guide);
    assert.equal(guide.communityId, community.id);
    assert.ok(guide.routes.length > 0 && guide.stops.length > 0, community.id);
    const routes = new Set(guide.routes.map(route => route.id));
    assert.equal(routes.size, guide.routes.length, `${community.id}: duplicate route`);
    assert.equal(new Set(guide.stops.map(stop => stop.id)).size, guide.stops.length);
    for (const stop of guide.stops) {
      assert.ok(stop.routeIds.length > 0);
      for (const route of stop.routeIds) assert.ok(routes.has(route), `${community.id}/${stop.id}: missing route ${route}`);
    }
    for (const route of guide.routes) {
      assert.ok(guide.stops.some(stop => stop.routeIds.includes(route.id)), `${community.id}: no boarding point for ${route.id}`);
      assert.equal(new URL(route.url).protocol, 'https:');
      assert.equal(new URL(route.mapUrl).protocol, 'https:');
    }
  }
});

test('stop distances match the stated reference points and walking links reach the same stop coordinates', () => {
  const sharedStops = new Map<string, {name: string; latitude: number; longitude: number}>();
  for (const guide of Object.values(COMMUNITY_TRANSIT)) {
    for (const stop of guide.stops) {
      const identity = {name: stop.name, latitude: stop.latitude, longitude: stop.longitude};
      if (sharedStops.has(stop.id)) assert.deepEqual(identity, sharedStops.get(stop.id), `conflicting stop ${stop.id}`);
      sharedStops.set(stop.id, identity);
      assert.ok(Math.abs(greatCircleMiles(guide.reference, stop) - stop.straightLineMiles) <= 0.0051, `${guide.communityId}/${stop.id}: distance is not rounded straight-line miles`);
      const link = new URL(stop.walkingUrl);
      assert.equal(link.origin, 'https://www.google.com');
      assert.equal(link.pathname, '/maps/dir/');
      assert.equal(link.searchParams.get('travelmode'), 'walking');
      assert.equal(link.searchParams.get('destination'), `${stop.latitude},${stop.longitude}`);
      assert.ok(link.searchParams.get('origin')?.includes(APARTMENTS.find(a => a.id === guide.communityId)!.name));
    }
  }
});

test('Frankford and Coit boarding directions do not send students to the opposite-side stop for 883 West', () => {
  const frankford = getCommunityTransit('estates-on-frankford')!;
  assert.deepEqual(frankford.stops.find(stop => stop.id === '33037')!.routeIds, ['883W', '232']);
  assert.deepEqual(frankford.stops.find(stop => stop.id === '32677')!.routeIds, ['232']);
  assert.match(frankford.accessNote, /eastbound.*33037/);
  const palencia = getCommunityTransit('palencia')!;
  assert.ok(palencia.stops.find(stop => stop.id === '29673')!.routeIds.includes('883W'));
  assert.deepEqual(palencia.stops.find(stop => stop.id === '29674')!.routeIds, ['241']);
  assert.match(palencia.accessNote, /southbound.*883 West/);
  assert.ok(COMET_WEST_ROUTE.toCampus.includes('Coit Road southbound'));
  assert.ok(COMET_WEST_ROUTE.fromCampus.includes('Meandering Way northbound'));
  assert.match(COMET_WEST_ROUTE.extension, /Fridays and Sundays/);
});

test('Eastside does not acquire a direct Comet Cruiser route and unknown community IDs never inherit a guide', () => {
  assert.ok(getCommunityTransit('maa-eastside')!.routes.every(route => !route.id.startsWith('883')));
  for (const id of [undefined, '', 'missing-community', '__proto__', 'constructor', 'toString']) {
    assert.equal(getCommunityTransit(id), undefined);
    assert.deepEqual(neighborhoodPlaces(id, true), NEIGHBORHOOD_PLACES);
  }
});

test('neighborhood recommendations cover all communities and restrict fuel and car washes to car access', () => {
  assert.equal(new Set(NEIGHBORHOOD_PLACES.map(place => place.id)).size, NEIGHBORHOOD_PLACES.length);
  for (const place of NEIGHBORHOOD_PLACES) {
    assert.ok(place.communityIds.length > 0);
    assert.equal(new Set(place.communityIds).size, place.communityIds.length);
    for (const id of place.communityIds) assert.ok(communityIds.includes(id), `${place.id}: unknown community ${id}`);
    assert.equal(new URL(place.url).protocol, 'https:');
    assert.ok(place.coordinates, `${place.id}: missing embedded-map coordinates`);
    assert.ok(place.coordinates.latitude > 32.9 && place.coordinates.latitude < 33.1, place.id);
    assert.ok(place.coordinates.longitude > -96.85 && place.coordinates.longitude < -96.6, place.id);
    assert.equal(new URL(place.coordinates.sourceUrl).protocol, 'https:');
  }
  for (const id of communityIds) {
    const walking = neighborhoodPlaces(id, false);
    const driving = neighborhoodPlaces(id, true);
    assert.ok(walking.some(place => place.category === 'grocery'), id);
    assert.ok(walking.some(place => place.category === 'restaurant'), id);
    assert.ok(walking.some(place => place.category === 'pharmacy'), id);
    assert.ok(driving.some(place => place.category === 'fuel'), id);
    assert.ok(driving.some(place => place.category === 'carwash'), id);
    assert.deepEqual(driving.filter(place => place.category !== 'fuel' && place.category !== 'carwash'), walking);
  }
});

test('neighborhood directions preserve the selected travel mode, business address, and community origin', () => {
  for (const community of APARTMENTS) {
    for (const place of neighborhoodPlaces(community.id, true)) {
      for (const mode of ['walking', 'transit', 'driving'] as const) {
        const link = new URL(neighborhoodDirections(community.id, place, mode));
        assert.equal(link.origin, 'https://www.google.com');
        assert.equal(link.searchParams.get('api'), '1');
        assert.equal(link.searchParams.get('travelmode'), mode);
        assert.equal(link.searchParams.get('origin'), `${community.name}, ${community.address}`);
        assert.equal(link.searchParams.get('destination'), `${place.name}, ${place.address}`);
      }
    }
  }
  const place = NEIGHBORHOOD_PLACES[0];
  const unknown = new URL(neighborhoodDirections('__proto__', place));
  assert.equal(unknown.searchParams.has('origin'), false);
  assert.equal(unknown.searchParams.get('travelmode'), 'transit');
  assert.equal(unknown.searchParams.get('destination'), `${place.name}, ${place.address}`);
});

test('internet guidance prioritizes the selected community and flags unknown coverage without assigning a city', () => {
  for (const community of APARTMENTS) {
    const guide = internetGuide(community.id, '10001');
    assert.equal(guide.zip, community.zip);
    assert.deepEqual(guide.providers.map(provider => provider.id), INTERNET_PROVIDERS.map(provider => provider.id));
    if (guide.area) assert.match(guide.locationNote, /does not confirm service/);
    else assert.match(guide.locationNote, /not established local coverage/);
  }
  assert.ok(internetGuide('northside').communityNote);
  assert.ok(internetGuide('maa-eastside').communityNote);
  assert.equal(internetGuide('palencia').communityNote, undefined);
  for (const zip of ['10001', '00000', '75082', '__proto__', '']) {
    const guide = internetGuide('unknown-community', zip);
    assert.equal(guide.area, null);
    assert.equal(guide.communityNote, undefined);
    if (zip) assert.match(guide.locationNote, /not established local coverage/);
  }
});



test('campus and unresearched-community fallback keeps daily life useful without inventing a direct transit route', () => {
  const eligible = NEIGHBORHOOD_PLACES.filter(place => !['fuel', 'carwash'].includes(place.category));
  for (const id of [undefined, '', 'on_campus', 'not-yet-selected', ...communityIds.filter(id => !Object.hasOwn(COMMUNITY_TRANSIT, id))]) {
    assert.deepEqual(neighborhoodPlaces(id, false), eligible, String(id));
    assert.ok(neighborhoodPlaces(id, false).some(place => place.category === 'grocery'));
    assert.ok(neighborhoodPlaces(id, false).some(place => place.category === 'restaurant'));
    assert.equal(getCommunityTransit(id), undefined);
  }
  const matched = NEIGHBORHOOD_PLACES.filter(place => place.communityIds.includes('estates-on-frankford') && !['fuel','carwash'].includes(place.category));
  assert.deepEqual(neighborhoodPlaces('estates-on-frankford', false), matched, 'known community keeps its researched local list');
});
