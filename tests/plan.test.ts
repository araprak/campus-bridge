import test from 'node:test';
import assert from 'node:assert/strict';
import { arrivalTimeline, CATEGORIES, DEFAULT_CATEGORY_ORDER, effectiveHasCar, generatePlan } from '../src/domain/plan.ts';
import type { PlanAnswers, ProgressRecord, TaskTemplate } from '../src/domain/plan.ts';

const answers: PlanAnswers = {
  arrivalDate: '2026-09-25', housingLocation: 'off_campus', household: 'alone',
  electricity: 'not_included', internet: 'included', hasCar: false, priorities: [],
};
const templates: TaskTemplate[] = [
  { id: 'electricity', title: 'Check electricity setup', category: 'services', horizon: 'first_week', priority: 'standard', rule: 'electricity_setup' },
  { id: 'internet', title: 'Check internet setup', category: 'services', horizon: 'first_week', priority: 'standard', rule: 'internet_setup' },
  { id: 'check-electricity', title: 'Confirm electricity responsibility', category: 'services', horizon: 'first_48_hours', priority: 'standard', rule: 'electricity_unknown' },
  { id: 'check-internet', title: 'Confirm internet responsibility', category: 'services', horizon: 'first_48_hours', priority: 'standard', rule: 'internet_unknown' },
  { id: 'transit', title: 'Plan travel to campus', category: 'transportation', horizon: 'first_week', priority: 'standard', rule: 'campus_transport' },
  { id: 'parking', title: 'Check parking guidance', category: 'transportation', horizon: 'first_week', priority: 'standard', rule: 'parking' },
  { id: 'shared-services', title: 'Agree on shared responsibilities', category: 'housing', horizon: 'first_week', priority: 'standard', rule: 'roommates' },
  { id: 'support', title: 'Find campus support', category: 'campus', horizon: 'first_week', priority: 'standard', rule: 'always' },
  { id: 'daily-life', title: 'Review daily-life resources', category: 'daily_life', horizon: 'first_30_days', priority: 'standard', rule: 'always' },
];
const plan = (patch: Partial<PlanAnswers> = {}, date = '2026-09-25') => generatePlan({ ...answers, ...patch }, templates, {}, date);
const ids = (p: ReturnType<typeof plan>) => p.tasks.map(t => t.id);

test('off-campus electricity setup appears only when not included', () => {
  const task = plan().tasks.find(t => t.id === 'electricity');
  assert.equal(task?.horizon, 'first_48_hours');
  assert.match(task!.reasons[0], /off campus.*not included/);
  assert.ok(!ids(plan({ electricity: 'included' })).includes('electricity'));
  assert.ok(!ids(plan({ housingLocation: 'on_campus' })).includes('electricity'));
});

test('unknown internet is not suppressed by included electricity', () => {
  const result = plan({ electricity: 'included', internet: 'unknown' });
  assert.ok(ids(result).includes('check-internet'));
  assert.ok(!ids(result).includes('internet'));
  assert.ok(!ids(result).includes('check-electricity'));
  const inverse = plan({ electricity: 'unknown', internet: 'not_included' });
  assert.ok(ids(inverse).includes('check-electricity'));
  assert.ok(ids(inverse).includes('internet'));
  assert.ok(!ids(inverse).includes('electricity'));
});

test('no car advances transit; car access enables parking without hiding transit', () => {
  assert.equal(plan().tasks.find(t => t.id === 'transit')?.horizon, 'first_48_hours');
  assert.ok(!ids(plan()).includes('parking'));
  const withCar = plan({ hasCar: true });
  assert.ok(ids(withCar).includes('parking'));
  assert.equal(withCar.tasks.find(t => t.id === 'transit')?.horizon, 'first_week');
});

test('roommate task follows household answers', () => {
  assert.ok(ids(plan({ household: 'roommates' })).includes('shared-services'));
  assert.ok(!ids(plan()).includes('shared-services'));
});

test('selected priorities lead the plan while retaining other essentials', () => {
  const result = plan({ priorities: ['campus'] });
  const support = result.tasks.find(t => t.id === 'support')!;
  assert.equal(support.priority, 'high');
  assert.equal(support.horizon, 'first_week');
  assert.ok(support.reasons.some(r => r.includes('setup priority')));
  assert.equal(result.tasks[0].id, 'support');
  assert.equal(result.categoryOrder[0], 'campus');
  assert.ok(ids(result).includes('electricity'));
  assert.deepEqual(plan().categoryOrder, DEFAULT_CATEGORY_ORDER);
  assert.deepEqual(plan({ priorities: ['daily_life', 'services', 'housing'] }).categoryOrder,
    ['housing', 'services', 'daily_life', 'transportation', 'campus']);
  assert.deepEqual(plan({ priorities: [...CATEGORIES] }).categoryOrder, DEFAULT_CATEGORY_ORDER);
});

