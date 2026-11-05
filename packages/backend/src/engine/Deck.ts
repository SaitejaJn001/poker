import crypto from 'crypto';
import { Card, Rank, Suit } from './types.js';
import { RANKS, SUITS } from './Card.js';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push({ suit, rank });
      }
    }
  }

  /**
   * Cryptographically secure Fisher-Yates shuffle
   */
  public shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      // crypto.randomInt(0, i + 1) generates cryptographically secure integer in [0, i]
      const j = crypto.randomInt(0, i + 1);
      const temp = this.cards[i];
      this.cards[i] = this.cards[j];
      this.cards[j] = temp;
    }
  }

  public deal(): Card {
    const card = this.cards.pop();
    if (!card) {
      throw new Error('Deck is empty - cannot deal card');
    }
    return card;
  }

  public burn(): void {
    if (this.cards.length > 0) {
      this.cards.pop();
    }
  }

  public get remaining(): number {
    return this.cards.length;
  }
}

