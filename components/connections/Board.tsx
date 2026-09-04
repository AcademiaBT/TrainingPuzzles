'use client';

import { ReactNode } from 'react';
import { useConnectionsGame } from '@/hooks/useConnectionsGame';
import { TIER_ORDER } from '@/types/connections';
import { Tile } from './Tile';
import { SolvedBanner } from './SolvedBanner';
import { MistakeDots } from './MistakeDots';
import { Controls } from './Controls';
import { GameOverPanel } from './GameOverPanel';

export function Board() {
  const {
    phase,
    items,
    selected,
    solved,
    mistakes,
    maxMistakes,
    feedback,
    shakeKey,
    revealed,
    submitting,
    errorMessage,
    toggleSelect,
    deselectAll,
    shuffle,
    submitGuess,
    restart,
  } = useConnectionsGame();

  if (phase === 'loading') {
    return (
      <div className="flex min-h-[24rem] items-center justify-center">
        <p className="font-body text-sm text-paper/50">Se pregătește puzzle-ul…</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3">
        <p className="font-body text-sm text-paper/70">{errorMessage}</p>
        <button
          type="button"
          onClick={restart}
          className="rounded-full bg-accent px-5 py-2 font-body text-sm font-semibold text-ink"
        >
          Încearcă din nou
        </button>
      </div>
    );
  }

  const isOver = phase === 'won' || phase === 'lost';

  // Construim grid-ul din 4 "sloturi de rând" fixe, în ordinea dificultății
  // (yellow → green → blue → purple). Un slot deja rezolvat afișează
  // banner-ul, direct pe poziția lui finală — indiferent de ordinea în care
  // a fost găsit. Sloturile nerezolvate consumă, pe rând, câte 4 cuvinte
  // din lista curentă (respectă și amestecarea manuală).
  const solvedByTier = new Map(solved.map((c) => [c.tier, c]));
  const gridCells: ReactNode[] = [];
  let cursor = 0;
  for (const tier of TIER_ORDER) {
    const solvedCat = solvedByTier.get(tier);
    if (solvedCat) {
      gridCells.push(<SolvedBanner key={`solved-${tier}`} category={solvedCat} />);
    } else {
      const rowItems = items.slice(cursor, cursor + 4);
      cursor += 4;
      rowItems.forEach(({ item }) => {
        gridCells.push(
          <Tile
            key={item}
            word={item}
            selected={selected.includes(item)}
            disabled={isOver || submitting}
            shakeKey={feedback === 'wrong' || feedback === 'one_away' ? shakeKey : 0}
            onClick={() => toggleSelect(item)}
          />
        );
      });
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      {errorMessage && (
        <div className="rounded-md border border-tier-purple/40 bg-tier-purple/10 p-3 text-center font-body text-sm text-tier-purple">
          {errorMessage}
        </div>
      )}
      <div className="flex items-center justify-between">
        <p className="font-body text-sm text-paper/60">
          Selectează 4 iteme care au ceva în comun
        </p>
        <MistakeDots mistakes={mistakes} max={maxMistakes} />
      </div>

      <div
        role="status"
        aria-live="polite"
        className="h-5 text-center font-body text-sm font-medium text-tier-purple"
      >
        {feedback === 'one_away' && 'Aproape! Un item nu se potrivește.'}
        {feedback === 'wrong' && 'Grupare greșită.'}
      </div>

      <div className="grid grid-cols-4 gap-2">{gridCells}</div>

      {!isOver && (
        <Controls
          selectedCount={selected.length}
          submitting={submitting}
          onShuffle={shuffle}
          onDeselect={deselectAll}
          onSubmit={submitGuess}
        />
      )}

      {isOver && (
        <GameOverPanel
          won={phase === 'won'}
          revealed={revealed}
          onRestart={restart}
        />
      )}
    </div>
  );
}
