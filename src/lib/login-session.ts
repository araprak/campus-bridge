import 'server-only';
import { cookies } from 'next/headers';
import { adminClient, serverClient } from './server';
import { authCookieOptions, EMAIL_COOKIE, PENDING_COOKIE, PERSIST_COOKIE, privateCookieOptions, readSealedCookie, sealCookie, SIGNUP_COOKIE, readPendingSignup, type PendingSignup } from './session-policy';

const secret = () => process.env.VERIFICATION_SECRET || '';
export async function loginIdentity(client?: Awaited<ReturnType<typeof serverClient>>) {
  client ??= await serverClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { client, user: null, sessionId: null, loginVerified: false };
  const claims = await client.auth.getClaims();
  const sessionId = claims.data?.claims.session_id;
  if (claims.error || claims.data?.claims.sub !== data.user.id || typeof sessionId !== 'string'
    || !/^[a-f0-9-]{36}$/i.test(sessionId)) return { client, user: null, sessionId: null, loginVerified: false };
  const approval = await client.rpc('is_login_verified');
  if (approval.error) throw new Error('Your sign-in could not be checked. Please try again shortly.');
  return { client, user: data.user, sessionId, loginVerified: approval.data === true };
}
export type LoginIdentity = Awaited<ReturnType<typeof loginIdentity>>;

export async function rememberedLogin() {
  const value = readSealedCookie(EMAIL_COOKIE, (await cookies()).get(EMAIL_COOKIE)?.value, secret());
  return { email: typeof value?.email === 'string' ? value.email : '', remembered: !!value };
}
// Password authentication is sufficient for returning accounts. The server-only
// approval checks fresh Auth evidence and retains the existing scoped plan gate.
export async function completePasswordLogin(identity: LoginIdentity, remembered: boolean) {
  const { user, sessionId } = identity;
  if (!user?.email_confirmed_at || !sessionId) throw new Error('Please log in again.');
  const { data, error } = await adminClient().rpc('approve_password_login', {
    p_user: user.id, p_session: sessionId, p_remember: remembered,
  });
  if (error || !data) throw new Error('Your login could not be completed. Please try again.');
  await finishLogin(data);
}

// A recovery link proves access to the mailbox. It permits password replacement
// for this live recovery session without granting access to the saved plan.
export async function passwordRecoveryAllowed(identity: LoginIdentity) {
  if (!identity.user?.email_confirmed_at || !identity.sessionId) return false;
  const { data, error } = await adminClient().rpc('is_password_recovery_session', {
    p_user: identity.user.id, p_session: identity.sessionId,
  });
  if (error) throw new Error('Your recovery session could not be checked. Please try again.');
  return data === true;
}

export async function finishLogin(approval: { remembered: boolean; expires_at: string; email: string }) {
  const expiresAt = Date.parse(approval.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) throw new Error('Your session expired. Please log in again.');
  const jar = await cookies();
  let persistence: string | undefined;
  if (approval.remembered) {
    persistence = sealCookie(PERSIST_COOKIE, { expiresAt }, secret());
    const options = { ...privateCookieOptions(), expires: new Date(expiresAt), maxAge: Math.floor((expiresAt - Date.now()) / 1000) };
    jar.set(PERSIST_COOKIE, persistence, options);
    jar.set(EMAIL_COOKIE, sealCookie(EMAIL_COOKIE, { email: approval.email, expiresAt }, secret()), options);
  } else {
    jar.delete(PERSIST_COOKIE); jar.delete(EMAIL_COOKIE);
  }
  const key = authCookieKey();
  for (const { name, value } of jar.getAll()) {
    if (name === key || name.startsWith(`${key}.`)) jar.set(name, value, authCookieOptions(value, {}, persistence, secret()));
  }
  jar.delete(PENDING_COOKIE);
  jar.delete(SIGNUP_COOKIE);
}

function authCookieKey() {
  return `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`;
}
export async function clearLoginCookies(forgetEmail = false) {
  const jar = await cookies(); const key = authCookieKey();
  for (const { name } of jar.getAll()) {
    if (name === key || name.startsWith(`${key}.`) || name.startsWith(`${key}-`)) jar.delete(name);
  }
  jar.delete(PERSIST_COOKIE); jar.delete(PENDING_COOKIE); jar.delete(SIGNUP_COOKIE);
  if (forgetEmail) jar.delete(EMAIL_COOKIE);
}

export async function revokeLogin(userId: string, sessionId: string | null = null) {
  const result = await adminClient().rpc('revoke_login_sessions', { p_user: userId, p_session: sessionId });
  if (result.error) throw new Error('Your session could not be closed. Please try again.');
}

export async function pendingSignup() {
  return readPendingSignup((await cookies()).get(SIGNUP_COOKIE)?.value, secret());
}
export async function savePendingSignup(pending: PendingSignup) {
  (await cookies()).set(SIGNUP_COOKIE, sealCookie(SIGNUP_COOKIE, pending, secret()), privateCookieOptions());
}
export async function startPendingSignup(email: string, remembered: boolean) {
  await clearLoginCookies(!remembered);
  await savePendingSignup({ email: email.toLowerCase(), remembered, expiresAt: Date.now() + 30 * 60_000 });
}
