/**
 * Versione: 1.4.0
 * Data e Ora Modifica: 06/07/2026 10:20:54 (Ora di Roma)
 * Problema Risolto: Introduzione della route /analisi per il report di
 * analisi post-partita con Stockfish.js, protetta con lo stesso pattern
 * <ProtectedRoute requireActiveGame> già usato per /game.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import SessionProvider from './session/SessionProvider';
import { useSession } from './session/useSession';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import GameAnalysisPage from './pages/GameAnalysisPage';
import AdminPanel from './components/AdminPanel';
import MusicPlayer from './components/MusicPlayer';
import ThemeProvider from './theme/ThemeProvider';
import ThemeSwitcher from './components/ThemeSwitcher';
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
    <div id="application-root" className="min-h-screen bg-app-bg text-app-text flex flex-col justify-between font-sans selection:bg-app-accent selection:text-app-on-accent antialiased relative overflow-hidden">

      {/* Absolute decorative tabletop wooden background texture underlays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,25,18,0.15)_0%,rgba(0,0,0,0)_80%)] pointer-events-none select-none" />
      <div className="absolute inset-0 spotlight pointer-events-none z-10" />

      {/* Elegant Header */}
      <header className="h-16 flex items-center justify-between px-8 bg-app-panel border-b border-app-border z-40 relative select-none">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-app-accent rounded flex items-center justify-center text-xl font-serif text-app-on-accent">♚</div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-app-text uppercase">Grandmaster Live</h1>
            <p className="text-[10px] text-app-text-muted font-mono tracking-wider">In Tempo Reale • Audio Procedurale • Illuminazione Tridimensionale</p>
          </div>
        </div>

        {/* Dynamic header indicators */}
        <div className="flex items-center gap-4">
          <ThemeSwitcher />

          <MusicPlayer />

          <button
            id="ambient-acoustics-toggle"
            className={`p-2.5 rounded-xl border flex items-center justify-center outline-none transition-all duration-150 cursor-pointer ${
              ambienceEnabled
                ? 'bg-app-accent/20 border-app-accent text-app-accent shadow-[0_0_8px_rgba(146,64,14,0.25)]'
                : 'bg-app-panel border-app-border text-app-text-muted hover:text-app-text'
            }`}
            onClick={handleToggleAmbience}
            title={ambienceEnabled ? "Disattiva Acustica di Sottofondo" : "Abilita Acustica di Sottofondo"}
          >
            {ambienceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {hasConfirmedName && player && (
            <div className="flex items-center gap-3 bg-app-panel px-4 py-1.5 rounded-full border border-app-border">
              <div className="w-2 h-2 rounded-full bg-app-success-text animate-pulse" />
              {isEditingName ? (
                <form onSubmit={handleRenameSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={18}
                    value={newNameInput}
                    onChange={(e) => setNewNameInput(e.target.value)}
                    className="bg-app-bg text-xs text-app-text px-2 py-0.5 rounded border border-app-border outline-none w-28 focus:border-app-accent"
                    autoFocus
                  />
                  <button type="submit" className="text-[10px] text-app-success-text font-bold hover:opacity-80 cursor-pointer">Salva</button>
                  <button type="button" onClick={() => setIsEditingName(false)} className="text-[10px] text-app-text-muted hover:text-app-text cursor-pointer">Annulla</button>
                </form>
              ) : (
                <span className="text-sm text-app-text flex items-center gap-1.5 select-none">
                  Benvenuto, <span className="font-bold italic tracking-wide font-serif">{player.name}</span>
                  <span className="text-xs text-app-text-muted font-mono">({player.rating} Elo)</span>
                  <button
                    onClick={() => {
                      setNewNameInput(player.name);
                      setIsEditingName(true);
                    }}
                    className="text-[10px] text-app-accent hover:opacity-80 underline cursor-pointer ml-1"
                  >
                    modifica
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-[10px] text-app-danger-text hover:opacity-80 underline cursor-pointer ml-2 border-l border-app-border pl-2"
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
      <footer className="border-t border-app-border bg-app-panel/60 py-4.5 px-6 select-none relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-app-text-muted text-[10px] font-mono text-center sm:text-left">
          Scacchi di Legno © 2026 • Realizzato in React & WebSockets per un'esperienza a latenza ultra-bassa.
        </p>
        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="text-app-accent hover:opacity-80 text-[10px] font-mono tracking-wider flex items-center gap-1 border border-app-border bg-app-panel px-2.5 py-1 rounded hover:bg-app-accent/10 transition-all cursor-pointer"
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
    <div id="application-root" className="min-h-screen bg-app-bg text-app-text flex flex-col justify-between font-sans selection:bg-app-accent selection:text-app-on-accent antialiased relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(40,25,18,0.15)_0%,rgba(0,0,0,0)_80%)] pointer-events-none select-none" />
      <div className="absolute inset-0 spotlight pointer-events-none z-10" />

      {/* Simple Header for Admin (duplicato intenzionalmente rispetto a AppLayout: /admin
          non condivide la sessione giocatore, quindi ha il proprio ThemeSwitcher) */}
      <header className="h-16 flex items-center justify-between px-8 bg-app-panel border-b border-app-border z-40 relative select-none">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-app-accent rounded flex items-center justify-center text-xl font-serif text-app-on-accent">♚</div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-app-text uppercase">Grandmaster Live</h1>
            <p className="text-[10px] text-app-text-muted font-mono tracking-wider">Area Riservata Amministrazione</p>
          </div>
        </div>
        <ThemeSwitcher />
      </header>

      <main className="flex-1 w-full flex items-center justify-center relative z-20">
        <AdminPanel />
      </main>

      <footer className="border-t border-app-border bg-app-panel/60 py-4.5 px-6 text-center select-none relative z-10">
        <p className="text-app-text-muted text-[10px] font-mono">
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
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<SessionLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
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
            <Route
              path="/analisi"
              element={
                <ProtectedRoute requireActiveGame>
                  <GameAnalysisPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
