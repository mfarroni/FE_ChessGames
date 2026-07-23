/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Introduzione sistema di 3 temi colore accessibili (Scuro Elegante, Chiaro Pergamena, Alto Contrasto) selezionabili da ogni pagina, scacchiera esclusa.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../session/useSession';
import {
  Users,
  Cpu,
  Award,
  ChevronRight,
  Sparkles,
  Smartphone,
  Gamepad2
} from 'lucide-react';
import SupportButton from '../components/SupportButton';
import HeroPhotoSlideshow from '../components/HeroPhotoSlideshow';

export default function HomePage() {
  const navigate = useNavigate();
  const { usernameInput, setUsernameInput, registerError, handleRegister, connectionStatus } = useSession();

  return (
    <div className="w-full flex flex-col items-center justify-center animate-fade-in duration-500">
      <div className="w-full max-w-5xl space-y-12">

        <HeroPhotoSlideshow />

        {/* Brand Hero & App Store Pitch */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-app-accent/15 border border-app-accent/30 rounded-full text-[10px] font-mono font-bold tracking-widest text-app-accent uppercase">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-app-accent" />
            L'arena degli scacchi d'élite
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-app-text leading-tight">
            Circolo degli Scacchi
          </h1>
          <p className="text-sm md:text-base text-app-text-muted leading-relaxed max-w-2xl mx-auto font-sans">
            Gioca gratis in tempo reale, sfida un'Intelligenza Artificiale evoluta su tre livelli di difficoltà, e accumula punti per scalare la classifica Elo ufficiale. L'app definitiva per veri maestri.
          </p>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 w-full sm:w-auto bg-app-accent hover:bg-app-accent-hover text-app-on-accent font-sans font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_15px_30px_rgba(146,64,14,0.3)] transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 border border-app-accent"
            >
              Unisciti al Club (Registrati) <ChevronRight className="w-5 h-5 text-app-on-accent" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 w-full sm:w-auto bg-app-panel hover:bg-app-panel/70 text-app-accent font-sans font-bold text-sm uppercase tracking-wider rounded-2xl shadow-lg border border-app-border transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
            >
              Hai già un account? Accedi
            </button>
          </div>
        </div>

        {/* Guest access (name only, no account) */}
        <div
          id="guest-access-card"
          className="w-full max-w-md mx-auto p-6 rounded-3xl glass-panel border border-app-border shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />
          <h2 className="font-serif text-lg font-bold text-app-text mb-1 text-center">
            Entra come ospite
          </h2>
          <p className="text-app-text-muted text-xs leading-relaxed text-center mb-4">
            Vuoi solo provare il tavolo? Scegli un nome e inizia subito a giocare, senza registrazione.
          </p>

          <form onSubmit={handleRegister} className="space-y-3">
            <input
              type="text"
              maxLength={18}
              placeholder="Il tuo nome..."
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-xs text-app-text placeholder-app-text-muted outline-none focus:border-app-accent transition-all font-mono"
            />

            {registerError && (
              <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs text-center font-medium">
                {registerError}
              </div>
            )}

            <button
              type="submit"
              disabled={connectionStatus !== 'connected'}
              className="w-full py-3 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-xs uppercase tracking-wider border border-app-accent shadow-md cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Entra come ospite <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Required disclaimer for the guest option */}
          <p className="mt-3 text-center text-[10px] text-app-text-muted font-mono leading-relaxed">
            I tuoi punteggi non verranno memorizzati: iscriviti se vuoi vedere i tuoi progressi.
          </p>
        </div>

        {/* Aesthetic Bento Grid - Features with Unsplash Images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">

          {/* Live Multiplayer */}
          <div className="glass-panel border border-app-border rounded-3xl overflow-hidden shadow-2xl flex flex-col group hover:border-app-accent/40 transition-all duration-300">
            <div className="h-44 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80"
                alt="Scacchi Online Classificati"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-2 bg-app-panel">
              <div>
                <div className="flex items-center gap-2 text-app-accent font-serif font-bold text-base">
                  <Users className="w-5 h-5 text-app-accent" />
                  Sfide PvP in Tempo Reale
                </div>
                <p className="text-xs text-app-text-muted mt-2 leading-relaxed">
                  Connettiti con appassionati di tutto il mondo. Gioca partite online istantanee con matchmaking autoritativo e tracciamento Elo sincronizzato su PostgreSQL.
                </p>
              </div>
            </div>
          </div>

          {/* AI Engine */}
          <div className="glass-panel border border-app-border rounded-3xl overflow-hidden shadow-2xl flex flex-col group hover:border-app-accent/40 transition-all duration-300">
            <div className="h-44 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?auto=format&fit=crop&w=600&q=80"
                alt="Chess AI Motore di gioco"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-2 bg-app-panel">
              <div>
                <div className="flex items-center gap-2 text-app-accent font-serif font-bold text-base">
                  <Cpu className="w-5 h-5 text-app-accent" />
                  Motore AI Avanzato
                </div>
                <p className="text-xs text-app-text-muted mt-2 leading-relaxed">
                  Metti alla prova le tue tattiche contro la nostra CPU. Scegli tra Facile per fare pratica, Medio per metterti alla prova, o Difficile per sperimentare una vera sfida.
                </p>
              </div>
            </div>
          </div>

          {/* Persistent Leaderboard */}
          <div className="glass-panel border border-app-border rounded-3xl overflow-hidden shadow-2xl flex flex-col group hover:border-app-accent/40 transition-all duration-300">
            <div className="h-44 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=600&q=80"
                alt="Classifica Elo persistent"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-2 bg-app-panel">
              <div>
                <div className="flex items-center gap-2 text-app-accent font-serif font-bold text-base">
                  <Award className="w-5 h-5 text-app-accent" />
                  Classifica Elo & Storico
                </div>
                <p className="text-xs text-app-text-muted mt-2 leading-relaxed">
                  La tua scalata viene salvata in modo sicuro nel database. Guadagna punti Elo battendo la CPU o altri giocatori reali e diventa una leggenda della scacchiera.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Play Store & App Store Badge Mockups */}
        <div className="bg-app-panel border border-app-border rounded-3xl p-8 max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(217,119,6,0.03)_0%,transparent_55%)] pointer-events-none" />
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-serif text-lg font-bold text-app-text flex items-center justify-center md:justify-start gap-2">
              <Smartphone className="w-5 h-5 text-app-accent animate-bounce" />
              Gioca Ovunque Ti Trovi
            </h3>
            <p className="text-xs text-app-text-muted max-w-sm leading-relaxed">
              L'applicazione è progettata per adattarsi perfettamente su tutti gli schermi e sarà presto disponibile gratuitamente sugli store digitali iOS e Android.
            </p>
          </div>

          {/* Store Badges */}
          <div className="flex flex-col items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-app-accent/20 border border-app-accent/40 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest text-app-accent">
              <Sparkles className="w-3 h-3" /> As soon as possible
            </span>
            <div className="flex flex-wrap items-center justify-center gap-4">
            {/* App Store */}
            <div className="bg-app-bg hover:bg-app-panel border border-app-border rounded-xl px-4 py-2 flex items-center gap-2.5 w-40 cursor-not-allowed shadow-md transition">
              <Smartphone className="w-6 h-6 text-app-text" />
              <div className="text-left leading-none">
                <span className="text-[9px] font-mono text-app-text-muted block uppercase font-medium">Download on the</span>
                <span className="text-xs font-sans text-app-text font-bold block mt-0.5">App Store</span>
              </div>
            </div>
            {/* Google Play */}
            <div className="bg-app-bg hover:bg-app-panel border border-app-border rounded-xl px-4 py-2 flex items-center gap-2.5 w-40 cursor-not-allowed shadow-md transition">
              <Gamepad2 className="w-6 h-6 text-app-accent" />
              <div className="text-left leading-none">
                <span className="text-[9px] font-mono text-app-text-muted block uppercase font-medium">Get it on</span>
                <span className="text-xs font-sans text-app-text font-bold block mt-0.5">Google Play</span>
              </div>
            </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] font-mono text-app-text-muted select-none">
          Licenza App Store Gratuita • Circolo degli Scacchi d'Elite v2.0 • Protetto da CAPTCHA
        </div>

        <SupportButton message="Ti piace sfidare la classifica e l'IA? Se ti stai divertendo, offrimi un caffè per tenere in vita l'arena ☕" />
      </div>
    </div>
  );
}
