-- Fixwell database schema
-- Run this once in Supabase: Dashboard → SQL Editor → paste → Run.
--
-- Security model: Row Level Security is switched ON for every table with no
-- policies, so the public API keys can't read or write anything directly.
-- All reads and writes go through the website's server code, which checks
-- who is asking before using the secret key.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Tradespeople
-- ---------------------------------------------------------------------------
create table public.tradespeople (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  slug text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  is_test boolean not null default false,

  business_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  trade text not null
    check (trade in ('mechanic', 'plumber', 'electrician', 'gas_engineer', 'carpenter', 'locksmith', 'roofer')),
  bio text not null default '',
  base_area text not null,
  -- Postcode districts or areas covered, e.g. {BS1,BS2,BS16} or {BS} for a whole area
  postcode_areas text[] not null default '{}',

  hourly_rate_pence integer not null check (hourly_rate_pence between 0 and 100000),
  callout_fee_pence integer not null check (callout_fee_pence between 0 and 100000),

  -- ISO weekday (1 = Monday … 7 = Sunday) → {"start": "08:00", "end": "17:00"}
  working_hours jsonb not null default '{}'::jsonb,

  gas_safe_number text,
  niceic_napit_number text,
  imi_number text,
  other_accreditations text,
  insurance_path text,
  insurance_expiry date,
  photo_paths text[] not null default '{}',

  admin_notes text not null default '',
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz
);

create index tradespeople_status_trade_idx on public.tradespeople (status, trade);

-- ---------------------------------------------------------------------------
-- Services (jobs a tradesperson offers)
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  tradesperson_id uuid not null references public.tradespeople (id) on delete cascade,
  name text not null,
  description text not null default '',
  estimated_hours numeric(4, 1) not null check (estimated_hours > 0 and estimated_hours <= 10),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index services_tradesperson_idx on public.services (tradesperson_id);

-- ---------------------------------------------------------------------------
-- Days off
-- ---------------------------------------------------------------------------
create table public.time_off (
  tradesperson_id uuid not null references public.tradespeople (id) on delete cascade,
  day date not null,
  primary key (tradesperson_id, day)
);

-- ---------------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  tradesperson_id uuid not null references public.tradespeople (id) on delete restrict,
  service_id uuid references public.services (id) on delete set null,

  -- Copies taken at booking time so later price changes don't alter old bookings
  service_name text not null,
  estimated_hours numeric(4, 1) not null,
  hourly_rate_pence integer not null,
  callout_fee_pence integer not null,
  estimate_pence integer not null,

  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled', 'completed', 'expired')),

  -- Customer details: only what's needed to do the job. Cleared after the
  -- retention period by public.anonymise_old_bookings().
  customer_name text,
  customer_phone text,
  customer_email text,
  address text,
  postcode text,
  vehicle_reg text,
  problem_description text,

  early_start_requested boolean not null default false,
  terms_accepted_at timestamptz not null,
  decline_reason text,
  cancel_reason text,
  cancelled_by text check (cancelled_by in ('customer', 'tradesperson', 'admin')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  responded_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  anonymised_at timestamptz,

  constraint bookings_time_order check (ends_at > starts_at),
  -- THE double-booking guard: two active bookings for the same tradesperson
  -- can never overlap in time. The database rejects the second one even if
  -- two customers click "Book" at the same instant.
  constraint bookings_no_overlap exclude using gist (
    tradesperson_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'accepted'))
);

create index bookings_tradesperson_time_idx on public.bookings (tradesperson_id, starts_at);
create index bookings_status_idx on public.bookings (status, starts_at);

-- ---------------------------------------------------------------------------
-- Reviews (one per completed booking)
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  tradesperson_id uuid not null references public.tradespeople (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  reviewer_name text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index reviews_tradesperson_idx on public.reviews (tradesperson_id);

-- ---------------------------------------------------------------------------
-- updated_at bookkeeping
-- ---------------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tradespeople_updated_at before update on public.tradespeople
  for each row execute function public.set_updated_at();
create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Housekeeping jobs (called daily by /api/cron/daily)
-- ---------------------------------------------------------------------------

-- Clears customer personal details once a booking is older than the
-- retention period. Keeps the postcode district for anonymous stats.
create function public.anonymise_old_bookings(retention interval default interval '12 months')
returns integer
language sql security definer set search_path = public as $$
  with updated as (
    update public.bookings
       set customer_name = null,
           customer_phone = null,
           customer_email = null,
           address = null,
           vehicle_reg = null,
           problem_description = null,
           postcode = split_part(postcode, ' ', 1),
           anonymised_at = now()
     where anonymised_at is null
       and status not in ('pending', 'accepted')
       and ends_at < now() - retention
    returning 1
  )
  select count(*)::integer from updated;
$$;

-- ---------------------------------------------------------------------------
-- Lock everything down
-- ---------------------------------------------------------------------------
alter table public.tradespeople enable row level security;
alter table public.services enable row level security;
alter table public.time_off enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;

revoke all on public.tradespeople, public.services, public.time_off, public.bookings, public.reviews
  from anon, authenticated;
-- The website's server uses the secret key (service_role role).
grant all on public.tradespeople, public.services, public.time_off, public.bookings, public.reviews
  to service_role;
revoke execute on function public.anonymise_old_bookings(interval) from public, anon, authenticated;
grant execute on function public.anonymise_old_bookings(interval) to service_role;

-- ---------------------------------------------------------------------------
-- File storage
-- ---------------------------------------------------------------------------
-- photos: public (shown on profiles). insurance: private (admin only, via short-lived links).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('photos', 'photos', true, 4194304, array['image/jpeg', 'image/png', 'image/webp']),
  ('insurance', 'insurance', false, 4194304, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
