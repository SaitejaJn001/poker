import React, { useState, useEffect } from 'react';
import { ActionType } from '../../types';

interface ActionBarProps {
  validActions?: {
    canCheck: boolean;
    canCall: boolean;
    callAmount: number;
    canBet: boolean;
    minBet: number;
    maxBet: number;
    canRaise: boolean;
    minRaise: number;
    maxRaise: number;
    canAllIn: boolean;
    allInAmount: number;
  };
  currentHighBet: number;
  bigBlind: number;
  pot: number;
  turnTimeRemaining: number;
  onAction: (type: ActionType, amount?: number) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  validActions,
  currentHighBet,
  bigBlind,
  pot,
  turnTimeRemaining,
  onAction,
}) => {
  const minAmount = validActions?.canBet 
    ? validActions.minBet 
    : validActions?.canRaise 
      ? validActions.minRaise 
      : 0;

  const maxAmount = validActions?.canBet 
    ? validActions.maxBet 
    : validActions?.canRaise 
      ? validActions.maxRaise 
      : 0;

  const [betAmount, setBetAmount] = useState<number>(minAmount);

  useEffect(() => {
    setBetAmount(minAmount);
  }, [minAmount]);

  if (!validActions) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-2 flex items-center justify-center">
        <div className="bg-black/40 border border-slate-800/80 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-400 font-medium">
          Waiting for your turn...
        </div>
      </div>
    );
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetAmount(Number(e.target.value));
  };

  const setPreset = (type: 'min' | '2.5bb' | '3bb' | 'half_pot' | 'pot' | 'allin') => {
    let target = minAmount;
    switch (type) {
      case 'min':
        target = minAmount;
        break;
      case '2.5bb':
        target = Math.max(minAmount, Math.floor(bigBlind * 2.5));
        break;
      case '3bb':
        target = Math.max(minAmount, bigBlind * 3);
        break;
      case 'half_pot':
        target = Math.max(minAmount, Math.floor(currentHighBet + pot / 2));
        break;
      case 'pot':
        target = Math.max(minAmount, currentHighBet + pot);
        break;
      case 'allin':
        target = maxAmount;
        break;
    }
    setBetAmount(Math.min(maxAmount, Math.max(minAmount, target)));
  };

  const isBettingOrRaising = validActions.canBet || validActions.canRaise;

  return (
    <div className="w-full max-w-4xl mx-auto px-3 py-2 sm:py-3 bg-gradient-to-t from-black via-slate-950/95 to-slate-900/90 border-t sm:border border-amber-500/20 sm:rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col gap-2.5">
      {/* Quick Raise Preset Pills & Slider */}
      {isBettingOrRaising && maxAmount > minAmount && (
        <div className="flex flex-col gap-1.5 sm:gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setPreset('min')}
              className="px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              Min (${minAmount})
            </button>
            <button
              onClick={() => setPreset('2.5bb')}
              className="px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              2.5x BB
            </button>
            <button
              onClick={() => setPreset('3bb')}
              className="px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              3x BB
            </button>
            {pot > 0 && (
              <>
                <button
                  onClick={() => setPreset('half_pot')}
                  className="px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  1/2 Pot
                </button>
                <button
                  onClick={() => setPreset('pot')}
                  className="px-2.5 py-1 text-[10px] sm:text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  Pot
                </button>
              </>
            )}
            <button
              onClick={() => setPreset('allin')}
              className="px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700 transition"
            >
              All In (${maxAmount})
            </button>
          </div>

          {/* Slider & Direct Number Input */}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={minAmount}
              max={maxAmount}
              step={bigBlind}
              value={betAmount}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex items-center bg-black/60 border border-amber-500/40 rounded-lg px-2.5 py-1 min-w-[90px]">
              <span className="text-amber-400 font-bold text-xs sm:text-sm mr-1">$</span>
              <input
                type="number"
                min={minAmount}
                max={maxAmount}
                value={betAmount}
                onChange={(e) => setBetAmount(Math.min(maxAmount, Math.max(minAmount, Number(e.target.value))))}
                className="w-full bg-transparent text-slate-100 font-bold text-xs sm:text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Action Buttons: Fold | Check/Call | Bet/Raise */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Fold Button */}
        <button
          onClick={() => onAction('FOLD')}
          className="py-2.5 sm:py-3.5 px-3 rounded-xl bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 text-rose-400 font-extrabold text-xs sm:text-sm uppercase tracking-wider border border-neutral-700 hover:border-rose-500/50 shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
        >
          <span>Fold</span>
          <span className="text-[10px] font-normal text-neutral-400 opacity-70">Give up hand</span>
        </button>

        {/* Check or Call Button */}
        {validActions.canCheck ? (
          <button
            onClick={() => onAction('CHECK')}
            className="py-2.5 sm:py-3.5 px-3 rounded-xl bg-gradient-to-b from-emerald-700 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider border border-emerald-500/60 shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
          >
            <span>Check</span>
            <span className="text-[10px] font-normal text-emerald-200">Free to stay</span>
          </button>
        ) : (
          <button
            onClick={() => onAction('CALL')}
            className="py-2.5 sm:py-3.5 px-3 rounded-xl bg-gradient-to-b from-blue-700 to-indigo-900 hover:from-blue-600 hover:to-indigo-800 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider border border-blue-500/60 shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
          >
            <span>Call ${validActions.callAmount}</span>
            <span className="text-[10px] font-normal text-blue-200">Match highest</span>
          </button>
        )}

        {/* Bet or Raise Button */}
        {isBettingOrRaising ? (
          <button
            onClick={() => onAction(validActions.canBet ? 'BET' : 'RAISE', betAmount)}
            className="py-2.5 sm:py-3.5 px-3 rounded-xl bg-gradient-to-b from-amber-500 via-amber-600 to-yellow-700 hover:from-amber-400 hover:to-yellow-600 text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider border border-amber-300 shadow-gold-glow active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer"
          >
            <span>{validActions.canBet ? 'Bet' : 'Raise to'} ${betAmount}</span>
            <span className="text-[10px] font-medium text-black/80">Increase stakes</span>
          </button>
        ) : validActions.canAllIn ? (
          <button
            onClick={() => onAction('ALL_IN')}
            className="py-2.5 sm:py-3.5 px-3 rounded-xl bg-gradient-to-b from-red-600 to-rose-800 hover:from-red-500 hover:to-rose-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider border border-red-400 shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center cursor-pointer animate-pulse"
          >
            <span>All In (${validActions.allInAmount})</span>
            <span className="text-[10px] font-normal text-red-200">Total bankroll</span>
          </button>
        ) : (
          <div className="py-2.5 sm:py-3.5 px-3 rounded-xl bg-neutral-900 text-neutral-600 font-bold text-xs uppercase flex items-center justify-center border border-neutral-800">
            Cannot Raise
          </div>
        )}
      </div>
    </div>
  );
};

