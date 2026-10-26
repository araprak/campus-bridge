import test from 'node:test';
import assert from 'node:assert/strict';
import { siteGroupForHost, allowedRequestOrigin } from '../src/domain/site-groups.ts';

test('only exact assigned subdomains select group features', () => {
  assert.equal(siteGroupForHost('grp-a.campusbridgeguide.com'), 'a');
  assert.equal(siteGroupForHost('GRP-B.CAMPUSBRIDGEGUIDE.COM'), 'b');
  for (const host of ['campusbridgeguide.com', 'www.campusbridgeguide.com', 'grp-a.campusbridgeguide.com.evil.test', 'grp-a.campusbridgeguide.com:443', 'evil.test,grp-a.campusbridgeguide.com', 'grp-a.campusbridgeguide.com@evil.test', null]) assert.equal(siteGroupForHost(host), null);
  assert.equal(siteGroupForHost('grp-a.localhost:4180'), null);
  assert.equal(siteGroupForHost('grp-a.localhost:4180', true), 'a');
  assert.equal(siteGroupForHost('grp-b.localhost:4180', true), 'b');
});

test('group API writes require a trusted origin matching the request origin', () => {
  const canonical = 'https://campusbridgeguide.com';
  for (const origin of [canonical, 'https://grp-a.campusbridgeguide.com', 'https://grp-b.campusbridgeguide.com']) assert.equal(allowedRequestOrigin(origin, `${origin}/api/account`, canonical), true);
  assert.equal(allowedRequestOrigin('https://grp-a.campusbridgeguide.com', `${canonical}/api/account`, canonical), false);
  for (const origin of [null, 'null', 'https://evil.test', 'https://grp-a.campusbridgeguide.com.evil.test', 'https://grp-a.campusbridgeguide.com/', 'http://grp-a.campusbridgeguide.com']) assert.equal(allowedRequestOrigin(origin, `${origin}/api/account`, canonical), false);
  assert.equal(allowedRequestOrigin('https://preview.vercel.app', 'https://preview.vercel.app/api/account', canonical, 'preview.vercel.app'), true);
  assert.equal(allowedRequestOrigin('https://other.vercel.app', 'https://other.vercel.app/api/account', canonical, 'preview.vercel.app'), false);
  assert.equal(allowedRequestOrigin('http://grp-b.localhost:4180', 'http://grp-b.localhost:4180/api/account', canonical, undefined, true), true);
  assert.equal(allowedRequestOrigin('http://grp-b.localhost:4180', 'http://grp-b.localhost:4180/api/account', canonical), false);
  assert.equal(allowedRequestOrigin('http://grp-a.localhost:4180', 'http://127.0.0.1:4180/api/account', canonical, undefined, true, 'grp-a.localhost:4180'), true);
  assert.equal(allowedRequestOrigin('https://grp-a.campusbridgeguide.com', 'http://127.0.0.1:3000/api/account', canonical, undefined, false, 'grp-a.campusbridgeguide.com'), true);
  assert.equal(allowedRequestOrigin('https://grp-a.campusbridgeguide.com', 'http://127.0.0.1:3000/api/account', canonical, undefined, false, 'campusbridgeguide.com'), false);
});
