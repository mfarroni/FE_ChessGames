/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 03/07/2026 09:56:41 (Ora di Roma)
 * Problema Risolto: Introduzione della scadenza automatica della sessione dopo 30 minuti di inattività dell'utente, con avviso modale a 28 minuti se una partita è in corso.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { Player, ChessGame } from '../types';

// Total idle time allowed before forced logout.
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
// How long before the deadline the warning modal is shown (only if a game is active).
export const WARNING_BEFORE_MS = 2 * 60 * 1000;
// Minimum interval between two consecutive timer resets, to avoid excessive
// clearTimeout/setTimeout churn on high-frequency events like mousemove.
const RESET_THROTTLE_MS = 5 * 1000;

interface UseInactivityLogoutParams {
  player: Player | null;
  activeGame: ChessGame | null;
  onLogout: () => void;
  navigate: NavigateFunction;
}

interface UseInactivityLogoutResult {
  idleWarningVisible: boolean;
  stayLoggedIn: () => void;
}

/**
 * Tracks user activity and forces a logout after IDLE_TIMEOUT_MS of inactivity.
 * If a game is active when the warning threshold is reached, a modal is shown
 * (via `idleWarningVisible`) giving the player WARNING_BEFORE_MS to confirm
 * they are still there before being logged out.
 */
export function useInactivityLogout({
  player,
  activeGame,
  onLogout,
  navigate
}: UseInactivityLogoutParams): UseInactivityLogoutResult {
  const [idleWarningVisible, setIdleWarningVisible] = useState(false);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetRef = useRef<number>(Date.now());

  // Kept in a ref so the timers (scheduled once) always read the latest value.
  const activeGameRef = useRef<ChessGame | null>(activeGame);
  useEffect(() => {
    activeGameRef.current = activeGame;
  }, [activeGame]);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const doLogout = useCallback(() => {
    clearTimers();
    setIdleWarningVisible(false);
    onLogout();
    navigate('/login', { state: { reason: 'idle' } });
  }, [clearTimers, onLogout, navigate]);

  const scheduleTimers = useCallback(() => {
    clearTimers();
    setIdleWarningVisible(false);

    // Fires at the "28 minute" mark (IDLE_TIMEOUT_MS - WARNING_BEFORE_MS).
    warningTimerRef.current = setTimeout(() => {
      if (activeGameRef.current !== null) {
        // A game is in progress: warn the player and give them a chance to react.
        setIdleWarningVisible(true);
      }
      // In both cases (with or without a warning shown) the session ends
      // WARNING_BEFORE_MS later, i.e. exactly at the 30 minute mark.
      logoutTimerRef.current = setTimeout(() => {
        doLogout();
      }, WARNING_BEFORE_MS);
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);
  }, [clearTimers, doLogout]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    if (now - lastResetRef.current < RESET_THROTTLE_MS) return;
    lastResetRef.current = now;
    scheduleTimers();
  }, [scheduleTimers]);

  useEffect(() => {
    if (!player) {
      // No active session: nothing to watch.
      clearTimers();
      setIdleWarningVisible(false);
      return;
    }

    lastResetRef.current = Date.now();
    scheduleTimers();

    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, scheduleTimers, resetTimer, clearTimers]);

  const stayLoggedIn = useCallback(() => {
    lastResetRef.current = Date.now();
    scheduleTimers();
  }, [scheduleTimers]);

  return { idleWarningVisible, stayLoggedIn };
}
