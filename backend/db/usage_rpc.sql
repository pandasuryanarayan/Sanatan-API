-- =========================================================
-- Sanatan API — daily usage aggregation for the dashboard
-- Run in Supabase SQL Editor. The dashboard stats endpoint
-- prefers this function and falls back to row-fetching if it
-- is missing, so old and new backends both keep working.
--
-- Why: building the 7-day chart used to download EVERY log row
-- of the last 7 days to the backend. This aggregates inside
-- Postgres and returns at most 7 rows.
-- =========================================================

create or replace function public.get_usage_daily(p_user_id uuid, p_days int default 7)
returns table (day date, cnt bigint)
language sql stable security definer set search_path = public as $$
  select (date_trunc('day', timestamp))::date as day, count(*)::bigint
  from public.api_usage_logs
  where user_id = p_user_id
    and timestamp >= now() - (p_days || ' days')::interval
  group by 1
  order by 1;
$$;

-- Backend-only function: no direct browser access.
revoke all on function public.get_usage_daily(uuid, int) from public, anon, authenticated;
grant execute on function public.get_usage_daily(uuid, int) to service_role;
