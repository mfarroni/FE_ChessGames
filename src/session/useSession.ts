/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Estensione del contesto di sessione con `privacyAccepted`/`setPrivacyAccepted` per il checkbox di consenso privacy in Registrazione.
 */

import { createContext, useContext } from 'react';
import { Player, ChessGame, Square, LeaderboardEntry, ChessPiece } from '../types';

export interface SessionContextValue {
  // Authentication & Lobby States
  player: Player | null;
  hasConfirmedName: boolean;

  usernameInput: string;
  setUsernameInput: (v: string) => void;
  registerError: string;

  isEditingName: boolean;
  setIsEditingName: (v: boolean) => void;
  newNameInput: string;
  setNewNameInput: (v: string) => void;
  handleRenameSubmit: (e: React.FormEvent) => void;

  // Tabbed Auth States
  regUsername: string;
  setRegUsername: (v: string) => void;
  regEmail: string;
  setRegEmail: (v: string) => void;
  regPassword: string;
  setRegPassword: (v: string) => void;
  regError: string;
  regSuccess: string;
  privacyAccepted: boolean;
  setPrivacyAccepted: (v: boolean) => void;

  loginUsername: string;
  setLoginUsername: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  loginError: string;

  // Captcha & Verification States
  captchaSvg: string;
  captchaAnswer: string;
  setCaptchaAnswer: (v: string) => void;
  loadCaptcha: () => void;
  verificationStep: boolean;
  setVerificationStep: (v: boolean) => void;
  verifyCode: string;
  setVerifyCode: (v: string) => void;
  unverifiedUserEmail: string;
  handleResendCode: () => void;

  // Real-time lists
  onlinePlayers: Player[];
  leaderboard: LeaderboardEntry[];
  activeGamesCount: number;

  // Active Chess Game state
  activeGame: ChessGame | null;
  playerColor: 'w' | 'b';

  // Challenge handshake states
  incomingChallenge: { challengerId: string; challengerName: string } | null;
  pendingChallengeTarget: string | null;

  // Connection state
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  lobbyPending: boolean;

  // Audio state
  ambienceEnabled: boolean;
  handleToggleAmbience: () => void;

  // Vs Computer state
  isAiThinking: boolean;
  difficulty: 'facile' | 'medio' | 'difficile';
  setDifficulty: (d: 'facile' | 'medio' | 'difficile') => void;

  // Auth handlers
  handleAuthRegister: (e: React.FormEvent) => void;
  handleAuthLogin: (e: React.FormEvent) => void;
  handleVerifyEmailCode: (e: React.FormEvent) => void;
  handleRegister: (e: React.FormEvent) => void; // guest flow
  handleLogout: () => void;

  // Game / lobby handlers
  startComputerMatch: () => void;
  handleChallengePlayer: (targetId: string) => void;
  handleAcceptChallenge: () => void;
  handleDeclineChallenge: () => void;
  handleChessMove: (from: Square, to: Square, promotion?: ChessPiece['type'], localSound?: string) => void;
  handleSendChatMessage: (text: string) => void;
  handleResign: () => void;
  quitToLobby: () => void;

  // Inactivity / idle session warning
  idleWarningVisible: boolean;
  stayLoggedIn: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession deve essere usato all\'interno di un <SessionProvider>.');
  }
  return ctx;
}
