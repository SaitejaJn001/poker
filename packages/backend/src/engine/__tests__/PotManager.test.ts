import { describe, it, expect } from 'vitest';
import { PotManager } from '../PotManager.js';
import { Player } from '../types.js';

describe('PotManager', () => {
  const createPlayer = (id: string, name: string, contribution: number, status: Player['status'] = 'ACTIVE', chips = 1000): Player => ({
    id,
    name,
    avatar: '♠️',
    chips,
    currentBet: 0,
    totalHandContribution: contribution,
    holeCards: [],
    status,
    seatIndex: 0,
    isHost: false,
    isConnected: true,
    isGuest: false,
  });

  it('calculates single pot when all players contribute equally', () => {
    const players = [
      createPlayer('p1', 'Alice', 100),
      createPlayer('p2', 'Bob', 100),
      createPlayer('p3', 'Charlie', 100),
    ];

    const pots = PotManager.calculatePots(players);
    expect(pots.length).toBe(1);
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligiblePlayerIds).toEqual(['p1', 'p2', 'p3']);
  });

  it('calculates main pot and side pot with all-in players', () => {
    // Alice is all in for 100
    // Bob calls 300
    // Charlie calls 300
    const players = [
      createPlayer('p1', 'Alice', 100, 'ALL_IN', 0),
      createPlayer('p2', 'Bob', 300, 'ACTIVE', 700),
      createPlayer('p3', 'Charlie', 300, 'ACTIVE', 700),
    ];

    const pots = PotManager.calculatePots(players);
    expect(pots.length).toBe(2);

    // Main pot: 100 from Alice, 100 from Bob, 100 from Charlie = 300
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligiblePlayerIds).toEqual(['p1', 'p2', 'p3']);

    // Side pot: 200 from Bob, 200 from Charlie = 400
    expect(pots[1].amount).toBe(400);
    expect(pots[1].eligiblePlayerIds).toEqual(['p2', 'p3']);
  });

  it('handles folded player chips remaining in pots without eligibility', () => {
    // Alice: 100 (all in)
    // Bob: 250 (folded)
    // Charlie: 250 (active)
    const players = [
      createPlayer('p1', 'Alice', 100, 'ALL_IN', 0),
      createPlayer('p2', 'Bob', 250, 'FOLDED', 750),
      createPlayer('p3', 'Charlie', 250, 'ACTIVE', 750),
    ];

    const pots = PotManager.calculatePots(players);
    // Total money: 100 + 250 + 250 = 600
    const totalInPots = pots.reduce((sum, p) => sum + p.amount, 0);
    expect(totalInPots).toBe(600);

    // Main pot: 100 from each = 300, eligible: Alice & Charlie (Bob folded)
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligiblePlayerIds).toEqual(['p1', 'p3']);

    // Side pot: 150 from Bob + 150 from Charlie = 300, eligible: Charlie only
    expect(pots[1].amount).toBe(300);
    expect(pots[1].eligiblePlayerIds).toEqual(['p3']);
  });
});

