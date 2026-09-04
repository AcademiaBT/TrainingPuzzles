'use client';

import { CategoryRow, Tier, TIER_ORDER } from '@/types/connections';

const TIER_STYLES: Record<Tier, string> = {
  yellow: 'bg-tier-yellow text-tier-yellow-text',
  green: 'bg-tier-green text-tier-green-text',
  blue: 'bg-tier-blue text-tier-blue-text',
  purple: 'bg-tier-purple text-tier-purple-text',
};

export function CategoryTable({
  categories,
  onToggleActive,
  onDelete,
}: {
  categories: CategoryRow[];
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...categories].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
  );

  const counts = TIER_ORDER.map(
    (tier) => [tier, categories.filter((c) => c.tier === tier).length] as const
  );

  return (
    <div className="flex flex-col gap-3 rounded-md border border-ink-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-headline text-lg text-paper">
          Categorii existente ({categories.length})
        </h2>
        <div className="flex gap-2">
          {counts.map(([tier, count]) => (
            <span
              key={tier}
              className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${TIER_STYLES[tier]}`}
            >
              {tier}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto rounded-md border border-ink-border">
        <table className="w-full font-body text-xs text-paper">
          <thead className="sticky top-0 bg-ink-light">
            <tr>
              <th className="px-2 py-1.5 text-left">Tier</th>
              <th className="px-2 py-1.5 text-left">Titlu</th>
              <th className="px-2 py-1.5 text-left">Iteme</th>
              <th className="px-2 py-1.5 text-left">Folosită</th>
              <th className="px-2 py-1.5 text-left">Activă</th>
              <th className="px-2 py-1.5 text-left" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((cat) => (
              <tr key={cat.id} className="border-t border-ink-border">
                <td className="px-2 py-1.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TIER_STYLES[cat.tier]}`}
                  >
                    {cat.tier}
                  </span>
                </td>
                <td className="px-2 py-1.5">{cat.title}</td>
                <td className="px-2 py-1.5 text-paper/70">{cat.items.join(', ')}</td>
                <td className="px-2 py-1.5 text-paper/50">{cat.times_used}×</td>
                <td className="px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={cat.active}
                    onChange={(e) => onToggleActive(cat.id, e.target.checked)}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Ștergi definitiv categoria "${cat.title}"?`)) {
                        onDelete(cat.id);
                      }
                    }}
                    className="font-body text-[11px] text-tier-purple underline"
                  >
                    Șterge
                  </button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-2 py-4 text-center text-paper/40">
                  Nicio categorie încă — importă un fișier Excel mai sus.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
