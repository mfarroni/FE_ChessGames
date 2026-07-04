/**
 * Versione: 1.1.0
 * Data e Ora Modifica: 04/07/2026 (Ora di Roma)
 * Problema Risolto: Introduzione sistema di 3 temi colore accessibili (Scuro Elegante, Chiaro Pergamena, Alto Contrasto) selezionabili da ogni pagina, scacchiera esclusa. Mantenuta la distinzione visiva tra messaggi propri/altrui, ora basata sui token tema.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, MessageSquare } from 'lucide-react';

interface ChatProps {
  messages: ChatMessage[];
  playerUsername: string;
  onSendMessage: (text: string) => void;
}

export default function Chat({ messages, playerUsername, onSendMessage }: ChatProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    onSendMessage(text);
    setInputText('');
  };

  return (
    <div id="game-chat-wrapper" className="flex flex-col glass-panel border border-app-border rounded-2xl h-[280px] md:h-full min-h-[220px] shadow-2xl relative overflow-hidden backdrop-blur-md">

      {/* Wooden header tag */}
      <div className="flex items-center gap-2 px-4 py-3 bg-app-panel border-b border-app-border select-none">
        <MessageSquare className="w-3.5 h-3.5 text-app-accent" />
        <span className="font-serif text-xs font-bold text-app-text uppercase tracking-widest">
          Conversazione Tavolo
        </span>
      </div>

      {/* Messages layout */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2 max-h-[160px] md:max-h-none">
        {messages.map((msg) => {
          const isSystem = msg.senderName === 'Tavolo';
          const isSelf = msg.senderName.toLowerCase() === playerUsername.toLowerCase();

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="text-center bg-app-accent/10 border border-app-border rounded-lg py-1 px-3 my-2 text-[11px] text-app-text-muted font-mono"
              >
                {msg.text}
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
            >
              <span className={`text-[10px] font-mono mb-0.5 px-1 truncate max-w-[120px] ${
                isSelf
                  ? 'text-app-text-muted'
                  : 'text-app-accent font-bold flex items-center gap-1'
              }`}>
                {!isSelf && <span className="text-[9px] bg-app-accent/20 text-app-accent border border-app-accent/45 px-1 py-0.2 rounded font-mono uppercase tracking-widest font-black shrink-0">Sfida</span>}
                {msg.senderName}
              </span>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs ${
                  isSelf
                    ? 'bg-app-accent text-app-on-accent rounded-tr-none border border-app-accent'
                    : 'bg-app-panel/90 text-app-text rounded-tl-none border border-app-accent/30 shadow-[0_0_8px_rgba(217,119,6,0.1)]'
                }`}
              >
                <p className="break-words leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Chat entry form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1.5 p-2 bg-app-panel border-t border-app-border"
      >
        <input
          id="chat-input-text"
          type="text"
          placeholder="Scrivi un messaggio..."
          value={inputText}
          maxLength={150}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-app-bg border border-app-border rounded-xl px-3 py-2 text-xs text-app-text outline-none focus:border-app-accent transition-colors"
        />
        <button
          id="chat-send-btn"
          type="submit"
          className="w-8 h-8 rounded-xl bg-app-accent hover:bg-app-accent-hover text-app-on-accent flex items-center justify-center cursor-pointer transition-colors outline-none shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
