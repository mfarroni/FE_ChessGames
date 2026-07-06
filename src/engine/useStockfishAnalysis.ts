/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 06/07/2026 10:20:54 (Ora di Roma)
 * Problema Risolto: Introduzione dell'hook React che orchestra l'analisi
 * post-partita con Stockfish.js: crea il Worker SOLO su richiesta esplicita
 * (mai al mount), lo termina in cancel() e nel cleanup dell'effect per
 * evitare Worker orfani quando l'utente lascia la pagina.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createEngine,
  initEngine,
  analyzePosition,
  terminateEngine,
  StockfishEngine,
  FenAnalysisResult,
} from './stockfishClient';

export type StockfishAnalysisStatus = 'idle' | 'loading-engine' | 'analyzing' | 'done' | 'error';

export interface UseStockfishAnalysisResult {
  status: StockfishAnalysisStatus;
  /** Percentuale 0-100 di avanzamento sull'intera cronologia di posizioni. */
  progress: number;
  results: FenAnalysisResult[] | null;
  error?: string;
  /** Crea il Worker e avvia la pipeline completa. Va chiamata solo da un click esplicito dell'utente. */
  start: () => void;
  /** Interrompe l'analisi in corso e termina il Worker. */
  cancel: () => void;
}

/**
 * Analizza una cronologia di posizioni FEN con Stockfish.js, interamente nel
 * browser. Il Worker NON viene mai creato automaticamente: solo `start()`
 * lo istanzia. `depth` è la profondità di ricerca UCI (`go depth N`) usata
 * per ogni posizione della cronologia.
 */
export function useStockfishAnalysis(
  fenHistory: string[],
  depth = 14
): UseStockfishAnalysisResult {
  const [status, setStatus] = useState<StockfishAnalysisStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<FenAnalysisResult[] | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  const engineRef = useRef<StockfishEngine | null>(null);
  // Flag sincrono (non di stato React) per interrompere immediatamente il
  // loop di analisi asincrono in corso quando l'utente annulla o smonta la pagina.
  const cancelledRef = useRef(false);

  const cleanupEngine = useCallback(() => {
    if (engineRef.current) {
      terminateEngine(engineRef.current);
      engineRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    cleanupEngine();
    setStatus('idle');
    setProgress(0);
  }, [cleanupEngine]);

  useEffect(() => {
    // Cleanup di sicurezza: se l'utente naviga via da questa pagina mentre
    // l'analisi è ancora in corso, il Worker va terminato per non restare
    // orfano in background.
    return () => {
      cancelledRef.current = true;
      cleanupEngine();
    };
  }, [cleanupEngine]);

  const start = useCallback(() => {
    if (status === 'loading-engine' || status === 'analyzing') return;

    cancelledRef.current = false;
    setError(undefined);
    setResults(null);
    setProgress(0);
    setStatus('loading-engine');

    void (async () => {
      let engine: StockfishEngine;
      try {
        engine = createEngine();
        engineRef.current = engine;
        await initEngine(engine);
      } catch (err) {
        if (cancelledRef.current) return;
        setStatus('error');
        setError(
          err instanceof Error
            ? err.message
            : 'Impossibile inizializzare il motore Stockfish in questo browser.'
        );
        cleanupEngine();
        return;
      }

      if (cancelledRef.current) return;
      setStatus('analyzing');

      const collected: FenAnalysisResult[] = [];
      const total = fenHistory.length;

      try {
        for (let i = 0; i < total; i++) {
          if (cancelledRef.current) return;
          const fen = fenHistory[i];
          const analysis = await analyzePosition(engine, fen, depth);
          if (cancelledRef.current) return;
          collected.push({ fen, ...analysis });
          setProgress(Math.round(((i + 1) / total) * 100));
        }
      } catch (err) {
        if (cancelledRef.current) return;
        setStatus('error');
        setError(err instanceof Error ? err.message : "Errore durante l'analisi della partita.");
        cleanupEngine();
        return;
      }

      if (cancelledRef.current) return;
      setResults(collected);
      setProgress(100);
      setStatus('done');
      cleanupEngine();
    })();
  }, [status, fenHistory, depth, cleanupEngine]);

  return { status, progress, results, error, start, cancel };
}
