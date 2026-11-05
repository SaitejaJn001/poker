import React from 'react';
import { Card } from '../../types';

interface HandStrengthBadgeProps {
  holeCards?: Card[];
  communityCards?: Card[];
}

export const HandStrengthBadge: React.FC<HandStrengthBadgeProps> = ({
  holeCards = [],
  communityCards = [],
}) => {
  if (holeCards.length < 2) return null;

  // Simple heuristic helper description if cards are available
  const getHelperText = (): string => {
    if (communityCards.length === 0) {
      if (holeCards[0].rank === holeCards[1].rank) {
        return `Pocket Pair (${rankName(holeCards[0].rank)}s)`;
      }
      if (holeCards[0].suit === holeCards[1].suit) {
        return `Suited (${rankName(holeCards[0].rank)} - ${rankName(holeCards[1].rank)})`;
      }
      return `High Card ${rankName(Math.max(holeCards[0].rank, holeCards[1].rank))}`;
    }

    const all = [...holeCards, ...communityCards];
    const ranks = all.map(c => c.rank);
    const rankCounts = new Map<number, number>();
    for (const r of ranks) {
      rankCounts.set(r, (rankCounts.get(r) ?? 0) + 1);
    }
    const maxFreq = Math.max(...Array.from(rankCounts.values()));

    // Check Flush
    const suits = all.map(c => c.suit);
    const suitCounts = new Map<string, number>();
    for (const s of suits) {
      suitCounts.set(s, (suitCounts.get(s) ?? 0) + 1);
    }
    const maxSuitFreq = Math.max(...Array.from(suitCounts.values()));

    if (maxSuitFreq >= 5) return 'Flush!';
    if (maxFreq === 4) return 'Four of a Kind!';
    if (maxFreq === 3 && Array.from(rankCounts.values()).filter(v => v >= 2).length >= 2) return 'Full House!';
    if (maxFreq === 3) return 'Three of a Kind';
    if (Array.from(rankCounts.values()).filter(v => v === 2).length >= 2) return 'Two Pair';
    if (maxFreq === 2) return 'One Pair';

    return `High Card ${rankName(Math.max(...ranks))}`;
  };

  const rankName = (rank: number): string => {
    switch (rank) {
      case 14: return 'Ace';
      case 13: return 'King';
      case 12: return 'Queen';
      case 11: return 'Jack';
      case 10: return '10';
      default: return rank.toString();
    }
  };

  return (
    <div className="bg-emerald-950/90 border border-emerald-400/40 rounded-full px-3 py-1 shadow-md text-emerald-300 text-[11px] sm:text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 animate-fade-in">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
      <span>{getHelperText()}</span>
    </div>
  );
};

