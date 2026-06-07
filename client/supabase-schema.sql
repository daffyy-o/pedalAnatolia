-- Run this entire file in the Supabase SQL Editor for the project.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  name text not null check (char_length(name) between 1 and 100),
  age smallint check (age is null or age between 1 and 120),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (name, age) on table public.profiles to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles for select
to authenticated
using ((select private.is_admin()));

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
  profile_age smallint;
begin
  profile_name := nullif(trim(new.raw_user_meta_data ->> 'name'), '');

  if (new.raw_user_meta_data ->> 'age') ~ '^[0-9]{1,3}$' then
    profile_age := (new.raw_user_meta_data ->> 'age')::smallint;
  end if;

  insert into public.profiles (id, email, name, age)
  values (
    new.id,
    new.email,
    coalesce(profile_name, split_part(coalesce(new.email, 'Cyclist'), '@', 1)),
    profile_age
  );

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure private.handle_new_user();

insert into public.profiles (id, email, name)
select
  id,
  email,
  coalesce(
    nullif(trim(raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(email, 'Cyclist'), '@', 1)
  )
from auth.users
on conflict (id) do nothing;

create or replace function private.handle_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email,
      updated_at = now()
  where id = new.id;

  return new;
end;
$$;

revoke all on function private.handle_user_email_updated() from public;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute procedure private.handle_user_email_updated();

create table if not exists public.user_monthly_distances (
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null,
  meters bigint not null default 0 check (meters >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, month),
  check (month = date_trunc('month', month)::date)
);

alter table public.user_monthly_distances enable row level security;

revoke all on table public.user_monthly_distances from anon, authenticated;
grant select on table public.user_monthly_distances to authenticated;

drop policy if exists "Users can read their own distances" on public.user_monthly_distances;
create policy "Users can read their own distances"
on public.user_monthly_distances for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Admins can read all distances" on public.user_monthly_distances;
create policy "Admins can read all distances"
on public.user_monthly_distances for select
to authenticated
using ((select private.is_admin()));

create or replace function public.add_monthly_distance(distance_meters bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_month date := date_trunc('month', now())::date;
  total_meters bigint;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if distance_meters <= 0 or distance_meters > 10000000 then
    raise exception 'Distance must be between 1 and 10000000 meters';
  end if;

  insert into public.user_monthly_distances (user_id, month, meters)
  values (current_user_id, current_month, distance_meters)
  on conflict (user_id, month)
  do update set
    meters = public.user_monthly_distances.meters + excluded.meters,
    updated_at = now()
  returning meters into total_meters;

  return total_meters;
end;
$$;

revoke all on function public.add_monthly_distance(bigint) from public, anon;
grant execute on function public.add_monthly_distance(bigint) to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

create table if not exists public.saved_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 100),
  origin_lat double precision not null,
  origin_lon double precision not null,
  destination_lat double precision not null,
  destination_lon double precision not null,
  origin_name text not null default 'Start',
  destination_name text not null default 'End',
  distance_meters bigint not null check (distance_meters > 0),
  duration_ms bigint not null check (duration_ms >= 0),
  geometry jsonb not null,
  instructions jsonb not null default '[]'::jsonb,
  routing_profile text not null default 'bike',
  published_route_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_routes_user_created_idx
  on public.saved_routes (user_id, created_at desc);

alter table public.saved_routes enable row level security;

revoke all on table public.saved_routes from anon, authenticated;
grant select, insert, delete on table public.saved_routes to authenticated;
grant update (name) on table public.saved_routes to authenticated;

drop trigger if exists set_saved_routes_updated_at on public.saved_routes;
create trigger set_saved_routes_updated_at
  before update on public.saved_routes
  for each row execute procedure private.set_updated_at();

drop policy if exists "Users can read their saved routes" on public.saved_routes;
create policy "Users can read their saved routes"
on public.saved_routes for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create saved routes" on public.saved_routes;
create policy "Users can create saved routes"
on public.saved_routes for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their saved routes" on public.saved_routes;
create policy "Users can update their saved routes"
on public.saved_routes for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their saved routes" on public.saved_routes;
create policy "Users can delete their saved routes"
on public.saved_routes for delete
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.published_routes (
  id uuid primary key default gen_random_uuid(),
  saved_route_id uuid references public.saved_routes (id) on delete set null,
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  owner_name text not null default 'Cyclist',
  title text not null check (char_length(title) between 1 and 120),
  description text,
  origin_lat double precision not null,
  origin_lon double precision not null,
  destination_lat double precision not null,
  destination_lon double precision not null,
  origin_name text not null default 'Start',
  destination_name text not null default 'End',
  distance_meters bigint not null check (distance_meters > 0),
  duration_ms bigint not null check (duration_ms >= 0),
  geometry jsonb not null,
  instructions jsonb not null default '[]'::jsonb,
  routing_profile text not null default 'bike',
  rating_average numeric(3,2) not null default 0,
  rating_count integer not null default 0 check (rating_count >= 0),
  ride_count integer not null default 0 check (ride_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists published_routes_saved_route_unique
  on public.published_routes (saved_route_id)
  where saved_route_id is not null;
create index if not exists published_routes_owner_created_idx
  on public.published_routes (owner_id, created_at desc);
create index if not exists published_routes_distance_idx
  on public.published_routes (distance_meters);
create index if not exists published_routes_rating_idx
  on public.published_routes (rating_average desc);
create index if not exists published_routes_ride_count_idx
  on public.published_routes (ride_count desc);

alter table public.saved_routes
  drop constraint if exists saved_routes_published_route_id_fkey;
alter table public.saved_routes
  add constraint saved_routes_published_route_id_fkey
  foreign key (published_route_id) references public.published_routes (id) on delete set null;

alter table public.published_routes enable row level security;

revoke all on table public.published_routes from anon, authenticated;
grant select, insert, delete on table public.published_routes to authenticated;
grant update (title, description) on table public.published_routes to authenticated;

create or replace function private.set_published_route_owner_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.owner_id = coalesce(new.owner_id, auth.uid());

  select coalesce(nullif(trim(name), ''), 'Cyclist')
  into new.owner_name
  from public.profiles
  where id = new.owner_id;

  new.owner_name = coalesce(new.owner_name, 'Cyclist');
  return new;
end;
$$;

revoke all on function private.set_published_route_owner_name() from public;

drop trigger if exists set_published_route_owner_name on public.published_routes;
create trigger set_published_route_owner_name
  before insert or update on public.published_routes
  for each row execute procedure private.set_published_route_owner_name();

drop trigger if exists set_published_routes_updated_at on public.published_routes;
create trigger set_published_routes_updated_at
  before update on public.published_routes
  for each row execute procedure private.set_updated_at();

create or replace function private.sync_saved_route_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.saved_route_id is not null then
    update public.saved_routes
    set published_route_id = null,
        updated_at = now()
    where id = old.saved_route_id
      and published_route_id = old.id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.saved_route_id is not null then
    update public.saved_routes
    set published_route_id = new.id,
        updated_at = now()
    where id = new.saved_route_id
      and user_id = new.owner_id;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_saved_route_publication() from public;

drop trigger if exists sync_saved_route_publication on public.published_routes;
create trigger sync_saved_route_publication
  after insert or update or delete on public.published_routes
  for each row execute procedure private.sync_saved_route_publication();

drop policy if exists "Authenticated users can read published routes" on public.published_routes;
create policy "Authenticated users can read published routes"
on public.published_routes for select
to authenticated
using (true);

drop policy if exists "Users can publish their saved routes" on public.published_routes;
create policy "Users can publish their saved routes"
on public.published_routes for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and (
    saved_route_id is null
    or exists (
      select 1
      from public.saved_routes
      where saved_routes.id = saved_route_id
        and saved_routes.user_id = (select auth.uid())
    )
  )
);

drop policy if exists "Owners can update published route metadata" on public.published_routes;
create policy "Owners can update published route metadata"
on public.published_routes for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners and admins can delete published routes" on public.published_routes;
create policy "Owners and admins can delete published routes"
on public.published_routes for delete
to authenticated
using ((select auth.uid()) = owner_id or (select private.is_admin()));

create table if not exists public.route_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  saved_route_id uuid references public.saved_routes (id) on delete set null,
  published_route_id uuid references public.published_routes (id) on delete set null,
  distance_meters bigint not null check (distance_meters > 0),
  duration_ms bigint check (duration_ms is null or duration_ms >= 0),
  completed_at timestamptz not null default now()
);

create index if not exists route_completions_user_time_idx
  on public.route_completions (user_id, completed_at desc);
create index if not exists route_completions_published_user_idx
  on public.route_completions (published_route_id, user_id);

alter table public.route_completions enable row level security;

revoke all on table public.route_completions from anon, authenticated;
grant select on table public.route_completions to authenticated;

drop policy if exists "Users can read their route completions" on public.route_completions;
create policy "Users can read their route completions"
on public.route_completions for select
to authenticated
using ((select auth.uid()) = user_id or (select private.is_admin()));

create table if not exists public.route_ratings (
  published_route_id uuid not null references public.published_routes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  rating integer not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (published_route_id, user_id)
);

create index if not exists route_ratings_route_idx
  on public.route_ratings (published_route_id);

alter table public.route_ratings enable row level security;

revoke all on table public.route_ratings from anon, authenticated;
grant select, insert, delete on table public.route_ratings to authenticated;
grant update (rating) on table public.route_ratings to authenticated;

drop trigger if exists set_route_ratings_updated_at on public.route_ratings;
create trigger set_route_ratings_updated_at
  before update on public.route_ratings
  for each row execute procedure private.set_updated_at();

create or replace function private.can_rate_route(route_id uuid, rating_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.route_completions
    where published_route_id = route_id
      and user_id = rating_user_id
  )
  and not exists (
    select 1
    from public.published_routes
    where id = route_id
      and owner_id = rating_user_id
  );
$$;

revoke all on function private.can_rate_route(uuid, uuid) from public;
grant execute on function private.can_rate_route(uuid, uuid) to authenticated;

drop policy if exists "Users can read their ratings" on public.route_ratings;
create policy "Users can read their ratings"
on public.route_ratings for select
to authenticated
using ((select auth.uid()) = user_id or (select private.is_admin()));

drop policy if exists "Completed riders can rate routes" on public.route_ratings;
create policy "Completed riders can rate routes"
on public.route_ratings for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and private.can_rate_route(published_route_id, user_id)
);

