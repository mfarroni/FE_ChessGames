/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Introduzione sistema di 3 temi colore accessibili (Scuro Elegante, Chiaro Pergamena, Alto Contrasto) selezionabili da ogni pagina, scacchiera esclusa.
 */

import React from 'react';
import { useSession } from '../session/useSession';
import PlayerList from '../components/PlayerList';
import Leaderboard from '../components/Leaderboard';
import { Cpu, ChevronRight } from 'lucide-react';
import { AudioEngine } from '../components/AudioEngine';

export default function LobbyPage() {
  const {
    player,
    onlinePlayers,
    leaderboard,
    handleChallengePlayer,
    lobbyPending,
    difficulty,
    setDifficulty,
    startComputerMatch,
    incomingChallenge,
    handleAcceptChallenge,
    handleDeclineChallenge,
    pendingChallengeTarget
  } = useSession();

  if (!player) return null;

  return (
    <div className="w-full flex flex-col items-center">

      {/* INCOMING CHALLENGE HANDSHAKE BANNER */}
      {incomingChallenge && (
        <div
          id="incoming-challenge-banner"
          className="w-full max-w-2xl bg-app-panel border-2 border-app-accent/60 p-6 rounded-2xl shadow-[0_15px_45px_rgba(0,0,0,0.85)] text-center relative overflow-hidden mb-8 animate-pulse z-50"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none" />
          <h3 className="font-serif text-lg md:text-xl font-bold text-app-text flex items-center justify-center gap-2">
            <span>⚔️ Sfidante al Tavolo ⚔️</span>
          </h3>
          <p className="text-sm md:text-base text-app-text mt-2.5">
            Il giocatore <strong className="text-app-accent font-serif font-black italic text-lg">{incomingChallenge.challengerName}</strong> vuole sfidarti: accetti o no?
          </p>
          <div className="flex items-center justify-center gap-4 mt-5">
            <button
              id="accept-challenge-btn"
              onClick={handleAcceptChallenge}
              className="px-6 py-2.5 bg-app-success-bg hover:opacity-90 text-app-success-text font-serif font-bold text-xs rounded-xl border border-app-success-text/40 shadow-lg cursor-pointer transform transition hover:scale-105 active:scale-95 outline-none"
            >
              Accetto la sfida
            </button>
            <button
              id="decline-challenge-btn"
              onClick={handleDeclineChallenge}
              className="px-6 py-2.5 bg-app-danger-bg hover:opacity-90 text-app-danger-text font-serif font-bold text-xs rounded-xl border border-app-danger-text/40 shadow-lg cursor-pointer transform transition hover:scale-105 active:scale-95 outline-none"
            >
              Rifiuto la sfida
            </button>
          </div>
        </div>
      )}

      {/* OUTGOING PENDING CHALLENGE STATUS */}
      {lobbyPending && pendingChallengeTarget && (
        <div
          id="outgoing-challenge-banner"
          className="w-full max-w-2xl bg-app-panel border border-app-border p-4 rounded-xl shadow-lg text-center mb-8 z-50 animate-pulse"
        >
          <p className="text-xs md:text-sm text-app-text-muted font-mono flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-app-accent animate-ping" />
            In attesa che <strong className="text-app-accent font-serif font-bold italic">{pendingChallengeTarget}</strong> accetti o rifiuti la sfida...
          </p>
        </div>
      )}

      {/* PLAYERS LOBBY SCREEN */}
      <div id="lobby-grid" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start duration-500 animate-fade-in">

        {/* Play options Panel */}
        <div className="lg:col-span-8 space-y-6">

          {/* Computer Offline Challenge Card */}
          <div
            id="ai-opponent-card"
            className="glass-panel border border-app-border rounded-2xl p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-48 h-48 bg-[radial-gradient(circle_at_right,rgba(217,119,6,0.06)_0%,transparent_70%)] pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-app-border pb-4 mb-4">
              <div>
                <h3 className="font-serif text-xl font-black text-app-text flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-app-accent" /> Sfida l'Intelligenza Artificiale
                </h3>
                <p className="text-xs text-app-text-muted mt-1">
                  Gioca offline contro il motore euristico locale. Ottimo per fare pratica immediata.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(['facile', 'medio', 'difficile'] as const).map((diff) => (
                  <button
                    key={diff}
                    id={`ai-diff-${diff}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all outline-none cursor-pointer ${
                      difficulty === diff
                        ? 'bg-app-accent text-app-on-accent border border-app-accent shadow-inner'
                        : 'bg-app-panel text-app-text-muted border border-app-border'
                    }`}
                    onClick={() => {
                      setDifficulty(diff);
                      AudioEngine.playTick();
                    }}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center bg-app-bg/55 p-4 rounded-xl border border-app-border">
              <span className="text-xs text-app-text-muted">Pronto per il match?</span>
              <button
                id="play-vs-ai-btn"
                onClick={startComputerMatch}
                className="px-5 py-2.5 bg-app-accent hover:bg-app-accent-hover text-app-on-accent font-bold text-xs rounded-lg border border-app-accent shadow-md flex items-center gap-2 transform transition active:scale-95 outline-none cursor-pointer"
              >
                Avvia Partita Locale <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Online Real-Time Multiplayer Card */}
          <div id="online-players-card">
            <PlayerList
              players={onlinePlayers}
              currentPlayerId={player.id}
              onChallenge={handleChallengePlayer}
              isLobbyPending={lobbyPending}
            />
          </div>
        </div>

        {/* Sidebar Leaderboards Panel */}
        <div className="lg:col-span-4">
          <Leaderboard
            entries={leaderboard}
            currentUsername={player.name}
          />
        </div>

      </div>
    </div>
  );
}
