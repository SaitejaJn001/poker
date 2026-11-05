import { Card, HandEvaluation, HandRankCategory, Rank } from './types.js';
import { rankToName } from './Card.js';

export class HandEvaluator {
  /**
   * Evaluates the best 5-card poker hand from an array of 5 to 7 cards.
   */
  public static evaluate(cards: Card[]): HandEvaluation {
    if (cards.length < 5) {
      throw new Error(`At least 5 cards are required for evaluation, received ${cards.length}`);
    }

    const combinations = this.getCombinations(cards, 5);
    let bestEvaluation: HandEvaluation | null = null;

    for (const combo of combinations) {
      const evaluation = this.evaluateFiveCards(combo);
      if (!bestEvaluation || this.compareEvaluations(evaluation, bestEvaluation) > 0) {
        bestEvaluation = evaluation;
      }
    }

    return bestEvaluation!;
  }

  /**
   * Compares two hand evaluations.
   * Returns positive if a > b, negative if a < b, 0 if tie.
   */
  public static compareEvaluations(a: HandEvaluation, b: HandEvaluation): number {
    if (a.category !== b.category) {
      return a.category - b.category;
    }

    // Compare tiebreakers in sequential order
    const len = Math.max(a.tiebreakers.length, b.tiebreakers.length);
    for (let i = 0; i < len; i++) {
      const valA = a.tiebreakers[i] ?? 0;
      const valB = b.tiebreakers[i] ?? 0;
      if (valA !== valB) {
        return valA - valB;
      }
    }

    return 0;
  }

  /**
   * Generates all k-combinations from an array
   */
  private static getCombinations<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (arr.length === 0) return [];

    const head = arr[0];
    const tail = arr.slice(1);

    const withHead = this.getCombinations(tail, k - 1).map(c => [head, ...c]);
    const withoutHead = this.getCombinations(tail, k);

