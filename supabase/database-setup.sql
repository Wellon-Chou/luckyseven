-- ── 1. SUBSCRIPTIONS: who has paid, and for what tier ──────────────────────
create table if not exists public.subscriptions (
  user_id                uuid primary key references auth.users(id) on delete cascade,
  tier                   int  not null default 0,         -- 0 free · 1 standard · 2 premium
  status                 text not null default 'inactive',
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  has_trialed            boolean not null default false,   -- has ever started a free trial
  updated_at             timestamptz not null default now()
);

-- ── 2. CONTENT: the gated lines that used to live in sheet.json ────────────
create table if not exists public.content (
  id        bigint generated always as identity primary key,
  section   text not null,              -- story | root | hidden | majorminor | health | career
  subtype   text not null default '',   -- e.g. 'Parents' / 'Many' (blank when N/A)
  item_key  text not null,              -- the number or element
  line      text not null,
  min_tier  int  not null default 1,    -- 1 = needs Standard
  unique (section, subtype, item_key)
);

-- ── 3. Effective access level for the CURRENT user (0 if no active sub) ─────
-- SECURITY DEFINER lets it read `subscriptions` regardless of RLS, so we can
-- safely call it from the content policy without RLS recursion.
create or replace function public.current_access_level()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select tier from public.subscriptions
      where user_id = auth.uid()
        and status in ('active', 'trialing')
        and (current_period_end is null or current_period_end > now())
      limit 1),
    0);
$$;
grant execute on function public.current_access_level() to anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.subscriptions
    where user_id = auth.uid()
      and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
      and coalesce(tier, 0) > 0
      and stripe_customer_id is null
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ── 4. Turn RLS ON (with it on and no policy, ALL access is denied) ─────────
alter table public.subscriptions enable row level security;
alter table public.content       enable row level security;

-- ── 5. Policies ────────────────────────────────────────────────────────────
-- 5a. A user may read ONLY their own subscription. There is NO write policy,
--     so users can't change their own tier — only the webhook (service_role,
--     which bypasses RLS) can write it.
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription"
  on public.subscriptions for select
  to authenticated
  using (user_id = auth.uid());

-- 5b. Content is readable only if your effective tier ≥ the row's min_tier.
drop policy if exists "read content by tier" on public.content;
create policy "read content by tier"
  on public.content for select
  to anon, authenticated
  using (public.current_access_level() >= min_tier);

-- ── 6. One test row so we can prove the gate works ─────────────────────────
insert into public.content (section, item_key, line, min_tier)
values ('story', '0', 'TEST line — must be HIDDEN from non-subscribers', 1)
on conflict (section, subtype, item_key) do nothing;

-- ── 7. BLUEPRINTS: a user's saved name + birth-date records (蓝图存档) ────────
create table if not exists public.blueprints (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade default auth.uid(),
  name       text        not null,
  birth_date text        not null,                 -- ISO "YYYY-MM-DD"
  created_at timestamptz not null default now()
);

alter table public.blueprints enable row level security;

-- A user may only read / add / delete their OWN saved records.
drop policy if exists "read own blueprints" on public.blueprints;
create policy "read own blueprints"
  on public.blueprints for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "insert own blueprints" on public.blueprints;
create policy "insert own blueprints"
  on public.blueprints for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "update own blueprints" on public.blueprints;
create policy "update own blueprints"
  on public.blueprints for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "delete own blueprints" on public.blueprints;
create policy "delete own blueprints"
  on public.blueprints for delete
  to authenticated
  using (user_id = auth.uid());

-- ── 7b. BLUEPRINT FOLDERS: organise saved records into folders ───────────────
create table if not exists public.blueprint_folders (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade default auth.uid(),
  name       text        not null,
  created_at timestamptz not null default now()
);

create index if not exists blueprint_folders_user_id_idx
  on public.blueprint_folders (user_id);

alter table public.blueprint_folders enable row level security;

drop policy if exists "read own blueprint folders" on public.blueprint_folders;
create policy "read own blueprint folders"
  on public.blueprint_folders for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "insert own blueprint folders" on public.blueprint_folders;
create policy "insert own blueprint folders"
  on public.blueprint_folders for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "update own blueprint folders" on public.blueprint_folders;
create policy "update own blueprint folders"
  on public.blueprint_folders for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "delete own blueprint folders" on public.blueprint_folders;
create policy "delete own blueprint folders"
  on public.blueprint_folders for delete
  to authenticated
  using (user_id = auth.uid());

-- Nullable folder reference on saved records (null = uncategorised).
alter table public.blueprints
  add column if not exists folder_id uuid references public.blueprint_folders(id) on delete set null;

create index if not exists blueprints_user_id_idx
  on public.blueprints (user_id);

create index if not exists blueprints_folder_id_idx
  on public.blueprints (folder_id);

-- ── 8. AI SUMMARY CACHE (总体故事 is a free feature — no login, no cap) ───────
-- Global cache of generated summaries, keyed by a hash of the source material,
-- so repeat requests are free.
create table if not exists public.summary_cache (
  source_hash text        primary key,
  text        text        not null,
  created_at  timestamptz not null default now()
);

-- Only the Edge Function (service role) touches this; RLS on with no policies
-- denies all direct client access.
alter table public.summary_cache enable row level security;

-- ── 9. TRIAL CARDS: card fingerprints that have already used a free trial, so the
-- same physical card can't farm 7-day trials across multiple accounts/emails.
-- Only the Stripe webhook (service role) writes/reads this; RLS on with no policy
-- denies all direct client access.
create table if not exists public.trial_cards (
  fingerprint   text        primary key,
  user_id       uuid        references auth.users(id) on delete set null,
  first_used_at timestamptz not null default now()
);
alter table public.trial_cards enable row level security;