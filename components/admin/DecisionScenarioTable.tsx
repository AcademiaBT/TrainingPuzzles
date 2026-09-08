'use client';

interface ScenarioAdminRow {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  node_count: number;
}

export function DecisionScenarioTable({
  scenarios,
  onToggleActive,
  onDelete,
}: {
  scenarios: ScenarioAdminRow[];
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-ink-border p-4">
      <h2 className="font-headline text-lg text-paper">
        Scenarii existente ({scenarios.length})
      </h2>

      <div className="max-h-96 overflow-y-auto rounded-md border border-ink-border">
        <table className="w-full font-body text-xs text-paper">
          <thead className="sticky top-0 bg-ink-light">
            <tr>
              <th className="px-2 py-1.5 text-left">Titlu</th>
              <th className="px-2 py-1.5 text-left">Descriere</th>
              <th className="px-2 py-1.5 text-left">Noduri</th>
              <th className="px-2 py-1.5 text-left">Activ</th>
              <th className="px-2 py-1.5 text-left" />
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <tr key={s.id} className="border-t border-ink-border">
                <td className="px-2 py-1.5">{s.title}</td>
                <td className="px-2 py-1.5 text-paper/70">{s.description}</td>
                <td className="px-2 py-1.5 text-paper/50">{s.node_count}</td>
                <td className="px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={s.active}
                    onChange={(e) => onToggleActive(s.id, e.target.checked)}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Ștergi definitiv scenariul "${s.title}" (inclusiv toate nodurile lui)?`)) {
                        onDelete(s.id);
                      }
                    }}
                    className="font-body text-[11px] text-tier-purple underline"
                  >
                    Șterge
                  </button>
                </td>
              </tr>
            ))}
            {scenarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-2 py-4 text-center text-paper/40">
                  Niciun scenariu încă — importă un fișier Excel mai sus.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
