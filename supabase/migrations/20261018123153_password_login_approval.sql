begin;

-- Returning users enter their password once. Keep the existing session-bound
-- plan gate so revoked, expired, and unrelated sessions cannot read a plan.
-- This bridge is called only by the server after a successful password login.
create function public.approve_password_login(p_user uuid, p_session uuid, p_remember boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 login_email text;
 session_expiry timestamptz;
 approval private.verified_login_sessions%rowtype;
begin
 if p_user is null or p_session is null or p_remember is null then
  raise exception 'invalid_approval';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('login-user:'||p_user::text,0));
 select u.email,s.not_after into login_email,session_expiry
 from auth.users u join auth.sessions s on s.user_id=u.id
 where u.id=p_user and s.id=p_session and u.email_confirmed_at is not null
 and u.email is not null and u.email<>''
 and u.encrypted_password is not null and u.encrypted_password<>''
 and (s.not_after is null or s.not_after>now())
 and exists(select 1 from auth.mfa_amr_claims a where a.session_id=s.id
   and a.authentication_method='password' and a.updated_at>now()-interval '5 minutes'
   and a.updated_at<=now()) for share of u,s;
 if not found then raise exception 'not_authorized'; end if;
 insert into private.verified_login_sessions(session_id,user_id,email,remembered,verified_at,expires_at)
 values(p_session,p_user,login_email,p_remember,now(),
   least(now()+case when p_remember then interval '30 days' else interval '12 hours' end,session_expiry))
 on conflict(session_id) do nothing;
 select * into approval from private.verified_login_sessions
 where session_id=p_session and user_id=p_user and email=login_email and expires_at>now();
 if not found then raise exception 'not_authorized'; end if;
 return jsonb_build_object('remembered',approval.remembered,'expires_at',approval.expires_at,'email',approval.email);
end;$$;
revoke all on function public.approve_password_login(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.approve_password_login(uuid,uuid,boolean) to service_role;

-- A valid recovery link can open the password-reset form without approving the
-- session for private plan data. The server must still perform the Auth update.
create function public.is_password_recovery_session(p_user uuid, p_session uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from auth.users u join auth.sessions s on s.user_id=u.id
  where u.id=p_user and s.id=p_session and u.email_confirmed_at is not null
  and u.email is not null and u.email<>''
  and (s.not_after is null or s.not_after>now())
  and exists(select 1 from auth.mfa_amr_claims a where a.session_id=s.id
    and a.authentication_method='recovery' and a.updated_at>now()-interval '15 minutes'
    and a.updated_at<=now())
 );
$$;
revoke all on function public.is_password_recovery_session(uuid,uuid) from public,anon,authenticated;
grant execute on function public.is_password_recovery_session(uuid,uuid) to service_role;

commit;
