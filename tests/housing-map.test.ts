import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPUS_REFERENCE, HOUSING_DISTANCES_UPDATED } from '../src/data/local-options.ts';
import { CAMPUS_ESSENTIALS, CAMPUS_GUIDE_REVIEWED, CAMPUS_PLACES } from '../src/data/campus-guide.ts';
import { COMMUNITY_TRANSIT, TRANSIT_FEED_END, TRANSIT_REVIEWED } from '../src/data/community-transit.ts';
import { NEIGHBORHOOD_PLACES, NEIGHBORHOOD_REVIEWED } from '../src/data/neighborhood-places.ts';
import { CURATED_MAP_LOCATIONS, MAP_LAYER_LABELS, directionsUrl } from '../src/domain/housing-map.ts';

test('curated map pins have unique stable IDs, source dates, and valid public coordinates', () => {
  assert.equal(new Set(CURATED_MAP_LOCATIONS.map(location => location.id)).size, CURATED_MAP_LOCATIONS.length);
  const pointSources = [CAMPUS_REFERENCE, ...CAMPUS_PLACES, ...NEIGHBORHOOD_PLACES.flatMap(place => place.coordinates ? [place.coordinates] : []), ...Object.values(COMMUNITY_TRANSIT).flatMap(community => community.stops)];
  for (const location of CURATED_MAP_LOCATIONS) {
    assert.match(location.id, /^(campus|nearby|essential|transit-stop)-[a-z0-9-]+$/);
    assert.ok(location.name.length > 0);
    assert.ok(Number.isFinite(location.latitude) && location.latitude > 32.9 && location.latitude < 33.1, location.id);
    assert.ok(Number.isFinite(location.longitude) && location.longitude > -96.85 && location.longitude < -96.6, location.id);
    assert.ok(pointSources.some(point => point.latitude === location.latitude && point.longitude === location.longitude), `${location.id}: new or altered coordinate`);
    assert.equal(new URL(location.sourceUrl).protocol, 'https:');
    assert.equal(new URL(location.url!).protocol, 'https:');
    assert.doesNotMatch(new URL(location.sourceUrl).pathname, /\.(zip|gz|tar|csv)$/i, `${location.id}: accidental download`);
    assert.match(location.reviewedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(location.note);
    assert.ok(Object.hasOwn(MAP_LAYER_LABELS, location.layer));
    assert.notEqual(location.layer, 'apartments', 'apartments come from the existing filtered directory');
  }
});

test('campus pins retain their existing sources and distinguish buildings from exact entrances', () => {
  const campus = CURATED_MAP_LOCATIONS.filter(location => location.layer === 'campus');
  assert.equal(campus.length, CAMPUS_PLACES.length + 1);
  const reference = campus.find(location => location.id === 'campus-address')!;
  assert.equal(reference.sourceUrl, CAMPUS_REFERENCE.url);
  assert.equal(reference.reviewedOn, HOUSING_DISTANCES_UPDATED);
  assert.match(reference.note!, /not the campus center/);
  for (const place of CAMPUS_PLACES) {
    const location = campus.find(location => location.id === `campus-${place.id}`)!;
    assert.equal(location.sourceUrl, place.coordinateSourceUrl);
    assert.equal(location.url, place.sourceUrl);
    assert.equal(location.reviewedOn, CAMPUS_GUIDE_REVIEWED);
    assert.match(location.note!, /Building pin only/);
  }
  for (const essential of CAMPUS_ESSENTIALS) {
    const location = CURATED_MAP_LOCATIONS.find(location => location.id === `essential-${essential.id}`)!;
    const place = CAMPUS_PLACES.find(place => place.id === essential.placeId)!;
    assert.equal(location.layer, 'essentials');
    assert.equal(location.sourceUrl, place.coordinateSourceUrl);
    assert.equal(location.url, essential.url);
    assert.equal(location.reviewedOn, CAMPUS_GUIDE_REVIEWED);
    assert.match(location.note!, /Building pin only/);
  }
});

test('nearby layers reuse the curated directory, omit fuel and car washes, and keep approximate notes', () => {
  const nearby = CURATED_MAP_LOCATIONS.filter(location => location.id.startsWith('nearby-'));
  const expected = NEIGHBORHOOD_PLACES.filter(place => place.category !== 'fuel' && place.category !== 'carwash' && place.coordinates);
  assert.equal(nearby.length, expected.length);
  for (const place of expected) {
    const location = nearby.find(location => location.id === `nearby-${place.id}`)!;
    assert.equal(location.sourceUrl, place.coordinates!.sourceUrl);
    assert.equal(location.url, place.url);
    assert.equal(location.reviewedOn, NEIGHBORHOOD_REVIEWED);
    assert.ok(location.note!.includes(place.description));
    if (place.coordinates!.sourceUrl.startsWith('https://geocoding.geo.census.gov/')) assert.match(location.note!, /Approximate street-address point/);
  }
  for (const excluded of NEIGHBORHOOD_PLACES.filter(place => place.category === 'fuel' || place.category === 'carwash')) {
    assert.equal(nearby.some(location => location.id === `nearby-${excluded.id}`), false);
  }
});

test('transit pins deduplicate stops across communities and keep route and snapshot limits', () => {
  const pins = CURATED_MAP_LOCATIONS.filter(location => location.layer === 'transportation');
  const stops = Object.values(COMMUNITY_TRANSIT).flatMap(community => community.stops);
  assert.equal(pins.length, new Set(stops.map(stop => stop.id)).size);
  for (const stop of stops) {
    const location = pins.find(location => location.id === `transit-stop-${stop.id}`)!;
    assert.equal(location.name, stop.name);
    assert.equal(location.latitude, stop.latitude);
    assert.equal(location.longitude, stop.longitude);
    assert.equal(location.reviewedOn, TRANSIT_REVIEWED);
    assert.equal(location.sourceUrl, 'https://www.dart.org/about/about-dart/fixed-route-schedule');
    assert.ok(location.note!.includes(TRANSIT_FEED_END));
    for (const route of stop.routeIds) assert.ok(location.note!.includes(route));
    assert.match(location.note!, /not a walking route or travel time/);
    assert.match(location.note!, /Confirm current service/);
  }
});

test('directions share only a valid public destination and no stored origin or profile answers', () => {
  for (const location of CURATED_MAP_LOCATIONS) {
    const url = new URL(directionsUrl(location));
    assert.equal(url.origin, 'https://www.google.com');
    assert.equal(url.pathname, '/maps/dir/');
    assert.equal(url.searchParams.get('api'), '1');
    assert.equal(url.searchParams.get('destination'), `${location.latitude},${location.longitude}`);
    assert.deepEqual([...url.searchParams.keys()].sort(), ['api', 'destination']);
  }
  for (const [latitude, longitude] of [[NaN, 1], [1, Infinity], [-91, 1], [91, 1], [1, -181], [1, 181]]) {
    assert.throws(() => directionsUrl({ latitude, longitude }), RangeError);
  }
});
