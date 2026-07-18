/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Introduzione sistema di 3 temi colore accessibili (Scuro Elegante, Chiaro Pergamena, Alto Contrasto) selezionabili da ogni pagina, scacchiera esclusa.
 */

import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
        className="w-full max-w-md p-8 rounded-3xl glass-panel border border-app-border shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />

        {/* Back to landing link */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 flex items-center gap-1 text-[9px] font-mono text-app-text-muted hover:text-app-text transition cursor-pointer outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Landing
        </button>

        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 bg-app-accent/15 border border-app-accent/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Gamepad2 className="w-7 h-7 text-app-accent font-serif" />
          </div>
          <h2 className="font-serif text-2xl font-black text-app-text mb-1">
            Club degli Scacchi
          </h2>
          <p className="text-app-text-muted text-xs leading-relaxed max-w-xs mx-auto">
            Accedi o crea un account per tracciare le tue statistiche e giocare partite classificate con salvataggio sicuro in Postgres.
          </p>
        </div>

        {idleRedirect && (
          <div
            id="idle-timeout-banner"
            className="bg-app-accent/15 border border-app-accent/40 rounded-xl p-3 text-app-accent text-xs text-center font-medium mb-5"
          >
            Sessione scaduta per inattività. Accedi di nuovo per continuare.
          </div>
        )}

        {/* TAB SELECTOR (navigates to the sibling route) */}
        <div className="flex border-b border-app-border mb-6 select-none">
          <button
            type="button"
            className="flex-1 pb-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 text-center cursor-pointer border-app-accent text-app-accent"
          >
            Accedi (Login)
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="flex-1 pb-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 text-center cursor-pointer border-transparent text-app-text-muted hover:text-app-text"
          >
            Nuova Iscrizione
          </button>
        </div>

        <form onSubmit={handleAuthLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="E.g. Bobby_Fischer"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent transition-all font-mono"
            />
          </div>

          {loginError && (
            <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={connectionStatus !== 'connected'}
            className="w-full py-3.5 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-xs uppercase tracking-wider border border-app-accent shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Accedi al Tavolo <ChevronRight className="w-4 h-4" />
          </button>

          {/* Link discreti di recupero credenziali */}
          <div className="flex items-center justify-center gap-3 pt-1 select-none">
            <Link
              to="/password-dimenticata"
              className="text-[10px] font-mono text-app-text-muted hover:text-app-text transition cursor-pointer"
            >
              Password dimenticata?
            </Link>
            <span className="text-app-border select-none" aria-hidden="true">•</span>
            <Link
              to="/username-dimenticato"
              className="text-[10px] font-mono text-app-text-muted hover:text-app-text transition cursor-pointer"
            >
              Username dimenticato?
            </Link>
          </div>
        </form>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-app-border text-center select-none">
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-5 h-5 text-app-accent mb-1" />
            <span className="text-[10px] font-mono uppercase text-app-text-muted font-bold">PostgreSQL Active</span>
          </div>
          <div className="flex flex-col items-center">
            <Radio className="w-5 h-5 text-app-accent mb-1" />
            <span className="text-[10px] font-mono uppercase text-app-text-muted font-bold">{connectionStatus === 'connected' ? 'Servizio Attivo' : 'Scollegato'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
