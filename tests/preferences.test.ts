import test from 'node:test';
import assert from 'node:assert/strict';
import { preferencePatch } from '../src/domain/preferences.ts';
import type { Answers } from '../src/lib/model';
const base:Answers={arrivalDate:'2027-01-15',housingLocation:'off_campus',housingType:'apartment',household:'roommates',electricity:'unknown',internet:'unknown',transport:'car',hasCar:true,carArrival:'undecided',priorities:[]};
test('a focused arrival edit preserves a newer independent transport answer',()=>{
 const current={...base,carArrival:'drive' as const};
 assert.deepEqual(preferencePatch(base,current,{arrivalDate:'2027-01-17'}),{patch:{arrivalDate:'2027-01-17'},conflicts:[]});
});
test('an overlapping arrival edit requires review rather than overwriting',()=>{
 assert.deepEqual(preferencePatch(base,{...base,arrivalDate:'2027-01-16'},{arrivalDate:'2027-01-17'}).conflicts,['arrivalDate']);
});
test('car-arrival draft conflicts when car access changed in another session',()=>{
 const result=preferencePatch(base,{...base,transport:'transit',hasCar:false},{carArrival:'ship'});
 assert.ok(result.conflicts.includes('transport'));assert.ok(result.conflicts.includes('hasCar'));
});
test('utility draft cannot overwrite a changed home context',()=>{
 assert.ok(preferencePatch(base,{...base,housingLocation:'on_campus'},{internet:'not_included'}).conflicts.includes('housingLocation'));
});
test('unchanged fields and already-applied changes do not overwrite other preferences',()=>{
 const result=preferencePatch(base,{...base,priorities:['campus']},{arrivalDate:base.arrivalDate,priorities:['campus']});
 assert.deepEqual(result,{patch:{priorities:['campus']},conflicts:[]});
 assert.deepEqual(preferencePatch(base,base,{...base}),{patch:{},conflicts:[]});
});
test('the visible undecided car selection can be materialized for legacy profiles',()=>{
 const legacy={...base};delete legacy.carArrival;
 assert.deepEqual(preferencePatch(legacy,legacy,{carArrival:'undecided'}),{patch:{carArrival:'undecided'},conflicts:[]});
});
