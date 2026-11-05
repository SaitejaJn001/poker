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
    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 p-2 rounded-xl bg-black/40 border border-emerald-500/20 shadow-inner backdrop-blur-sm">
      {[0, 1, 2, 3, 4].map((idx) => {
        const card = cards[idx];
        const isWinning = isCardWinning(card);

        if (!card) {
          return (
            <div
              key={idx}
              className="w-12 h-16 sm:w-14 sm:h-20 rounded-md border-2 border-dashed border-emerald-900/40 bg-emerald-950/20 flex items-center justify-center text-emerald-800/30 text-xs font-semibold select-none"
            >
              {idx < 3 ? 'FLOP' : idx === 3 ? 'TURN' : 'RIVER'}
            </div>
          );
        }

        return (
          <div key={idx} className="animate-deal-card">
            <CardView card={card} highlight={isWinning} size="md" />
          </div>
        );
      })}
    </div>
  );
};

