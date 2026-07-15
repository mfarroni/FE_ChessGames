/**
 * Versione: 1.2.0
 * Data e Ora Modifica: 15/07/2026 (Ora di Roma)
 * Problema Risolto: Aggiornamento affidabilità PWA. La registrazione del service
 * worker passa a esplicita (injectRegister: null, gestita in src/main.tsx via
 * "virtual:pwa-register") e workbox pulisce le cache obsolete
 * (cleanupOutdatedCaches) per evitare la coesistenza di asset di versioni diverse
 * (fix per app iOS in standalone "congelata" su una versione JS precedente).
 * Invariata la configurazione PWA precedente: autoUpdate (skipWaiting/clientsClaim),
 * precache dei soli asset statici, Stockfish escluso dal precache e CacheFirst.
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
        // La registrazione è gestita esplicitamente in src/main.tsx tramite il
        // modulo virtuale "virtual:pwa-register" (reload su controllerchange +
        // update check su visibilitychange): evitiamo la doppia registrazione.
        injectRegister: null,
        // Il manifest è statico (public/manifest.json): non lasciamo che il
        // plugin ne generi/inietti uno proprio.
        manifest: false,
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          // Rimuove le cache di precache di versioni precedenti appena il nuovo
          // SW si attiva: niente coesistenza di asset di versioni diverse.
          cleanupOutdatedCaches: true,
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
