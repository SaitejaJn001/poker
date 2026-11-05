import {
  ActionType,
  Card,
  GameStage,
  HandHistoryEntry,
  HandPotResult,
  Player,
  PlayerAction,
  PlayerStatus,
  Pot,
  PublicPlayerView,
  PublicTableView,
  TableConfig,
} from './types.js';
import { Deck } from './Deck.js';
import { PotManager } from './PotManager.js';
import { HandEvaluator } from './HandEvaluator.js';

export interface PokerTableEvents {
  onTableUpdate?: (table: PokerTable) => void;
  onHandComplete?: (table: PokerTable, result: HandPotResult[]) => void;
  onTurnTimeout?: (table: PokerTable, playerId: string) => void;
}

export class PokerTable {
  public config: TableConfig;
  public seats: (Player | null)[];
  public deck: Deck;
  public communityCards: Card[] = [];
  public stage: GameStage = 'WAITING';
  public dealerSeatIndex: number = 0;
  public smallBlindSeatIndex: number = 0;
  public bigBlindSeatIndex: number = 0;
  public currentTurnSeatIndex: number | null = null;
  public currentHighBet: number = 0;
  public minRaiseAmount: number = 0;
  public lastRaiseAmount: number = 0;
  public pots: Pot[] = [];
  public lastHandResults?: HandPotResult[];
  public handHistory: HandHistoryEntry[] = [];
  public spectatorIds: Set<string> = new Set();

  private turnTimer: NodeJS.Timeout | null = null;
  private turnInterval: NodeJS.Timeout | null = null;
  public turnTimeRemaining: number = 0;
  private events: PokerTableEvents;
  private playersActedThisRound: Set<string> = new Set();
  private handCounter: number = 0;

  constructor(config: TableConfig, events: PokerTableEvents = {}) {
    this.config = config;
    this.events = events;
    this.seats = new Array(config.maxPlayers).fill(null);
    this.deck = new Deck();
  }

  // --- SEAT MANAGEMENT ---

  public sitPlayer(player: Omit<Player, 'seatIndex' | 'currentBet' | 'totalHandContribution' | 'holeCards' | 'status'>, preferredSeat?: number): number {
    let seatIndex = -1;
    if (preferredSeat !== undefined && preferredSeat >= 0 && preferredSeat < this.seats.length && this.seats[preferredSeat] === null) {
      seatIndex = preferredSeat;
    } else {
      seatIndex = this.seats.findIndex(s => s === null);
    }

    if (seatIndex === -1) {
      throw new Error('No available seats at the table');
    }

    // Check if player is already seated
    const existingIndex = this.seats.findIndex(s => s?.id === player.id);
    if (existingIndex !== -1) {
      return existingIndex;
    }

    const newPlayer: Player = {
      ...player,
      seatIndex,
      currentBet: 0,
      totalHandContribution: 0,
      holeCards: [],
      status: this.stage === 'WAITING' ? 'ACTIVE' : 'SITTING_OUT',
    };

    this.seats[seatIndex] = newPlayer;
    this.spectatorIds.delete(player.id);

    return seatIndex;
  }

  public standPlayer(playerId: string): boolean {
    const seatIndex = this.seats.findIndex(s => s?.id === playerId);
    if (seatIndex === -1) return false;

    const player = this.seats[seatIndex]!;
    
    // If hand is in progress and player was active, fold them
    if (this.isHandInProgress() && (player.status === 'ACTIVE' || player.status === 'ALL_IN')) {
      this.handlePlayerFold(player);
    }

    this.seats[seatIndex] = null;
    return true;
  }

  public getPlayer(playerId: string): Player | null {
    return this.seats.find(s => s?.id === playerId) ?? null;
  }

  public getActiveSeatedPlayers(): Player[] {
    return this.seats.filter((s): s is Player => s !== null && s.status !== 'SITTING_OUT');
  }

  public getPlayersWithChips(): Player[] {
    return this.seats.filter((s): s is Player => s !== null && s.chips > 0);
  }

