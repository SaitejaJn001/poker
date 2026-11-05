import React, { useState } from 'react';
import { X, Copy, Check, Share2, Users, Send } from 'lucide-react';
import { PublicTableView } from '../../types';

interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableState: PublicTableView | null;
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({
  isOpen,
  onClose,
  tableState,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !tableState) return null;

  const roomId = tableState.config.id;
  const inviteUrl = `${window.location.origin}/?room=${roomId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`♠️ Join my private Texas Hold'em poker table "${tableState.config.name}"! Play now: ${inviteUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const seatedCount = tableState.seats.filter(s => s !== null).length;
  const maxSeats = tableState.config.maxPlayers;
  const availableSeats = maxSeats - seatedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-serif-luxury text-amber-300">
              Invite Friends to Table
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Info Stats */}
        <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block">Table Name</span>
            <span className="font-bold text-slate-100 text-sm">{tableState.config.name}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Available Seats</span>
            <span className="font-bold text-emerald-400 text-sm flex items-center gap-1 justify-end">
              <Users className="w-3.5 h-3.5" /> {availableSeats} of {maxSeats} Free
            </span>
          </div>
        </div>

        {/* Invitation Link Field */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Shareable Invitation Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-gold-glow transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Room Code Badge */}
        <div className="mt-4 p-3 rounded-xl bg-black/60 border border-amber-500/20 flex items-center justify-between">
          <span className="text-xs text-slate-400">Direct Room Code:</span>
          <span className="font-mono font-black text-amber-400 text-base tracking-widest bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            {roomId}
          </span>
        </div>

        {/* Quick Social Share */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex gap-2">
          <button
            onClick={shareToWhatsApp}
            className="flex-1 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Share to WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Copy className="w-4 h-4" />
            Copy Full Link
          </button>
        </div>
      </div>
    </div>
  );
};

