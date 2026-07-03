/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 03/07/2026 09:56:41 (Ora di Roma)
 * Problema Risolto: Estrazione della pagina di Login da App.tsx in una pagina instradata con URL proprio (/login). Aggiunto il banner "Sessione scaduta per inattività" mostrato quando si arriva da un redirect di timeout.
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../session/useSession';
import {
  Gamepad2,
  ChevronRight,
  ShieldCheck,
  Radio,
  ArrowLeft
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const idleRedirect = (location.state as { reason?: string } | null)?.reason === 'idle';

  const {
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    loginError,
    handleAuthLogin,
    connectionStatus
  } = useSession();

  return (
    <div className="w-full flex flex-col items-center justify-center animate-fade-in duration-500">
      <div
        id="login-panel"
        className="w-full max-w-md p-8 rounded-3xl glass-panel border border-[#2d2218] shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />

        {/* Back to landing link */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 flex items-center gap-1 text-[9px] font-mono text-stone-500 hover:text-stone-400 transition cursor-pointer outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Landing
        </button>

        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 bg-amber-900/25 border border-amber-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Gamepad2 className="w-7 h-7 text-amber-400 font-serif" />
          </div>
          <h2 className="font-serif text-2xl font-black text-amber-100 mb-1">
            Club degli Scacchi
          </h2>
          <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto">
            Accedi o crea un account per tracciare le tue statistiche e giocare partite classificate con salvataggio sicuro in Postgres.
          </p>
        </div>

        {idleRedirect && (
          <div
            id="idle-timeout-banner"
            className="bg-amber-950/25 border border-amber-700/40 rounded-xl p-3 text-amber-300 text-xs text-center font-medium mb-5"
          >
            Sessione scaduta per inattività. Accedi di nuovo per continuare.
          </div>
        )}

        {/* TAB SELECTOR (navigates to the sibling route) */}
        <div className="flex border-b border-amber-950/40 mb-6 select-none">
          <button
            type="button"
            className="flex-1 pb-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 text-center cursor-pointer border-amber-500 text-amber-300"
          >
            Accedi (Login)
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="flex-1 pb-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 text-center cursor-pointer border-transparent text-stone-500 hover:text-stone-400"
          >
            Nuova Iscrizione
          </button>
        </div>

        <form onSubmit={handleAuthLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="E.g. Bobby_Fischer"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
            />
          </div>

          {loginError && (
            <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 text-rose-400 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={connectionStatus !== 'connected'}
            className="w-full py-3.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-xl font-bold text-xs uppercase tracking-wider border border-amber-500/10 shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2"
          >
            Accedi al Tavolo <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-amber-950/40 text-center select-none">
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-5 h-5 text-amber-600 mb-1" />
            <span className="text-[10px] font-mono uppercase text-stone-500 font-bold">PostgreSQL Active</span>
          </div>
          <div className="flex flex-col items-center">
            <Radio className="w-5 h-5 text-amber-600 mb-1" />
            <span className="text-[10px] font-mono uppercase text-stone-500 font-bold">{connectionStatus === 'connected' ? 'Servizio Attivo' : 'Scollegato'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
