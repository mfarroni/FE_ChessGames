/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 09/07/2026 11:00:00 (Ora di Roma)
 * Problema Risolto: Modulo lato giocatore per l'invio di osservazioni/feedback
 * (POST /api/feedback), mostrato nella pagina di analisi post-partita.
 */

import React, { useState } from 'react';
import { MessageSquarePlus, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSession } from '../session/useSession';
import { API_BASE_URL } from '../utils/apiConfig';

const MAX_TITLE = 100;
const MAX_MESSAGE = 2000;

export default function FeedbackForm() {
  const { player } = useSession();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanTitle = title.trim();
    const cleanMessage = message.trim();
    if (!cleanTitle || !cleanMessage) {
      setError('Inserisci sia un titolo sia un messaggio.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: player?.name || 'Anonimo',
          title: cleanTitle,
          message: cleanMessage
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Grazie per il tuo feedback!');
        setTitle('');
        setMessage('');
      } else {
        setError(data.message || 'Impossibile inviare il feedback. Riprova.');
      }
    } catch (err) {
      setError('Errore di connessione al server. Riprova più tardi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-10 glass-panel border border-app-border rounded-3xl p-6 shadow-xl">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl bg-app-accent/20 border border-app-accent/15 flex items-center justify-center text-app-accent shrink-0">
          <MessageSquarePlus className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-base font-bold text-app-text">Lascia un'osservazione</h3>
          <p className="text-[11px] text-app-text-muted leading-relaxed">
            Hai suggerimenti per migliorare GranMasterChess? Scrivi qui la tua osservazione, la leggeremo con attenzione.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted mb-1.5 font-bold">
            Titolo
          </label>
          <input
            type="text"
            value={title}
            maxLength={MAX_TITLE}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Suggerimento sul timer"
            className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2.5 text-sm text-app-text placeholder-app-text-muted outline-none focus:border-app-accent transition-colors"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-app-text-muted font-bold">
              Messaggio
            </label>
            <span className="text-[10px] font-mono text-app-text-muted">{message.length}/{MAX_MESSAGE}</span>
          </div>
          <textarea
            value={message}
            maxLength={MAX_MESSAGE}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Descrivi la tua osservazione o il tuo suggerimento..."
            className="w-full bg-app-bg border border-app-border rounded-xl px-3.5 py-2.5 text-sm text-app-text placeholder-app-text-muted outline-none focus:border-app-accent transition-colors resize-y leading-relaxed"
          />
        </div>

        {error && (
          <div className="bg-app-danger-bg border border-app-danger-text/30 rounded-xl p-3 text-app-danger-text text-xs text-center font-medium flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-app-success-bg border border-app-success-text/30 rounded-xl p-3 text-app-success-text text-xs text-center font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !title.trim() || !message.trim()}
          className="w-full py-3 bg-app-accent hover:bg-app-accent-hover text-app-on-accent rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg cursor-pointer transform transition active:scale-95 outline-none flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {submitting ? 'Invio in corso...' : <>Invia osservazione <Send className="w-4 h-4" /></>}
        </button>
      </form>
    </div>
  );
}
