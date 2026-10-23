begin;

-- Expand setup priorities and accept optional coarse housing preferences.
-- Existing profile RPCs and email-session authorization remain unchanged.
create or replace function private.valid_answers(a jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare v_date date; count_all integer; count_distinct integer;
begin
 if a is null or jsonb_typeof(a)<>'object'
 or not(a ?& array['arrivalDate','housingLocation','housingType','household','electricity','internet','hasCar','transport','priorities']) then return false;end if;
 if exists(select 1 from jsonb_object_keys(a) k where k not in
  ('arrivalDate','housingLocation','housingType','household','electricity','internet','hasCar','transport','priorities','housingCommunity','housingZip')) then return false;end if;
 if exists(select 1 from jsonb_each(a) e where
  (e.key in ('arrivalDate','housingLocation','housingType','household','electricity','internet','transport','housingCommunity','housingZip') and jsonb_typeof(e.value)<>'string')
  or e.value='null'::jsonb) then return false;end if;
 if a->>'arrivalDate' !~ '^\d{4}-\d{2}-\d{2}$' then return false;end if;
 v_date:=(a->>'arrivalDate')::date;
 if to_char(v_date,'YYYY-MM-DD')<>a->>'arrivalDate' then return false;end if;
 if a->>'housingLocation' not in ('on_campus','off_campus') or a->>'housingType' not in ('apartment','house','residence','temporary')
 or a->>'household' not in ('alone','roommates') or a->>'electricity' not in ('included','not_included','unknown')
 or a->>'internet' not in ('included','not_included','unknown') or a->>'transport' not in ('transit','car','walking','undecided')
 or jsonb_typeof(a->'hasCar')<>'boolean' or jsonb_typeof(a->'priorities')<>'array' then return false;end if;
 if a ? 'housingCommunity' and a->>'housingCommunity'<>'' and a->>'housingCommunity' !~ '^[a-z0-9][a-z0-9-]{0,79}$' then return false;end if;
 if a ? 'housingZip' and a->>'housingZip'<>'' and a->>'housingZip' !~ '^[0-9]{5}$' then return false;end if;
 if exists(select 1 from jsonb_array_elements(a->'priorities') x where jsonb_typeof(x.value)<>'string') then return false;end if;
 select count(*),count(distinct value) into count_all,count_distinct from jsonb_array_elements_text(a->'priorities');
 if count_all>5 or count_all<>count_distinct then return false;end if;
 if exists(select 1 from jsonb_array_elements_text(a->'priorities') x where x.value not in ('housing','transportation','services','campus','daily_life')) then return false;end if;
 return true;
exception when others then return false;
end;$$;

-- A former car answer must not authorize a parking task after a mode change.
create or replace function private.task_applies(rule text,a jsonb) returns boolean
language sql immutable set search_path='' as $$
 select case rule
 when 'always' then true when 'campus_transport' then true
 when 'off_campus' then a->>'housingLocation'='off_campus'
 when 'on_campus' then a->>'housingLocation'='on_campus'
 when 'electricity_setup' then a->>'housingLocation'='off_campus' and a->>'electricity'='not_included'
 when 'internet_setup' then a->>'housingLocation'='off_campus' and a->>'internet'='not_included'
 when 'electricity_unknown' then a->>'electricity'='unknown'
 when 'internet_unknown' then a->>'internet'='unknown'
 when 'roommates' then a->>'household'='roommates'
 when 'parking' then a->'hasCar'='true'::jsonb and a->>'transport'='car'
 else false end;
$$;

revoke all on function private.valid_answers(jsonb),private.task_applies(text,jsonb) from public,anon,authenticated;
commit;
