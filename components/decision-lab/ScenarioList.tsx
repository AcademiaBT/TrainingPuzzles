import { ScenarioRow } from '@/types/decisionLab';

export function ScenarioList({
  scenarios,
  onSelect,
}: {
  scenarios: ScenarioRow[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <p className="text-center font-body text-sm text-paper/60">
        Alege un scenariu
      </p>
      {scenarios.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className="flex flex-col gap-1 rounded-md border border-ink-border bg-ink-light p-4 text-left transition-colors hover:border-accent"
        >
          <span className="font-headline text-lg text-paper">{s.title}</span>
          {s.description && (
            <span className="font-body text-sm text-paper/60">{s.description}</span>
          )}
        </button>
      ))}
      {scenarios.length === 0 && (
        <p className="text-center font-body text-sm text-paper/40">
          Niciun scenariu disponibil încă.
        </p>
      )}
    </div>
  );
}
