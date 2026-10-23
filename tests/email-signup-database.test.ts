import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

type Account = { user: string; session: string; email: string };
type Approval = { remembered: boolean; expires_at: string; email: string } | null;
const answers = {
  arrivalDate: '2027-01-15', leaseStartDate: '', housingLocation: 'off_campus',
  housingType: 'apartment', housingCommunity: '', housingZip: '', household: 'roommates',
  electricity: 'unknown', internet: 'unknown', hasCar: false, transport: 'transit',
  transitMode: 'campus_bus', rentalHelp: 'undecided', priorities: [],
};

test('native email OTP approvals preserve the private-plan authorization boundary', async t => {
  const db = new PGlite();
  try {
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
    const migrationDirectory = new URL('../supabase/migrations/', import.meta.url);
    const migrationNames = (await readdir(migrationDirectory)).filter(name => name.endsWith('.sql')).sort();
    assert.equal(migrationNames.filter(name => name.endsWith('_email_signup_code.sql')).length, 1,
      'the native email OTP approval migration must be present');
    for (const name of migrationNames) await db.exec(await readFile(new URL(name, migrationDirectory), 'utf8'));

    let sequence = 0;
    const uuid = () => `20000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    async function actor(role = 'postgres', user = '', session = '') {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",
        [user, JSON.stringify({ sub: user, session_id: session })]);
      await db.exec(`set role ${role}`);
    }
    async function account(): Promise<Account> {
      await actor();
      const user = uuid(), session = uuid(), email = `signup-${sequence}@example.invalid`;
      await db.query('insert into auth.users values($1,$2,now(),$3)', [user, email, 'original-password-hash']);
      await db.query('insert into auth.sessions values($1,$2,null)', [session, user]);
      return { user, session, email };
    }
    async function evidence(a: Account, method = 'otp', age = '0 seconds') {
      await actor();
      await db.query('insert into auth.mfa_amr_claims values($1,$2,now()-$3::interval)', [a.session, method, age]);
    }
    async function approve(a: Account, remembered = false): Promise<Approval> {
      await actor('service_role');
      return (await db.query<{ approval: Approval }>(
        'select public.approve_email_otp_login($1,$2,$3) as approval',
        [a.user, a.session, remembered],
      )).rows[0].approval;
    }
    async function verified(a: Account) {
      await actor('authenticated', a.user, a.session);
      return (await db.query<{ ok: boolean }>('select public.is_login_verified() as ok')).rows[0].ok;
    }
    async function denied(a: Account) {
      // Either a null result or an explicit rejection is safe; no grant may exist afterwards.
      let approval: Approval = null;
      try { approval = await approve(a); }
      catch (error) { assert.match(String(error), /not_authorized|invalid_confirmation|invalid_approval|invalid_request/); }
      assert.equal(approval, null);
      await actor();
      assert.equal((await db.query('select * from private.verified_login_sessions where session_id=$1', [a.session])).rows.length, 0);
    }

    await t.test('browser roles cannot issue an OTP approval or inspect its records', async () => {
      const a = await account(); await evidence(a);
      for (const role of ['anon', 'authenticated']) {
        await actor(role, a.user, a.session);
        await assert.rejects(db.query('select public.approve_email_otp_login($1,$2,false)', [a.user, a.session]), /permission denied/);
        await assert.rejects(db.query('select * from private.verified_login_sessions'), /permission denied/);
      }
      assert.equal(await verified(a), false);
      await actor('service_role');
      for (const args of [[null, a.session, false], [a.user, null, false], [a.user, a.session, null]]) {
        await assert.rejects(db.query('select public.approve_email_otp_login($1,$2,$3)', args), /invalid_confirmation/);
      }
    });

    await t.test('password-only, missing and stale OTP evidence cannot grant access', async () => {
      const missing = await account(); await denied(missing);
      const password = await account(); await evidence(password, 'password'); await denied(password);
      const stale = await account(); await evidence(stale, 'otp', '16 minutes'); await denied(stale);
      const future = await account(); await evidence(future, 'otp', '-1 minute'); await denied(future);
      const unrelated = await account(), source = await account(); await evidence(source); await denied(unrelated);
    });

    await t.test('OTP approval requires the current confirmed user and its live matching Auth session', async () => {
      const a = await account(), b = await account(); await evidence(a); await evidence(b);
      await denied({ ...a, session: b.session });
      await denied({ ...a, session: uuid() });
      await actor();
      await db.query("update auth.sessions set not_after=now()-interval '1 second' where id=$1", [a.session]);
      await denied(a);
      await actor(); await db.query('update auth.users set email_confirmed_at=null where id=$1', [b.user]);
      await denied(b);
    });

    await t.test('a successful OTP unlocks only its own plan and needs no second emailed challenge', async () => {
      const a = await account(), b = await account(); await evidence(a);
      assert.equal(await verified(a), false);
      assert.equal((await db.query('select * from public.profiles')).rows.length, 0);
      await assert.rejects(db.query('select public.save_student_profile($1,$2,0)', ['Alex', answers]), /not_authorized/);
      const approval = await approve(a);
      assert.equal(approval?.email, a.email); assert.equal(approval?.remembered, false);
      const hours = (Date.parse(approval!.expires_at) - Date.now()) / 3_600_000;
      assert.ok(hours > 11.9 && hours <= 12.01);
      assert.equal(await verified(a), true);
      assert.equal((await db.query('select * from public.profiles')).rows.length, 1);
      await db.query('select public.save_student_profile($1,$2,0)', ['Alex', answers]);
      assert.deepEqual((await db.query<{ answers: unknown }>('select answers from public.onboarding_answers')).rows[0].answers, answers);
      assert.equal((await db.query('select * from public.profiles where user_id=$1', [b.user])).rows.length, 0);
      assert.equal(await verified(b), false);
      await actor();
      assert.equal((await db.query('select * from private.login_challenges where user_id=$1', [a.user])).rows.length, 0);
    });

    await t.test('remembered approvals last 30 days and cannot exceed Auth session expiry', async () => {
      const a = await account(); await evidence(a);
      const approval = await approve(a, true);
      assert.equal(approval?.remembered, true);
      const days = (Date.parse(approval!.expires_at) - Date.now()) / 86_400_000;
      assert.ok(days > 29.99 && days <= 30.01);
      const b = await account(); await evidence(b);
      await actor();
      await db.query("update auth.sessions set not_after=now()+interval '2 hours' where id=$1", [b.session]);
      const limited = await approve(b, true);
      const hours = (Date.parse(limited!.expires_at) - Date.now()) / 3_600_000;
      assert.ok(hours > 1.99 && hours <= 2.01);
    });

    await t.test('retrying approval preserves the original deadline and remember preference', async () => {
      const a = await account(); await evidence(a); await approve(a, false);
      await actor();
      await db.query("update private.verified_login_sessions set expires_at=expires_at-interval '1 hour' where session_id=$1", [a.session]);
      const original = (await db.query<{ expires_at: Date | string }>('select expires_at from private.verified_login_sessions where session_id=$1', [a.session])).rows[0];
      const repeated = await approve(a, true);
      assert.equal(repeated?.remembered, false);
      assert.equal(Date.parse(repeated!.expires_at), new Date(original.expires_at).getTime());
      await actor();
      assert.equal((await db.query('select * from private.verified_login_sessions where session_id=$1', [a.session])).rows.length, 1);
      await db.query("update private.verified_login_sessions set expires_at=now()-interval '1 second' where session_id=$1", [a.session]);
      await assert.rejects(approve(a, true), /not_authorized/);
      assert.equal(await verified(a), false, 'an expired approval cannot be renewed by retrying the native OTP bridge');
    });

    await t.test('revocation and Auth changes invalidate native OTP approvals', async () => {
      const a = await account(); await evidence(a); await approve(a);
      await actor('service_role'); await db.query('select public.revoke_login_sessions($1,$2)', [a.user, a.session]);
      assert.equal(await verified(a), false);
      for (const update of ["encrypted_password='changed-password-hash'", "email='changed@example.invalid'", 'email_confirmed_at=null']) {
        const changed = await account(); await evidence(changed); await approve(changed);
        await actor(); await db.query(`update auth.users set ${update} where id=$1`, [changed.user]);
        assert.equal(await verified(changed), false);
      }
      const removed = await account(); await evidence(removed); await approve(removed);
      await actor(); await db.query('delete from auth.sessions where id=$1', [removed.session]);
      assert.equal(await verified(removed), false);
      await actor();
      assert.equal((await db.query('select * from private.verified_login_sessions where session_id=$1', [removed.session])).rows.length, 0);
    });
  } finally {
    await db.close();
  }
});
