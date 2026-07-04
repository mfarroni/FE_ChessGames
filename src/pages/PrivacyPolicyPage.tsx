/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Introduzione sistema di 3 temi colore accessibili (Scuro Elegante, Chiaro Pergamena, Alto Contrasto) selezionabili da ogni pagina, scacchiera esclusa. Il banner "BOZZA PLACEHOLDER" resta a colori fissi giallo/nero per restare riconoscibile come avviso editoriale in tutti i temi.
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
          className="w-full p-8 rounded-3xl glass-panel border border-app-border shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative overflow-hidden transition-all duration-300"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />

          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 flex items-center gap-1 text-[9px] font-mono text-app-text-muted hover:text-app-text transition cursor-pointer outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Indietro
          </button>

          <div className="text-center mb-6 pt-6">
            <div className="w-14 h-14 bg-app-accent/15 border border-app-accent/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <ShieldCheck className="w-7 h-7 text-app-accent font-serif" />
            </div>
            <h2 className="font-serif text-2xl font-black text-app-text mb-1">
              Informativa sul Trattamento dei Dati Personali
            </h2>
            <p className="text-app-text-muted text-[11px] font-mono uppercase tracking-wider">
              Versione: {PRIVACY_POLICY_VERSION}
            </p>
          </div>

          <div className="space-y-4 text-app-text-muted text-xs sm:text-sm leading-relaxed font-sans">
            <p>
              <strong className="text-app-accent">Bozza in redazione.</strong> Il presente testo è un segnaposto generico e non rappresenta ancora l'informativa ufficiale. Il <strong className="text-app-accent">titolare del trattamento</strong> dei dati personali raccolti da questa piattaforma è attualmente da definire e sarà indicato con i relativi dati di contatto non appena disponibile.
            </p>
            <p>
              <strong className="text-app-accent">Finalità del trattamento (bozza).</strong> I dati personali forniti in fase di registrazione (a titolo esemplificativo: username, indirizzo email, password) sono raccolti al solo fine di consentire la creazione e la gestione dell'account, l'autenticazione dell'utente e l'erogazione dei servizi di gioco offerti dalla piattaforma. Le finalità definitive, le basi giuridiche e i tempi di conservazione saranno specificati nel testo ufficiale.
            </p>
            <p>
              <strong className="text-app-accent">Diritti dell'interessato (bozza).</strong> Ai sensi degli articoli 15-22 del Regolamento (UE) 2016/679 (GDPR), l'interessato avrà diritto di accesso, rettifica, cancellazione, limitazione del trattamento, portabilità dei dati e opposizione, oltre al diritto di proporre reclamo all'autorità di controllo competente. Le modalità di esercizio di tali diritti saranno indicate nel testo definitivo dell'informativa.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-app-border text-center">
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-xs uppercase tracking-wider border border-app-accent shadow-lg cursor-pointer transform transition active:scale-95 outline-none inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Torna alla Registrazione
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
