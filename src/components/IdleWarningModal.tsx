/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Introduzione sistema di 3 temi colore accessibili (Scuro Elegante, Chiaro Pergamena, Alto Contrasto) selezionabili da ogni pagina, scacchiera esclusa.
 */

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { WARNING_BEFORE_MS } from '../session/useInactivityLogout';

interface IdleWarningModalProps {
  onStayLoggedIn: () => void;
}

export default function IdleWarningModal({ onStayLoggedIn }: IdleWarningModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(Math.floor(WARNING_BEFORE_MS / 1000));

  // Purely cosmetic countdown; the actual logout is enforced by useInactivityLogout.
  useEffect(() => {
    setSecondsRemaining(Math.floor(WARNING_BEFORE_MS / 1000));
    const interval = setInterval(() => {
      setSecondsRemaining((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div
      id="idle-warning-modal"
      className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[60] p-6 duration-300"
    >
      <div className="bg-app-panel border-2 border-app-accent/40 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.1)_0%,transparent_70%)] pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-app-accent/15 border border-app-accent/30 flex items-center justify-center mx-auto mb-4 text-app-accent">
          <AlertTriangle className="w-9 h-9 animate-pulse" />
        </div>

        <h2 className="font-serif text-2xl font-black text-app-text mb-2">
          Sei ancora lì?
        </h2>

        <p className="text-sm text-app-text mb-1">
          Non rileviamo attività da un po'. La partita in corso verrà interrotta e la sessione verrà chiusa automaticamente tra:
        </p>

        <p className="font-mono text-3xl font-bold text-app-accent my-4">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>

        <button
          id="idle-warning-stay-btn"
          onClick={onStayLoggedIn}
          className="px-6 py-3 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-xs uppercase tracking-wider border border-app-accent shadow-lg cursor-pointer transform transition active:scale-95 outline-none w-full"
        >
          Sì, sono qui
        </button>
      </div>
    </div>
  );
}
