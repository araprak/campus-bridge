-- Favorites are independent of comparison and the single planning community.
create table public.apartment_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  community_id text not null check (community_id in ('anthem-cityline', 'arboretum-estates', 'axis-110', 'bell-cityline', 'breckinridge-point', 'brick-row', 'camden-buckingham', 'canterbury-courts', 'clearwater-creek', 'cortland-prairie-creek', 'creekside-townhomes', 'estates-of-richardson', 'estates-on-frankford', 'foundation-at-cityline', 'galatyn-station', 'greenvue', 'homes-of-prairie-springs', 'james-at-canyon-creek', 'maa-eastside', 'maa-market-center', 'madison-at-melrose', 'marquis-at-waterview', 'northside', 'palencia', 'pradera', 'standard-at-cityline', 'the-lyla', 'the-register', 'the-riley', 'windsor-cityline')),
  created_at timestamptz not null default now(),
  primary key (user_id, community_id)
);
alter table public.apartment_favorites enable row level security;
revoke all on public.apartment_favorites from anon, authenticated;
grant select, insert, delete on public.apartment_favorites to authenticated;
grant all on public.apartment_favorites to service_role;
create policy apartment_favorites_select on public.apartment_favorites
  for select to authenticated using ((select auth.uid()) = user_id and (select public.is_login_verified()));
create policy apartment_favorites_insert on public.apartment_favorites
  for insert to authenticated with check ((select auth.uid()) = user_id and (select public.is_login_verified()));
create policy apartment_favorites_delete on public.apartment_favorites
  for delete to authenticated using ((select auth.uid()) = user_id and (select public.is_login_verified()));
