import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import type { Answers } from '../src/lib/model.ts';

// Mirror the application's @/* path mapping in Node's test runner.
registerHooks({ resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith('@/')) return nextResolve(specifier, context);
  const path = specifier.slice(2);
  const url = new URL(`../src/${path}${path.endsWith('.json') ? '' : '.ts'}`, import.meta.url).href;
  const resolved = nextResolve(url, context);
  return url.endsWith('.json') ? { ...resolved, importAttributes: { type: 'json' } } : resolved;
} });
const { initialState, validateState, updateTransportAnswers, TRANSIT_MODE_OPTIONS, RENTAL_HELP_OPTIONS } = await import('../src/lib/model.ts');

test('new profiles start without an assumed priority or car', () => {
  const state = initialState();
  assert.deepEqual(state.answers.priorities, []);
  assert.equal(state.answers.hasCar, false);
  assert.equal(state.answers.transitMode, 'undecided');
  assert.equal(state.answers.rentalHelp, 'undecided');
});

test('saved profiles normalize stale car and university housing choices without altering progress', () => {
  const state = initialState();
  state.answers = { ...state.answers, hasCar: true, transport: 'transit', housingType: 'residence' };
  state.name = ' Alex ';
  state.progress = { 'confirm-off-campus-move-in': { completedAt: '2026-09-25T15:00:00Z' } };
  const normalized = validateState(state);
  assert.equal(normalized.answers.hasCar, false);
  assert.equal(normalized.answers.housingType, 'apartment');
  assert.equal(normalized.name, 'Alex');
  assert.deepEqual(normalized.progress, state.progress);
  assert.equal(state.answers.hasCar, true, 'normalization does not mutate its input');
  assert.equal(validateState({ ...state, answers: { ...state.answers, transport: 'car' } }).answers.hasCar, true);
});

test('all priorities and optional housing preferences survive a save and reload', () => {
  const state = initialState();
  state.answers = { ...state.answers, priorities: ['housing', 'services', 'transportation', 'campus', 'daily_life'], housingCommunity: 'northside', housingZip: '75080' };
  assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))).answers, state.answers);
  assert.doesNotThrow(() => validateState({ ...state, answers: { ...state.answers, housingCommunity: '', housingZip: '' } }));
});

test('housing preferences reject objects, excess length, malformed identifiers and invalid ZIP codes', () => {
  const state = initialState();
  const invalid: Partial<Answers>[] = [
    { housingCommunity: 'a'.repeat(81) }, { housingCommunity: 'Northside' }, { housingCommunity: '../northside' },
    { housingCommunity: null as unknown as string }, { housingCommunity: {} as string },
    { housingZip: '7508' }, { housingZip: '75080-1234' }, { housingZip: 'abcde' },
    { housingZip: 75080 as unknown as string }, { housingZip: null as unknown as string },
  ];
  for (const patch of invalid) assert.throws(() => validateState({ ...state, answers: { ...state.answers, ...patch } }), /profile details/);
});


test('car-arrival choice persists for drivers and cannot survive switching away from car access', () => {
  const state=initialState();
  const driver={...state,answers:{...state.answers,transport:'car' as const,hasCar:true,carArrival:'ship' as const}};
  assert.equal(validateState(JSON.parse(JSON.stringify(driver))).answers.carArrival,'ship');
  assert.equal(validateState({...driver,answers:{...driver.answers,transport:'transit'}}).answers.carArrival,'undecided');
  assert.equal(validateState({...driver,answers:{...driver.answers,hasCar:false}}).answers.carArrival,'undecided');
  for(const carArrival of ['other','',true,null,{}])assert.throws(()=>validateState({...driver,answers:{...driver.answers,carArrival}}),/profile details/);
});

