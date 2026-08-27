-- The Scenery cashier / close-round database
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.invoice_history (
  id text primary key,
  reference text,
  business_date date not null,
  customer text not null default '',
  villa text not null default '',
  villa_code text not null default '',
  total numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  deposit numeric(14,2) not null default 0,
  pending_total numeric(14,2) not null default 0,
  status text not null default 'ชำระแล้ว',
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoice_history_business_date_idx on public.invoice_history (business_date desc);
create index if not exists invoice_history_customer_idx on public.invoice_history using gin (to_tsvector('simple', customer || ' ' || villa || ' ' || coalesce(reference, '')));

create table if not exists public.invoice_drafts (
  id text primary key,
  reference text,
  customer text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.closed_bookings (
  id text primary key,
  reference text,
  business_date date,
  customer text not null default '',
  villa text not null default '',
  total numeric(14,2) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.close_rounds (
  id text primary key,
  business_date date not null,
  status text not null default 'Submitted',
  totals jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.close_round_edits (
  record_id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invoice_history_updated_at on public.invoice_history;
create trigger invoice_history_updated_at before update on public.invoice_history for each row execute function public.set_updated_at();
drop trigger if exists invoice_drafts_updated_at on public.invoice_drafts;
create trigger invoice_drafts_updated_at before update on public.invoice_drafts for each row execute function public.set_updated_at();
drop trigger if exists closed_bookings_updated_at on public.closed_bookings;
create trigger closed_bookings_updated_at before update on public.closed_bookings for each row execute function public.set_updated_at();

alter table public.invoice_history enable row level security;
alter table public.invoice_drafts enable row level security;
alter table public.closed_bookings enable row level security;
alter table public.close_rounds enable row level security;
alter table public.close_round_edits enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists invoice_history_authenticated_all on public.invoice_history;
create policy invoice_history_authenticated_all on public.invoice_history for all to authenticated using (true) with check (true);
drop policy if exists invoice_drafts_authenticated_all on public.invoice_drafts;
create policy invoice_drafts_authenticated_all on public.invoice_drafts for all to authenticated using (true) with check (true);
drop policy if exists closed_bookings_authenticated_all on public.closed_bookings;
create policy closed_bookings_authenticated_all on public.closed_bookings for all to authenticated using (true) with check (true);
drop policy if exists close_rounds_authenticated_all on public.close_rounds;
create policy close_rounds_authenticated_all on public.close_rounds for all to authenticated using (true) with check (true);
drop policy if exists close_round_edits_authenticated_all on public.close_round_edits;
create policy close_round_edits_authenticated_all on public.close_round_edits for all to authenticated using (true) with check (true);
drop policy if exists audit_logs_authenticated_all on public.audit_logs;
create policy audit_logs_authenticated_all on public.audit_logs for all to authenticated using (true) with check (true);

-- Enable realtime refresh for the shared work queues.
alter table public.invoice_history replica identity full;
alter table public.close_rounds replica identity full;
alter table public.audit_logs replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='invoice_history') then
    alter publication supabase_realtime add table public.invoice_history;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='close_rounds') then
    alter publication supabase_realtime add table public.close_rounds;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='audit_logs') then
    alter publication supabase_realtime add table public.audit_logs;
  end if;
end $$;
