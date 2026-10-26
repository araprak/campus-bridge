import test from 'node:test';
import assert from 'node:assert/strict';
import { clearGroupBLocalData, compareBudgetScenario, groupBStorageKey, newBudgetScenario, readBudgetScenarios, MONTHLY_BUDGET_FIELDS } from '../src/domain/group-b-budget.ts';

test('scenario comparison keeps unknown costs different from an explicit zero', () => {
  const blank = compareBudgetScenario(newBudgetScenario('one', 'One'));
  assert.equal(blank.monthlySubtotalCents, null);
  assert.equal(blank.moveInSubtotalCents, null);
  assert.equal(blank.complete, false);
  const included = compareBudgetScenario({ id: 'one', name: 'One', amounts: { internet: '0', oneTime: '0', refundable: '0' } });
  assert.equal(included.monthlySubtotalCents, 0);
  assert.equal(included.unknownMonthlyCount, 7);
  assert.equal(included.moveInSubtotalCents, 0);
  assert.equal(included.complete, false);
});

test('move-in totals add recurring, nonrefundable and refundable cash as integer cents', () => {
  const amounts = Object.fromEntries(MONTHLY_BUDGET_FIELDS.map(field => [field.id, '0']));
  const input = { id: 'one', name: 'My plan', amounts: { ...amounts, housing: '800.10', phone: '20.20', food: '300', oneTime: '120.25', refundable: '500.05' } };
  const result = compareBudgetScenario(input);
  assert.equal(result.monthlySubtotalCents, 112030);
  assert.equal(result.oneTimeCents, 12025);
  assert.equal(result.refundableCents, 50005);
  assert.equal(result.moveInSubtotalCents, 174060);
  assert.equal(result.complete, true);
  assert.equal(input.amounts.refundable, '500.05');
});

test('refunds are never subtracted from monthly or upfront cash and invalid entries remain unknown', () => {
  const result = compareBudgetScenario({ id: 'one', name: 'One', amounts: { housing: '1000', refundable: '600', oneTime: '-50', internet: '1.001', food: '1e2' } });
  assert.equal(result.monthlySubtotalCents, 100000);
  assert.equal(result.moveInSubtotalCents, 160000);
  assert.equal(result.oneTimeCents, null);
  assert.deepEqual(result.invalid, ['internet', 'food', 'oneTime']);
  assert.equal(result.complete, false);
});

test('saved scenarios reject malformed records, excess scenarios and duplicate IDs', () => {
  const valid = newBudgetScenario('one', 'One');
  assert.deepEqual(readBudgetScenarios([valid]), [valid]);
  assert.equal(readBudgetScenarios([]), null);
  assert.equal(readBudgetScenarios([valid, valid]), null);
  assert.equal(readBudgetScenarios([valid, ...['two', 'three', 'four'].map(id => newBudgetScenario(id, id))]), null);
  assert.equal(readBudgetScenarios([{ ...valid, amounts: { housing: 500 } }]), null);
  assert.equal(readBudgetScenarios([{ ...valid, id: '../other-account' }]), null);
});

test('browser storage is separated by account, host and feature; deletion preserves other data', () => {
  const a = groupBStorageKey('account-a', 'grp-b.campusbridgeguide.com', 'budget');
  const b = groupBStorageKey('account-b', 'grp-b.campusbridgeguide.com', 'budget');
  const anotherHost = groupBStorageKey('account-a', 'campusbridgeguide.com', 'budget');
  const reminders = groupBStorageKey('account-a', 'grp-b.campusbridgeguide.com', 'reminders');
  assert.notEqual(a, b);
  assert.notEqual(a, anotherHost);
  assert.notEqual(a, reminders);
  const data = new Map([[a, 'budget'], [b, 'other account'], [reminders, 'reminders'], ['unrelated', 'keep']]);
  const storage = { get length() { return data.size; }, key(index: number) { return [...data.keys()][index] ?? null; }, removeItem(key: string) { data.delete(key); } } as Storage;
  clearGroupBLocalData(storage, 'account-a');
  assert.deepEqual([...data], [[b, 'other account'], ['unrelated', 'keep']]);
});
