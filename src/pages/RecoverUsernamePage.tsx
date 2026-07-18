/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 15/07/2026 (Ora di Roma)
 * Problema Risolto: Pagina pubblica di recupero username (/username-dimenticato).
 * Invia l'email a POST /api/auth/recover-username e mostra SEMPRE lo stesso
 * messaggio generico di conferma (coerente con l'anti-enumerazione del backend).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserSearch, ChevronRight, ArrowLeft, MailCheck, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';

const GENERIC_MESSAGE =
  "Se l'indirizzo è registrato, riceverai a breve un'email con lo username associato al tuo account.";

export default function RecoverUsernamePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [netError, setNetError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNetError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setNetError('Inserisci il tuo indirizzo email.');
      return;
    }
    setSubmitting(true);
    try {
      // Qualsiasi risposta del server porta al medesimo messaggio generico:
      // non riveliamo se l'email è registrata.
      await fetch(`${API_BASE_URL}/api/auth/recover-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      setDone(true);
    } catch (err) {
      // Solo un fallimento di rete (nessuna risposta) mostra un errore tecnico.
      setNetError('Errore di connessione al server. Riprova più tardi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center animate-fade-in duration-500">
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-app-border shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />

        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 flex items-center gap-1 text-[9px] font-mono text-app-text-muted hover:text-app-text transition cursor-pointer outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Landing
        </button>

        <div className="text-center mb-6 pt-2">
          <div className="w-14 h-14 bg-app-accent/15 border border-app-accent/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <UserSearch className="w-7 h-7 text-app-accent" />
          </div>
          <h2 className="font-serif text-2xl font-black text-app-text mb-1">
            Username dimenticato
          </h2>
          <p className="text-app-text-muted text-xs leading-relaxed max-w-xs mx-auto">
            Inserisci l'email del tuo account: ti invieremo lo username associato.
          </p>
        </div>

        {done ? (
          <div className="space-y-6">
            <div className="bg-app-success-bg border border-app-success-text/30 rounded-xl p-4 text-app-success-text text-xs text-center font-medium flex flex-col items-center gap-2">
              <MailCheck className="w-6 h-6 shrink-0" />
              <span className="leading-relaxed">{GENERIC_MESSAGE}</span>
            </div>
            <p className="text-app-text-muted text-[11px] leading-relaxed text-center font-mono">
              Controlla anche la cartella spam.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold">
                Indirizzo Email
              </label>
              <input
                type="email"
                required
                placeholder="E.g. giocatore@circolo.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent transition-all font-mono"
              />
            </div>

            {netError && (
              <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs text-center font-medium flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{netError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-xs uppercase tracking-wider border border-app-accent shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Invio in corso...' : <>Invia username via email <ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-app-border text-center select-none">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center gap-1.5 mx-auto text-[10px] font-mono uppercase text-app-text-muted hover:text-app-text transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Torna a Accedi
          </button>
        </div>
      </div>
    </div>
  );
}
