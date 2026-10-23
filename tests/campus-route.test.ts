import test from 'node:test';
import assert from 'node:assert/strict';
import { campusRouteUrl, defaultRouteOrigin, campusDestination, CAMPUS_ROUTE_DESTINATION, ROUTE_MODES } from '../src/domain/campus-route.ts';
import { APARTMENTS } from '../src/data/local-options.ts';

test('all travel modes produce encoded explicit-origin Google Maps routes without credentials', () => {
  for (const mode of ROUTE_MODES) {
    const url = new URL(campusRouteUrl('  12 A & B Street, Richardson, TX  ', campusDestination('jsom'), mode)!);
    assert.equal(url.origin, 'https://www.google.com');
    assert.equal(url.pathname, '/maps/dir/');
    assert.equal(url.searchParams.get('api'), '1');
    assert.equal(url.searchParams.get('origin'), '12 A & B Street, Richardson, TX');
    assert.match(url.searchParams.get('destination')!, /Jindal School of Management/);
    assert.equal(url.searchParams.get('travelmode'), mode);
    assert.equal(url.searchParams.has('key'), false);
    assert.equal(url.searchParams.has('dir_action'), false);
  }
});

test('only an active off-campus home can become the route origin', () => {
  const home = APARTMENTS[0];
  assert.equal(defaultRouteOrigin({housingLocation: 'off_campus', housingCommunity: home.id}), `${home.name}, ${home.address}`);
  assert.equal(defaultRouteOrigin({housingLocation: 'on_campus', housingCommunity: home.id}), CAMPUS_ROUTE_DESTINATION);
  assert.equal(defaultRouteOrigin({housingLocation: 'off_campus', housingCommunity: 'unknown'}), CAMPUS_ROUTE_DESTINATION);
});

test('empty or oversized origins never become location-implicit navigation', () => {
  assert.equal(campusRouteUrl(' ', campusDestination('su'), 'walking'), null);
  assert.equal(campusRouteUrl('x'.repeat(301), campusDestination('su'), 'walking'), null);
  assert.equal(campusRouteUrl('路'.repeat(300), campusDestination('su'), 'walking'), null);
  assert.equal(campusRouteUrl('Start', '', 'walking'), null);
  assert.equal(campusDestination('unknown'), CAMPUS_ROUTE_DESTINATION);
});
