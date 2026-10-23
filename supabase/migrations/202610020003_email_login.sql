-- Email sign-in codes and session-bound approvals. Apply before deploying the new login flow.
begin;

create table private.login_challenges (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 -- Keep consumed challenges after an Auth session ends so signing out cannot reset rate limits.
 session_id uuid not null,
 email text not null,
 code_digest text not null check(code_digest ~ '^[a-f0-9]{64}$'),
 ip_digest text not null check(ip_digest ~ '^[a-f0-9]{64}$'),
 remembered boolean not null,
 attempts integer not null default 0 check(attempts between 0 and 5),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 consumed_at timestamptz
);
create index login_challenges_user_created on private.login_challenges(user_id,created_at desc);
create index login_challenges_ip_created on private.login_challenges(ip_digest,created_at desc);
create index login_challenges_session_created on private.login_challenges(session_id,created_at desc);

create table private.verified_login_sessions (
 session_id uuid primary key references auth.sessions(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 email text not null,
 remembered boolean not null,
 verified_at timestamptz not null default now(),
 expires_at timestamptz not null
);
create index verified_login_sessions_user on private.verified_login_sessions(user_id);
alter table private.login_challenges enable row level security;
alter table private.verified_login_sessions enable row level security;
revoke all on private.login_challenges,private.verified_login_sessions from public,anon,authenticated;

create function public.create_login_challenge(p_user uuid,p_session uuid,p_digest text,p_ip_digest text,p_remember bool)
returns uuid language plpgsql security definer set search_path='' as $$
declare challenge uuid; lock_key bigint; login_email text; session_expiry timestamptz;
begin
 if p_user is null or p_session is null or p_remember is null or p_digest is null or p_ip_digest is null
 or p_digest !~ '^[a-f0-9]{64}$' or p_ip_digest !~ '^[a-f0-9]{64}$' then raise exception 'invalid_challenge';end if;
 for lock_key in select distinct hashtextextended(k,0) from unnest(array['login-user:'||p_user::text,'login-ip:'||p_ip_digest]) k order by 1
 loop perform pg_advisory_xact_lock(lock_key);end loop;
 -- These locks also serialize against account changes and session deletion.
 select email into login_email from auth.users where id=p_user and email_confirmed_at is not null for share;
 if not found or login_email is null or login_email='' then raise exception 'not_authorized';end if;
 select not_after into session_expiry from auth.sessions where id=p_session and user_id=p_user for share;
 if not found or (session_expiry is not null and session_expiry<=now()) then raise exception 'not_authorized';end if;
 delete from private.login_challenges where created_at<now()-interval '24 hours';
 if exists(select 1 from private.login_challenges where user_id=p_user and created_at>now()-interval '60 seconds')
 or (select count(*) from private.login_challenges where user_id=p_user and created_at>now()-interval '1 hour')>=6
 or (select count(*) from private.login_challenges where ip_digest=p_ip_digest and created_at>now()-interval '1 hour')>=20
 then raise exception 'rate_limited';end if;
 update private.login_challenges set consumed_at=now() where session_id=p_session and user_id=p_user and consumed_at is null;
 insert into private.login_challenges(user_id,session_id,email,code_digest,ip_digest,remembered,expires_at)
 values(p_user,p_session,login_email,p_digest,p_ip_digest,p_remember,least(now()+interval '10 minutes',session_expiry)) returning id into challenge;
 return challenge;
end;$$;

create function public.redeem_login_challenge(p_user uuid,p_session uuid,p_digest text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare ch private.login_challenges%rowtype; login_email text; session_expiry timestamptz; approval_expiry timestamptz;
begin
 if p_user is null or p_session is null or p_digest is null or p_digest !~ '^[a-f0-9]{64}$' then return null;end if;
 perform pg_advisory_xact_lock(hashtextextended('login-user:'||p_user::text,0));
 select email into login_email from auth.users where id=p_user and email_confirmed_at is not null for share;
 if not found or login_email is null or login_email='' then return null;end if;
 select not_after into session_expiry from auth.sessions where id=p_session and user_id=p_user for share;
 if not found or (session_expiry is not null and session_expiry<=now()) then return null;end if;
 select * into ch from private.login_challenges where user_id=p_user and session_id=p_session and consumed_at is null order by created_at desc limit 1 for update;
 if not found then return null;end if;
 if ch.email is distinct from login_email or ch.expires_at<=now() or ch.attempts>=5 then
  update private.login_challenges set consumed_at=now() where id=ch.id;return null;
 end if;
 update private.login_challenges set attempts=attempts+1,
 consumed_at=case when attempts+1>=5 then now() else consumed_at end where id=ch.id;
 if ch.code_digest is distinct from p_digest then return null;end if;
 approval_expiry:=least(now()+case when ch.remembered then interval '30 days' else interval '12 hours' end,session_expiry);
 insert into private.verified_login_sessions(session_id,user_id,email,remembered,verified_at,expires_at)
 values(p_session,p_user,login_email,ch.remembered,now(),approval_expiry)
 on conflict(session_id) do update set user_id=excluded.user_id,email=excluded.email,remembered=excluded.remembered,verified_at=excluded.verified_at,expires_at=excluded.expires_at;
 update private.login_challenges set consumed_at=now() where user_id=p_user and session_id=p_session and consumed_at is null;
 return jsonb_build_object('remembered',ch.remembered,'expires_at',approval_expiry,'email',login_email);
end;$$;

create function public.revoke_login_sessions(p_user uuid,p_session uuid default null)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_user is null then return;end if;
 perform pg_advisory_xact_lock(hashtextextended('login-user:'||p_user::text,0));
 delete from private.verified_login_sessions where user_id=p_user and (p_session is null or session_id=p_session);
 update private.login_challenges set consumed_at=now() where user_id=p_user and (p_session is null or session_id=p_session) and consumed_at is null;
end;$$;

create function public.is_login_verified() returns boolean language plpgsql stable security definer set search_path='' as $$
declare session_claim text:=auth.jwt()->>'session_id';
begin
 if auth.uid() is null or session_claim is null or session_claim !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then return false;end if;
 return exists(
  select 1 from private.verified_login_sessions v
  join auth.sessions s on s.id=v.session_id and s.user_id=v.user_id
  join auth.users u on u.id=v.user_id
  where v.session_id=session_claim::uuid and v.user_id=auth.uid() and v.expires_at>now()
  and (s.not_after is null or s.not_after>now()) and u.email_confirmed_at is not null and u.email=v.email
 );
end;$$;

create function private.invalidate_login_approvals() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.encrypted_password is distinct from new.encrypted_password or old.email is distinct from new.email
 or old.email_confirmed_at is distinct from new.email_confirmed_at then
  delete from private.verified_login_sessions where user_id=new.id;
  update private.login_challenges set consumed_at=now() where user_id=new.id and consumed_at is null;
 end if;
 return new;
end;$$;
create trigger on_campusbridge_auth_change after update of encrypted_password,email,email_confirmed_at on auth.users
 for each row execute function private.invalidate_login_approvals();

revoke all on function public.create_login_challenge(uuid,uuid,text,text,bool),public.redeem_login_challenge(uuid,uuid,text),public.revoke_login_sessions(uuid,uuid) from public,anon,authenticated;
grant execute on function public.create_login_challenge(uuid,uuid,text,text,bool),public.redeem_login_challenge(uuid,uuid,text),public.revoke_login_sessions(uuid,uuid) to service_role;
revoke all on function public.is_login_verified() from public,anon;
grant execute on function public.is_login_verified() to authenticated;
revoke all on function private.invalidate_login_approvals() from public,anon,authenticated;
commit;
