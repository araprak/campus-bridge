import { accountsEnabled, adminClient, assertOrigin, jsonBody, reply, serverClient } from '@/lib/server';
import { finishLogin, loginIdentity, pendingSignup, savePendingSignup, clearLoginCookies } from '@/lib/login-session';
import { loginDestination } from '@/lib/session-policy';

export async function POST(request: Request) {
  try { assertOrigin(request); } catch { return reply({ error: 'Please reopen CampusBridge and try again.' }, 403); }
  if (!accountsEnabled()) return reply({ error: 'Email sign-in is temporarily unavailable. Please try again shortly.' }, 503);
  try {
    const body = await jsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['action', 'code', 'next', 'flow'].includes(key))) return reply({ error: 'Invalid verification request.' }, 400);
    if (!['send', 'redeem'].includes(body.action)) return reply({ error: 'Invalid verification action.' }, 400);
    if (body.flow !== undefined && body.flow !== 'signup' && body.flow !== 'signin') return reply({ error: 'Invalid verification request.' }, 400);
    if (body.flow === 'signup') return await verifySignup(body);
    // Retired sign-in-code requests never send email or grant a session.
    const { loginVerified } = await loginIdentity();
    return loginVerified ? reply({ redirect: loginDestination(body.next) })
      : reply({ error: 'Log in with your email and password.', redirect: '/login' }, 403);
  } catch { return reply({ error: 'The sign-in check could not be completed. Please try again.' }, 503); }
}

async function verifySignup(body: { action: string; code?: unknown }) {
  const pending = await pendingSignup();
  if (!pending) return reply({ error: 'Your signup session expired. Log in with your email and password to request a new code.', redirect: '/login' }, 401);
  const client = await serverClient();
  if (body.action === 'send' && !pending.verifiedSessionId) {
    const { error } = await client.auth.resend({ type: 'signup', email: pending.email });
    if (error) return reply({ error: error.status === 429 ? 'Please wait before requesting another code.' : 'Email delivery could not be confirmed. If a code arrives, enter it here. Otherwise wait and resend.', retryAfter: 60 }, error.status === 429 ? 429 : 503);
    return reply({ message: 'A new six-digit code is on its way. Check your inbox and spam folder.', retryAfter: 60 });
  }
  if (!pending.verifiedSessionId) {
    if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) return reply({ error: 'Enter the six-digit code from your email.' }, 400);
    const { data, error } = await client.auth.verifyOtp({ email: pending.email, token: body.code, type: 'email' });
    if (error || !data.session || !data.user?.email_confirmed_at || data.user.email?.toLowerCase() !== pending.email) {
      return reply({ error: error?.status === 429 ? 'Too many attempts. Please wait before trying again.' : 'That code is incorrect, expired, or already used. Request a new code if needed.' }, error?.status === 429 ? 429 : 400);
    }
    // This token came directly from Auth's successful verification response. Read only
    // its session binding here; live identity and database checks still gate access below.
    const claims = JSON.parse(Buffer.from(data.session.access_token.split('.')[1], 'base64url').toString());
    if (claims.sub !== data.user.id || typeof claims.session_id !== 'string'
      || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(claims.session_id)) return reply({ error: 'Your email was confirmed. Please log in to continue.', redirect: '/login' }, 401);
    pending.verifiedSessionId = claims.session_id;
    // Preserve proof of this exact session so a transient database failure can be retried
    // without consuming another code or trusting an unrelated existing Auth session.
    await savePendingSignup(pending);
  }
  try {
  const context = await loginIdentity(client);
  if (!context.sessionId || context.sessionId !== pending.verifiedSessionId || context.user?.email?.toLowerCase() !== pending.email) {
    return reply({ error: 'Your session changed. Please log in again.', redirect: '/login' }, 401);
  }
  const { data, error } = await adminClient().rpc('approve_email_otp_login', {
    p_user: context.user.id, p_session: context.sessionId, p_remember: pending.remembered,
  });
  if (error?.message.includes('not_authorized') || error?.message.includes('invalid_confirmation')) {
    await client.auth.signOut({ scope: 'local' });
    await clearLoginCookies();
    return reply({ error: 'Your verification session expired. Please log in again.', redirect: '/login' }, 401);
  }
  if (error || !data) return reply({ error: 'Your code was accepted, but we could not open your account. Try Verify and continue again.', codeAccepted: true }, 503);
  await finishLogin(data);
  return reply({ redirect: '/dashboard' });
  } catch {
    return reply({ error: 'Your code was accepted, but we could not open your account. Try Verify and continue again.', codeAccepted: true }, 503);
  }
}
