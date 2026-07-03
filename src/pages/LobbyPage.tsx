/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 03/07/2026 09:56:41 (Ora di Roma)
 * Problema Risolto: Estrazione della pagina Lobby (giocatori online, classifica, sfide, avvio partita) da App.tsx in una pagina instradata e protetta (/lobby).
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
          className="w-full max-w-2xl bg-gradient-to-r from-[#20150d] via-[#3d2414] to-[#20150d] border-2 border-amber-600/60 p-6 rounded-2xl shadow-[0_15px_45px_rgba(0,0,0,0.85)] text-center relative overflow-hidden mb-8 animate-pulse z-50"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none" />
          <h3 className="font-serif text-lg md:text-xl font-bold text-amber-100 flex items-center justify-center gap-2">
            <span>⚔️ Sfidante al Tavolo ⚔️</span>
          </h3>
          <p className="text-sm md:text-base text-amber-200 mt-2.5">
            Il giocatore <strong className="text-amber-400 font-serif font-black italic text-lg">{incomingChallenge.challengerName}</strong> vuole sfidarti: accetti o no?
          </p>
          <div className="flex items-center justify-center gap-4 mt-5">
            <button
              id="accept-challenge-btn"
              onClick={handleAcceptChallenge}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 text-emerald-100 font-serif font-bold text-xs rounded-xl border border-emerald-500/20 shadow-lg cursor-pointer transform transition hover:scale-105 active:scale-95 outline-none"
            >
              Accetto la sfida
            </button>
            <button
              id="decline-challenge-btn"
              onClick={handleDeclineChallenge}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-700 to-rose-950 hover:from-rose-600 hover:to-rose-850 text-rose-100 font-serif font-bold text-xs rounded-xl border border-rose-500/20 shadow-lg cursor-pointer transform transition hover:scale-105 active:scale-95 outline-none"
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
          className="w-full max-w-2xl bg-gradient-to-r from-[#140f0c] via-[#211712] to-[#140f0c] border border-amber-900/30 p-4 rounded-xl shadow-lg text-center mb-8 z-50 animate-pulse"
        >
          <p className="text-xs md:text-sm text-stone-400 font-mono flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            In attesa che <strong className="text-amber-500 font-serif font-bold italic">{pendingChallengeTarget}</strong> accetti o rifiuti la sfida...
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
            className="glass-panel border border-[#2d2218] rounded-2xl p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-48 h-48 bg-[radial-gradient(circle_at_right,rgba(217,119,6,0.06)_0%,transparent_70%)] pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-900/15 pb-4 mb-4">
              <div>
                <h3 className="font-serif text-xl font-black text-amber-100 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-500" /> Sfida l'Intelligenza Artificiale
                </h3>
                <p className="text-xs text-stone-400 mt-1">
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
                        ? 'bg-amber-800 text-amber-100 border border-amber-600/40 shadow-inner'
                        : 'bg-stone-900 text-stone-400 border border-stone-800'
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

            <div className="flex justify-between items-center bg-[#070504]/55 p-4 rounded-xl border border-amber-950/20">
              <span className="text-xs text-stone-400">Pronto per il match?</span>
              <button
                id="play-vs-ai-btn"
                onClick={startComputerMatch}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 font-bold text-xs rounded-lg border border-amber-500/15 shadow-md flex items-center gap-2 transform transition active:scale-95 outline-none cursor-pointer"
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
