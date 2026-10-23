import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { generatePlan } from '../src/domain/plan.ts';
import type { PlanAnswers, TaskTemplate } from '../src/domain/plan.ts';
const D='44444444-4444-4444-8444-444444444444';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',C='33333333-3333-4333-8333-333333333333';
const answers={arrivalDate:'2026-09-25',housingLocation:'off_campus',housingType:'apartment',household:'roommates',electricity:'not_included',internet:'included',hasCar:false,transport:'transit',priorities:['transportation']};
test('database migration and access boundaries in isolated Postgres',async t=>{
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;`);
 await db.exec(await readFile(new URL('../supabase/migrations/202609250001_foundation.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/migrations/202609250002_catalog.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/migrations/202610030005_arrival_plan.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/migrations/202610040006_car_arrival.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/migrations/202610050007_transport_options.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../supabase/migrations/202610060008_student_guides.sql',import.meta.url),'utf8'));
 await db.query('insert into auth.users values($1,$2,now()),($3,$4,now()),($5,$6,now())',[A,'a@example.invalid',B,'b@example.invalid',C,'c@example.invalid']);
 await db.query('insert into public.institution_verifications values($1,$2,now(),null)',[A,'student-a@utdallas.edu']);
 async function actor(role:string,id=''){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec(`set role ${role}`);}
 await t.test('profile answers allow every priority and optional housing details while rejecting unknown or malformed data',async()=>{
  const valid=async(value:unknown)=>(await db.query<{ok:boolean}>('select private.valid_answers($1) as ok',[value])).rows[0].ok;
  assert.equal(await valid(answers),true);
  assert.equal(await valid({...answers,priorities:[]}),true);
  assert.equal(await valid({...answers,priorities:['housing','services','transportation','campus','daily_life'],housingCommunity:'northside',housingZip:'75080'}),true);
  assert.equal(await valid({...answers,housingCommunity:'',housingZip:''}),true);
  for(const carArrival of ['drive','ship','here','undecided'])assert.equal(await valid({...answers,transport:'car',hasCar:true,carArrival}),true);
  for(const carArrival of ['other','',true,null,{},[]])assert.equal(await valid({...answers,carArrival}),false);
  for(const transitMode of ['campus_bus','public_transit','rideshare','carpool','mixed','undecided'])assert.equal(await valid({...answers,transitMode}),true);
  for(const rentalHelp of ['yes','no','undecided'])assert.equal(await valid({...answers,transport:'car',rentalHelp}),true);
  for(const field of ['transitMode','rentalHelp'])for(const value of ['other','',true,null,{},[]])assert.equal(await valid({...answers,[field]:value}),false);
  assert.equal(await valid({...answers,housingCommunity:'a'.repeat(80)}),true);
  for(const leaseStartDate of ['', '2027-01-10', '2028-02-29'])assert.equal(await valid({...answers,leaseStartDate}),true);
  for(const leaseStartDate of ['2027-02-29','2026-02-30','2026-13-01','2026-00-10','2026-01-32','2027-1-5','2027-01-05T00:00:00Z','0000-01-01',null,undefined,20270110,{},[],true])assert.equal(await valid({...answers,leaseStartDate:leaseStartDate??null}),false,String(leaseStartDate));
  const invalid=[null,[],{}, {...answers,arrivalDate:'2026-02-30'}, {...answers,arrivalDate:20261003},
   {...answers,priorities:['housing','housing']}, {...answers,priorities:['housing',null]}, {...answers,priorities:[1]},
   {...answers,priorities:['housing','services','transportation','campus','daily_life','other']},
   {...answers,housingCommunity:null},{...answers,housingCommunity:{}},{...answers,housingCommunity:'../northside'},
   {...answers,housingCommunity:'a'.repeat(81)},{...answers,housingZip:75080},{...answers,housingZip:null},
   {...answers,housingZip:'7508'},{...answers,housingZip:'75080-1234'},{...answers,unknown:true}];
  for(const value of invalid)assert.equal(await valid(value),false,JSON.stringify(value));
  for(const key of Object.keys(answers)){
   const missing:Record<string,unknown>={...answers};delete missing[key];assert.equal(await valid(missing),false,`missing ${key}`);
  }
 });
 await t.test('anonymous visitors cannot read private records or issue challenges',async()=>{
  for(const role of ['anon','authenticated'])assert.equal((await db.query<{allowed:boolean}>("select has_function_privilege($1, 'private.valid_answers(jsonb)', 'execute') as allowed",[role])).rows[0].allowed,false);
  await actor('anon');await assert.rejects(db.query('select * from public.profiles'),/permission denied/);await assert.rejects(db.query('select * from private.verification_challenges'),/permission denied/);
  const catalog=JSON.parse(await readFile(new URL('../src/data/catalog.json',import.meta.url),'utf8'));
  assert.equal((await db.query('select * from public.task_templates')).rows.length,catalog.tasks.length);
  await assert.rejects(db.query('select public.reset_task_completions($1)',[0]),/permission denied/);
 });
 await t.test('unverified account cannot save profile or grant its own verification',async()=>{
  await actor('authenticated',B);await assert.rejects(db.query('select public.reset_task_completions($1)',[0]),/not_authorized/);await assert.rejects(db.query('select public.save_student_profile($1,$2,$3)',['B',answers,0]),/not_authorized/);
  await assert.rejects(db.query('insert into public.institution_verifications values($1,$2,now(),null)',[B,'b@utdallas.edu']),/permission denied/);
  await assert.rejects(db.query('select public.create_utd_challenge($1,$2,$3,$4)',[B,'b@utdallas.edu','a'.repeat(64),'b'.repeat(64)]),/permission denied/);
 });
 await t.test('verified profile save validates data and updates revision atomically',async()=>{
  const rentalAnswers={...answers,transport:'car',transitMode:'undecided',rentalHelp:'yes'};
  await actor('authenticated',A);await db.query('select public.save_student_profile($1,$2,$3)',['Alex',rentalAnswers,0]);
  assert.deepEqual((await db.query<{answers:unknown}>('select answers from public.onboarding_answers')).rows[0].answers,rentalAnswers);
  assert.equal((await db.query<{revision:number}>('select revision from public.profiles')).rows[0].revision,1);
  await assert.rejects(db.query('select public.save_student_profile($1,$2,$3)',['Alex',answers,0]),/revision_conflict/);
  await assert.rejects(db.query('select public.save_student_profile($1,$2,$3)',['Alex',{...answers,electricity:null},1]),/invalid_profile/);
  await assert.rejects(db.query('select public.save_student_profile($1,$2,$3)',['Alex',{...answers,is_admin:true},1]),/invalid_profile/);
 });
 await t.test('completion and undo persist; irrelevant tasks and stale writes fail',async()=>{
  await actor('authenticated',A);await db.query('select public.set_task_completion($1,$2,$3)',['arrange-electricity',true,1]);
  assert.ok((await db.query<{completed_at:unknown}>('select completed_at from public.user_task_progress')).rows[0].completed_at);
  await assert.rejects(db.query('select public.set_task_completion($1,$2,$3)',['arrange-electricity',false,1]),/revision_conflict/);
  await assert.rejects(db.query('select public.set_task_completion($1,$2,$3)',['arrange-home-internet',true,2]),/task_not_applicable/);
  await db.query('select public.set_task_completion($1,$2,$3)',['arrange-electricity',false,2]);
  assert.equal((await db.query<{completed_at:unknown}>('select completed_at from public.user_task_progress')).rows[0].completed_at,null);
 });
 await t.test('bulk undo is revision-checked and only clears the signed-in account completions',async()=>{
  await actor('postgres');
  await db.query('insert into auth.users values($1,$2,now())',[D,'reset-peer@example.invalid']);
  await db.query('insert into public.institution_verifications values($1,$2,now(),null)',[D,'reset-peer@utdallas.edu']);
  await actor('authenticated',D);
  await db.query('select public.save_student_profile($1,$2,$3)',['Peer',{...answers,leaseStartDate:'2027-01-10'},0]);
  await db.query('select public.set_task_completion($1,$2,$3)',['check-student-tech',true,1]);
  const peerProfile=(await db.query('select * from public.profiles')).rows;
  const peerAnswers=(await db.query('select * from public.onboarding_answers')).rows;
  const peerProgress=(await db.query('select * from public.user_task_progress')).rows;
  await actor('authenticated',A);
  let revision=(await db.query<{revision:number}>('select revision from public.profiles')).rows[0].revision;
  await db.query('select public.set_task_completion($1,$2,$3)',['check-student-tech',true,revision++]);
  await db.query('select public.set_task_completion($1,$2,$3)',['confirm-off-campus-move-in',true,revision++]);
  const beforeAnswers=(await db.query('select * from public.onboarding_answers')).rows;
  const beforeProfile=(await db.query<{display_name:string,revision:number}>('select display_name,revision from public.profiles')).rows[0];
  const beforeProgress=(await db.query<{completed_at:unknown}>('select * from public.user_task_progress order by task_id')).rows;
  assert.ok(beforeProgress.filter(row=>row.completed_at!==null).length>=2);
  for(const invalidRevision of [revision-1,null]){
   await assert.rejects(db.query('select public.reset_task_completions($1)',[invalidRevision]),/revision_conflict/);
   assert.deepEqual((await db.query('select * from public.user_task_progress order by task_id')).rows,beforeProgress);
   assert.equal((await db.query<{revision:number}>('select revision from public.profiles')).rows[0].revision,revision);
  }
  await db.query('select public.reset_task_completions($1)',[revision]);
  const afterProgress=(await db.query<{completed_at:unknown}>('select * from public.user_task_progress order by task_id')).rows;
  assert.equal(afterProgress.length,beforeProgress.length);
  assert.ok(afterProgress.every(row=>row.completed_at===null));
  assert.deepEqual((await db.query('select * from public.onboarding_answers')).rows,beforeAnswers);
  assert.deepEqual((await db.query<{display_name:string,revision:number}>('select display_name,revision from public.profiles')).rows[0],{...beforeProfile,revision:revision+1});
  await actor('authenticated',D);
  assert.deepEqual((await db.query('select * from public.profiles')).rows,peerProfile);
  assert.deepEqual((await db.query('select * from public.onboarding_answers')).rows,peerAnswers);
  assert.deepEqual((await db.query('select * from public.user_task_progress')).rows,peerProgress);
 });
 await t.test('another account cannot read or modify the first account data',async()=>{
  await actor('authenticated',B);assert.equal((await db.query('select * from public.onboarding_answers')).rows.length,0);assert.equal((await db.query('select * from public.user_task_progress')).rows.length,0);
  assert.equal((await db.query<{user_id:string}>('select user_id from public.profiles')).rows[0].user_id,B);
  await assert.rejects(db.query('update public.profiles set display_name=$1 where user_id=$2',['Forged',A]),/permission denied/);
 });
 await t.test('challenge is bound to account and email, rejects null, consumes once',async()=>{
  await actor('service_role');const digest='a'.repeat(64),ip='b'.repeat(64);
  await db.query('select public.create_utd_challenge($1,$2,$3,$4)',[B,'student-b@utdallas.edu',digest,ip]);
  await assert.rejects(db.query('select public.create_utd_challenge($1,$2,$3,$4)',[B,'student-b@utdallas.edu',digest,ip]),/rate_limited/);
  const redeem=async(user:string,email:string,d:string|null)=>(await db.query<{ok:boolean}>('select public.redeem_utd_challenge($1,$2,$3) as ok',[user,email,d])).rows[0].ok;
  assert.equal(await redeem(B,'student-b@utdallas.edu',null),false);
  assert.equal(await redeem(C,'student-b@utdallas.edu',digest),false);
  assert.equal(await redeem(B,'wrong@utdallas.edu',digest),false);
  assert.equal(await redeem(B,'student-b@utdallas.edu',digest),true);
  assert.equal(await redeem(B,'student-b@utdallas.edu',digest),false);
 });
 await t.test('five incorrect codes exhaust attempts and expired codes fail',async()=>{
  await actor('service_role');const digest='c'.repeat(64);
  await db.query('select public.create_utd_challenge($1,$2,$3,$4)',[C,'student-c@utdallas.edu',digest,'d'.repeat(64)]);
  for(let i=0;i<5;i++)assert.equal((await db.query<{ok:boolean}>('select public.redeem_utd_challenge($1,$2,$3) as ok',[C,'student-c@utdallas.edu','e'.repeat(64)])).rows[0].ok,false);
  assert.equal((await db.query<{ok:boolean}>('select public.redeem_utd_challenge($1,$2,$3) as ok',[C,'student-c@utdallas.edu',digest])).rows[0].ok,false);
  await actor('postgres');await db.query("update private.verification_challenges set created_at=now()-interval '2 minutes' where user_id=$1",[C]);
  await actor('service_role');await db.query('select public.create_utd_challenge($1,$2,$3,$4)',[C,'student-c@utdallas.edu',digest,'d'.repeat(64)]);
  await actor('postgres');await db.query("update private.verification_challenges set expires_at=now()-interval '1 second' where user_id=$1",[C]);
  await actor('service_role');assert.equal((await db.query<{ok:boolean}>('select public.redeem_utd_challenge($1,$2,$3) as ok',[C,'student-c@utdallas.edu',digest])).rows[0].ok,false);
 });
 await t.test('historical SQL applicability matches legacy rules across 288 profiles, including stale car answers',async()=>{
  await actor('postgres');const catalog=JSON.parse(await readFile(new URL('../src/data/catalog.json',import.meta.url),'utf8'));
  for(const housingLocation of ['on_campus','off_campus'])for(const electricity of ['included','not_included','unknown'])for(const internet of ['included','not_included','unknown'])for(const hasCar of [true,false])for(const household of ['alone','roommates'])for(const transport of ['car','transit','walking','undecided']){
   const a={...answers,housingLocation,electricity,internet,hasCar,household,transport} as PlanAnswers;
   // This fixture deliberately loads the pre-personal-login migrations. Give
   // utility templates neutral IDs to test their historical rule behavior;
   // task-state-database.test.ts verifies the current canonical IDs across the same matrix.
   const legacyTemplates=(catalog.tasks as TaskTemplate[]).map(task=>({...task,id:'legacy:'+task.id}));
   const expected=generatePlan(a,legacyTemplates,{},'2026-09-25').tasks.map(t=>t.id.slice(7)).sort();
   const actual=(await db.query<{task_id:string}>('select task_id from public.task_rules where private.task_applies(rule_key,$1)',[a])).rows.map(r=>r.task_id).sort();
   assert.deepEqual(actual,expected);
  }
 });
 await t.test('account deletion removes only that account and stale claims cannot restore its data',async()=>{
  const publicUserTables=['profiles','onboarding_answers','user_task_progress','institution_verifications'];
  const userTables=[...publicUserTables.map(table=>`public.${table}`),'private.verification_challenges'];
  const catalogTables=['resources','task_templates','task_rules','task_resources'];
  const accountRows=async(table:string,user:string)=>(await db.query(`select * from ${table} t where user_id=$1 order by to_jsonb(t)::text`,[user])).rows;
  const catalogRows=async(table:string)=>(await db.query(`select * from public.${table} t order by to_jsonb(t)::text`)).rows;

  // Both accounts have every kind of stored data, including a private challenge.
  await actor('authenticated',B);
  const transitAnswers={...answers,transitMode:'campus_bus',rentalHelp:'undecided'};
  await db.query('select public.save_student_profile($1,$2,$3)',['Blair',transitAnswers,0]);
  assert.deepEqual((await db.query<{answers:unknown}>('select answers from public.onboarding_answers')).rows[0].answers,transitAnswers);
  await db.query('select public.set_task_completion($1,$2,$3)',['arrange-electricity',true,1]);
  await actor('service_role');
  await db.query('select public.create_utd_challenge($1,$2,$3,$4)',[A,'student-a@utdallas.edu','f'.repeat(64),'1'.repeat(64)]);
  await actor('postgres');
  const otherAccountBefore=new Map<string,unknown[]>(),catalogBefore=new Map<string,unknown[]>();
  for(const table of userTables){
   assert.ok((await accountRows(table,A)).length>0,`${table} must contain the account being deleted`);
   const otherRows=await accountRows(table,B);
   assert.ok(otherRows.length>0,`${table} must contain another account to protect`);
   otherAccountBefore.set(table,otherRows);
  }
  for(const table of catalogTables){
   const rows=await catalogRows(table);assert.ok(rows.length>0,`${table} must contain shared content`);catalogBefore.set(table,rows);
  }
  await db.query('delete from auth.users where id=$1',[A]);
  assert.equal((await db.query('select id from auth.users where id=$1',[A])).rows.length,0);
  assert.equal((await db.query('select id from auth.users where id=$1',[B])).rows.length,1);
  for(const table of userTables){
   assert.deepEqual(await accountRows(table,A),[],`${table} must be cleared for the deleted account`);
   assert.deepEqual(await accountRows(table,B),otherAccountBefore.get(table),`${table} must preserve the other account`);
  }
  for(const table of catalogTables)assert.deepEqual(await catalogRows(table),catalogBefore.get(table),`${table} must remain intact`);

  // A previously issued JWT can still carry A's ID after deletion. RLS and RPCs
  // must reject that identity even without relying on client-side sign-out.
  await actor('authenticated',A);
  assert.equal((await db.query<{verified:boolean}>('select public.is_utd_verified() as verified')).rows[0].verified,false);
  for(const table of publicUserTables)assert.deepEqual((await db.query(`select * from public.${table}`)).rows,[]);
  await assert.rejects(db.query('select * from private.verification_challenges'),/permission denied/);
  await assert.rejects(db.query('select public.save_student_profile($1,$2,$3)',['Alex',answers,3]),/not_authorized/);
  await assert.rejects(db.query('select public.set_task_completion($1,$2,$3)',['arrange-electricity',true,3]),/not_authorized/);
  await assert.rejects(db.query('select public.reset_task_completions($1)',[3]),/not_authorized/);
  await assert.rejects(db.query('insert into public.profiles(user_id,display_name) values($1,$2)',[A,'Restored']),/permission denied/);
  await assert.rejects(db.query('update public.profiles set display_name=$1 where user_id=$2',['Restored',A]),/permission denied/);
  await assert.rejects(db.query('insert into public.onboarding_answers(user_id,answers) values($1,$2)',[A,answers]),/permission denied/);
  await assert.rejects(db.query('update public.onboarding_answers set answers=$1 where user_id=$2',[answers,A]),/permission denied/);
  await assert.rejects(db.query('insert into public.user_task_progress(user_id,task_id,completed_at) values($1,$2,now())',[A,'arrange-electricity']),/permission denied/);
  await assert.rejects(db.query('update public.user_task_progress set completed_at=now() where user_id=$1',[A]),/permission denied/);
  await actor('postgres');
  for(const table of userTables){
   assert.deepEqual(await accountRows(table,A),[],`${table} must stay deleted after stale-claim writes`);
   assert.deepEqual(await accountRows(table,B),otherAccountBefore.get(table),`${table} must stay unchanged for the other account`);
  }
 });
 await db.close();
});
