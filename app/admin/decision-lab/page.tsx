'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAdminSession } from '@/hooks/useAdminSession';
import { LoginForm } from '@/components/admin/LoginForm';
import { DecisionImportPanel } from '@/components/admin/DecisionImportPanel';
import { DecisionScenarioTable } from '@/components/admin/DecisionScenarioTable';

interface ScenarioAdminRow {
  id: string;
  title: string;
  description: string | null;
  active: boolean;
  node_count: number;
}

export default function AdminDecisionLabPage() {
  const { phase, email, formError, busy, signIn, signOut, supabase } =
    useAdminSession();
  const [gameId, setGameId] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioAdminRow[]>([]);

  const loadScenarios = useCallback(
    async (id: string) => {
      const { data: scenarioRows } = await supabase
        .from('decision_scenarios')
        .select('id, title, description, active');

      if (!scenarioRows) return;

      const withCounts = await Promise.all(
        scenarioRows.map(async (s) => {
          const { count } = await supabase
            .from('decision_nodes')
            .select('id', { count: 'exact', head: true })
            .eq('scenario_id', s.id);
          return { ...s, node_count: count ?? 0 };
        })
      );
      setScenarios(withCounts);
    },
    [supabase]
  );

  useEffect(() => {
    if (phase !== 'admin') return;
    supabase
      .from('games')
      .select('id')
      .eq('slug', 'decision-lab')
      .single()
      .then(({ data }) => {
        if (data?.id) {
          setGameId(data.id);
          loadScenarios(data.id);
        }
      });
  }, [phase, supabase, loadScenarios]);

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('decision_scenarios').update({ active }).eq('id', id);
    if (gameId) loadScenarios(gameId);
  }

  async function deleteScenario(id: string) {
    await supabase.from('decision_scenarios').delete().eq('id', id);
    if (gameId) loadScenarios(gameId);
  }

  if (phase === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="font-body text-sm text-paper/50">Se încarcă…</p>
      </main>
    );
  }

  if (phase === 'signed_out') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <LoginForm formError={formError} busy={busy} onSignIn={signIn} />
      </main>
    );
  }

  if (phase === 'not_admin') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="font-body text-sm text-paper/70">
          Contul <strong>{email}</strong> nu are drepturi de admin.
        </p>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full border border-ink-border px-4 py-2 font-body text-sm text-paper"
        >
          Ieși din cont
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/" className="font-body text-xs text-paper/40">
            ← Toate jocurile
          </Link>
          <h1 className="font-headline text-3xl font-semibold text-paper">
            Decision Lab
          </h1>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full border border-ink-border px-3 py-1.5 font-body text-xs text-paper"
        >
          Ieși ({email})
        </button>
      </div>

      {gameId && (
        <>
          <DecisionImportPanel
            supabase={supabase}
            gameId={gameId}
            onImported={() => loadScenarios(gameId)}
          />
          <DecisionScenarioTable
            scenarios={scenarios}
            onToggleActive={toggleActive}
            onDelete={deleteScenario}
          />
        </>
      )}
    </main>
  );
}
