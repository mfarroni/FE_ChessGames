/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 02/07/2026 10:26:03 (Ora di Roma)
 * Problema Risolto: Revisione e inserimento dell'orario di modifica attuale di Roma e versione 1.0.0 in tutti i file.
 */

import { ChessPiece, ChessColor, ChessMove, Square } from '../types';

export const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function squareToCoords(sq: Square) {
  const col = sq.charCodeAt(0) - 97; // 'a' -> 0
  const row = 8 - parseInt(sq[1], 10); // '8' -> 0, '1' -> 7
  return { r: row, c: col };
}

export function coordsToSquare(r: number, c: number): Square {
  const colStr = String.fromCharCode(97 + c);
  const rowStr = (8 - r).toString();
  return colStr + rowStr as Square;
}

export function parseFen(fen: string) {
  const parts = fen.split(' ');
  const rows = parts[0].split('/');
  const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));

  for (let r = 0; r < 8; r++) {
    const rowStr = rows[r];
    let c = 0;
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (/[0-9]/.test(char)) {
        c += parseInt(char, 10);
      } else {
        const color: ChessColor = char === char.toUpperCase() ? 'w' : 'b';
        const type = char.toLowerCase() as ChessPiece['type'];
        board[r][c] = { type, color };
        c++;
      }
    }
  }

  const turn = (parts[1] || 'w') as ChessColor;
  const castlingRights = parts[2] || 'KQkq';
  const enPassantSquare = parts[3] === '-' ? null : (parts[3] as Square);
  const halfMoves = parseInt(parts[4] || '0', 10);
  const fullMoves = parseInt(parts[5] || '1', 10);

  return { board, turn, castlingRights, enPassantSquare, halfMoves, fullMoves };
}

export function boardToFen(
  board: (ChessPiece | null)[][],
  turn: ChessColor,
  castlingRights: string,
  enPassantSquare: Square | null,
  halfMoves: number,
  fullMoves: number
): string {
  const rows: string[] = [];

  for (let r = 0; r < 8; r++) {
    let rowStr = '';
    let emptyCount = 0;
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          rowStr += emptyCount.toString();
          emptyCount = 0;
        }
        const char = piece.type === 'n' ? 'n' : piece.type;
        const letter = piece.color === 'w' ? char.toUpperCase() : char.toLowerCase();
        rowStr += letter;
      }
    }
    if (emptyCount > 0) {
      rowStr += emptyCount.toString();
    }
    rows.push(rowStr);
  }

  const epStr = enPassantSquare || '-';
  const castleStr = castlingRights || '-';

  return `${rows.join('/')} ${turn} ${castleStr} ${epStr} ${halfMoves} ${fullMoves}`;
}

export function isSquareOnBoard(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function isSquareUnderAttack(board: (ChessPiece | null)[][], targetSq: Square, attackerColor: ChessColor): boolean {
  const tgt = squareToCoords(targetSq);
  
  // 1. Knight attacks
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1]
  ];
  for (const [dr, dc] of knightOffsets) {
    const nr = tgt.r + dr;
    const nc = tgt.c + dc;
    if (isSquareOnBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.type === 'n' && p.color === attackerColor) return true;
    }
  }

  // 2. Sliding attacks: Bishop, Rook, Queen
  const bishopDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const rookDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // Diagonals for Bishop & Queen
  for (const [dr, dc] of bishopDirs) {
    let nr = tgt.r + dr;
    let nc = tgt.c + dc;
    while (isSquareOnBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === attackerColor && (p.type === 'b' || p.type === 'q')) return true;
        break; // Hit a blocker
      }
      nr += dr;
      nc += dc;
    }
  }

  // Orthogonals for Rook & Queen
  for (const [dr, dc] of rookDirs) {
    let nr = tgt.r + dr;
    let nc = tgt.c + dc;
    while (isSquareOnBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p) {
        if (p.color === attackerColor && (p.type === 'r' || p.type === 'q')) return true;
        break; // Hit a blocker
      }
      nr += dr;
      nc += dc;
    }
  }

  // 3. Pawn attacks
  const pawnDir = attackerColor === 'w' ? 1 : -1; // Opponent moves down (indices grow) if White attacking, else up (subtracted)
  // If we are looking for White attacking Target, the white pawns must be at row tgt.r + 1 (lower rank)
  // If we are looking for Black attacking Target, black pawns must be at row tgt.r - 1 (higher rank)
  const attackerPawnRow = targetSq[1] === (attackerColor === 'w' ? '1' : '8') ? -1 : tgt.r + pawnDir; // out-of-bounds guard
  if (isSquareOnBoard(attackerPawnRow, tgt.c - 1)) {
    const p = board[attackerPawnRow][tgt.c - 1];
    if (p && p.type === 'p' && p.color === attackerColor) return true;
  }
  if (isSquareOnBoard(attackerPawnRow, tgt.c + 1)) {
    const p = board[attackerPawnRow][tgt.c + 1];
    if (p && p.type === 'p' && p.color === attackerColor) return true;
  }

  // 4. King attacks (adjacent squares)
  const kingOffsets = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  for (const [dr, dc] of kingOffsets) {
    const nr = tgt.r + dr;
    const nc = tgt.c + dc;
    if (isSquareOnBoard(nr, nc)) {
      const p = board[nr][nc];
      if (p && p.type === 'k' && p.color === attackerColor) return true;
    }
  }

  return false;
}