  public isHandInProgress(): boolean {
    return this.stage !== 'WAITING' && this.stage !== 'HAND_COMPLETED';
  }

  // --- HAND START & BLINDS ---

  public canStartHand(): { canStart: boolean; reason?: string } {
    if (this.isHandInProgress()) {
      return { canStart: false, reason: 'Hand already in progress' };
    }
    const eligible = this.getPlayersWithChips();
    if (eligible.length < 2) {
      return { canStart: false, reason: 'Need at least 2 players with chips' };
    }
    return { canStart: true };
  }

  public startHand(): boolean {
    const check = this.canStartHand();
    if (!check.canStart) return false;

    this.clearTurnTimers();
    this.handCounter++;
    this.communityCards = [];
    this.lastHandResults = undefined;
    this.playersActedThisRound.clear();

    // Reset eligible seated players
    for (const player of this.seats) {
      if (player) {
        if (player.chips > 0) {
          player.status = 'ACTIVE';
          player.currentBet = 0;
          player.totalHandContribution = 0;
          player.holeCards = [];
          delete player.lastAction;
        } else {
          player.status = 'SITTING_OUT';
        }
      }
    }

    const activePlayers = this.getActiveSeatedPlayers();
    if (activePlayers.length < 2) return false;

    // Advance dealer button to next active player
    this.advanceDealerButton();

    // Determine Small Blind and Big Blind seats
    this.determineBlinds();

    // Prepare fresh deck and shuffle
    this.deck.reset();
    this.deck.shuffle();

    // Deal 2 hole cards to each active player
    for (let round = 0; round < 2; round++) {
      for (const player of activePlayers) {
        player.holeCards.push(this.deck.deal());
      }
    }

    // Post blinds
    this.postBlinds();

    this.stage = 'PREFLOP';

    // Set first player to act
    this.determineFirstToActPreflop();

    this.startTurnTimer();
    this.notifyUpdate();
    return true;
  }

  private advanceDealerButton(): void {
    const activeSeats = this.seats
      .map((s, idx) => (s && s.status === 'ACTIVE' ? idx : -1))
      .filter(idx => idx !== -1);

    if (activeSeats.length === 0) return;

    const currentIdx = activeSeats.indexOf(this.dealerSeatIndex);
    if (currentIdx === -1) {
      this.dealerSeatIndex = activeSeats[0];
    } else {
      this.dealerSeatIndex = activeSeats[(currentIdx + 1) % activeSeats.length];
    }
  }

  private determineBlinds(): void {
    const activeSeats = this.seats
      .map((s, idx) => (s && s.status === 'ACTIVE' ? idx : -1))
      .filter(idx => idx !== -1);

    const numPlayers = activeSeats.length;
    const dealerPos = activeSeats.indexOf(this.dealerSeatIndex);

    if (numPlayers === 2) {
      // Heads-up: Dealer is Small Blind, other player is Big Blind
      this.smallBlindSeatIndex = this.dealerSeatIndex;
      this.bigBlindSeatIndex = activeSeats[(dealerPos + 1) % numPlayers];
    } else {
      // 3+ players: SB is left of Dealer, BB is left of SB
      this.smallBlindSeatIndex = activeSeats[(dealerPos + 1) % numPlayers];
      this.bigBlindSeatIndex = activeSeats[(dealerPos + 2) % numPlayers];
    }
  }

