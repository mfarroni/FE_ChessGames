/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 03/07/2026 09:56:41 (Ora di Roma)
 * Problema Risolto: Introduzione routing react-router-dom con pagine separate Home/Login/Registrazione/Lobby/Partita e timeout sessione per inattività 30 minuti.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import SessionProvider from './session/SessionProvider';
import { useSession } from './session/useSession';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import AdminPanel from './components/AdminPanel';
import MusicPlayer from './components/MusicPlayer';
import { Volume2, VolumeX, ShieldCheck } from 'lucide-react';

// Shared chrome (header/footer) for every route that lives inside the player
// session (Home, Login, Register, Lobby, Game). It is intentionally kept out
// of /admin so the admin panel never triggers the player WebSocket connection.
function AppLayout() {
  const {
    ambienceEnabled,
    handleToggleAmbience,
    hasConfirmedName,
    player,
    isEditingName,
    setIsEditingName,
    newNameInput,
    setNewNameInput,
    handleRenameSubmit,
    handleLogout
  } = useSession();

  return (
    <div id="application-root" className="min-h-screen bg-[#0a0806] text-amber-100 flex flex-col justify-between font-sans selection:bg-amber-800 selection:text-amber-100 antialiased relative overflow-hidden">

      {/* Absolute decorative tabletop wooden background texture underlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,25,18,0.15)_0%,rgba(0,0,0,0)_80%)] pointer-events-none select-none" />
      <div className="absolute inset-0 spotlight pointer-events-none z-10" />

      {/* Elegant Header */}
      <header className="h-16 flex items-center justify-between px-8 bg-[#15110d] border-b border-[#2d2218] z-40 relative select-none">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-600 rounded flex items-center justify-center text-xl font-serif">♚</div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-[#f5e8d0] uppercase">Grandmaster Live</h1>
            <p className="text-[10px] text-amber-500/60 font-mono tracking-wider">In Tempo Reale • Audio Procedurale • Illuminazione Tridimensionale</p>
          </div>
        </div>

        {/* Dynamic header indicators */}
        <div className="flex items-center gap-4">
          <MusicPlayer />

          <button
            id="ambient-acoustics-toggle"
            className={`p-2.5 rounded-xl border flex items-center justify-center outline-none transition-all duration-150 cursor-pointer ${
              ambienceEnabled
                ? 'bg-amber-950/20 border-amber-600/50 text-amber-300 shadow-[0_0_8px_rgba(217,119,6,0.15)]'
                : 'bg-[#241c14] border-[#3d2f21] text-amber-500/80 hover:text-[#f2e6d0]'
            }`}
            onClick={handleToggleAmbience}
            title={ambienceEnabled ? "Disattiva Acustica di Sottofondo" : "Abilita Acustica di Sottofondo"}
          >
            {ambienceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {hasConfirmedName && player && (
            <div className="flex items-center gap-3 bg-[#241c14] px-4 py-1.5 rounded-full border border-[#3d2f21]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {isEditingName ? (
                <form onSubmit={handleRenameSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={18}
                    value={newNameInput}
                    onChange={(e) => setNewNameInput(e.target.value)}
                    className="bg-black/60 text-xs text-amber-100 px-2 py-0.5 rounded border border-amber-900/40 outline-none w-28 focus:border-amber-500/50"
                    autoFocus
                  />
                  <button type="submit" className="text-[10px] text-green-400 font-bold hover:text-green-300 cursor-pointer">Salva</button>
                  <button type="button" onClick={() => setIsEditingName(false)} className="text-[10px] text-stone-400 hover:text-stone-300 cursor-pointer">Annulla</button>
                </form>
              ) : (
                <span className="text-sm text-amber-200/80 flex items-center gap-1.5 select-none">
                  Benvenuto, <span className="font-bold text-amber-100 italic tracking-wide font-serif">{player.name}</span>
                  <span className="text-xs text-amber-600 font-mono">({player.rating} Elo)</span>
                  <button
                    onClick={() => {
                      setNewNameInput(player.name);
                      setIsEditingName(true);
                    }}
                    className="text-[10px] text-amber-500 hover:text-amber-400 underline cursor-pointer ml-1"
                  >
                    modifica
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-[10px] text-red-400 hover:text-red-300 underline cursor-pointer ml-2 border-l border-[#3d2f21] pl-2"
                    title="Torna alla Home / Cambia Nome"
                  >
                    esci
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center relative z-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-900/80 bg-stone-950/60 py-4.5 px-6 select-none relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-stone-600 text-[10px] font-mono text-center sm:text-left">
          Scacchi di Legno © 2026 • Realizzato in React & WebSockets per un'esperienza a latenza ultra-bassa.
        </p>
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="text-amber-500/80 hover:text-amber-400 text-[10px] font-mono tracking-wider flex items-center gap-1 border border-amber-900/30 bg-amber-950/10 px-2.5 py-1 rounded hover:bg-amber-950/20 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3 h-3" /> Area Amministratore
          </Link>
        </div>
      </footer>

    </div>
  );
}

// /admin route: intentionally rendered as a sibling of SessionProvider so it
// never opens the player WebSocket connection. AdminPanel keeps its own
// separate authentication (token in sessionStorage), untouched here.
function AdminRoute() {
  return (
    <div id="application-root" className="min-h-screen bg-[#0a0806] text-amber-100 flex flex-col justify-between font-sans selection:bg-amber-800 selection:text-amber-100 antialiased relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,25,18,0.15)_0%,rgba(0,0,0,0)_80%)] pointer-events-none select-none" />
      <div className="absolute inset-0 spotlight pointer-events-none z-10" />

      {/* Simple Header for Admin */}
      <header className="h-16 flex items-center justify-between px-8 bg-[#15110d] border-b border-[#2d2218] z-40 relative select-none">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-600 rounded flex items-center justify-center text-xl font-serif">♚</div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-[#f5e8d0] uppercase">Grandmaster Live</h1>
            <p className="text-[10px] text-amber-500/60 font-mono tracking-wider">Area Riservata Amministrazione</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex items-center justify-center relative z-20">
        <AdminPanel />
      </main>

      <footer className="border-t border-stone-900/80 bg-stone-950/60 py-4.5 px-6 text-center select-none relative z-10">
        <p className="text-stone-600 text-[10px] font-mono">
          Scacchi di Legno © 2026 • Portale Amministrazione Protetto
        </p>
      </footer>
    </div>
  );
}

// Wraps the player-facing routes with the shared session (WebSocket, auth,
// active game...) plus the common header/footer chrome.
function SessionLayout() {
  return (
    <SessionProvider>
      <AppLayout />
    </SessionProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<SessionLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/lobby"
            element={
              <ProtectedRoute>
                <LobbyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game"
            element={
              <ProtectedRoute requireActiveGame>
                <GamePage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
