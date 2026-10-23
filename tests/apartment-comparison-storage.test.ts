import test from 'node:test';
import assert from 'node:assert/strict';
import { APARTMENTS } from '../src/data/local-options.ts';
import {
  COMPARISON_SESSION_KEYS, comparisonSessionKey, readComparisonStorage,
  writeComparisonStorage, clearComparisonStorage,
} from '../src/domain/apartment-discovery.ts';

const firstId = '11111111-1111-4111-8111-111111111111';
const secondId = '22222222-2222-4222-8222-222222222222';
const ids = APARTMENTS.slice(0, 4).map(apartment => apartment.id);
function browserStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
}

test('comparison identity is account-specific and missing or malformed account IDs fail closed', () => {
  assert.notEqual(comparisonSessionKey('account', firstId), comparisonSessionKey('account', secondId));
  assert.notEqual(comparisonSessionKey('account', firstId), comparisonSessionKey('demo'));
  assert.equal(comparisonSessionKey('demo', firstId), COMPARISON_SESSION_KEYS.demo);
  const mixedCaseId = 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA';
  assert.equal(comparisonSessionKey('account', mixedCaseId), comparisonSessionKey('account', mixedCaseId.toLowerCase()));
  for (const invalid of [undefined, '', 'student@example.invalid', ` ${firstId}`, `${firstId}/other`, 'account']) {
    assert.equal(comparisonSessionKey('account', invalid), null);
  }
});

test('switching accounts in the same tab restores only that account shortlist, independently of demo', () => {
  const storage = browserStorage();
  const first = comparisonSessionKey('account', firstId);
  const second = comparisonSessionKey('account', secondId);
  const demo = comparisonSessionKey('demo');
  writeComparisonStorage(storage, first, [ids[0], ids[1]]);
  assert.deepEqual(readComparisonStorage(storage, second), []);
  writeComparisonStorage(storage, second, [ids[2]]);
  writeComparisonStorage(storage, demo, [ids[3]]);
  assert.deepEqual(readComparisonStorage(storage, first), [ids[0], ids[1]]);
  assert.deepEqual(readComparisonStorage(storage, second), [ids[2]]);
  assert.deepEqual(readComparisonStorage(storage, demo), [ids[3]]);
});

test('legacy shared data is discarded, and missing identity never reads or writes a shared shortlist', () => {
  const storage = browserStorage();
  storage.setItem(COMPARISON_SESSION_KEYS.account, JSON.stringify([ids[0]]));
  assert.deepEqual(readComparisonStorage(storage, comparisonSessionKey('account', firstId)), []);
  assert.equal(storage.getItem(COMPARISON_SESSION_KEYS.account), null);
  storage.setItem(COMPARISON_SESSION_KEYS.account, JSON.stringify([ids[1]]));
  assert.deepEqual(readComparisonStorage(storage, null), []);
  writeComparisonStorage(storage, null, [ids[2]]);
  assert.equal(storage.values.size, 0);
});

test('sign-out or deletion cleanup clears only the requested account; demo reset cannot clear account shortlists', () => {
  const storage = browserStorage();
  const first = comparisonSessionKey('account', firstId);
  const second = comparisonSessionKey('account', secondId);
  const demo = comparisonSessionKey('demo');
  writeComparisonStorage(storage, first, [ids[0]]);
  writeComparisonStorage(storage, second, [ids[1]]);
  writeComparisonStorage(storage, demo, [ids[2]]);
  clearComparisonStorage(storage, first);
  assert.deepEqual(readComparisonStorage(storage, first), []);
  assert.deepEqual(readComparisonStorage(storage, second), [ids[1]]);
  assert.deepEqual(readComparisonStorage(storage, demo), [ids[2]]);
  clearComparisonStorage(storage, demo);
  assert.deepEqual(readComparisonStorage(storage, demo), []);
  assert.deepEqual(readComparisonStorage(storage, second), [ids[1]]);
  clearComparisonStorage(storage, null);
  assert.deepEqual(readComparisonStorage(storage, second), [ids[1]]);
});

test('blocked or corrupt session storage cannot prevent use of the comparison or account cleanup', () => {
  const blocked = {
    getItem: (_key: string): string | null => { throw new Error('blocked'); },
    setItem: (_key: string, _value: string) => { throw new Error('blocked'); },
    removeItem: (_key: string) => { throw new Error('blocked'); },
  };
  const key = comparisonSessionKey('account', firstId);
  assert.deepEqual(readComparisonStorage(blocked, key), []);
  assert.doesNotThrow(() => writeComparisonStorage(blocked, key, ids));
  assert.doesNotThrow(() => clearComparisonStorage(blocked, key));
  const storage = browserStorage();
  storage.setItem(key!, '{corrupt');
  assert.deepEqual(readComparisonStorage(storage, key), []);
  writeComparisonStorage(storage, key, ['unknown', ids[0], ids[0], ...ids.slice(1)]);
  assert.deepEqual(readComparisonStorage(storage, key), ids.slice(0, 3));
});
