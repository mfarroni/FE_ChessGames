/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Introduzione sistema di 3 temi colore accessibili (Scuro Elegante, Chiaro Pergamena, Alto Contrasto) selezionabili da ogni pagina, scacchiera esclusa.
 */

import React, { useEffect, useState, ReactNode } from 'react';
import { ThemeContext, AppTheme } from './useTheme';

const STORAGE_KEY = 'chess_theme';
const VALID_THEMES: AppTheme[] = ['elegante', 'pergamena', 'alto-contrasto'];

function readInitialTheme(): AppTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_THEMES.includes(stored as AppTheme)) {
      return stored as AppTheme;
    }
  } catch {
    // localStorage non disponibile (es. modalità privata restrittiva): usa il default.
  }
  return 'elegante';
}

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<AppTheme>(readInitialTheme);

  // Applica il tema all'elemento <html> e lo persiste ad ogni cambio, cosi'
  // ogni pagina (incluso /admin) mostra sempre la palette scelta.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Se il salvataggio fallisce (storage pieno/non disponibile) il tema
      // resta comunque attivo per la sessione corrente.
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
