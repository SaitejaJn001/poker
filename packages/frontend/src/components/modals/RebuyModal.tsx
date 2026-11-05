import React, { useState } from 'react';
import { X, Coins } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';

interface RebuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
}

export const RebuyModal: React.FC<RebuyModalProps> = ({
  isOpen,
  onClose,
  defaultAmount = 2000,
}) => {
  const { user, topUpChips } = useAuth();
  const { rebuy } = useGame();
  const [amount, setAmount] = useState<number>(defaultAmount);

  if (!isOpen) return null;

  const handleRebuy = () => {
    rebuy(amount);
    onClose();
  };

  const handleFreeTopUp = async () => {
    await topUpChips();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-serif-luxury text-amber-300">
              Table Rebuy & Chips
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Your Bankroll:</span>
            <span className="font-bold text-amber-300 text-sm">${user?.chips.toLocaleString() || 0}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Rebuy Amount
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1000, 2000, 5000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    amount === val
                      ? 'bg-amber-500 text-black border-amber-300 shadow-gold-glow'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  ${val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {user && user.chips < 500 && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 flex flex-col gap-2">
              <span className="text-xs text-amber-200">Running low on bankroll chips?</span>
              <button
                type="button"
                onClick={handleFreeTopUp}
                className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs transition"
              >
                Claim Free $2,000 Refill
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleRebuy}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-gold-glow transition active:scale-98 cursor-pointer"
            >
              Add ${amount.toLocaleString()} Chips to Seat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

