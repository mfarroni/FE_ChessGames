/**
 * Versione: 1.0.0
 * Data e Ora Modifica: 02/07/2026 10:26:03 (Ora di Roma)
 * Problema Risolto: Revisione e inserimento dell'orario di modifica attuale di Roma e versione 1.0.0 in tutti i file.
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
    <div id="game-chat-wrapper" className="flex flex-col glass-panel border border-[#2d2218] rounded-2xl h-[280px] md:h-full min-h-[220px] shadow-2xl relative overflow-hidden backdrop-blur-md">
      
      {/* Wooden header tag */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#17110d] border-b border-amber-950/40 select-none">
        <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
        <span className="font-serif text-xs font-bold text-[#f5e8d0] uppercase tracking-widest">
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
                className="text-center bg-amber-950/20 border border-amber-900/10 rounded-lg py-1 px-3 my-2 text-[11px] text-amber-400/90 font-mono"
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
                  ? 'text-stone-500' 
                  : 'text-amber-400 font-bold drop-shadow-[0_0_6px_rgba(245,158,11,0.35)] flex items-center gap-1'
              }`}>
                {!isSelf && <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/45 px-1 py-0.2 rounded font-mono uppercase tracking-widest font-black shrink-0">Sfida</span>}
                {msg.senderName}
              </span>
              <div 
                className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs ${
                  isSelf 
                    ? 'bg-gradient-to-r from-amber-800 to-amber-950 text-amber-100 rounded-tr-none border border-amber-700/25' 
                    : 'bg-[#1e140d]/90 text-amber-100 rounded-tl-none border border-amber-500/30 shadow-[0_0_8px_rgba(217,119,6,0.1)]'
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
        className="flex items-center gap-1.5 p-2 bg-[#17110d] border-t border-amber-950/40"
      >
        <input
          id="chat-input-text"
          type="text"
          placeholder="Scrivi un messaggio..."
          value={inputText}
          maxLength={150}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-[#090604] border border-amber-900/30 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none focus:border-amber-500/50 transition-colors"
        />
        <button
          id="chat-send-btn"
          type="submit"
          className="w-8 h-8 rounded-xl bg-amber-900 hover:bg-amber-700 text-amber-100 flex items-center justify-center cursor-pointer transition-colors outline-none shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
