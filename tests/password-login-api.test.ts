import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';

const globalKey = '__campusbridgePasswordLoginApiTest';
const serverStub = `
 const state=()=>globalThis.${globalKey};
 export const accountsEnabled=()=>state().enabled;
 export function assertOrigin(request){if(request.headers.get('origin')!=='https://campusbridge.example')throw Error('invalid_origin');}
 export const jsonBody=request=>request.json();
 export const reply=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});
 export const siteUrl=()=> 'https://campusbridge.example';
 export const serverClient=async()=>state().client;
 export const adminClient=()=>({rpc:async(name,args)=>{state().calls.push({name,args});return {data:null,error:{message:'unexpected_admin_call'}};}});
`;
const loginStub = `
 const state=()=>globalThis.${globalKey};
 export async function loginIdentity(client){
   state().calls.push({name:'identity'});
   if(state().identityError)throw Error('private_gate_unavailable');
   return {client:client??state().client,user:state().user,sessionId:state().sessionId,loginVerified:state().approved};
 }
 export async function completePasswordLogin(context,remembered){
   state().calls.push({name:'approve_password',args:{user:context.user?.id,session:context.sessionId,remembered}});
   if(state().approvalError || !context.user?.email_confirmed_at)throw Error('approval_denied');
   state().approved=true;
 }
 export async function passwordRecoveryAllowed(context){
   state().calls.push({name:'check_recovery',args:{user:context.user?.id,session:context.sessionId}});
   if(state().recoveryError)throw Error('recovery_unavailable');
   return state().recoveryAllowed;
 }
 export async function revokeLogin(userId,sessionId=null){
   state().calls.push({name:'revoke',args:{userId,sessionId}});
   if(state().revokeError)throw Error('revoke_unavailable');
 }
 export async function clearLoginCookies(){state().calls.push({name:'clear_cookies'});}
 export async function startPendingSignup(email,remembered){state().calls.push({name:'pending_signup',args:{email,remembered}});}
 export async function pendingSignup(){return null;}
 export async function savePendingSignup(value){state().calls.push({name:'save_signup',args:value});}
 export async function finishLogin(value){state().calls.push({name:'finish',args:value});}
`;
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === '@/lib/server') return { url: `data:text/javascript,${encodeURIComponent(serverStub)}`, shortCircuit: true };
  if (specifier === '@/lib/login-session') return { url: `data:text/javascript,${encodeURIComponent(loginStub)}`, shortCircuit: true };
  if (!specifier.startsWith('@/')) return nextResolve(specifier, context);
  return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
} });

