/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 15/07/2026 (Ora di Roma)
 * Problema Risolto: Pagina pubblica di reset password effettivo (/reset-password).
 * Legge il token dalla query string, richiede nuova password + conferma
 * (coincidenti, min 6 caratteri come il backend) e chiama POST
 * /api/auth/reset-password. Mostra successo con link al login, oppure un errore
 * chiaro (token scaduto/non valido/mancante) con link per richiederne uno nuovo.
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { LockKeyhole, ChevronRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../utils/apiConfig';

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pw = newPassword.trim();
    const confirm = confirmPassword.trim();
    if (pw.length < MIN_PASSWORD_LENGTH) {
      setError(`La nuova password deve contenere almeno ${MIN_PASSWORD_LENGTH} caratteri.`);
      return;
    }
    if (pw !== confirm) {
      setError('Le due password non coincidono.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: pw })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Link non valido o scaduto, richiedine uno nuovo.');
      }
    } catch (err) {
      setError('Errore di connessione al server. Riprova più tardi.');
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
            <LockKeyhole className="w-7 h-7 text-app-accent" />
          </div>
          <h2 className="font-serif text-2xl font-black text-app-text mb-1">
            Reimposta la password
          </h2>
          <p className="text-app-text-muted text-xs leading-relaxed max-w-xs mx-auto">
            Scegli una nuova password per il tuo account.
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-app-success-bg border border-app-success-text/30 rounded-xl p-4 text-app-success-text text-xs text-center font-medium flex flex-col items-center gap-2">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <span className="leading-relaxed">
                Password reimpostata con successo! Ora puoi accedere con la nuova password.
              </span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-xs uppercase tracking-wider border border-app-accent shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2"
            >
              Vai al Login <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : !token ? (
          <div className="space-y-6">
            <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-4 text-app-danger-text text-xs text-center font-medium flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <span className="leading-relaxed">
                Link non valido o incompleto. Richiedine uno nuovo per reimpostare la password.
              </span>
            </div>
            <Link
              to="/password-dimenticata"
              className="w-full py-3.5 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-xs uppercase tracking-wider border border-app-accent shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2"
            >
              Richiedi un nuovo link <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold">
                Nuova Password
              </label>
              <input
                type="password"
                required
                placeholder="Almeno 6 caratteri..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold">
                Conferma Password
              </label>
              <input
                type="password"
                required
                placeholder="Ripeti la nuova password..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent transition-all font-mono"
              />
            </div>

            {error && (
              <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs text-center font-medium flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <Link
                  to="/password-dimenticata"
                  className="text-[10px] font-mono uppercase text-app-accent hover:opacity-80 font-bold underline"
                >
                  Richiedi un nuovo link
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-xs uppercase tracking-wider border border-app-accent shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Reimpostazione...' : <>Reimposta password <ChevronRight className="w-4 h-4" /></>}
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
