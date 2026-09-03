-- ============================================================
-- PUZZLE TRAINING APP — Schema Supabase
-- Joc #1: "Connections" (4x4 grid, grupare pe categorii)
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. REGISTRY DE JOCURI (pentru multi-game shell)
-- ============================================================
create table games (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,        -- 'connections', 'wordle-clone', ...
  name          text not null,
  description   text,
  icon          text,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

insert into games (slug, name, description, icon)
values ('connections', 'Connections', 'Grupează 16 iteme în 4 categorii ascunse', '🧩');

-- ============================================================
-- 2. CATEGORII (pool-ul din care se generează puzzle-urile)
--    SENSIBIL: nu trebuie expus direct clientului nelogat/logat
--    normal — doar prin RPC-uri controlate sau service_role.
-- ============================================================
create type tier_level as enum ('yellow', 'green', 'blue', 'purple');

create table categories (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null references games(id) on delete cascade,
  title         text not null,                -- 'Famous Toms'
  tier          tier_level not null,
  items         text[] not null,              -- exact 4 iteme
  explanation   text,                          -- opțional, afișat după rezolvare
  active        boolean not null default true,
  times_used    int not null default 0,
  created_at    timestamptz not null default now(),
  constraint items_len_check check (array_length(items, 1) = 4)
);

create index idx_categories_tier_active on categories (game_id, tier, active);

-- ============================================================
-- 3. PUZZLE-URI GENERATE
--    category_ids = mapping-ul "secret". NU se expune public.
-- ============================================================
create table puzzles (
  id               uuid primary key default gen_random_uuid(),
  game_id          uuid not null references games(id) on delete cascade,
  category_ids     uuid[] not null,            -- 4 id-uri, ordonate yellow->purple
  shuffled_items   jsonb not null,             -- [{ "item": "CRUISE", "position": 0 }, ...]
  is_daily         boolean not null default false,
  puzzle_date      date,                        -- doar dacă is_daily
  created_at       timestamptz not null default now(),
  constraint category_ids_len_check check (array_length(category_ids, 1) = 4)
);

create unique index uniq_daily_puzzle on puzzles (puzzle_date) where is_daily;

-- View PUBLICĂ — expune doar ce are voie clientul să vadă
create view puzzle_public as
  select id, game_id, shuffled_items, is_daily, puzzle_date, created_at
  from puzzles;

-- ============================================================
-- 4. SESIUNI DE JOC (progresul userului pe un puzzle anume)
-- ============================================================
create table game_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  puzzle_id           uuid not null references puzzles(id) on delete cascade,
  mistakes            int not null default 0,
  solved_category_ids uuid[] not null default '{}',
  guess_history       jsonb not null default '[]',  -- log fiecărei încercări
  status              text not null default 'in_progress'
                        check (status in ('in_progress','won','lost')),
  created_at          timestamptz not null default now(),
  completed_at        timestamptz,
  unique (user_id, puzzle_id)
);

create index idx_sessions_user on game_sessions (user_id, status);