const { POST: auth } = await import('../src/app/api/auth/[action]/route.ts');
const { POST: verify } = await import('../src/app/api/auth/verify-login/route.ts');
type ProviderError = { code?: string; status?: number } | null;
type Call = { name: string; args?: unknown };
function setup() {
  const value = {
    enabled: true, approved: false, recoveryAllowed: false,
    identityError: false, approvalError: false, recoveryError: false, revokeError: false,
    user: { id: 'confirmed-owner', email: 'student@example.invalid', email_confirmed_at: '2026-10-15T12:00:00Z' } as { id: string; email: string; email_confirmed_at?: string } | null,
    sessionId: '20000000-0000-4000-8000-000000000001' as string | null,
    passwordError: null as ProviderError, resendError: null as ProviderError,
    updateError: null as ProviderError, signOutError: null as ProviderError,
    signupSession: false, calls: [] as Call[],
    client: { auth: {} as Record<string, (args: unknown) => Promise<unknown>> },
  };
  value.client.auth = {
    signInWithPassword: async args => { value.calls.push({ name: 'password', args }); return { error: value.passwordError }; },
    resend: async args => { value.calls.push({ name: 'resend', args }); return { error: value.resendError }; },
    updateUser: async args => { value.calls.push({ name: 'update_password', args }); return { error: value.updateError }; },
    signOut: async args => { value.calls.push({ name: 'signout', args }); return { error: value.signOutError }; },
    signUp: async args => { value.calls.push({ name: 'signup', args }); return { data: { user: { identities: [{}] }, session: value.signupSession ? {} : null }, error: null }; },
  };
  (globalThis as unknown as Record<string, unknown>)[globalKey] = value;
  return value;
}
function request(action: string, body: unknown, origin = 'https://campusbridge.example') {
  return new Request(`https://campusbridge.example/api/auth/${action}`, {
    method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}
function submit(action: string, body: unknown, origin?: string) {
  return auth(request(action, body, origin), { params: Promise.resolve({ action }) });
}
const credentials = { email: ' Student@Example.Invalid ', password: 'test-only-long-passphrase' };
const names = (fixture: ReturnType<typeof setup>) => fixture.calls.map(call => call.name);

test('confirmed password sign-in opens the plan directly for both remember choices, without sending email', async () => {
  for (const remembered of [false, true]) {
    const fixture = setup();
    const response = await submit('signin', { ...credentials, rememberMe: remembered });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { redirect: '/dashboard' });
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.deepEqual(fixture.calls, [
      { name: 'password', args: { email: 'student@example.invalid', password: credentials.password } },
      { name: 'identity' },
      { name: 'approve_password', args: { user: 'confirmed-owner', session: fixture.sessionId, remembered } },
    ]);
  }
});

test('wrong passwords and provider rate limits never approve a session or send a code', async () => {
  for (const [error, status] of [[{ code: 'invalid_credentials', status: 400 }, 400], [{ code: 'over_request_rate_limit', status: 429 }, 429]] as const) {
    const fixture = setup(); fixture.passwordError = error;
    const response = await submit('signin', credentials);
    assert.equal(response.status, status);
    assert.equal((await response.json()).redirect, undefined);
    assert.deepEqual(names(fixture), ['password']);
  }
});

test('unfinished signup resumes its one-time confirmation and never opens the private plan', async () => {
  for (const resendFails of [false, true]) {
    const fixture = setup();
    fixture.passwordError = { code: 'email_not_confirmed', status: 400 };
    fixture.resendError = resendFails ? { status: 429 } : null;
    const response = await submit('signin', { ...credentials, rememberMe: true });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { redirect: `/verify-login?flow=signup&sent=${resendFails ? '0' : '1'}` });
    assert.deepEqual(fixture.calls.slice(1), [
      { name: 'resend', args: { type: 'signup', email: 'student@example.invalid' } },
      { name: 'pending_signup', args: { email: 'student@example.invalid', remembered: true } },
    ]);
    assert.equal(fixture.approved, false);
  }
});

test('missing identity, a failed private gate, and rejected approval cannot report successful login', async () => {
  for (const failure of ['missing_user', 'missing_session', 'identity_error', 'approval_error', 'unconfirmed_identity']) {
    const fixture = setup();
    if (failure === 'missing_user') fixture.user = null;
    if (failure === 'missing_session') fixture.sessionId = null;
    if (failure === 'identity_error') fixture.identityError = true;
    if (failure === 'approval_error') fixture.approvalError = true;
    if (failure === 'unconfirmed_identity') fixture.user!.email_confirmed_at = undefined;
    const response = await submit('signin', credentials);
    assert.equal(response.status, 503, failure);
    assert.equal((await response.json()).redirect, undefined, failure);
    assert.equal(fixture.approved, false, failure);
    assert.equal(names(fixture).includes('resend'), false, failure);
    if (failure !== 'approval_error' && failure !== 'unconfirmed_identity') assert.equal(names(fixture).includes('approve_password'), false, failure);
  }
});

test('origin, activation and malformed login requests fail before contacting Auth', async () => {
  const fixture = setup();
  assert.equal((await submit('signin', credentials, 'https://attacker.invalid')).status, 403);
  fixture.enabled = false;
  assert.equal((await submit('signin', credentials)).status, 503);
  fixture.enabled = true;
  for (const body of [null, [], { ...credentials, rememberMe: 'true' }, { ...credentials, email: 'invalid' }, { ...credentials, password: '' }]) {
    assert.equal((await submit('signin', body)).status, 400);
  }
  assert.deepEqual(fixture.calls, []);
});

test('signup still requires one-time confirmation and cannot silently accept disabled email confirmation', async () => {
  const fixture = setup();
  const response = await submit('signup', { ...credentials, rememberMe: true });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { redirect: '/verify-login?flow=signup&sent=1' });
  assert.deepEqual(names(fixture), ['signup', 'pending_signup']);
  const unsafe = setup(); unsafe.signupSession = true;
  const denied = await submit('signup', credentials);
  assert.equal(denied.status, 503);
  assert.deepEqual(names(unsafe), ['signup', 'signout', 'clear_cookies']);
});

