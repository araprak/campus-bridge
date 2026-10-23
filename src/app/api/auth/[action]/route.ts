import { accountsEnabled, assertOrigin, jsonBody, reply, serverClient, siteUrl } from '@/lib/server';
import { isUniversitySignupEmail } from '@/lib/personal-email';
import { clearLoginCookies, completePasswordLogin, loginIdentity, passwordRecoveryAllowed, revokeLogin, startPendingSignup } from '@/lib/login-session';

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  try { assertOrigin(request); } catch { return reply({ error: 'Please reopen CampusBridge and try again.' }, 403); }
  try {
    const { action } = await params;
    if (action === 'signout') {
      const context = await loginIdentity();
      if (context.user && context.sessionId) await revokeLogin(context.user.id, context.sessionId);
      const { error } = await context.client.auth.signOut({ scope: 'local' });
      if (error) return reply({ error: 'Could not sign out. Please try again.' }, 503);
      await clearLoginCookies(); return reply({ ok: true });
    }
    if (!accountsEnabled()) return reply({ error: 'Account access is temporarily unavailable. Please try again shortly.' }, 503);
    const body = await jsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({ error: 'Please check your details.' }, 400);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (['signup', 'signin', 'recover'].includes(action) && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) return reply({ error: 'Enter a valid email address.' }, 400);
    if (['signup', 'reset'].includes(action) && (password.length < 12 || password.length > 128)) return reply({ error: 'Use a password with 12–128 characters.' }, 400);
    if (action === 'signup' && isUniversitySignupEmail(email)) return reply({ error: 'Use your personal email to create an account. You can add your UTD email later in Campus Support. Already signed up with a university email? Keep using it to log in.' }, 400);
    if (['signup', 'signin'].includes(action) && body.rememberMe !== undefined && typeof body.rememberMe !== 'boolean') return reply({ error: 'Please check your login details.' }, 400);
    const client = await serverClient();
    if (action === 'signup') {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) return reply({ error: error.status === 429 ? 'Please wait before requesting another email. Try again in a minute.' : 'We could not complete signup. Check your details or try again shortly.' }, error.status === 429 ? 429 : 400);
      // Confirm-email must remain enabled. Never grant plan access from signup alone.
      if (data.session) {
        await client.auth.signOut({ scope: 'local' });
        await clearLoginCookies();
        return reply({ error: 'Email confirmation is temporarily unavailable. Please try again shortly.' }, 503);
      }
      // Supabase deliberately hides whether an address already has an account.
      if (data.user?.identities?.length === 0) return reply({ message: 'If you already have an account, log in or reset your password. Otherwise, check your email and try again shortly.' });
      await startPendingSignup(email, body.rememberMe === true);
      return reply({ redirect: '/verify-login?flow=signup&sent=1' });
    }
    if (action === 'signin') {
      if (!password || password.length > 128 || (body.rememberMe !== undefined && typeof body.rememberMe !== 'boolean')) return reply({ error: 'Please check your login details.' }, 400);
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error?.code === 'email_not_confirmed') {
        // Auth checks the password before returning this error. Resume an unfinished signup.
        const sent = await client.auth.resend({ type: 'signup', email });
        await startPendingSignup(email, body.rememberMe === true);
        return reply({ redirect: `/verify-login?flow=signup&sent=${sent.error ? '0' : '1'}` });
      }
      if (error) return reply({ error: error.status === 429 ? 'Too many login attempts. Please wait a little before trying again.' : 'Unable to sign in. Check your email and password, or reset your password.' }, error.status === 429 ? 429 : 400);
      const context = await loginIdentity(client);
      if (!context.user || !context.sessionId) return reply({ error: 'Your login could not be confirmed. Please try again.' }, 503);
      await completePasswordLogin(context, body.rememberMe === true);
      return reply({ redirect: '/dashboard' });
    }
    if (action === 'recover') {
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${siteUrl()}/auth/callback?flow=recovery` });
      if (error) return reply({ error: 'We could not request a reset email right now. Please try again shortly.' }, 503);
      return reply({ message: 'If this address has an account, a password reset link has been requested. Check your inbox.' });
    }
    if (action === 'reset') {
      const context = await loginIdentity(client);
      const { user, loginVerified } = context;
      if (!user) return reply({ error: 'Your recovery session expired. Request a new reset link.' }, 401);
      if (!loginVerified && !await passwordRecoveryAllowed(context)) return reply({ error: 'Your recovery session expired. Request a new reset link.', redirect: '/forgot-password' }, 403);
      const { error } = await client.auth.updateUser({ password });
      if (error) return reply({ error: 'Your password could not be changed. Try a new recovery link.' }, 400);
      // The database trigger also revokes grants for direct Auth password changes.
      await revokeLogin(user.id);
      await client.auth.signOut({ scope: 'global' });
      await clearLoginCookies();
      return reply({ redirect: '/login?reset=success' });
    }
    return reply({ error: 'This action is not available.' }, 404);
  } catch { return reply({ error: 'The request could not be completed. Please try again.' }, 503); }
}