  private postBlinds(): void {
    const sbPlayer = this.seats[this.smallBlindSeatIndex];
    const bbPlayer = this.seats[this.bigBlindSeatIndex];

    const sbAmount = Math.min(sbPlayer ? sbPlayer.chips : 0, this.config.smallBlind);
    if (sbPlayer) {
      sbPlayer.chips -= sbAmount;
      sbPlayer.currentBet = sbAmount;
      sbPlayer.totalHandContribution = sbAmount;
      if (sbPlayer.chips === 0) sbPlayer.status = 'ALL_IN';
      sbPlayer.lastAction = { type: 'BET', amount: sbAmount };
    }

    const bbAmount = Math.min(bbPlayer ? bbPlayer.chips : 0, this.config.bigBlind);
    if (bbPlayer) {
      bbPlayer.chips -= bbAmount;
      bbPlayer.currentBet = bbAmount;
      bbPlayer.totalHandContribution = bbAmount;
      if (bbPlayer.chips === 0) bbPlayer.status = 'ALL_IN';
      bbPlayer.lastAction = { type: 'BET', amount: bbAmount };
    }

    this.currentHighBet = Math.max(sbAmount, bbAmount);
    this.minRaiseAmount = this.config.bigBlind;
    this.lastRaiseAmount = this.config.bigBlind;

    this.updatePots();
  }

  private determineFirstToActPreflop(): void {
    const activeSeats = this.seats
      .map((s, idx) => (s && s.status === 'ACTIVE' ? idx : -1))
      .filter(idx => idx !== -1);

    const numPlayers = activeSeats.length;
    if (numPlayers === 2) {
      // Heads-up preflop: Small blind (button) acts first
      this.currentTurnSeatIndex = this.smallBlindSeatIndex;
    } else {
      // 3+ players: Under the Gun (left of BB) acts first
      const bbPos = activeSeats.indexOf(this.bigBlindSeatIndex);
      this.currentTurnSeatIndex = activeSeats[(bbPos + 1) % numPlayers];
    }
  }

  private determineFirstToActPostflop(): void {
    const activeSeats = this.seats
      .map((s, idx) => (s && s.status === 'ACTIVE' ? idx : -1))
      .filter(idx => idx !== -1);

    if (activeSeats.length === 0) {
      this.currentTurnSeatIndex = null;
      return;
    }

    // Find first active player clockwise from the dealer button
    const dealerPos = this.dealerSeatIndex;
    let nextSeat = -1;

    for (let i = 1; i <= this.seats.length; i++) {
      const seatIdx = (dealerPos + i) % this.seats.length;
      const player = this.seats[seatIdx];
      if (player && player.status === 'ACTIVE') {
        nextSeat = seatIdx;
        break;
      }
    }

    this.currentTurnSeatIndex = nextSeat !== -1 ? nextSeat : null;
  }

  // --- PLAYER ACTIONS ---

