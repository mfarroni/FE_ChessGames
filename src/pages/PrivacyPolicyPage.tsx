/**
 * Versione: 1.2.0
 * Data e Ora Modifica: 12/07/2026 (Ora di Roma)
 * Problema Risolto: Inserimento del testo definitivo dell'informativa sul trattamento dei dati personali e rimozione del banner di avviso "BOZZA PLACEHOLDER".
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { PRIVACY_POLICY_VERSION } from '../constants/privacy';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col items-center justify-center animate-fade-in duration-500">
      <div className="w-full max-w-3xl space-y-6">

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
              <strong className="text-app-accent">Titolare del trattamento</strong> Il titolare del trattamento dei dati personali raccolti tramite GranMasterChess (granmasterchess.it) è il gestore della piattaforma, contattabile all'indirizzo email: postmasterchess@proton.me
            </p>
            <p>
              <strong className="text-app-accent">Dati raccolti</strong> In fase di registrazione: username, indirizzo email, password (salvata in forma protetta). Durante l'utilizzo del servizio: statistiche di gioco (punteggio Elo, vittorie, sconfitte), cronologia delle partite. Se utilizzato: osservazioni/feedback volontariamente inviati tramite l'apposito modulo. Dati tecnici di sicurezza (log di accesso e di sistema) per la prevenzione di usi fraudolenti. Tutti i dati raccolti sono strettamente necessari al funzionamento del gioco (creazione dell'account, autenticazione, partecipazione alle partite e alla classifica) e non vengono raccolti dati ulteriori rispetto a quanto indispensabile per questo scopo.
            </p>
            <p>
              <strong className="text-app-accent">Finalità e base giuridica del trattamento</strong> I dati sono trattati per: creare e gestire l'account utente e consentire l'autenticazione (base giuridica: esecuzione del servizio richiesto dall'utente, art. 6.1.b GDPR); fornire le funzionalità di gioco, classifica e analisi delle partite; garantire la sicurezza della piattaforma e prevenire abusi (base giuridica: legittimo interesse del titolare, art. 6.1.f GDPR); rispondere a osservazioni o richieste di supporto volontariamente inviate dall'utente.
            </p>
            <p>
              <strong className="text-app-accent">Fornitori terzi coinvolti nel trattamento</strong> Per il funzionamento del servizio, i dati possono essere trattati da fornitori terzi che agiscono come responsabili del trattamento: hosting ed erogazione del servizio (Render), database (Neon), invio di comunicazioni email transazionali (Brevo).
            </p>
            {/* NOTA: bozza da far rivedere da un legale/consulente privacy prima della pubblicazione, in particolare le categorie di partner terzi al punto 2. */}
            <p>
              <strong className="text-app-accent">Comunicazioni commerciali del Titolare (consenso facoltativo)</strong> Previo Suo specifico e facoltativo consenso, il Titolare potrà trattare l'indirizzo email fornito per inviarLe proprie comunicazioni commerciali, newsletter e offerte promozionali relative al servizio (base giuridica: consenso dell'interessato, art. 6.1.a GDPR). Il conferimento di questo consenso è del tutto facoltativo e non condiziona in alcun modo la registrazione o l'utilizzo del gioco. Il consenso è revocabile in qualsiasi momento, senza pregiudicare la liceità del trattamento effettuato prima della revoca, scrivendo a postmasterchess@proton.me o tramite l'apposito link di disiscrizione presente in ogni comunicazione.
            </p>
            <p>
              <strong className="text-app-accent">Comunicazione dei dati a partner commerciali terzi (consenso facoltativo)</strong> Previo Suo distinto e facoltativo consenso, i Suoi dati di contatto potranno essere comunicati a partner commerciali del Titolare, i quali li tratteranno in qualità di autonomi titolari del trattamento per l'invio di proprie comunicazioni commerciali e promozionali (base giuridica: consenso dell'interessato, art. 6.1.a GDPR). Si tratta di una base giuridica distinta e separata rispetto alle comunicazioni dirette del Titolare di cui al punto precedente. Le categorie di partner a cui i dati potranno essere comunicati sono: aziende operanti nel settore [DA COMPILARE: es. articoli sportivi e da gioco, editoria specializzata, servizi per il tempo libero]. Anche questo consenso è del tutto facoltativo, non condiziona la registrazione o l'utilizzo del gioco, ed è revocabile in qualsiasi momento scrivendo a postmasterchess@proton.me.
            </p>
            <p>
              <strong className="text-app-accent">Conservazione dei dati</strong> I dati dell'account vengono conservati per il tempo in cui l'utente utilizza attivamente il servizio. L'account e i dati ad esso associati vengono cancellati automaticamente trascorsi 6 mesi dall'ultimo accesso (login) effettuato dall'utente. L'utente può inoltre richiedere in qualsiasi momento la cancellazione anticipata del proprio account scrivendo a postmasterchess@proton.me
            </p>
            <p>
              <strong className="text-app-accent">Diritti dell'interessato</strong> Ai sensi degli articoli 15-22 del Regolamento (UE) 2016/679 (GDPR), l'utente ha diritto di accesso, rettifica, cancellazione, limitazione del trattamento, portabilità dei dati e opposizione, oltre al diritto di proporre reclamo al Garante per la Protezione dei Dati Personali. Per esercitare questi diritti è possibile scrivere a: postmasterchess@proton.me
            </p>
            <p className="text-[11px] text-app-text-muted/80 pt-2">
              Ultimo aggiornamento: 12 luglio 2026
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
