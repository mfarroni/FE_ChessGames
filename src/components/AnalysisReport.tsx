/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 06/07/2026 10:20:54 (Ora di Roma)
 * Problema Risolto: Introduzione del report di analisi post-partita:
 * riepilogo accuratezza per giocatore, grafico di valutazione, elenco mosse
 * classificate e pannello di dettaglio con ri-analisi on-demand a profondità
 * maggiore. L'intera analisi gira nel browser tramite Stockfish.js (WASM):
 * nessuna chiamata al backend. L'analisi NON parte mai automaticamente,
 * solo dietro click esplicito su "Analizza Partita".
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChessGame, ChessMove } from '../types';
import { buildFenHistory, parseFen } from '../utils/chessLogic';
import {
  buildMoveAnalysis,
  computeAccuracyByColor,
  getClassificationColorClasses,
  uciMoveToReadableNotation,
  uciScoreToComparable,
  MoveAnalysisEntry,
} from '../utils/moveClassification';
import { useStockfishAnalysis } from '../engine/useStockfishAnalysis';
import {
  createEngine,
  initEngine,
  analyzePosition,
  terminateEngine,
  StockfishEngine,
  PositionAnalysis,
} from '../engine/stockfishClient';
import EvaluationChart from './EvaluationChart';
import { Cpu, Loader2, TrendingUp, AlertTriangle, RotateCw, X } from 'lucide-react';

interface AnalysisReportProps {
  game: ChessGame;
}

interface MovePair {
  number: number;
  white: { move: ChessMove; index: number };
  black?: { move: ChessMove; index: number };
}

interface DeepReanalysisState {
  status: 'loading' | 'done' | 'error';
  result?: PositionAnalysis;
  error?: string;
}

const ANALYSIS_DEPTH = 14;
const DEEP_REANALYSIS_DEPTH = 20;

function formatEvalLabel(analysis: PositionAnalysis): string {
  if (analysis.scoreType === 'mate') {
    return `Matto in ${Math.abs(analysis.scoreValue)}`;
  }
  const pawns = (analysis.scoreValue / 100).toFixed(2);
  return analysis.scoreValue >= 0 ? `+${pawns}` : pawns;
}