  public handleAction(playerId: string, action: PlayerAction): { success: boolean; error?: string } {
    if (!this.isHandInProgress()) {
      return { success: false, error: 'Hand is not currently in progress' };
    }

    if (this.currentTurnSeatIndex === null) {
      return { success: false, error: 'No player turn is active' };
    }

    const currentPlayer = this.seats[this.currentTurnSeatIndex];
    if (!currentPlayer || currentPlayer.id !== playerId) {
      return { success: false, error: 'Not your turn to act' };
    }

    if (currentPlayer.status !== 'ACTIVE') {
      return { success: false, error: 'Player cannot act in current status' };
    }

    const toCall = this.currentHighBet - currentPlayer.currentBet;

    switch (action.type) {
      case 'FOLD': {
        this.handlePlayerFold(currentPlayer);
        break;
      }

      case 'CHECK': {
        if (toCall > 0) {
          return { success: false, error: `Cannot check, must call ${toCall} or fold` };
        }
        currentPlayer.lastAction = { type: 'CHECK' };
        this.playersActedThisRound.add(currentPlayer.id);
        break;
      }

      case 'CALL': {
        if (toCall <= 0) {
          // Free call is essentially a check
          currentPlayer.lastAction = { type: 'CHECK' };
          this.playersActedThisRound.add(currentPlayer.id);
          break;
        }

        const callAmount = Math.min(currentPlayer.chips, toCall);
        currentPlayer.chips -= callAmount;
        currentPlayer.currentBet += callAmount;
        currentPlayer.totalHandContribution += callAmount;

        if (currentPlayer.chips === 0) {
          currentPlayer.status = 'ALL_IN';
          currentPlayer.lastAction = { type: 'ALL_IN', amount: callAmount };
        } else {
          currentPlayer.lastAction = { type: 'CALL', amount: callAmount };
        }

        this.playersActedThisRound.add(currentPlayer.id);
        break;
      }

      case 'BET':
      case 'RAISE': {
        const targetBet = action.amount;
        if (targetBet === undefined) {
          return { success: false, error: 'Must specify a bet/raise amount' };
        }

        const minValidBet = this.currentHighBet === 0 
          ? this.config.bigBlind 
          : this.currentHighBet + this.minRaiseAmount;

        const additionalNeeded = targetBet - currentPlayer.currentBet;

        // If player goes all-in, they can bet whatever chips they have left
        const isAllIn = additionalNeeded >= currentPlayer.chips;

        if (!isAllIn && targetBet < minValidBet) {
          return { success: false, error: `Minimum bet/raise is ${minValidBet}` };
        }

        const actualAdditional = Math.min(currentPlayer.chips, additionalNeeded);
        const actualTargetBet = currentPlayer.currentBet + actualAdditional;

        if (actualAdditional <= 0) {
          return { success: false, error: 'Invalid bet amount' };
        }

        // Calculate raise increment
        const raiseIncrement = actualTargetBet - this.currentHighBet;
        if (raiseIncrement >= this.minRaiseAmount) {
          this.minRaiseAmount = raiseIncrement;
          this.lastRaiseAmount = raiseIncrement;
          // Full raise reopens betting for all active players
          this.playersActedThisRound.clear();
        }

        currentPlayer.chips -= actualAdditional;
        currentPlayer.currentBet = actualTargetBet;
        currentPlayer.totalHandContribution += actualAdditional;
        this.currentHighBet = Math.max(this.currentHighBet, actualTargetBet);

        if (currentPlayer.chips === 0) {
          currentPlayer.status = 'ALL_IN';
          currentPlayer.lastAction = { type: 'ALL_IN', amount: actualAdditional };
        } else {
          const actionType = this.currentHighBet === actualTargetBet && this.stage !== 'PREFLOP' && this.playersActedThisRound.size === 0 
            ? 'BET' 
            : 'RAISE';
          currentPlayer.lastAction = { type: actionType, amount: actualTargetBet };
        }

        this.playersActedThisRound.add(currentPlayer.id);
        break;
      }

      case 'ALL_IN': {
        const allInChips = currentPlayer.chips;
        if (allInChips <= 0) {
          return { success: false, error: 'No chips to go all-in' };
        }

        const newTotalBet = currentPlayer.currentBet + allInChips;
        const raiseIncrement = newTotalBet - this.currentHighBet;

        if (raiseIncrement >= this.minRaiseAmount) {
          this.minRaiseAmount = raiseIncrement;
          this.lastRaiseAmount = raiseIncrement;
          this.playersActedThisRound.clear();
        }

        currentPlayer.chips = 0;
        currentPlayer.currentBet = newTotalBet;
        currentPlayer.totalHandContribution += allInChips;
        currentPlayer.status = 'ALL_IN';
        currentPlayer.lastAction = { type: 'ALL_IN', amount: allInChips };

        this.currentHighBet = Math.max(this.currentHighBet, newTotalBet);
        this.playersActedThisRound.add(currentPlayer.id);
        break;
      }

      default:
        return { success: false, error: 'Unknown action type' };
    }

    this.updatePots();

    // Check if hand should advance or next player should act
    this.advanceGame();

    return { success: true };
  }

  private handlePlayerFold(player: Player): void {
    player.status = 'FOLDED';
    player.lastAction = { type: 'FOLD' };
    this.playersActedThisRound.add(player.id);
  }

  // --- GAME FLOW / ADVANCE ---

