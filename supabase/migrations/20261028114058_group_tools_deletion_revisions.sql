-- Keep only an empty revision marker after removal, so an old device cannot
-- overwrite a newly created saved copy whose revision would otherwise restart.
alter table public.group_a_saved_tools alter column data drop not null;
alter table public.group_b_saved_tools alter column data drop not null;
