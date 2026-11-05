import { describe, it, expect } from 'vitest';
import { PokerTable } from '../PokerTable.js';
import { TableConfig } from '../types.js';

describe('PokerTable Engine', () => {
  const defaultConfig: TableConfig = {
    id: 'test-table-1',
    name: 'Test Lounge',
    maxPlayers: 6,
    startingChips: 1000,
    smallBlind: 10,
    bigBlind: 20,
    minBuyIn: 200,
    maxBuyIn: 2000,
    turnTimerSeconds: 30,
    allowSpectators: true,
    autoStart: false,
  };

  it('allows players to sit and manages seats correctly', () => {
    const table = new PokerTable(defaultConfig);
    const seat0 = table.sitPlayer({
      id: 'p1',
      name: 'Alice',
      avatar: '👑',
      chips: 1000,
      isHost: true,
      isConnected: true,
      isGuest: false,
    });
    expect(seat0).toBe(0);
    expect(table.seats[0]?.name).toBe('Alice');

    const seat1 = table.sitPlayer({
      id: 'p2',
      name: 'Bob',
      avatar: '♠️',
      chips: 1000,
      isHost: false,
      isConnected: true,
      isGuest: false,
    });
    expect(seat1).toBe(1);
    expect(table.seats[1]?.name).toBe('Bob');
  });

  it('correctly posts blinds and deals cards on startHand', () => {
    const table = new PokerTable(defaultConfig);
    table.sitPlayer({ id: 'p1', name: 'Alice', avatar: '👑', chips: 1000, isHost: true, isConnected: true, isGuest: false });
    table.sitPlayer({ id: 'p2', name: 'Bob', avatar: '♠️', chips: 1000, isHost: false, isConnected: true, isGuest: false });

    const started = table.startHand();
    expect(started).toBe(true);
    expect(table.stage).toBe('PREFLOP');

    // Both players have 2 hole cards
    expect(table.seats[0]?.holeCards.length).toBe(2);
    expect(table.seats[1]?.holeCards.length).toBe(2);

    // Blinds posted: in heads up, dealer is SB (10), non-dealer is BB (20)
    const sbPlayer = table.seats[table.smallBlindSeatIndex];
    const bbPlayer = table.seats[table.bigBlindSeatIndex];

    expect(sbPlayer?.currentBet).toBe(10);
    expect(sbPlayer?.chips).toBe(990);

    expect(bbPlayer?.currentBet).toBe(20);
    expect(bbPlayer?.chips).toBe(980);

    const totalPot = table.pots.reduce((sum, p) => sum + p.amount, 0);
    expect(totalPot).toBe(30);
  });

  it('handles immediate fold resulting in uncontested win', () => {
    const table = new PokerTable(defaultConfig);
    table.sitPlayer({ id: 'p1', name: 'Alice', avatar: '👑', chips: 1000, isHost: true, isConnected: true, isGuest: false });
    table.sitPlayer({ id: 'p2', name: 'Bob', avatar: '♠️', chips: 1000, isHost: false, isConnected: true, isGuest: false });

    table.startHand();

    // Turn is on small blind in heads up
    const activeSeat = table.currentTurnSeatIndex!;
    const activePlayer = table.seats[activeSeat]!;
    const opponentSeat = activeSeat === 0 ? 1 : 0;
    const opponent = table.seats[opponentSeat]!;

    const opponentChipsBefore = opponent.chips;

    // Active player folds
    const res = table.handleAction(activePlayer.id, { type: 'FOLD' });
    expect(res.success).toBe(true);

    // Hand completes, opponent wins pot (30 chips)
    expect(table.stage).toBe('HAND_COMPLETED');
    expect(opponent.chips).toBe(opponentChipsBefore + 30);
  });

  it('advances through betting rounds on call/check to showdown', () => {
    const table = new PokerTable(defaultConfig);
    table.sitPlayer({ id: 'p1', name: 'Alice', avatar: '👑', chips: 1000, isHost: true, isConnected: true, isGuest: false });
    table.sitPlayer({ id: 'p2', name: 'Bob', avatar: '♠️', chips: 1000, isHost: false, isConnected: true, isGuest: false });

    table.startHand();
    expect(table.stage).toBe('PREFLOP');

    // Preflop: SB calls BB (calls 10 more to make 20)
    let curId = table.seats[table.currentTurnSeatIndex!]!.id;
    table.handleAction(curId, { type: 'CALL' });

    // BB checks option
    curId = table.seats[table.currentTurnSeatIndex!]!.id;
    table.handleAction(curId, { type: 'CHECK' });

    // Flop dealt (3 cards)
    expect(table.stage).toBe('FLOP');
    expect(table.communityCards.length).toBe(3);

    // Flop checks
    curId = table.seats[table.currentTurnSeatIndex!]!.id;
    table.handleAction(curId, { type: 'CHECK' });
    curId = table.seats[table.currentTurnSeatIndex!]!.id;
    table.handleAction(curId, { type: 'CHECK' });

    // Turn dealt (4 cards)
    expect(table.stage).toBe('TURN');
    expect(table.communityCards.length).toBe(4);

    // Turn checks
    curId = table.seats[table.currentTurnSeatIndex!]!.id;
    table.handleAction(curId, { type: 'CHECK' });
    curId = table.seats[table.currentTurnSeatIndex!]!.id;
    table.handleAction(curId, { type: 'CHECK' });

    // River dealt (5 cards)
    expect(table.stage).toBe('RIVER');
    expect(table.communityCards.length).toBe(5);

    // River checks
    curId = table.seats[table.currentTurnSeatIndex!]!.id;
    table.handleAction(curId, { type: 'CHECK' });
    curId = table.seats[table.currentTurnSeatIndex!]!.id;
    table.handleAction(curId, { type: 'CHECK' });

    // Hand completes at showdown
    expect(table.stage).toBe('HAND_COMPLETED');
    expect(table.lastHandResults).toBeDefined();
    expect(table.lastHandResults![0].winners.length).toBeGreaterThanOrEqual(1);
  });
});
