'use client';

import { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  parseDecisionWorkbook,
  validateDecisionRows,
  groupByScenario,
} from '@/lib/decisionImportParser';
import { DecisionImportRowValidated } from '@/types/decisionLab';

export function DecisionImportPanel({
  supabase,
  gameId,
  onImported,
}: {
  supabase: SupabaseClient;
  gameId: string;
  onImported: () => void;
}) {
  const [rows, setRows] = useState<DecisionImportRowValidated[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;
  const scenarioGroups = groupByScenario(rows);

  async function handleFile(file: File) {
    setFileName(file.name);
    setResultMessage(null);
    setParseError(null);
    try {
      const raw = await parseDecisionWorkbook(file);
      setRows(validateDecisionRows(raw));
    } catch (err) {
      console.error(err);
      setParseError('Nu am putut citi fișierul. Verifică dacă e un .xlsx valid.');
      setRows([]);
    }
  }

  function cancel() {
    setRows([]);
    setFileName(null);
    setParseError(null);
  }

  async function confirmImport() {
    setImporting(true);
    setResultMessage(null);
    let scenariosCreated = 0;

    try {
      for (const [scenarioTitle, group] of scenarioGroups) {
        // validare: exact un nod root per scenariu
        const rootCodes = [...group.nodes.entries()].filter(([, n]) => n.isRoot);
        if (rootCodes.length !== 1) {
          throw new Error(
            `Scenariul "${scenarioTitle}" are ${rootCodes.length} noduri marcate is_root (trebuie exact 1).`
          );
        }

        // 1. scenariul
        const { data: scenarioRow, error: scenarioError } = await supabase
          .from('decision_scenarios')
          .insert({ game_id: gameId, title: scenarioTitle, description: group.description ?? null })
          .select('id')
          .single();
        if (scenarioError) throw scenarioError;
        const scenarioId = scenarioRow.id as string;

        // 2. nodurile — inserate individual ca să obținem id-ul real per cod
        const codeToId = new Map<string, string>();
        for (const [code, node] of group.nodes) {
          const { data: nodeRow, error: nodeError } = await supabase
            .from('decision_nodes')
            .insert({
              scenario_id: scenarioId,
              node_text: node.nodeText,
              is_root: node.isRoot,
              is_final: node.isFinal,
            })
            .select('id')
            .single();
          if (nodeError) throw nodeError;
          codeToId.set(code, nodeRow.id as string);
        }

        // 3. opțiunile, cu node_id/next_node_id rezolvate din mapare
        const choiceInserts = group.choiceRows.map((r) => ({
          node_id: codeToId.get(r.nodeCode!),
          choice_text: r.choiceText,
          next_node_id: codeToId.get(r.nextNodeCode!),
          score: r.score ?? 0,
          feedback: r.feedback ?? null,
        }));

        if (choiceInserts.some((c) => !c.node_id || !c.next_node_id)) {
          throw new Error(
            `Scenariul "${scenarioTitle}" are un next_node_code care nu corespunde niciunui node_code definit.`
          );
        }

        const { error: choiceError } = await supabase
          .from('decision_choices')
          .insert(choiceInserts);
        if (choiceError) throw choiceError;

        scenariosCreated++;
      }

      setResultMessage(`Import reușit: ${scenariosCreated} scenarii adăugate.`);
      setRows([]);
      setFileName(null);
      onImported();
    } catch (err: any) {
      console.error(err);
      setResultMessage(`Eroare la import: ${err?.message ?? String(err)}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-ink-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-headline text-lg text-paper">Import din Excel</h2>
        <a
          href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/templates/decision-lab-import-template.xlsx`}
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

      {fileName && <p className="font-body text-xs text-paper/50">Fișier: {fileName}</p>}

      {parseError && (
        <p className="rounded-md border border-tier-purple/40 bg-tier-purple/10 p-2 font-body text-xs text-tier-purple">
          {parseError}
        </p>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4 font-body text-xs text-paper/70">
              <span>{validCount} rânduri valide</span>
              {invalidCount > 0 && (
                <span className="text-tier-purple">{invalidCount} cu erori (vor fi ignorate)</span>
              )}
              <span>{scenarioGroups.size} scenarii detectate</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancel}
                className="rounded-full border border-ink-border px-5 py-2 font-body text-sm text-paper transition-colors hover:border-paper/40"
              >
                Renunță
              </button>
              <button
                type="button"
                onClick={confirmImport}
                disabled={validCount === 0 || importing}
                className="rounded-full bg-accent px-5 py-2 font-body text-sm font-semibold text-ink transition-colors hover:bg-accent-dim disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importing ? 'Se importă…' : `Importă ${scenarioGroups.size} scenarii`}
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-md border border-ink-border">
            <table className="w-full font-body text-xs text-paper">
              <thead className="sticky top-0 bg-ink-light">
                <tr>
                  <th className="px-2 py-1.5 text-left">#</th>
                  <th className="px-2 py-1.5 text-left">Scenariu</th>
                  <th className="px-2 py-1.5 text-left">Nod</th>
                  <th className="px-2 py-1.5 text-left">Opțiune</th>
                  <th className="px-2 py-1.5 text-left">→</th>
                  <th className="px-2 py-1.5 text-left">Stare</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rowNumber} className="border-t border-ink-border">
                    <td className="px-2 py-1.5 text-paper/50">{row.rowNumber}</td>
                    <td className="px-2 py-1.5">{row.scenario}</td>
                    <td className="px-2 py-1.5">
                      {row.nodeCode}
                      {row.isRoot && ' (root)'}
                      {row.isFinal && ' (final)'}
                    </td>
                    <td className="px-2 py-1.5">{row.choiceText}</td>
                    <td className="px-2 py-1.5 text-paper/50">{row.nextNodeCode}</td>
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
