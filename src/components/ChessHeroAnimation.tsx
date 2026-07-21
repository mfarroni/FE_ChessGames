/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 21/07/2026 (Ora di Roma)
 * Problema Risolto: Animazione hero decorativa per la landing page. Una
 * scacchiera con la posizione iniziale in cui, ad ogni apertura della pagina,
 * 5 pezzi (Donna bianca esclusa) vengono spostati su caselle libere casuali e
 * possono mostrare le foto caricate dall'admin (GET /api/photos/random) al
 * posto del disco standard. Una mano stilizzata in SVG anima lo spostamento
 * della Donna bianca da d1 a d4 e ritorno, in loop, via CSS @keyframes.
 * Rispetta prefers-reduced-motion (board statica, nessuna mano). Puramente
 * decorativa (pointer-events: none), riusa il linguaggio visivo di ChessBoard.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ChessPiece } from '../types';
import { API_BASE_URL } from '../utils/apiConfig';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// Glifi unicode coerenti con renderSVGPiece di ChessBoard.tsx.
const GLYPHS: Record<ChessPiece['color'], Record<ChessPiece['type'], string>> = {
  w: { p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔' },
  b: { p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚' },
};

const QUEEN_SQUARE = 'd1'; // la Donna bianca animata dalla mano (resta esclusa dallo scatter)
const QUEEN_TARGET = 'd4'; // destinazione della mano

// Posizione iniziale standard (32 pezzi) come costante a livello di modulo.
const STANDARD_POSITION: Record<string, ChessPiece> = (() => {
  const pos: Record<string, ChessPiece> = {};
  const back: ChessPiece['type'][] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let c = 0; c < 8; c++) {
    pos[`${FILES[c]}1`] = { type: back[c], color: 'w' };
    pos[`${FILES[c]}2`] = { type: 'p', color: 'w' };
    pos[`${FILES[c]}7`] = { type: 'p', color: 'b' };
    pos[`${FILES[c]}8`] = { type: back[c], color: 'b' };
  }
  return pos;
})();

const ALL_SQUARES: string[] = (() => {
  const out: string[] = [];
  for (let rank = 1; rank <= 8; rank++) for (let c = 0; c < 8; c++) out.push(`${FILES[c]}${rank}`);
  return out;
})();

interface ScatterLayout {
  position: Record<string, ChessPiece>;
  movedSquares: string[]; // caselle di arrivo dei 5 pezzi spostati, in ordine
}

// Calcola il layout "5 pezzi sparsi" una volta per mount.
function computeScatterLayout(): ScatterLayout {
  const position: Record<string, ChessPiece> = { ...STANDARD_POSITION };

  // Candidati: tutti i pezzi tranne la Donna bianca su d1.
  const candidates = Object.keys(STANDARD_POSITION).filter((sq) => sq !== QUEEN_SQUARE);
  // Mescola e prendi i primi 5.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const chosen = candidates.slice(0, 5);

  // Rimuovi i 5 pezzi dalle loro caselle: il pool di caselle libere include sia
  // quelle originariamente vuote sia quelle appena liberate.
  const originSquares: Record<string, ChessPiece> = {};
  for (const sq of chosen) {
    originSquares[sq] = position[sq];
    delete position[sq];
  }
  // Escludiamo d1/d4 dalle destinazioni: sono la casella di partenza e di arrivo
  // della Donna animata, per non far comparire un pezzo sotto la mano.
  const reserved = new Set([QUEEN_SQUARE, QUEEN_TARGET]);
  let freeSquares = ALL_SQUARES.filter((sq) => !position[sq] && !reserved.has(sq));

  const movedSquares: string[] = [];
  for (const originSq of chosen) {
    // La casella di partenza del pezzo stesso è esclusa (già libera comunque).
    const options = freeSquares.filter((sq) => sq !== originSq);
    if (options.length === 0) break;
    const target = options[Math.floor(Math.random() * options.length)];
    position[target] = originSquares[originSq];
    freeSquares = freeSquares.filter((sq) => sq !== target);
    movedSquares.push(target);
  }

  return { position, movedSquares };
}

// Disco standard (cerchio avorio + anello + riflesso + glifo) coerente con
// renderSVGPiece di ChessBoard.tsx.
function StandardDisc({ piece }: { piece: ChessPiece }) {
  return (
    <svg viewBox="0 0 48 48" className="w-full h-full piece-shadow select-none pointer-events-none">
      <circle cx="24" cy="25.5" r="19" fill="#000000" opacity="0.32" />
      <circle cx="24" cy="24" r="19" fill="#fcfcf9" stroke="#9da19e" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="16" fill="none" stroke="#e1e3e1" strokeWidth="1" />
      <path d="M 10,20 A 15 15 0 0 1 38,20" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.75" strokeLinecap="round" />
      <text
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="31px"
        fill="#17120e"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Segoe UI Symbol"', userSelect: 'none', pointerEvents: 'none' }}
      >
        {GLYPHS[piece.color][piece.type]}
      </text>
    </svg>
  );
}

// Disco con foto: stesso disco avorio come cornice, foto circolare all'interno,
// e piccolo badge con il glifo per restare riconoscibile come pezzo.
function PhotoDisc({ piece, url }: { piece: ChessPiece; url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <StandardDisc piece={piece} />;
  return (
    <div className="relative w-full h-full piece-shadow">
      <svg viewBox="0 0 48 48" className="w-full h-full select-none pointer-events-none">
        <circle cx="24" cy="25.5" r="19" fill="#000000" opacity="0.32" />
        <circle cx="24" cy="24" r="19" fill="#fcfcf9" stroke="#9da19e" strokeWidth="1.2" />
      </svg>
      {/* Foto ritagliata a cerchio dentro l'anello del disco */}
      <img
        src={url}
        alt=""
        onError={() => setFailed(true)}
        className="absolute rounded-full object-cover select-none pointer-events-none"
        style={{ inset: '14%' }}
      />
      {/* Badge tipo/colore pezzo in basso a destra */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          width: '38%',
          height: '38%',
          right: '2%',
          bottom: '2%',
          background: '#fcfcf9',
          border: '1px solid #9da19e',
          color: '#17120e',
          fontSize: 'clamp(7px, 2.4vw, 12px)',
          lineHeight: 1,
        }}
      >
        <span style={{ fontFamily: '"Segoe UI Symbol", -apple-system, BlinkMacSystemFont, sans-serif', userSelect: 'none' }}>
          {GLYPHS[piece.color][piece.type]}
        </span>
      </div>
    </div>
  );
}

// Mano + avambraccio stilizzati (silhouette, tono ambra), viewBox relativo.
function HandSVG() {
  return (
    <svg viewBox="0 0 100 140" className="w-full h-full pointer-events-none select-none" style={{ filter: 'drop-shadow(2px 4px 5px rgba(0,0,0,0.45))' }}>
      <g fill="#C79A6B">
        {/* Avambraccio */}
        <path d="M30 0 L70 0 L66 46 L34 46 Z" />
        {/* Palmo */}
        <path d="M30 40 Q22 58 30 82 Q40 104 50 104 Q60 104 70 82 Q78 58 70 40 Z" />
        {/* Pollice */}
        <path d="M28 58 Q14 62 16 76 Q18 86 30 82 Z" />
        {/* Dita (indice/medio/anulare) che scendono verso il pezzo */}
        <rect x="34" y="92" width="9" height="30" rx="4.5" />
        <rect x="46" y="96" width="9" height="30" rx="4.5" />
        <rect x="58" y="92" width="9" height="28" rx="4.5" />
      </g>
    </svg>
  );
}

// Cella con eventuale pezzo (o foto).
function PieceCell({ piece, photoUrl }: { piece: ChessPiece; photoUrl?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-[6%]">
      {photoUrl ? <PhotoDisc piece={piece} url={photoUrl} /> : <StandardDisc piece={piece} />}
    </div>
  );
}

export default function ChessHeroAnimation() {
  const { position, movedSquares } = useMemo(() => computeScatterLayout(), []);
  const [photos, setPhotos] = useState<string[]>([]);
  const [reducedMotion] = useState<boolean>(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Mappa casella-spostata -> foto (in ordine). Nessuna foto = disco standard.
  const photoBySquare = useMemo(() => {
    const map: Record<string, string> = {};
    movedSquares.forEach((sq, i) => {
      if (photos[i]) map[sq] = photos[i];
    });
    return map;
  }, [movedSquares, photos]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/photos/random`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && data.success && Array.isArray(data.photos)) {
          setPhotos(data.photos.slice(0, 5));
        }
      })
      .catch(() => {
        /* fail-soft: nessun errore in UI, restano i dischi standard */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Griglia: righe visive r=0 (rank 8, in alto) .. r=7 (rank 1, in basso).
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const square = `${FILES[c]}${8 - r}`;
      const light = (r + c) % 2 === 0;
      const piece = position[square];
      // Con animazione attiva la Donna d1 è renderizzata nell'overlay mobile.
      const hideForAnimation = !reducedMotion && square === QUEEN_SQUARE;
      cells.push(
        <div key={square} className={`relative ${light ? 'wood-light' : 'wood-dark'}`}>
          {piece && !hideForAnimation && <PieceCell piece={piece} photoUrl={photoBySquare[square]} />}
        </div>
      );
    }
  }

  const queen = STANDARD_POSITION[QUEEN_SQUARE];

  return (
    <div className="w-full flex justify-center pointer-events-none select-none" aria-hidden="true">
      <div className="relative w-full" style={{ maxWidth: 'clamp(260px, 78vw, 420px)' }}>
        <div className="relative aspect-square w-full rounded-xl overflow-hidden board-shadow">
          {/* Caselle */}
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">{cells}</div>

          {/* Overlay animato Donna + mano (solo se motion consentito) */}
          {!reducedMotion && (
            <div
              className="absolute hero-move-group"
              style={{ left: '37.5%', top: '87.5%', width: '12.5%', height: '12.5%' }}
            >
              {/* Donna bianca (disco standard, mai foto) */}
              <div className="absolute inset-0 flex items-center justify-center p-[6%] hero-queen">
                <StandardDisc piece={queen} />
              </div>
              {/* Mano che scende ad afferrare/rilasciare */}
              <div
                className="absolute hero-hand"
                style={{ width: '150%', height: '210%', left: '18%', bottom: '32%' }}
              >
                <HandSVG />
              </div>
            </div>
          )}
        </div>

        {/* Keyframes locali: nessuna libreria, nessuna modifica a index.css */}
        <style>{`
          .hero-move-group { animation: heroTravel 9s ease-in-out infinite; will-change: transform; }
          .hero-queen { animation: heroQueenGrab 9s ease-in-out infinite; }
          .hero-hand { transform-origin: bottom center; animation: heroHand 9s ease-in-out infinite; }
          @keyframes heroTravel {
            0%   { transform: translateY(0); }
            12%  { transform: translateY(0); }
            30%  { transform: translateY(-300%); }
            52%  { transform: translateY(-300%); }
            68%  { transform: translateY(-300%); }
            86%  { transform: translateY(0); }
            100% { transform: translateY(0); }
          }
          @keyframes heroHand {
            0%   { transform: translateY(-45%); opacity: 0.35; }
            8%   { transform: translateY(0);    opacity: 1; }
            30%  { transform: translateY(0);    opacity: 1; }
            40%  { transform: translateY(-45%); opacity: 0.35; }
            60%  { transform: translateY(-45%); opacity: 0.35; }
            68%  { transform: translateY(0);    opacity: 1; }
            86%  { transform: translateY(0);    opacity: 1; }
            94%  { transform: translateY(-45%); opacity: 0.35; }
            100% { transform: translateY(-45%); opacity: 0.35; }
          }
          @keyframes heroQueenGrab {
            0%,7%   { transform: scale(1); }
            11%     { transform: scale(1.07); }
            15%,63% { transform: scale(1); }
            67%     { transform: scale(1.07); }
            71%,100%{ transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
