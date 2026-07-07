/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 02/07/2026 10:26:03 (Ora di Roma)
 * Problema Risolto: Revisione e inserimento dell'orario di modifica attuale di Roma e versione 1.0.0 in tutti i file.
 */

// Configuration for dynamic FrontEnd <-> BackEnd separation (Vercel & Render)

// Base URL for the Backend API. Under Vercel development or production,
// this can be configured via VITE_API_URL environment variable.
// Example: VITE_API_URL=https://chess-backend.onrender.com
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Base URL for the WebSocket server. Under Vercel development or production,
// this can be configured via VITE_WS_URL environment variable.
// Example: VITE_WS_URL=wss://chess-backend.onrender.com
export const getWebSocketUrl = (): string => {
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (envWsUrl) {
    return envWsUrl;
  }
  // Fallback to local host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
};
