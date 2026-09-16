-- ============================================================
-- Pregătire pentru feedback AI la cerere (Gemini, prin Edge Function)
-- Persistăm profilul + debrief-ul static direct pe sesiune, ca
-- edge function-ul să le poată citi fără să recalculeze nimic.
-- ============================================================

alter table decision_sessions add column if not exists profile text;
alter table decision_sessions add column if not exists debrief text;

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
  v_new_history jsonb;
  v_final_score int;
  v_profile_key text;
  v_profile_label text;
  v_profile_desc text;
  v_debrief text;
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

  v_new_history := v_session.history || jsonb_build_array(jsonb_build_object(
    'choice_id', p_choice_id, 'score', v_choice.score, 'trait', v_choice.trait, 'at', now()
  ));
  v_final_score := v_session.total_score + v_choice.score;

  if v_next.is_final then
    select elem->>'trait' into v_profile_key
    from jsonb_array_elements(v_new_history) as elem
    where elem->>'trait' is not null
    group by elem->>'trait'
    order by count(*) desc
    limit 1;

    v_profile_label := case v_profile_key
      when 'exploration' then 'Exploratorul'
      when 'execution' then 'Executorul'
      when 'analysis' then 'Analistul'
      when 'diplomacy' then 'Diplomatul'
      when 'investigation' then 'Investigatorul'
      else 'Echilibratul'
    end;

    v_profile_desc := case v_profile_key
      when 'exploration' then 'cauți informații suplimentare înainte de a acționa'
      when 'execution' then 'iei decizii rapid și orientat spre rezultat'
      when 'analysis' then 'verifici dovezile temeinic înainte de a acționa'
      when 'diplomacy' then 'cauți consens și validare din partea altora'
      when 'investigation' then 'pui întrebări și cauți cauzele reale ale situației'
      else 'îți echilibrezi abordarea în funcție de situație'
    end;

    v_debrief := 'Ai tendința să ' || v_profile_desc || '. ' || (
      case
        when v_final_score >= 8 then 'În acest scenariu, ai combinat consecvent prudența cu acțiunea potrivită la momentul potrivit.'
        when v_final_score >= 3 then 'În acest scenariu, alegerile tale au fost în general echilibrate, cu câteva momente unde ai fi putut verifica mai mult înainte de a acționa.'
        when v_final_score >= 0 then 'În acest scenariu, câteva decizii au fost rapide, în detrimentul verificării informațiilor disponibile.'
        else 'În acest scenariu, ai prioritizat viteza sau presiunea externă, adesea în detrimentul verificării faptelor înainte de a acționa.'
      end
    );
  end if;

  update decision_sessions
  set total_score = v_final_score,
      current_node_id = v_choice.next_node_id,
      history = v_new_history,
      status = case when v_next.is_final then 'completed' else status end,
      completed_at = case when v_next.is_final then now() else null end,
      profile = case when v_next.is_final then v_profile_label else profile end,
      debrief = case when v_next.is_final then v_debrief else debrief end
  where id = p_session_id;

  return jsonb_build_object(
    'feedback', v_choice.feedback,
    'score_delta', v_choice.score,
    'total_score', v_final_score,
    'node_text', v_next.node_text,
    'is_final', v_next.is_final,
    'profile', v_profile_label,
    'debrief', v_debrief,
    'choices', case when v_next.is_final then '[]'::jsonb else (
      select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'choice_text', c.choice_text)), '[]'::jsonb)
      from decision_choices c
      where c.node_id = v_next.id
    ) end
  );
end;
$$;

grant execute on function choose_decision(uuid, uuid) to anon, authenticated;