    return [...withHead, ...withoutHead];
  }

  /**
   * Evaluates a specific 5-card combination
   */
  private static evaluateFiveCards(cards: Card[]): HandEvaluation {
    // Sort cards descending by rank
    const sorted = [...cards].sort((a, b) => b.rank - a.rank);

    const isFlush = sorted.every(c => c.suit === sorted[0].suit);
    const straightInfo = this.checkStraight(sorted);

    // Group cards by rank frequency
    const rankCounts = new Map<Rank, number>();
    for (const card of sorted) {
      rankCounts.set(card.rank, (rankCounts.get(card.rank) ?? 0) + 1);
    }

    // Sort rank groups by frequency descending, then by rank descending
    const groups = Array.from(rankCounts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0] - a[0];
    });

    // 1. Royal Flush & Straight Flush
    if (isFlush && straightInfo.isStraight) {
      if (straightInfo.highRank === 14 && straightInfo.isRegularStraight) {
        return {
          category: HandRankCategory.ROYAL_FLUSH,
          categoryName: 'Royal Flush',
          score: 9000000,
          tiebreakers: [14],
          bestFiveCards: sorted,
          description: 'Royal Flush',
        };
      }
      return {
        category: HandRankCategory.STRAIGHT_FLUSH,
        categoryName: 'Straight Flush',
        score: 8000000 + straightInfo.highRank,
        tiebreakers: [straightInfo.highRank],
        bestFiveCards: sorted,
        description: `Straight Flush, ${rankToName(straightInfo.highRank as Rank)} high`,
      };
    }

    // 2. Four of a Kind
    if (groups[0][1] === 4) {
      const quadRank = groups[0][0];
      const kickerRank = groups[1][0];
      return {
        category: HandRankCategory.FOUR_OF_A_KIND,
        categoryName: 'Four of a Kind',
        score: 7000000 + quadRank * 100 + kickerRank,
        tiebreakers: [quadRank, kickerRank],
        bestFiveCards: sorted,
        description: `Four of a Kind, ${rankToName(quadRank, true)}`,
      };
    }

    // 3. Full House
    if (groups[0][1] === 3 && groups[1][1] === 2) {
      const tripsRank = groups[0][0];
      const pairRank = groups[1][0];
      return {
        category: HandRankCategory.FULL_HOUSE,
        categoryName: 'Full House',
        score: 6000000 + tripsRank * 100 + pairRank,
        tiebreakers: [tripsRank, pairRank],
        bestFiveCards: sorted,
        description: `Full House, ${rankToName(tripsRank, true)} full of ${rankToName(pairRank, true)}`,
      };
    }

    // 4. Flush
    if (isFlush) {
      const tiebreakers = sorted.map(c => c.rank);
      return {
        category: HandRankCategory.FLUSH,
        categoryName: 'Flush',
        score: 5000000 + tiebreakers[0],
        tiebreakers,
        bestFiveCards: sorted,
        description: `Flush, ${rankToName(tiebreakers[0] as Rank)} high`,
      };
    }

    // 5. Straight
    if (straightInfo.isStraight) {
      return {
        category: HandRankCategory.STRAIGHT,
        categoryName: 'Straight',
        score: 4000000 + straightInfo.highRank,
        tiebreakers: [straightInfo.highRank],
        bestFiveCards: sorted,
        description: `Straight to the ${rankToName(straightInfo.highRank as Rank)}`,
      };
    }

    // 6. Three of a Kind
    if (groups[0][1] === 3) {
      const tripsRank = groups[0][0];
      const kickers = groups.slice(1).map(g => g[0]);
      return {
        category: HandRankCategory.THREE_OF_A_KIND,
        categoryName: 'Three of a Kind',
        score: 3000000 + tripsRank * 1000 + kickers[0] * 10 + kickers[1],
        tiebreakers: [tripsRank, ...kickers],
        bestFiveCards: sorted,
        description: `Three of a Kind, ${rankToName(tripsRank, true)}`,
      };
    }

    // 7. Two Pair
    if (groups[0][1] === 2 && groups[1][1] === 2) {
      const highPair = groups[0][0];
      const lowPair = groups[1][0];
      const kicker = groups[2][0];
      return {
        category: HandRankCategory.TWO_PAIR,
        categoryName: 'Two Pair',
        score: 2000000 + highPair * 1000 + lowPair * 50 + kicker,
        tiebreakers: [highPair, lowPair, kicker],
        bestFiveCards: sorted,
        description: `Two Pair, ${rankToName(highPair, true)} and ${rankToName(lowPair, true)}`,
      };
    }

    // 8. One Pair
    if (groups[0][1] === 2) {
      const pairRank = groups[0][0];
      const kickers = groups.slice(1).map(g => g[0]);
      return {
        category: HandRankCategory.ONE_PAIR,
        categoryName: 'One Pair',
        score: 1000000 + pairRank * 10000,
        tiebreakers: [pairRank, ...kickers],
        bestFiveCards: sorted,
        description: `Pair of ${rankToName(pairRank, true)}`,
      };
    }

    // 9. High Card
    const tiebreakers = sorted.map(c => c.rank);
    return {
      category: HandRankCategory.HIGH_CARD,
      categoryName: 'High Card',
      score: tiebreakers[0],
      tiebreakers,
      bestFiveCards: sorted,
      description: `High Card, ${rankToName(tiebreakers[0] as Rank)}`,
    };
  }

  /**
   * Helper to determine straight (including A-2-3-4-5 wheel)
   */
  private static checkStraight(sortedDesc: Card[]): {
    isStraight: boolean;
    highRank: number;
    isRegularStraight: boolean;
  } {
    const ranks = sortedDesc.map(c => c.rank);

    // Regular straight check: ranks strictly decrement by 1
    const isRegular = 
      ranks[0] - ranks[1] === 1 &&
      ranks[1] - ranks[2] === 1 &&
      ranks[2] - ranks[3] === 1 &&
      ranks[3] - ranks[4] === 1;

    if (isRegular) {
      return { isStraight: true, highRank: ranks[0], isRegularStraight: true };
    }

    // Ace-low Straight ("Wheel"): A-5-4-3-2 => [14, 5, 4, 3, 2]
    if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) {
      return { isStraight: true, highRank: 5, isRegularStraight: false };
    }

    return { isStraight: false, highRank: 0, isRegularStraight: false };
  }
}

