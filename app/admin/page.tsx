'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAdminSession } from '@/hooks/useAdminSession';
import { LoginForm } from '@/components/admin/LoginForm';
import { GameRow } from '@/types/connections';

export default function AdminPage() {
  const { phase, email, formError, busy, signIn, signOut, supabase } =
    useAdminSession();
  const [games, setGames] = useState<GameRow[]>([]);

  useEffect(() => {
    if (phase !== 'admin') return;
    supabase
      .from('games')
      .select('*')
      .then(({ data }) => setGames((data as GameRow[]) ?? []));
  }, [phase, supabase]);

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
        />
      </main>
    );
  }

  if (phase === 'not_admin') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-body text-sm text-paper/70">
          Contul <strong>{email}</strong> e autentificat, dar nu are drepturi de
          admin.
        </p>
        <p className="max-w-sm font-body text-xs text-paper/50">
          Cere administratorului să-ți adauge user id-ul în tabelul{' '}
          <code>admins</code> din Supabase (vezi instrucțiunile din
          `supabase/5_admin_setup.sql`).
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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-semibold text-paper">
          Admin
        </h1>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full border border-ink-border px-3 py-1.5 font-body text-xs text-paper"
        >
          Ieși ({email})
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {games.map((game) => (
          <Link
            key={game.id}
            href={game.slug === 'connections' ? '/admin/connections/' : '#'}
            className="flex items-center justify-between rounded-md border border-ink-border p-4 transition-colors hover:border-accent"
          >
            <div>
              <p className="font-headline text-lg text-paper">
                {game.icon} {game.name}
              </p>
              <p className="font-body text-xs text-paper/50">
                {game.description}
              </p>
            </div>
            <span className="font-body text-xs text-paper/40">Gestionează →</span>
          </Link>
        ))}
        {games.length === 0 && (
          <p className="font-body text-sm text-paper/40">
            Niciun joc găsit în registry.
          </p>
        )}
      </div>
    </main>
  );
}
