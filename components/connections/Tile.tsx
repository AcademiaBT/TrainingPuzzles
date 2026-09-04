'use client';

interface TileProps {
  word: string;
  selected: boolean;
  disabled: boolean;
  shakeKey: number;
  onClick: () => void;
}

// CSS nu poate rupe automat un cuvânt fără spațiu/cratimă în două linii
// fără să "iasă" din cutie la fonturi mari — de-asta calculăm noi
// dimensiunea potrivită, după cel mai lung "token" nedespărțibil.
function getFontSizeClass(word: string) {
  const longestToken = word
    .split(/[\s-]+/)
    .reduce((max, token) => Math.max(max, token.length), 0);

  if (longestToken <= 7) return 'text-xs sm:text-sm';
  if (longestToken <= 10) return 'text-[11px] sm:text-xs';
  if (longestToken <= 13) return 'text-[10px] sm:text-[11px]';
  return 'text-[9px] sm:text-[10px]';
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
        'break-words hyphens-auto font-body font-semibold uppercase leading-tight tracking-tight',
        getFontSizeClass(word),
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
