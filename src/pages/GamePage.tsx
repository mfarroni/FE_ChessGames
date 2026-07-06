/**
 * Versione: 1.2.0
 * Data e Ora Modifica: 06/07/2026 10:20:54 (Ora di Roma)
 * Problema Risolto: Aggiunta del pulsante "Analizza Partita" nel popup di
 * fine partita, che porta alla nuova route /analisi (report post-partita
 * con Stockfish.js) senza chiamare quitToLobby, per non azzerare
 * activeGame prima di arrivare al report.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../session/useSession';
import ChessBoard from '../components/ChessBoard';
import Chat from '../components/Chat';
import { Award, BarChart3 } from 'lucide-react';

export default function GamePage() {
  const navigate = useNavigate();
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
          <div className="w-full flex justify-between items-center bg-app-panel border border-app-border px-5 py-3 rounded-2xl mb-4 shadow-lg select-none">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${activeGame.turn === 'w' ? 'bg-amber-100 border border-stone-300' : 'bg-stone-900 border border-[#2d2218]'} ring-2 ring-app-accent/30 animate-pulse`} />
              <span className="text-xs text-app-text font-medium">
                Tocca a: <strong className="text-app-accent capitalize">{activeGame.turn === 'w' ? 'Bianco' : 'Nero'}</strong>
              </span>
              {isAiThinking && (
                <span className="text-[10px] text-app-text-muted font-mono animate-pulse ml-2">
                  (Il Computer sta pensando...)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-app-text-muted font-mono">
                Partita: {activeGame.isVsComputer ? `Computer AI (${activeGame.difficulty})` : 'Online multiplayer'}
              </span>
            </div>
          </div>

          {/* Opponent Profile Card */}
          <div className="w-full flex items-center justify-between bg-app-panel/60 border border-app-border/60 px-4 py-2.5 rounded-xl mb-3 shadow select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-app-bg border border-app-border flex items-center justify-center text-xs font-serif">
                {opponent.id === 'computer' ? '🤖' : '👤'}
              </div>
              <div>
                <p className="text-xs font-semibold text-app-text">
                  Avversario: <span className="text-app-text font-serif font-bold italic">{opponent.name}</span>
                </p>
                <p className="text-[10px] text-app-text-muted font-mono">Rating: {opponent.rating} Elo</p>
              </div>
            </div>
            {activeGame.turn === (playerColor === 'w' ? 'b' : 'w') && (
              <span className="text-[9px] bg-app-accent/10 text-app-accent border border-app-accent/30 px-2 py-0.5 rounded animate-pulse font-mono uppercase tracking-wider">
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
          <div className="w-full flex items-center justify-between bg-app-panel/60 border border-app-border/60 px-4 py-2.5 rounded-xl mt-3 shadow select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-app-bg border border-app-border flex items-center justify-center text-xs font-serif text-app-accent">
                👤
              </div>
              <div>
                <p className="text-xs font-semibold text-app-text">
                  Tu: <span className="text-app-text font-serif font-bold italic">{selfPlayer?.name || player.name}</span>
                </p>
                <p className="text-[10px] text-app-text-muted font-mono">Rating: {selfPlayer?.rating || player.rating} Elo</p>
              </div>
            </div>
            {activeGame.turn === playerColor && (
              <span className="text-[9px] bg-app-success-bg text-app-success-text border border-app-success-text/30 px-2 py-0.5 rounded animate-pulse font-mono uppercase tracking-wider">
                Tocca a te!
              </span>
            )}
          </div>
        </div>

        {/* Sidebar drawer: Chats, logs and actions */}
        <div className="lg:col-span-4 space-y-6">

          {/* Chess Match Actions & Notation lists */}
          <div className="glass-panel border border-app-border p-5 rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[300px]">
            <div className="flex items-center justify-between mb-3 border-b border-app-border pb-2.5">
              <span className="font-serif text-sm font-bold text-app-text tracking-wider">
                Cronologia Mosse
              </span>
              <Award className="w-4 h-4 text-app-accent" />
            </div>

            {/* Staggered moves records in classic desktop chess form */}
            <div className="flex-1 overflow-y-auto font-mono text-xs text-app-text-muted space-y-1.5 max-h-[140px] pr-1">
              {activeGame.moves.length === 0 ? (
                <p className="text-app-text-muted italic text-center text-xs py-4">Nessuna mossa ancora.</p>
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
                    <div key={`m_${index}`} className="flex justify-between border-b border-app-border/40 py-1 font-semibold">
                      <span className="text-app-accent">{round[0]}</span>
                      <span className="text-app-text pr-4">{round[1] || ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-app-border flex gap-3">
              <button
                id="resign-current-match-btn"
                disabled={activeGame.status !== 'attivo'}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all outline-none duration-150 cursor-pointer ${
                  activeGame.status !== 'attivo'
                    ? 'bg-app-panel text-app-text-muted border border-app-border cursor-not-allowed opacity-55'
                    : 'bg-app-danger-bg hover:opacity-90 text-app-danger-text border border-app-danger-text/30 active:scale-95'
                }`}
                onClick={handleResign}
              >
                Abbandona Partita
              </button>

              <button
                id="lobby-return-quit-btn"
                className="flex-1 py-2 bg-app-panel hover:bg-app-panel/70 text-app-text text-xs font-bold border border-app-border rounded-xl transition-all duration-150 active:scale-95 outline-none cursor-pointer"
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
          <div className="bg-app-panel border-2 border-app-accent/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative">

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.1)_0%,transparent_70%)] pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-app-accent/15 border border-app-accent/30 flex items-center justify-center mx-auto mb-4 text-app-accent">
              <Award className="w-9 h-9 animate-bounce" />
            </div>

            <h2 className="font-serif text-2xl font-black text-app-text mb-2">
              Partita Conclusa
            </h2>

            <div className="my-5 p-4 bg-app-bg/60 rounded-xl border border-app-border">
              {activeGame.status === 'scacco_matto' && (
                <div>
                  <p className="text-sm text-app-text">
                    Fine della partita per <strong className="text-app-accent">Scacco Matto</strong>!
                  </p>
                  <p className="text-xs text-app-text-muted mt-1.5">
                    Vincitore: <strong className="text-app-text">
                      {activeGame.winnerId === player.id ? 'Tu' : (activeGame.winnerId === 'computer' ? 'Computer AI' : 'Il tuo avversario')}
                    </strong>
                  </p>
                </div>
              )}

              {activeGame.status === 'abbandono' && (
                <div>
                  <p className="text-sm text-app-text">
                    La partita si è conclusa per <strong className="text-app-accent">Abbandono</strong>.
                  </p>
                  <p className="text-xs text-app-text-muted mt-1.5">
                    {activeGame.winnerId === player.id ? 'Hai vinto la partita!' : 'Il tuo avversario ha vinto la partita.'}
                  </p>
                </div>
              )}

              {activeGame.status === 'patta' && (
                <p className="text-sm text-app-text">
                  La partita si è conclusa in parità per <strong className="text-app-accent">Stallo</strong>.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                id="analyze-match-btn"
                className="flex-1 px-6 py-3 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-xs border border-app-accent shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2"
                onClick={() => navigate('/analisi')}
              >
                <BarChart3 className="w-4 h-4" />
                Analizza Partita
              </button>

              <button
                id="close-match-outcome-btn"
                className="flex-1 px-6 py-3 bg-app-panel hover:bg-app-panel/70 text-app-text rounded-xl font-bold text-xs border border-app-border shadow-lg cursor-pointer transform transition active:scale-95 outline-none"
                onClick={quitToLobby}
              >
                Torna alla Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
