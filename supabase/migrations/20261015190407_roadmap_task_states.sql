-- Phase 1: reversible N/A and stable utility readiness. Application rollback keeps
-- this additive migration: every persisted task ID exists in the previous catalog.
begin;

alter table public.user_task_progress add column not_applicable_at timestamptz;
alter table public.user_task_progress add constraint task_progress_exclusive_state
 check (completed_at is null or not_applicable_at is null);

-- Preserve the pre-mapping rows for recovery. No student data is removed. The
-- archive is private, inaccessible to API roles, and follows account deletion.
create table private.utility_progress_before_readiness (
 user_id uuid not null references auth.users(id) on delete cascade,
 task_id text not null references public.task_templates(id),
 completed_at timestamptz, updated_at timestamptz not null,
 captured_at timestamptz not null default now(),
 primary key(user_id,task_id)
);
alter table private.utility_progress_before_readiness enable row level security;
revoke all on private.utility_progress_before_readiness from public,anon,authenticated;
insert into private.utility_progress_before_readiness(user_id,task_id,completed_at,updated_at)
 select user_id,task_id,completed_at,updated_at from public.user_task_progress
 where task_id in ('arrange-electricity','confirm-electricity-responsibility','arrange-home-internet','confirm-internet-responsibility');

create function private.canonical_progress_task(p_task text) returns text
language sql immutable set search_path='' as $$
 select case p_task when 'confirm-electricity-responsibility' then 'arrange-electricity'
 when 'confirm-internet-responsibility' then 'arrange-home-internet' else p_task end;
$$;
revoke all on function private.canonical_progress_task(text) from public,anon,authenticated;

-- Latest updated_at wins even when its completed_at is NULL (explicit undo).
-- Exact ties prefer the canonical ID. Write both identities for old readers.
with latest as (
 select distinct on (user_id,private.canonical_progress_task(task_id))
 user_id,private.canonical_progress_task(task_id) as canonical,completed_at,updated_at
 from private.utility_progress_before_readiness
 order by user_id,private.canonical_progress_task(task_id),updated_at desc,
 (task_id=private.canonical_progress_task(task_id)) desc,task_id
), mapped as (
 select l.*,ids.task_id from latest l cross join lateral unnest(case l.canonical
 when 'arrange-electricity' then array['arrange-electricity','confirm-electricity-responsibility']
 else array['arrange-home-internet','confirm-internet-responsibility'] end) ids(task_id)
)
insert into public.user_task_progress(user_id,task_id,completed_at,updated_at)
 select user_id,task_id,completed_at,updated_at from mapped
 on conflict(user_id,task_id) do update set completed_at=excluded.completed_at,updated_at=excluded.updated_at;

-- Keep historical rules and catalog IDs intact for rollback. Current utility
-- readiness always applies; its instructions depend on housing responsibility.
create function private.current_task_applies(p_task text,a jsonb) returns boolean
language sql stable set search_path='' as $$
 select coalesce(a is not null and exists(
 select 1 from public.task_templates t join public.task_rules r on r.task_id=t.id
 where t.id=private.canonical_progress_task(p_task) and t.active
 and (t.id in ('arrange-electricity','arrange-home-internet') or private.task_applies(r.rule_key,a))),false);
$$;
revoke all on function private.current_task_applies(text,jsonb) from public,anon,authenticated;

-- The privileged implementation stays outside the exposed schema. It binds
-- identity to auth.uid(), verifies the active login and locks the user's revision.
create function private.write_task_state(p_task text,p_state text,p_revision bigint) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();current_revision bigint;a jsonb;canonical text;stamp timestamptz:=clock_timestamp();
begin
 if uid is null or not public.is_login_verified() then raise exception 'not_authorized';end if;
 if p_state is null or p_state not in ('pending','completed','not_applicable') then raise exception 'invalid_task_state';end if;
 select revision into current_revision from public.profiles where user_id=uid for update;
 if current_revision is null or p_revision is distinct from current_revision then raise exception 'revision_conflict';end if;
 select answers into a from public.onboarding_answers where user_id=uid;
 if not private.current_task_applies(p_task,a) then raise exception 'task_not_applicable';end if;
 canonical:=private.canonical_progress_task(p_task);
 insert into public.user_task_progress(user_id,task_id,completed_at,not_applicable_at,updated_at)
 select uid,task_id,case when p_state='completed' then stamp else null end,
 case when p_state='not_applicable' then stamp else null end,stamp
 from unnest(case canonical
 when 'arrange-electricity' then array['arrange-electricity','confirm-electricity-responsibility']
 when 'arrange-home-internet' then array['arrange-home-internet','confirm-internet-responsibility']
 else array[canonical] end) ids(task_id)
 on conflict(user_id,task_id) do update set completed_at=excluded.completed_at,
 not_applicable_at=excluded.not_applicable_at,updated_at=excluded.updated_at;
 update public.profiles set revision=revision+1,updated_at=stamp where user_id=uid;
end;$$;
revoke all on function private.write_task_state(text,text,bigint) from public,anon,authenticated;
-- Schema USAGE is only name resolution. All private tables and helper functions
-- remain revoked; this one identity-checked entry point is the sole new grant.
grant usage on schema private to authenticated;
grant execute on function private.write_task_state(text,text,bigint) to authenticated;
create function public.set_task_state(p_task text,p_state text,p_revision bigint) returns void
language sql security invoker set search_path='' as $$
 select private.write_task_state(p_task,p_state,p_revision);
$$;
revoke all on function public.set_task_state(text,text,bigint) from public,anon;
grant execute on function public.set_task_state(text,text,bigint) to authenticated;

-- Older clients can complete or undo either historical utility ID. A completion
-- clears N/A; explicit undo restores pending. No backfill-only compatibility gap.
create or replace function public.set_task_completion(p_task text,p_complete boolean,p_revision bigint) returns void
language plpgsql security invoker set search_path='' as $$
begin
 if p_complete is null then raise exception 'invalid_completion';end if;
 perform private.write_task_state(p_task,case when p_complete then 'completed' else 'pending' end,p_revision);
end;$$;
revoke all on function public.set_task_completion(text,boolean,bigint) from public,anon;
grant execute on function public.set_task_completion(text,boolean,bigint) to authenticated;

-- Preserve the existing reset's literal scope, including when called by a
-- rollback client: completed records only; N/A and preference answers survive.
create or replace function public.reset_task_completions(p_revision bigint) returns void
language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();current_revision bigint;
begin
 if uid is null or not public.is_login_verified() then raise exception 'not_authorized';end if;
 select revision into current_revision from public.profiles where user_id=uid for update;
 if current_revision is null or p_revision is distinct from current_revision then raise exception 'revision_conflict';end if;
 update public.user_task_progress set completed_at=null,updated_at=clock_timestamp()
 where user_id=uid and completed_at is not null;
 update public.profiles set revision=revision+1,updated_at=clock_timestamp() where user_id=uid;
end;$$;
revoke all on function public.reset_task_completions(bigint) from public,anon;
grant execute on function public.reset_task_completions(bigint) to authenticated;
commit;
