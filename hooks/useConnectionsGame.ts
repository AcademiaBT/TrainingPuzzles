'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  GamePhase,
  MAX_MISTAKES,
  PuzzlePublicRow,
  RevealedCategory,
  SolvedCategory,
  SubmitGuessResponse,
} from '@/types/connections';

interface GridItem {
  item: string;
}

// Fisher-Yates — folosit doar pentru amestecarea vizuală (butonul "Amestecă"),
// nu afectează logica de validare de pe server.
function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function useConnectionsGame() {
  const supabase = useRef(createClient()).current;

  const [phase, setPhase] = useState<GamePhase>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [items, setItems] = useState<GridItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState<SolvedCategory[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<'one_away' | 'wrong' | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [revealed, setRevealed] = useState<RevealedCategory[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startGame = useCallback(async () => {
    setPhase('loading');
    setErrorMessage(null);
    try {
      // Sesiune anonimă — nu cerem cont ca să poți juca instant.
      const { data: authData } = await supabase.auth.getSession();
      if (!authData.session) {
        const { error: authError } = await supabase.auth.signInAnonymously();
        if (authError) throw authError;
      }

      const { data: newSessionId, error: rpcError } = await supabase.rpc(
        'start_new_session',
        { p_game_slug: 'connections' }
      );
      if (rpcError) throw rpcError;

      const { data: sessionRow, error: sessionError } = await supabase
        .from('game_sessions')
        .select('puzzle_id')
        .eq('id', newSessionId)
        .single();
      if (sessionError) throw sessionError;

      const { data: puzzle, error: puzzleError } = await supabase
        .from('puzzle_public')
        .select('*')
        .eq('id', sessionRow.puzzle_id)
        .single<PuzzlePublicRow>();
      if (puzzleError) throw puzzleError;

      const sorted = [...puzzle.shuffled_items].sort(
        (a, b) => a.position - b.position
      );

      setSessionId(newSessionId as string);
      setItems(sorted.map((s) => ({ item: s.item })));
      setSelected([]);
      setSolved([]);
      setMistakes(0);
      setRevealed(null);
      setFeedback(null);
      setPhase('playing');
    } catch (err) {
      console.error(err);
      setErrorMessage('Nu am putut încărca puzzle-ul. Încearcă din nou.');
      setPhase('error');
    }
  }, [supabase]);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const toggleSelect = useCallback(
    (word: string) => {
      if (phase !== 'playing' || submitting) return;
      setSelected((prev) => {
        if (prev.includes(word)) return prev.filter((w) => w !== word);
        if (prev.length >= 4) return prev; // deja 4 selectate
        return [...prev, word];
      });
    },
    [phase, submitting]
  );

  const deselectAll = useCallback(() => setSelected([]), []);

  const shuffle = useCallback(() => {
    setItems((prev) => shuffleArray(prev));
  }, []);

  const submitGuess = useCallback(async () => {
    if (!sessionId || selected.length !== 4 || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.rpc('submit_guess', {
        p_session_id: sessionId,
        p_items: selected,
      });
      if (error) throw error;

      const response = data as SubmitGuessResponse;

      if (response.result === 'correct') {
        setSolved((prev) => [...prev, response.category]);
        setItems((prev) =>
          prev.filter((i) => !response.category.items.includes(i.item))
        );
        setSelected([]);
        if (response.won) {
          setPhase('won');
        }
      } else if (response.result === 'one_away' || response.result === 'wrong') {
        setFeedback(response.result);
        setMistakes(response.mistakes);
        setShakeKey((k) => k + 1);
        setSelected((prev) => (response.result === 'wrong' ? [] : prev));
        if (response.lost) {
          setPhase('lost');
          const { data: revealData, error: revealError } = await supabase.rpc(
            'reveal_puzzle',
            { p_session_id: sessionId }
          );
          if (!revealError) setRevealed(revealData as RevealedCategory[]);
        }
        // ascunde mesajul de feedback după o pauză scurtă
        setTimeout(() => setFeedback(null), 1800);
      }
    } catch (err) {
      console.error(err);
      const detail = err instanceof Error ? err.message : String(err);
      setErrorMessage(`A apărut o eroare la trimiterea răspunsului: ${detail}`);
    } finally {
      setSubmitting(false);
    }
  }, [sessionId, selected, submitting, supabase]);

  return {
    phase,
    items,
    selected,
    solved,
    mistakes,
    maxMistakes: MAX_MISTAKES,
    feedback,
    shakeKey,
    revealed,
    submitting,
    errorMessage,
    toggleSelect,
    deselectAll,
    shuffle,
    submitGuess,
    restart: startGame,
  };
}
