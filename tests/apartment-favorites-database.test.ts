import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { APARTMENTS } from '../src/data/local-options.ts';
const A = { user: '20000000-0000-4000-8000-000000000001', session: '20000000-0000-4000-8000-000000000002' };
const B = { user: '20000000-0000-4000-8000-000000000003', session: '20000000-0000-4000-8000-000000000004' };

test('favorites persist independently, enforce approved account ownership and cascade on deletion', async t => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,encrypted_password text);
      create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,not_after timestamptz);
      create table auth.mfa_amr_claims(session_id uuid references auth.sessions(id) on delete cascade,authentication_method text,updated_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
      grant usage on schema auth to authenticated;`);
    const directory = new URL('../supabase/migrations/', import.meta.url);
    for (const file of (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, directory), 'utf8'));
    async function actor(role: 'postgres' | 'authenticated' | 'service_role' | 'anon', account?: typeof A) {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)", [account?.user ?? '', JSON.stringify({ sub: account?.user, session_id: account?.session })]);
      await db.exec(`set role ${role}`);
    }
    async function approve(account: typeof A) {
      await actor('service_role');
      await db.query('select public.create_login_challenge($1,$2,$3,$4,false)', [account.user, account.session, '7'.repeat(64), '8'.repeat(64)]);
      await db.query('select public.redeem_login_challenge($1,$2,$3)', [account.user, account.session, '7'.repeat(64)]);
    }
    for (const account of [A, B]) {
      await actor('postgres');
      await db.query('insert into auth.users values($1,$2,now(),$3)', [account.user, `favorite-${account.user}@example.invalid`, 'fixture-password-hash']);
      await db.query('insert into auth.sessions values($1,$2,null)', [account.session, account.user]);
    }
    const save = (user: string, id: string) => db.query('insert into public.apartment_favorites(user_id,community_id) values($1,$2) on conflict do nothing', [user, id]);
    const rows = () => db.query<{ community_id: string }>('select community_id from public.apartment_favorites order by community_id');
    await t.test('a signed-in but unapproved session cannot read or save favorites', async () => {
      await actor('authenticated', A);
      assert.deepEqual((await rows()).rows, []);
      await assert.rejects(save(A.user, 'northside'), /row-level security/);
    });
    await approve(A); await approve(B);
    await t.test('save/remove is idempotent, restores from a fresh session and supports more than three favorites', async () => {
      await actor('authenticated', A);
      for (const apartment of APARTMENTS) await save(A.user, apartment.id);
      await save(A.user, 'northside');
      assert.equal((await rows()).rows.length, APARTMENTS.length);
      await actor('postgres'); await actor('authenticated', A);
      assert.equal((await rows()).rows.length, APARTMENTS.length);
      await db.query('delete from public.apartment_favorites where community_id=$1', ['northside']);
      assert.equal((await rows()).rows.length, APARTMENTS.length - 1);
      await assert.rejects(save(A.user, 'not-in-directory'), /check constraint/);
    });
    await t.test('another account cannot read, add, update or remove the owner records', async () => {
      await actor('authenticated', B);
      assert.deepEqual((await rows()).rows, []);
      await assert.rejects(save(A.user, 'northside'), /row-level security/);
      await assert.rejects(db.query('update public.apartment_favorites set user_id=$1', [B.user]), /permission denied/);
      await db.query('delete from public.apartment_favorites where user_id=$1', [A.user]);
      await save(B.user, 'northside');
      assert.deepEqual((await rows()).rows, [{ community_id: 'northside' }]);
      await actor('authenticated', A);
      assert.equal((await rows()).rows.length, APARTMENTS.length - 1);
    });
    await t.test('anonymous access and an unapproved new session remain denied', async () => {
      await actor('anon');
      await assert.rejects(rows(), /permission denied/);
      await assert.rejects(save(A.user, 'northside'), /permission denied/);
      await actor('authenticated', { ...A, session: '20000000-0000-4000-8000-000000000099' });
      assert.deepEqual((await rows()).rows, []);
      await assert.rejects(save(A.user, 'northside'), /row-level security/);
      await db.query('delete from public.apartment_favorites where user_id=$1', [A.user]);
      await actor('authenticated', A);
      assert.equal((await rows()).rows.length, APARTMENTS.length - 1);
    });
    await t.test('account deletion cascades favorites while another account remains intact', async () => {
      await actor('postgres'); await db.query('delete from auth.users where id=$1', [A.user]);
      assert.equal((await db.query('select * from public.apartment_favorites where user_id=$1', [A.user])).rows.length, 0);
      await actor('authenticated', B);
      assert.deepEqual((await rows()).rows, [{ community_id: 'northside' }]);
    });
  } finally { await db.close(); }
});
