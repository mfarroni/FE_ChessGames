/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 21/07/2026 (Ora di Roma)
 * Problema Risolto: Slideshow foto hero della landing page. Al mount recupera
 * fino a 5 foto random dall'admin (GET /api/photos/random) e le mostra in loop
 * (5s ciascuna, dissolvenza ~700ms). Fail-soft: se non ci sono foto o la fetch
 * fallisce non renderizza nulla (nessun box vuoto/rotto). Rispetta
 * prefers-reduced-motion (swap istantaneo senza dissolvenza). Puramente
 * decorativo. Sostituisce la precedente ChessHeroAnimation.
 */

import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../utils/apiConfig';

const SLIDE_INTERVAL_MS = 5000;

export default function HeroPhotoSlideshow() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [reducedMotion] = useState<boolean>(
    () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Fetch delle foto al mount (fail-soft: in caso di errore restiamo con [] e
  // il componente non renderizza nulla).
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE_URL}/api/photos/random`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && data.success && Array.isArray(data.photos) && data.photos.length > 0) {
          setPhotos(data.photos.slice(0, 5));
        }
      })
      .catch(() => {
        /* fail-soft: nessun errore in UI */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Rotazione automatica: solo con più di una foto. Cleanup dell'interval allo
  // smontaggio o al cambiare del numero di foto.
  useEffect(() => {
    if (photos.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % photos.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [photos.length]);

  // Fail-soft: nessuna foto -> niente da mostrare.
  if (photos.length === 0) return null;

  return (
    <div
      className="relative w-full h-64 sm:h-80 md:h-96 rounded-3xl overflow-hidden shadow-2xl border border-app-border bg-app-panel select-none"
      aria-hidden="true"
    >
      {photos.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover ${
            reducedMotion ? 'duration-0' : 'transition-opacity duration-700 ease-in-out'
          }`}
          style={{ opacity: i === current ? 1 : 0 }}
        />
      ))}

      {/* Indicatori a pallino (decorativi, non cliccabili) */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-2.5 h-2.5 bg-app-accent' : 'w-2 h-2 bg-app-on-accent/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