-- ============================================================
-- 5. STATISTICI AGREGATE (pentru profil / streak-uri viitoare)
-- ============================================================
create table user_game_stats (
  user_id         uuid not null references auth.users(id) on delete cascade,
  game_id         uuid not null references games(id) on delete cascade,
  games_played    int not null default 0,
  games_won       int not null default 0,
  current_streak  int not null default 0,
  best_streak     int not null default 0,
  avg_mistakes    numeric(4,2) default 0,
  updated_at      timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================
alter table categories enable row level security;
alter table puzzles enable row level security;
alter table game_sessions enable row level security;
alter table user_game_stats enable row level security;

-- categories & puzzles: NICIO policy publică de SELECT.
-- Sunt accesate doar din funcții SECURITY DEFINER (mai jos) sau service_role.
-- puzzle_public (view-ul) e cel expus efectiv clientului:
grant select on puzzle_public to authenticated, anon;

-- game_sessions: userul vede/modifică doar propriile sesiuni
create policy "select own sessions" on game_sessions
  for select using (auth.uid() = user_id);
create policy "insert own sessions" on game_sessions
  for insert with check (auth.uid() = user_id);
create policy "update own sessions" on game_sessions
  for update using (auth.uid() = user_id);

-- user_game_stats: userul vede doar statisticile proprii
create policy "select own stats" on user_game_stats
  for select using (auth.uid() = user_id);

-- ============================================================
-- 7. GENERARE PUZZLE (random din pool, fără coliziuni de iteme)
-- ============================================================
create or replace function generate_puzzle(p_game_slug text default 'connections')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id     uuid;
  v_cat_ids     uuid[] := '{}';
  v_all_items   text[] := '{}';
  v_tier        tier_level;
  v_cat         record;
  v_shuffled    jsonb;
  v_puzzle_id   uuid;
  v_attempts    int;
begin
  select id into v_game_id from games where slug = p_game_slug;
  if v_game_id is null then
    raise exception 'Game % not found', p_game_slug;
  end if;

  foreach v_tier in array array['yellow','green','blue','purple']::tier_level[]
  loop
    v_attempts := 0;
    loop
      v_attempts := v_attempts + 1;
      if v_attempts > 50 then
        raise exception 'Could not find non-colliding category for tier %', v_tier;
      end if;

      -- alege o categorie random din tier, ponderată spre times_used mic
      select c.* into v_cat
      from categories c
      where c.game_id = v_game_id
        and c.tier = v_tier
        and c.active = true
        and not (c.id = any(v_cat_ids))
      order by c.times_used asc, random()
      limit 1;

      if v_cat.id is null then
        raise exception 'No available category for tier %', v_tier;
      end if;

      -- verifică coliziune de iteme cu ce am ales deja
      if not (v_cat.items && v_all_items) then
        v_cat_ids := array_append(v_cat_ids, v_cat.id);
        v_all_items := v_all_items || v_cat.items;
        exit;
      end if;
      -- altfel reîncearcă cu altă categorie din același tier
    end loop;
  end loop;

  -- amestecă cele 16 iteme
  select jsonb_agg(jsonb_build_object('item', item, 'position', ord - 1))
  into v_shuffled
  from (
    select item, row_number() over (order by random()) as ord
    from unnest(v_all_items) as item
  ) sub;

  insert into puzzles (game_id, category_ids, shuffled_items)
  values (v_game_id, v_cat_ids, v_shuffled)
  returning id into v_puzzle_id;

  update categories set times_used = times_used + 1
  where id = any(v_cat_ids);

  return v_puzzle_id;
end;
$$;

-- ============================================================
-- 8. VALIDARE GHICIRE (server-side, ascunde maparea de client)
-- ============================================================
create or replace function submit_guess(
  p_session_id uuid,
  p_items text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session      record;
  v_puzzle       record;
  v_cat          record;
  v_best_match   int := 0;
  v_matched_cat  uuid;
  v_result       text;
  v_solved       uuid[];
begin
  if array_length(p_items, 1) <> 4 then
    raise exception 'Exactly 4 items required';
  end if;

  select * into v_session from game_sessions
  where id = p_session_id and user_id = auth.uid();
  if v_session.id is null then
    raise exception 'Session not found or not yours';
  end if;
  if v_session.status <> 'in_progress' then
    return jsonb_build_object('result', 'game_over', 'status', v_session.status);
  end if;

  select * into v_puzzle from puzzles where id = v_session.puzzle_id;

  -- găsește categoria cu cel mai mare overlap cu selecția
  for v_cat in
    select c.* from categories c where c.id = any(v_puzzle.category_ids)
  loop
    if cardinality(array(select unnest(v_cat.items) intersect select unnest(p_items))) > v_best_match then
      v_best_match := cardinality(array(select unnest(v_cat.items) intersect select unnest(p_items)));
      v_matched_cat := v_cat.id;
    end if;
  end loop;

  if v_best_match = 4 then
    v_result := 'correct';
    v_solved := array_append(v_session.solved_category_ids, v_matched_cat);

    update game_sessions
    set solved_category_ids = v_solved,
        guess_history = guess_history || jsonb_build_array(
          jsonb_build_object('items', p_items, 'result', 'correct', 'at', now())
        ),
        status = case when cardinality(v_solved) = 4 then 'won' else status end,
        completed_at = case when cardinality(v_solved) = 4 then now() else null end
    where id = p_session_id;

    return jsonb_build_object(
      'result', 'correct',
      'category', jsonb_build_object(
        'title', (select title from categories where id = v_matched_cat),
        'tier', (select tier from categories where id = v_matched_cat),
        'items', (select items from categories where id = v_matched_cat)
      ),
      'solved_count', cardinality(v_solved),
      'won', cardinality(v_solved) = 4
    );

  elsif v_best_match = 3 then
    v_result := 'one_away';
  else
    v_result := 'wrong';
  end if;

  -- greșit sau "one away": incrementează mistakes
  update game_sessions
  set mistakes = mistakes + 1,
      guess_history = guess_history || jsonb_build_array(
        jsonb_build_object('items', p_items, 'result', v_result, 'at', now())
      ),
      status = case when mistakes + 1 >= 4 then 'lost' else status end,
      completed_at = case when mistakes + 1 >= 4 then now() else null end
  where id = p_session_id;

  return jsonb_build_object(
    'result', v_result,
    'mistakes', v_session.mistakes + 1,
    'lost', (v_session.mistakes + 1) >= 4
  );
end;
$$;

-- ============================================================
-- 9. REVEAL LA PIERDERE (categoriile nedezvăluite)
-- ============================================================
create or replace function reveal_puzzle(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_puzzle  record;
begin
  select * into v_session from game_sessions
  where id = p_session_id and user_id = auth.uid();
  if v_session.id is null then
    raise exception 'Session not found or not yours';
  end if;
  if v_session.status = 'in_progress' then
    raise exception 'Game still in progress';
  end if;

  select * into v_puzzle from puzzles where id = v_session.puzzle_id;

  return (
    select jsonb_agg(jsonb_build_object(
      'title', c.title, 'tier', c.tier, 'items', c.items,
      'solved', c.id = any(v_session.solved_category_ids)
    ) order by c.tier)
    from categories c
    where c.id = any(v_puzzle.category_ids)
  );
end;
$$;

-- ============================================================
-- 10. HELPER: pornește o sesiune nouă pe un puzzle random
-- ============================================================
create or replace function start_new_session(p_game_slug text default 'connections')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_puzzle_id uuid;
  v_session_id uuid;
begin
  v_puzzle_id := generate_puzzle(p_game_slug);

  insert into game_sessions (user_id, puzzle_id)
  values (auth.uid(), v_puzzle_id)
  returning id into v_session_id;

  return v_session_id;
end;
$$;

-- ============================================================
-- SEED — categorii exemplu (poți adăuga zeci în plus)
-- ============================================================
insert into categories (game_id, title, tier, items, explanation)
select id, 'Famous Toms', 'purple', array['CRUISE','HOLLAND','WAITS','PETTY'],
       'Toameni celebri cu numele Tom'
from games where slug = 'connections';

insert into categories (game_id, title, tier, items, explanation)
select id, 'European Countries', 'yellow', array['PORTUGAL','DENMARK','POLAND','GREECE'],
       NULL
from games where slug = 'connections';
