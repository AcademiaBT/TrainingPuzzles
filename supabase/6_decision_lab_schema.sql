-- ============================================================
-- DECISION LAB — al doilea joc din platformă
-- Simulare decizională: situație → 4 opțiuni → consecință + scor
-- ============================================================

insert into games (slug, name, description, icon)
values ('decision-lab', 'Decision Lab', 'Simulări de gândire critică în situații reale', '🧠')
on conflict (slug) do nothing;

-- ============================================================
-- TABELE
-- ============================================================
create table decision_scenarios (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references games(id) on delete cascade,
  title       text not null,
  description text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table decision_nodes (
  id          uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references decision_scenarios(id) on delete cascade,
  node_text   text not null,
  is_root     boolean not null default false,
  is_final    boolean not null default false
);

create table decision_choices (
  id            uuid primary key default gen_random_uuid(),
  node_id       uuid not null references decision_nodes(id) on delete cascade,
  choice_text   text not null,
  next_node_id  uuid references decision_nodes(id) on delete cascade,
  score         int not null default 0,
  feedback      text
);

create table decision_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  scenario_id      uuid not null references decision_scenarios(id) on delete cascade,
  current_node_id  uuid references decision_nodes(id),
  total_score      int not null default 0,
  history          jsonb not null default '[]',
  status           text not null default 'in_progress'
                     check (status in ('in_progress', 'completed')),
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index idx_decision_nodes_scenario on decision_nodes (scenario_id);
create index idx_decision_choices_node on decision_choices (node_id);
create index idx_decision_sessions_user on decision_sessions (user_id, status);

-- ============================================================
-- RLS
-- ============================================================
alter table decision_scenarios enable row level security;
alter table decision_nodes enable row level security;
alter table decision_choices enable row level security;
alter table decision_sessions enable row level security;

-- Scenariile (titlu + descriere) sunt publice — jucătorul alege dintr-o
-- listă. Nodurile și opțiunile NU sunt publice — la fel ca la Connections,
-- se dezvăluie progresiv, exclusiv prin RPC-urile de mai jos.
create policy "public select scenarios" on decision_scenarios
  for select using (true);
create policy "admin write scenarios" on decision_scenarios
  for insert with check (is_admin());
create policy "admin update scenarios" on decision_scenarios
  for update using (is_admin()) with check (is_admin());
create policy "admin delete scenarios" on decision_scenarios
  for delete using (is_admin());

create policy "admin select nodes" on decision_nodes
  for select using (is_admin());
create policy "admin write nodes" on decision_nodes
  for insert with check (is_admin());
create policy "admin delete nodes" on decision_nodes
  for delete using (is_admin());

create policy "admin select choices" on decision_choices
  for select using (is_admin());
create policy "admin write choices" on decision_choices
  for insert with check (is_admin());
create policy "admin delete choices" on decision_choices
  for delete using (is_admin());

create policy "select own decision sessions" on decision_sessions
  for select using (auth.uid() = user_id);
create policy "insert own decision sessions" on decision_sessions
  for insert with check (auth.uid() = user_id);
create policy "update own decision sessions" on decision_sessions
  for update using (auth.uid() = user_id);

grant select on decision_scenarios to anon, authenticated;
grant select, insert, delete on decision_nodes to authenticated;
grant select, insert, delete on decision_choices to authenticated;
grant select, insert, update on decision_sessions to authenticated;

-- ============================================================
-- RPC — pornește o sesiune nouă pe un scenariu ales
-- ============================================================
create or replace function start_decision_session(p_scenario_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_root_id uuid;
  v_session_id uuid;
begin
  select id into v_root_id from decision_nodes
  where scenario_id = p_scenario_id and is_root = true
  limit 1;

  if v_root_id is null then
    raise exception 'Scenario % has no root node', p_scenario_id;
  end if;

  insert into decision_sessions (user_id, scenario_id, current_node_id)
  values (auth.uid(), p_scenario_id, v_root_id)
  returning id into v_session_id;

  return v_session_id;
end;
$$;

grant execute on function start_decision_session(uuid) to anon, authenticated;

-- ============================================================
-- RPC — starea nodului curent (text + opțiuni, fără scor/feedback/
-- destinație, ca să nu se poată "vedea dinainte" consecința)
-- ============================================================
create or replace function get_current_node(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_node record;
begin
  select * into v_session from decision_sessions
  where id = p_session_id and user_id = auth.uid();
  if v_session.id is null then
    raise exception 'Session not found or not yours';
  end if;

  select * into v_node from decision_nodes where id = v_session.current_node_id;

  return jsonb_build_object(
    'node_text', v_node.node_text,
    'is_final', v_node.is_final,
    'total_score', v_session.total_score,
    'status', v_session.status,
    'choices', case when v_node.is_final then '[]'::jsonb else (
      select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'choice_text', c.choice_text)), '[]'::jsonb)
      from decision_choices c
      where c.node_id = v_node.id
    ) end
  );
end;
$$;

grant execute on function get_current_node(uuid) to anon, authenticated;

-- ============================================================
-- RPC — aplică o alegere, avansează sesiunea, dezvăluie consecința
-- ============================================================
create or replace function choose_decision(p_session_id uuid, p_choice_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_choice  record;
  v_next    record;
begin
  select * into v_session from decision_sessions
  where id = p_session_id and user_id = auth.uid();
  if v_session.id is null then
    raise exception 'Session not found or not yours';
  end if;
  if v_session.status <> 'in_progress' then
    raise exception 'Session already completed';
  end if;

  select * into v_choice from decision_choices
  where id = p_choice_id and node_id = v_session.current_node_id;
  if v_choice.id is null then
    raise exception 'Choice does not belong to current node';
  end if;

  select * into v_next from decision_nodes where id = v_choice.next_node_id;

  update decision_sessions
  set total_score = total_score + v_choice.score,
      current_node_id = v_choice.next_node_id,
      history = history || jsonb_build_array(jsonb_build_object(
        'choice_id', p_choice_id, 'score', v_choice.score, 'at', now()
      )),
      status = case when v_next.is_final then 'completed' else status end,
      completed_at = case when v_next.is_final then now() else null end
  where id = p_session_id;

  return jsonb_build_object(
    'feedback', v_choice.feedback,
    'score_delta', v_choice.score,
    'total_score', v_session.total_score + v_choice.score,
    'node_text', v_next.node_text,
    'is_final', v_next.is_final,
    'choices', case when v_next.is_final then '[]'::jsonb else (
      select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'choice_text', c.choice_text)), '[]'::jsonb)
      from decision_choices c
      where c.node_id = v_next.id
    ) end
  );
end;
$$;

grant execute on function choose_decision(uuid, uuid) to anon, authenticated;
