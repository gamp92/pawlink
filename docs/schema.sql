-- ============================================================
-- PAWLINK — Supabase Schema
-- Features: F1 Shelter Hub, F2 Smart Adoption, F3 Lost & Found
-- F4 RAG Assistant tables are at the bottom (stretch — commented out)
--
-- How to use:
-- 1. Open your Supabase project → SQL Editor
-- 2. Run this entire file
-- 3. Enable PostGIS and pgvector extensions first (see below)
-- ============================================================


-- ============================================================
-- EXTENSIONS
-- ============================================================

create extension if not exists postgis;
create extension if not exists vector;


-- ============================================================
-- SHELTERS
-- The core tenant unit. Every other table references shelter_id.
-- ============================================================

create table shelters (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  city          text,
  address       text,
  location      geography(point, 4326),       -- lat/lng for future geo features
  phone         text,
  email         text,
  instagram_url text,
  website_url   text,
  cover_photo   text,                          -- Supabase Storage URL
  founded_year  int,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Shelter admins — links Supabase Auth users to a shelter
create table shelter_users (
  id          uuid primary key default gen_random_uuid(),
  shelter_id  uuid references shelters(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  role        text default 'admin',            -- 'admin' | 'staff'
  created_at  timestamptz default now(),
  unique(shelter_id, user_id)
);


-- ============================================================
-- ANIMALS
-- F1 — Shelter Hub inventory
-- ============================================================

create table animals (
  id              uuid primary key default gen_random_uuid(),
  shelter_id      uuid references shelters(id) on delete cascade,
  name            text not null,
  species         text not null,               -- 'dog' | 'cat' | 'other'
  breed           text,
  age_years       numeric(4,1),
  size            text,                        -- 'small' | 'medium' | 'large'
  gender          text,                        -- 'male' | 'female'
  color           text,
  description     text,
  energy_level    text,                        -- 'low' | 'medium' | 'high'
  good_with_kids  boolean default false,
  good_with_pets  boolean default false,
  vaccinated      boolean default false,
  sterilized      boolean default false,
  medical_notes   text,
  status          text default 'available',    -- 'available' | 'in_process' | 'adopted'
  photo_urls      text[],                      -- array of Supabase Storage URLs
  social_post     text,                        -- AI-generated post (N8N + Groq)
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index animals_shelter_id_idx on animals(shelter_id);
create index animals_status_idx on animals(status);
create index animals_species_idx on animals(species);


-- ============================================================
-- FAMILY PROFILES + ADOPTION REQUESTS
-- F2 — Smart Adoption
-- ============================================================

-- Registered public users (families)
create table family_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  full_name       text,
  email           text,
  phone           text,
  location        geography(point, 4326),      -- for geo-alerts (Lost & Found)
  city            text,
  -- Questionnaire answers (stored for matching history)
  living_space    text,                        -- 'apartment' | 'house_no_yard' | 'house_yard'
  lifestyle       text,                        -- 'sedentary' | 'moderate' | 'active'
  experience      text,                        -- 'none' | 'some' | 'experienced'
  has_other_pets  boolean default false,
  has_children    boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Adoption requests from families to shelters
create table adoption_requests (
  id              uuid primary key default gen_random_uuid(),
  animal_id       uuid references animals(id) on delete cascade,
  shelter_id      uuid references shelters(id) on delete cascade,
  family_id       uuid references family_profiles(id) on delete cascade,
  -- Adopter contact (no account needed — replaces the family_profiles join)
  full_name       text,
  email           text,
  phone           text,
  -- Snapshot of questionnaire at time of request
  living_space    text,
  lifestyle       text,
  experience      text,
  has_other_pets  boolean,
  has_children    boolean,
  -- AI matching result (from Groq)
  compatibility_score   numeric(5,2),         -- 0.00 to 100.00
  compatibility_reasons text,                 -- JSON string with reasons array
  -- Request state
  status          text default 'pending',     -- 'pending' | 'seen' | 'approved' | 'rejected'
  notes           text,                       -- shelter notes
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index adoption_requests_shelter_id_idx on adoption_requests(shelter_id);
create index adoption_requests_animal_id_idx on adoption_requests(animal_id);
create index adoption_requests_status_idx on adoption_requests(status);

create unique index adoption_requests_pending_dedupe
  on adoption_requests (animal_id, lower(email))
  where status = 'pending';


-- ============================================================
-- GEO-ALERT SUBSCRIBERS (Lost & Found)
-- No account, opt-in by email + map point
-- ============================================================

create table alert_subscriptions (
  id                uuid primary key default gen_random_uuid(),
  email             text not null unique,
  full_name         text,
  city              text,
  location          geography(point, 4326) not null,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  created_at        timestamptz default now()
);

create index alert_subscriptions_location_idx
  on alert_subscriptions using gist(location);

-- No policies on purpose: only the service role touches this table.
alter table alert_subscriptions enable row level security;


-- ============================================================
-- LOST & FOUND REPORTS
-- F3 — Lost & Found
-- ============================================================

create table lost_found_reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid references auth.users(id) on delete set null,
  report_type     text not null,               -- 'lost' | 'found'
  pet_name        text,                        -- null if found (unknown)
  species         text,                        -- 'dog' | 'cat' | 'other'
  breed           text,
  color           text,
  description     text,
  photo_urls      text[],                      -- Supabase Storage URLs
  location        geography(point, 4326) not null,
  location_notes  text,                        -- e.g. "Near Parque México"
  city            text,
  status          text default 'open',         -- 'open' | 'resolved'
  -- Vision matching result (from Rekognition)
  matched_report_id     uuid references lost_found_reports(id),
  match_confidence      numeric(5,2),          -- 0.00 to 100.00
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index lost_found_reports_location_idx
  on lost_found_reports using gist(location);  -- spatial index for PostGIS queries
create index lost_found_reports_status_idx
  on lost_found_reports(status);
create index lost_found_reports_type_idx
  on lost_found_reports(report_type);


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enforces multi-tenancy at the database level
-- ============================================================

alter table shelters           enable row level security;
alter table shelter_users      enable row level security;
alter table animals            enable row level security;
alter table family_profiles    enable row level security;
alter table adoption_requests  enable row level security;
alter table lost_found_reports enable row level security;

-- Shelters: public read, shelter admin write
create policy "shelters_public_read"
  on shelters for select using (true);

create policy "shelters_admin_write"
  on shelters for all
  using (
    exists (
      select 1 from shelter_users
      where shelter_users.shelter_id = shelters.id
      and shelter_users.user_id = auth.uid()
    )
  );

-- Animals: public read available only, shelter admin write
create policy "animals_public_read"
  on animals for select
  using (status = 'available');

create policy "animals_shelter_read_all"
  on animals for select
  using (
    exists (
      select 1 from shelter_users
      where shelter_users.shelter_id = animals.shelter_id
      and shelter_users.user_id = auth.uid()
    )
  );

create policy "animals_shelter_write"
  on animals for all
  using (
    exists (
      select 1 from shelter_users
      where shelter_users.shelter_id = animals.shelter_id
      and shelter_users.user_id = auth.uid()
    )
  );

-- Family profiles: user owns their own profile
create policy "family_profiles_own"
  on family_profiles for all
  using (user_id = auth.uid());

-- Adoption requests: family sees own, shelter sees theirs
create policy "adoption_requests_family_read"
  on adoption_requests for select
  using (
    exists (
      select 1 from family_profiles
      where family_profiles.id = adoption_requests.family_id
      and family_profiles.user_id = auth.uid()
    )
  );

create policy "adoption_requests_shelter_all"
  on adoption_requests for all
  using (
    exists (
      select 1 from shelter_users
      where shelter_users.shelter_id = adoption_requests.shelter_id
      and shelter_users.user_id = auth.uid()
    )
  );

create policy "adoption_requests_family_insert"
  on adoption_requests for insert
  with check (
    exists (
      select 1 from family_profiles
      where family_profiles.id = adoption_requests.family_id
      and family_profiles.user_id = auth.uid()
    )
  );

-- Lost & found: public read and insert, reporter can update their own
create policy "lost_found_public_read"
  on lost_found_reports for select using (true);

create policy "lost_found_public_insert"
  on lost_found_reports for insert with check (true);

create policy "lost_found_reporter_update"
  on lost_found_reports for update
  using (reporter_id = auth.uid());


-- ============================================================
-- HELPER FUNCTION — PostGIS radius query for geo-alerts
-- Called by N8N when a new lost_found_report is created
-- Returns subscribers from alert_subscriptions within X meters
-- ============================================================

-- Return shape changes (user_id → subscription_id + unsubscribe_token): drop + recreate
drop function if exists get_users_near_report(uuid, float);

create function get_users_near_report(
  report_id uuid,
  radius_m  float default 2000
)
returns table(subscription_id uuid, email text, distance_m float, unsubscribe_token uuid)
language sql
as $$
  select
    s.id,
    s.email,
    ST_Distance(s.location, r.location)::float as distance_m,
    s.unsubscribe_token
  from lost_found_reports r
  join alert_subscriptions s
    on ST_DWithin(s.location, r.location, radius_m)
  where r.id = report_id
  order by distance_m asc;
$$;

-- Edge Functions call get_users_near_report via PostgREST as service_role,
-- which lacks SELECT on auth schema tables by default (error 42501).
grant select on auth.users to service_role;


-- ============================================================
-- HELPER FUNCTION — PostGIS radius query for the Lost & Found map
-- Called by GET /api/lost-found when lat/lng are provided.
-- (Existed in the live DB but was missing from this file — synced 2026-07-06)
-- ============================================================

create or replace function get_reports_near_point(
  lat           float,
  lng           float,
  radius_m      float default 5000,
  filter_status text default 'open',
  filter_type   text default null,
  result_limit  int default 50
)
returns table(
  id uuid, report_type text, pet_name text, species text, breed text,
  color text, description text, photo_urls text[], location json,
  location_notes text, city text, status text,
  matched_report_id uuid, match_confidence numeric, created_at timestamptz
)
language sql
as $$
  select
    r.id,
    r.report_type,
    r.pet_name,
    r.species,
    r.breed,
    r.color,
    r.description,
    r.photo_urls,
    json_build_object(
      'lat', ST_Y(r.location::geometry),
      'lng', ST_X(r.location::geometry)
    ) as location,
    r.location_notes,
    r.city,
    r.status,
    r.matched_report_id,
    r.match_confidence,
    r.created_at
  from lost_found_reports r
  where ST_DWithin(r.location, ST_MakePoint(lng, lat)::geography, radius_m)
    and r.status = filter_status
    and (filter_type is null or r.report_type = filter_type)
  order by r.created_at desc
  limit result_limit;
$$;


-- ============================================================
-- UPDATED_AT TRIGGER
-- Auto-updates updated_at on every row change
-- ============================================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger shelters_updated_at
  before update on shelters
  for each row execute function update_updated_at();

create trigger animals_updated_at
  before update on animals
  for each row execute function update_updated_at();

create trigger adoption_requests_updated_at
  before update on adoption_requests
  for each row execute function update_updated_at();

create trigger lost_found_reports_updated_at
  before update on lost_found_reports
  for each row execute function update_updated_at();


-- ============================================================
-- F4 — RAG SHELTER ASSISTANT (STRETCH)
-- Uncomment and run separately if F4 is implemented
-- ============================================================

-- create table shelter_documents (
--   id            uuid primary key default gen_random_uuid(),
--   shelter_id    uuid references shelters(id) on delete cascade,
--   file_name     text not null,
--   file_url      text not null,              -- Supabase Storage URL
--   status        text default 'processing',  -- 'processing' | 'ready' | 'error'
--   chunk_count   int,                        -- number of chunks generated
--   created_at    timestamptz default now()
-- );

-- create table document_chunks (
--   id            uuid primary key default gen_random_uuid(),
--   shelter_id    uuid references shelters(id) on delete cascade,
--   document_id   uuid references shelter_documents(id) on delete cascade,
--   content       text not null,              -- raw chunk text
--   embedding     vector(384),               -- all-MiniLM-L6-v2 output
--   chunk_index   int,                        -- position in original document
--   created_at    timestamptz default now()
-- );

-- create index document_chunks_shelter_id_idx
--   on document_chunks(shelter_id);

-- create index document_chunks_embedding_idx
--   on document_chunks using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100);                       -- adjust lists based on data volume

-- alter table shelter_documents enable row level security;
-- alter table document_chunks    enable row level security;

-- create policy "shelter_documents_shelter_write"
--   on shelter_documents for all
--   using (
--     exists (
--       select 1 from shelter_users
--       where shelter_users.shelter_id = shelter_documents.shelter_id
--       and shelter_users.user_id = auth.uid()
--     )
--   );

-- create policy "document_chunks_public_read"
--   on document_chunks for select using (true);
