import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import {
  authCookieOptions, EMAIL_COOKIE, loginCodeDigest, loginDestination, PENDING_COOKIE,
  PERSIST_COOKIE, privateCookieOptions, readSealedCookie, REMEMBER_SECONDS, sealCookie, SIGNUP_COOKIE, readPendingSignup,
} from '../src/lib/session-policy.ts';

const secret = 'test-only-session-secret-with-at-least-thirty-two-characters';
const now = Date.parse('2026-10-02T12:00:00Z');
const deadline = now + REMEMBER_SECONDS * 1000;

test('sealed cookie requires the original purpose, secret, payload and signature', () => {
  const data = { email: 'student@example.invalid', expiresAt: deadline };
  const sealed = sealCookie(EMAIL_COOKIE, data, secret);
  assert.deepEqual(readSealedCookie(EMAIL_COOKIE, sealed, secret, now), data);
  assert.equal(readSealedCookie(PERSIST_COOKIE, sealed, secret, now), null);
  assert.equal(readSealedCookie(PENDING_COOKIE, sealed, secret, now), null);
  assert.equal(readSealedCookie(EMAIL_COOKIE, sealed, `${secret}-wrong`, now), null);
  const [payload, signature] = sealed.split('.');
  const alteredPayload = Buffer.from(JSON.stringify({ ...data, email: 'attacker@example.invalid' })).toString('base64url');
  assert.equal(readSealedCookie(EMAIL_COOKIE, `${alteredPayload}.${signature}`, secret, now), null);
  const alteredSignature = `${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`;
  assert.equal(readSealedCookie(EMAIL_COOKIE, `${payload}.${alteredSignature}`, secret, now), null);
});

test('cookie expiry is strict and excessive or malformed payloads fail closed', () => {
  const cookie = (data: Record<string, unknown>) => sealCookie(PERSIST_COOKIE, data, secret);
  assert.equal(readSealedCookie(PERSIST_COOKIE, cookie({ expiresAt: now }), secret, now), null);
  assert.equal(readSealedCookie(PERSIST_COOKIE, cookie({ expiresAt: now - 1 }), secret, now), null);
  assert.equal(readSealedCookie(PERSIST_COOKIE, cookie({ expiresAt: deadline + 60_001 }), secret, now), null);
  assert.equal(readSealedCookie(PERSIST_COOKIE, cookie({ expiresAt: String(deadline) }), secret, now), null);
  assert.equal(readSealedCookie(PERSIST_COOKIE, cookie({ unrelated: deadline }), secret, now), null);
  const valid = cookie({ expiresAt: deadline });
  for (const malformed of [undefined, '', '.', 'no-signature', 'abc.def.ghi', `${valid}.`, `${valid}..junk`, 'x'.repeat(2049)]) {
    assert.equal(readSealedCookie(PERSIST_COOKIE, malformed, secret, now), null);
  }
  assert.throws(() => sealCookie(PERSIST_COOKIE, { expiresAt: deadline }, 'short'), /unavailable/);
  assert.equal(readSealedCookie(PERSIST_COOKIE, cookie({ expiresAt: deadline }), 'short', now), null);
});

test('remembering a session uses a fixed deadline rather than a rolling refresh period', () => {
  const persistence = sealCookie(PERSIST_COOKIE, { expiresAt: deadline }, secret);
  const first = authCookieOptions('auth-token', { maxAge: 400 * 24 * 60 * 60 }, persistence, secret, now, true);
  const later = authCookieOptions('refreshed-auth-token', { maxAge: 400 * 24 * 60 * 60 }, persistence, secret, now + 25 * 24 * 60 * 60 * 1000, true);
  assert.ok('maxAge' in first && 'expires' in first);
  assert.ok('maxAge' in later && 'expires' in later);
  assert.equal(first.maxAge, REMEMBER_SECONDS);
  assert.equal(later.maxAge, 5 * 24 * 60 * 60);
  assert.equal(first.expires?.getTime(), deadline);
  assert.equal(later.expires?.getTime(), deadline);
  assert.equal(first.httpOnly, true);
  assert.equal(first.secure, true);
  assert.equal(first.sameSite, 'lax');
  assert.equal(first.path, '/');
});

