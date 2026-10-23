import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { generatePlan, effectiveHasCar } from '../src/domain/plan.ts';
import { neighborhoodPlaces } from '../src/data/neighborhood-places.ts';
registerHooks({ resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith('@/')) return nextResolve(specifier, context);
  const path=specifier.slice(2);
  const url=new URL(`../src/${path}${path.endsWith('.json')?'':'.ts'}`,import.meta.url).href;
  const resolved=nextResolve(url,context);
  return url.endsWith('.json')?{...resolved,importAttributes:{type:'json'}}:resolved;
}});
const { initialState, validateState, tasks } = await import('../src/lib/model.ts');

test('lease dates save independently of arrival, including a leap day and clearing an existing date',()=>{
  const state=initialState();
  state.answers.arrivalDate='2027-01-15';
  for(const leaseStartDate of ['', '2027-01-10', '2027-01-20', '2028-02-29']) {
    const saved=validateState(JSON.parse(JSON.stringify({...state,answers:{...state.answers,leaseStartDate}})));
    assert.equal(saved.answers.leaseStartDate,leaseStartDate);
    assert.equal(saved.answers.arrivalDate,'2027-01-15');
  }
  assert.equal(validateState(state).answers.leaseStartDate,undefined,'older profiles remain valid');
  assert.equal(state.answers.leaseStartDate,undefined,'validation does not mutate the profile');
});

test('lease dates reject impossible dates, timestamps and non-string values',()=>{
  const state=initialState();
  for(const leaseStartDate of ['2027-02-29','2026-02-30','2026-13-01','2026-00-10','2026-01-32','2027-1-5','2027-01-05T00:00:00Z','0000-01-01',null,undefined,20270110,{},[],true]) {
    assert.throws(()=>validateState({...state,answers:{...state.answers,leaseStartDate}}),/profile details/,String(leaseStartDate));
  }
});

test('DART pass tasks stay out of owned-car and rental plans even when previously completed',()=>{
  const answers={...initialState().answers,arrivalDate:'2027-01-15'};
  for(const hasCar of [false,true])for(const rentalHelp of ['yes','no','undecided'] as const) {
    const plan=generatePlan({...answers,transport:'car',hasCar,rentalHelp},tasks,{'check-dart-pass':{completedAt:'2026-10-06T12:00:00Z'}},'2026-10-06');
    assert.ok(!plan.tasks.some(task=>task.id==='check-dart-pass'));
    assert.ok(plan.tasks.some(task=>task.id==='plan-campus-transit'),'transport guide remains accessible');
    assert.equal(plan.tasks.some(task=>task.id==='arrange-campus-parking'),hasCar);
  }
  for(const transport of ['transit','walking','undecided'] as const) {
    assert.ok(generatePlan({...answers,transport},tasks,{},'2026-10-06').tasks.some(task=>task.id==='check-dart-pass'));
  }
});

test('a rental interest or stale car answer does not expose fuel and car washes as available-car guidance',()=>{
  const answers=initialState().answers;
  for(const patch of [{transport:'car' as const,hasCar:false,rentalHelp:'yes' as const},{transport:'transit' as const,hasCar:true},{transport:'walking' as const,hasCar:true}]) {
    const places=neighborhoodPlaces(undefined,effectiveHasCar({...answers,...patch}));
    assert.ok(places.length>0);
    assert.ok(places.every(place=>place.category!=='fuel'&&place.category!=='carwash'));
  }
  const driver=neighborhoodPlaces(undefined,effectiveHasCar({...answers,transport:'car',hasCar:true}));
  assert.ok(driver.some(place=>place.category==='fuel'));
  assert.ok(driver.some(place=>place.category==='carwash'));
});
