import { DecisionChoiceOption } from '@/types/decisionLab';

const CHOICE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function DecisionCard({
  nodeText,
  choices,
  disabled,
  onChoose,
}: {
  nodeText: string;
  choices: DecisionChoiceOption[];
  disabled: boolean;
  onChoose: (choiceId: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="rounded-md border border-ink-border bg-ink-light p-5">
        <p className="font-headline text-lg leading-relaxed text-paper">{nodeText}</p>
      </div>

      <div className="flex flex-col gap-2">
        {choices.map((choice, i) => (
          <button
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => onChoose(choice.id)}
            className="flex items-start gap-3 rounded-md border border-ink-border bg-paper p-3 text-left text-ink transition-colors hover:bg-paper-dim disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent font-body text-xs font-bold text-ink">
              {CHOICE_LETTERS[i] ?? i + 1}
            </span>
            <span className="font-body text-sm">{choice.choice_text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
