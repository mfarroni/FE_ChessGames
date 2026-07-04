/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Introduzione sistema di 3 temi colore accessibili (Scuro Elegante, Chiaro Pergamena, Alto Contrasto) selezionabili da ogni pagina, scacchiera esclusa.
 */

import React from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Award, Medal } from 'lucide-react';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUsername?: string;
}

export default function Leaderboard({ entries, currentUsername }: LeaderboardProps) {
  // Sort entries descendingly by Elo
  const sorted = [...entries].sort((a, b) => b.rating - a.rating);

  const getRankBadge = (idx: number) => {
    switch (idx) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />;
      case 1:
        return <Award className="w-5 h-5 text-stone-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />;
      default:
        return <span className="font-mono text-xs text-stone-500 w-5 text-center">{idx + 1}</span>;
    }
  };

  return (
    <div
      id="leaderboard-card-container"
      className="glass-panel border border-app-border rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col h-full"
    >
      {/* Spotlight highlight underlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="flex items-center gap-2 mb-4 border-b border-app-border pb-3">
        <Trophy className="w-5 h-5 text-app-accent animate-pulse" />
        <h2 className="font-serif text-base font-bold text-app-text uppercase tracking-wider">
          Classifica Maestri
        </h2>
      </div>

      <div className="overflow-y-auto flex-1 pr-1 max-h-[350px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-wider text-app-text-muted border-b border-app-border pb-2">
              <th className="py-2 pl-2">Pos</th>
              <th className="py-2">Giocatore</th>
              <th className="py-2 text-right">W/L</th>
              <th className="py-2 text-right pr-2">Rating</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry, idx) => {
              const isCurrentUser = currentUsername && entry.name.toLowerCase() === currentUsername.toLowerCase();
              return (
                <tr
                  key={`${entry.name}_${idx}`}
                  className={`border-b border-app-border/60 transition-all duration-300 hover:bg-app-accent/10 ${
                    isCurrentUser ? 'bg-app-accent/10 text-app-accent font-semibold border-l-2 border-app-accent' : 'text-app-text'
                  }`}
                >
                  <td className="py-3 pl-2 flex items-center justify-start">
                    {getRankBadge(idx)}
                  </td>
                  <td className="py-3 font-medium text-sm max-w-[120px] truncate">
                    {entry.name} {isCurrentUser && <span className="text-[9px] bg-app-accent/20 text-app-accent px-1 py-0.5 rounded ml-1">Tu</span>}
                  </td>
                  <td className="py-3 text-right font-mono text-xs text-app-text-muted">
                    {entry.wins}W - {entry.losses}L
                  </td>
                  <td className="py-3 text-right font-mono text-xs font-bold text-app-accent pr-2">
                    {entry.rating}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
