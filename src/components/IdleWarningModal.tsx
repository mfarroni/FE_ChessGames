/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 03/07/2026 09:56:41 (Ora di Roma)
 * Problema Risolto: Introduzione del modale "Sei ancora lì?" mostrato quando la sessione sta per scadere per inattività durante una partita in corso.
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
      <div className="bg-gradient-to-b from-[#251711] to-[#0c0806] border-2 border-amber-600/40 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.1)_0%,transparent_70%)] pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-amber-950/25 border border-amber-500/25 flex items-center justify-center mx-auto mb-4 text-amber-400">
          <AlertTriangle className="w-9 h-9 animate-pulse" />
        </div>

        <h2 className="font-serif text-2xl font-black text-amber-100 mb-2">
          Sei ancora lì?
        </h2>

        <p className="text-sm text-stone-300 mb-1">
          Non rileviamo attività da un po'. La partita in corso verrà interrotta e la sessione verrà chiusa automaticamente tra:
        </p>

        <p className="font-mono text-3xl font-bold text-amber-400 my-4">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>

        <button
          id="idle-warning-stay-btn"
          onClick={onStayLoggedIn}
          className="px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-xl font-bold text-xs uppercase tracking-wider border border-amber-500/10 shadow-lg cursor-pointer transform transition active:scale-95 outline-none w-full"
        >
          Sì, sono qui
        </button>
      </div>
    </div>
  );
}
