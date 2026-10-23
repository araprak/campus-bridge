-- CampusBridge V1. Apply only to the new project created for this application.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check(char_length(display_name)<=60),
 revision bigint not null default 0 check(revision>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.institution_verifications (
 user_id uuid primary key references auth.users(id) on delete cascade,
 email text not null unique check(email=lower(email) and email ~ '^[^@[:space:]]+@utdallas[.]edu$'),
 verified_at timestamptz not null, revoked_at timestamptz
);
create table public.onboarding_answers (
 user_id uuid primary key references auth.users(id) on delete cascade,
 answers jsonb not null check(jsonb_typeof(answers)='object'),
 schema_version integer not null default 1 check(schema_version=1),
 completed_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.resources (
 id text primary key, title text not null, url text not null check(url like 'https://%'),
 source_type text not null check(source_type in ('official_utd','government','local_provider_service')),
 publisher text not null, reviewed_at date, link_check_status text not null,
 content jsonb not null, active boolean not null default true
);
create table public.task_templates (
 id text primary key, title text not null,
 category text not null check(category in ('housing','transportation','services','campus','daily_life')),
 horizon text not null check(horizon in ('first_48_hours','first_week','first_30_days')),
 priority text not null check(priority in ('high','standard')),
 content jsonb not null, content_version integer not null default 1,
 active boolean not null default true
);
create table public.task_rules (
 task_id text primary key references public.task_templates(id),
 rule_key text not null check(rule_key in ('always','off_campus','on_campus','electricity_setup','internet_setup','electricity_unknown','internet_unknown','roommates','parking','campus_transport')),
 rule_version integer not null default 1 check(rule_version=1)
);
create table public.task_resources (
 task_id text references public.task_templates(id), resource_id text references public.resources(id),
 primary key(task_id,resource_id)
);
create table public.user_task_progress (
 user_id uuid references auth.users(id) on delete cascade,
 task_id text references public.task_templates(id),
 completed_at timestamptz, updated_at timestamptz not null default now(),
 primary key(user_id,task_id)
);
create table private.verification_challenges (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 email text not null, code_digest text not null, ip_digest text not null,
 attempts integer not null default 0 check(attempts>=0),
 created_at timestamptz not null default now(), expires_at timestamptz not null,
 consumed_at timestamptz
);
create index challenges_user_created on private.verification_challenges(user_id,created_at desc);
create index challenges_email_created on private.verification_challenges(email,created_at desc);
create index challenges_ip_created on private.verification_challenges(ip_digest,created_at desc);

create function private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(user_id) values(new.id) on conflict do nothing;return new;end;$$;
create trigger on_campusbridge_signup after insert on auth.users for each row execute function private.new_profile();
insert into public.profiles(user_id) select id from auth.users on conflict do nothing;

create function public.is_utd_verified() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.institution_verifications v join auth.users u on u.id=v.user_id where v.user_id=auth.uid() and v.revoked_at is null and v.verified_at is not null);
$$;
revoke all on function public.is_utd_verified() from public,anon;
grant execute on function public.is_utd_verified() to authenticated;

alter table public.profiles enable row level security;
alter table public.institution_verifications enable row level security;
alter table public.onboarding_answers enable row level security;
alter table public.resources enable row level security;
alter table public.task_templates enable row level security;
alter table public.task_rules enable row level security;
alter table public.task_resources enable row level security;
alter table public.user_task_progress enable row level security;
alter table private.verification_challenges enable row level security;
revoke all on public.profiles,public.institution_verifications,public.onboarding_answers,public.user_task_progress from anon,authenticated;
grant select on public.profiles,public.institution_verifications,public.onboarding_answers,public.user_task_progress to authenticated;
create policy own_profile on public.profiles for select to authenticated using(user_id=auth.uid());
create policy own_verification on public.institution_verifications for select to authenticated using(user_id=auth.uid());
create policy own_answers on public.onboarding_answers for select to authenticated using(user_id=auth.uid() and public.is_utd_verified());
create policy own_progress on public.user_task_progress for select to authenticated using(user_id=auth.uid() and public.is_utd_verified());
revoke all on public.resources,public.task_templates,public.task_rules,public.task_resources from anon,authenticated;
grant select on public.resources,public.task_templates,public.task_rules,public.task_resources to anon,authenticated;
create policy published_resources on public.resources for select using(active);
create policy published_tasks on public.task_templates for select using(active);
create policy published_rules on public.task_rules for select using(exists(select 1 from public.task_templates t where t.id=task_id and t.active));
create policy published_task_resources on public.task_resources for select using(exists(select 1 from public.task_templates t where t.id=task_id and t.active) and exists(select 1 from public.resources r where r.id=resource_id and r.active));

create function private.valid_answers(a jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare v_date date; count_all integer;count_distinct integer;
begin
 if jsonb_typeof(a)<>'object' or not(a ?& array['arrivalDate','housingLocation','housingType','household','electricity','internet','hasCar','transport','priorities']) then return false;end if;
 if (select count(*) from jsonb_object_keys(a))<>9 then return false;end if;
 if a->>'arrivalDate' !~ '^\d{4}-\d{2}-\d{2}$' then return false;end if;
 v_date:=(a->>'arrivalDate')::date;
 if to_char(v_date,'YYYY-MM-DD')<>a->>'arrivalDate' then return false;end if;
 if a->>'housingLocation' not in ('on_campus','off_campus') or a->>'housingType' not in ('apartment','house','residence','temporary')
 or a->>'household' not in ('alone','roommates') or a->>'electricity' not in ('included','not_included','unknown')
 or a->>'internet' not in ('included','not_included','unknown') or a->>'transport' not in ('transit','car','walking','undecided')
 or jsonb_typeof(a->'hasCar')<>'boolean' or jsonb_typeof(a->'priorities')<>'array' then return false;end if;
 if exists(select 1 from jsonb_each(a) e where e.value='null'::jsonb) then return false;end if;
 select count(*),count(distinct value) into count_all,count_distinct from jsonb_array_elements_text(a->'priorities');
 if count_all>2 or count_all<>count_distinct then return false;end if;
 if exists(select 1 from jsonb_array_elements_text(a->'priorities') x where x.value not in ('housing','transportation','services','campus','daily_life')) then return false;end if;
 return true;
exception when others then return false;
end;$$;

create function public.save_student_profile(p_name text,p_answers jsonb,p_revision bigint) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();current_revision bigint;
begin
 if uid is null or not public.is_utd_verified() then raise exception 'not_authorized';end if;
 if p_name is null or char_length(trim(p_name)) not between 1 and 60 or not private.valid_answers(p_answers) then raise exception 'invalid_profile';end if;
 select revision into current_revision from public.profiles where user_id=uid for update;
 if current_revision is null or p_revision is distinct from current_revision then raise exception 'revision_conflict';end if;
 update public.profiles set display_name=trim(p_name),revision=revision+1,updated_at=now() where user_id=uid;
 insert into public.onboarding_answers(user_id,answers) values(uid,p_answers) on conflict(user_id) do update set answers=excluded.answers,updated_at=now();
end;$$;

create function private.task_applies(rule text,a jsonb) returns boolean language sql immutable set search_path='' as $$
 select case rule
 when 'always' then true when 'campus_transport' then true
 when 'off_campus' then a->>'housingLocation'='off_campus'
 when 'on_campus' then a->>'housingLocation'='on_campus'
 when 'electricity_setup' then a->>'housingLocation'='off_campus' and a->>'electricity'='not_included'
 when 'internet_setup' then a->>'housingLocation'='off_campus' and a->>'internet'='not_included'
 when 'electricity_unknown' then a->>'electricity'='unknown'
 when 'internet_unknown' then a->>'internet'='unknown'
 when 'roommates' then a->>'household'='roommates'
 when 'parking' then a->'hasCar'='true'::jsonb else false end;
$$;
create function public.set_task_completion(p_task text,p_complete boolean,p_revision bigint) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();current_revision bigint;a jsonb;rule text;
begin
 if uid is null or not public.is_utd_verified() then raise exception 'not_authorized';end if;
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
revoke all on function public.save_student_profile(text,jsonb,bigint),public.set_task_completion(text,boolean,bigint) from public,anon;
grant execute on function public.save_student_profile(text,jsonb,bigint),public.set_task_completion(text,boolean,bigint) to authenticated;

create function public.create_utd_challenge(p_user uuid,p_email text,p_digest text,p_ip_digest text) returns uuid language plpgsql security definer set search_path='' as $$
declare challenge uuid; lock_key bigint;
begin
 if p_user is null or p_email is null or p_digest is null or p_ip_digest is null or p_email<>lower(p_email) or p_email !~ '^[^@[:space:]]+@utdallas[.]edu$' or char_length(p_email)>254 or p_digest !~ '^[a-f0-9]{64}$' or p_ip_digest !~ '^[a-f0-9]{64}$' then raise exception 'invalid_challenge';end if;
 for lock_key in select distinct hashtextextended(k,0) from unnest(array['user:'||p_user::text,'email:'||p_email,'ip:'||p_ip_digest]) k order by 1 loop perform pg_advisory_xact_lock(lock_key);end loop;
 if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then raise exception 'not_authorized';end if;
 delete from private.verification_challenges where created_at<now()-interval '24 hours';
 if exists(select 1 from private.verification_challenges where user_id=p_user and created_at>now()-interval '60 seconds')
 or (select count(*) from private.verification_challenges where (user_id=p_user or email=p_email) and created_at>now()-interval '1 hour')>=6
 or (select count(*) from private.verification_challenges where ip_digest=p_ip_digest and created_at>now()-interval '1 hour')>=20 then raise exception 'rate_limited';end if;
 update private.verification_challenges set consumed_at=now() where user_id=p_user and consumed_at is null;
 insert into private.verification_challenges(user_id,email,code_digest,ip_digest,expires_at) values(p_user,p_email,p_digest,p_ip_digest,now()+interval '10 minutes') returning id into challenge;
 return challenge;
end;$$;
create function public.redeem_utd_challenge(p_user uuid,p_email text,p_digest text) returns boolean language plpgsql security definer set search_path='' as $$
declare ch private.verification_challenges%rowtype;lock_key bigint;
begin
 if p_user is null or p_email is null or p_digest is null or p_digest !~ '^[a-f0-9]{64}$' then return false;end if;
 for lock_key in select distinct hashtextextended(k,0) from unnest(array['user:'||p_user::text,'email:'||p_email]) k order by 1 loop perform pg_advisory_xact_lock(lock_key);end loop;
 if not exists(select 1 from auth.users where id=p_user and email_confirmed_at is not null) then return false;end if;
 select * into ch from private.verification_challenges where user_id=p_user and email=p_email and consumed_at is null order by created_at desc limit 1 for update;
 if not found then return false;end if;
 if ch.expires_at<=now() or ch.attempts>=5 then update private.verification_challenges set consumed_at=now() where id=ch.id;return false;end if;
 update private.verification_challenges set attempts=attempts+1 where id=ch.id;
 if ch.code_digest is distinct from p_digest then return false;end if;
 if exists(select 1 from public.institution_verifications where email=p_email and user_id<>p_user) then return false;end if;
 insert into public.institution_verifications(user_id,email,verified_at) values(p_user,p_email,now()) on conflict(user_id) do update set email=excluded.email,verified_at=now(),revoked_at=null;
 update private.verification_challenges set consumed_at=now() where user_id=p_user and consumed_at is null;
 return true;
end;$$;
revoke all on function public.create_utd_challenge(uuid,text,text,text),public.redeem_utd_challenge(uuid,text,text) from public,anon,authenticated;
grant execute on function public.create_utd_challenge(uuid,text,text,text),public.redeem_utd_challenge(uuid,text,text) to service_role;
revoke all on all functions in schema private from public,anon,authenticated;
commit;
