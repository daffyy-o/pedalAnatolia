create table if not exists school_zone_reports (
  id text primary key,
  type text not null check (type in ('add', 'remove')),
  status text not null check (status in ('pending', 'approved', 'rejected')),
  created_at bigint not null,
  note text not null default '',
  lat double precision,
  lon double precision,
  zone_id text
);

alter table school_zone_reports enable row level security;

drop policy if exists "Anyone can read school zone reports" on school_zone_reports;
create policy "Anyone can read school zone reports"
on school_zone_reports for select
using (true);

drop policy if exists "Anyone can create school zone reports" on school_zone_reports;
create policy "Anyone can create school zone reports"
on school_zone_reports for insert
with check (true);

drop policy if exists "Anyone can update school zone reports for demo" on school_zone_reports;
create policy "Anyone can update school zone reports for demo"
on school_zone_reports for update
using (true)
with check (true);

do $$
begin
  alter publication supabase_realtime add table school_zone_reports;
exception
  when duplicate_object then null;
end $$;
