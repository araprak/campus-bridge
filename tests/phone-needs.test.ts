import test from 'node:test';
import assert from 'node:assert/strict';
import { phoneComparisonChecklist, type CallingNeed, type TextingNeed, type ContractPreference } from '../src/domain/phone-needs.ts';

test('international calls, texts and prepaid commitments keep their distinct cost checks', () => {
  const checklist = phoneComparisonChecklist({calling: 'international', texting: 'international', contract: 'prepay'});
  assert.match(checklist[0], /Calling abroad and roaming abroad are different/);
  assert.match(checklist[1], /destination country.*SMS charges/);
  assert.match(checklist[2], /full upfront payment.*refund rules.*renewal total/);
});

test('app messaging and monthly service do not imply verification-text support or debt-free cancellation', () => {
  const checklist = phoneComparisonChecklist({calling: 'occasional', texting: 'apps', contract: 'monthly'});
  assert.match(checklist[0], /charge if you exceed/);
  assert.match(checklist[1], /ordinary SMS separately/);
  assert.match(checklist[2], /device-financing balances/);
});

test('every supported combination produces useful guidance without a provider price or eligibility claim', () => {
  const calls: CallingNeed[] = ['unsure', 'occasional', 'frequent', 'international'];
  const texts: TextingNeed[] = ['unsure', 'domestic', 'international', 'apps'];
  const contracts: ContractPreference[] = ['unsure', 'monthly', 'prepay', 'flexible'];
  for (const calling of calls) for (const texting of texts) for (const contract of contracts) {
    const checklist = phoneComparisonChecklist({calling, texting, contract});
    assert.equal(checklist.length, 3);
    assert.ok(checklist.every(item => typeof item === 'string' && item.length > 25));
    assert.doesNotMatch(checklist.join(' '), /\$|best plan|eligible|guaranteed/i);
  }
});
