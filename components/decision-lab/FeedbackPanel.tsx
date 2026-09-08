export function FeedbackPanel({
  feedback,
  scoreDelta,
  totalScore,
  onContinue,
}: {
  feedback: string | null;
  scoreDelta: number;
  totalScore: number;
  onContinue: () => void;
}) {
  const sign = scoreDelta > 0 ? '+' : '';
  const scoreColor =
    scoreDelta > 0 ? 'text-tier-green' : scoreDelta < 0 ? 'text-tier-purple' : 'text-paper/60';

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="rounded-md border border-accent/40 bg-accent/10 p-5">
        <p className="font-body text-sm leading-relaxed text-paper">{feedback}</p>
        <p className={`mt-3 font-body text-xs font-semibold ${scoreColor}`}>
          {sign}
          {scoreDelta} puncte (total: {totalScore})
        </p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="self-center rounded-full bg-accent px-6 py-2.5 font-body text-sm font-semibold text-ink transition-colors hover:bg-accent-dim"
      >
        Continuă
      </button>
    </div>
  );
}
