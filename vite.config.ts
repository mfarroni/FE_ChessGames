/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 02/07/2026 10:26:03 (Ora di Roma)
 * Problema Risolto: Revisione e inserimento dell'orario di modifica attuale di Roma e versione 1.0.0 in tutti i file.
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
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
