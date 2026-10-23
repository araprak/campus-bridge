import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { isUniversitySignupEmail } from '../src/lib/personal-email.ts';

test('new-account personal-email guidance catches edu addresses without affecting personal addresses',()=>{
  for (const address of ['student@utdallas.edu','student@sub.utdallas.edu',' STUDENT@MIT.EDU ']) assert.equal(isUniversitySignupEmail(address),true);
  for (const address of ['student@gmail.com','student@example.com','education@proton.me','student@edu.example.com']) assert.equal(isUniversitySignupEmail(address),false);
});

const answers={arrivalDate:'2027-01-15',leaseStartDate:'2027-01-14',housingLocation:'off_campus',housingType:'apartment',housingCommunity:'bell-cityline',housingZip:'75082',household:'roommates',electricity:'unknown',internet:'unknown',hasCar:false,transport:'transit',transitMode:'campus_bus',rentalHelp:'undecided',priorities:[]};
type Account={user:string;session:string;email:string};
const digest='3'.repeat(64),ip='4'.repeat(64);

test('personal login permits own plan access while retaining email approval and atomic writes',async t=>{
 const db=new PGlite();
 try {
  await db.exec(`
   create role anon;create role authenticated;create role service_role bypassrls;
   create schema auth;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,encrypted_password text);
   create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,not_after timestamptz);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
   grant usage on schema auth to authenticated;
  `);
  for(const file of ['202609250001_foundation.sql','202609250002_catalog.sql','202610020003_email_login.sql','202610020004_email_login_enforcement.sql','202610030005_arrival_plan.sql','202610040006_car_arrival.sql','202610050007_transport_options.sql','202610060008_student_guides.sql','202610060009_personal_login.sql']){
   await db.exec(await readFile(new URL(`../supabase/migrations/${file}`,import.meta.url),'utf8'));
  }
  let sequence=0;
  const uuid=()=>`10000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`;
  async function actor(role='postgres',user='',session=''){
   await db.exec('reset role');
   await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[user,JSON.stringify({sub:user,session_id:session})]);
   await db.exec(`set role ${role}`);
  }
  async function account(email?:string):Promise<Account>{
   await actor();const user=uuid(),session=uuid();
   const address=email??`student-${sequence}@example.invalid`;
   await db.query('insert into auth.users values($1,$2,now(),$3)',[user,address,'original-password-hash']);
   await db.query('insert into auth.sessions values($1,$2,null)',[session,user]);
   return{user,session,email:address};
  }
  async function approve(a:Account){
   await actor('service_role');
   await db.query('select public.create_login_challenge($1,$2,$3,$4,false)',[a.user,a.session,digest,ip]);
   const result=await db.query<{approval:unknown}>('select public.redeem_login_challenge($1,$2,$3) as approval',[a.user,a.session,digest]);
   assert.ok(result.rows[0].approval);
   await actor('authenticated',a.user,a.session);
  }
  async function save(a:Account,revision=0){
   await actor('authenticated',a.user,a.session);
   await db.query('select public.save_student_profile($1,$2,$3)',['Alex',answers,revision]);
  }
  async function revision(){return (await db.query<{revision:number}>('select revision from public.profiles')).rows[0]?.revision;}
  async function rejectWrites(rev=0){
   await assert.rejects(db.query('select public.save_student_profile($1,$2,$3)',['No',answers,rev]),/not_authorized/);
   await assert.rejects(db.query('select public.set_task_completion($1,$2,$3)',['confirm-off-campus-move-in',true,rev]),/not_authorized/);
   await assert.rejects(db.query('select public.reset_task_completions($1)',[rev]),/not_authorized/);
  }

  await t.test('confirmed personal accounts need no UTD mailbox to save and read their own plan',async()=>{
   const a=await account();await approve(a);
   assert.equal((await db.query<{ok:boolean}>('select public.is_utd_verified() as ok')).rows[0].ok,false);
   await save(a);
   assert.equal((await db.query('select * from public.profiles')).rows.length,1);
   assert.equal((await db.query('select * from public.institution_verifications')).rows.length,0);
   assert.deepEqual((await db.query<{answers:unknown}>('select answers from public.onboarding_answers')).rows[0].answers,answers);
   await db.query('select public.set_task_completion($1,true,1)',['confirm-off-campus-move-in']);
   assert.equal((await db.query('select * from public.user_task_progress')).rows.length,1);
   assert.equal(await revision(),2);
  });

  await t.test('legacy university sign-ins keep working and revoked campus verification does not revoke the personal plan',async()=>{
   const a=await account('legacy@utdallas.edu');await actor();
   await db.query('insert into public.institution_verifications values($1,$2,now(),now())',[a.user,a.email]);
   await approve(a);await save(a);
   assert.equal((await db.query<{ok:boolean}>('select public.is_utd_verified() as ok')).rows[0].ok,false);
   assert.equal((await db.query('select * from public.onboarding_answers')).rows.length,1);
  });

  await t.test('cross-user reads, raw writes and a different user session remain denied',async()=>{
   const a=await account(),b=await account();await approve(a);await save(a);await approve(b);await save(b);
   await db.query('select public.set_task_completion($1,true,1)',['confirm-off-campus-move-in']);
   await actor('authenticated',a.user,a.session);
   for(const table of ['profiles','institution_verifications','onboarding_answers','user_task_progress']){
    assert.equal((await db.query(`select * from public.${table} where user_id=$1`,[b.user])).rows.length,0,table);
   }
   await assert.rejects(db.query('update public.profiles set display_name=$1 where user_id=$2',['Stolen',b.user]),/permission denied/);
   await assert.rejects(db.query('delete from public.user_task_progress where user_id=$1',[b.user]),/permission denied/);
   await db.query('select public.reset_task_completions(1)');
   await actor('authenticated',b.user,b.session);
   assert.ok((await db.query<{completed_at:unknown}>('select completed_at from public.user_task_progress')).rows[0].completed_at);
   assert.equal(await revision(),2);
   await actor('authenticated',a.user,b.session);
   assert.equal((await db.query('select * from public.profiles')).rows.length,0);
   await rejectWrites(2);
  });

  await t.test('missing, expired, revoked and unconfirmed email approvals deny every private read and write',async()=>{
   const a=await account();await actor('authenticated',a.user,a.session);await rejectWrites();
   await approve(a);await save(a);
   await actor();await db.query("update private.verified_login_sessions set expires_at=now()-interval '1 second' where session_id=$1",[a.session]);
   await actor('authenticated',a.user,a.session);await rejectWrites(1);
   for(const table of ['profiles','institution_verifications','onboarding_answers','user_task_progress']) assert.equal((await db.query(`select * from public.${table}`)).rows.length,0,table);
   const b=await account();await approve(b);await save(b);
   await actor('service_role');await db.query('select public.revoke_login_sessions($1,$2)',[b.user,b.session]);
   await actor('authenticated',b.user,b.session);await rejectWrites(1);
   const c=await account();await approve(c);await save(c);
   await actor();await db.query('update auth.users set email_confirmed_at=null where id=$1',[c.user]);
   await actor('authenticated',c.user,c.session);await rejectWrites(1);
  });

  await t.test('master undo clears all completion marks atomically and preserves preferences and lease date',async()=>{
   const a=await account();await approve(a);await save(a);
   await db.query('select public.set_task_completion($1,true,1)',['confirm-off-campus-move-in']);
   await db.query('select public.set_task_completion($1,true,2)',['confirm-electricity-responsibility']);
   assert.equal(await revision(),3);
   await assert.rejects(db.query('select public.reset_task_completions(2)'),/revision_conflict/);
   assert.equal((await db.query('select * from public.user_task_progress where completed_at is not null')).rows.length,2);
   await db.query('select public.reset_task_completions(3)');
   assert.equal(await revision(),4);
   assert.equal((await db.query('select * from public.user_task_progress where completed_at is not null')).rows.length,0);
   assert.deepEqual((await db.query<{answers:unknown}>('select answers from public.onboarding_answers')).rows[0].answers,answers);
   await assert.rejects(db.query('select public.reset_task_completions(null)'),/revision_conflict/);
  });

  await t.test('invalid lease dates and task applicability still prevent partial writes',async()=>{
   const a=await account();await approve(a);
   for(const lease of ['2027-02-30','01/15/2027',true,null]){
    await assert.rejects(db.query('select public.save_student_profile($1,$2,0)',['Alex',{...answers,leaseStartDate:lease}]),/invalid_profile/);
    assert.equal(await revision(),0);
    assert.equal((await db.query('select * from public.onboarding_answers')).rows.length,0);
   }
   await save(a);
   await assert.rejects(db.query('select public.set_task_completion($1,true,1)',['arrange-campus-parking']),/task_not_applicable/);
   assert.equal(await revision(),1);
  });

  await t.test('anonymous roles cannot call plan RPCs and validators remain private',async()=>{
   await actor('anon');
   await assert.rejects(db.query('select public.reset_task_completions(0)'),/permission denied/);
   await assert.rejects(db.query('select public.save_student_profile($1,$2,0)',['Alex',answers]),/permission denied/);
   await assert.rejects(db.query('select public.set_task_completion($1,true,0)',['confirm-off-campus-move-in']),/permission denied/);
   for(const role of ['anon','authenticated']){
    await actor(role);
    await assert.rejects(db.query('select private.valid_answers($1)',[answers]),/permission denied/);
   }
  });
 }finally{await db.close();}
});
