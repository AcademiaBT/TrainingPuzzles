'use client';

interface TileProps {
  word: string;
  selected: boolean;
  disabled: boolean;
  shakeKey: number;
  onClick: () => void;
}

export function Tile({ word, selected, disabled, shakeKey, onClick }: TileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      key={shakeKey && selected ? `shake-${shakeKey}` : undefined}
      className={[
        'flex min-h-[4.75rem] w-full select-none items-center justify-center rounded-md px-2 py-2 text-center sm:min-h-[5.5rem]',
        'break-words hyphens-auto font-body text-xs font-semibold uppercase leading-tight tracking-tight sm:text-sm',
        'transition-all duration-150 ease-out',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected
          ? 'scale-[0.97] bg-accent text-ink shadow-inner'
          : 'bg-paper text-ink hover:bg-paper-dim',
        selected && shakeKey ? 'animate-shake' : '',
        disabled && !selected ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      ].join(' ')}
    >
      {word}
    </button>
  );
}
