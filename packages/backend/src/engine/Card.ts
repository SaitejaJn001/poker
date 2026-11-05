import { Card, Rank, Suit } from './types.js';

export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function cardToString(card: Card): string {
  const rankStr = rankToString(card.rank);
  return `${rankStr}${card.suit}`;
}

export function rankToString(rank: Rank): string {
  switch (rank) {
    case 14: return 'A';
    case 13: return 'K';
    case 12: return 'Q';
    case 11: return 'J';
    case 10: return 'T';
    default: return rank.toString();
  }
}

export function rankToName(rank: Rank, plural = false): string {
  let name = '';
  switch (rank) {
    case 14: name = 'Ace'; break;
    case 13: name = 'King'; break;
    case 12: name = 'Queen'; break;
    case 11: name = 'Jack'; break;
    case 10: name = 'Ten'; break;
    case 9: name = 'Nine'; break;
    case 8: name = 'Eight'; break;
    case 7: name = 'Seven'; break;
    case 6: name = 'Six'; break;
    case 5: name = 'Five'; break;
    case 4: name = 'Four'; break;
    case 3: name = 'Three'; break;
    case 2: name = 'Two'; break;
  }
  if (!plural) return name;
  if (rank === 6) return 'Sixes';
  return `${name}s`;
}

export function suitToSymbol(suit: Suit): string {
  switch (suit) {
    case 's': return '♠';
    case 'h': return '♥';
    case 'd': return '♦';
    case 'c': return '♣';
  }
}

export function stringToCard(str: string): Card {
  if (str.length < 2) {
    throw new Error(`Invalid card string: ${str}`);
  }
  const rankChar = str[0].toUpperCase();
  const suitChar = str[1].toLowerCase() as Suit;

  let rank: Rank;
  switch (rankChar) {
    case 'A': rank = 14; break;
    case 'K': rank = 13; break;
    case 'Q': rank = 12; break;
    case 'J': rank = 11; break;
    case 'T': rank = 10; break;
    default: {
      const parsed = parseInt(rankChar, 10);
      if (parsed >= 2 && parsed <= 9) {
        rank = parsed as Rank;
      } else {
        throw new Error(`Invalid rank: ${rankChar}`);
      }
    }
  }

  if (!SUITS.includes(suitChar)) {
    throw new Error(`Invalid suit: ${suitChar}`);
  }

  return { rank, suit: suitChar };
}

export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

