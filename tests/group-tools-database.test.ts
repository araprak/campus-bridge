import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const A={user:'10000000-0000-4000-8000-000000000001',session:'10000000-0000-4000-8000-000000000002'};
const B={user:'10000000-0000-4000-8000-000000000003',session:'10000000-0000-4000-8000-000000000004'};
test('group account data enforces ownership, revisions, grants and account-deletion cleanup',async()=>{
 const db=new PGlite();try{
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,encrypted_password text);
      create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,not_after timestamptz);
      create table auth.mfa_amr_claims(session_id uuid references auth.sessions(id) on delete cascade,authentication_method text,updated_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      grant usage on schema auth to authenticated;
    `);
    const migrations = new URL('../supabase/migrations/', import.meta.url);
    for (const file of (await readdir(migrations)).filter(file => file.endsWith('.sql')).sort()) {
      await db.exec(await readFile(new URL(file, migrations), 'utf8'));
    }

    async function actor(role: 'postgres' | 'authenticated' | 'service_role', account?: typeof A) {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)", [
        account?.user ?? '', JSON.stringify({ sub: account?.user, session_id: account?.session }),
      ]);
      await db.exec(`set role ${role}`);
    }
    for (const account of [A, B]) {
      await actor('postgres');
      await db.query('insert into auth.users values($1,$2,now(),$3)', [account.user, `test-${account.user}@example.invalid`, 'fixture-password-hash']);
      await db.query('insert into auth.sessions values($1,$2,null)', [account.session, account.user]);
      await actor('service_role');
      const digest = '5'.repeat(64);
      await db.query('select public.create_login_challenge($1,$2,$3,$4,false)', [account.user, account.session, digest, '6'.repeat(64)]);
      const approval = await db.query<{ approved: unknown }>('select public.redeem_login_challenge($1,$2,$3) as approved', [account.user, account.session, digest]);
      assert.ok(approval.rows[0].approved);
    }


    await actor('authenticated', A);
    for (const [table,kind] of [['group_a_saved_tools','arrival'],['group_b_saved_tools','budget'],['group_b_saved_tools','reminders']]) {
      await db.query(`insert into public.${table}(user_id,kind,data) values($1,$2,$3)`,[A.user,kind,{schema:2,fixture:true}]);
      assert.equal((await db.query<{revision:number}>(`select revision from public.${table} where kind=$1`,[kind])).rows[0].revision,1);
      const updated=await db.query(`update public.${table} set revision=2,data=$1 where kind=$2 and revision=1 returning revision`,[{fixture:'second-device'},kind]);
      assert.equal(updated.rows.length,1);
      assert.equal((await db.query(`update public.${table} set revision=3 where kind=$1 and revision=1 returning revision`,[kind])).rows.length,0,'stale device cannot overwrite');
      await db.query(`update public.${table} set data=null,revision=3 where kind=$1 and revision=2`,[kind]);
      assert.equal((await db.query<{data:unknown}>(`select data from public.${table} where kind=$1`,[kind])).rows[0].data,null,'removing a copy clears its payload');
      await db.query(`update public.${table} set data=$1,revision=4 where kind=$2 and revision=3`,[{fixture:'recreated'},kind]);
      assert.equal((await db.query(`update public.${table} set data=$1 where kind=$2 and revision=1 returning revision`,[{fixture:'old-device'},kind])).rows.length,0,'delete and recreate never reuses a stale revision');
      await actor('authenticated', B);
      assert.deepEqual((await db.query(`select * from public.${table} where user_id=$1`,[A.user])).rows,[]);
      assert.equal((await db.query(`delete from public.${table} where user_id=$1 returning revision`,[A.user])).rows.length,0);
      await assert.rejects(db.query(`insert into public.${table}(user_id,kind,data) values($1,$2,$3)`,[A.user,kind,{}]),/row-level security/);
      await actor('authenticated', A);
    }
    await assert.rejects(db.query("insert into public.group_a_saved_tools(user_id,kind,data) values($1,'budget','{}')",[A.user]),/check constraint/);
    await db.query('insert into public.group_b_source_reports(user_id,source_url,message) values($1,$2,$3)',[A.user,'https://icp.utdallas.edu/resources/checklist/','Fictional test report']);
    await assert.rejects(db.query("update public.group_b_source_reports set status='resolved'"),/permission denied/);
    await actor('authenticated',B);
    assert.deepEqual((await db.query('select * from public.group_b_source_reports')).rows,[]);
    await actor('postgres');
    await db.query('delete from auth.users where id=$1',[A.user]);
    for (const table of ['group_a_saved_tools','group_b_saved_tools','group_b_source_reports'])assert.deepEqual((await db.query(`select * from public.${table} where user_id=$1`,[A.user])).rows,[],table+' cascades on account deletion');
    await actor('postgres');
    await db.exec('set role anon');
    for (const table of ['group_a_saved_tools','group_b_saved_tools','group_b_source_reports'])await assert.rejects(db.query(`select * from public.${table}`),/permission denied/);

 }finally{await db.close();}
});
