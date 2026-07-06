/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 06/07/2026 10:20:54 (Ora di Roma)
 * Problema Risolto: Introduzione del client Stockfish.js (build "lite-single",
 * WASM single-thread) eseguito interamente lato client tramite Web Worker,
 * per l'analisi post-partita. Nessuna chiamata al backend: il motore gira
 * sempre nel browser dell'utente.
 */

/**
 * Percorso statico del worker Stockfish, copiato in public/stockfish da
 * scripts/copy-stockfish-assets.mjs (eseguito come postinstall). Il file
 * .wasm associato viene risolto dal worker stesso in base al proprio path,
 * quindi il nome base deve restare invariato rispetto a quello copiato.
 */
const STOCKFISH_WORKER_PATH = '/stockfish/stockfish-18-lite-single.js';

export type UciScoreType = 'cp' | 'mate';

export interface PositionAnalysis {
  scoreType: UciScoreType;
  scoreValue: number;
  bestMoveUci: string;
}

/** Risultato di analisi associato alla posizione FEN che lo ha generato. */
export interface FenAnalysisResult extends PositionAnalysis {
  fen: string;
}

export interface StockfishEngine {
  worker: Worker;
  /**
   * Coda che serializza i comandi UCI inviati al worker: il protocollo UCI è
   * uno stream stateful (una sola "posizione in analisi" alla volta), quindi
   * non è mai corretto lanciare più `go`/`position` in parallelo sullo
   * stesso worker.
   */
  queue: Promise<void>;
}

function parseInfoLine(line: string): Partial<PositionAnalysis> | null {
  if (!line.startsWith('info')) return null;

  const mateMatch = line.match(/\bscore mate (-?\d+)/);
  if (mateMatch) {
    return { scoreType: 'mate', scoreValue: parseInt(mateMatch[1], 10) };
  }

  const cpMatch = line.match(/\bscore cp (-?\d+)/);
  if (cpMatch) {
    return { scoreType: 'cp', scoreValue: parseInt(cpMatch[1], 10) };
  }

  return null;
}

/**
 * Accoda un'operazione asincrona sul motore, garantendo che venga eseguita
 * solo dopo il completamento di tutte quelle accodate in precedenza.
 */
function withQueue<T>(engine: StockfishEngine, executor: () => Promise<T>): Promise<T> {
  const result = engine.queue.then(executor, executor);
  // La coda prosegue comunque, anche se questo passo fallisce, per non
  // bloccare in modo permanente le richieste successive.
  engine.queue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

/**
 * Invia uno o più comandi UCI (tramite `send`) e attende che una riga di
 * output soddisfi `isDone`, risolvendo con tutte le righe ricevute nel
 * frattempo.
 */
function waitForEngineLine(
  worker: Worker,
  send: () => void,
  isDone: (line: string) => boolean,
  onLine?: (line: string) => void
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const lines: string[] = [];

    const cleanup = () => {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleError);
    };

    const handleMessage = (event: MessageEvent<string>) => {
      const line = String(event.data);
      lines.push(line);
      onLine?.(line);
      if (isDone(line)) {
        cleanup();
        resolve(lines);
      }
    };

    const handleError = (event: ErrorEvent) => {
      cleanup();
      reject(new Error(event.message || 'Errore nel Web Worker di Stockfish.'));
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    send();
  });
}

/**
 * Crea un nuovo Worker Stockfish (non ancora pronto per l'analisi: va
 * inizializzato con `initEngine`). Lancia un errore leggibile se il browser
 * non supporta i Web Worker, in modo che il chiamante possa gestirlo senza
 * un'eccezione non gestita.
 */
export function createEngine(): StockfishEngine {
  if (typeof Worker === 'undefined') {
    throw new Error('Il browser non supporta i Web Worker: analisi non disponibile.');
  }

  const worker = new Worker(STOCKFISH_WORKER_PATH);
  return { worker, queue: Promise.resolve() };
}

/**
 * Esegue l'handshake UCI (`uci` -> `uciok`, `isready` -> `readyok`) e avvia
 * una nuova partita lato motore (`ucinewgame`). Va chiamata una sola volta
 * dopo `createEngine()` e prima di qualsiasi `analyzePosition`.
 */
export async function initEngine(engine: StockfishEngine): Promise<void> {
  await withQueue(engine, () =>
    waitForEngineLine(
      engine.worker,
      () => engine.worker.postMessage('uci'),
      (line) => line.trim() === 'uciok'
    )
  );

  await withQueue(engine, () =>
    waitForEngineLine(
      engine.worker,
      () => engine.worker.postMessage('isready'),
      (line) => line.trim() === 'readyok'
    )
  );

  // 'ucinewgame' non produce output: si sincronizza con un successivo
  // 'isready', inviato solo dopo che 'ucinewgame' è già stato consegnato.
  await withQueue(engine, () =>
    waitForEngineLine(
      engine.worker,
      () => {
        engine.worker.postMessage('ucinewgame');
        engine.worker.postMessage('isready');
      },
      (line) => line.trim() === 'readyok'
    )
  );
}

/**
 * Analizza una posizione FEN fino alla profondità richiesta. Risolve con
 * l'ultima valutazione `info score cp|mate` ricevuta e la mossa migliore
 * (`bestmove`, notazione UCI, es. "e2e4" o "e7e8q").
 */
export async function analyzePosition(
  engine: StockfishEngine,
  fen: string,
  depth = 14
): Promise<PositionAnalysis> {
  return withQueue(
    engine,
    () =>
      new Promise<PositionAnalysis>((resolve, reject) => {
        let lastScore: { scoreType: UciScoreType; scoreValue: number } | null = null;

        const cleanup = () => {
          engine.worker.removeEventListener('message', handleMessage);
          engine.worker.removeEventListener('error', handleError);
        };

        const handleMessage = (event: MessageEvent<string>) => {
          const line = String(event.data);
          const info = parseInfoLine(line);
          if (info && info.scoreType !== undefined && info.scoreValue !== undefined) {
            lastScore = { scoreType: info.scoreType, scoreValue: info.scoreValue };
          }

          if (line.startsWith('bestmove')) {
            cleanup();
            const bestMoveUci = line.split(/\s+/)[1] || '';
            resolve({
              scoreType: lastScore?.scoreType ?? 'cp',
              scoreValue: lastScore?.scoreValue ?? 0,
              bestMoveUci,
            });
          }
        };

        const handleError = (event: ErrorEvent) => {
          cleanup();
          reject(new Error(event.message || 'Errore nel Web Worker di Stockfish.'));
        };

        engine.worker.addEventListener('message', handleMessage);
        engine.worker.addEventListener('error', handleError);

        // Comandi inviati atomicamente all'interno dello stesso slot di coda:
        // nessun'altra richiesta può inframezzarsi tra 'position' e 'go'.
        engine.worker.postMessage(`position fen ${fen}`);
        engine.worker.postMessage(`go depth ${depth}`);
      })
  );
}

/** Termina il Worker del motore, liberando le risorse del browser. */
export function terminateEngine(engine: StockfishEngine): void {
  try {
    engine.worker.postMessage('quit');
  } catch {
    // Il worker potrebbe già essere in fase di terminazione: ignoriamo.
  }
  engine.worker.terminate();
}
