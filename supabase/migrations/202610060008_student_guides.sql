begin;

-- Lease dates, final checks and atomic completion reset. Account authorization is unchanged.
create or replace function private.valid_answers(a jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare v_date date; count_all integer; count_distinct integer;
begin
 if a is null or jsonb_typeof(a)<>'object'
 or not(a ?& array['arrivalDate','housingLocation','housingType','household','electricity','internet','hasCar','transport','priorities']) then return false;end if;
 if exists(select 1 from jsonb_object_keys(a) k where k not in
  ('arrivalDate','housingLocation','housingType','household','electricity','internet','hasCar','transport','priorities','housingCommunity','housingZip','carArrival','transitMode','rentalHelp','leaseStartDate')) then return false;end if;
 if exists(select 1 from jsonb_each(a) e where
  (e.key in ('arrivalDate','housingLocation','housingType','household','electricity','internet','transport','housingCommunity','housingZip','carArrival','transitMode','rentalHelp','leaseStartDate') and jsonb_typeof(e.value)<>'string')
  or e.value='null'::jsonb) then return false;end if;
 if a->>'arrivalDate' !~ '^\d{4}-\d{2}-\d{2}$' then return false;end if;
 v_date:=(a->>'arrivalDate')::date;
 if to_char(v_date,'YYYY-MM-DD')<>a->>'arrivalDate' then return false;end if;
 if a->>'housingLocation' not in ('on_campus','off_campus') or a->>'housingType' not in ('apartment','house','residence','temporary')
 or a->>'household' not in ('alone','roommates') or a->>'electricity' not in ('included','not_included','unknown')
 or a->>'internet' not in ('included','not_included','unknown') or a->>'transport' not in ('transit','car','walking','undecided')
 or jsonb_typeof(a->'hasCar')<>'boolean' or jsonb_typeof(a->'priorities')<>'array' then return false;end if;
 if a ? 'leaseStartDate' and a->>'leaseStartDate'<>'' then
  if a->>'leaseStartDate' !~ '^\d{4}-\d{2}-\d{2}$' then return false;end if;
  v_date:=(a->>'leaseStartDate')::date;
  if to_char(v_date,'YYYY-MM-DD')<>a->>'leaseStartDate' then return false;end if;
 end if;
 if a ? 'carArrival' and a->>'carArrival' not in ('drive','ship','here','undecided') then return false;end if;
 if a ? 'transitMode' and a->>'transitMode' not in ('campus_bus','public_transit','rideshare','carpool','mixed','undecided') then return false;end if;
 if a ? 'rentalHelp' and a->>'rentalHelp' not in ('yes','no','undecided') then return false;end if;
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
create or replace function private.task_applies(rule text,a jsonb) returns boolean
language sql immutable set search_path='' as $$
 select case rule
 when 'always' then true when 'campus_transport' then true
 when 'dart_pass' then a->>'transport'<>'car'
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


create function public.reset_task_completions(p_revision bigint) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();current_revision bigint;
begin
 if uid is null or not public.is_utd_verified() then raise exception 'not_authorized';end if;
 select revision into current_revision from public.profiles where user_id=uid for update;
 if current_revision is null or p_revision is distinct from current_revision then raise exception 'revision_conflict';end if;
 update public.user_task_progress set completed_at=null,updated_at=now() where user_id=uid;
 update public.profiles set revision=revision+1,updated_at=now() where user_id=uid;
end;$$;
revoke all on function public.reset_task_completions(bigint) from public,anon;
grant execute on function public.reset_task_completions(bigint) to authenticated;

alter table public.task_rules drop constraint task_rules_rule_key_check;
alter table public.task_rules add constraint task_rules_rule_key_check check(rule_key in ('always','off_campus','on_campus','electricity_setup','internet_setup','electricity_unknown','internet_unknown','roommates','parking','campus_transport','dart_pass'));

-- Preserve task IDs and completion history while updating their guidance.
insert into public.task_templates(id,title,category,horizon,priority,content) values('confirm-off-campus-move-in','Confirm your home and lease start','housing','first_48_hours','high','{"id": "confirm-off-campus-move-in", "title": "Confirm your home and lease start", "category": "housing", "horizon": "first_48_hours", "priority": "high", "rule": "off_campus", "why": "Keep your lease date and key pickup ready before you move.", "steps": ["Choose a community if you have one in mind.", "Save the start date printed on your signed lease.", "Confirm key pickup, move-in instructions and fees with the leasing office."], "help": "Your leasing office or property manager", "resourceId": "utd-off-campus"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('confirm-off-campus-move-in','off_campus') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('confirm-off-campus-move-in','utd-off-campus') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('prepare-on-campus-check-in','Prepare for your UTD housing check-in','housing','first_48_hours','high','{"id": "prepare-on-campus-check-in", "title": "Prepare for your UTD housing check-in", "category": "housing", "horizon": "first_48_hours", "priority": "high", "rule": "on_campus", "why": "UTD housing has its own check-in instructions and support channels.", "steps": ["Read your housing assignment message and confirm your assigned check-in date and location.", "Review the current move-in guide and keep your Comet Card accessible.", "Save your housing front-desk contact and use the housing FAQ for residential internet instructions."], "help": "UTD University Housing or your residential front desk", "resourceId": "utd-housing-move-in"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('prepare-on-campus-check-in','on_campus') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('prepare-on-campus-check-in','utd-housing-move-in') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('review-roommate-routine','Review your shared-home routine','housing','first_30_days','standard','{"id": "review-roommate-routine", "title": "Review your shared-home routine", "category": "housing", "horizon": "first_30_days", "priority": "standard", "rule": "roommates", "why": "A short check-in can catch unclear household responsibilities before they become recurring problems.", "steps": ["Talk through cleaning, shared essentials, and who handles each household service.", "Write down your agreed routine and a time to revisit it.", "If you live in UTD housing, use the roommate-agreement process with your Peer Advisor; private apartments have their own arrangements."], "help": "Your roommates; your Peer Advisor if you live in UTD housing", "resourceId": "utd-housing-faq"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('review-roommate-routine','roommates') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('review-roommate-routine','utd-housing-faq') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('confirm-electricity-responsibility','Final check: electricity is ready','services','first_48_hours','high','{"id": "confirm-electricity-responsibility", "title": "Final check: electricity is ready", "category": "services", "horizon": "first_48_hours", "priority": "high", "rule": "electricity_unknown", "why": "Confirm power is arranged for the day your lease starts.", "steps": ["Confirm whether your housing or your household provides electricity.", "If you need a provider, arrange service for your lease start date.", "Check the confirmation or ask your housing contact. Then mark electricity ready."], "help": "Your leasing office or housing contact", "resourceId": "utd-off-campus"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('confirm-electricity-responsibility','electricity_unknown') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('confirm-electricity-responsibility','utd-off-campus') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('arrange-electricity','Final check: electricity is ready','services','first_48_hours','high','{"id": "arrange-electricity", "title": "Final check: electricity is ready", "category": "services", "horizon": "first_48_hours", "priority": "high", "rule": "electricity_setup", "why": "Confirm power is arranged for the day your lease starts.", "steps": ["Confirm whether your housing or your household provides electricity.", "If you need a provider, arrange service for your lease start date.", "Check the confirmation or ask your housing contact. Then mark electricity ready."], "help": "Your property manager and chosen electricity provider", "resourceId": "texas-power-to-choose"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('arrange-electricity','electricity_setup') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('arrange-electricity','texas-power-to-choose') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('confirm-internet-responsibility','Final check: internet is ready','services','first_48_hours','high','{"id": "confirm-internet-responsibility", "title": "Final check: internet is ready", "category": "services", "horizon": "first_48_hours", "priority": "high", "rule": "internet_unknown", "why": "Make sure you can get connected when you move in.", "steps": ["Confirm your building\u2019s internet arrangement.", "If you need separate service, check your exact unit and arrange activation.", "Save the connection instructions. Then mark internet ready."], "help": "Your leasing office or housing contact", "resourceId": "utd-off-campus"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('confirm-internet-responsibility','internet_unknown') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('confirm-internet-responsibility','utd-off-campus') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('arrange-home-internet','Final check: internet is ready','services','first_48_hours','high','{"id": "arrange-home-internet", "title": "Final check: internet is ready", "category": "services", "horizon": "first_48_hours", "priority": "high", "rule": "internet_setup", "why": "Make sure you can get connected when you move in.", "steps": ["Confirm your building\u2019s internet arrangement.", "If you need separate service, check your exact unit and arrange activation.", "Save the connection instructions. Then mark internet ready."], "help": "Your property manager and chosen internet provider", "resourceId": "fcc-broadband-guide"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('arrange-home-internet','internet_setup') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('arrange-home-internet','fcc-broadband-guide') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('plan-campus-transit','Plan a route to campus','transportation','first_week','standard','{"id": "plan-campus-transit", "title": "Plan a route to campus", "category": "transportation", "horizon": "first_week", "priority": "standard", "rule": "campus_transport", "why": "A saved route makes the first trip to class easier to navigate.", "steps": ["Open UTD Parking & Transportation and look at the current Comet Cruiser routes and other transit options.", "Check the closest stop, service times, and the return trip for your location.", "Try the route before an important class and keep an alternative for times it does not operate."], "help": "UTD Parking & Transportation", "resourceId": "utd-transit"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('plan-campus-transit','campus_transport') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('plan-campus-transit','utd-transit') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('check-dart-pass','Check your student DART pass options','transportation','first_week','standard','{"id": "check-dart-pass", "title": "Check your student DART pass options", "category": "transportation", "horizon": "first_week", "priority": "standard", "rule": "dart_pass", "why": "The student transit information can help you understand what to arrange before regional trips.", "steps": ["Open the Students link under DART Access Pass on the UTD transportation page.", "Review the current eligibility and application instructions; complete them if you qualify and want the pass.", "Confirm the pass is ready for use before relying on it for a trip."], "help": "UTD Parking & Transportation", "resourceId": "utd-transit"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('check-dart-pass','dart_pass') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('check-dart-pass','utd-transit') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('arrange-campus-parking','Arrange parking for your campus visits','transportation','first_48_hours','high','{"id": "arrange-campus-parking", "title": "Arrange parking for your campus visits", "category": "transportation", "horizon": "first_48_hours", "priority": "high", "rule": "parking", "why": "The correct permit or visitor option depends on where and when you will park.", "steps": ["Review UTD parking options for your housing or commuter status and planned visits.", "Use the official parking portal or Parking Office to arrange the appropriate option and check vehicle details.", "Check the current parking map and signs before leaving your vehicle."], "help": "UTD Parking & Transportation", "resourceId": "utd-parking"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('arrange-campus-parking','parking') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('arrange-campus-parking','utd-parking') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('check-student-tech','Set up your student tools','campus','first_48_hours','high','{"id": "check-student-tech", "title": "Set up your student tools", "category": "campus", "horizon": "first_48_hours", "priority": "high", "rule": "always", "why": "Your classes, email and student records live in different places.", "steps": ["Open the OIT New to UTD guide and follow the NetID and student technology checklist links.", "Check that you can access your UTD email and course systems using the official sign-in pages.", "Contact the OIT Service Desk if access fails."], "help": "UTD OIT Service Desk", "resourceId": "utd-new-student-tech"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('check-student-tech','always') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('check-student-tech','utd-new-student-tech') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('get-comet-card','Get your Comet Card ready','campus','first_48_hours','high','{"id": "get-comet-card", "title": "Get your Comet Card ready", "category": "campus", "horizon": "first_48_hours", "priority": "high", "rule": "always", "why": "Your Comet Card is your campus ID and is used for campus services.", "steps": ["Open the Comet Card Office page and choose Get your Comet Card.", "Review the current request, identification, and collection instructions.", "Complete the process through UTD and keep the card accessible for campus visits."], "help": "UTD Comet Card Office", "resourceId": "utd-comet-card"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('get-comet-card','always') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('get-comet-card','utd-comet-card') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('find-campus-destinations','Know your campus','campus','first_week','standard','{"id": "find-campus-destinations", "title": "Know your campus", "category": "campus", "horizon": "first_week", "priority": "standard", "rule": "always", "why": "Find the buildings you will use most.", "steps": ["Explore the building guide below.", "Open a map for each place you expect to visit.", "Find your classrooms in your course schedule."], "help": "UTD campus directory or the office you plan to visit", "resourceId": "utd-campus-map"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('find-campus-destinations','always') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('find-campus-destinations','utd-campus-map') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('plan-campus-meals','Find your campus food spots','daily_life','first_week','standard','{"id": "plan-campus-meals", "title": "Find your campus food spots", "category": "daily_life", "horizon": "first_week", "priority": "standard", "rule": "always", "why": "See dining locations before you need a meal.", "steps": ["Explore dining options and their buildings below.", "Check current opening hours before you go.", "Choose a convenient place for your first campus day."], "help": "UTD Student Union dining venues", "resourceId": "utd-dining"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('plan-campus-meals','always') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('plan-campus-meals','utd-dining') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('save-essentials-support','Find everyday support','daily_life','first_30_days','standard','{"id": "save-essentials-support", "title": "Find everyday support", "category": "daily_life", "horizon": "first_30_days", "priority": "standard", "rule": "always", "why": "Know where to find food and basic supplies.", "steps": ["Find the Comet Cupboard in the campus guide.", "Check current visit instructions.", "Save the location for when you need it."], "help": "UTD Comet Cupboard team", "resourceId": "utd-comet-cupboard"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('save-essentials-support','always') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('save-essentials-support','utd-comet-cupboard') on conflict do nothing;
insert into public.task_templates(id,title,category,horizon,priority,content) values('set-up-mobile-service','Get your phone connected','services','first_48_hours','standard','{"id": "set-up-mobile-service", "title": "Get your phone connected", "category": "services", "horizon": "first_48_hours", "priority": "standard", "rule": "always", "why": "Find a plan that fits your phone and budget.", "steps": ["Check your unlocked phone and eSIM or SIM compatibility.", "Compare coverage, full price and renewal terms.", "Activate your plan and test calls and data."], "help": "The mobile provider can check your phone and plan requirements.", "resourceId": "utd-new-student-tech"}') on conflict(id) do update set title=excluded.title,category=excluded.category,horizon=excluded.horizon,priority=excluded.priority,content=excluded.content;
insert into public.task_rules(task_id,rule_key) values('set-up-mobile-service','always') on conflict(task_id) do update set rule_key=excluded.rule_key;
insert into public.task_resources(task_id,resource_id) values('set-up-mobile-service','utd-new-student-tech') on conflict do nothing;
commit;
