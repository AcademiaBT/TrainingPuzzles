'use client';

import { useState } from 'react';

interface LoginFormProps {
  formError: string | null;
  busy: boolean;
  onSignIn: (email: string, password: string) => void;
  onSignUp: (email: string, password: string) => void;
}

export function LoginForm({ formError, busy, onSignIn, onSignUp }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <h1 className="text-center font-headline text-2xl font-semibold text-paper">
        Admin — Puzzle Training
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === 'signin') onSignIn(email, password);
          else onSignUp(email, password);
        }}
        className="flex flex-col gap-3"
      >
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-ink-border bg-ink-light px-3 py-2 font-body text-sm text-paper placeholder:text-paper/40 focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Parolă"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-ink-border bg-ink-light px-3 py-2 font-body text-sm text-paper placeholder:text-paper/40 focus:outline-none focus:ring-2 focus:ring-accent"
        />

        {formError && (
          <p className="rounded-md border border-tier-purple/40 bg-tier-purple/10 p-2 text-center font-body text-xs text-tier-purple">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-accent px-5 py-2 font-body text-sm font-semibold text-ink transition-colors hover:bg-accent-dim disabled:opacity-50"
        >
          {busy ? 'Se procesează…' : mode === 'signin' ? 'Intră' : 'Creează cont'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        className="text-center font-body text-xs text-paper/50 underline"
      >
        {mode === 'signin' ? 'Nu ai cont? Creează unul' : 'Ai deja cont? Intră'}
      </button>
    </div>
  );
}
