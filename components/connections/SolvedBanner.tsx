import { SolvedCategory } from '@/types/connections';

const TIER_STYLES: Record<SolvedCategory['tier'], string> = {
  yellow: 'bg-tier-yellow text-tier-yellow-text',
  green: 'bg-tier-green text-tier-green-text',
  blue: 'bg-tier-blue text-tier-blue-text',
  purple: 'bg-tier-purple text-tier-purple-text',
};

export function SolvedBanner({ category }: { category: SolvedCategory }) {
  return (
    <div
      className={[
        'col-span-4 flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-md p-3 text-center sm:min-h-[5rem]',
        'animate-settle',
        TIER_STYLES[category.tier],
      ].join(' ')}
    >
      <p className="font-headline text-sm font-semibold sm:text-base">
        {category.title}
      </p>
      <p className="font-body text-[11px] uppercase tracking-tight opacity-80 break-words sm:text-xs">
        {category.items.join(' · ')}
      </p>
    </div>
  );
}