test('stale car access never adds parking for transit, walking or an undecided mode', () => {
  for (const transport of ['transit', 'walking', 'undecided'] as const) {
    const result = plan({ transport, hasCar: true });
    assert.equal(effectiveHasCar({ transport, hasCar: true }), false);
    assert.ok(!ids(result).includes('parking'));
    assert.equal(result.tasks.find(t => t.id === 'transit')?.horizon, 'first_48_hours');
  }
  assert.ok(ids(plan({ transport: 'car', hasCar: true })).includes('parking'));
  assert.ok(!ids(plan({ transport: 'car', hasCar: false })).includes('parking'));
});

test('rental help acknowledges a driving plan without assuming a car is arranged', () => {
  for (const date of ['2026-09-20', '2026-09-25', '2026-09-30']) {
    const rental = plan({ transport: 'car', hasCar: false, rentalHelp: 'yes' }, date);
    const route = rental.tasks.find(task => task.id === 'transit')!;
    assert.match(route.reasons[0], /plan to drive.*not arranged a car.*rental options.*backup route/);
    assert.equal(route.horizon, 'first_48_hours');
    assert.ok(!ids(rental).includes('parking'));
    assert.doesNotMatch(plan({ transport: 'car', hasCar: false, rentalHelp: 'no' }, date).tasks.find(task => task.id === 'transit')!.reasons[0], /rental options/);
  }
});

test('arrival countdown uses whole calendar days across month and daylight-saving boundaries', () => {
  assert.equal(arrivalTimeline('2027-01-15', '2027-01-01').daysUntilArrival, 14);
  assert.equal(arrivalTimeline('2027-01-15', '2027-01-14').label, '1 day until your arrival');
  assert.equal(arrivalTimeline('2027-01-15', '2027-01-15').phase, 'arrival_day');
  assert.equal(arrivalTimeline('2027-01-15', '2027-01-16').label, '1 day since your arrival');
  assert.equal(arrivalTimeline('2028-03-01', '2028-02-28').daysUntilArrival, 2);
  assert.equal(arrivalTimeline('2026-11-02', '2026-10-31').daysUntilArrival, 2);
  assert.equal(arrivalTimeline('2026-09-25', '2026-11-10').daysUntilArrival, 0);
});

test('recent arrival explanation and calendar boundaries are deterministic', () => {
  const recent = plan({}, '2026-09-26').tasks.find(t => t.id === 'electricity')!;
  assert.equal(recent.timing, 'current');
  assert.ok(recent.reasons.some(r => r.includes('recently arrived')));
  assert.equal(plan({}, '2026-09-27').tasks.find(t => t.id === 'electricity')!.timing, 'earlier');
  assert.equal(plan({}, '2026-10-01').tasks.find(t => t.id === 'support')!.timing, 'current');
  assert.equal(plan({}, '2026-10-02').tasks.find(t => t.id === 'support')!.timing, 'earlier');
});

test('future arrivals retain preparation tasks and late arrivals retain unfinished work', () => {
  const future = plan({}, '2026-09-20');
  assert.equal(future.daysSinceArrival, -5);
  assert.ok(future.tasks.every(t => t.timing === 'upcoming'));
  const late = plan({}, '2026-11-10');
  assert.deepEqual(ids(late), ids(plan()));
  assert.ok(late.tasks.every(t => t.timing === 'earlier'));
  assert.ok(late.nextTask);
});

test('plan explanations use future wording only before the Dallas arrival day', () => {
  const housingTasks: TaskTemplate[] = [
    { id: 'off-campus-home', title: 'Plan off-campus move-in', category: 'housing', horizon: 'first_48_hours', priority: 'standard', rule: 'off_campus' },
    { id: 'on-campus-home', title: 'Plan on-campus move-in', category: 'housing', horizon: 'first_48_hours', priority: 'standard', rule: 'on_campus' },
    ...templates,
  ];
  const profile: PlanAnswers = { ...answers, arrivalDate: '2027-01-15', household: 'roommates', internet: 'not_included', hasCar: true };
  const generate = (date: string, patch: Partial<PlanAnswers> = {}) => generatePlan({ ...profile, ...patch }, housingTasks, {}, date);
  const reason = (result: ReturnType<typeof generate>, id: string) => result.tasks.find(t => t.id === id)!.reasons[0];
  const future = generate('2027-01-14');
  assert.match(reason(future, 'off-campus-home'), /plan to live off campus/);
  assert.match(reason(generate('2027-01-14', { housingLocation: 'on_campus' }), 'on-campus-home'), /plan to live on campus/);
  assert.match(reason(future, 'electricity'), /plan to live.*electricity will not be included/);
  assert.match(reason(future, 'internet'), /plan to live.*internet will not be included/);
  assert.match(reason(future, 'shared-services'), /plan to share.*will handle/);
  assert.match(reason(future, 'parking'), /will have access to a car/);
  assert.match(reason(generate('2027-01-14', { hasCar: false }), 'transit'), /do not expect to have access/);
  const unknown = generate('2027-01-14', { electricity: 'unknown', internet: 'unknown' });
  assert.match(reason(unknown, 'check-electricity'), /electricity will be included/);
  assert.match(reason(unknown, 'check-internet'), /internet will be included/);
  for (const date of ['2027-01-15', '2027-01-16']) {
    const arrived = generate(date);
    assert.equal(reason(arrived, 'off-campus-home'), 'You said you live off campus.');
    assert.equal(reason(arrived, 'shared-services'), 'You share your home; agree who handles shared services.');
    assert.equal(reason(arrived, 'parking'), 'You have access to a car; check official campus parking guidance.');
    assert.deepEqual(arrived.tasks.map(({ id, horizon, priority }) => ({ id, horizon, priority })),
      future.tasks.map(({ id, horizon, priority }) => ({ id, horizon, priority })));
  }
});

