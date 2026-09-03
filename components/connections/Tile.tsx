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
        'flex aspect-[3/2] w-full select-none items-center justify-center rounded-md p-2 text-center',
        'font-body text-sm font-semibold uppercase tracking-tight sm:text-base',
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
