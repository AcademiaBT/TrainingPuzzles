'use client';

import { useDecisionLabGame } from '@/hooks/useDecisionLabGame';
import { ScenarioList } from './ScenarioList';
import { DecisionCard } from './DecisionCard';
import { FeedbackPanel } from './FeedbackPanel';
import { ResultPanel } from './ResultPanel';

export function DecisionLabBoard() {
  const {
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
  } = useDecisionLabGame();

  if (phase === 'loading') {
    return (
      <div className="flex min-h-[16rem] items-center justify-center">
        <p className="font-body text-sm text-paper/50">Se încarcă…</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3">
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

  if (phase === 'choosing_scenario') {
    return <ScenarioList scenarios={scenarios} onSelect={startScenario} />;
  }

  if (phase === 'feedback') {
    return (
      <FeedbackPanel
        feedback={lastFeedback}
        scoreDelta={lastScoreDelta}
        totalScore={totalScore}
        onContinue={continueAfterFeedback}
      />
    );
  }

  if (phase === 'finished') {
    return (
      <ResultPanel
        profile={profile}
        debrief={debrief}
        totalScore={totalScore}
        onRestart={restart}
      />
    );
  }

  return (
    <>
      {errorMessage && (
        <p className="mx-auto mb-3 max-w-xl rounded-md border border-tier-purple/40 bg-tier-purple/10 p-2 text-center font-body text-xs text-tier-purple">
          {errorMessage}
        </p>
      )}
      <DecisionCard
        nodeText={nodeText}
        choices={choices}
        disabled={submitting}
        onChoose={chooseOption}
      />
    </>
  );
}
