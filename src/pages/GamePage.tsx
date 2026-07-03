/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 03/07/2026 09:56:41 (Ora di Roma)
 * Problema Risolto: Estrazione della pagina Partita (scacchiera, mosse, chat, esito) da App.tsx in una pagina instradata e protetta (/game), che richiede una partita attiva.
 */

import React from 'react';
import { useSession } from '../session/useSession';
import ChessBoard from '../components/ChessBoard';
import Chat from '../components/Chat';
import { Award } from 'lucide-react';

export default function GamePage() {
  const {
    player,
    activeGame,
    playerColor,
    isAiThinking,
    handleChessMove,
    handleSendChatMessage,
    handleResign,
    quitToLobby
  } = useSession();

  if (!player || !activeGame) return null;

  const opponent = activeGame.isVsComputer
    ? activeGame.blackPlayer
    : (playerColor === 'w' ? activeGame.blackPlayer : activeGame.whitePlayer);

  const selfPlayer = activeGame.isVsComputer
    ? activeGame.whitePlayer
    : (playerColor === 'w' ? activeGame.whitePlayer : activeGame.blackPlayer);

  return (
    <>
      <div id="active-game-screen" className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start duration-500 animate-fade-in">

        {/* Large Interactive Chess Panel */}
        <div className="lg:col-span-8 flex flex-col items-center">

          {/* Top Bar Turn Monitor */}
          <div className="w-full flex justify-between items-center bg-[#15110d] border border-[#2d2218] px-5 py-3 rounded-2xl mb-4 shadow-lg select-none">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${activeGame.turn === 'w' ? 'bg-amber-100 border border-stone-300' : 'bg-stone-900 border border-[#2d2218]'} ring-2 ring-amber-500/30 animate-pulse`} />
              <span className="text-xs text-stone-300 font-medium">
                Tocca a: <strong className="text-amber-400 capitalize">{activeGame.turn === 'w' ? 'Bianco' : 'Nero'}</strong>
              </span>
              {isAiThinking && (
                <span className="text-[10px] text-amber-600 font-mono animate-pulse ml-2">
                  (Il Computer sta pensando...)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-mono">
                Partita: {activeGame.isVsComputer ? `Computer AI (${activeGame.difficulty})` : 'Online multiplayer'}
              </span>
            </div>
          </div>

          {/* Opponent Profile Card */}
          <div className="w-full flex items-center justify-between bg-stone-950/40 border border-[#2d2218]/40 px-4 py-2.5 rounded-xl mb-3 shadow select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-stone-900 border border-amber-900/20 flex items-center justify-center text-xs font-serif">
                {opponent.id === 'computer' ? '🤖' : '👤'}
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-200">
                  Avversario: <span className="text-amber-100 font-serif font-bold italic">{opponent.name}</span>
                </p>
                <p className="text-[10px] text-stone-500 font-mono">Rating: {opponent.rating} Elo</p>
              </div>
            </div>
            {activeGame.turn === (playerColor === 'w' ? 'b' : 'w') && (
              <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded animate-pulse font-mono uppercase tracking-wider">
                Sta pensando...
              </span>
            )}
          </div>

          <ChessBoard
            game={activeGame}
            playerColor={playerColor}
            interactive={activeGame.status === 'attivo'}
            onMove={handleChessMove}
          />

          {/* Self Profile Card */}
          <div className="w-full flex items-center justify-between bg-stone-950/40 border border-[#2d2218]/40 px-4 py-2.5 rounded-xl mt-3 shadow select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-stone-900 border border-amber-900/20 flex items-center justify-center text-xs font-serif text-amber-500">
                👤
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-300">
                  Tu: <span className="text-stone-100 font-serif font-bold italic">{selfPlayer?.name || player.name}</span>
                </p>
                <p className="text-[10px] text-stone-500 font-mono">Rating: {selfPlayer?.rating || player.rating} Elo</p>
              </div>
            </div>
            {activeGame.turn === playerColor && (
              <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded animate-pulse font-mono uppercase tracking-wider">
                Tocca a te!
              </span>
            )}
          </div>
        </div>

        {/* Sidebar drawer: Chats, logs and actions */}
        <div className="lg:col-span-4 space-y-6">

          {/* Chess Match Actions & Notation lists */}
          <div className="glass-panel border border-[#2d2218] p-5 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[300px]">
            <div className="flex items-center justify-between mb-3 border-b border-amber-950/40 pb-2.5">
              <span className="font-serif text-sm font-bold text-amber-100 tracking-wider">
                Cronologia Mosse
              </span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>

            {/* Staggered moves records in classic desktop chess form */}
            <div className="flex-1 overflow-y-auto font-mono text-xs text-stone-400 space-y-1.5 max-h-[140px] pr-1">
              {activeGame.moves.length === 0 ? (
                <p className="text-stone-600 italic text-center text-xs py-4">Nessuna mossa ancora.</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-2">
                  {activeGame.moves.reduce((acc: string[][], m, i) => {
                    if (i % 2 === 0) {
                      acc.push([`${Math.floor(i / 2) + 1}. ${m.notation}`]);
                    } else {
                      acc[acc.length - 1].push(m.notation);
                    }
                    return acc;
                  }, []).map((round, index) => (
                    <div key={`m_${index}`} className="flex justify-between border-b border-amber-950/10 py-1 font-semibold">
                      <span className="text-amber-500/90">{round[0]}</span>
                      <span className="text-stone-300 pr-4">{round[1] || ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-amber-950/40 flex gap-3">
              <button
                id="resign-current-match-btn"
                disabled={activeGame.status !== 'attivo'}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all outline-none duration-150 cursor-pointer ${
                  activeGame.status !== 'attivo'
                    ? 'bg-stone-800 text-stone-600 border border-stone-900 cursor-not-allowed opacity-55'
                    : 'bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-900/30 active:scale-95'
                }`}
                onClick={handleResign}
              >
                Abbandona Partita
              </button>

              <button
                id="lobby-return-quit-btn"
                className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-bold border border-stone-800 rounded-xl transition-all duration-150 active:scale-95 outline-none cursor-pointer"
                onClick={quitToLobby}
              >
                Torna alla Lobby
              </button>
            </div>
          </div>

          {/* Chat room sync drawer */}
          <Chat
            messages={activeGame.chat}
            playerUsername={player.name}
            onSendMessage={handleSendChatMessage}
          />

        </div>

      </div>

      {/* MATCH TERMINAL STATE OUTCOME MODALS OVERLAY */}
      {(activeGame.status === 'scacco_matto' || activeGame.status === 'patta' || activeGame.status === 'abbandono') && (
        <div id="match-outcome-popup" className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-6 duration-300">
          <div className="bg-gradient-to-b from-[#251711] to-[#0c0806] border-2 border-amber-600/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.1)_0%,transparent_70%)] pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-amber-950/25 border border-amber-500/25 flex items-center justify-center mx-auto mb-4 text-amber-400">
              <Award className="w-9 h-9 animate-bounce" />
            </div>

            <h2 className="font-serif text-2xl font-black text-amber-100 mb-2">
              Partita Conclusa
            </h2>

            <div className="my-5 p-4 bg-stone-950/60 rounded-xl border border-amber-950/30">
              {activeGame.status === 'scacco_matto' && (
                <div>
                  <p className="text-sm text-stone-300">
                    Fine della partita per <strong className="text-amber-400">Scacco Matto</strong>!
                  </p>
                  <p className="text-xs text-stone-500 mt-1.5">
                    Vincitore: <strong className="text-amber-200">
                      {activeGame.winnerId === player.id ? 'Tu' : (activeGame.winnerId === 'computer' ? 'Computer AI' : 'Il tuo avversario')}
                    </strong>
                  </p>
                </div>
              )}

              {activeGame.status === 'abbandono' && (
                <div>
                  <p className="text-sm text-stone-300">
                    La partita si è conclusa per <strong className="text-amber-400">Abbandono</strong>.
                  </p>
                  <p className="text-xs text-stone-400 mt-1.5">
                    {activeGame.winnerId === player.id ? 'Hai vinto la partita!' : 'Il tuo avversario ha vinto la partita.'}
                  </p>
                </div>
              )}

              {activeGame.status === 'patta' && (
                <p className="text-sm text-stone-300">
                  La partita si è conclusa in parità per <strong className="text-amber-400">Stallo</strong>.
                </p>
              )}
            </div>

            <button
              id="close-match-outcome-btn"
              className="px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 rounded-xl font-bold text-xs border border-amber-500/10 shadow-lg cursor-pointer transform transition active:scale-95 outline-none w-full"
              onClick={quitToLobby}
            >
              Ritorna alla Lobby
            </button>
          </div>
        </div>
      )}
    </>
  );
}
