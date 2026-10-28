import test from 'node:test';
import assert from 'node:assert/strict';
import { SPRING_2027_CHARGES, SPRING_2027_DEADLINES, SPRING_2027_GLOSSARY, SPRING_2027_SOURCES } from '../src/data/spring-2027.ts';

test('student-facing spring facts resolve to a checked official source', () => {
  const sources = new Map(SPRING_2027_SOURCES.map(source => [source.id, source]));
  assert.equal(sources.size, SPRING_2027_SOURCES.length);
  for (const fact of [...SPRING_2027_DEADLINES, ...SPRING_2027_CHARGES, ...SPRING_2027_GLOSSARY]) {
    const source = sources.get(fact.sourceId);
    assert.ok(source, `missing source ${fact.sourceId}`);
    const host = new URL(source.url).hostname;
    assert.ok(host.endsWith('.utdallas.edu') || host === 'utdallas.edu' || host === 'studyinthestates.dhs.gov');
    assert.equal(source.checkedOn, '2026-10-27');
  }
});

test('relative and unverified spring deadlines do not invent a calendar day', () => {
  for (const id of ['big-howdy', 'tb-screening', 'immigration-check-in', 'census-day', 'entry-window']) {
    assert.equal(SPRING_2027_DEADLINES.find(item => item.id === id)?.date, null, id);
  }
  const registration = SPRING_2027_DEADLINES.find(item => item.id === 'orientation-registration')!;
  assert.equal(registration.date, '2026-10-28');
  assert.equal(registration.time, undefined, 'publisher CST ambiguity must not become a precise converted event');
  assert.match(registration.note, /daylight/);
  const orientation = SPRING_2027_DEADLINES.find(item => item.id === 'orientation')!;
  assert.equal(orientation.time, '12:30');
  assert.match(orientation.note, /2–7 p\.m\./);
});

test('health and immigration requirements retain their applicability and billing basis', () => {
  assert.equal(SPRING_2027_DEADLINES.find(item => item.id === 'meningitis')?.eligibility, 'under22');
  assert.equal(SPRING_2027_DEADLINES.find(item => item.id === 'tb-screening')?.eligibility, 'outside-us');
  const tb = SPRING_2027_CHARGES.find(item => item.id === 'tb-test')!;
  assert.equal(tb.eligibility, 'outside-us');
  assert.match(tb.note, /if not covered/);
  const insurance = SPRING_2027_CHARGES.find(item => item.id === 'utship')!;
  assert.equal(insurance.basis, 'semester');
  assert.equal(insurance.lowCents! / insurance.months!, 30680);
  assert.match(insurance.note, /not as a monthly subscription/);
  assert.match(insurance.note, /already included/);
  assert.equal(SPRING_2027_CHARGES.find(item => item.id === 'orientation')?.eligibility, 'new-graduate-exchange');
});
