/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 06/07/2026 10:20:54 (Ora di Roma)
 * Problema Risolto: Introduzione della classificazione delle mosse (CPL,
 * categorie Ottima/Buona/Imprecisione/Errore/Blunder, accuratezza per
 * giocatore) usata dal report di analisi post-partita con Stockfish.js.
 */

import { ChessColor, ChessMove, ChessPiece, Square } from '../types';
import { executeMove } from './chessLogic';
import { FenAnalysisResult, PositionAnalysis, UciScoreType } from '../engine/stockfishClient';

export type MoveClassificationLabel = 'ottima' | 'buona' | 'imprecisione' | 'errore' | 'blunder';

export interface MoveClassification {
  label: MoveClassificationLabel;
  /** Etichetta pronta per la UI, in italiano. */
  displayLabel: string;
  cpl: number;
}

export interface MoveAnalysisEntry {
  /** Indice 0-based della mossa in ChessGame.moves. */
  moveIndex: number;
  move: ChessMove;
  color: ChessColor;
  fenBefore: string;
  fenAfter: string;
  /** Mossa migliore secondo il motore nella posizione PRIMA della mossa giocata (notazione UCI). */
  bestMoveUci: string;
  cpl: number;
  classification: MoveClassification;
  /** Eval della posizione prima della mossa, dalla prospettiva di chi muove. */
  evalBeforeComparable: number;
  /** Eval della posizione dopo la mossa, dalla prospettiva dell'avversario (turno invertito). */
  evalAfterComparable: number;
}

/**
 * Converte un punteggio UCI (`cp` o `mate`) in un valore numerico comparabile
 * per ordinamenti e grafici. Un `mate` deve sempre dominare qualunque
 * valutazione `cp` finita, mantenendo segno e "distanza dal matto" per poter
 * comunque ordinare più matti tra loro (un matto più vicino è più estremo).
 *
 * Esempi: mate in 3 (scoreValue = 3) -> 100000 - 3*100 = 99700
 *         mate in -2 (scoreValue = -2, si viene matti in 2) -> -100000 - (-2*100) = -99800
 */
export function uciScoreToComparable(scoreType: UciScoreType, scoreValue: number): number {
  if (scoreType === 'cp') return scoreValue;
  return scoreValue >= 0 ? 100000 - scoreValue * 100 : -100000 - scoreValue * 100;
}

/**
 * Calcola il centipawn-loss (CPL) della mossa realmente giocata: la
 * differenza tra l'eval della mossa migliore del motore nella posizione
 * PRIMA della mossa (dalla prospettiva di chi muove) e l'eval della mossa
 * REALMENTE giocata.
 *
 * `evalAfterMove` è l'analisi della posizione DOPO la mossa: essendo il
 * turno invertito, l'eval UCI è dalla prospettiva dell'AVVERSARIO, quindi va
 * negata per riportarla alla prospettiva del giocatore che ha mosso prima
 * di poterla confrontare con `evalBeforeMove`.
 */
export function computeCentipawnLoss(
  evalBeforeMove: PositionAnalysis,
  evalAfterMove: PositionAnalysis
): number {
  const comparableBefore = uciScoreToComparable(evalBeforeMove.scoreType, evalBeforeMove.scoreValue);
  const comparableAfterRaw = uciScoreToComparable(evalAfterMove.scoreType, evalAfterMove.scoreValue);
  const comparableAfterFromMoverPerspective = -comparableAfterRaw;

  const loss = comparableBefore - comparableAfterFromMoverPerspective;
  // Il CPL non può essere negativo: se la mossa giocata risulta persino
  // migliore della "best move" (possibile per rumore di ricerca tra
  // profondità/nodi diversi), lo consideriamo un CPL nullo.
  return Math.max(0, loss);
}

/** Soglie (in centipawn) delle 5 categorie di classificazione mossa. */
export function classifyMove(cpl: number): MoveClassification {
  const clamped = Math.max(0, cpl);

  if (clamped <= 10) return { label: 'ottima', displayLabel: 'Ottima', cpl: clamped };
  if (clamped <= 50) return { label: 'buona', displayLabel: 'Buona', cpl: clamped };
  if (clamped <= 100) return { label: 'imprecisione', displayLabel: 'Imprecisione', cpl: clamped };
  if (clamped <= 200) return { label: 'errore', displayLabel: 'Errore', cpl: clamped };
  return { label: 'blunder', displayLabel: 'Blunder', cpl: clamped };
}

