-- Apply immediately after the new login flow is deployed. Existing sessions must verify once.
begin;
-- Restrictive policies are ANDed with every existing permissive ownership policy.
create policy verified_login_profile on public.profiles as restrictive for all to authenticated
 using(public.is_login_verified()) with check(public.is_login_verified());
create policy verified_login_institution on public.institution_verifications as restrictive for all to authenticated
 using(public.is_login_verified()) with check(public.is_login_verified());
create policy verified_login_answers on public.onboarding_answers as restrictive for all to authenticated
 using(public.is_login_verified()) with check(public.is_login_verified());
create policy verified_login_progress on public.user_task_progress as restrictive for all to authenticated
 using(public.is_login_verified()) with check(public.is_login_verified());

-- Existing SECURITY DEFINER write functions use this predicate, so raw Auth JWTs
-- cannot bypass the new gate by calling a write RPC directly.
create or replace function public.is_utd_verified() returns boolean language sql stable security definer set search_path='' as $$
 select public.is_login_verified() and exists(
  select 1 from public.institution_verifications v join auth.users u on u.id=v.user_id
  where v.user_id=auth.uid() and v.revoked_at is null and v.verified_at is not null
 );
$$;
revoke all on function public.is_utd_verified() from public,anon;
grant execute on function public.is_utd_verified() to authenticated;
commit;