test('learning utility responsibility replaces guidance while retaining completion history', () => {
  const initialAnswers: PlanAnswers = { ...answers, electricity: 'unknown', internet: 'unknown' };
  const saved = Object.freeze({
    'check-electricity': Object.freeze({ completedAt: '2026-09-25T15:00:00Z' }),
    'check-internet': Object.freeze({ completedAt: '2026-09-25T15:05:00Z' }),
  });
  const generate = (patch: Partial<PlanAnswers>) => generatePlan({ ...initialAnswers, ...patch }, templates, saved, '2026-09-25');
  assert.equal(generate({}).progress.completed, 2);
  const learned = generate({ electricity: 'included', internet: 'not_included' });
  assert.ok(!ids(learned).includes('check-electricity'));
  assert.ok(!ids(learned).includes('check-internet'));
  assert.ok(!ids(learned).includes('electricity'));
  assert.ok(ids(learned).includes('internet'));
  assert.equal(learned.tasks.find(t => t.id === 'internet')?.completedAt, null);
  assert.equal(learned.progress.completed, 0);
  const inverse = generate({ electricity: 'not_included', internet: 'included' });
  assert.ok(ids(inverse).includes('electricity'));
  assert.ok(!ids(inverse).includes('internet'));
  const restored = generate({});
  assert.equal(restored.progress.completed, 2);
  assert.equal(restored.tasks.find(t => t.id === 'check-electricity')?.completedAt, saved['check-electricity'].completedAt);
  assert.equal(restored.tasks.find(t => t.id === 'check-internet')?.completedAt, saved['check-internet'].completedAt);
});

test('changed answers remove irrelevant tasks from denominator without erasing history', () => {
  const saved = Object.freeze({ electricity: Object.freeze({ completedAt: '2026-09-25T15:00:00Z' }) });
  const initial = generatePlan(answers, templates, saved, '2026-09-25');
  assert.equal(initial.progress.completed, 1);
  assert.notEqual(initial.nextTask?.id, 'electricity');
  const changed = generatePlan({ ...answers, electricity: 'included' }, templates, saved, '2026-09-25');
  assert.equal(changed.progress.completed, 0);
  assert.equal(changed.progress.total, initial.progress.total - 1);
  const restored = generatePlan(answers, templates, saved, '2026-09-25');
  assert.equal(restored.tasks.find(t => t.id === 'electricity')?.completedAt, saved.electricity.completedAt);
});

test('completion and undo snapshots choose a new next step and restore it', () => {
  const initial = plan();
  const saved: Record<string, ProgressRecord> = Object.fromEntries(initial.tasks.map(t => [t.id, { completedAt: '2026-09-25T16:00:00Z' }]));
  const allDone = generatePlan(answers, templates, saved, '2026-09-25');
  assert.equal(allDone.progress.percent, 100);
  assert.equal(allDone.nextTask, null);
  saved[initial.tasks[0].id] = { completedAt: null };
  assert.equal(generatePlan(answers, templates, saved, '2026-09-25').nextTask?.id, initial.tasks[0].id);
  const empty = generatePlan(answers, [], {}, '2026-09-25');
  assert.equal(empty.progress.percent, 0);
  assert.equal(empty.nextTask, null);
});

test('invalid dates, duplicate priorities and unsupported values fail explicitly', () => {
  assert.throws(() => plan({ arrivalDate: '2026-02-30' }), /calendar date/);
  assert.throws(() => plan({}, '2026-9-25'), /calendar date/);
  assert.doesNotThrow(() => plan({ priorities: [...CATEGORIES] }));
  assert.throws(() => plan({ priorities: [...CATEGORIES, 'campus'] }), /unsupported value/);
  assert.throws(() => plan({ priorities: ['campus', 'campus'] }), /unsupported value/);
  assert.throws(() => plan({ electricity: 'yes' as PlanAnswers['electricity'] }), /unsupported value/);
  assert.equal(plan({ arrivalDate: '2024-02-29' }, '2024-03-01').daysSinceArrival, 1);
});

test('duplicate task IDs fail and input order cannot change recommendation tie breaks', () => {
  assert.throws(() => generatePlan(answers, [templates[0], templates[0]], {}, '2026-09-25'), /unique/);
  const reversed = generatePlan(answers, [...templates].reverse(), {}, '2026-09-25');
  assert.deepEqual(reversed, plan());
});
