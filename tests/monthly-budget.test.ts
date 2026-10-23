import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMonthlyBudget, parseBudgetAmount, MONTHLY_BUDGET_FIELDS, type BudgetDraft } from '../src/domain/monthly-budget.ts';

test('blank costs remain unknown and explicit included zero is counted', () => {
  const blank = calculateMonthlyBudget({});
  assert.equal(blank.enteredCount, 0);
  assert.equal(blank.missingCount, MONTHLY_BUDGET_FIELDS.length);
  assert.equal(blank.balanceCents, null);
  const included = calculateMonthlyBudget({internet: '0'});
  assert.equal(included.enteredCount, 1);
  assert.equal(included.monthlyCents, 0);
  assert.equal(included.missingCount, MONTHLY_BUDGET_FIELDS.length - 1);
});

test('budget totals use cents and separate one-time cash from monthly costs', () => {
  const draft = {housing: '800.10', phone: '20.20', food: '300', setup: '500', funds: '1000'};
  const result = calculateMonthlyBudget(draft);
  assert.equal(result.monthlyCents, 112030);
  assert.equal(result.firstMonthCents, 162030);
  assert.equal(result.balanceCents, -12030);
  assert.equal(draft.setup, '500');
});

test('negative, nonfinite, overprecise and excessively large costs are rejected', () => {
  for (const input of ['-1', 'Infinity', 'NaN', '1e3', '0.001', '1000001', '$10', '1,000']) {
    assert.equal(parseBudgetAmount(input), null, input);
    assert.deepEqual(calculateMonthlyBudget({food: input}).invalid, ['food']);
  }
  assert.equal(parseBudgetAmount(' 0.01 '), 1);
  assert.equal(parseBudgetAmount('1000000'), 100000000);
  assert.equal(parseBudgetAmount('  '), null);
});

test('all eight entered monthly categories produce a complete subtotal without an income assumption', () => {
  const draft = Object.fromEntries(MONTHLY_BUDGET_FIELDS.map(field => [field.id, '1.01'])) as BudgetDraft;
  const result = calculateMonthlyBudget(draft);
  assert.equal(result.monthlyCents, 808);
  assert.equal(result.missingCount, 0);
  assert.equal(result.balanceCents, null);
  assert.equal(result.setupCents, null);
});
