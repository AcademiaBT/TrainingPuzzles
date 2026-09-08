'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  ChooseDecisionResponse,
  CurrentNodeState,
  DecisionChoiceOption,
  DecisionPhase,
  ScenarioRow,
} from '@/types/decisionLab';

export function useDecisionLabGame() {
  const supabase = useRef(createClient()).current;

  const [phase, setPhase] = useState<DecisionPhase>('loading');
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [nodeText, setNodeText] = useState('');
  const [choices, setChoices] = useState<DecisionChoiceOption[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [lastScoreDelta, setLastScoreDelta] = useState(0);
  const [profile, setProfile] = useState<string | null>(null);
  const [debrief, setDebrief] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadScenarios = useCallback(async () => {
    setPhase('loading');
    setErrorMessage(null);
    try {
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      }

      const { data, error } = await supabase
        .from('decision_scenarios')
        .select('id, title, description')
        .eq('active', true);
      if (error) throw error;

      setScenarios((data as ScenarioRow[]) ?? []);
      setPhase('choosing_scenario');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message ?? 'Nu am putut încărca scenariile.');
      setPhase('error');
    }
  }, [supabase]);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const startScenario = useCallback(
    async (scenarioId: string) => {
      setPhase('loading');
      setErrorMessage(null);
      try {
        const { data: newSessionId, error } = await supabase.rpc(
          'start_decision_session',
          { p_scenario_id: scenarioId }
        );
        if (error) throw error;

        const { data: nodeState, error: nodeError } = await supabase.rpc(
          'get_current_node',
          { p_session_id: newSessionId }
        );
        if (nodeError) throw nodeError;

        const state = nodeState as CurrentNodeState;
        setSessionId(newSessionId as string);
        setNodeText(state.node_text);
        setChoices(state.choices);
        setTotalScore(state.total_score);
        setLastFeedback(null);
        setProfile(null);
        setDebrief(null);
        setPhase('playing');
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err?.message ?? 'Nu am putut porni scenariul.');
        setPhase('error');
      }
    },
    [supabase]
  );

  const chooseOption = useCallback(
    async (choiceId: string) => {
      if (!sessionId || submitting) return;
      setSubmitting(true);
      setErrorMessage(null);
      try {
        const { data, error } = await supabase.rpc('choose_decision', {
          p_session_id: sessionId,
          p_choice_id: choiceId,
        });
        if (error) throw error;

        const response = data as ChooseDecisionResponse;
        setLastFeedback(response.feedback);
        setLastScoreDelta(response.score_delta);
        setTotalScore(response.total_score);
        setNodeText(response.node_text);
        setChoices(response.choices);
        if (response.is_final) {
          setProfile(response.profile);
          setDebrief(response.debrief);
        }
        setPhase(response.is_final ? 'finished' : 'feedback');
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err?.message ?? 'A apărut o eroare la înregistrarea alegerii.');
      } finally {
        setSubmitting(false);
      }
    },
    [sessionId, submitting, supabase]
  );

  const continueAfterFeedback = useCallback(() => {
    setPhase('playing');
  }, []);

  const restart = useCallback(() => {
    setSessionId(null);
    loadScenarios();
  }, [loadScenarios]);

  return {
    phase,
    scenarios,
    nodeText,
    choices,
    totalScore,
    lastFeedback,
    lastScoreDelta,
    profile,
    debrief,
    submitting,
    errorMessage,
    startScenario,
    chooseOption,
    continueAfterFeedback,
    restart,
  };
}
