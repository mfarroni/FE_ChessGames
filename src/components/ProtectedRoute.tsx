/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 03/07/2026 09:56:41 (Ora di Roma)
 * Problema Risolto: Introduzione della protezione delle rotte /lobby e /game, con reindirizzamento a /login se l'utente non ha una sessione attiva (o a /lobby se manca una partita attiva).
 */

import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../session/useSession';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Set to true for routes (e.g. /game) that additionally require an active game. */
  requireActiveGame?: boolean;
}

export default function ProtectedRoute({ children, requireActiveGame = false }: ProtectedRouteProps) {
  const { player, hasConfirmedName, activeGame } = useSession();

  if (!player || !hasConfirmedName) {
    return <Navigate to="/login" replace />;
  }

  if (requireActiveGame && !activeGame) {
    return <Navigate to="/lobby" replace />;
  }

  return <>{children}</>;
}
