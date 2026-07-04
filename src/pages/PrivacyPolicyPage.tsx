/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Introduzione della pagina pubblica /privacy con il testo (bozza placeholder) dell'informativa sul trattamento dei dati personali, richiamata dal checkbox di consenso in Registrazione.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { PRIVACY_POLICY_VERSION } from '../constants/privacy';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col items-center justify-center animate-fade-in duration-500">
      <div className="w-full max-w-3xl space-y-6">

        {/* Draft placeholder warning banner */}
        <div className="w-full bg-amber-400 border border-amber-600 rounded-2xl p-4 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-6 h-6 text-stone-900 flex-shrink-0 mt-0.5" />
          <p className="text-stone-900 text-xs sm:text-sm font-bold leading-relaxed">
            BOZZA PLACEHOLDER — Questo testo NON è definitivo. È in attesa del testo ufficiale fornito dal titolare del trattamento. Non usare in produzione senza sostituirlo.
          </p>
        </div>

        <div
          id="privacy-policy-panel"
          className="w-full p-8 rounded-3xl glass-panel border border-[#2d2218] shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />

          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center gap-1 text-[9px] font-mono text-stone-500 hover:text-stone-400 transition cursor-pointer outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Indietro
          </button>

          <div className="text-center mb-6 pt-6">
            <div className="w-14 h-14 bg-amber-900/25 border border-amber-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-amber-400 font-serif" />
            </div>
            <h2 className="font-serif text-2xl font-black text-amber-100 mb-1">
              Informativa sul Trattamento dei Dati Personali
            </h2>
            <p className="text-stone-500 text-[11px] font-mono uppercase tracking-wider">
              Versione: {PRIVACY_POLICY_VERSION}
            </p>
          </div>

          <div className="space-y-4 text-stone-400 text-xs sm:text-sm leading-relaxed font-sans">
            <p>
              <strong className="text-amber-300">Bozza in redazione.</strong> Il presente testo è un segnaposto generico e non rappresenta ancora l'informativa ufficiale. Il <strong className="text-amber-300">titolare del trattamento</strong> dei dati personali raccolti da questa piattaforma è attualmente da definire e sarà indicato con i relativi dati di contatto non appena disponibile.
            </p>
            <p>
              <strong className="text-amber-300">Finalità del trattamento (bozza).</strong> I dati personali forniti in fase di registrazione (a titolo esemplificativo: username, indirizzo email, password) sono raccolti al solo fine di consentire la creazione e la gestione dell'account, l'autenticazione dell'utente e l'erogazione dei servizi di gioco offerti dalla piattaforma. Le finalità definitive, le basi giuridiche e i tempi di conservazione saranno specificati nel testo ufficiale.
            </p>
            <p>
              <strong className="text-amber-300">Diritti dell'interessato (bozza).</strong> Ai sensi degli articoli 15-22 del Regolamento (UE) 2016/679 (GDPR), l'interessato avrà diritto di accesso, rettifica, cancellazione, limitazione del trattamento, portabilità dei dati e opposizione, oltre al diritto di proporre reclamo all'autorità di controllo competente. Le modalità di esercizio di tali diritti saranno indicate nel testo definitivo dell'informativa.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-amber-950/40 text-center">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-xl font-bold text-xs uppercase tracking-wider border border-amber-500/10 shadow-lg cursor-pointer transform transition active:scale-95 outline-none inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Torna alla Registrazione
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
