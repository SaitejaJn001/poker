import React from 'react';
import { ChipsStack } from './ChipsStack';
import { HandPotResult } from '../../types';

interface PotDisplayProps {
  totalPot: number;
  pots?: { amount: number }[];
  handResults?: HandPotResult[];
}

export const PotDisplay: React.FC<PotDisplayProps> = ({
  totalPot,
  pots = [],
  handResults,
}) => {
  return (
    <div className="flex flex-col items-center justify-center pointer-events-none select-none">
      {/* Hand Results Banner */}
      {handResults && handResults.length > 0 && (
        <div className="mb-2 animate-bounce bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black px-4 py-1 rounded-full shadow-gold-glow font-extrabold text-xs sm:text-sm tracking-wide border border-yellow-300">
          {handResults.map((p, i) => (
            <span key={i}>
              🏆 {p.winners.map(w => `${w.playerName} wins $${w.amount} (${w.handDescription || 'Best Hand'})`).join(', ')}
            </span>
          ))}
        </div>
      )}

      {/* Main Pot Pill */}
      {totalPot > 0 && (
        <div className="bg-black/80 border border-amber-500/40 rounded-full px-4 py-1.5 shadow-xl flex items-center gap-2 backdrop-blur-md">
          <span className="text-[10px] sm:text-xs font-bold tracking-widest text-amber-400 uppercase">
            Total Pot
          </span>
          <ChipsStack amount={totalPot} size="sm" showLabel={true} />
        </div>
      )}

      {/* Side Pots if multiple */}
      {pots.length > 1 && (
        <div className="flex items-center gap-2 mt-1">
          {pots.map((pot, idx) => (
            <div
              key={idx}
              className="text-[10px] bg-neutral-900/80 border border-neutral-700 rounded-md px-2 py-0.5 text-neutral-300"
            >
              {idx === 0 ? 'Main: ' : `Side ${idx}: `}${pot.amount}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

