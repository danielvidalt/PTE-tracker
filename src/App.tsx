import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import MainApp from './MainApp';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <p className="text-subtext text-sm animate-pulse">Cargando...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <MainApp session={session} />;
}
