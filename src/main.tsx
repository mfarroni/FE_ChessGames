/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 15/07/2026 (Ora di Roma)
 * Problema Risolto: Registrazione esplicita del service worker (PWA) tramite il
 * modulo virtuale "virtual:pwa-register", per rendere gli aggiornamenti più
 * affidabili — in particolare su iOS in modalità standalone, dove l'app
 * installata poteva restare "congelata" su una versione JS precedente. Al
 * cambio di service worker (controllerchange) forziamo un reload immediato, e
 * al ritorno in foreground (visibilitychange) chiediamo un controllo
 * aggiornamenti, così iOS verifica una nuova versione anche riaprendo dall'icona.
 */

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Registrazione esplicita del service worker (no-op nei browser che non lo
// supportano). Non altera il comportamento per chi usa l'app da browser
// normale: aggiunge solo un reload più tempestivo quando arriva una nuova
// versione e un check di aggiornamento alla riapertura dell'app installata.
if ('serviceWorker' in navigator) {
  // Quando un nuovo service worker prende il controllo della pagina, ricarichiamo
  // subito per applicare l'aggiornamento. La guardia evita loop di reload.
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      // Al ritorno dell'app in foreground (tipico su iOS quando viene riaperta
      // dall'icona invece che con un reload del browser) chiediamo al SW di
      // verificare la presenza di una nuova versione.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration?.update();
        }
      });
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