/**
 * Trasformazione sigmoide del centipawn-loss in un punteggio 0-100 "per
 * mossa". È una STIMA APPROSSIMATA ispirata al principio del modello
 * pubblico di accuratezza di chess.com (basato sulla win% expectancy
 * derivata dall'eval), non una riproduzione esatta del loro algoritmo
 * proprietario.
 */
export function movePerformanceScore(cpl: number): number {
  const raw = 103.1668 * Math.exp(-0.04354 * Math.max(0, cpl)) - 3.1669;
  return Math.min(100, Math.max(0, raw));
}

/** Accuratezza di un giocatore: media dei punteggi 0-100 per mossa. */
export function computeAccuracy(cpls: number[]): number {
  if (cpls.length === 0) return 100;
  const total = cpls.reduce((sum, cpl) => sum + movePerformanceScore(cpl), 0);
  return total / cpls.length;
}

/**
 * Combina la cronologia di mosse, la cronologia FEN (`buildFenHistory`) e i
 * risultati dell'analisi Stockfish (`useStockfishAnalysis`, un risultato per
 * ogni posizione della cronologia, nello stesso ordine) in una lista di voci
 * per mossa con CPL, classificazione e mossa migliore alternativa.
 */
export function buildMoveAnalysis(
  moves: ChessMove[],
  fenHistory: string[],
  results: FenAnalysisResult[]
): MoveAnalysisEntry[] {
  const entries: MoveAnalysisEntry[] = [];
  const count = Math.min(moves.length, fenHistory.length - 1, results.length - 1);

  for (let i = 0; i < count; i++) {
    const before = results[i];
    const after = results[i + 1];
    if (!before || !after) continue;

    const move = moves[i];
    const cpl = computeCentipawnLoss(before, after);

    entries.push({
      moveIndex: i,
      move,
      color: move.piece.color,
      fenBefore: fenHistory[i],
      fenAfter: fenHistory[i + 1],
      bestMoveUci: before.bestMoveUci,
      cpl,
      classification: classifyMove(cpl),
      evalBeforeComparable: uciScoreToComparable(before.scoreType, before.scoreValue),
      evalAfterComparable: uciScoreToComparable(after.scoreType, after.scoreValue),
    });
  }

  return entries;
}

/** Accuratezza aggregata per entrambi i giocatori a partire dalle voci di analisi. */
export function computeAccuracyByColor(entries: MoveAnalysisEntry[]): { white: number; black: number } {
  const whiteCpls = entries.filter((e) => e.color === 'w').map((e) => e.cpl);
  const blackCpls = entries.filter((e) => e.color === 'b').map((e) => e.cpl);

  return {
    white: computeAccuracy(whiteCpls),
    black: computeAccuracy(blackCpls),
  };
}

/**
 * Classi utility Tailwind (token tema `--color-app-move-*` di src/index.css)
 * per rappresentare visivamente ciascuna categoria di classificazione mossa,
 * coerenti nei 3 temi (Scuro Elegante, Chiaro Pergamena, Alto Contrasto).
 */
export function getClassificationColorClasses(label: MoveClassificationLabel): { bg: string; text: string } {
  switch (label) {
    case 'ottima':
      return { bg: 'bg-app-move-best-bg', text: 'text-app-move-best-text' };
    case 'buona':
      return { bg: 'bg-app-move-good-bg', text: 'text-app-move-good-text' };
    case 'imprecisione':
      return { bg: 'bg-app-move-inaccuracy-bg', text: 'text-app-move-inaccuracy-text' };
    case 'errore':
      return { bg: 'bg-app-move-mistake-bg', text: 'text-app-move-mistake-text' };
    case 'blunder':
      return { bg: 'bg-app-move-blunder-bg', text: 'text-app-move-blunder-text' };
  }
}

/**
 * Converte una mossa in notazione UCI (es. "e2e4" o "e7e8q") nella notazione
 * leggibile già usata dal resto dell'app, riutilizzando `executeMove` invece
 * di reimplementare la logica di notazione algebrica.
 */
export function uciMoveToReadableNotation(fen: string, uciMove: string): string {
  if (!uciMove || uciMove.length < 4) return uciMove;

  const from = uciMove.slice(0, 2) as Square;
  const to = uciMove.slice(2, 4) as Square;
  const promotion = (uciMove.length > 4 ? uciMove[4] : 'q') as ChessPiece['type'];

  const result = executeMove(fen, from, to, promotion);
  return result.success ? result.notation : uciMove;
}
