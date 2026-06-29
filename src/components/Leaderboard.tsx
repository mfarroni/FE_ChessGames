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
      className="glass-panel border-l border-[#2d2218] border-r border-[#2d2218] border-t border-[#2d2218] border-b border-[#2d2218] rounded-2xl p-5 shadow-2xl relative overflow-hidden flex flex-col h-full"
    >
      {/* Spotlight highlight underlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="flex items-center gap-2 mb-4 border-b border-amber-900/20 pb-3">
        <Trophy className="w-5 h-5 text-amber-500 animate-pulse" />
        <h2 className="font-serif text-base font-bold text-[#f5e8d0] uppercase tracking-wider">
          Classifica Maestri
        </h2>
      </div>

      <div className="overflow-y-auto flex-1 pr-1 max-h-[350px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-wider text-amber-500/70 border-b border-amber-950/40 pb-2">
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
                  className={`border-b border-amber-950/20 transition-all duration-300 hover:bg-amber-900/10 ${
                    isCurrentUser ? 'bg-amber-500/10 text-amber-300 font-semibold border-l-2 border-amber-500' : 'text-stone-300'
                  }`}
                >
                  <td className="py-3 pl-2 flex items-center justify-start">
                    {getRankBadge(idx)}
                  </td>
                  <td className="py-3 font-medium text-sm max-w-[120px] truncate">
                    {entry.name} {isCurrentUser && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded ml-1">Tu</span>}
                  </td>
                  <td className="py-3 text-right font-mono text-xs text-[#a87d55]">
                    {entry.wins}W - {entry.losses}L
                  </td>
                  <td className="py-3 text-right font-mono text-xs font-bold text-amber-400/90 pr-2">
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
