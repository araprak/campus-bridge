import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { mountPlaceReviews, type ReviewWidgetLibrary, type ReviewWidgetState } from '../src/lib/google-place-reviews.ts';
import { APARTMENT_GOOGLE_PLACES } from '../src/data/apartment-google-places.ts';
import { APARTMENTS } from '../src/data/local-options.ts';

class Element extends EventTarget {
  children: Element[] = [];
  options: Record<string, unknown>;
  place: { id: string } | null = null;
  places: Array<{ id: string }> = [];
  constructor(options: Record<string, unknown> = {}) { super(); this.options = options; }
  append(...children: Element[]) { this.children.push(...children); }
}
class Details extends Element {}
class Search extends Element {}
class PlaceRequest extends Element {}
class TextRequest extends Element {}
class Config extends Element {}
class Address extends Element {}
class Rating extends Element {}
class Reviews extends Element {}
const library = {
  PlaceDetailsElement: Details, PlaceSearchElement: Search,
  PlaceDetailsPlaceRequestElement: PlaceRequest, PlaceTextSearchRequestElement: TextRequest,
  PlaceContentConfigElement: Config, PlaceAddressElement: Address,
  PlaceRatingElement: Rating, PlaceReviewsElement: Reviews,
} as unknown as ReviewWidgetLibrary;

function harness(placeId?: string, timeoutMs = 1000, override = library) {
  let current: Element | undefined;
  const host = { replaceChildren(...children: unknown[]) { current = children[0] as Element | undefined; } };
  const states: ReviewWidgetState[] = [];
  const cleanup = mountPlaceReviews({ host, library: override, query: 'A community, 100 Main St, Richardson TX', placeId, timeoutMs, onState: state => states.push(state) });
  return { states, cleanup, get current() { return current!; } };
}

test('verified identities belong to the catalog and have unique sourced IDs', () => {
  const ids = new Set(APARTMENTS.map(apartment => apartment.id));
  const places = new Set<string>();
  for (const [id, place] of Object.entries(APARTMENT_GOOGLE_PLACES)) {
    assert.ok(ids.has(id));
    assert.match(place.placeId, /^ChIJ[A-Za-z0-9_-]+$/);
    assert.equal(places.has(place.placeId), false);
    places.add(place.placeId);
    assert.equal(new URL(place.sourceUrl).protocol, 'https:');
    assert.equal(new URL(place.listingUrl).protocol, 'https:');
    assert.match(place.verifiedOn, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('verified community opens its exact ID with rating, address and reviews', () => {
  const h = harness(APARTMENT_GOOGLE_PLACES.northside.placeId);
  try {
    assert.ok(h.current instanceof Details);
    assert.equal(h.current.children[0].options.place, APARTMENT_GOOGLE_PLACES.northside.placeId);
    assert.deepEqual(h.current.children[1].children.map(child => child.constructor), [Address, Rating, Reviews]);
    h.current.place = { id: APARTMENT_GOOGLE_PLACES.northside.placeId };
    h.current.dispatchEvent(new Event('gmp-load'));
    assert.deepEqual(h.states.at(-1), { phase: 'details', status: 'ready' });
  } finally { h.cleanup(); }
});

test('unmapped community requires selection of a returned listing before reviews load', () => {
  const h = harness();
  try {
    const search = h.current;
    assert.ok(search instanceof Search);
    assert.equal(search.children[0].options.textQuery, 'A community, 100 Main St, Richardson TX');
    assert.equal(search.children[0].options.maxResultCount, 3);
    search.places = [{ id: 'matching-result' }];
    search.dispatchEvent(new Event('gmp-load'));
    assert.equal(h.current, search);
    const wrong = Object.assign(new Event('gmp-select'), { place: { id: 'unreturned-result' } });
    search.dispatchEvent(wrong);
    assert.equal(h.current, search);
    search.dispatchEvent(Object.assign(new Event('gmp-select'), { place: { id: 'matching-result' } }));
    assert.ok(h.current instanceof Details);
    assert.equal(h.current.children[0].options.place, 'matching-result');
    const count = h.states.length;
    search.dispatchEvent(new Event('gmp-error'));
    assert.equal(h.states.length, count, 'old widget listeners are removed');
  } finally { h.cleanup(); }
});

test('empty results and service errors have distinct outcomes', () => {
  const empty = harness();
  empty.current.dispatchEvent(new Event('gmp-load'));
  assert.deepEqual(empty.states.at(-1), { phase: 'search', status: 'empty' });
  empty.cleanup();
  const failed = harness('known');
  failed.current.dispatchEvent(new Event('gmp-error'));
  assert.deepEqual(failed.states.at(-1), { phase: 'details', status: 'error' });
  failed.cleanup();
});

test('slow service times out and closing removes listeners and pending work', async () => {
  const timeout = harness('known', 5);
  await delay(15);
  assert.deepEqual(timeout.states.at(-1), { phase: 'details', status: 'timeout' });
  timeout.cleanup();
  const closed = harness('known', 5);
  const widget = closed.current;
  closed.cleanup();
  widget.dispatchEvent(new Event('gmp-load'));
  await delay(15);
  assert.deepEqual(closed.states, [{ phase: 'details', status: 'loading' }]);
  assert.equal(closed.current, undefined);
});

test('missing or incompatible widget implementation fails gracefully', () => {
  const h = harness('known', 1000, {} as ReviewWidgetLibrary);
  assert.deepEqual(h.states.at(-1), { phase: 'details', status: 'error' });
  h.cleanup();
});
