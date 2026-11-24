-- HSC Interactives Hub: initial schema (guide §5.7)
-- =============================================================================================
-- HOW TO APPLY (human task H3, Luca)
--   Option A, Supabase dashboard: Project → SQL Editor → New query → paste this whole file → Run.
--   Option B, Supabase CLI:       supabase link --project-ref <ref> && supabase db push
-- Then (H5) add access codes, for example:
--   insert into public.access_codes (code, kind) values ('TTT2026', 'event'), ('CLASS2026', 'class');
-- Codes are stored upper case; redeem_access_code() upper-cases and trims what people type.
--
-- Notes
-- - Sign-in is for the premium feel, not security. RLS only keeps each user's saved items their own.
-- - Anonymous (access-code) users get the `authenticated` role, with is_anonymous = true in their JWT.
-- - Grants are explicit because Supabase is moving to opt-in Data API exposure for new tables.
-- - Optional clean-up of old anonymous class sessions (run occasionally in the SQL editor):
--     delete from auth.users where is_anonymous is true and created_at < now() - interval '30 days';
-- - delete_my_account() deletes from auth.users as the function owner (postgres). Test it once in the
--   project after applying (sign in as a throwaway account, delete it from the dashboard).
-- =============================================================================================

-- ---------- tables ----------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  school text check (char_length(school) <= 120),
  subjects text[] not null default '{}'
    check (subjects <@ array['me1', 'me2', 'phy', 'eng']::text[]),
  founding boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.saved_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  interactive_id text not null check (interactive_id ~ '^[a-z0-9_][a-z0-9-]{1,80}$'),
  title text not null check (char_length(title) between 1 and 120),
  params jsonb not null check (jsonb_typeof(params) = 'object' and pg_column_size(params) < 16384),
  created_at timestamptz not null default now()
);

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  items jsonb not null default '[]'   -- [{ interactiveId, params?, note? }]
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 50 and pg_column_size(items) < 65536),
  created_at timestamptz not null default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  subject text not null check (subject in ('me1', 'me2', 'phy', 'eng')),
  topic text not null check (char_length(topic) between 1 and 140),
  details text check (char_length(details) <= 1000),
  created_at timestamptz not null default now()
);

create table public.votes (
  request_id uuid not null references public.requests on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  primary key (request_id, user_id)
);

create table public.access_codes (
  code text primary key check (code = upper(code)),
  kind text not null check (kind in ('event', 'class')),
  active boolean not null default true
);

create index saved_scenarios_user_idx on public.saved_scenarios (user_id, created_at desc);
create index playlists_user_idx on public.playlists (user_id, created_at desc);
create index requests_user_idx on public.requests (user_id);
create index votes_user_idx on public.votes (user_id);

-- ---------- privileges: nothing for anon; only what the app needs for authenticated ----------

revoke all on public.profiles, public.saved_scenarios, public.playlists, public.requests, public.votes, public.access_codes
  from anon, authenticated;

-- founding is never writable from the browser: only redeem_access_code() sets it.
grant select, delete on public.profiles to authenticated;
grant insert (id, display_name, school, subjects) on public.profiles to authenticated;
grant update (display_name, school, subjects) on public.profiles to authenticated;

grant select, insert, update, delete on public.saved_scenarios to authenticated;
grant select, insert, update, delete on public.playlists to authenticated;
grant select, insert, delete on public.requests to authenticated;
grant select, insert, delete on public.votes to authenticated;
-- access_codes: no grants. Only redeem_access_code() reads it.

-- ---------- row-level security ----------

alter table public.profiles        enable row level security;
alter table public.saved_scenarios enable row level security;
alter table public.playlists       enable row level security;
alter table public.requests        enable row level security;
alter table public.votes           enable row level security;
alter table public.access_codes    enable row level security;   -- no policies: only the function reads it

create policy "own profile" on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own scenarios" on public.saved_scenarios for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own playlists" on public.playlists for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Requests and votes: any signed-in user can read them (no names are exposed by the app).
-- Teachers can add them; anonymous class-code sessions can't, unless they redeemed an event code.
create policy "read requests" on public.requests for select to authenticated using (true);
create policy "add request" on public.requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
      or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.founding)
    )
  );
create policy "drop own request" on public.requests for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "read votes" on public.votes for select to authenticated using (true);
create policy "own votes" on public.votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false) = false
      or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.founding)
    )
  );
create policy "unvote" on public.votes for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- functions ----------

-- Redeem an access code for the current user (anonymous class session or a signed-in teacher).
-- Event codes set founding = true; it never goes back to false.
create function public.redeem_access_code(p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  k text;
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;
  select c.kind into k from public.access_codes c where c.code = upper(trim(p_code)) and c.active;
  if k is null then
    return false;
  end if;
  insert into public.profiles (id, founding) values (uid, k = 'event')
  on conflict (id) do update set founding = public.profiles.founding or excluded.founding;
  return true;
end $$;

revoke all on function public.redeem_access_code(text) from public, anon;
grant execute on function public.redeem_access_code(text) to authenticated;

-- Delete the current user's account. Cascades remove the profile, scenarios, playlists, requests and votes.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = uid;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
