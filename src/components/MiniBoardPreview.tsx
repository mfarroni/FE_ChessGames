/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 06/07/2026 17:04:27 (Ora di Roma)
 * Problema Risolto: Introduzione di una mini-scacchiera di sola
 * visualizzazione (nessuna interazione, nessuno stato, nessun audio) usata
 * dal report di analisi post-partita per confrontare "Mossa Giocata" e
 * "Mossa Suggerita" in AnalysisReport.tsx.
 */

import React from 'react';
import { ChessPiece, ChessColor, Square } from '../types';
import { parseFen, squareToCoords } from '../utils/chessLogic';

interface MiniBoardPreviewProps {
  fen: string;
  highlightFrom?: Square;
  highlightTo?: Square;
  orientation?: ChessColor;
}

// Dimensione casa in px: 8 * 21 = 168px, multiplo esatto (nessun arrotondamento).
const SQUARE_SIZE = 21;
const BOARD_SIZE = SQUARE_SIZE * 8;

/**
 * Disegna il glifo SVG di sola visualizzazione di un pezzo (cerchi decorativi
 * + simbolo Unicode del pezzo). Copiato intenzionalmente da
 * `renderSVGPiece` in `ChessBoard.tsx` (che NON viene importato né
 * modificato): nell'originale i parametri `r, c` non erano usati nel corpo
 * della funzione, quindi qui la firma è semplificata alla sola `(piece)`.
 */
function renderSVGPiece(piece: ChessPiece) {
  const symbols: Record<ChessPiece['color'], Record<ChessPiece['type'], string>> = {
    w: {
      p: '♙',
      r: '♖',
      n: '♘',
      b: '♗',
      q: '♕',
      k: '♔',
    },
    b: {
      p: '♟',
      r: '♜',
      n: '♞',
      b: '♝',
      q: '♛',
      k: '♚',
    },
  };

  const symbol = symbols[piece.color][piece.type];

  return (
    <g>
      {/* Ombra 3D sotto il gettone circolare */}
      <circle cx="24" cy="25.5" r="19" fill="#000000" opacity="0.32" filter="blur(1px)" />

      {/* Disco circolare bianco principale */}
      <circle cx="24" cy="24" r="19" fill="#fcfcf9" stroke="#9da19e" strokeWidth="1.2" />

      {/* Anello interno decorativo */}
      <circle cx="24" cy="24" r="16" fill="none" stroke="#e1e3e1" strokeWidth="1" />

      {/* Riflesso a mezzaluna per effetto 3D */}
      <path
        d="M 10,20 A 15 15 0 0 1 38,20"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
        opacity="0.75"
        strokeLinecap="round"
      />

      {/* Glifo del pezzo, centrato */}
      <text
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="31px"
        fontWeight="normal"
        fill="#17120e"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Segoe UI Symbol"',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {symbol}
      </text>
    </g>
  );
}

export default function MiniBoardPreview({
  fen,
  highlightFrom,
  highlightTo,
  orientation = 'w',
}: MiniBoardPreviewProps) {
  const { board } = parseFen(fen);

  const ranks = orientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const files = orientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  const fromCoords = highlightFrom ? squareToCoords(highlightFrom) : null;
  const toCoords = highlightTo ? squareToCoords(highlightTo) : null;

  return (
    <div
      className="grid grid-cols-8 grid-rows-8 border border-app-border rounded-sm overflow-hidden shrink-0"
      style={{ width: `${BOARD_SIZE}px`, height: `${BOARD_SIZE}px` }}
    >
      {ranks.map((r) =>
        files.map((c) => {
          const isWhiteSq = (r + c) % 2 === 0;
          const piece = board[r][c];
          const isHighlighted =
            (!!fromCoords && fromCoords.r === r && fromCoords.c === c) ||
            (!!toCoords && toCoords.r === r && toCoords.c === c);

          return (
            <div
              key={`mb-${r}-${c}`}
              className={`relative flex items-center justify-center ${isWhiteSq ? 'wood-light' : 'wood-dark'}`}
              style={{ width: `${SQUARE_SIZE}px`, height: `${SQUARE_SIZE}px` }}
            >
              {piece && (
                <svg viewBox="0 0 48 48" className="w-full h-full pointer-events-none select-none">
                  {renderSVGPiece(piece)}
                </svg>
              )}

              {/* Overlay tema-aware (non il giallo hardcoded di ChessBoard.tsx) */}
              {isHighlighted && (
                <div className="absolute inset-0 ring-2 ring-app-accent ring-inset pointer-events-none" />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
