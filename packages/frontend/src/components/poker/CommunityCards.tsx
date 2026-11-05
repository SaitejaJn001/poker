import React from 'react';
import { Card } from '../../types';
import { CardView } from './CardView';

interface CommunityCardsProps {
  cards: Card[];
  winningCards?: Card[];
}

export const CommunityCards: React.FC<CommunityCardsProps> = ({ cards, winningCards = [] }) => {
  const isCardWinning = (card?: Card) => {
    if (!card || winningCards.length === 0) return false;
    return winningCards.some(w => w.rank === card.rank && w.suit === card.suit);
  };

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-xl bg-black/40 border border-emerald-500/20 shadow-inner backdrop-blur-sm">
      {[0, 1, 2, 3, 4].map((idx) => {
        const card = cards[idx];
        const isWinning = isCardWinning(card);

        if (!card) {
          return (
            <div
              key={idx}
              className="w-8 h-12 sm:w-12 sm:h-16 rounded-[4px] sm:rounded-md border-2 border-dashed border-emerald-900/40 bg-emerald-950/20 flex items-center justify-center text-emerald-800/40 text-[9px] sm:text-xs font-semibold select-none"
            >
              {idx < 3 ? 'FLOP' : idx === 3 ? 'TURN' : 'RIVER'}
            </div>
          );
        }

        return (
          <div key={idx} className="animate-deal-card">
            <CardView card={card} highlight={isWinning} size="sm" />
          </div>
        );
      })}
    </div>
  );
};
