import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { MessageSquare, Send, X, Smile } from 'lucide-react';

interface ChatDrawerProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const quickReactions = ['🔥', '🏆', '😂', '🦈', '🚀', '😭', '👏', '🍀'];

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  messages,
  onSendMessage,
  onSendReaction,
  isOpen,
  onToggle,
}) => {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-4 right-4 z-40 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black p-3 rounded-full shadow-gold-glow flex items-center gap-2 font-bold cursor-pointer transition hover:scale-105"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="hidden sm:inline text-xs uppercase tracking-wider">Table Chat</span>
          {messages.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
          )}
        </button>
      )}

      {/* Slide-in Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 h-[440px] bg-slate-950/95 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col backdrop-blur-xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm text-slate-100">Table Chat & Social</span>
            </div>
            <button
              onClick={onToggle}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Reactions Bar */}
          <div className="px-3 py-2 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between gap-1 overflow-x-auto">
            {quickReactions.map(emoji => (
              <button
                key={emoji}
                onClick={() => onSendReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer select-none"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No messages yet. Say hello to table mates!
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex items-start gap-2 text-xs">
                  <span className="text-sm">{msg.senderAvatar || '👤'}</span>
                  <div className="flex flex-col bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1.5 max-w-[80%]">
                    <span className="font-bold text-amber-300 text-[11px] leading-tight">
                      {msg.senderName}
                    </span>
                    <span className="text-slate-200 mt-0.5 break-words">
                      {msg.text}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSubmit} className="p-2.5 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message..."
              maxLength={150}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black p-2 rounded-xl transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