  private advanceGame(): void {
    // 1. Check if only one unfolded player remains
    const unfoldedPlayers = this.seats.filter(
      (s): s is Player => s !== null && s.status !== 'FOLDED' && s.status !== 'SITTING_OUT'
    );

    if (unfoldedPlayers.length === 1) {
      // Uncontested win
      this.finishHandUncontested(unfoldedPlayers[0]);
      return;
    }

    // 2. Check if betting round is complete
    if (this.isBettingRoundComplete()) {
      this.advanceBettingStage();
    } else {
      // Advance to next active player
      this.advanceTurn();
      this.startTurnTimer();
      this.notifyUpdate();
    }
  }

  private isBettingRoundComplete(): boolean {
    const activePlayers = this.seats.filter(
      (s): s is Player => s !== null && s.status === 'ACTIVE'
    );

    // If 0 or 1 active players with chips can act, and all active players match current high bet
    for (const player of activePlayers) {
      if (!this.playersActedThisRound.has(player.id)) {
        return false;
      }
      if (player.currentBet !== this.currentHighBet) {
        return false;
      }
    }

    return true;
  }

  private advanceTurn(): void {
    if (this.currentTurnSeatIndex === null) return;

    let nextSeat = (this.currentTurnSeatIndex + 1) % this.seats.length;
    let found = false;

    for (let i = 0; i < this.seats.length; i++) {
      const candidate = this.seats[nextSeat];
      if (candidate && candidate.status === 'ACTIVE') {
        found = true;
        break;
      }
      nextSeat = (nextSeat + 1) % this.seats.length;
    }

    this.currentTurnSeatIndex = found ? nextSeat : null;
  }

  private advanceBettingStage(): void {
    this.clearTurnTimers();

    // Reset current round bets for all players
    for (const player of this.seats) {
      if (player) {
        player.currentBet = 0;
      }
    }

    this.currentHighBet = 0;
    this.minRaiseAmount = this.config.bigBlind;
    this.lastRaiseAmount = this.config.bigBlind;
    this.playersActedThisRound.clear();

    const activePlayers = this.seats.filter(
      (s): s is Player => s !== null && s.status === 'ACTIVE'
    );
    const nonFolded = this.seats.filter(
      (s): s is Player => s !== null && s.status !== 'FOLDED' && s.status !== 'SITTING_OUT'
    );

    // If less than 2 players can make decisions (e.g. all-in), run out remaining cards straight to showdown
    const runoutAllIn = activePlayers.length <= 1 && nonFolded.length >= 2;

    switch (this.stage) {
      case 'PREFLOP': {
        this.deck.burn();
        this.communityCards.push(this.deck.deal(), this.deck.deal(), this.deck.deal());
        this.stage = 'FLOP';
        break;
      }
      case 'FLOP': {
        this.deck.burn();
        this.communityCards.push(this.deck.deal());
        this.stage = 'TURN';
        break;
      }
      case 'TURN': {
        this.deck.burn();
        this.communityCards.push(this.deck.deal());
        this.stage = 'RIVER';
        break;
      }
      case 'RIVER': {
        this.stage = 'SHOWDOWN';
        this.finishHandShowdown();
        return;
      }
      default:
        break;
    }

    if (runoutAllIn) {
      // Keep advancing until river/showdown
      this.notifyUpdate();
      setTimeout(() => {
        if (this.isHandInProgress()) {
          this.advanceBettingStage();
        }
      }, 1000);
      return;
    }

    this.determineFirstToActPostflop();

    // If no active players with remaining chips (e.g. all are all-in)
    if (this.currentTurnSeatIndex === null) {
      setTimeout(() => {
        this.advanceBettingStage();
      }, 1000);
      return;
    }

    this.startTurnTimer();
    this.notifyUpdate();
  }

