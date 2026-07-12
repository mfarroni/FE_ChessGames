/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 12/07/2026 (Ora di Roma)
 * Problema Risolto: Aggiunta la configurazione PWA (vite-plugin-pwa): service worker
 * con autoUpdate (skipWaiting/clientsClaim), precache dei soli asset statici,
 * Stockfish escluso dal precache e gestito con strategia runtime CacheFirst.
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // Gli utenti ricevono sempre l'ultima versione senza restare bloccati
        // su una cache vecchia.
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        // Il manifest è statico (public/manifest.json): non lasciamo che il
        // plugin ne generi/inietti uno proprio.
        manifest: false,
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          // Precache dei soli asset statici del build.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // Il motore Stockfish (WASM/JS) NON viene precaricato per tutti i
          // visitatori: è pesante e serve solo a chi avvia un'analisi.
          globIgnores: ['**/stockfish/**'],
          navigateFallback: '/index.html',
          // L'SPA fallback non deve intercettare API o upload del backend.
          navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
          runtimeCaching: [
            {
              // Stockfish: messo in cache solo al primo utilizzo reale.
              urlPattern: ({url}) => url.pathname.startsWith('/stockfish/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'stockfish-engine',
                expiration: {maxEntries: 8},
                cacheableResponse: {statuses: [0, 200]},
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': new URL('.', import.meta.url).pathname,
      },
    },
    server: {
      port: 3000,
    },
  };
});
