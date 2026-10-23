import test from 'node:test';
import assert from 'node:assert/strict';
import { APARTMENTS } from '../src/data/local-options.ts';
import { APARTMENT_DISCOVERY_DETAILS } from '../src/data/apartment-discovery-details.ts';

test('supplemental apartment links resolve to existing identities and public pages, never research downloads', () => {
  const ids = new Set(APARTMENTS.map(a => a.id));
  for (const [id, details] of Object.entries(APARTMENT_DISCOVERY_DETAILS)) {
    assert.ok(ids.has(id));
    assert.match(details.identityReviewedOn, /^\d{4}-\d{2}-\d{2}$/);
    const links = [details.identitySourceUrl, ...details.officialDetailsLinks.map(l => l.url), ...details.reviewLinks.flatMap(l => [l.url, l.sourceUrl])];
    for (const link of links) {
      const url = new URL(link);
      assert.equal(url.protocol, 'https:');
      assert.equal(url.username + url.password, '');
      assert.doesNotMatch(url.pathname, /\.(zip|csv|json|gz|tar)$/i);
      assert.doesNotMatch(url.hostname, /overpass|geocoding\.geo\.census/);
    }
    for (const link of details.reviewLinks) {
      assert.match(link.verifiedOn, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(link.label.includes('listing'));
    }
  }
});
