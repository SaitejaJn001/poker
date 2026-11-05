import React from 'react';
import { Card, Rank, Suit } from '../../types';

interface CardViewProps {
  card?: Card;
  faceDown?: boolean;
  highlight?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const suitSymbols: Record<Suit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};

const suitColors: Record<Suit, string> = {
  s: 'text-slate-900',
  h: 'text-red-600',
  d: 'text-red-600',
  c: 'text-emerald-800',
};

const rankDisplay: Record<Rank, string> = {
  14: 'A',
  13: 'K',
  12: 'Q',
  11: 'J',
  10: '10',
  9: '9',
  8: '8',
  7: '7',
  6: '6',
  5: '5',
  4: '4',
  3: '3',
  2: '2',
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  faceDown = false,
  highlight = false,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-12 text-[10px] rounded-[4px]',
    md: 'w-12 h-16 sm:w-14 sm:h-20 text-xs sm:text-sm rounded-md',
    lg: 'w-16 h-22 sm:w-20 sm:h-28 text-sm sm:text-base rounded-lg',
  }[size];

  if (faceDown || !card) {
    return (
      <div
        className={`relative ${sizeClasses} bg-gradient-to-br from-blue-950 via-indigo-900 to-slate-950 border border-amber-500/40 shadow-md flex items-center justify-center overflow-hidden transition-transform duration-200 hover:-translate-y-1 ${className}`}
      >
        {/* Ornate back pattern */}
        <div className="absolute inset-1 rounded-sm border border-amber-400/20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:6px_6px] opacity-40"></div>
        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-amber-400/60 bg-amber-500/10 flex items-center justify-center text-amber-300 font-serif-luxury text-[10px] sm:text-xs">
          ♠
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'h' || card.suit === 'd';
  const colorClass = suitColors[card.suit];

  return (
    <div
      className={`relative ${sizeClasses} bg-gradient-to-b from-white to-slate-100 ${colorClass} font-bold shadow-lg border ${
        highlight
          ? 'border-amber-400 ring-2 ring-amber-400 shadow-gold-glow animate-pulse'
          : 'border-slate-300'
      } flex flex-col justify-between p-1 select-none transition-all duration-200 hover:-translate-y-1 ${className}`}
    >
      {/* Top Left */}
      <div className="flex flex-col items-center leading-none">
        <span className="font-extrabold tracking-tighter">{rankDisplay[card.rank]}</span>
        <span className="text-xs sm:text-sm">{suitSymbols[card.suit]}</span>
      </div>

      {/* Center Suit Icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-85 text-base sm:text-2xl pointer-events-none">
        {suitSymbols[card.suit]}
      </div>

      {/* Bottom Right Inverted */}
      <div className="flex flex-col items-center leading-none rotate-180">
        <span className="font-extrabold tracking-tighter">{rankDisplay[card.rank]}</span>
        <span className="text-xs sm:text-sm">{suitSymbols[card.suit]}</span>
      </div>
    </div>
  );
};

