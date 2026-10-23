begin;

-- Accept an optional domestic car-arrival preference without changing account authorization.
-- Existing profile RPCs and email-session authorization remain unchanged.
create or replace function private.valid_answers(a jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare v_date date; count_all integer; count_distinct integer;
begin
 if a is null or jsonb_typeof(a)<>'object'
 or not(a ?& array['arrivalDate','housingLocation','housingType','household','electricity','internet','hasCar','transport','priorities']) then return false;end if;
 if exists(select 1 from jsonb_object_keys(a) k where k not in
  ('arrivalDate','housingLocation','housingType','household','electricity','internet','hasCar','transport','priorities','housingCommunity','housingZip','carArrival')) then return false;end if;
 if exists(select 1 from jsonb_each(a) e where
  (e.key in ('arrivalDate','housingLocation','housingType','household','electricity','internet','transport','housingCommunity','housingZip','carArrival') and jsonb_typeof(e.value)<>'string')
  or e.value='null'::jsonb) then return false;end if;
 if a->>'arrivalDate' !~ '^\d{4}-\d{2}-\d{2}$' then return false;end if;
 v_date:=(a->>'arrivalDate')::date;
 if to_char(v_date,'YYYY-MM-DD')<>a->>'arrivalDate' then return false;end if;
 if a->>'housingLocation' not in ('on_campus','off_campus') or a->>'housingType' not in ('apartment','house','residence','temporary')
 or a->>'household' not in ('alone','roommates') or a->>'electricity' not in ('included','not_included','unknown')
 or a->>'internet' not in ('included','not_included','unknown') or a->>'transport' not in ('transit','car','walking','undecided')
 or jsonb_typeof(a->'hasCar')<>'boolean' or jsonb_typeof(a->'priorities')<>'array' then return false;end if;
 if a ? 'carArrival' and a->>'carArrival' not in ('drive','ship','here','undecided') then return false;end if;
 if a ? 'housingCommunity' and a->>'housingCommunity'<>'' and a->>'housingCommunity' !~ '^[a-z0-9][a-z0-9-]{0,79}$' then return false;end if;
 if a ? 'housingZip' and a->>'housingZip'<>'' and a->>'housingZip' !~ '^[0-9]{5}$' then return false;end if;
 if exists(select 1 from jsonb_array_elements(a->'priorities') x where jsonb_typeof(x.value)<>'string') then return false;end if;
 select count(*),count(distinct value) into count_all,count_distinct from jsonb_array_elements_text(a->'priorities');
 if count_all>5 or count_all<>count_distinct then return false;end if;
 if exists(select 1 from jsonb_array_elements_text(a->'priorities') x where x.value not in ('housing','transportation','services','campus','daily_life')) then return false;end if;
 return true;
exception when others then return false;
end;$$;

revoke all on function private.valid_answers(jsonb) from public,anon,authenticated;
commit;
