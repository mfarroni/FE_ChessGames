/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Introduzione sistema di 3 temi colore accessibili (Scuro Elegante, Chiaro Pergamena, Alto Contrasto) selezionabili da ogni pagina, scacchiera esclusa.
 */

import React from 'react';
import { Moon, Scroll, Contrast } from 'lucide-react';
import { useTheme, AppTheme } from '../theme/useTheme';

const THEME_OPTIONS: { id: AppTheme; label: string; Icon: typeof Moon }[] = [
  { id: 'elegante', label: 'Scuro Elegante', Icon: Moon },
  { id: 'pergamena', label: 'Chiaro Pergamena', Icon: Scroll },
  { id: 'alto-contrasto', label: 'Alto Contrasto', Icon: Contrast }
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      id="theme-switcher"
      role="group"
      aria-label="Seleziona il tema colore dell'applicazione"
      className="flex items-center gap-1 bg-app-panel px-1.5 py-1.5 rounded-xl border border-app-border"
    >
      {THEME_OPTIONS.map(({ id, label, Icon }) => {
        const isActive = theme === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTheme(id)}
            aria-pressed={isActive}
            aria-label={label}
            title={label}
            className={`p-2 rounded-lg flex items-center justify-center outline-none transition-all duration-150 cursor-pointer border ${
              isActive
                ? 'bg-app-accent border-app-accent text-app-on-accent shadow-[0_0_8px_rgba(146,64,14,0.35)]'
                : 'bg-transparent border-transparent text-app-text-muted hover:text-app-text hover:border-app-border'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
