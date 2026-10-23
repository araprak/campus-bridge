import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { planningCommunityPatch } from '../src/domain/apartment-discovery.ts';

const A = { user: '10000000-0000-4000-8000-000000000001', session: '10000000-0000-4000-8000-000000000002' };
const B = { user: '10000000-0000-4000-8000-000000000003', session: '10000000-0000-4000-8000-000000000004' };
const initialAnswers = {
  arrivalDate: '2027-01-15', leaseStartDate: '2027-01-14', housingLocation: 'off_campus',
  housingType: 'apartment', housingCommunity: 'northside', housingZip: '75080', household: 'roommates',
  electricity: 'unknown', internet: 'unknown', hasCar: false, transport: 'transit',
  transitMode: 'campus_bus', rentalHelp: 'undecided', priorities: ['housing'],
};
type Answers = typeof initialAnswers;

test('apartment planning changes persist through current authenticated RPCs without affecting another account', async t => {
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

    const save = (answers: Answers, revision: number) => db.query('select public.save_student_profile($1,$2,$3)', ['Alex', answers, revision]);
    async function state() {
      const profile = (await db.query<{ revision: number; display_name: string }>('select revision,display_name from public.profiles')).rows[0];
      const answers = (await db.query<{ answers: Answers }>('select answers from public.onboarding_answers')).rows[0]?.answers;
      const progress = (await db.query<{ task_id: string; completed_at: unknown }>('select task_id,completed_at from public.user_task_progress order by task_id')).rows;
      return { profile, answers, progress };
    }
    await actor('authenticated', A);

    await t.test('initial community, ZIP and lease date survive a fresh read with completed tasks', async () => {
      await save(initialAnswers, 0);
      await db.query('select public.set_task_completion($1,true,1)', ['confirm-off-campus-move-in']);
      await db.query('select public.set_task_completion($1,true,2)', ['check-student-tech']);
      const saved = await state();
      assert.deepEqual(saved.answers, initialAnswers);
      assert.equal(saved.profile.revision, 3);
      assert.equal(saved.progress.length, 2);
      assert.ok(saved.progress.every(task => task.completed_at !== null));
    });

    await t.test('changing the planning community saves its ZIP, clears the old lease and preserves completion marks', async () => {
      const before = await state();
      const patch = planningCommunityPatch(before.answers, 'estates-on-frankford');
      assert.deepEqual(patch, { housingCommunity: 'estates-on-frankford', housingZip: '75252', leaseStartDate: '' });
      await save({ ...before.answers, ...patch }, before.profile.revision);
      const after = await state();
      assert.deepEqual(after.answers, { ...initialAnswers, ...patch });
      assert.equal(after.profile.revision, 4);
      assert.deepEqual(after.progress, before.progress);
    });

    await t.test('a new lease persists and reselecting the same community requests no write or lease reset', async () => {
      const before = await state();
      await save({ ...before.answers, leaseStartDate: '2027-01-12' }, before.profile.revision);
      const saved = await state();
      assert.equal(saved.answers.leaseStartDate, '2027-01-12');
      assert.equal(saved.profile.revision, 5);
      assert.deepEqual(saved.progress, before.progress);
      assert.equal(planningCommunityPatch(saved.answers, saved.answers.housingCommunity), null);
      assert.deepEqual(await state(), saved);
    });

    await t.test('a stale apartment change cannot overwrite the newer community, lease or completion state', async () => {
      const before = await state();
      const patch = planningCommunityPatch(before.answers, 'northside');
      assert.ok(patch);
      await assert.rejects(save({ ...before.answers, ...patch }, before.profile.revision - 1), /revision_conflict/);
      assert.deepEqual(await state(), before);
    });

    await t.test('another approved account cannot read the saved home and its own save leaves the first account intact', async () => {
      const before = await state();
      await actor('authenticated', B);
      for (const table of ['profiles', 'onboarding_answers', 'user_task_progress']) {
        assert.deepEqual((await db.query(`select * from public.${table} where user_id=$1`, [A.user])).rows, [], table);
      }
      await save({ ...initialAnswers, leaseStartDate: '2027-02-01' }, 0);
      assert.equal((await state()).answers.leaseStartDate, '2027-02-01');
      await actor('authenticated', A);
      assert.deepEqual(await state(), before);
    });
  } finally {
    await db.close();
  }
});
