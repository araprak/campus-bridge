import test from 'node:test';
import assert from 'node:assert/strict';
import { onboardingCopy } from '../src/domain/onboarding.ts';

test('January arrival uses future questions and preserves the entered calendar date', () => {
  const copy = onboardingCopy('2027-01-15', '2026-09-27');
  assert.match(copy.homeDescription, /January 15, 2027/);
  assert.match(copy.location, /plan to live/);
  assert.match(copy.household, /expect to live/);
  assert.match(copy.car, /^Will you/);
});

test('arrival day and past dates switch all contextual questions to present tense', () => {
  for (const arrival of ['2026-09-27', '2026-09-26']) {
    const copy = onboardingCopy(arrival, '2026-09-27');
    assert.match(copy.location, /are you living/);
    assert.match(copy.household, /are you living/);
    assert.match(copy.transport, /do you get around/);
    assert.match(copy.car, /^Do you/);
    assert.doesNotMatch(copy.alone, /I’ll/);
  }
  assert.match(onboardingCopy('2026-09-27', '2026-09-27').homeDescription, /today/);
});

test('calendar comparison handles year and leap-day boundaries without timezone shifts', () => {
  assert.match(onboardingCopy('2027-01-01', '2026-12-31').homeDescription, /January 1, 2027/);
  assert.match(onboardingCopy('2028-02-29', '2028-02-28').homeDescription, /February 29, 2028/);
  assert.match(onboardingCopy('2028-02-29', '2028-03-01').location, /are you living/);
});
