/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 06/07/2026 17:04:27 (Ora di Roma)
 * Problema Risolto: Introduzione di una legenda a comparsa che spiega le 5
 * categorie di classificazione mossa (Ottima/Buona/Imprecisione/Errore/
 * Blunder) e le relative soglie di centipawn-loss, montata nel report di
 * analisi post-partita (AnalysisReport.tsx).
 */

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { getClassificationColorClasses, MoveClassificationLabel } from '../utils/moveClassification';

/**
 * ATTENZIONE: le soglie di centipawn-loss elencate qui sotto sono duplicate
 * MANUALMENTE da `classifyMove` in `src/utils/moveClassification.ts` (file
 * che non va modificato in questo lavoro). Se in futuro le soglie di
 * `classifyMove` cambiano, questo elenco va aggiornato a mano per restare
 * sincronizzato.
 */
const LEGEND_ITEMS: { label: MoveClassificationLabel; displayLabel: string; range: string }[] = [
  { label: 'ottima', displayLabel: 'Ottima', range: '0–10 cp' },
  { label: 'buona', displayLabel: 'Buona', range: '11–50 cp' },
  { label: 'imprecisione', displayLabel: 'Imprecisione', range: '51–100 cp' },
  { label: 'errore', displayLabel: 'Errore', range: '101–200 cp' },
  { label: 'blunder', displayLabel: 'Blunder', range: 'oltre 200 cp' },
];

export default function AnalysisLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div id="analysis-legend" className="text-xs">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="analysis-legend-content"
        className="flex items-center gap-1.5 text-app-text-muted hover:text-app-text transition-colors cursor-pointer outline-none"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Legenda classificazione mosse
      </button>

      {isOpen && (
        <div
          id="analysis-legend-content"
          className="mt-2 bg-app-bg/60 border border-app-border rounded-xl p-3 space-y-1.5 max-w-xs"
        >
          {LEGEND_ITEMS.map((item) => {
            const classes = getClassificationColorClasses(item.label);
            return (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full font-bold shrink-0 ${classes.bg} ${classes.text}`}
                >
                  {item.displayLabel}
                </span>
                <span className="text-app-text-muted">{item.range}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
