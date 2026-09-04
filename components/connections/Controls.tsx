interface ControlsProps {
  selectedCount: number;
  submitting: boolean;
  onShuffle: () => void;
  onDeselect: () => void;
  onSubmit: () => void;
}

export function Controls({
  selectedCount,
  submitting,
  onShuffle,
  onDeselect,
  onSubmit,
}: ControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
      <button
        type="button"
        onClick={onShuffle}
        className="rounded-full border border-ink-border px-4 py-2 font-body text-sm text-paper transition-colors hover:border-paper/40"
      >
        Amestecă
      </button>
      <button
        type="button"
        onClick={onDeselect}
        disabled={selectedCount === 0}
        className="rounded-full border border-ink-border px-4 py-2 font-body text-sm text-paper transition-colors hover:border-paper/40 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Deselectează
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={selectedCount !== 4 || submitting}
        className="rounded-full bg-accent px-5 py-2 font-body text-sm font-semibold text-ink transition-colors hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Se trimite…' : 'Trimite'}
      </button>
    </div>
  );
}
