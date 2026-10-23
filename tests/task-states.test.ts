import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generatePlan, taskProgress, taskState, updateTaskProgress, summarizeTasks, PLAN_STAGES } from '../src/domain/plan.ts';
import type { PlanAnswers, Progress, TaskTemplate } from '../src/domain/plan.ts';
const catalog = JSON.parse(await readFile(new URL('../src/data/catalog.json', import.meta.url), 'utf8'));
const templates = catalog.tasks as TaskTemplate[];
const answers: PlanAnswers = { arrivalDate:'2027-01-15',housingLocation:'off_campus',household:'alone',electricity:'unknown',internet:'unknown',hasCar:false,transport:'transit',priorities:[] };
const plan = (progress: Progress = {}, patch: Partial<PlanAnswers> = {}, date = '2027-01-14') => generatePlan({...answers,...patch},templates,progress,date);

test('three task states preserve history and N/A is separate from completed and actionable totals',()=>{
 const a = updateTaskProgress({}, 'confirm-off-campus-move-in', 'completed', '2027-01-01T12:00:00Z');
 const b = updateTaskProgress(a,'check-student-tech','not_applicable','2027-01-02T12:00:00Z');
 const p = plan(b);
 assert.equal(p.progress.completed,1);assert.equal(p.progress.notApplicable,1);
 assert.equal(p.progress.total,p.tasks.length-1);assert.equal(p.progress.pending,p.tasks.length-2);
 assert.equal(p.progress.percent,Math.round(100/p.progress.total));
 assert.ok(p.nextTasks.every(task=>task.state==='pending'));
 assert.equal(p.nextTask,p.nextTasks[0]);
 const restored = updateTaskProgress(b,'check-student-tech','pending','2027-01-03T12:00:00Z');
 assert.equal(taskState(restored['check-student-tech']),'pending');
 assert.equal(plan(restored).progress.notApplicable,0);
 assert.equal(plan(restored).progress.completed,1);
 assert.equal(taskState(b['check-student-tech']),'not_applicable','changes do not mutate prior state');
 const none = Object.fromEntries(p.tasks.map(task=>[task.id,{completedAt:null,notApplicableAt:'2027-01-04T12:00:00Z',updatedAt:'2027-01-04T12:00:00Z'}]));
 assert.deepEqual(plan(none).progress,{completed:0,total:0,percent:0,pending:0,notApplicable:p.tasks.length});
 assert.deepEqual(plan(none).nextTasks,[]);assert.equal(plan(none).nextTask,null);
 const byCategory=p.categoryOrder.map(category=>summarizeTasks(p.tasks.filter(task=>task.category===category)));
 for(const key of ['completed','total','pending','notApplicable'] as const)assert.equal(byCategory.reduce((sum,v)=>sum+v[key],0),p.progress[key]);
});

test('utility readiness retains one ID and one state across every home/responsibility answer',()=>{
 const progress = updateTaskProgress(updateTaskProgress({},'confirm-electricity-responsibility','completed','2027-01-01T12:00:00Z'),'arrange-home-internet','not_applicable','2027-01-02T12:00:00Z');
 for(const housingLocation of ['on_campus','off_campus'] as const)for(const electricity of ['unknown','included','not_included'] as const)for(const internet of ['unknown','included','not_included'] as const){
  const p = plan(progress,{housingLocation,electricity,internet});
  assert.equal(p.tasks.filter(t=>t.id==='arrange-electricity').length,1);
  assert.equal(p.tasks.filter(t=>t.id==='arrange-home-internet').length,1);
  assert.ok(!p.tasks.some(t=>t.id.includes('responsibility')));
  assert.equal(p.tasks.find(t=>t.id==='arrange-electricity')?.state,'completed');
  assert.equal(p.tasks.find(t=>t.id==='arrange-home-internet')?.state,'not_applicable');
  if(housingLocation==='on_campus'||electricity==='included')assert.match(p.tasks.find(t=>t.id==='arrange-electricity')!.reasons[0],/housing/);
 }
});

test('utility legacy alias resolution respects latest undo, fractional timestamps, and deterministic canonical ties',()=>{
 const canonical='arrange-electricity',alias='confirm-electricity-responsibility';
 const old={completedAt:'2027-01-01T12:00:00Z',updatedAt:'2027-01-02T12:00:00.123455Z'};
 const undone={completedAt:null,updatedAt:'2027-01-02T12:00:00.123456Z'};
 assert.equal(taskState(taskProgress({[canonical]:old,[alias]:undone},canonical)),'pending');
 assert.equal(taskState(taskProgress({[canonical]:undone,[alias]:old},alias)),'pending');
 const tied={...old,updatedAt:undone.updatedAt};
 assert.equal(taskState(taskProgress({[canonical]:tied,[alias]:undone},alias)),'completed');
 assert.equal(taskState(taskProgress({[alias]:old},canonical)),'completed');
 assert.equal(taskState(taskProgress({},canonical)),'pending');
 assert.deepEqual(taskProgress({[alias]:{completedAt:null}},canonical),{completedAt:null});
});

test('automatic inapplicability excludes saved N/A without removing its history',()=>{
 const progress=updateTaskProgress({},'arrange-campus-parking','not_applicable');
 assert.equal(plan(progress).progress.notApplicable,0);
 assert.equal(plan(progress,{transport:'car',hasCar:true}).progress.notApplicable,1);
 assert.equal(taskState(progress['arrange-campus-parking']),'not_applicable');
});

test('suggested stages cover arrival boundaries without losing late tasks',()=>{
 const dates=['2027-01-14','2027-01-15','2027-01-16','2027-01-17','2027-01-21','2027-01-22','2027-02-13','2027-02-14'];
 const active=['before_arrival','first_48_hours','first_48_hours','first_week','first_week','first_30_days','first_30_days',null];
 const ids=plan().tasks.map(t=>t.id).sort();
 dates.forEach((date,index)=>{
  const p=plan({}, {},date);
  assert.deepEqual(p.stages.map(stage=>stage.id),PLAN_STAGES.map(stage=>stage.id));
  assert.equal(p.stages.find(stage=>stage.timing==='current')?.id??null,active[index]);
  assert.deepEqual(p.stages.flatMap(stage=>stage.tasks.map(task=>task.id)).sort(),ids);
  assert.deepEqual(p.tasks.map(task=>task.id).sort(),ids);
 });
 assert.equal(plan({}, {},'2027-02-14').stages.every(stage=>stage.timing==='earlier'),true);
});

test('arrival essentials outrank preferred topics only in a useful timing window',()=>{
 const near=plan({}, {priorities:['campus']});
 assert.equal(near.tasks[0].category,'campus','topic order stays personal');
 assert.equal(near.nextTasks[0].id,'confirm-off-campus-move-in');
 assert.ok(near.nextTasks[0].urgencyReason);
 assert.equal(near.nextTasks.length,3);
 const far=plan({}, {priorities:['campus']},'2026-09-25');
 assert.equal(far.nextTasks[0].category,'campus');
 assert.ok(far.nextTasks.every(t=>t.urgencyReason===null));
 const excluded=updateTaskProgress(updateTaskProgress({},'confirm-off-campus-move-in','completed'),'arrange-electricity','not_applicable');
 assert.ok(plan(excluded,{priorities:['campus']}).nextTasks.every(t=>!['confirm-off-campus-move-in','arrange-electricity'].includes(t.id)));
});