  private finishHandUncontested(winner: Player): void {
    this.clearTurnTimers();
    this.stage = 'HAND_COMPLETED';
    this.currentTurnSeatIndex = null;

    const totalPot = this.pots.reduce((sum, p) => sum + p.amount, 0);
    winner.chips += totalPot;

    const result: HandPotResult[] = [{
      potIndex: 0,
      amount: totalPot,
      winners: [{
        playerId: winner.id,
        playerName: winner.name,
        amount: totalPot,
        handDescription: 'All other players folded',
      }],
    }];

    this.lastHandResults = result;
    this.pots = [];

    this.recordHandHistory(result);

    this.notifyHandComplete(result);
    this.notifyUpdate();

    // Schedule next hand if autoStart enabled
    if (this.config.autoStart) {
      setTimeout(() => {
        if (this.canStartHand().canStart) {
          this.startHand();
        } else {
          this.stage = 'WAITING';
          this.notifyUpdate();
        }
      }, 4000);
    }
  }

  private finishHandShowdown(): void {
    this.clearTurnTimers();
    this.stage = 'SHOWDOWN';
    this.currentTurnSeatIndex = null;

    const seatedPlayers = this.seats.filter((s): s is Player => s !== null);
    const results = PotManager.awardPots(
      this.pots,
      seatedPlayers,
      this.communityCards,
      this.dealerSeatIndex
    );

    this.lastHandResults = results;
    this.pots = [];
    this.stage = 'HAND_COMPLETED';

    this.recordHandHistory(results);

    this.notifyHandComplete(results);
    this.notifyUpdate();

    if (this.config.autoStart) {
      setTimeout(() => {
        if (this.canStartHand().canStart) {
          this.startHand();
        } else {
          this.stage = 'WAITING';
          this.notifyUpdate();
        }
      }, 5000);
    }
  }

  private recordHandHistory(results: HandPotResult[]): void {
    const activeContributors = this.seats
      .filter((s): s is Player => s !== null && s.totalHandContribution > 0);

    const historyEntry: HandHistoryEntry = {
      handId: `hand-${Date.now()}-${this.handCounter}`,
      tableId: this.config.id,
      timestamp: Date.now(),
      smallBlind: this.config.smallBlind,
      bigBlind: this.config.bigBlind,
      dealerSeat: this.dealerSeatIndex,
      communityCards: [...this.communityCards],
      pots: results,
      players: activeContributors.map(p => {
        let won = 0;
        for (const pot of results) {
          for (const w of pot.winners) {
            if (w.playerId === p.id) {
              won += w.amount;
            }
          }
        }
        return {
          id: p.id,
          name: p.name,
          seatIndex: p.seatIndex,
          startChips: p.chips - won + p.totalHandContribution,
          endChips: p.chips,
          holeCards: p.status !== 'FOLDED' ? [...p.holeCards] : undefined,
          netWon: won - p.totalHandContribution,
        };
      }),
    };

    this.handHistory.unshift(historyEntry);
    if (this.handHistory.length > 20) {
      this.handHistory.pop();
    }
  }

  public updatePots(): void {
    const seatedPlayers = this.seats.filter((s): s is Player => s !== null);
    this.pots = PotManager.calculatePots(seatedPlayers);
  }

  // --- TURN TIMERS & NOTIFICATIONS ---

  private startTurnTimer(): void {
    this.clearTurnTimers();

    if (this.currentTurnSeatIndex === null) return;
    const player = this.seats[this.currentTurnSeatIndex];
    if (!player) return;

    const totalSeconds = this.config.turnTimerSeconds || 30;
    this.turnTimeRemaining = totalSeconds;

    this.turnInterval = setInterval(() => {
      this.turnTimeRemaining = Math.max(0, this.turnTimeRemaining - 1);
      if (this.turnTimeRemaining <= 0) {
        this.clearTurnTimers();
        this.handleTurnTimeout(player.id);
      }
    }, 1000);
  }

  private clearTurnTimers(): void {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    if (this.turnInterval) {
      clearInterval(this.turnInterval);
      this.turnInterval = null;
    }
  }

