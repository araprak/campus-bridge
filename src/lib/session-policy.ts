import { createHmac, timingSafeEqual } from 'node:crypto';

export const REMEMBER_SECONDS = 30 * 24 * 60 * 60;
export const PERSIST_COOKIE = 'cb-session-persistence';
export const EMAIL_COOKIE = 'cb-remembered-email';
export const PENDING_COOKIE = 'cb-pending-login';
export const SIGNUP_COOKIE = 'cb-pending-signup';

export type PendingSignup = { email: string; remembered: boolean; expiresAt: number; verifiedSessionId?: string };
export function readPendingSignup(value: string | undefined, secret: string, now = Date.now()): PendingSignup | null {
  const data = readSealedCookie(SIGNUP_COOKIE, value, secret, now);
  if (!data || typeof data.email !== 'string' || data.email.length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) || typeof data.remembered !== 'boolean'
    || (data.expiresAt as number) > now + 30 * 60_000
    || (data.verifiedSessionId !== undefined && (typeof data.verifiedSessionId !== 'string'
      || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(data.verifiedSessionId)))) return null;
  return data as PendingSignup;
}

export function sealCookie(purpose: string, data: Record<string, unknown>, secret: string) {
  if (secret.length < 32) throw new Error('Session protection is unavailable.');
  const value = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${purpose}.${value}`).digest('base64url');
  return `${value}.${signature}`;
}

export function readSealedCookie(purpose: string, value: string | undefined, secret: string, now = Date.now()): Record<string, unknown> | null {
  if (!value || value.length > 2048 || secret.length < 32) return null;
  try {
    const parts = value.split('.');
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;
    if (!payload || !signature) return null;
    const expected = createHmac('sha256', secret).update(`${purpose}.${payload}`).digest();
    const received = Buffer.from(signature, 'base64url');
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data || typeof data !== 'object' || typeof data.expiresAt !== 'number'
      || data.expiresAt <= now || data.expiresAt > now + REMEMBER_SECONDS * 1000 + 60_000) return null;
    return data;
  } catch { return null; }
}

export function privateCookieOptions(secure = process.env.NODE_ENV === 'production') {
  return { httpOnly: true, secure, sameSite: 'lax' as const, path: '/' };
}

// SSR supplies its own long maxAge; override it at the cookie write boundary.
// The signed fixed deadline ensures refresh never starts a new 30-day period.
export function authCookieOptions(value: string, original: { maxAge?: number; expires?: Date } = {}, persistence?: string, secret = '', now = Date.now(), secure = process.env.NODE_ENV === 'production') {
  const base = privateCookieOptions(secure);
  if (!value || original.maxAge === 0) return { ...base, maxAge: 0, expires: new Date(0) };
  const saved = readSealedCookie(PERSIST_COOKIE, persistence, secret, now);
  if (!saved) return base;
  const expiresAt = saved.expiresAt as number;
  return { ...base, maxAge: Math.max(1, Math.floor((expiresAt - now) / 1000)), expires: new Date(expiresAt) };
}

export function loginCodeDigest(secret: string, userId: string, sessionId: string, email: string, code: string) {
  return createHmac('sha256', secret).update(JSON.stringify(['campusbridge-login-v1', userId, sessionId, email.toLowerCase(), code])).digest('hex');
}

export function loginDestination(next: unknown) {
  return next === 'reset-password' ? '/reset-password' : '/dashboard';
}