export default function AnalysisReport({ game }: AnalysisReportProps) {
  const fenHistory = useMemo(() => buildFenHistory(game.moves), [game.moves]);
  const { status, progress, results, error, start, cancel } = useStockfishAnalysis(
    fenHistory,
    ANALYSIS_DEPTH
  );

  const [selectedMoveIndex, setSelectedMoveIndex] = useState<number | null>(null);
  const [deepReanalysis, setDeepReanalysis] = useState<Record<number, DeepReanalysisState>>({});
  const deepEngineRef = useRef<StockfishEngine | null>(null);

  useEffect(() => {
    // Termina anche l'eventuale motore usato per la ri-analisi puntuale
    // ("Rivedi con l'engine") se l'utente lascia la pagina.
    return () => {
      if (deepEngineRef.current) {
        terminateEngine(deepEngineRef.current);
        deepEngineRef.current = null;
      }
    };
  }, []);

  const moveAnalysis: MoveAnalysisEntry[] | null = useMemo(() => {
    if (!results) return null;
    return buildMoveAnalysis(game.moves, fenHistory, results);
  }, [results, fenHistory, game.moves]);

  const accuracy = useMemo(() => (moveAnalysis ? computeAccuracyByColor(moveAnalysis) : null), [
    moveAnalysis,
  ]);

  const evaluationsForChart = useMemo(() => {
    if (!results) return null;
    return fenHistory.map((fen, i) => {
      const r = results[i];
      if (!r) return 0;
      const comparable = uciScoreToComparable(r.scoreType, r.scoreValue);
      const turn = parseFen(fen).turn;
      // L'eval UCI è sempre dalla prospettiva di chi deve muovere: la
      // riportiamo alla prospettiva del Bianco per il grafico.
      return turn === 'w' ? comparable : -comparable;
    });
  }, [results, fenHistory]);

  const movePairs = useMemo(() => {
    const pairs: MovePair[] = [];
    game.moves.forEach((move, index) => {
      if (index % 2 === 0) {
        pairs.push({ number: Math.floor(index / 2) + 1, white: { move, index } });
      } else {
        pairs[pairs.length - 1].black = { move, index };
      }
    });
    return pairs;
  }, [game.moves]);

  const selectedEntry: MoveAnalysisEntry | null =
    moveAnalysis && selectedMoveIndex !== null
      ? moveAnalysis.find((e) => e.moveIndex === selectedMoveIndex) || null
      : null;

  const handleSelectMove = (index: number) => {
    setSelectedMoveIndex((prev) => (prev === index ? null : index));
  };

  const handleDeepReanalyze = async (moveIndex: number) => {
    const fenBefore = fenHistory[moveIndex];
    if (!fenBefore) return;

    setDeepReanalysis((prev) => ({ ...prev, [moveIndex]: { status: 'loading' } }));

    let engine: StockfishEngine | null = null;
    try {
      engine = createEngine();
      deepEngineRef.current = engine;
      await initEngine(engine);
      const result = await analyzePosition(engine, fenBefore, DEEP_REANALYSIS_DEPTH);
      setDeepReanalysis((prev) => ({ ...prev, [moveIndex]: { status: 'done', result } }));
    } catch (err) {
      setDeepReanalysis((prev) => ({
        ...prev,
        [moveIndex]: {
          status: 'error',
          error: err instanceof Error ? err.message : "Errore durante la ri-analisi con l'engine.",
        },
      }));
    } finally {
      if (engine) {
        terminateEngine(engine);
      }
      deepEngineRef.current = null;
    }
  };

  const isBusy = status === 'loading-engine' || status === 'analyzing';

  return (
    <div className="w-full space-y-6">
      {/* Header: riepilogo accuratezza */}
      <div className="bg-app-panel border border-app-border rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-xl font-bold text-app-text tracking-wide">
              Analisi Partita
            </h2>
            <p className="text-[11px] text-app-text-muted font-mono mt-0.5">
              Motore Stockfish.js (WASM) eseguito interamente nel tuo browser · profondità {ANALYSIS_DEPTH}
            </p>
          </div>

          {!isBusy && (
            <button
              id="start-game-analysis-btn"
              onClick={start}
              className="px-5 py-2.5 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-xs border border-app-accent shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              {status === 'done' ? 'Ri-Analizza Partita' : 'Analizza Partita'}
            </button>
          )}

          {isBusy && (
            <button
              id="cancel-game-analysis-btn"
              onClick={cancel}
              className="px-4 py-2 bg-app-panel hover:bg-app-panel/70 text-app-text text-xs font-bold border border-app-border rounded-xl transition-all duration-150 active:scale-95 outline-none cursor-pointer flex items-center gap-2"
            >
              <X className="w-3.5 h-3.5" />
              Annulla
            </button>
          )}
        </div>

        {/* Barra di progresso durante caricamento motore / analisi mossa per mossa */}
        {isBusy && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-[11px] text-app-text-muted font-mono mb-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-app-accent" />
              {status === 'loading-engine'
                ? 'Caricamento del motore Stockfish...'
                : `Analisi mossa per mossa in corso... ${progress}%`}
            </div>
            <div className="w-full h-2.5 rounded-full bg-app-bg border border-app-border overflow-hidden">
              <div
                className="h-full bg-app-accent transition-all duration-200 ease-out rounded-full"
                style={{ width: `${status === 'loading-engine' ? 8 : Math.max(4, progress)}%` }}
              />
            </div>
          </div>
        )}

        {status === 'error' && error && (
          <div className="mb-4 bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Riepilogo accuratezza per giocatore */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-app-bg/60 border border-app-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-app-text-muted font-mono uppercase tracking-wider">Bianco</p>
              <p className="text-sm font-bold text-app-text font-serif italic">{game.whitePlayer.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-app-accent">
                {accuracy ? accuracy.white.toFixed(1) : '--'}
              </p>
              <p className="text-[10px] text-app-text-muted font-mono">Accuratezza %</p>
            </div>
          </div>

          <div className="bg-app-bg/60 border border-app-border rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-app-text-muted font-mono uppercase tracking-wider">Nero</p>
              <p className="text-sm font-bold text-app-text font-serif italic">{game.blackPlayer.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-app-accent">
                {accuracy ? accuracy.black.toFixed(1) : '--'}
              </p>
              <p className="text-[10px] text-app-text-muted font-mono">Accuratezza %</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grafico andamento valutazione */}
      {evaluationsForChart && (
        <div>
          <h3 className="font-serif text-sm font-bold text-app-text mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-app-accent" />
            Andamento della valutazione
          </h3>
          <EvaluationChart evaluations={evaluationsForChart} />
        </div>
      )}

      {/* Elenco mosse con classificazione + dettaglio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-app-panel border border-app-border rounded-2xl p-4 shadow-lg">
          <h3 className="font-serif text-sm font-bold text-app-text mb-3 border-b border-app-border pb-2">
            Cronologia Mosse
          </h3>

          {movePairs.length === 0 ? (
            <p className="text-app-text-muted italic text-center text-xs py-6">Nessuna mossa registrata.</p>
          ) : (
            <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
              {movePairs.map((pair) => (
                <div key={`pair-${pair.number}`} className="grid grid-cols-[2.5rem_1fr_1fr] gap-2 items-center">
                  <span className="text-app-text-muted font-mono text-xs">{pair.number}.</span>
                  <MoveCell
                    entry={moveAnalysis?.find((e) => e.moveIndex === pair.white.index) || null}
                    move={pair.white.move}
                    isSelected={selectedMoveIndex === pair.white.index}
                    onSelect={() => handleSelectMove(pair.white.index)}
                  />
                  {pair.black ? (
                    <MoveCell
                      entry={moveAnalysis?.find((e) => e.moveIndex === pair.black!.index) || null}
                      move={pair.black.move}
                      isSelected={selectedMoveIndex === pair.black.index}
                      onSelect={() => handleSelectMove(pair.black!.index)}
                    />
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pannello di dettaglio mossa selezionata */}
        <div className="lg:col-span-5 bg-app-panel border border-app-border rounded-2xl p-4 shadow-lg">
          <h3 className="font-serif text-sm font-bold text-app-text mb-3 border-b border-app-border pb-2">
            Dettaglio Mossa
          </h3>

          {!selectedEntry && (
            <p className="text-app-text-muted italic text-xs py-6 text-center">
              {moveAnalysis
                ? 'Seleziona una mossa dalla cronologia per vedere i dettagli.'
                : 'Avvia "Analizza Partita" e poi seleziona una mossa per vedere i dettagli.'}
            </p>
          )}

          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-app-text">
                  {selectedEntry.move.notation}
                </span>
                <ClassificationBadge entry={selectedEntry} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-app-bg/60 border border-app-border rounded-lg p-2.5">
                  <p className="text-app-text-muted font-mono uppercase text-[10px]">Centipawn Loss</p>
                  <p className="text-app-text font-bold text-sm">{Math.round(selectedEntry.cpl)}</p>
                </div>
                <div className="bg-app-bg/60 border border-app-border rounded-lg p-2.5">
                  <p className="text-app-text-muted font-mono uppercase text-[10px]">Mossa migliore alternativa</p>
                  <p className="text-app-text font-bold text-sm">
                    {uciMoveToReadableNotation(selectedEntry.fenBefore, selectedEntry.bestMoveUci)}
                  </p>
                </div>
              </div>

              <button
                id="deep-reanalyze-move-btn"
                onClick={() => handleDeepReanalyze(selectedEntry.moveIndex)}
                disabled={deepReanalysis[selectedEntry.moveIndex]?.status === 'loading'}
                className="w-full py-2.5 bg-app-panel hover:bg-app-panel/70 text-app-text text-xs font-bold border border-app-border rounded-xl transition-all duration-150 active:scale-95 outline-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deepReanalysis[selectedEntry.moveIndex]?.status === 'loading' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCw className="w-3.5 h-3.5" />
                )}
                Rivedi con l'engine (profondità {DEEP_REANALYSIS_DEPTH})
              </button>

              {deepReanalysis[selectedEntry.moveIndex]?.status === 'done' &&
                deepReanalysis[selectedEntry.moveIndex]?.result && (
                  <div className="bg-app-success-bg border border-app-success-text/30 rounded-xl p-3 text-xs text-app-success-text">
                    <p>
                      Valutazione a profondità {DEEP_REANALYSIS_DEPTH}:{' '}
                      <strong>{formatEvalLabel(deepReanalysis[selectedEntry.moveIndex]!.result!)}</strong>
                    </p>
                    <p className="mt-1">
                      Mossa migliore confermata:{' '}
                      <strong>
                        {uciMoveToReadableNotation(
                          selectedEntry.fenBefore,
                          deepReanalysis[selectedEntry.moveIndex]!.result!.bestMoveUci
                        )}
                      </strong>
                    </p>
                  </div>
                )}

              {deepReanalysis[selectedEntry.moveIndex]?.status === 'error' && (
                <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-xs text-app-danger-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {deepReanalysis[selectedEntry.moveIndex]?.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClassificationBadge({ entry }: { entry: MoveAnalysisEntry }) {
  const classes = getClassificationColorClasses(entry.classification.label);
  return (
    <span
      className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${classes.bg} ${classes.text}`}
    >
      {entry.classification.displayLabel}
    </span>
  );
}

function MoveCell({
  entry,
  move,
  isSelected,
  onSelect,
}: {
  entry: MoveAnalysisEntry | null;
  move: ChessMove;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const classes = entry ? getClassificationColorClasses(entry.classification.label) : null;
  const isHighlighted = entry && (entry.classification.label === 'errore' || entry.classification.label === 'blunder');

  return (
    <button
      onClick={onSelect}
      className={`text-left px-2 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer flex items-center justify-between gap-1.5 border ${
        isSelected
          ? 'border-app-accent bg-app-accent/10'
          : isHighlighted
          ? `border-transparent ${classes?.bg} ${classes?.text}`
          : 'border-transparent hover:bg-app-bg/60 text-app-text'
      }`}
    >
      <span className="truncate">{move.notation}</span>
      {entry && (
        <span
          className={`text-[9px] uppercase tracking-wider font-bold shrink-0 ${
            isHighlighted ? '' : classes?.text
          }`}
        >
          {entry.classification.displayLabel[0]}
        </span>
      )}
    </button>
  );
}
