-- Personal login unlocks the plan. Campus mailbox verification is optional.
-- Preserve ownership, email session approval, revision locking and answer validation.
begin;

alter policy own_answers on public.onboarding_answers
 using(user_id=auth.uid() and public.is_login_verified());
alter policy own_progress on public.user_task_progress
 using(user_id=auth.uid() and public.is_login_verified());
-- The restrictive verified_login_* policies from migration004 remain in place.

create or replace function public.save_student_profile(p_name text,p_answers jsonb,p_revision bigint) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();current_revision bigint;
begin
 if uid is null or not public.is_login_verified() then raise exception 'not_authorized';end if;
 if p_name is null or char_length(trim(p_name)) not between 1 and 60 or not private.valid_answers(p_answers) then raise exception 'invalid_profile';end if;
 select revision into current_revision from public.profiles where user_id=uid for update;
 if current_revision is null or p_revision is distinct from current_revision then raise exception 'revision_conflict';end if;
 update public.profiles set display_name=trim(p_name),revision=revision+1,updated_at=now() where user_id=uid;
 insert into public.onboarding_answers(user_id,answers) values(uid,p_answers) on conflict(user_id) do update set answers=excluded.answers,updated_at=now();
end;$$;

create or replace function public.set_task_completion(p_task text,p_complete boolean,p_revision bigint) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();current_revision bigint;a jsonb;rule text;
begin
 if uid is null or not public.is_login_verified() then raise exception 'not_authorized';end if;
 if p_complete is null then raise exception 'invalid_completion';end if;
 select revision into current_revision from public.profiles where user_id=uid for update;
 if current_revision is null or current_revision is distinct from p_revision then raise exception 'revision_conflict';end if;
 select answers into a from public.onboarding_answers where user_id=uid;
 select r.rule_key into rule from public.task_rules r join public.task_templates t on t.id=r.task_id where t.id=p_task and t.active;
 if a is null or rule is null or not private.task_applies(rule,a) then raise exception 'task_not_applicable';end if;
 insert into public.user_task_progress(user_id,task_id,completed_at) values(uid,p_task,case when p_complete then now() else null end)
 on conflict(user_id,task_id) do update set completed_at=excluded.completed_at,updated_at=now();
 update public.profiles set revision=revision+1,updated_at=now() where user_id=uid;
end;$$;

create or replace function public.reset_task_completions(p_revision bigint) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();current_revision bigint;
begin
 if uid is null or not public.is_login_verified() then raise exception 'not_authorized';end if;
 select revision into current_revision from public.profiles where user_id=uid for update;
 if current_revision is null or p_revision is distinct from current_revision then raise exception 'revision_conflict';end if;
 update public.user_task_progress set completed_at=null,updated_at=now() where user_id=uid;
 update public.profiles set revision=revision+1,updated_at=now() where user_id=uid;
end;$$;

revoke all on function public.save_student_profile(text,jsonb,bigint),public.set_task_completion(text,boolean,bigint),public.reset_task_completions(bigint) from public,anon;
grant execute on function public.save_student_profile(text,jsonb,bigint),public.set_task_completion(text,boolean,bigint),public.reset_task_completions(bigint) to authenticated;
commit;
