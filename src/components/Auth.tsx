import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        setSignupSuccess(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-[#E5E5E5] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold mb-1 block">
            PTE Tracker
          </span>
          <h1 className="text-3xl font-light tracking-tight font-serif text-white">
            PTE <span className="italic text-gold">Mastery</span> Dashboard
          </h1>
        </div>

        <div className="bg-card-dark p-6 rounded-sm border border-border-dark">
          <div className="flex bg-bg-dark border border-border-dark p-1 rounded-sm gap-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSignupSuccess(false); }}
              className={`flex-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${mode === 'login' ? 'bg-gold text-bg-dark shadow-md shadow-gold/5' : 'text-subtext hover:text-white'}`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setSignupSuccess(false); }}
              className={`flex-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer ${mode === 'signup' ? 'bg-gold text-bg-dark shadow-md shadow-gold/5' : 'text-subtext hover:text-white'}`}
            >
              Crear cuenta
            </button>
          </div>

          {signupSuccess ? (
            <div className="text-center py-4">
              <ShieldCheck className="mx-auto mb-3 text-gold" size={32} />
              <p className="text-sm font-semibold text-white">¡Cuenta creada!</p>
              <p className="text-xs text-subtext mt-2 leading-relaxed">
                Revisa tu correo <strong className="text-gold">{email}</strong> para confirmar tu cuenta antes de iniciar sesión.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={15} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold placeholder-[#444]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-subtext mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={15} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#090909] text-white border border-border-dark rounded-sm text-sm focus:outline-hidden focus:border-gold placeholder-[#444]"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded-sm px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-hover disabled:opacity-50 text-bg-dark py-2.5 px-4 rounded-sm text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-gold/5 cursor-pointer"
              >
                {loading ? 'Cargando...' : mode === 'signup' ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-subtext mt-6 font-light">
          Tus datos se guardan de forma privada y segura en tu cuenta.
        </p>
      </div>
    </div>
  );
}
