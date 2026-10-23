import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const digest='a'.repeat(64),wrong='b'.repeat(64),ip='c'.repeat(64);
const answers={arrivalDate:'2026-10-02',housingLocation:'off_campus',housingType:'apartment',household:'roommates',electricity:'unknown',internet:'unknown',hasCar:false,transport:'transit',priorities:[]};
type Account={user:string;session:string;email:string};
type Approval={remembered:boolean;expires_at:string;email:string}|null;

test('email login database authorization and lifecycle',async t=>{
 const db=new PGlite();
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
 const uuid=()=>`00000000-0000-4000-8000-${String(++sequence).padStart(12,'0')}`;
 async function actor(role='postgres',user='',session:unknown=''){
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[user,JSON.stringify({sub:user,session_id:session})]);
  await db.exec(`set role ${role}`);
 }
 async function account():Promise<Account>{
  await actor();const user=uuid(),session=uuid(),email=`student-${sequence}@example.invalid`;
  await db.query('insert into auth.users values($1,$2,now(),$3)',[user,email,'original-password-hash']);
  await db.query('insert into auth.sessions values($1,$2,null)',[session,user]);
  return{user,session,email};
 }
 async function issue(a:Account,remember=false,d=digest,address=ip){
  await actor('service_role');
  return(await db.query<{id:string}>('select public.create_login_challenge($1,$2,$3,$4,$5) as id',[a.user,a.session,d,address,remember])).rows[0].id;
 }
 async function redeem(a:Account,d:string|null=digest):Promise<Approval>{
  await actor('service_role');
  return(await db.query<{approval:Approval}>('select public.redeem_login_challenge($1,$2,$3) as approval',[a.user,a.session,d])).rows[0].approval;
 }
 async function verified(a:Account,session:unknown=a.session){
  await actor('authenticated',a.user,session);
  return(await db.query<{ok:boolean}>('select public.is_login_verified() as ok')).rows[0].ok;
 }
 async function age(a:Account,interval='2 minutes'){
  await actor();await db.query('update private.login_challenges set created_at=now()-$2::interval where user_id=$1',[a.user,interval]);
 }
 async function revoke(a:Account,session:string|null=a.session){
  await actor('service_role');await db.query('select public.revoke_login_sessions($1,$2)',[a.user,session]);
 }

 await t.test('browser roles cannot issue, redeem, revoke or read approval records',async()=>{
  const a=await account();
  for(const role of ['anon','authenticated']){
   await actor(role,a.user,a.session);
   await assert.rejects(db.query('select * from private.login_challenges'),/permission denied/);
   await assert.rejects(db.query('select * from private.verified_login_sessions'),/permission denied/);
   await assert.rejects(db.query('select public.create_login_challenge($1,$2,$3,$4,false)',[a.user,a.session,digest,ip]),/permission denied/);
   await assert.rejects(db.query('select public.redeem_login_challenge($1,$2,$3)',[a.user,a.session,digest]),/permission denied/);
   await assert.rejects(db.query('select public.revoke_login_sessions($1)',[a.user]),/permission denied/);
  }
  await actor('anon');await assert.rejects(db.query('select public.is_login_verified()'),/permission denied/);
 });

 await t.test('issuance requires the confirmed current account and its live Auth session',async()=>{
  const a=await account(),b=await account();
  await assert.rejects(issue({...a,session:b.session}),/not_authorized/);
  await assert.rejects(issue({...a,session:uuid()}),/not_authorized/);
  await actor();await db.query("update auth.sessions set not_after=now()-interval '1 second' where id=$1",[a.session]);
  await assert.rejects(issue(a),/not_authorized/);
  await actor();await db.query('update auth.users set email_confirmed_at=null where id=$1',[b.user]);
  await assert.rejects(issue(b),/not_authorized/);
  await actor('service_role');
  await assert.rejects(db.query('select public.create_login_challenge($1,$2,$3,$4,$5)',[a.user,a.session,null,ip,false]),/invalid_challenge/);
  await assert.rejects(db.query('select public.create_login_challenge($1,$2,$3,$4,$5)',[a.user,a.session,digest,ip,null]),/invalid_challenge/);
 });

 await t.test('codes approve only their original user and session and cannot be replayed',async()=>{
  const a=await account(),b=await account();const extra=uuid();
  await actor();await db.query('insert into auth.sessions values($1,$2,null)',[extra,a.user]);
  await issue(a);
  assert.equal(await verified(a),false);
  assert.equal(await redeem({...a,session:extra}),null);
  assert.equal(await redeem({...b,session:a.session}),null);
  assert.equal(await redeem(a,null),null);
  const approval=await redeem(a);
  assert.equal(approval?.email,a.email);assert.equal(approval?.remembered,false);
  const hours=(Date.parse(approval!.expires_at)-Date.now())/3_600_000;
  assert.ok(hours>11.9&&hours<=12.01);
  assert.equal(await verified(a),true);
  assert.equal(await verified(a,extra),false);
  assert.equal(await verified(b,a.session),false);
  assert.equal(await verified(a,''),false);
  assert.equal(await verified(a,'bad-uuid'),false);
  assert.equal(await verified(a,null),false);
  assert.equal(await redeem(a),null);
 });

 await t.test('remembered approvals last 30 days and never outlive Auth session expiry',async()=>{
  const a=await account();await issue(a,true);const approval=await redeem(a);
  assert.equal(approval?.remembered,true);
  const days=(Date.parse(approval!.expires_at)-Date.now())/86_400_000;
  assert.ok(days>29.99&&days<=30.01);
  const b=await account();await actor();await db.query("update auth.sessions set not_after=now()+interval '2 hours' where id=$1",[b.session]);
  await issue(b,true);const limited=await redeem(b);
  const hours=(Date.parse(limited!.expires_at)-Date.now())/3_600_000;
  assert.ok(hours>1.99&&hours<=2.01);
  await actor();await db.query("update private.verified_login_sessions set expires_at=now()-interval '1 second' where session_id=$1",[a.session]);
  assert.equal(await verified(a),false);
  await actor();await db.query("update auth.sessions set not_after=now()-interval '1 second' where id=$1",[b.session]);
  assert.equal(await verified(b),false);
 });

 await t.test('resending invalidates the old code and five attempts are enforced',async()=>{
  const a=await account();await issue(a);await age(a);await issue(a,false,wrong);
  assert.equal(await redeem(a,digest),null);
  assert.ok(await redeem(a,wrong));
  const b=await account();await issue(b);
  for(let i=0;i<5;i++)assert.equal(await redeem(b,wrong),null);
  assert.equal(await redeem(b),null);
  await actor();const rows=(await db.query<{attempts:number;consumed_at:unknown}>('select attempts,consumed_at from private.login_challenges where user_id=$1',[b.user])).rows;
  assert.equal(rows[0].attempts,5);assert.ok(rows[0].consumed_at);
  const c=await account();await issue(c);
  for(let i=0;i<4;i++)assert.equal(await redeem(c,wrong),null);
  assert.ok(await redeem(c),'the fifth attempt may still be correct');
 });

 await t.test('expired codes and challenges whose account email changed cannot grant access',async()=>{
  const a=await account();await issue(a);
  await actor();await db.query("update private.login_challenges set expires_at=now()-interval '1 second' where user_id=$1",[a.user]);
  assert.equal(await redeem(a),null);
  const b=await account();await issue(b);
  await actor();await db.query('update auth.users set email=$2 where id=$1',[b.user,'changed@example.invalid']);
  assert.equal(await redeem(b),null);
 });

 await t.test('per-user cooldown and hourly rate survive consumption, revocation and sign-out',async()=>{
  const a=await account();await issue(a);await redeem(a);await revoke(a);
  await assert.rejects(issue(a),/rate_limited/);
  await actor();await db.query('delete from auth.sessions where id=$1',[a.session]);
  a.session=uuid();await db.query('insert into auth.sessions values($1,$2,null)',[a.session,a.user]);
  await assert.rejects(issue(a),/rate_limited/);
  for(let i=1;i<6;i++){await age(a);await issue(a);await revoke(a);}
  await age(a);await assert.rejects(issue(a),/rate_limited/);
  await actor();assert.equal((await db.query<{n:number}>('select count(*)::int as n from private.login_challenges where user_id=$1',[a.user])).rows[0].n,6);
 });

 await t.test('IP hourly limit spans different accounts',async()=>{
  const address='d'.repeat(64);
  for(let i=0;i<20;i++){const a=await account();await issue(a,false,digest,address);await revoke(a);}
  const blocked=await account();await assert.rejects(issue(blocked,false,digest,address),/rate_limited/);
 });

 await t.test('private reads and SECURITY DEFINER profile/progress writes require session approval',async()=>{
  const a=await account();await actor();
  await db.query('insert into public.institution_verifications values($1,$2,now(),null)',[a.user,`student-${sequence}@utdallas.edu`]);
  await db.query('insert into public.onboarding_answers(user_id,answers) values($1,$2)',[a.user,answers]);
  await db.query("insert into public.user_task_progress values($1,'confirm-off-campus-move-in',null,now())",[a.user]);
  await actor('authenticated',a.user,a.session);
  for(const table of ['profiles','institution_verifications','onboarding_answers','user_task_progress'])assert.equal((await db.query(`select * from public.${table}`)).rows.length,0,table);
  assert.equal((await db.query<{ok:boolean}>('select public.is_utd_verified() as ok')).rows[0].ok,false);
  await assert.rejects(db.query('select public.save_student_profile($1,$2,$3)',['Alex',answers,0]),/not_authorized/);
  await assert.rejects(db.query('select public.set_task_completion($1,$2,$3)',['confirm-off-campus-move-in',true,0]),/not_authorized/);
  await issue(a,false,digest,'e'.repeat(64));await redeem(a);await actor('authenticated',a.user,a.session);
  for(const table of ['profiles','institution_verifications','onboarding_answers','user_task_progress'])assert.equal((await db.query(`select * from public.${table}`)).rows.length,1,table);
  await db.query('select public.save_student_profile($1,$2,$3)',['Alex',answers,0]);
  await db.query('select public.set_task_completion($1,$2,$3)',['confirm-off-campus-move-in',true,1]);
  await revoke(a);await actor('authenticated',a.user,a.session);
  await assert.rejects(db.query('select public.save_student_profile($1,$2,$3)',['Alex',answers,2]),/not_authorized/);
  await assert.rejects(db.query('select public.set_task_completion($1,$2,$3)',['confirm-off-campus-move-in',false,2]),/not_authorized/);
 });

 await t.test('session-specific and account-wide revocation invalidate approval but keep rate history',async()=>{
  const a=await account();const b={...a,session:uuid()};await actor();await db.query('insert into auth.sessions values($1,$2,null)',[b.session,a.user]);
  await issue(a,false,digest,'f'.repeat(64));await redeem(a);await age(a);
  await issue(b,false,digest,'f'.repeat(64));await redeem(b);
  await revoke(a);assert.equal(await verified(a),false);assert.equal(await verified(b),true);
  await revoke(a,null);assert.equal(await verified(b),false);
  await actor();assert.equal((await db.query<{n:number}>('select count(*)::int as n from private.login_challenges where user_id=$1',[a.user])).rows[0].n,2);
 });

 await t.test('password, email and email confirmation changes revoke every approval and pending code',async()=>{
  for(const update of ["encrypted_password='new-password-hash'","email='new-login@example.invalid'",'email_confirmed_at=null']){
   const a=await account();await issue(a,false,digest,'1'.repeat(64));await redeem(a);await age(a);await issue(a,false,wrong,'1'.repeat(64));
   await actor();await db.query(`update auth.users set ${update} where id=$1`,[a.user]);
   assert.equal(await verified(a),false);assert.equal(await redeem(a,wrong),null);
   await actor();const result=(await db.query<{n:number;pending:number}>('select count(*)::int as n,count(*) filter(where consumed_at is null)::int as pending from private.login_challenges where user_id=$1',[a.user])).rows[0];
   assert.equal(result.n,2);assert.equal(result.pending,0);
  }
 });

 await t.test('Auth session removal invalidates cached claims, and account deletion clears login data',async()=>{
  const a=await account();await issue(a,false,digest,'2'.repeat(64));await redeem(a);
  await actor();await db.query('delete from auth.sessions where id=$1',[a.session]);
  assert.equal(await verified(a),false);
  await actor();assert.equal((await db.query('select * from private.verified_login_sessions where user_id=$1',[a.user])).rows.length,0);
  assert.equal((await db.query('select * from private.login_challenges where user_id=$1',[a.user])).rows.length,1);
  await db.query('delete from auth.users where id=$1',[a.user]);
  assert.equal((await db.query('select * from private.login_challenges where user_id=$1',[a.user])).rows.length,0);
  assert.equal(await verified(a),false);
 });
 await db.close();
});