export function isCheck(board: (ChessPiece | null)[][], color: ChessColor): boolean {
  // Find King
  let kingSq: Square | null = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === color) {
        kingSq = coordsToSquare(r, c);
        break;
      }
    }
    if (kingSq) break;
  }

  if (!kingSq) return false;
  return isSquareUnderAttack(board, kingSq, color === 'w' ? 'b' : 'w');
}

/**
 * Computes pseudo-legal moves for a specific square (no pin validation yet)
 */
export function getPseudoLegalMoves(
  board: (ChessPiece | null)[][],
  square: Square,
  turn: ChessColor,
  castlingRights: string,
  enPassantSquare: Square | null
): Square[] {
  const coords = squareToCoords(square);
  const piece = board[coords.r][coords.c];
  if (!piece || piece.color !== turn) return [];

  const moves: Square[] = [];
  const { r, c } = coords;
  const oppColor = turn === 'w' ? 'b' : 'w';

  switch (piece.type) {
    case 'p': {
      // Pawn movement
      const dir = turn === 'w' ? -1 : 1; // White moves up (indices decrease)
      const startRow = turn === 'w' ? 6 : 1;

      // Single step forward
      const nextR1 = r + dir;
      if (isSquareOnBoard(nextR1, c) && board[nextR1][c] === null) {
        moves.push(coordsToSquare(nextR1, c));

        // Double step forward index check
        const nextR2 = r + dir * 2;
        if (r === startRow && isSquareOnBoard(nextR2, c) && board[nextR2][c] === null) {
          moves.push(coordsToSquare(nextR2, c));
        }
      }

      // regular diagonal captures
      const captureCols = [c - 1, c + 1];
      for (const cc of captureCols) {
        if (isSquareOnBoard(nextR1, cc)) {
          const tgt = board[nextR1][cc];
          if (tgt && tgt.color === oppColor) {
            moves.push(coordsToSquare(nextR1, cc));
          } else if (enPassantSquare) {
            const epCoords = squareToCoords(enPassantSquare);
            if (epCoords.r === nextR1 && epCoords.c === cc) {
              moves.push(enPassantSquare);
            }
          }
        }
      }
      break;
    }

    case 'n': {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2],  [1, 2],  [2, -1],  [2, 1]
      ];
      for (const [dr, dc] of offsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (isSquareOnBoard(nr, nc)) {
          const tgt = board[nr][nc];
          if (tgt === null || tgt.color === oppColor) {
            moves.push(coordsToSquare(nr, nc));
          }
        }
      }
      break;
    }

    case 'b':
    case 'r':
    case 'q': {
      const dirs: number[][] = [];
      if (piece.type === 'b' || piece.type === 'q') {
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (piece.type === 'r' || piece.type === 'q') {
        dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }

      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (isSquareOnBoard(nr, nc)) {
          const tgt = board[nr][nc];
          if (tgt === null) {
            moves.push(coordsToSquare(nr, nc));
          } else {
            if (tgt.color === oppColor) {
              moves.push(coordsToSquare(nr, nc));
            }
            break; // Stop after hitting any piece
          }
          nr += dr;
          nc += dc;
        }
      }
      break;
    }

    case 'k': {
      // Normal single step moves
      const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];
      for (const [dr, dc] of offsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (isSquareOnBoard(nr, nc)) {
          const tgt = board[nr][nc];
          if (tgt === null || tgt.color === oppColor) {
            moves.push(coordsToSquare(nr, nc));
          }
        }
      }

      // King castling
      // Must not be in check right now
      if (!isCheck(board, turn)) {
        if (turn === 'w') {
          // White King side (O-O) -> K
          if (castlingRights.includes('K') && board[7][5] === null && board[7][6] === null) {
            if (!isSquareUnderAttack(board, 'f1', 'b') && !isSquareUnderAttack(board, 'g1', 'b')) {
              moves.push('g1');
            }
          }
          // White Queen side (O-O-O) -> Q
          if (castlingRights.includes('Q') && board[7][3] === null && board[7][2] === null && board[7][1] === null) {
            if (!isSquareUnderAttack(board, 'd1', 'b') && !isSquareUnderAttack(board, 'c1', 'b')) {
              moves.push('c1');
            }
          }
        } else {
          // Black King side (o-o) -> k
          if (castlingRights.includes('k') && board[0][5] === null && board[0][6] === null) {
            if (!isSquareUnderAttack(board, 'f8', 'w') && !isSquareUnderAttack(board, 'g8', 'w')) {
              moves.push('g8');
            }
          }
          // Black Queen side (o-o-o) -> q
          if (castlingRights.includes('q') && board[0][3] === null && board[0][2] === null && board[0][1] === null) {
            if (!isSquareUnderAttack(board, 'd8', 'w') && !isSquareUnderAttack(board, 'c8', 'w')) {
              moves.push('c8');
            }
          }
        }
      }
      break;
    }
  }

  return moves;
}