test('transport follow-up preferences survive save and reload while old profiles remain valid', () => {
  const state = initialState();
  for (const transitMode of TRANSIT_MODE_OPTIONS) {
    const profile = { ...state, answers: { ...state.answers, transport: 'transit', transitMode } };
    assert.equal(validateState(JSON.parse(JSON.stringify(profile))).answers.transitMode, transitMode);
  }
  for (const rentalHelp of RENTAL_HELP_OPTIONS) {
    const profile = { ...state, answers: { ...state.answers, transport: 'car', hasCar: false, rentalHelp } };
    assert.equal(validateState(JSON.parse(JSON.stringify(profile))).answers.rentalHelp, rentalHelp);
  }
  const legacy = JSON.parse(JSON.stringify(state));
  delete legacy.answers.transitMode;
  delete legacy.answers.rentalHelp;
  const loaded = validateState(legacy);
  assert.equal(loaded.answers.transitMode, 'undecided');
  assert.equal(loaded.answers.rentalHelp, 'undecided');
  assert.equal(legacy.answers.transitMode, undefined, 'loading must not mutate stored input');
});

test('changing travel choices clears hidden answers and does not revive stale car access', () => {
  const original = { ...initialState().answers, transport: 'car' as const, hasCar: true, carArrival: 'ship' as const };
  const transit = updateTransportAnswers(original, { transport: 'transit', transitMode: 'campus_bus' });
  assert.equal(transit.hasCar, false);
  assert.equal(transit.carArrival, 'undecided');
  assert.equal(transit.transitMode, 'campus_bus');
  const rental = updateTransportAnswers(transit, { transport: 'car', rentalHelp: 'yes' });
  assert.equal(rental.hasCar, false);
  assert.equal(rental.transitMode, 'undecided');
  assert.equal(rental.rentalHelp, 'yes');
  const arranged = updateTransportAnswers(rental, { hasCar: true, carArrival: 'here' });
  assert.equal(arranged.rentalHelp, 'undecided');
  assert.equal(arranged.carArrival, 'here');
  for (const transport of ['walking', 'undecided'] as const) {
    const changed = updateTransportAnswers(arranged, { transport });
    assert.equal(changed.hasCar, false);
    assert.equal(changed.carArrival, 'undecided');
    assert.equal(changed.transitMode, 'undecided');
    assert.equal(changed.rentalHelp, 'undecided');
  }
  assert.equal(original.carArrival, 'ship', 'transitions must not mutate previous answers');
});

test('loaded profiles clear irrelevant follow-ups and reject malformed preference values', () => {
  const state = initialState();
  const stale = { ...state, answers: { ...state.answers, transport: 'walking', hasCar: true, transitMode: 'rideshare', rentalHelp: 'yes', carArrival: 'ship' } };
  const loaded = validateState(stale);
  assert.equal(loaded.answers.hasCar, false);
  assert.equal(loaded.answers.transitMode, 'undecided');
  assert.equal(loaded.answers.rentalHelp, 'undecided');
  assert.equal(loaded.answers.carArrival, 'undecided');
  for (const field of ['transitMode', 'rentalHelp']) {
    for (const value of ['other', '', true, null, undefined, {}, []]) {
      assert.throws(() => validateState({ ...state, answers: { ...state.answers, [field]: value } }), /profile details/);
    }
  }
});

test('progress validation reads legacy and three-state records while rejecting conflicting or malformed timestamps',()=>{
 const original=initialState();
 const valid=[{completedAt:null},{completedAt:'2026-10-15T19:00:00Z'},
  {completedAt:null,notApplicableAt:'2026-10-15T19:00:00Z',updatedAt:'2026-10-15T19:00:00.123456Z'}];
 for(const record of valid){
  const progress={'confirm-electricity-responsibility':record,'arrange-electricity':record};
  assert.deepEqual(validateState({...original,progress}).progress,progress);
 }
 for(const record of [{completedAt:null,notApplicableAt:true},{completedAt:null,updatedAt:null},{completedAt:null,notApplicableAt:'bad'},
  {completedAt:'2026-10-15T19:00:00Z',notApplicableAt:'2026-10-15T19:00:00Z'},{completedAt:null,updatedAt:'bad'}]){
  assert.throws(()=>validateState({...original,progress:{'arrange-electricity':record}}),/saved progress/);
 }
 assert.throws(()=>validateState({...original,progress:{'invented-task':{completedAt:null}}}),/saved progress/);
});