test('unremembered, expired, forged and wrong-purpose preferences cannot retain a long-lived Auth cookie', () => {
  const remembered = sealCookie(PERSIST_COOKIE, { expiresAt: deadline }, secret);
  const wrongPurpose = sealCookie(EMAIL_COOKIE, { expiresAt: deadline }, secret);
  const expired = sealCookie(PERSIST_COOKIE, { expiresAt: now }, secret);
  const oversized = sealCookie(PERSIST_COOKIE, { expiresAt: deadline + 90_000 }, secret);
  for (const persistence of [undefined, `${remembered}x`, wrongPurpose, expired, oversized]) {
    const options = authCookieOptions('auth-token', { maxAge: 400 * 24 * 60 * 60, expires: new Date('2099-01-01') }, persistence, secret, now, true);
    assert.deepEqual(options, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
    assert.equal('maxAge' in options, false);
    assert.equal('expires' in options, false);
  }
});

test('cookie removal overrides a valid remembered preference', () => {
  const persistence = sealCookie(PERSIST_COOKIE, { expiresAt: deadline }, secret);
  for (const [value, original] of [['', { maxAge: REMEMBER_SECONDS }], ['old-chunk', { maxAge: 0 }]] as const) {
    const options = authCookieOptions(value, original, persistence, secret, now, true);
    assert.ok('maxAge' in options && 'expires' in options);
    assert.equal(options.maxAge, 0);
    assert.equal(options.expires?.getTime(), 0);
    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, 'lax');
  }
  assert.deepEqual(privateCookieOptions(false), { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
});

test('login-code HMAC binds the user, Auth session, normalized login email, code and server secret', () => {
  const digest = loginCodeDigest(secret, 'user-a', 'session-a', 'Student@Example.Invalid', '012345');
  assert.match(digest, /^[a-f0-9]{64}$/);
  assert.equal(loginCodeDigest(secret, 'user-a', 'session-a', 'student@example.invalid', '012345'), digest);
  const variants = [
    loginCodeDigest(secret, 'user-b', 'session-a', 'student@example.invalid', '012345'),
    loginCodeDigest(secret, 'user-a', 'session-b', 'student@example.invalid', '012345'),
    loginCodeDigest(secret, 'user-a', 'session-a', 'other@example.invalid', '012345'),
    loginCodeDigest(secret, 'user-a', 'session-a', 'student@example.invalid', '012346'),
    loginCodeDigest(`${secret}-other`, 'user-a', 'session-a', 'student@example.invalid', '012345'),
  ];
  for (const variant of variants) assert.notEqual(variant, digest);
  // An existing UTD-verification code digest must not double as a login-code digest.
  const institutionDigest = createHmac('sha256', secret).update(JSON.stringify(['user-a', 'student@example.invalid', '012345'])).digest('hex');
  assert.notEqual(institutionDigest, digest);
});

test('post-verification redirects accept only the explicit recovery destination', () => {
  assert.equal(loginDestination('reset-password'), '/reset-password');
  for (const next of [undefined, null, '', 'dashboard', '/reset-password', 'https://attacker.invalid', '//attacker.invalid', 'javascript:alert(1)', '../account', ['reset-password'], { next: 'reset-password' }]) {
    assert.equal(loginDestination(next), '/dashboard');
  }
});


test('signup context is short-lived, signed and strictly bound to an email and verified session', () => {
  const pending = { email: 'student@example.invalid', remembered: true, expiresAt: now + 30 * 60_000 };
  const cookie = (data: Record<string, unknown>) => sealCookie(SIGNUP_COOKIE, data, secret);
  assert.deepEqual(readPendingSignup(cookie(pending), secret, now), pending);
  const verified = { ...pending, verifiedSessionId: '20000000-0000-4000-8000-000000000001' };
  assert.deepEqual(readPendingSignup(cookie(verified), secret, now), verified);
  for (const altered of [
    { ...pending, email: '' }, { ...pending, email: 'invalid' }, { ...pending, remembered: 'true' },
    { ...pending, expiresAt: now }, { ...pending, expiresAt: now + 31 * 60_000 },
    { ...pending, verifiedSessionId: 'wrong-session' }, { ...pending, verifiedSessionId: 12 },
  ]) assert.equal(readPendingSignup(cookie(altered), secret, now), null);
  assert.equal(readPendingSignup(cookie(pending) + 'x', secret, now), null);
  assert.equal(readPendingSignup(sealCookie(PENDING_COOKIE, pending, secret), secret, now), null);
});
