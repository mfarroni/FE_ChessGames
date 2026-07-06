/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 06/07/2026 10:20:54 (Ora di Roma)
 * Problema Risolto: Introduzione del grafico SVG scritto a mano (nessuna
 * libreria di charting, coerente con il pattern SVG già usato in
 * ChessBoard.tsx) che mostra l'andamento della valutazione motore durante
 * la partita analizzata con Stockfish.js.
 */

import React from 'react';

export interface EvaluationChartProps {
  /**
   * Un valore per ogni posizione della cronologia (indice 0 = posizione
   * iniziale), dalla prospettiva del Bianco: positivo = vantaggio Bianco,
   * negativo = vantaggio Nero, in "cp equivalenti" (i punteggi di matto sono
   * già stati convertiti tramite uciScoreToComparable).
   */
  evaluations: number[];
}

const CHART_WIDTH = 640;
const CHART_HEIGHT = 160;
const PADDING_X = 8;
const PADDING_Y = 10;
// Oltre questa soglia (in "cp equivalenti") il grafico satura visivamente:
// evita che un matto lontano (valore enorme per costruzione, vedi
// moveClassification.ts) schiacci il resto della partita su una linea piatta.
const DISPLAY_CAP = 600;

export default function EvaluationChart({ evaluations }: EvaluationChartProps) {
  if (evaluations.length < 2) {
    return (
      <div className="bg-app-panel border border-app-border rounded-xl p-4 text-xs text-app-text-muted text-center">
        Dati insufficienti per il grafico di valutazione.
      </div>
    );
  }

  const n = evaluations.length;
  const innerWidth = CHART_WIDTH - PADDING_X * 2;
  const innerHeight = CHART_HEIGHT - PADDING_Y * 2;

  const xForIndex = (i: number) => PADDING_X + (innerWidth * i) / (n - 1);
  const yForValue = (value: number) => {
    const clamped = Math.max(-DISPLAY_CAP, Math.min(DISPLAY_CAP, value));
    const ratio = (clamped + DISPLAY_CAP) / (2 * DISPLAY_CAP); // 0 = Nero domina, 1 = Bianco domina
    return PADDING_Y + innerHeight * (1 - ratio);
  };

  const midY = yForValue(0);
  const linePoints = evaluations.map((v, i) => `${xForIndex(i)},${yForValue(v)}`).join(' ');

  return (
    <div className="bg-app-panel border border-app-border rounded-xl p-3">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
        role="img"
        aria-label="Andamento della valutazione del motore durante la partita"
      >
        {/* Sfondo del grafico con i token del tema attivo */}
        <rect x={0} y={0} width={CHART_WIDTH} height={CHART_HEIGHT} style={{ fill: 'var(--color-app-bg)' }} />

        {/* Metà superiore: banda del vantaggio Bianco (tinta chiara neutra, indipendente dal tema) */}
        <rect x={PADDING_X} y={PADDING_Y} width={innerWidth} height={Math.max(0, midY - PADDING_Y)} fill="#FFFFFF" fillOpacity={0.06} />
        {/* Metà inferiore: banda del vantaggio Nero (tinta scura neutra, indipendente dal tema) */}
        <rect
          x={PADDING_X}
          y={midY}
          width={innerWidth}
          height={Math.max(0, CHART_HEIGHT - PADDING_Y - midY)}
          fill="#000000"
          fillOpacity={0.12}
        />

        {/* Linea della valutazione motore, mossa per mossa */}
        <polyline
          points={linePoints}
          fill="none"
          style={{ stroke: 'var(--color-app-accent)' }}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Banda centrale di equilibrio */}
        <line
          x1={PADDING_X}
          y1={midY}
          x2={CHART_WIDTH - PADDING_X}
          y2={midY}
          style={{ stroke: 'var(--color-app-border)' }}
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* Assi */}
        <line
          x1={PADDING_X}
          y1={PADDING_Y}
          x2={PADDING_X}
          y2={CHART_HEIGHT - PADDING_Y}
          style={{ stroke: 'var(--color-app-border)' }}
          strokeWidth={1}
        />
        <line
          x1={PADDING_X}
          y1={CHART_HEIGHT - PADDING_Y}
          x2={CHART_WIDTH - PADDING_X}
          y2={CHART_HEIGHT - PADDING_Y}
          style={{ stroke: 'var(--color-app-border)' }}
          strokeWidth={1}
        />
      </svg>

      <div className="flex items-center justify-between text-[10px] text-app-text-muted font-mono mt-1.5 px-1">
        <span>Mossa 0</span>
        <span className="hidden sm:inline">Vantaggio Bianco ↑ · Vantaggio Nero ↓</span>
        <span>Mossa {n - 1}</span>
      </div>
    </div>
  );
}
