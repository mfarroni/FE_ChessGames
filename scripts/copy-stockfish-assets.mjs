/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 06/07/2026 10:20:54 (Ora di Roma)
 * Problema Risolto: Introduzione dello script postinstall che copia la build
 * "lite-single" (WASM, single-thread, nessun requisito di header COOP/COEP)
 * del motore Stockfish.js da node_modules/stockfish/bin in public/stockfish,
 * cartella servita come asset statico dal frontend per l'analisi post-partita
 * eseguita interamente lato client. I file dell'engine NON vengono committati
 * (vedi .gitignore): vengono rigenerati ad ogni `npm install` (incluso il
 * deploy su Vercel, che reinstalla le dipendenze da zero).
 */

import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

const stockfishPkgDir = join(repoRoot, 'node_modules', 'stockfish');
const stockfishBinDir = join(stockfishPkgDir, 'bin');
const stockfishPkgJsonPath = join(stockfishPkgDir, 'package.json');

const destDir = join(repoRoot, 'public', 'stockfish');

function fail(message) {
  console.error(`[copy-stockfish-assets] ${message}`);
  process.exit(1);
}

if (!existsSync(stockfishPkgJsonPath)) {
  fail(`Pacchetto "stockfish" non trovato in ${stockfishPkgDir}. Esegui prima "npm install".`);
}

const stockfishPkgJson = JSON.parse(readFileSync(stockfishPkgJsonPath, 'utf-8'));
const buildVersion = stockfishPkgJson.buildVersion;

if (!buildVersion) {
  fail('Impossibile determinare "buildVersion" dal package.json del pacchetto stockfish.');
}

// Build "lite-single": WASM single-thread (~7MB), non richiede header
// COOP/COEP. Più debole della build multi-thread/NNUE completa, ma
// nettamente più forte di qualsiasi giocatore umano ed eseguibile senza
// configurazione server aggiuntiva.
const baseName = `stockfish-${buildVersion}-lite-single`;
const filesToCopy = [`${baseName}.js`, `${baseName}.wasm`];

for (const fileName of filesToCopy) {
  const sourcePath = join(stockfishBinDir, fileName);
  if (!existsSync(sourcePath)) {
    fail(
      `File atteso non trovato: ${sourcePath}. Il nome dei file della build ` +
      `"lite-single" potrebbe essere cambiato in questa versione del pacchetto ` +
      `stockfish (buildVersion=${buildVersion}). Ispeziona node_modules/stockfish/bin ` +
      `per il nome reale.`
    );
  }
}

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

for (const fileName of filesToCopy) {
  copyFileSync(join(stockfishBinDir, fileName), join(destDir, fileName));
  console.log(`[copy-stockfish-assets] Copiato ${fileName} -> public/stockfish/`);
}

console.log('[copy-stockfish-assets] Asset engine Stockfish (lite-single) pronti in public/stockfish/.');