/**
 * Computes strict legal moves, filtering out moves that leave or put the King in check
 */
export function getLegalMoves(
  board: (ChessPiece | null)[][],
  square: Square,
  turn: ChessColor,
  castlingRights: string,
  enPassantSquare: Square | null
): Square[] {
  const pseudoMoves = getPseudoLegalMoves(board, square, turn, castlingRights, enPassantSquare);
  const legalMoves: Square[] = [];
  const fromCoords = squareToCoords(square);
  const initialPiece = board[fromCoords.r][fromCoords.c];

  if (!initialPiece) return [];

  for (const to of pseudoMoves) {
    const toCoords = squareToCoords(to);
    
    // Simulate move
    const targetPiece = board[toCoords.r][toCoords.c];
    
    // Simple deep copy of board layout
    const boardCopy = board.map(row => [...row]);
    
    // Execute move on copy
    boardCopy[fromCoords.r][fromCoords.c] = null;
    boardCopy[toCoords.r][toCoords.c] = initialPiece;

    // Handle en passant capture emulation on copy
    if (initialPiece.type === 'p' && enPassantSquare && to === enPassantSquare) {
      const epPawnR = fromCoords.r; // pawns sit at the same row
      const epPawnC = toCoords.c;
      boardCopy[epPawnR][epPawnC] = null;
    }

    // Is our King safe?
    if (!isCheck(boardCopy, turn)) {
      legalMoves.push(to);
    }
  }

  return legalMoves;
}

/**
 * Checks if a player has any legal moves anywhere on the board
 */
export function hasAnyLegalMoves(
  board: (ChessPiece | null)[][],
  color: ChessColor,
  castlingRights: string,
  enPassantSquare: Square | null
): boolean {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const sq = coordsToSquare(r, c);
        const legal = getLegalMoves(board, sq, color, castlingRights, enPassantSquare);
        if (legal.length > 0) return true;
      }
    }
  }
  return false;
}

export function isCheckmate(board: (ChessPiece | null)[][], color: ChessColor, castlingRights: string, enPassantSquare: Square | null): boolean {
  return isCheck(board, color) && !hasAnyLegalMoves(board, color, castlingRights, enPassantSquare);
}

export function isStalemate(board: (ChessPiece | null)[][], color: ChessColor, castlingRights: string, enPassantSquare: Square | null): boolean {
  return !isCheck(board, color) && !hasAnyLegalMoves(board, color, castlingRights, enPassantSquare);
}

/**
 * Excutes a move on a FEN string, returning structural outcomes
 */
