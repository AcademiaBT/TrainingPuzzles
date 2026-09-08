export function ResultPanel({
  nodeText,
  totalScore,
  onRestart,
}: {
  nodeText: string;
  totalScore: number;
  onRestart: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 text-center">
      <h2 className="font-headline text-2xl font-semibold text-paper">
        Scenariu încheiat
      </h2>
      <div className="rounded-md border border-ink-border bg-ink-light p-5">
        <p className="font-body text-sm leading-relaxed text-paper">{nodeText}</p>
      </div>
      <p className="font-body text-sm text-paper/70">
        Scor final: <span className="font-semibold text-paper">{totalScore}</span>
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="rounded-full bg-accent px-6 py-2.5 font-body text-sm font-semibold text-ink transition-colors hover:bg-accent-dim"
      >
        Alege alt scenariu
      </button>
    </div>
  );
}
