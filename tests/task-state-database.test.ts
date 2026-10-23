import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { canonicalTaskId, generatePlan, taskProgress, taskState } from '../src/domain/plan.ts';
import type { PlanAnswers, Progress, TaskTemplate } from '../src/domain/plan.ts';
const catalog=JSON.parse(await readFile(new URL('../src/data/catalog.json',import.meta.url),'utf8'));
const templates=catalog.tasks as TaskTemplate[];
const answers={arrivalDate:'2027-01-15',leaseStartDate:'2027-01-14',housingLocation:'off_campus',housingType:'apartment',housingCommunity:'bell-cityline',housingZip:'75082',household:'roommates',electricity:'unknown',internet:'unknown',hasCar:false,transport:'transit',transitMode:'campus_bus',rentalHelp:'undecided',priorities:[]};
const ids=['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000004'];
const sessions=ids.map(id=>id.replace('10000000','20000000'));
type Row={task_id:string,completed_at:string|null,not_applicable_at:string|null,updated_at:string};

test('additive task-state migration, old-client compatibility and access boundaries in isolated Postgres',async t=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,encrypted_password text);
   create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,not_after timestamptz);
   create table auth.mfa_amr_claims(session_id uuid references auth.sessions(id),authentication_method text,updated_at timestamptz);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
   grant usage on schema auth to authenticated;`);
  const migrationDir=new URL('../supabase/migrations/',import.meta.url);
  const files=(await readdir(migrationDir)).filter(file=>file.endsWith('.sql')).sort();
  const migration=files.find(file=>file.endsWith('_roadmap_task_states.sql'))!;
  for(const file of files.filter(file=>file<migration))await db.exec(await readFile(new URL(file,migrationDir),'utf8'));
  for(const [index,id] of ids.entries()){
   const email=`state-${index}@example.invalid`;
   await db.query('insert into auth.users values($1,$2,now(),null)',[id,email]);
   await db.query('insert into auth.sessions values($1,$2,null)',[sessions[index],id]);
   await db.query('insert into private.verified_login_sessions(session_id,user_id,email,remembered,verified_at,expires_at) values($1,$2,$3,false,now(),now()+interval \'12 hours\')',[sessions[index],id,email]);
   await db.query('insert into public.onboarding_answers(user_id,answers) values($1,$2)',[id,answers]);
  }
  const snapshot=[
   [ids[0],'arrange-electricity','2026-10-14T12:00:00Z','2026-10-15T12:00:00.123455Z'],
   [ids[0],'confirm-electricity-responsibility',null,'2026-10-15T12:00:00.123456Z'],
   [ids[0],'arrange-home-internet',null,'2026-10-13T12:00:00Z'],
   [ids[0],'confirm-internet-responsibility','2026-10-14T12:00:00Z','2026-10-14T12:00:00Z'],
   [ids[1],'arrange-electricity','2026-10-14T12:00:00Z','2026-10-15T12:00:00Z'],
   [ids[1],'confirm-electricity-responsibility',null,'2026-10-15T12:00:00Z'],
   [ids[2],'confirm-internet-responsibility','2026-10-14T12:00:00Z','2026-10-14T12:00:00Z'],
  ];
  for(const row of snapshot)await db.query('insert into public.user_task_progress(user_id,task_id,completed_at,updated_at) values($1,$2,$3,$4)',row);
  const legacyIds=new Set(templates.map(t=>t.id));
  const originalRows=(await db.query('select user_id,task_id,completed_at,updated_at from public.user_task_progress order by user_id,task_id')).rows;
  await db.exec(await readFile(new URL(migration,migrationDir),'utf8'));
  for(const file of files.filter(file=>file>migration))await db.exec(await readFile(new URL(file,migrationDir),'utf8'));
  async function actor(index:number|null,role='authenticated',sessionOverride?:string){
   await db.exec('reset role');
   await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[index===null?'':ids[index],JSON.stringify(index===null?{}:{sub:ids[index],session_id:sessionOverride??sessions[index]})]);
   await db.exec(`set role ${role}`);
  }
  async function rows(){return (await db.query<Row>('select task_id,completed_at::text,not_applicable_at::text,updated_at::text from public.user_task_progress order by task_id')).rows;}
  async function progress():Promise<Progress>{return Object.fromEntries((await rows()).map(row=>[row.task_id,{completedAt:row.completed_at,notApplicableAt:row.not_applicable_at,updatedAt:row.updated_at}]));}
  async function revision(){return (await db.query<{revision:number}>('select revision from public.profiles')).rows[0].revision;}
  async function save(task:string,state:string,rev?:number){await db.query('select public.set_task_state($1,$2,$3)',[task,state,rev??await revision()]);}
  async function legacyRead(){
   // Exact previous account projection/validation: old builds know every ID and
   // accept nullable completed_at. N/A is intentionally invisible on rollback.
   const result=(await db.query<{task_id:string,completed_at:string|null}>('select task_id,completed_at::text from public.user_task_progress')).rows;
   for(const row of result){assert.ok(legacyIds.has(row.task_id));assert.ok(row.completed_at===null||Number.isFinite(Date.parse(row.completed_at)));}
   return Object.fromEntries(result.map(row=>[row.task_id,{completedAt:row.completed_at}]));
  }

  await t.test('mapping archives every original row and newest undo/completion wins, with canonical tie-break and legacy-only recovery',async()=>{
   const archived=(await db.query('select user_id,task_id,completed_at,updated_at from private.utility_progress_before_readiness order by user_id,task_id')).rows;
   assert.deepEqual(archived,originalRows);assert.equal(archived.length,7);
   assert.equal((await db.query('select * from public.user_task_progress')).rows.length,8);
   await actor(0);
   let p=await progress();
   assert.equal(taskState(taskProgress(p,'arrange-electricity')),'pending');
   assert.equal(taskState(taskProgress(p,'arrange-home-internet')),'completed');
   assert.deepEqual(p['arrange-electricity'],p['confirm-electricity-responsibility']);
   assert.deepEqual(p['arrange-home-internet'],p['confirm-internet-responsibility']);
   assert.equal((await legacyRead())['arrange-electricity'].completedAt,null);
   await actor(1);p=await progress();assert.equal(taskState(p['arrange-electricity']),'completed');
   await actor(2);p=await progress();assert.equal(taskState(p['arrange-home-internet']),'completed');
  });

  await t.test('pending, completed, N/A, and restored writes persist atomically; conflicting and invalid writes preserve state',async()=>{
   await actor(0);
   for(const state of ['completed','not_applicable','pending'] as const){
    const rev=await revision();await save('arrange-electricity',state,rev);
    const p=await progress();assert.equal(taskState(p['arrange-electricity']),state);
    assert.deepEqual(p['arrange-electricity'],p['confirm-electricity-responsibility']);
    assert.equal(await revision(),rev+1);
    const before=await rows();
    await assert.rejects(save('arrange-electricity','completed',rev),/revision_conflict/);
    await assert.rejects(save('arrange-electricity','bad'),/invalid_task_state/);
    await assert.rejects(save('missing-task','completed'),/task_not_applicable/);
    await assert.rejects(save('arrange-campus-parking','completed'),/task_not_applicable/);
    assert.deepEqual(await rows(),before);assert.equal(await revision(),rev+1);
   }
   await actor(null,'postgres');
   await assert.rejects(db.query("update public.user_task_progress set completed_at=now(),not_applicable_at=now() where user_id=$1",[ids[0]]),/task_progress_exclusive_state/);
  });

  await t.test('older open clients can complete and explicitly undo both aliases after migration without reviving stale completion',async()=>{
   await actor(0);
   for(const task of ['confirm-electricity-responsibility','arrange-electricity','confirm-internet-responsibility','arrange-home-internet']){
    await save(task,'not_applicable');
    assert.equal((await legacyRead())[task].completedAt,null,'rollback can read but cannot display N/A');
    const rev=await revision();
    await db.query('select public.set_task_completion($1,true,$2)',[task,rev]);
    assert.equal(taskState(taskProgress(await progress(),task)),'completed');
    await assert.rejects(db.query('select public.set_task_completion($1,false,$2)',[task,rev]),/revision_conflict/);
    await db.query('select public.set_task_completion($1,false,$2)',[task,rev+1]);
    const p=await progress();assert.equal(taskState(taskProgress(p,task)),'pending');
    for(const [id,row] of Object.entries(p))if(canonicalTaskId(id)===canonicalTaskId(task))assert.equal(taskState(row),'pending');
    assert.equal((await legacyRead())[task].completedAt,null);
   }
  });

  await t.test('included/on-campus profile changes preserve canonical and legacy progress plus unrelated answers',async()=>{
   await actor(0);await save('confirm-electricity-responsibility','completed');await save('arrange-home-internet','not_applicable');
   const before=await rows();
   for(const housingLocation of ['on_campus','off_campus'])for(const electricity of ['included','not_included','unknown']){
    const candidate={...answers,housingLocation,electricity,internet:electricity};
    await db.query('select public.save_student_profile($1,$2,$3)',['Alex',candidate,await revision()]);
    assert.deepEqual(await rows(),before);
    assert.deepEqual((await db.query<{answers:unknown}>('select answers from public.onboarding_answers')).rows[0].answers,candidate);
    const p=generatePlan(candidate as PlanAnswers,templates,await progress(),'2027-01-14');
    assert.equal(p.tasks.find(task=>task.id==='arrange-electricity')?.state,'completed');
    assert.equal(p.tasks.find(task=>task.id==='arrange-home-internet')?.state,'not_applicable');
   }
  });

  await t.test('reset affects only completed records of the signed-in account and preserves N/A, answers, and other accounts',async()=>{
   await actor(1);const other=await rows();const otherRevision=await revision();
   await actor(0);await save('check-student-tech','completed');await save('get-comet-card','not_applicable');
   const before=await progress();const answerRows=(await db.query('select * from public.onboarding_answers')).rows;
   const rev=await revision();await assert.rejects(db.query('select public.reset_task_completions($1)',[rev-1]),/revision_conflict/);
   assert.deepEqual(await progress(),before);
   await db.query('select public.reset_task_completions($1)',[rev]);
   const after=await progress();assert.ok(Object.values(after).every(row=>row.completedAt===null));
   for(const [id,row] of Object.entries(before))if(row.notApplicableAt)assert.deepEqual(after[id],row);
   assert.deepEqual((await db.query('select * from public.onboarding_answers')).rows,answerRows);
   assert.equal(await revision(),rev+1);await legacyRead();
   await actor(1);assert.deepEqual(await rows(),other);assert.equal(await revision(),otherRevision);
  });

  await t.test('current SQL/UI applicability agrees across all 288 profiles and legacy IDs map to the same active canonical task',async()=>{
   await actor(null,'postgres');let checked=0;
   for(const housingLocation of ['on_campus','off_campus'])for(const household of ['alone','roommates'])for(const electricity of ['included','not_included','unknown'])for(const internet of ['included','not_included','unknown'])for(const transport of ['car','transit','walking','undecided'])for(const hasCar of [false,true]){
    const a={...answers,housingLocation,household,electricity,internet,transport,hasCar} as PlanAnswers;
    const expected=generatePlan(a,templates,{},'2027-01-14').tasks.map(task=>task.id).sort();
    const actual=(await db.query<{task_id:string}>('select id as task_id from public.task_templates where private.current_task_applies(id,$1)',[a])).rows;
    assert.deepEqual([...new Set(actual.map(row=>canonicalTaskId(row.task_id)))].sort(),expected);
    checked++;
   }
   assert.equal(checked,288);
  });

  await t.test('new RPC and private archive retain login/session, owner, grants, and raw-write boundaries',async()=>{
   await actor(null,'postgres');
   const rpc=(await db.query<{prosecdef:boolean}>("select prosecdef from pg_proc where oid='public.set_task_state(text,text,bigint)'::regprocedure")).rows[0];
   assert.equal(rpc.prosecdef,false);
   for(const fn of ['private.canonical_progress_task(text)','private.current_task_applies(text,jsonb)','private.valid_answers(jsonb)'])assert.equal((await db.query<{ok:boolean}>('select has_function_privilege($1,$2,\'execute\') ok',['authenticated',fn])).rows[0].ok,false);
   assert.equal((await db.query<{rls:boolean}>("select relrowsecurity rls from pg_class where oid='private.utility_progress_before_readiness'::regclass")).rows[0].rls,true);
   await actor(null,'anon');await assert.rejects(db.query("select public.set_task_state('arrange-electricity','completed',0)"),/permission denied/);
   await actor(0);assert.equal((await db.query('select * from public.user_task_progress where user_id=$1',[ids[1]])).rows.length,0);
   await assert.rejects(db.query('select * from private.utility_progress_before_readiness'),/permission denied/);
   await assert.rejects(db.query('update public.user_task_progress set completed_at=now()'),/permission denied/);
   await actor(0,'authenticated',sessions[1]);await assert.rejects(db.query("select public.set_task_state('arrange-electricity','completed',0)"),/not_authorized/);
   await assert.rejects(db.query("select private.write_task_state('arrange-electricity','completed',0)"),/not_authorized/);
   await actor(null,'postgres');await db.query("update private.verified_login_sessions set expires_at=now()-interval '1 second' where user_id=$1",[ids[3]]);
   await actor(3);await assert.rejects(db.query("select public.set_task_state('arrange-electricity','completed',0)"),/not_authorized/);
   assert.equal((await db.query('select * from public.user_task_progress')).rows.length,0);
   await actor(null,'postgres');await db.query('delete from auth.users where id=$1',[ids[2]]);
   assert.equal((await db.query('select * from private.utility_progress_before_readiness where user_id=$1',[ids[2]])).rows.length,0);
   assert.ok((await db.query('select * from private.utility_progress_before_readiness where user_id=$1',[ids[1]])).rows.length>0);
  });
 } finally { await db.close(); }
});
