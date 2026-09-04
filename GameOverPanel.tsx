import { RevealedCategory } from '@/types/connections';
import { SolvedBanner } from './SolvedBanner';

interface GameOverPanelProps {
  won: boolean;
  revealed: RevealedCategory[] | null;
  onRestart: () => void;
}

export function GameOverPanel({ won, revealed, onRestart }: GameOverPanelProps) {
  return (
    <div className="flex flex-col items-center gap-5 pt-2 text-center">
      <div>
        <h2 className="font-headline text-2xl text-paper">
          {won ? 'Rezolvat perfect!' : 'Puzzle-ul de azi te-a răpus'}
        </h2>
        <p className="mt-1 font-body text-sm text-paper/60">
          {won
            ? 'Ai găsit toate cele 4 categorii.'
            : 'Iată categoriile pe care nu le-ai găsit.'}
        </p>
      </div>

      {!won && revealed && (
        <div className="grid w-full max-w-md grid-cols-4 gap-2">
          {revealed
            .filter((c) => !c.solved)
            .map((c) => (
              <SolvedBanner key={c.title} category={c} />
            ))}
        </div>
      )}

      <button
        type="button"
        onClick={onRestart}
        className="rounded-full bg-accent px-6 py-2.5 font-body text-sm font-semibold text-ink transition-colors hover:bg-accent-dim"
      >
        Joacă un puzzle nou
      </button>
    </div>
  );
}
