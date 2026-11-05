import React, { useEffect, useState } from 'react';
import { X, History, Trophy } from 'lucide-react';
import { CardView } from '../poker/CardView';

interface HandHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
}

export const HandHistoryModal: React.FC<HandHistoryModalProps> = ({
  isOpen,
  onClose,
  roomId,
}) => {
  const [histories, setHistories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && roomId) {
      setIsLoading(true);
      fetch(`/api/rooms/${roomId}/history`)
        .then(res => res.json())
        .then(data => {
          setHistories(data.histories || []);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, roomId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-serif-luxury text-amber-300">
              Completed Hand History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of hands */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading history...</div>
          ) : histories.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No completed hands recorded for this table yet.
            </div>
          ) : (
            histories.map((entry, idx) => {
              const data = entry.data || {};
              const communityCards = data.communityCards || [];
              const pots = data.pots || [];
              const timeStr = new Date(entry.timestamp).toLocaleTimeString();

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80 mb-3">
                    <span className="font-mono text-amber-300">Hand #{data.handId?.slice(-6) || idx + 1}</span>
                    <span>{timeStr}</span>
                  </div>

                  {/* Community Cards */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-xs text-slate-400 mr-2">Board:</span>
                    {communityCards.length > 0 ? (
                      communityCards.map((card: any, cIdx: number) => (
                        <CardView key={cIdx} card={card} size="sm" />
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No community cards</span>
                    )}
                  </div>

                  {/* Winners */}
                  <div className="space-y-1">
                    {pots.map((pot: any, pIdx: number) => (
                      <div key={pIdx} className="text-xs flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-lg border border-slate-800/60">
                        <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>
                            {pot.winners?.map((w: any) => `${w.playerName} (+$${w.amount})`).join(', ')}
                          </span>
                        </div>
                        <span className="text-slate-400 italic text-[11px]">
                          {pot.winners?.[0]?.handDescription || 'Uncontested'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

