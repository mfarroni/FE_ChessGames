/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Aggiunta il checkbox di consenso all'informativa sulla privacy (link a /privacy), obbligatorio per abilitare l'invio del form di registrazione.
 */

import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '../session/useSession';
import {
  Gamepad2,
  ChevronRight,
  ShieldCheck,
  Radio,
  RefreshCw,
  Lock,
  ArrowLeft
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    regUsername,
    setRegUsername,
    regEmail,
    setRegEmail,
    regPassword,
    setRegPassword,
    regError,
    regSuccess,
    privacyAccepted,
    setPrivacyAccepted,
    captchaSvg,
    captchaAnswer,
    setCaptchaAnswer,
    loadCaptcha,
    handleAuthRegister,
    connectionStatus,
    verificationStep,
    setVerificationStep,
    verifyCode,
    setVerifyCode,
    unverifiedUserEmail,
    handleVerifyEmailCode,
    handleResendCode
  } = useSession();

  // Load a fresh CAPTCHA when the registration page is opened.
  useEffect(() => {
    loadCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (verificationStep) {
    return (
      <div className="w-full flex flex-col items-center justify-center animate-fade-in duration-500">
        <div
          id="verification-panel"
          className="w-full max-w-md p-8 rounded-3xl glass-panel border border-[#2d2218] shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-amber-950/40 border border-amber-600/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Lock className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="font-serif text-2xl font-black text-amber-100 mb-1">
              Verifica Email
            </h2>
            <p className="text-stone-400 text-xs leading-relaxed max-w-xs mx-auto">
              Inserisci il codice di sicurezza a 6 cifre che abbiamo spedito all'indirizzo:
            </p>
            <p className="text-amber-400 font-mono text-xs font-bold mt-1 max-w-xs mx-auto truncate">
              {unverifiedUserEmail}
            </p>
          </div>

          <form onSubmit={handleVerifyEmailCode} className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-2 font-bold text-center">
                Codice di Sicurezza (6 Cifre)
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="E.g. 584102"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-[#080504] border-2 border-amber-900/60 rounded-xl px-4 py-3.5 text-center text-lg tracking-[8px] text-amber-400 placeholder-stone-800 outline-none focus:border-amber-500 font-mono font-bold"
              />
            </div>

            {/* Sandbox Hint for easy testing! */}
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-3 text-stone-400 text-[11px] leading-relaxed">
              <strong className="text-amber-500 font-serif">Nota per il Collaudo:</strong> Dal momento che ti trovi in un ambiente di anteprima sandbox, se non hai configurato le variabili SMTP nel file `.env`, il codice è stato memorizzato in sicurezza e stampato nei <strong className="text-amber-400">Log di Sistema (Admin Panel / System Logs)</strong>. Copialo da lì per completare il test!
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-stone-950 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2"
            >
              Verifica e Attiva Account <ShieldCheck className="w-4 h-4 text-stone-950" />
            </button>
          </form>

          <div className="flex flex-col gap-3 mt-6 pt-5 border-t border-amber-950/40 text-center select-none">
            <button
              onClick={handleResendCode}
              className="text-[10px] font-mono uppercase text-amber-600 hover:text-amber-500 font-bold transition cursor-pointer"
            >
              Non hai ricevuto il codice? Invialo di nuovo
            </button>

            <button
              onClick={() => setVerificationStep(false)}
              className="flex items-center justify-center gap-1.5 text-[10px] font-mono uppercase text-stone-500 hover:text-stone-400 transition mt-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Torna a Accedi/Registrati
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center animate-fade-in duration-500">
      <div
        id="register-panel"
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

        {/* TAB SELECTOR (navigates to the sibling route) */}
        <div className="flex border-b border-amber-950/40 mb-6 select-none">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex-1 pb-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 text-center cursor-pointer border-transparent text-stone-500 hover:text-stone-400"
          >
            Accedi (Login)
          </button>
          <button
            type="button"
            className="flex-1 pb-3 text-xs font-mono uppercase tracking-wider font-bold transition-all border-b-2 text-center cursor-pointer border-amber-500 text-amber-300"
          >
            Nuova Iscrizione
          </button>
        </div>

        <form onSubmit={handleAuthRegister} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
              Scegli Username
            </label>
            <input
              type="text"
              required
              maxLength={18}
              placeholder="E.g. Bobby_Fischer"
              value={regUsername}
              onChange={(e) => setRegUsername(e.target.value)}
              className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
              Indirizzo Email
            </label>
            <input
              type="email"
              required
              placeholder="E.g. giocatore@circolo.it"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-1.5 font-bold">
              Crea Password
            </label>
            <input
              type="password"
              required
              placeholder="Scegli una password sicura..."
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
            />
          </div>

          {/* INTERACTIVE GRAPHICAL CAPTCHA SECURITY BLOCK */}
          <div className="bg-[#110c08] border border-amber-950/40 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-amber-700 font-bold">
                Controlli Antispam CAPTCHA
              </label>
              <button
                type="button"
                onClick={loadCaptcha}
                className="text-[10px] font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer outline-none"
                title="Genera nuovo captcha"
              >
                <RefreshCw className="w-3 h-3 text-amber-500 animate-spin-slow" /> Rigenera
              </button>
            </div>

            <div className="flex items-center gap-4 justify-center">
              {captchaSvg ? (
                <div
                  dangerouslySetInnerHTML={{ __html: captchaSvg }}
                  className="flex-shrink-0 select-none shadow-md"
                />
              ) : (
                <div className="w-40 h-14 bg-[#090504] border border-amber-950 rounded-xl flex items-center justify-center text-stone-600 text-[10px] font-mono animate-pulse">
                  Caricamento...
                </div>
              )}

              <div className="flex-1">
                <input
                  type="text"
                  required
                  maxLength={5}
                  placeholder="Inserisci i 5 caratteri..."
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value.toUpperCase())}
                  className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-3 py-2.5 text-center text-xs text-amber-400 font-mono font-bold tracking-widest outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {regError && (
            <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 text-rose-400 text-xs text-center font-medium">
              {regError}
            </div>
          )}

          {regSuccess && (
            <div className="bg-green-950/20 border border-green-800/30 rounded-xl p-3 text-green-400 text-xs text-center font-medium">
              {regSuccess}
            </div>
          )}

          <div className="flex items-start gap-2.5 px-1">
            <input
              type="checkbox"
              id="privacy-consent-checkbox"
              required
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-amber-600 bg-[#080504] border border-amber-900/40 rounded outline-none cursor-pointer flex-shrink-0"
            />
            <label htmlFor="privacy-consent-checkbox" className="text-[11px] text-stone-400 leading-relaxed font-mono">
              Accetto l'<Link
                to="/privacy"
                target="_blank"
                className="text-amber-500 hover:text-amber-400 underline"
              >informativa sul trattamento dei dati personali</Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={connectionStatus !== 'connected' || !privacyAccepted}
            className="w-full py-3.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-xl font-bold text-xs uppercase tracking-wider border border-amber-500/10 shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2"
          >
            Verifica e Spedisci Email <ChevronRight className="w-4 h-4" />
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
