/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 06/07/2026 10:20:54 (Ora di Roma)
 * Problema Risolto: Introduzione della pagina di analisi post-partita
 * (route /analisi), che monta <AnalysisReport /> sulla partita attiva letta
 * dal contesto di sessione. `activeGame` resta valido dopo la navigazione
 * (viene azzerato solo da quitToLobby): non viene passato via
 * location.state. Il caso di refresh/stato mancante è già gestito da
 * <ProtectedRoute requireActiveGame>, che reindirizza a /lobby.
 */

import React from 'react';
import { useSession } from '../session/useSession';
import AnalysisReport from '../components/AnalysisReport';

export default function GameAnalysisPage() {
  const { activeGame } = useSession();

  if (!activeGame) return null;

  return (
    <div id="game-analysis-screen" className="w-full duration-500 animate-fade-in">
      <AnalysisReport game={activeGame} />
    </div>
  );
}