drop policy if exists "Completed riders can update their ratings" on public.route_ratings;
create policy "Completed riders can update their ratings"
on public.route_ratings for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and private.can_rate_route(published_route_id, user_id)
);

drop policy if exists "Users can delete their ratings" on public.route_ratings;
create policy "Users can delete their ratings"
on public.route_ratings for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function private.refresh_route_rating_aggregate(route_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.published_routes
  set rating_average = coalesce((
        select round(avg(rating)::numeric, 2)
        from public.route_ratings
        where published_route_id = route_id
      ), 0),
      rating_count = (
        select count(*)::integer
        from public.route_ratings
        where published_route_id = route_id
      ),
      updated_at = now()
  where id = route_id;
end;
$$;

revoke all on function private.refresh_route_rating_aggregate(uuid) from public;

create or replace function private.refresh_route_rating_aggregate_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.refresh_route_rating_aggregate(coalesce(new.published_route_id, old.published_route_id));

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function private.refresh_route_rating_aggregate_trigger() from public;

drop trigger if exists refresh_route_rating_aggregate on public.route_ratings;
create trigger refresh_route_rating_aggregate
  after insert or update or delete on public.route_ratings
  for each row execute procedure private.refresh_route_rating_aggregate_trigger();

create or replace function public.record_route_completion(
  p_distance_meters bigint,
  p_duration_ms bigint default null,
  p_saved_route_id uuid default null,
  p_published_route_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_month date := date_trunc('month', timezone('Europe/Istanbul', now()))::date;
  total_meters bigint;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_distance_meters <= 0 or p_distance_meters > 10000000 then
    raise exception 'Distance must be between 1 and 10000000 meters';
  end if;

  if p_saved_route_id is not null and not exists (
    select 1
    from public.saved_routes
    where id = p_saved_route_id
      and user_id = current_user_id
  ) then
    raise exception 'Saved route not found';
  end if;

  if p_published_route_id is not null and not exists (
    select 1
    from public.published_routes
    where id = p_published_route_id
  ) then
    raise exception 'Published route not found';
  end if;

  insert into public.route_completions (
    user_id,
    saved_route_id,
    published_route_id,
    distance_meters,
    duration_ms
  )
  values (
    current_user_id,
    p_saved_route_id,
    p_published_route_id,
    p_distance_meters,
    p_duration_ms
  );

  insert into public.user_monthly_distances (user_id, month, meters)
  values (current_user_id, current_month, p_distance_meters)
  on conflict (user_id, month)
  do update set
    meters = public.user_monthly_distances.meters + excluded.meters,
    updated_at = now()
  returning meters into total_meters;

  if p_published_route_id is not null then
    update public.published_routes
    set ride_count = ride_count + 1,
        updated_at = now()
    where id = p_published_route_id;
  end if;

  return total_meters;
end;
$$;

revoke all on function public.record_route_completion(bigint, bigint, uuid, uuid) from public, anon;
grant execute on function public.record_route_completion(bigint, bigint, uuid, uuid) to authenticated;

create or replace function public.get_admin_leaderboard(p_period text)
returns table (
  user_id uuid,
  name text,
  email text,
  role text,
  distance_meters bigint,
  completed_rides bigint,
  saved_routes_count bigint,
  published_routes_count bigint,
  average_rating numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  local_now timestamp := timezone('Europe/Istanbul', now());
  local_start timestamp;
  local_end timestamp;
  start_at timestamptz;
  end_at timestamptz;
begin
  if not private.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_period = 'daily' then
    local_start := date_trunc('day', local_now);
    local_end := local_start + interval '1 day';
  elsif p_period = 'monthly' then
    local_start := date_trunc('month', local_now);
    local_end := local_start + interval '1 month';
  elsif p_period = 'yearly' then
    local_start := date_trunc('year', local_now);
    local_end := local_start + interval '1 year';
  elsif p_period = 'all_time' then
    local_start := null;
    local_end := null;
  else
    raise exception 'Invalid leaderboard period';
  end if;

  if local_start is not null then
    start_at := local_start at time zone 'Europe/Istanbul';
    end_at := local_end at time zone 'Europe/Istanbul';
  end if;

  return query
  with period_completions as (
    select
      route_completions.user_id,
      sum(route_completions.distance_meters)::bigint as distance_meters,
      count(*)::bigint as completed_rides
    from public.route_completions
    where p_period = 'all_time'
      or (route_completions.completed_at >= start_at and route_completions.completed_at < end_at)
    group by route_completions.user_id
  ),
  saved_counts as (
    select saved_routes.user_id, count(*)::bigint as saved_routes_count
    from public.saved_routes
    group by saved_routes.user_id
  ),
  published_counts as (
    select
      published_routes.owner_id as user_id,
      count(*)::bigint as published_routes_count,
      coalesce(round(avg(nullif(published_routes.rating_average, 0))::numeric, 2), 0) as average_rating
    from public.published_routes
    group by published_routes.owner_id
  )
  select
    profiles.id,
    profiles.name,
    coalesce(profiles.email, ''),
    profiles.role,
    coalesce(period_completions.distance_meters, 0),
    coalesce(period_completions.completed_rides, 0),
    coalesce(saved_counts.saved_routes_count, 0),
    coalesce(published_counts.published_routes_count, 0),
    coalesce(published_counts.average_rating, 0)
  from public.profiles
  left join period_completions on period_completions.user_id = profiles.id
  left join saved_counts on saved_counts.user_id = profiles.id
  left join published_counts on published_counts.user_id = profiles.id
  order by coalesce(period_completions.distance_meters, 0) desc, profiles.name asc;
end;
$$;

revoke all on function public.get_admin_leaderboard(text) from public, anon;
grant execute on function public.get_admin_leaderboard(text) to authenticated;

create table if not exists public.school_zone_reports (
  id text primary key,
  type text not null check (type in ('add', 'remove')),
  status text not null check (status in ('pending', 'approved', 'rejected')),
  created_at bigint not null,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  note text not null default '',
  lat double precision,
  lon double precision,
  zone_id text
);

alter table public.school_zone_reports
  add column if not exists created_by uuid references auth.users (id) on delete set null default auth.uid();

create index if not exists school_zone_reports_created_by_idx
  on public.school_zone_reports (created_by);
create index if not exists school_zone_reports_status_idx
  on public.school_zone_reports (status);

alter table public.school_zone_reports enable row level security;

revoke all on table public.school_zone_reports from anon, authenticated;
grant select, insert on table public.school_zone_reports to authenticated;
grant update (status) on table public.school_zone_reports to authenticated;

drop policy if exists "Anyone can read school zone reports" on public.school_zone_reports;
drop policy if exists "Anyone can create school zone reports" on public.school_zone_reports;
drop policy if exists "Anyone can update school zone reports for demo" on public.school_zone_reports;

drop policy if exists "Authenticated users can read school zone reports" on public.school_zone_reports;
create policy "Authenticated users can read school zone reports"
on public.school_zone_reports for select
to authenticated
using (
  status = 'approved'
  or (select auth.uid()) = created_by
  or (select private.is_admin())
);

drop policy if exists "Authenticated users can create school zone reports" on public.school_zone_reports;
create policy "Authenticated users can create school zone reports"
on public.school_zone_reports for insert
to authenticated
with check (
  (select auth.uid()) = created_by
  and status = 'pending'
);

drop policy if exists "Admins can update school zone reports" on public.school_zone_reports;
create policy "Admins can update school zone reports"
on public.school_zone_reports for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

do $$
begin
  alter publication supabase_realtime add table public.school_zone_reports;
exception
  when duplicate_object then null;
end $$;

-- New accounts are always regular users. Promote an account only from the
-- SQL Editor or another trusted server environment:
-- update public.profiles set role = 'admin' where email = 'admin@example.com';

-- Map notes (location comments) table
create table if not exists public.map_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  user_name text not null default 'Cyclist',
  lat double precision not null,
  lon double precision not null,
  text text not null check (char_length(trim(text)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists map_notes_coords_idx on public.map_notes (lat, lon);

alter table public.map_notes enable row level security;

revoke all on table public.map_notes from anon, authenticated;
grant select, insert, delete on table public.map_notes to authenticated;

-- Trigger to copy user profile name
create or replace function private.set_map_note_user_name()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_id = coalesce(new.user_id, auth.uid());
  select coalesce(nullif(trim(name), ''), 'Cyclist')
  into new.user_name
  from public.profiles
  where id = new.user_id;
  new.user_name = coalesce(new.user_name, 'Cyclist');
  return new;
end;
$$;

drop trigger if exists set_map_note_user_name on public.map_notes;
create trigger set_map_note_user_name
  before insert on public.map_notes
  for each row execute procedure private.set_map_note_user_name();

-- Policies
drop policy if exists "Authenticated users can read map notes" on public.map_notes;
create policy "Authenticated users can read map notes"
on public.map_notes for select
to authenticated
using (true);

drop policy if exists "Users can insert their own map notes" on public.map_notes;
create policy "Users can insert their own map notes"
on public.map_notes for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Owners and admins can delete map notes" on public.map_notes;
create policy "Owners and admins can delete map notes"
on public.map_notes for delete
to authenticated
using ((select auth.uid()) = user_id or (select private.is_admin()));

do $$
begin
  alter publication supabase_realtime add table public.map_notes;
exception
  when duplicate_object then null;
end $$;
