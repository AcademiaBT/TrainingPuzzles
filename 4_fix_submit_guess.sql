-- ============================================================
-- FIX: bug în submit_guess — folosea alias-ul de tabel 'c'
-- (valabil doar în interiorul SELECT-ului din FOR) în loc de
-- variabila 'v_cat' care ține rândul curent. Cauza erorii:
-- "missing FROM-clause entry for table c"
--
-- Rulează acest fișier DOAR dacă ai deja un proiect Supabase
-- configurat (nu rula 1_schema.sql din nou peste el — ar da
-- erori "already exists"). Acest CREATE OR REPLACE înlocuiește
-- doar funcția, fără să atingă tabelele sau datele existente.
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
