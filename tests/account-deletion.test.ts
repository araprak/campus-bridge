import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteOwnAccount, type DeletionServices } from '../src/lib/account-deletion.ts';
const ownId = '11111111-1111-4111-8111-111111111111';
function request(body: unknown = { password: 'test-only-password', confirmation: 'DELETE' }, origin = 'https://campusbridge.example') {
  return new Request('https://campusbridge.example/api/account/delete', {
    method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}
function setup(patch: Partial<DeletionServices> = {}) {
  const calls: string[] = [];
  const services: DeletionServices = {
    assertOrigin: r => { if (r.headers.get('origin') !== 'https://campusbridge.example') throw Error(); },
    getUser: async () => { calls.push('identity'); return { id: ownId, email: 'owner@example.invalid' }; },
    verifyPassword: async (email, password) => { assert.equal(email, 'owner@example.invalid'); assert.equal(password, 'test-only-password'); calls.push('password'); return { userId: ownId }; },
    deleteUser: async id => { calls.push(`delete:${id}`); },
    clearSession: async () => { calls.push('clear'); }, ...patch,
  };
  return { calls, run: (r = request()) => deleteOwnAccount(r, services) };
}
test('self-deletion requires server identity and matching password before deletion and cleanup', async () => {
  const { calls, run } = setup(); const result = await run();
  assert.equal(result.status, 200); assert.equal(result.headers.get('cache-control'), 'private, no-store');
  assert.deepEqual(await result.json(), { ok: true, redirect: '/login?deleted=success' });
  assert.deepEqual(calls, ['identity', 'password', `delete:${ownId}`, 'clear']);
});
test('foreign and missing origins cannot reach authentication or deletion', async () => {
  for (const origin of ['https://attacker.example', '']) {
    const { calls, run } = setup(); assert.equal((await run(request(undefined, origin))).status, 403); assert.deepEqual(calls, []);
  }
});
test('missing confirmation, invalid passwords and browser-supplied targets never delete', async () => {
  for (const body of [null, [], {}, {password:'test-only-password',confirmation:'delete'}, {password:'',confirmation:'DELETE'}, {password:'a'.repeat(129),confirmation:'DELETE'}, {password:'test-only-password',confirmation:'DELETE',userId:'another-account'}]) {
    const { calls, run } = setup(); assert.equal((await run(request(body))).status, 400); assert.deepEqual(calls, []);
  }
});
test('expired sessions, incorrect passwords and identity mismatch cannot delete', async () => {
  const expired = setup({ getUser: async () => null }); assert.equal((await expired.run()).status, 401); assert.deepEqual(expired.calls, []);
  for (const userId of [null, 'another-account']) {
    const { calls, run } = setup({ verifyPassword: async () => ({ userId }) });
    assert.equal((await run()).status, 403); assert.deepEqual(calls, ['identity']);
  }
});
test('rate-limited password checks do not invoke privileged deletion', async () => {
  const { calls, run } = setup({ verifyPassword: async () => ({ userId: null, rateLimited: true }) });
  assert.equal((await run()).status, 429); assert.deepEqual(calls, ['identity']);
});
test('provider failure leaves the current session intact and never reports success', async () => {
  const { calls, run } = setup({ deleteUser: async () => { throw Error('private provider detail'); } });
  const response = await run(); assert.equal(response.status, 503); assert.deepEqual(calls, ['identity', 'password']);
  assert.doesNotMatch(await response.text(), /private provider detail/);
});
test('session cleanup failure after committed deletion still reports deletion success', async () => {
  const { calls, run } = setup({ clearSession: async () => { throw Error('cleanup failed'); } });
  assert.equal((await run()).status, 200); assert.deepEqual(calls, ['identity', 'password', `delete:${ownId}`]);
});
