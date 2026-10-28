import test from 'node:test';
import assert from 'node:assert/strict';
import { APARTMENTS } from '../src/data/local-options.ts';
import { GROUP_B_APARTMENT_PRICES,GROUP_B_ELECTRICITY_PRICES,GROUP_B_PHONE_PRICES } from '../src/data/group-b-prices.ts';
import { CONNECTED_BUDGET_FIELDS,connectedBudgetEstimate,importLegacyBudget,newConnectedBudgetScenario,readConnectedBudgetDocument,type ConnectedBudgetScenario,type SharedBudgetAnswers } from '../src/domain/group-b-connected-budget.ts';
import { readGroupBReminderDocument,reminderCalendar,resolveReminderDeadline } from '../src/domain/group-b-reminders.ts';
const answers:SharedBudgetAnswers={housingCommunity:'northside',household:'roommates',electricity:'included',internet:'not_included',transport:'transit'};
const scenario=()=>newConnectedBudgetScenario('one','One',answers);
const line=(value:ConnectedBudgetScenario,id:string)=>connectedBudgetEstimate(value,answers).lines.find(row=>row.id===id)!;
const zeroOverrides=()=>Object.fromEntries(CONNECTED_BUDGET_FIELDS.map(field=>[field.id,'0']));

test('price schema covers all 30 communities and does not invent an unverified number or checked date',()=>{
 assert.equal(GROUP_B_APARTMENT_PRICES.length,30);assert.deepEqual(GROUP_B_APARTMENT_PRICES.map(row=>row.communityId),APARTMENTS.map(row=>row.id));
 for(const row of GROUP_B_APARTMENT_PRICES){assert.match(row.sourceUrl,/^https:/);assert.ok(row.floorPlans.length>0);for(const entry of [...row.floorPlans,row.requiredMonthlyFees,row.application,row.admin,row.deposit]){if(entry.lowCents===null){assert.equal(entry.highCents,null);}else{assert.ok(entry.checkedOn);assert.ok(entry.highCents!>=entry.lowCents);}}}
 assert.ok(GROUP_B_ELECTRICITY_PRICES.every(row=>row.lowCents===null&&row.checkedOn===null));
 assert.equal(GROUP_B_PHONE_PRICES.find(row=>row.id==='mint')?.upfrontCents,4500);
});
test('connected estimate reads plan choices without mutation and keeps unconfirmed split unknown',()=>{
 const before=JSON.stringify(answers),value={...scenario(),floorPlanId:'supernova-deluxe'};assert.equal(line(value,'rent').lowCents,null);assert.equal(line(value,'electricity').lowCents,0);assert.equal(line(value,'electricity').status,'Included');
 const split={...value,roommates:2};assert.equal(line(split,'rent').lowCents,84800);assert.equal(line({...split,overrides:{rent:'800.10'}},'rent').lowCents,80010);assert.equal(JSON.stringify(answers),before);
 const changed=connectedBudgetEstimate(split,{...answers,housingCommunity:'palencia',internet:'included'});assert.equal(changed.lines.find(row=>row.id==='rent')?.lowCents,null);assert.equal(changed.lines.find(row=>row.id==='internet')?.lowCents,0);assert.ok(changed.monthly.unknownCount>0);
});
test('confirmed cents complete totals while invalid or blank lines keep incomplete status',()=>{
 const value={...scenario(),overrides:{...zeroOverrides(),rent:'800.10',groceries:'300.20',deposit:'500.05',setup:'120.25'}};const estimate=connectedBudgetEstimate(value,answers);
 assert.equal(estimate.monthly.lowCents,110030);assert.equal(estimate.monthly.highCents,110030);assert.equal(estimate.monthly.unknownCount,0);assert.equal(estimate.moveIn.lowCents,172060);assert.equal(estimate.moveIn.unknownCount,0);
 assert.equal(line({...value,overrides:{...value.overrides,rent:'-1'}},'rent').status,'Unknown');assert.equal(line({...value,overrides:{...value.overrides,rent:'1.001'}},'rent').invalid,true);
});
test('semester insurance and prepaid phone replace amortized monthly shares in move-in cash once',()=>{
 const insurance={...scenario(),f1:'yes' as const,overrides:zeroOverrides()};delete insurance.overrides.insurance;const result=connectedBudgetEstimate(insurance,answers);assert.equal(result.monthly.lowCents,30680);assert.equal(result.moveIn.lowCents,153400);
 const phone={...scenario(),phoneProvider:'mint',overrides:zeroOverrides()};delete phone.overrides.phone;const prepaid=connectedBudgetEstimate(phone,answers);assert.equal(prepaid.monthly.lowCents,1500);assert.equal(prepaid.monthly.highCents,2500);assert.equal(prepaid.moveIn.lowCents,4500);assert.equal(prepaid.moveIn.highCents,4500);
});
test('conditional F1 charges never bill every student or treat unknown eligibility as zero',()=>{
 assert.equal(line(scenario(),'tb').lowCents,null);assert.equal(line({...scenario(),tbNotCovered:'no'},'tb').lowCents,0);assert.equal(line({...scenario(),tbNotCovered:'yes'},'tb').lowCents,15000);
 assert.equal(line({...scenario(),orientationRequired:'yes'},'orientation').lowCents,5000);
});
test('cloud budget validates catalog choices, bounded counts, amount strings and strips unknown owner fields',()=>{
 const good={schema:2,scenarios:[scenario()]};assert.deepEqual(readConnectedBudgetDocument(good),good);
 for(const patch of [{communityId:'invented'},{floorPlanId:'wrong'},{roommates:0},{roommates:1.5},{roommates:9},{phoneProvider:'bad'},{internet:'yes'},{f1:true},{overrides:{rent:'1e3'}},{overrides:{rent:50}}])assert.equal(readConnectedBudgetDocument({schema:2,scenarios:[{...scenario(),...patch}]}),null,JSON.stringify(patch));
 assert.equal(readConnectedBudgetDocument({schema:2,scenarios:[scenario(),scenario()]}),null);assert.equal(readConnectedBudgetDocument({schema:2,scenarios:[]}),null);
 const parsed=readConnectedBudgetDocument({...good,user_id:'another-account',scenarios:[{...scenario(),owner:'another-account'}]});assert.deepEqual(parsed,good);
});
test('legacy browser import is explicit conversion and rejects invalid money rather than silently uploading it',()=>{
 const migrated=importLegacyBudget([{id:'old',name:'Earlier',amounts:{housing:'900',utilities:'60',oneTime:'200',refundable:'500'}}],answers)!;assert.equal(migrated.schema,2);assert.equal(migrated.scenarios[0].overrides.rent,'900');assert.equal(migrated.scenarios[0].overrides.electricity,'60');assert.equal(migrated.scenarios[0].overrides.setup,'200');assert.equal(migrated.scenarios[0].overrides.deposit,'500');assert.equal(importLegacyBudget([{id:'old',name:'Earlier',amounts:{housing:'-50'}}]),null);
});
test('reminder document rejects mismatched official metadata while preserving source in calendar export',()=>{
 const deadline=resolveReminderDeadline('2027-01-13T12:30','America/Chicago');assert.equal(deadline.ok,true);if(!deadline.ok)return;
 const reminder={id:'orientation-1',title:'Orientation check-in',localDateTime:'2027-01-13T12:30',timeZone:'America/Chicago',utcISO:deadline.iso,done:false,sourceId:'orientation',templateId:'orientation'};
 const doc={schema:2,enabled:true,reminders:[reminder]};assert.deepEqual(readGroupBReminderDocument(doc),doc);assert.equal(readGroupBReminderDocument({...doc,reminders:[{...reminder,sourceId:'travel-guide'}]}),null);assert.equal(readGroupBReminderDocument({...doc,reminders:[{...reminder,sourceId:'https://evil.test'}]}),null);assert.equal(readGroupBReminderDocument({...doc,enabled:'yes'}),null);
 assert.match(reminderCalendar(reminder).replace(/\r\n /g,''),/Official reference: https:\/\/icp.utdallas.edu\/students\/international-student-orientation/);
});