test('retired email-code endpoints never send or approve a login, even when a code is supplied', async () => {
  for (const action of ['send', 'redeem']) {
    for (const flow of [undefined, 'signin']) {
      const fixture = setup();
      const response = await verify(request('verify-login', { action, code: '123456', ...(flow ? { flow } : {}) }));
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), { error: 'Log in with your email and password.', redirect: '/login' });
      assert.deepEqual(names(fixture), ['identity']);
    }
  }
});

test('retired code pages redirect only an already approved session and do not extend it', async () => {
  for (const [next, destination] of [[undefined, '/dashboard'], ['reset-password', '/reset-password'], ['https://attacker.invalid', '/dashboard']]) {
    const fixture = setup(); fixture.approved = true;
    const response = await verify(request('verify-login', { action: 'send', next }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { redirect: destination });
    assert.deepEqual(names(fixture), ['identity']);
  }
  const fixture = setup(); fixture.identityError = true;
  assert.equal((await verify(request('verify-login', { action: 'send' }))).status, 503);
  assert.deepEqual(names(fixture), ['identity']);
});

test('expired signup transactions do not fall through into password approval', async () => {
  const fixture = setup();
  const response = await verify(request('verify-login', { action: 'redeem', flow: 'signup', code: '123456' }));
  assert.equal(response.status, 401);
  assert.equal((await response.json()).redirect, '/login');
  assert.deepEqual(fixture.calls, []);
});

test('password reset accepts a live recovery session or an approved login and revokes all approvals before logout', async () => {
  for (const approved of [false, true]) {
    const fixture = setup(); fixture.approved = approved; fixture.recoveryAllowed = !approved;
    const response = await submit('reset', { password: credentials.password });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { redirect: '/login?reset=success' });
    assert.deepEqual(names(fixture), ['identity', ...(!approved ? ['check_recovery'] : []), 'update_password', 'revoke', 'signout', 'clear_cookies']);
    assert.deepEqual(fixture.calls.find(call => call.name === 'revoke')?.args, { userId: 'confirmed-owner', sessionId: null });
    assert.deepEqual(fixture.calls.find(call => call.name === 'signout')?.args, { scope: 'global' });
    assert.equal(names(fixture).includes('approve_password'), false);
  }
});

test('expired or unapproved recovery cannot replace a password or grant plan access', async () => {
  const missing = setup(); missing.user = null;
  assert.equal((await submit('reset', { password: credentials.password })).status, 401);
  assert.deepEqual(names(missing), ['identity']);
  const invalid = setup();
  const denied = await submit('reset', { password: credentials.password });
  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).redirect, '/forgot-password');
  assert.deepEqual(names(invalid), ['identity', 'check_recovery']);
  const unavailable = setup(); unavailable.recoveryError = true;
  assert.equal((await submit('reset', { password: credentials.password })).status, 503);
  assert.deepEqual(names(unavailable), ['identity', 'check_recovery']);
});

test('failed password replacement preserves the session, and failed revocation cannot claim reset completion', async () => {
  const providerFailure = setup(); providerFailure.approved = true; providerFailure.updateError = { status: 400 };
  assert.equal((await submit('reset', { password: credentials.password })).status, 400);
  assert.deepEqual(names(providerFailure), ['identity', 'update_password']);
  const revokeFailure = setup(); revokeFailure.approved = true; revokeFailure.revokeError = true;
  const response = await submit('reset', { password: credentials.password });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).redirect, undefined);
  assert.deepEqual(names(revokeFailure), ['identity', 'update_password', 'revoke']);
});

test('signout remains available during account-service shutdown and removes approval before browser cookies', async () => {
  const fixture = setup(); fixture.enabled = false;
  assert.equal((await submit('signout', {})).status, 200);
  assert.deepEqual(names(fixture), ['identity', 'revoke', 'signout', 'clear_cookies']);
  assert.deepEqual(fixture.calls[1].args, { userId: 'confirmed-owner', sessionId: fixture.sessionId });
  assert.deepEqual(fixture.calls[2].args, { scope: 'local' });
  const failed = setup(); failed.signOutError = { status: 503 };
  assert.equal((await submit('signout', {})).status, 503);
  assert.equal(names(failed).includes('clear_cookies'), false);
});
