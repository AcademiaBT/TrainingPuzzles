-- ============================================================
-- ADMIN SETUP — tabel de admini + drepturi de scriere pe
-- categories/games, gestionate prin interfața de admin din app
-- ============================================================

create table if not exists admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;
-- Fără nicio policy publică pe admins — tabelul nu e vizibil deloc prin
-- Data API. Verificarea se face exclusiv prin funcția is_admin() de mai jos.

-- SECURITY DEFINER: rulează cu drepturi de owner, deci poate citi din
-- `admins` indiferent de RLS de pe acel tabel (nu creează un cerc vicios
-- la primul admin adăugat manual).
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

grant execute on function is_admin() to anon, authenticated;

-- ============================================================
-- Policies de scriere pentru categories (momentan fără nicio
-- policy — nici tu nu puteai edita ceva direct din interfață)
-- ============================================================
drop policy if exists "admin select categories" on categories;
drop policy if exists "admin insert categories" on categories;
drop policy if exists "admin update categories" on categories;
drop policy if exists "admin delete categories" on categories;

create policy "admin select categories" on categories
  for select using (is_admin());
create policy "admin insert categories" on categories
  for insert with check (is_admin());
create policy "admin update categories" on categories
  for update using (is_admin()) with check (is_admin());
create policy "admin delete categories" on categories
  for delete using (is_admin());

-- ============================================================
-- Policies pentru games (necesar ca admin-ul să poată vedea/
-- adăuga jocuri noi în registry, pentru viitoarele jocuri)
--
-- NOTĂ DE SECURITATE: tabela `games` nu avea RLS activat în
-- schema inițială (1_schema.sql) — o activăm acum, altfel
-- policy-urile de mai jos sunt ignorate silențios.
-- ============================================================
alter table games enable row level security;

drop policy if exists "admin select games" on games;
drop policy if exists "admin insert games" on games;
drop policy if exists "admin update games" on games;

create policy "admin select games" on games
  for select using (true);  -- lista de jocuri poate fi publică (o citește și jucătorul)
create policy "admin insert games" on games
  for insert with check (is_admin());
create policy "admin update games" on games
  for update using (is_admin()) with check (is_admin());

grant select, insert, update, delete on categories to authenticated;
grant select, insert, update on games to authenticated, anon;

-- ============================================================
-- BOOTSTRAP — cum îți adaugi primul cont de admin
-- ============================================================
-- 1. Supabase → Authentication → Users → Add user → completează
--    email + parolă, bifează "Auto Confirm User".
-- 2. Copiază UID-ul contului nou creat.
-- 3. Rulează (înlocuiește cu UID-ul tău real):
--
--    insert into admins (user_id) values ('UUID-UL-TAU-AICI');
--
-- După asta, poți intra pe /admin/ cu emailul și parola alese la pasul 1.
-- Formularul din app NU are opțiune de auto-înregistrare — intenționat,
-- ca să nu poată oricine să-și creeze cont (chiar dacă, fără rândul din
-- `admins`, un cont oricum n-ar avea nicio putere de scriere).
