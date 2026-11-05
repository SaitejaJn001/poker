import { Card, HandEvaluation, HandPotResult, Player, Pot, PotWinner } from './types.js';
import { HandEvaluator } from './HandEvaluator.js';

export class PotManager {
  /**
   * Calculates the main pot and side pots based on all players' total hand contributions.
   */
  public static calculatePots(players: Player[]): Pot[] {
    const contributors = players.filter(p => p.totalHandContribution > 0);
    if (contributors.length === 0) {
      return [{ amount: 0, eligiblePlayerIds: [] }];
    }

    // Get sorted distinct positive contribution levels
    const levels = Array.from(new Set(contributors.map(p => p.totalHandContribution)))
      .sort((a, b) => a - b);

    const pots: Pot[] = [];
    let prevLevel = 0;

    for (const level of levels) {
      const incrementalAmount = level - prevLevel;
      if (incrementalAmount <= 0) continue;

      let potAmount = 0;
      const eligiblePlayerIds: string[] = [];

      for (const player of contributors) {
        if (player.totalHandContribution > prevLevel) {
          const contributedToThisLevel = Math.min(
            player.totalHandContribution - prevLevel,
            incrementalAmount
          );
          potAmount += contributedToThisLevel;

          // Eligible only if not folded and contributed at least up to this level
          if (player.status !== 'FOLDED' && player.totalHandContribution >= level) {
            eligiblePlayerIds.push(player.id);
          }
        }
      }

      if (potAmount > 0) {
        pots.push({
          amount: potAmount,
          eligiblePlayerIds,
        });
      }

      prevLevel = level;
    }

    // Consolidate adjacent pots with identical eligible players
    const consolidatedPots: Pot[] = [];
    for (const pot of pots) {
      if (consolidatedPots.length === 0) {
        consolidatedPots.push({ ...pot, eligiblePlayerIds: [...pot.eligiblePlayerIds] });
      } else {
        const last = consolidatedPots[consolidatedPots.length - 1];
        const lastIds = [...last.eligiblePlayerIds].sort();
        const curIds = [...pot.eligiblePlayerIds].sort();

        const sameEligibility = 
          lastIds.length === curIds.length &&
          lastIds.every((id, idx) => id === curIds[idx]);

        if (sameEligibility) {
          last.amount += pot.amount;
        } else {
          consolidatedPots.push({ ...pot, eligiblePlayerIds: [...pot.eligiblePlayerIds] });
        }
      }
    }

    // Handle edge case: if a side pot has 0 eligible players (e.g. everyone at that tier folded),
    // fold it back into the preceding pot
    const finalPots: Pot[] = [];
    for (const pot of consolidatedPots) {
      if (pot.eligiblePlayerIds.length === 0 && finalPots.length > 0) {
        finalPots[finalPots.length - 1].amount += pot.amount;
      } else {
        finalPots.push(pot);
      }
    }

    return finalPots.length > 0 ? finalPots : [{ amount: 0, eligiblePlayerIds: [] }];
  }

  /**
   * Distributes all pots to the rightful winners.
   * Handles ties, splits, and odd chip distribution.
   */
  public static awardPots(
    pots: Pot[],
    players: Player[],
    communityCards: Card[],
    dealerSeatIndex: number
  ): HandPotResult[] {
    const results: HandPotResult[] = [];
    const playerMap = new Map<string, Player>(players.map(p => [p.id, p]));

    // Pre-evaluate hands for all active/all-in players
    const evaluations = new Map<string, HandEvaluation>();
    for (const player of players) {
      if (player.status !== 'FOLDED' && player.holeCards.length === 2 && communityCards.length === 5) {
        evaluations.set(player.id, HandEvaluator.evaluate([...player.holeCards, ...communityCards]));
      }
    }

    // Function to calculate seat distance clockwise from dealer button for odd chip rules
    const getSeatDistance = (seatIndex: number, totalSeats = 10) => {
      return (seatIndex - dealerSeatIndex + totalSeats) % totalSeats;
    };

    pots.forEach((pot, index) => {
      if (pot.amount <= 0 || pot.eligiblePlayerIds.length === 0) return;

      // Filter eligible players who are still in the pot
      const eligible = pot.eligiblePlayerIds
        .map(id => playerMap.get(id))
        .filter((p): p is Player => p !== undefined && p.status !== 'FOLDED');

      if (eligible.length === 0) return;

      if (eligible.length === 1) {
        // Only one eligible player (e.g. everyone else folded or only one eligible for side pot)
        const winner = eligible[0];
        winner.chips += pot.amount;
        const evaluation = evaluations.get(winner.id);

        results.push({
          potIndex: index,
          amount: pot.amount,
          winners: [{
            playerId: winner.id,
            playerName: winner.name,
            amount: pot.amount,
            handDescription: evaluation?.description ?? 'Last player remaining',
            bestFiveCards: evaluation?.bestFiveCards,
          }],
        });
        return;
      }

      // If multiple eligible players, compare hand evaluations
      let bestEval: HandEvaluation | null = null;
      let winningPlayers: Player[] = [];

      for (const player of eligible) {
        const evalResult = evaluations.get(player.id);
        if (!evalResult) continue;

        if (!bestEval) {
          bestEval = evalResult;
          winningPlayers = [player];
        } else {
          const comp = HandEvaluator.compareEvaluations(evalResult, bestEval);
          if (comp > 0) {
            bestEval = evalResult;
            winningPlayers = [player];
          } else if (comp === 0) {
            winningPlayers.push(player);
          }
        }
      }

      if (winningPlayers.length === 0) return;

      // Split pot evenly
      const splitAmount = Math.floor(pot.amount / winningPlayers.length);
      let remainder = pot.amount % winningPlayers.length;

      // Sort winning players clockwise from dealer for remainder distribution
      winningPlayers.sort((a, b) => getSeatDistance(a.seatIndex) - getSeatDistance(b.seatIndex));

      const potWinners: PotWinner[] = [];

      for (const winner of winningPlayers) {
        let winAmount = splitAmount;
        if (remainder > 0) {
          winAmount += 1;
          remainder -= 1;
        }

        winner.chips += winAmount;
        potWinners.push({
          playerId: winner.id,
          playerName: winner.name,
          amount: winAmount,
          handDescription: bestEval?.description,
          bestFiveCards: bestEval?.bestFiveCards,
        });
      }

      results.push({
        potIndex: index,
        amount: pot.amount,
        winners: potWinners,
      });
    });

    return results;
  }
}

