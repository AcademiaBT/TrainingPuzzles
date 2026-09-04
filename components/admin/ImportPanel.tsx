'use client';

import { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  parseWorkbook,
  validateRows,
  findCrossRowDuplicates,
} from '@/lib/importParser';
import { ImportRowValidated } from '@/types/connections';

const TIER_STYLES: Record<string, string> = {
  yellow: 'bg-tier-yellow text-tier-yellow-text',
  green: 'bg-tier-green text-tier-green-text',
  blue: 'bg-tier-blue text-tier-blue-text',
  purple: 'bg-tier-purple text-tier-purple-text',
};

export function ImportPanel({
  supabase,
  gameId,
  onImported,
}: {
  supabase: SupabaseClient;
  gameId: string;
  onImported: () => void;
}) {
  const [rows, setRows] = useState<ImportRowValidated[]>([]);
  const [crossWarnings, setCrossWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;

  async function handleFile(file: File) {
    setFileName(file.name);
    setResultMessage(null);
    setParseError(null);
    try {
      const raw = await parseWorkbook(file);
      const validated = validateRows(raw);
      setRows(validated);
      setCrossWarnings(findCrossRowDuplicates(validated));
    } catch (err) {
      console.error(err);
      setParseError(
        'Nu am putut citi fișierul. Verifică dacă e un .xlsx valid, cu antetul pe primul rând.'
      );
      setRows([]);
    }
  }

  async function confirmImport() {
    const toInsert = rows
      .filter((r) => r.valid)
      .map((r) => ({
        game_id: gameId,
        title: r.title,
        tier: r.tier,
        items: r.items,
        explanation: r.explanation,
      }));

    if (toInsert.length === 0) return;

    setImporting(true);
    setResultMessage(null);
    const { error } = await supabase.from('categories').insert(toInsert);
    setImporting(false);

    if (error) {
      setResultMessage(`Eroare la import: ${error.message}`);
      return;
    }

    setResultMessage(`Import reușit: ${toInsert.length} categorii adăugate.`);
    setRows([]);
    setFileName(null);
    onImported();
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-ink-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-headline text-lg text-paper">Import din Excel</h2>
        <a
          href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/templates/connections-import-template.xlsx`}
          download
          className="rounded-full border border-ink-border px-3 py-1.5 font-body text-xs text-paper transition-colors hover:border-paper/40"
        >
          Descarcă șablonul
        </a>
      </div>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="font-body text-sm text-paper/70 file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-body file:text-sm file:font-semibold file:text-ink"
      />

      {fileName && (
        <p className="font-body text-xs text-paper/50">Fișier: {fileName}</p>
      )}

      {parseError && (
        <p className="rounded-md border border-tier-purple/40 bg-tier-purple/10 p-2 font-body text-xs text-tier-purple">
          {parseError}
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap gap-4 font-body text-xs text-paper/70">
            <span>{validCount} rânduri valide</span>
            {invalidCount > 0 && (
              <span className="text-tier-purple">{invalidCount} cu erori (vor fi ignorate)</span>
            )}
          </div>

          {crossWarnings.length > 0 && (
            <div className="rounded-md border border-tier-blue/40 bg-tier-blue/10 p-2 font-body text-xs text-paper/80">
              <p className="mb-1 font-semibold">Atenție — iteme repetate în lot:</p>
              <ul className="list-inside list-disc">
                {crossWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto rounded-md border border-ink-border">
            <table className="w-full font-body text-xs text-paper">
              <thead className="sticky top-0 bg-ink-light">
                <tr>
                  <th className="px-2 py-1.5 text-left">#</th>
                  <th className="px-2 py-1.5 text-left">Tier</th>
                  <th className="px-2 py-1.5 text-left">Titlu</th>
                  <th className="px-2 py-1.5 text-left">Iteme</th>
                  <th className="px-2 py-1.5 text-left">Stare</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNumber} className="border-t border-ink-border">
                    <td className="px-2 py-1.5 text-paper/50">{row.rowNumber}</td>
                    <td className="px-2 py-1.5">
                      {row.tier && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TIER_STYLES[row.tier]}`}
                        >
                          {row.tier}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">{row.title}</td>
                    <td className="px-2 py-1.5">{row.items?.join(', ')}</td>
                    <td className="px-2 py-1.5">
                      {row.valid ? (
                        <span className="text-tier-green">✓ ok</span>
                      ) : (
                        <span className="text-tier-purple" title={row.errors.join('; ')}>
                          ✗ {row.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={confirmImport}
            disabled={validCount === 0 || importing}
            className="self-start rounded-full bg-accent px-5 py-2 font-body text-sm font-semibold text-ink transition-colors hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-40"
          >
            {importing ? 'Se importă…' : `Importă ${validCount} categorii valide`}
          </button>
        </>
      )}

      {resultMessage && (
        <p className="rounded-md border border-accent/40 bg-accent/10 p-2 font-body text-xs text-paper">
          {resultMessage}
        </p>
      )}
    </div>
  );
}
