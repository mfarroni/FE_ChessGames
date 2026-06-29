import React, { useState, useEffect } from 'react';
import { ChessPiece, ChessGame, Square, ChessColor, ChessMove } from '../types';
import { squareToCoords, coordsToSquare, getLegalMoves, isCheck, isCheckmate, isStalemate, executeMove, parseFen } from '../utils/chessLogic';
import { AudioEngine } from './AudioEngine';

interface ChessBoardProps {
  game: ChessGame;
  onMove: (from: Square, to: Square, promotion?: ChessPiece['type'], sound?: string) => void;
  playerColor: ChessColor;
  interactive: boolean;
}

export default function ChessBoard({ game, onMove, playerColor, interactive }: ChessBoardProps) {
  const { board, turn, castlingRights, enPassantSquare } = parseFen(game.fen);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);

  // Promotion state
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);

  // Lamp lighting source settings (can be dragged or click-positioned)
  const [lampLight, setLampLight] = useState<{ x: number, y: number }>({ x: 350, y: 350 }); // center of 700px board container

  // Clean selections when game/fen updates
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
    setPromotionPending(null);
  }, [game.fen]);

  const handleSquareClick = (sq: Square) => {
    if (!interactive) return;

    const coords = squareToCoords(sq);
    const piece = board[coords.r][coords.c];

    // If a square is already selected, try to execute a move
    if (selectedSquare) {
      if (legalMoves.includes(sq)) {
        const fromCoords = squareToCoords(selectedSquare);
        const movingPiece = board[fromCoords.r][fromCoords.c];

        // Check for Pawn Promotion (moving to rank 8 or rank 1)
        if (movingPiece && movingPiece.type === 'p' && (coords.r === 0 || coords.r === 7)) {
          setPromotionPending({ from: selectedSquare, to: sq });
          return;
        }

        // Standard move trigger
        triggerMove(selectedSquare, sq);
        return;
      }
    }

    // Select friendly piece
    if (piece && piece.color === playerColor && game.turn === playerColor) {
      setSelectedSquare(sq);
      const moves = getLegalMoves(board, sq, playerColor, castlingRights, enPassantSquare);
      setLegalMoves(moves);
      AudioEngine.playTick(); // subtle click feedback for picking up piece
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const triggerMove = (from: Square, to: Square, promotionType: ChessPiece['type'] = 'q') => {
    const fromCoords = squareToCoords(from);
    const piece = board[fromCoords.r][fromCoords.c];
    if (!piece) return;

    // Simulate move locally to predict sound type
    const result = executeMove(game.fen, from, to, promotionType);
    if (result.success) {
      // Play local audio instantly for responsive feedback
      if (result.soundType === 'checkmate' || result.soundType === 'check') {
        AudioEngine.playCheck();
      } else if (result.soundType === 'capture') {
        AudioEngine.playCapture();
      } else {
        AudioEngine.playMove();
      }

      onMove(from, to, promotionType, result.soundType);
    }

    setSelectedSquare(null);
    setLegalMoves([]);
    setPromotionPending(null);
  };

  // Helper calculation to orient dynamic projection shadows
  const getDynamicShadowStyles = (r: number, c: number) => {
    // Square central coordinates (0-7 scale, mid = 3.5)
    // Map light position from pixels (0-720) to board square units (0-8)
    const lightSqX = (lampLight.x / 720) * 8;
    const lightSqY = (lampLight.y / 720) * 8;

    const dx = c + 0.5 - lightSqX;
    const dy = r + 0.5 - lightSqY;

    // Volumetric shadow projection length
    const shadowX = dx * 2.5; 
    const shadowY = dy * 2.5;
    const blur = Math.max(3, 8 - Math.sqrt(dx*dx + dy*dy) * 0.5);
    const opacity = Math.min(0.55, 0.2 + Math.sqrt(dx*dx + dy*dy) * 0.04);

    return {
      filter: `drop-shadow(${shadowX}px ${shadowY}px ${blur}px rgba(11, 5, 2, ${opacity}))`,
      transform: 'translateZ(0)', // hardware acceleration
    };
  };

  // Calculate high-resolution list of captured pieces for the sidebar plates
  const getCapturedPieces = (): { white: ChessPiece[], black: ChessPiece[] } => {
    const initialCounts: Record<string, number> = {
      p: 8, r: 2, n: 2, b: 2, q: 1, k: 1
    };
    
    const currentCountsWhite: Record<string, number> = { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 };
    const currentCountsBlack: Record<string, number> = { p: 0, r: 0, n: 0, b: 0, q: 0, k: 0 };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          if (p.color === 'w') {
            currentCountsWhite[p.type]++;
          } else {
            currentCountsBlack[p.type]++;
          }
        }
      }
    }

    const capturedW: ChessPiece[] = [];
    const capturedB: ChessPiece[] = [];

    // Pieces captured by Black (meaning White pieces that died)
    Object.keys(initialCounts).forEach(type => {
      const lost = initialCounts[type] - currentCountsWhite[type];
      for (let i = 0; i < lost; i++) {
        capturedW.push({ type: type as ChessPiece['type'], color: 'w' });
      }
    });

    // Pieces captured by White (meaning Black pieces that died)
    Object.keys(initialCounts).forEach(type => {
      const lost = initialCounts[type] - currentCountsBlack[type];
      for (let i = 0; i < lost; i++) {
        capturedB.push({ type: type as ChessPiece['type'], color: 'b' });
      }
    });

    return { white: capturedW, black: capturedB };
  };

  const captured = getCapturedPieces();

  // Highlight squares that were the 'from' and 'to' of the last physical move
  const lastMove = game.moves[game.moves.length - 1];

  // SVG representation vectors for detailed pieces inside circular magnetic counters
  const renderSVGPiece = (piece: ChessPiece, r: number, c: number) => {
    // Choose high-contrast Unicode symbols based on color and type matching the travel set
    const symbols: Record<ChessPiece['color'], Record<ChessPiece['type'], string>> = {
      w: {
        p: '♙', // white pawn (outlined)
        r: '♖', // white rook (outlined)
        n: '♘', // white knight (outlined)
        b: '♗', // white bishop (outlined)
        q: '♕', // white queen (outlined)
        k: '♔', // white king (outlined)
      },
      b: {
        p: '♟', // black pawn (solid)
        r: '♜', // black rook (solid)
        n: '♞', // black knight (solid)
        b: '♝', // black bishop (solid)
        q: '♛', // black queen (solid)
        k: '♚', // black king (solid)
      }
    };

    const symbol = symbols[piece.color][piece.type];

    return (
      <g>
        {/* Realistic subtle 3D drop shadow underneath the circular piece */}
        <circle cx="24" cy="25.5" r="19" fill="#000000" opacity="0.32" filter="blur(1px)" />
        
        {/* Main circular white counter disc (glossy ivory/pristine white finish) */}
        <circle cx="24" cy="24" r="19" fill="#fcfcf9" stroke="#9da19e" strokeWidth="1.2" />
        
        {/* Elegant inner circular ring accent for top cabinet aesthetic */}
        <circle cx="24" cy="24" r="16" fill="none" stroke="#e1e3e1" strokeWidth="1" />
        
        {/* Subtle crescent light glare overlay to make it look 3D and premium */}
        <path d="M 10,20 A 15 15 0 0 1 38,20" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.75" strokeLinecap="round" />
        
        {/* Perfectly centered high-contrast chess piece vector glyph */}
        <text
          x="24"
          y="24"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="31px"
          fontWeight="normal"
          fill="#17120e"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Segoe UI Symbol"',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          {symbol}
        </text>
      </g>
    );
  };

  const ranks = playerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const files = playerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <div id="board-container-root" className="relative flex flex-col items-center">
      
      {/* SVG Pattern assets definitions for the wood grains */}
      <svg className="hidden">
        <defs>
          {/* Crisp Black and White realistic wood texture gradients/patterns */}
          {/* Light squares: White ivory wood pattern */}
          <pattern id="light-wood-grain-id" width="240" height="240" patternUnits="userSpaceOnUse">
            <rect width="240" height="240" fill="#faf8f5" />
            
            {/* Subtle off-white maple grain curves */}
            <path d="M 0,40 Q 60,30 120,60 T 240,40" fill="none" stroke="#eae5db" strokeWidth="12" opacity="0.32" />
            <path d="M 0,90 Q 70,120 140,80 T 240,110" fill="none" stroke="#eae5db" strokeWidth="9" opacity="0.25" />
            <path d="M 0,160 Q 80,140 160,190 T 240,170" fill="none" stroke="#e2dbcf" strokeWidth="14" opacity="0.35" />
            
            {/* Fine hairline grain lines */}
            <path d="M 0,15 L 240,18" fill="none" stroke="#dfd9cc" strokeWidth="1" opacity="0.2" />
            <path d="M 0,72 L 240,68" fill="none" stroke="#dfd9cc" strokeWidth="1.2" opacity="0.15" />
            <path d="M 0,120 L 240,125" fill="none" stroke="#dfd9cc" strokeWidth="0.8" opacity="0.22" />
            <path d="M 0,210 Q 120,230 240,205" fill="none" stroke="#dfd9cc" strokeWidth="1.5" opacity="0.2" />
          </pattern>

          {/* Dark squares: Charcoal black oak wood pattern */}
          <pattern id="dark-wood-grain-id" width="240" height="240" patternUnits="userSpaceOnUse">
            <rect width="240" height="240" fill="#181512" />
            
            {/* Dark waves */}
            <path d="M 0,30 Q 80,70 160,20 T 240,50" fill="none" stroke="#25201c" strokeWidth="18" opacity="0.55" />
            <path d="M 0,110 Q 50,80 120,120 T 240,90" fill="none" stroke="#2a2420" strokeWidth="15" opacity="0.4" />
            <path d="M 0,180 Q 90,210 170,160 T 240,195" fill="none" stroke="#241e1a" strokeWidth="20" opacity="0.5" />
            
            {/* Hairline subtle dark rings */}
            <path d="M 0,55 L 240,50" fill="none" stroke="#0f0d0b" strokeWidth="1.5" opacity="0.35" />
            <path d="M 0,140 L 240,148" fill="none" stroke="#0f0d0b" strokeWidth="1.2" opacity="0.4" />
            <path d="M 0,225 L 240,220" fill="none" stroke="#120e0c" strokeWidth="1.8" opacity="0.35" />
          </pattern>
        </defs>
      </svg>

      {/* Main Professional Chess Cabinet Layout */}
      <div className="relative flex flex-col md:flex-row gap-6 p-6 bg-amber-950/25 rounded-3xl border border-stone-800 shadow-2xl backdrop-blur-md">
        
        {/* Left Side Captured Trays: Pieces captured by Black (meaning White pieces that died) */}
        <div id="captured-tray-black" className="flex md:flex-col justify-center items-center gap-2 p-3 bg-stone-900/80 rounded-2xl border border-amber-900/30 w-full md:w-16 shadow-inner">
          <div className="text-[10px] uppercase font-mono tracking-wider text-amber-800 font-bold mb-1 md:rotate-270 md:my-4 select-none">
            White Lost
          </div>
          <div className="flex md:flex-col flex-wrap gap-1 max-h-16 md:max-h-none overflow-y-auto justify-center">
            {captured.white.map((p, idx) => (
              <div key={`cw_${idx}`} className="w-8 h-8 rounded-full bg-[#ebd3b2]/10 flex items-center justify-center border border-amber-500/10 shadow-md">
                <svg viewBox="0 0 48 48" className="w-6 h-6 select-none pointer-events-none p-0.5">
                  {renderSVGPiece(p, 0, 0)}
                </svg>
              </div>
            ))}
            {captured.white.length === 0 && (
              <span className="text-stone-600 text-xs">-</span>
            )}
          </div>
        </div>

        {/* Dynamic Overhead Lamp Source Interactive Coordinate Monitor */}
        <div 
          id="chess-interactive-tabletop"
          className="relative rounded-2xl p-4 bg-gradient-to-br from-[#16120e] to-[#040302] border-[12px] border-solid border-[#2b180f] board-shadow ring-4 ring-[#2d1a0f] overflow-hidden"
          style={{ width: 'fit-content' }}
        >
          {/* Dynamic Light Source Indicator: Soft visual lamp glow map projection */}
          <div 
            id="dynamic-lamp-source"
            className="absolute w-[600px] h-[600px] rounded-full pointer-events-none select-none mix-blend-screen opacity-45 transition-all duration-300"
            style={{
              left: `${lampLight.x - 300}px`,
              top: `${lampLight.y - 300}px`,
              background: 'radial-gradient(circle, rgba(254, 243, 199, 1) 0%, rgba(217, 119, 6, 0.15) 30%, rgba(0, 0, 0, 0) 65%)',
            }}
          />

          {/* Absolute Outer Wooden Cabinet Bevel frame */}
          <div className="absolute inset-0 border-2 border-stone-950 rounded-lg pointer-events-none select-none z-10" />

          {/* Letter Coordinates (Files) Top and Bottom */}
          <div className="flex justify-between px-7 py-1 font-serif text-sm font-semibold text-amber-100/60 select-none">
            {files.map(f => (
              <div key={`file-top-${f}`} className="w-12 h-4 text-center">
                {String.fromCharCode(97 + f)}
              </div>
            ))}
          </div>

          <div className="flex">
            {/* Number Coordinates (Ranks) Left */}
            <div className="flex flex-col justify-between py-1 font-serif text-sm font-semibold text-amber-100/60 w-7 pr-1 items-center select-none">
              {ranks.map(r => (
                <div key={`rank-left-${r}`} className="h-12 flex items-center justify-center">
                  {8 - r}
                </div>
              ))}
            </div>

            {/* Chess Grid Squares */}
            <div 
              id="chessboard-grid-parent"
              className="relative grid grid-cols-8 grid-rows-8 border-[4px] border-stone-950 bg-stone-950 rounded-sm shadow-md"
              style={{ width: '384px', height: '384px' }}
              onMouseMove={(e) => {
                // Determine mouse position relative to Chessboard for interactive lamp coordinates
                const rect = e.currentTarget.getBoundingClientRect();
                setLampLight({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top
                });
              }}
              onMouseLeave={() => {
                // Soft resetting coordinates back to center lamp shadow coordinates on mouse leave
                setLampLight({ x: 192, y: 192 });
              }}
            >
              {ranks.map((r) => {
                return files.map((c) => {
                  const sq = coordsToSquare(r, c);
                  const isWhiteSq = (r + c) % 2 === 0;
                  const piece = board[r][c];

                  const isSelected = selectedSquare === sq;
                  const isLegalTarget = legalMoves.includes(sq);

                  // Highlight square if involved in the last executed move
                  const isLastMoveSrc = lastMove && lastMove.from === sq;
                  const isLastMoveDst = lastMove && lastMove.to === sq;

                  // Highlighting check state color background
                  const isKingInCheckSquare = piece?.type === 'k' && piece?.color === turn && isCheck(board, turn);

                  let overlayClasses = '';

                  if (isSelected) {
                    overlayClasses = 'ring-4 ring-amber-400 ring-inset bg-amber-500/20';
                  } else if (isLastMoveSrc || isLastMoveDst) {
                    overlayClasses = 'bg-yellow-400/15 shadow-inner inset-0';
                  } else if (isKingInCheckSquare) {
                    overlayClasses = 'bg-red-600/35 border-2 border-red-500 animate-pulse';
                  }

                  return (
                    <div
                      key={sq}
                      id={`sq-${sq}`}
                      className={`relative w-12 h-12 flex items-center justify-center cursor-pointer select-none overflow-visible transition-all duration-150 ${isWhiteSq ? 'wood-light' : 'wood-dark'}`}
                      onClick={() => handleSquareClick(sq)}
                    >
                      {/* Wood lacquer borders bevels */}
                      <div className="absolute inset-0 border-[0.5px] border-amber-950/15 pointer-events-none" />

                      {/* Translucent overlay filters */}
                      {overlayClasses && <div className={`absolute inset-0 pointer-events-none ${overlayClasses}`} />}

                      {/* Chess pieces SVG with dynamically applied shadows based on mouse-relative lighting coordinates */}
                      {piece && (
                        <div 
                          className="absolute w-12 h-12 z-20 flex items-center justify-center select-none active:scale-105 pointer-events-none"
                          style={getDynamicShadowStyles(r, c)}
                        >
                          <svg viewBox="0 0 48 48" className="w-11 h-11 pointer-events-none select-none">
                            {renderSVGPiece(piece, r, c)}
                          </svg>
                        </div>
                      )}

                      {/* Small Indicator on legal move target squares */}
                      {isLegalTarget && (
                        <div className="absolute w-3.5 h-3.5 rounded-full bg-amber-400/70 border border-stone-900 shadow-md z-30 pointer-events-none" />
                      )}
                    </div>
                  );
                });
              })}
            </div>

            {/* Number Coordinates (Ranks) Right */}
            <div className="flex flex-col justify-between py-1 font-serif text-sm font-semibold text-amber-100/60 w-7 pl-1 items-center select-none">
              {ranks.map(r => (
                <div key={`rank-right-${r}`} className="h-12 flex items-center justify-center">
                  {8 - r}
                </div>
              ))}
            </div>
          </div>

          {/* Letter Coordinates (Files) Bottom */}
          <div className="flex justify-between px-7 py-1 font-serif text-sm font-semibold text-amber-100/60 select-none">
            {files.map(f => (
              <div key={`file-bottom-${f}`} className="w-12 h-4 text-center">
                {String.fromCharCode(97 + f)}
              </div>
            ))}
          </div>

          {/* Immersive Lamp Title Indicator */}
          <div className="text-[9px] font-mono tracking-widest text-[#a87d55] text-center mt-2 uppercase opacity-75">
            💡 Sposta il mouse sulla scacchiera per regolare l'illuminazione
          </div>
        </div>

        {/* Right Side Captured Trays: Pieces captured by White (meaning Black pieces that died) */}
        <div id="captured-tray-white" className="flex md:flex-col justify-center items-center gap-2 p-3 bg-stone-900/80 rounded-2xl border border-amber-900/30 w-full md:w-16 shadow-inner">
          <div className="text-[10px] uppercase font-mono tracking-wider text-amber-800 font-bold mb-1 md:rotate-90 md:my-4 select-none">
            Black Lost
          </div>
          <div className="flex md:flex-col flex-wrap gap-1 max-h-16 md:max-h-none overflow-y-auto justify-center">
            {captured.black.map((p, idx) => (
              <div key={`cb_${idx}`} className="w-8 h-8 rounded-full bg-stone-950/40 flex items-center justify-center border border-amber-500/10 shadow-md">
                <svg viewBox="0 0 48 48" className="w-6 h-6 select-none pointer-events-none p-0.5">
                  {renderSVGPiece(p, 0, 0)}
                </svg>
              </div>
            ))}
            {captured.black.length === 0 && (
              <span className="text-stone-600 text-xs">-</span>
            )}
          </div>
        </div>

      </div>

      {/* Pawn Promotion Modal Wooden Overlay */}
      {promotionPending && (
        <div 
          id="pawn-promotion-modal"
          className="absolute inset-0 bg-stone-950/80 backdrop-blur-md flex items-center justify-center z-50 rounded-2xl p-6 transition-all duration-300"
        >
          <div className="bg-gradient-to-b from-[#2b180f] to-[#120804] border-2 border-amber-600/30 p-6 rounded-2xl text-center shadow-2xl max-w-sm">
            <h3 className="text-serif text-lg font-bold text-amber-100 mb-2 font-serif">
              Promozione del Pedone
            </h3>
            <p className="text-stone-400 text-xs mb-4">
              Seleziona la figura per elevare il tuo pedone d'attacco:
            </p>
            <div className="flex justify-center gap-3">
              {(['q', 'r', 'b', 'n'] as ChessPiece['type'][]).map((type) => {
                const tempPiece: ChessPiece = { type, color: playerColor };
                return (
                  <button
                    key={type}
                    id={`promo-${type}`}
                    className="w-16 h-16 rounded-xl bg-amber-900/20 hover:bg-amber-600/30 border border-amber-600/40 flex items-center justify-center outline-none cursor-pointer transition-all duration-150 transform hover:scale-105"
                    onClick={() => {
                      if (promotionPending) {
                        triggerMove(promotionPending.from, promotionPending.to, type);
                      }
                    }}
                  >
                    <svg viewBox="0 0 48 48" className="w-12 h-12">
                      {renderSVGPiece(tempPiece, 0, 0)}
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
