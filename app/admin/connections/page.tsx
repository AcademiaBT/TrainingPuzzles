'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAdminSession } from '@/hooks/useAdminSession';
import { LoginForm } from '@/components/admin/LoginForm';
import { ImportPanel } from '@/components/admin/ImportPanel';
import { CategoryTable } from '@/components/admin/CategoryTable';
import { CategoryRow } from '@/types/connections';

export default function AdminConnectionsPage() {
  const { phase, email, formError, busy, signIn, signUp, signOut, supabase } =
    useAdminSession();
  const [gameId, setGameId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  const loadCategories = useCallback(
    async (id: string) => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('game_id', id)
        .order('tier');
      setCategories((data as CategoryRow[]) ?? []);
    },
    [supabase]
  );

  useEffect(() => {
    if (phase !== 'admin') return;
    supabase
      .from('games')
      .select('id')
      .eq('slug', 'connections')
      .single()
      .then(({ data }) => {
        if (data?.id) {
          setGameId(data.id);
          loadCategories(data.id);
        }
      });
  }, [phase, supabase, loadCategories]);

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('categories').update({ active }).eq('id', id);
    if (gameId) loadCategories(gameId);
  }

  async function deleteCategory(id: string) {
    await supabase.from('categories').delete().eq('id', id);
    if (gameId) loadCategories(gameId);
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
        <LoginForm
          formError={formError}
          busy={busy}
          onSignIn={signIn}
          onSignUp={signUp}
        />
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
            Connections
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
          <ImportPanel
            supabase={supabase}
            gameId={gameId}
            onImported={() => loadCategories(gameId)}
          />
          <CategoryTable
            categories={categories}
            onToggleActive={toggleActive}
            onDelete={deleteCategory}
          />
        </>
      )}
    </main>
  );
}
