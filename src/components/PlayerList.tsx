/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Introduzione sistema di 3 temi colore accessibili (Scuro Elegante, Chiaro Pergamena, Alto Contrasto) selezionabili da ogni pagina, scacchiera esclusa.
 */

import React from 'react';
import { Player } from '../types';
import { Users, Swords, Play, ShieldAlert } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
  onChallenge: (targetId: string) => void;
  isLobbyPending: boolean;
}

export default function PlayerList({ players, currentPlayerId, onChallenge, isLobbyPending }: PlayerListProps) {
  // Sort self to the top, then waiting players, then busy players
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === currentPlayerId) return -1;
    if (b.id === currentPlayerId) return 1;
    if (a.status === 'attesa' && b.status === 'occupato') return -1;
    if (a.status === 'occupato' && b.status === 'attesa') return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div id="lobby-player-list" className="glass-panel border border-app-border rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col h-full">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.04)_0%,transparent_70%)] pointer-events-none" />
      <div className="flex items-center justify-between mb-4 border-b border-app-border pb-3 relative z-10">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-app-accent" />
          <h2 className="font-serif text-base font-bold text-app-text uppercase tracking-wider">
            Giocatori Connessi
          </h2>
        </div>
        <span className="bg-app-bg text-app-accent font-mono text-xs px-2.5 py-1 rounded-full border border-app-border">
          {players.length} Online
        </span>
      </div>

      <div className="overflow-y-auto flex-1 max-h-[350px] pr-1 space-y-2.5 relative z-10">
        {sortedPlayers.map((player) => {
          const isSelf = player.id === currentPlayerId;
          const isBusy = player.status === 'occupato';

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                isSelf
                  ? 'bg-app-accent/10 border-app-accent/40 shadow-inner'
                  : 'bg-app-panel/50 border-app-border hover:border-app-accent/40'
              }`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${isSelf ? 'text-app-accent' : 'text-app-text'}`}>
                    {player.name}
                  </span>
                  {isSelf && (
                    <span className="text-[9px] bg-app-accent/10 text-app-accent border border-app-accent/30 px-1.5 py-0.2 rounded font-semibold">
                      Tu
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${isBusy ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-emerald-500 shadow-[0_0_6px_#10b981]'}`} />
                  <span className="text-xs text-app-text-muted font-mono lowercase">
                    {isBusy ? 'occupato' : 'in attesa'}
                  </span>
                  <span className="text-app-text-muted font-mono text-xs">•</span>
                  <span className="text-xs text-app-text-muted font-mono font-semibold">
                    {player.rating} Elo
                  </span>
                </div>
              </div>

              {!isSelf && (
                <button
                  id={`challenge-btn-${player.id}`}
                  disabled={isBusy || isLobbyPending}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all outline-none duration-150 cursor-pointer ${
                    isBusy
                      ? 'bg-app-panel text-app-text-muted border border-app-border cursor-not-allowed opacity-50'
                      : 'bg-app-accent text-app-on-accent border border-app-accent hover:bg-app-accent-hover active:scale-95 shadow-md'
                  }`}
                  onClick={() => onChallenge(player.id)}
                >
                  <Swords className="w-3.5 h-3.5" />
                  Sfidaci
                </button>
              )}
            </div>
          );
        })}

        {players.length <= 1 && (
          <div className="flex flex-col items-center justify-center p-6 text-center text-app-text-muted">
            <ShieldAlert className="w-8 h-8 text-app-text-muted mb-2" />
            <p className="text-xs">
              Attendi che altri sfidanti si connettano, oppure gioca subito contro il Computer AI!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
