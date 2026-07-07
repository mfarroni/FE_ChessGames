/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 07/07/2026 10:15:00 (Ora di Roma)
 * Problema Risolto: Componente riutilizzabile per l'invito alla donazione su
 * Buy Me a Coffee (link diretto, nessuno script esterno), stilizzato con il
 * design system esistente e quindi coerente con i 3 temi.
 */

import React from 'react';
import { Coffee } from 'lucide-react';

interface SupportButtonProps {
  /** Frase contestuale mostrata sopra il bottone. */
  message?: string;
}

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/granmasterchess';

export default function SupportButton({ message }: SupportButtonProps) {
  return (
    <div className="w-full flex flex-col items-center gap-3 my-10 text-center select-none">
      {message && (
        <p className="text-xs md:text-sm text-app-text-muted max-w-md leading-relaxed font-sans px-4">
          {message}
        </p>
      )}
      <a
        href={BUY_ME_A_COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 bg-app-accent hover:bg-app-accent-hover text-app-on-accent font-sans font-bold text-sm rounded-2xl border border-app-accent shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
      >
        <Coffee className="w-4 h-4 text-app-on-accent" />
        Buy Me a Coffee
      </a>
    </div>
  );
}