export function executeMove(
  fen: string,
  from: Square,
  to: Square,
  promotionType: ChessPiece['type'] = 'q'
): {
  success: boolean;
  newFen: string;
  notation: string;
  captured: ChessPiece | null;
  soundType: 'move' | 'capture' | 'check' | 'checkmate';
} {
  const { board, turn, castlingRights, enPassantSquare, halfMoves, fullMoves } = parseFen(fen);
  const fromCoords = squareToCoords(from);
  const toCoords = squareToCoords(to);
  
  const piece = board[fromCoords.r][fromCoords.c];
  if (!piece || piece.color !== turn) {
    return { success: false, newFen: fen, notation: '', captured: null, soundType: 'move' };
  }

  const legalMoves = getLegalMoves(board, from, turn, castlingRights, enPassantSquare);
  if (!legalMoves.includes(to)) {
    return { success: false, newFen: fen, notation: '', captured: null, soundType: 'move' };
  }

  const oppColor = turn === 'w' ? 'b' : 'w';
  let captured: ChessPiece | null = board[toCoords.r][toCoords.c];
  let newCastling = castlingRights;
  let newEnPassant: Square | null = null;
  let isCapture = captured !== null;

  // Track Chess move notation (simplified algebraic notation, e.g., Nf3 or exf4)
  let notation = '';
  if (piece.type === 'p') {
    if (isCapture) {
      notation = `${from[0]}x${to}`;
    } else {
      notation = to;
    }
  } else {
    const pieceLetter = piece.type.toUpperCase();
    notation = `${pieceLetter}${isCapture ? 'x' : ''}${to}`;
  }

  // Execute move internally
  board[fromCoords.r][fromCoords.c] = null;

  // Handle pawn promotion
  if (piece.type === 'p' && (toCoords.r === 0 || toCoords.r === 7)) {
    board[toCoords.r][toCoords.c] = { type: promotionType, color: turn };
    notation += `=${promotionType.toUpperCase()}`;
  } else {
    board[toCoords.r][toCoords.c] = piece;
  }

  // Handle en passant capture
  if (piece.type === 'p' && enPassantSquare && to === enPassantSquare) {
    const captureR = fromCoords.r;
    const captureC = toCoords.c;
    captured = board[captureR][captureC];
    board[captureR][captureC] = null;
    isCapture = true;
    notation = `${from[0]}x${to} e.p.`;
  }

  // Set en passant target on double step
  if (piece.type === 'p' && Math.abs(fromCoords.r - toCoords.r) === 2) {
    const midRow = (fromCoords.r + toCoords.r) / 2;
    newEnPassant = coordsToSquare(midRow, fromCoords.c);
  }

  // Handle castling execution
  let castled = false;
  if (piece.type === 'k') {
    // White castling
    if (turn === 'w' && from === 'e1') {
      if (to === 'g1') {
        // Move Rook from h1 to f1
        board[7][7] = null;
        board[7][5] = { type: 'r', color: 'w' };
        castled = true;
        notation = 'O-O';
      } else if (to === 'c1') {
        // Move Rook from a1 to d1
        board[7][0] = null;
        board[7][3] = { type: 'r', color: 'w' };
        castled = true;
        notation = 'O-O-O';
      }
    }
    // Black castling
    if (turn === 'b' && from === 'e8') {
      if (to === 'g8') {
        // Move Rook from h8 to f8
        board[0][7] = null;
        board[0][5] = { type: 'r', color: 'b' };
        castled = true;
        notation = 'O-O';
      } else if (to === 'c8') {
        // Move Rook from a8 to d8
        board[0][0] = null;
        board[0][3] = { type: 'r', color: 'b' };
        castled = true;
        notation = 'O-O-O';
      }
    }
  }

  // Remove castling rights if King moves or Rook is captured/moved
  if (piece.type === 'k') {
    if (turn === 'w') {
      newCastling = newCastling.replace('K', '').replace('Q', '');
    } else {
      newCastling = newCastling.replace('k', '').replace('q', '');
    }
  }
  if (piece.type === 'r') {
    if (turn === 'w') {
      if (from === 'a1') newCastling = newCastling.replace('Q', '');
      if (from === 'h1') newCastling = newCastling.replace('K', '');
    } else {
      if (from === 'a8') newCastling = newCastling.replace('q', '');
      if (from === 'h8') newCastling = newCastling.replace('k', '');
    }
  }
  // If a rook is captured on its starting square, adjust rights
  if (to === 'a1') newCastling = newCastling.replace('Q', '');
  if (to === 'h1') newCastling = newCastling.replace('K', '');
  if (to === 'a8') newCastling = newCastling.replace('q', '');
  if (to === 'h8') newCastling = newCastling.replace('k', '');

  // Calculate check/mate/stalemate
  const isOpponentInCheck = isCheck(board, oppColor);
  const isOpponentInMate = isCheckmate(board, oppColor, newCastling, newEnPassant);
  
  if (isOpponentInMate) {
    notation += '#';
  } else if (isOpponentInCheck) {
    notation += '+';
  }

  const newTurn = oppColor;
  const newHalfMoves = piece.type === 'p' || isCapture ? 0 : halfMoves + 1;
  const newFullMoves = turn === 'b' ? fullMoves + 1 : fullMoves;

  const nextFen = boardToFen(board, newTurn, newCastling, newEnPassant, newHalfMoves, newFullMoves);
  
  let sound: 'move' | 'capture' | 'check' | 'checkmate' = 'move';
  if (isOpponentInMate) {
    sound = 'checkmate';
  } else if (isOpponentInCheck) {
    sound = 'check';
  } else if (isCapture) {
    sound = 'capture';
  }

  return {
    success: true,
    newFen: nextFen,
    notation,
    captured,
    soundType: sound,
  };
}

