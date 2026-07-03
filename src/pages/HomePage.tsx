/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 03/07/2026 09:56:41 (Ora di Roma)
 * Problema Risolto: Estrazione della pagina Home (hero + CTA Login/Registrati + accesso ospite) da App.tsx in una pagina instradata con URL proprio (/). Aggiunto il disclaimer richiesto vicino all'opzione ospite.
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

export default function HomePage() {
  const navigate = useNavigate();
  const { usernameInput, setUsernameInput, registerError, handleRegister, connectionStatus } = useSession();

  return (
    <div className="w-full flex flex-col items-center justify-center animate-fade-in duration-500">
      <div className="w-full max-w-5xl space-y-12">

        {/* Brand Hero & App Store Pitch */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-600/20 rounded-full text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-amber-500" />
            L'arena degli scacchi d'élite
          </div>
          <h1 className="font-serif text-4xl md:text-5xl font-black text-amber-100 leading-tight">
            Circolo degli Scacchi
          </h1>
          <p className="text-sm md:text-base text-stone-400 leading-relaxed max-w-2xl mx-auto font-sans">
            Gioca gratis in tempo reale, sfida un'Intelligenza Artificiale evoluta su tre livelli di difficoltà, e accumula punti per scalare la classifica Elo ufficiale. L'app definitiva per veri maestri.
          </p>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-stone-950 font-sans font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_15px_30px_rgba(217,119,6,0.3)] transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2 border border-amber-400/20"
            >
              Unisciti al Club (Registrati) <ChevronRight className="w-5 h-5 text-stone-950" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 w-full sm:w-auto bg-[#140f0c] hover:bg-[#1a1410] text-amber-300 font-sans font-bold text-sm uppercase tracking-wider rounded-2xl shadow-lg border border-amber-900/40 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
            >
              Hai già un account? Accedi
            </button>
          </div>
        </div>

        {/* Guest access (name only, no account) */}
        <div
          id="guest-access-card"
          className="w-full max-w-md mx-auto p-6 rounded-3xl glass-panel border border-[#2d2218] shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(217,119,6,0.06)_0%,transparent_60%)] pointer-events-none" />
          <h2 className="font-serif text-lg font-bold text-amber-100 mb-1 text-center">
            Entra come ospite
          </h2>
          <p className="text-stone-400 text-xs leading-relaxed text-center mb-4">
            Vuoi solo provare il tavolo? Scegli un nome e inizia subito a giocare, senza registrazione.
          </p>

          <form onSubmit={handleRegister} className="space-y-3">
            <input
              type="text"
              maxLength={18}
              placeholder="Il tuo nome..."
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full bg-[#080504] border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-stone-100 placeholder-stone-700 outline-none focus:border-amber-500/50 transition-all font-mono"
            />

            {registerError && (
              <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 text-rose-400 text-xs text-center font-medium">
                {registerError}
              </div>
            )}

            <button
              type="submit"
              disabled={connectionStatus !== 'connected'}
              className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-xl font-bold text-xs uppercase tracking-wider border border-stone-800 shadow-md cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2"
            >
              Entra come ospite <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* Required disclaimer for the guest option */}
          <p className="mt-3 text-center text-[10px] text-amber-600/80 font-mono leading-relaxed">
            I tuoi punteggi non verranno memorizzati: iscriviti se vuoi vedere i tuoi progressi.
          </p>
        </div>

        {/* Aesthetic Bento Grid - Features with Unsplash Images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">

          {/* Live Multiplayer */}
          <div className="glass-panel border border-[#2d2218] rounded-3xl overflow-hidden shadow-2xl flex flex-col group hover:border-amber-600/20 transition-all duration-300">
            <div className="h-44 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a07] via-transparent to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80"
                alt="Scacchi Online Classificati"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-2 bg-[#0e0a07]">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
                  <Users className="w-5 h-5 text-amber-500" />
                  Sfide PvP in Tempo Reale
                </div>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Connettiti con appassionati di tutto il mondo. Gioca partite online istantanee con matchmaking autoritativo e tracciamento Elo sincronizzato su PostgreSQL.
                </p>
              </div>
            </div>
          </div>

          {/* AI Engine */}
          <div className="glass-panel border border-[#2d2218] rounded-3xl overflow-hidden shadow-2xl flex flex-col group hover:border-amber-600/20 transition-all duration-300">
            <div className="h-44 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a07] via-transparent to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1523821741446-edb2b68bb7a0?auto=format&fit=crop&w=600&q=80"
                alt="Chess AI Motore di gioco"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-2 bg-[#0e0a07]">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
                  <Cpu className="w-5 h-5 text-amber-500" />
                  Motore AI Avanzato
                </div>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Metti alla prova le tue tattiche contro la nostra CPU. Scegli tra Facile per fare pratica, Medio per metterti alla prova, o Difficile per sperimentare una vera sfida.
                </p>
              </div>
            </div>
          </div>

          {/* Persistent Leaderboard */}
          <div className="glass-panel border border-[#2d2218] rounded-3xl overflow-hidden shadow-2xl flex flex-col group hover:border-amber-600/20 transition-all duration-300">
            <div className="h-44 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a07] via-transparent to-transparent z-10" />
              <img
                src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=600&q=80"
                alt="Classifica Elo persistent"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-2 bg-[#0e0a07]">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-base">
                  <Award className="w-5 h-5 text-amber-500" />
                  Classifica Elo & Storico
                </div>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  La tua scalata viene salvata in modo sicuro nel database. Guadagna punti Elo battendo la CPU o altri giocatori reali e diventa una leggenda della scacchiera.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Play Store & App Store Badge Mockups */}
        <div className="bg-[#110c08] border border-amber-900/30 rounded-3xl p-8 max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden select-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(217,119,6,0.03)_0%,transparent_55%)] pointer-events-none" />
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-serif text-lg font-bold text-amber-200 flex items-center justify-center md:justify-start gap-2">
              <Smartphone className="w-5 h-5 text-amber-500 animate-bounce" />
              Gioca Ovunque Ti Trovi
            </h3>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              L'applicazione è progettata per adattarsi perfettamente su tutti gli schermi ed è pronta per essere pubblicata gratuitamente sugli store digitali iOS e Android.
            </p>
          </div>

          {/* Store Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* App Store */}
            <div className="bg-stone-950 hover:bg-stone-900 border border-stone-800 rounded-xl px-4 py-2 flex items-center gap-2.5 w-40 cursor-not-allowed shadow-md transition">
              <Smartphone className="w-6 h-6 text-white" />
              <div className="text-left leading-none">
                <span className="text-[9px] font-mono text-stone-400 block uppercase font-medium">Download on the</span>
                <span className="text-xs font-sans text-stone-100 font-bold block mt-0.5">App Store</span>
              </div>
            </div>
            {/* Google Play */}
            <div className="bg-stone-950 hover:bg-stone-900 border border-stone-800 rounded-xl px-4 py-2 flex items-center gap-2.5 w-40 cursor-not-allowed shadow-md transition">
              <Gamepad2 className="w-6 h-6 text-amber-500" />
              <div className="text-left leading-none">
                <span className="text-[9px] font-mono text-stone-400 block uppercase font-medium">Get it on</span>
                <span className="text-xs font-sans text-stone-100 font-bold block mt-0.5">Google Play</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] font-mono text-stone-600 select-none">
          Licenza App Store Gratuita • Circolo degli Scacchi d'Elite v2.0 • Protetto da CAPTCHA
        </div>
      </div>
    </div>
  );
}
