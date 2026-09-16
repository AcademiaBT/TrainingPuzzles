'use client';

import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';

export function ResultPanel({
  profile,
  debrief,
  totalScore,
  sessionId,
  supabase,
  onRestart,
}: {
  profile: string | null;
  debrief: string | null;
  totalScore: number;
  sessionId: string | null;
  supabase: SupabaseClient;
  onRestart: () => void;
}) {
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function requestAiFeedback() {
    if (!sessionId) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-debrief', {
        body: { session_id: sessionId },
      });
      if (error) {
        let message = error.message;
        try {
          const body = await (error as any)?.context?.json?.();
          if (body?.error) message = body.error;
        } catch {
          // ignorăm — folosim mesajul default
        }
        throw new Error(message);
      }
      setAiFeedback(data.feedback);
    } catch (err: any) {
      // Logăm eroarea tehnică pentru debugging, dar afișăm learnerului
      // un mesaj profesionist, fără detalii tehnice (model, cotă, status HTTP).
      console.error('ai-debrief error:', err);
      setAiError(
        'Momentan nu putem genera un feedback personalizat cu AI pe abonamentul curent. Te rugăm să încerci din nou peste câteva minute.'
      );
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 text-center">
      <h2 className="font-headline text-2xl font-semibold text-paper">
        Scenariu încheiat
      </h2>

      {profile && (
        <div className="rounded-full bg-accent px-5 py-1.5 font-body text-sm font-semibold text-ink">
          Profilul tău: {profile}
        </div>
      )}

      {debrief && (
        <div className="rounded-md border border-ink-border bg-ink-light p-5">
          <p className="font-body text-sm leading-relaxed text-paper">{debrief}</p>
        </div>
      )}

      <p className="font-body text-sm text-paper/70">
        Scor final: <span className="font-semibold text-paper">{totalScore}</span>
      </p>

      <div className="flex w-full flex-col items-center gap-3 border-t border-ink-border pt-5">
        {!aiFeedback && (
          <button
            type="button"
            onClick={requestAiFeedback}
            disabled={aiLoading}
            className="flex items-center gap-2 rounded-full border border-accent px-5 py-2 font-body text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aiLoading && (
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent"
              />
            )}
            {aiLoading ? 'Se generează…' : '✨ Generează feedback AI personalizat'}
          </button>
        )}

        {aiError && (
          <p className="rounded-md border border-tier-purple/40 bg-tier-purple/10 p-2 font-body text-xs text-tier-purple">
            {aiError}
          </p>
        )}

        {aiFeedback && (
          <div className="w-full rounded-md border border-accent/40 bg-accent/10 p-5 text-left">
            <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-accent">
              Feedback AI
            </p>
            <p className="font-body text-sm leading-relaxed text-paper">{aiFeedback}</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="rounded-full bg-accent px-6 py-2.5 font-body text-sm font-semibold text-ink transition-colors hover:bg-accent-dim"
      >
        Alege alt scenariu
      </button>
    </div>
  );
}