  private handleTurnTimeout(playerId: string): void {
    const player = this.seats.find(s => s?.id === playerId);
    if (!player || this.currentTurnSeatIndex !== player.seatIndex) return;

    const toCall = this.currentHighBet - player.currentBet;
    if (toCall === 0) {
      // Free check
      this.handleAction(playerId, { type: 'CHECK' });
    } else {
      // Auto fold
      this.handleAction(playerId, { type: 'FOLD' });
    }

    if (this.events.onTurnTimeout) {
      this.events.onTurnTimeout(this, playerId);
    }
  }

  private notifyUpdate(): void {
    if (this.events.onTableUpdate) {
      this.events.onTableUpdate(this);
    }
  }

  private notifyHandComplete(results: HandPotResult[]): void {
    if (this.events.onHandComplete) {
      this.events.onHandComplete(this, results);
    }
  }

  // --- SERIALIZATION FOR CLIENTS (PROTECTING PRIVATE HOLE CARDS) ---

  public getPublicState(forPlayerId?: string): PublicTableView {
    const totalPot = this.pots.reduce((sum, p) => sum + p.amount, 0);

    const publicSeats: (PublicPlayerView | null)[] = this.seats.map(player => {
      if (!player) return null;

      const isMe = forPlayerId && player.id === forPlayerId;
      const isShowdown = this.stage === 'SHOWDOWN' && player.status !== 'FOLDED';
      const shouldRevealHoleCards = isMe || isShowdown;

      return {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        chips: player.chips,
        currentBet: player.currentBet,
        status: player.status,
        seatIndex: player.seatIndex,
        isHost: player.isHost,
        isConnected: player.isConnected,
        isGuest: player.isGuest,
        hasCards: player.holeCards.length > 0 && player.status !== 'FOLDED',
        holeCards: shouldRevealHoleCards ? player.holeCards : undefined,
        lastAction: player.lastAction,
      };
    });

    let myValidActions = undefined;
    let mySeatIndex: number | null = null;

    if (forPlayerId) {
      const myPlayer = this.seats.find(s => s?.id === forPlayerId);
      if (myPlayer) {
        mySeatIndex = myPlayer.seatIndex;

        if (this.currentTurnSeatIndex === myPlayer.seatIndex && myPlayer.status === 'ACTIVE') {
          const toCall = this.currentHighBet - myPlayer.currentBet;
          const minRaise = this.currentHighBet === 0 
            ? this.config.bigBlind 
            : this.currentHighBet + this.minRaiseAmount;

          myValidActions = {
            canCheck: toCall === 0,
            canCall: toCall > 0 && myPlayer.chips > 0,
            callAmount: Math.min(myPlayer.chips, toCall),
            canBet: this.currentHighBet === 0 && myPlayer.chips >= this.config.bigBlind,
            minBet: this.config.bigBlind,
            maxBet: myPlayer.chips,
            canRaise: this.currentHighBet > 0 && myPlayer.chips > toCall,
            minRaise: Math.min(minRaise, myPlayer.currentBet + myPlayer.chips),
            maxRaise: myPlayer.currentBet + myPlayer.chips,
            canAllIn: myPlayer.chips > 0,
            allInAmount: myPlayer.chips,
          };
        }
      }
    }

    return {
      config: this.config,
      stage: this.stage,
      seats: publicSeats,
      communityCards: this.communityCards,
      pot: totalPot,
      pots: this.pots,
      currentTurnSeatIndex: this.currentTurnSeatIndex,
      dealerSeatIndex: this.dealerSeatIndex,
      smallBlindSeatIndex: this.smallBlindSeatIndex,
      bigBlindSeatIndex: this.bigBlindSeatIndex,
      currentHighBet: this.currentHighBet,
      minRaiseAmount: this.minRaiseAmount,
      turnTimeRemaining: this.turnTimeRemaining,
      handResults: this.lastHandResults,
      spectatorCount: this.spectatorIds.size,
      isHandInProgress: this.isHandInProgress(),
      mySeatIndex,
      myValidActions,
    };
  }
}