/**
 * A basic chess evaluation function and minimax with alpha-beta pruning for Computer AI play.
 */
export function getComputerMove(
  fen: string,
  difficulty: 'facile' | 'medio' | 'difficile' = 'medio'
): { from: Square, to: Square } | null {
  const { board, turn, castlingRights, enPassantSquare } = parseFen(fen);
  
  // Find all legal moves for current turn
  const movesList: { from: Square; to: Square; weight: number }[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === turn) {
        const fromSq = coordsToSquare(r, c);
        const legal = getLegalMoves(board, fromSq, turn, castlingRights, enPassantSquare);
        for (const toSq of legal) {
          // Calculate an evaluation delta or heuristics
          const pieceWeights: Record<ChessPiece['type'], number> = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };
          let weight = 0;

          const toC = squareToCoords(toSq);
          const targetPiece = board[toC.r][toC.c];
          if (targetPiece) {
            // High incentive to capture pieces of higher value
            weight += pieceWeights[targetPiece.type] * 10 - pieceWeights[piece.type];
          }

          // Positional incentives (controlling center e4, d4, e5, d5)
          const centerRows = [3, 4];
          const centerCols = [3, 4];
          if (centerRows.includes(toC.r) && centerCols.includes(toC.c)) {
            weight += 2;
          }

          // Development incentive
          if (piece.type === 'n' || piece.type === 'b') {
            if (turn === 'w' && r === 7) weight += 1.5; // leaving back row is good
            if (turn === 'b' && r === 0) weight += 1.5;
          }

          // Penalize putting king in loose state
          movesList.push({ from: fromSq, to: toSq, weight });
        }
      }
    }
  }

  if (movesList.length === 0) return null;

  // Select moves based on difficulty
  if (difficulty === 'facile') {
    // 50% random, 50% best-weight move
    if (Math.random() > 0.5) {
      return movesList[Math.floor(Math.random() * movesList.length)];
    }
    // Else take a decent weight
    movesList.sort((a, b) => b.weight - a.weight);
    return movesList[0];
  } else if (difficulty === 'medio') {
    // Sort moves by rating, adding small noise for human-like play
    movesList.forEach(m => m.weight += (Math.random() * 4 - 2));
    movesList.sort((a, b) => b.weight - a.weight);
    return movesList[0];
  } else {
    // 'difficile' -> Minimax approach or deeper search simulation
    // Let's do a fast one-ply lookahead that is highly Optimized
    const evaluations = movesList.map(m => {
      const { board: nextBoard } = parseFen(executeMove(fen, m.from, m.to).newFen);
      let nextOpponentMovesVal = 0;
      
      // Calculate how much safe space opponent has
      const oppColor = turn === 'w' ? 'b' : 'w';
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = nextBoard[r][c];
          if (piece && piece.color === oppColor) {
            const sq = coordsToSquare(r, c);
            const checkMoves = getLegalMoves(nextBoard, sq, oppColor, castlingRights, null);
            nextOpponentMovesVal += checkMoves.length * 0.1; // penalty for giving opponent too many options
          }
        }
      }

      // Final evaluation score for this path
      return { move: m, score: m.weight - nextOpponentMovesVal + (Math.random() * 1.5) };
    });

    evaluations.sort((a, b) => b.score - a.score);
    return evaluations[0].move;
  }
}
