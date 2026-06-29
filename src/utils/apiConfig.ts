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

/**
 * Normalizes any resource path (e.g. uploaded tracks under /uploads)
 * by prepending the Backend API base URL if it's a relative path.
 */
export const getResourceUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  // If relative path and API_BASE_URL is configured, prepend it
  if (url.startsWith('/') && API_BASE_URL) {
    return `${API_BASE_URL.replace(/\/$/, '')}${url}`;
  }
  return url;
};
