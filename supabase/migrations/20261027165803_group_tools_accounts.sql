-- Additive, account-owned storage. Group host access is enforced again in API handlers.
create table public.group_a_saved_tools (
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind='arrival'),
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=60000),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now(),
 primary key(user_id,kind)
);
create table public.group_b_saved_tools (
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in ('budget','reminders')),
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=60000),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now(),
 primary key(user_id,kind)
);
alter table public.group_a_saved_tools enable row level security;
alter table public.group_b_saved_tools enable row level security;
revoke all on public.group_a_saved_tools,public.group_b_saved_tools from public,anon,authenticated;
grant select,insert,update,delete on public.group_a_saved_tools,public.group_b_saved_tools to authenticated;
grant all on public.group_a_saved_tools,public.group_b_saved_tools to service_role;
create policy own_group_a on public.group_a_saved_tools for all to authenticated
 using((select auth.uid())=user_id and (select public.is_login_verified()))
 with check((select auth.uid())=user_id and (select public.is_login_verified()));
create policy own_group_b on public.group_b_saved_tools for all to authenticated
 using((select auth.uid())=user_id and (select public.is_login_verified()))
 with check((select auth.uid())=user_id and (select public.is_login_verified()));
create table public.group_b_source_reports (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 source_url text not null check(length(source_url) between 1 and 300),
 message text not null check(length(message) between 1 and 1500),
 status text not null default 'new' check(status in ('new','reviewing','resolved')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz
);
alter table public.group_b_source_reports enable row level security;
revoke all on public.group_b_source_reports from public,anon,authenticated;
grant select,delete on public.group_b_source_reports to authenticated;
grant insert(user_id,source_url,message) on public.group_b_source_reports to authenticated;
grant all on public.group_b_source_reports to service_role;
create policy own_reports_select on public.group_b_source_reports for select to authenticated
 using((select auth.uid())=user_id and (select public.is_login_verified()));
create policy own_reports_insert on public.group_b_source_reports for insert to authenticated
 with check((select auth.uid())=user_id and (select public.is_login_verified()));
create policy own_reports_delete on public.group_b_source_reports for delete to authenticated
 using((select auth.uid())=user_id and (select public.is_login_verified()));
create index group_b_source_reports_triage on public.group_b_source_reports(status,created_at);
