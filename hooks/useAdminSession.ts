'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type AdminAuthPhase = 'loading' | 'signed_out' | 'not_admin' | 'admin';

export function useAdminSession() {
  const supabase = useRef(createClient()).current;
  const [phase, setPhase] = useState<AdminAuthPhase>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const checkSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session || session.user.is_anonymous) {
      setPhase('signed_out');
      setEmail(null);
      return;
    }

    setEmail(session.user.email ?? null);

    const { data: isAdmin, error } = await supabase.rpc('is_admin');
    if (error || !isAdmin) {
      setPhase('not_admin');
      return;
    }
    setPhase('admin');
  }, [supabase]);

  useEffect(() => {
    checkSession();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });
    return () => sub.subscription.unsubscribe();
  }, [checkSession, supabase]);

  const signIn = useCallback(
    async (emailInput: string, password: string) => {
      setBusy(true);
      setFormError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password,
      });
      setBusy(false);
      if (error) setFormError(error.message);
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setPhase('signed_out');
  }, [supabase]);

  return { phase, email, formError, busy, signIn, signOut, supabase };
}
