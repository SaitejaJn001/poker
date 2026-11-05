export type Suit = 's' | 'h' | 'd' | 'c'; // spades, hearts, diamonds, clubs
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=A

export interface Card {
  suit: Suit;
  rank: Rank;
}

export enum HandRankCategory {
  HIGH_CARD = 0,
  ONE_PAIR = 1,
  TWO_PAIR = 2,
  THREE_OF_A_KIND = 3,
  STRAIGHT = 4,
  FLUSH = 5,
  FULL_HOUSE = 6,
  FOUR_OF_A_KIND = 7,
  STRAIGHT_FLUSH = 8,
  ROYAL_FLUSH = 9,
}

export interface HandEvaluation {
  category: HandRankCategory;
  categoryName: string;
  score: number; // calculated score for quick comparison
  tiebreakers: number[]; // high to low significance
  bestFiveCards: Card[];
  description: string;
}

export type GameStage = 
  | 'WAITING'
  | 'PREFLOP'
  | 'FLOP'
  | 'TURN'
  | 'RIVER'
  | 'SHOWDOWN'
  | 'HAND_COMPLETED';

export type PlayerStatus = 
  | 'ACTIVE'
  | 'FOLDED'
  | 'ALL_IN'
  | 'SITTING_OUT';

export type ActionType = 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN';

export interface PlayerAction {
  type: ActionType;
  amount?: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  currentBet: number;
  totalHandContribution: number;
  holeCards: Card[];
  status: PlayerStatus;
  seatIndex: number;
  isHost: boolean;
  isConnected: boolean;
  isGuest: boolean;
  lastAction?: {
    type: ActionType;
    amount?: number;
  };
  timeRemaining?: number;
}

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface TableConfig {
  id: string;
  name: string;
  maxPlayers: number; // 2 - 9
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  turnTimerSeconds: number; // 15, 30, 60
  allowSpectators: boolean;
  password?: string;
  autoStart: boolean;
}

export interface PotWinner {
  playerId: string;
  playerName: string;
  amount: number;
  handDescription?: string;
  bestFiveCards?: Card[];
}

export interface HandPotResult {
  potIndex: number;
  amount: number;
  winners: PotWinner[];
}

export interface HandHistoryEntry {
  handId: string;
  tableId: string;
  timestamp: number;
  smallBlind: number;
  bigBlind: number;
  dealerSeat: number;
  communityCards: Card[];
  pots: HandPotResult[];
  players: {
    id: string;
    name: string;
    seatIndex: number;
    startChips: number;
    endChips: number;
    holeCards?: Card[];
    netWon: number;
  }[];
}

export interface PublicPlayerView {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  currentBet: number;
  status: PlayerStatus;
  seatIndex: number;
  isHost: boolean;
  isConnected: boolean;
  isGuest: boolean;
  hasCards: boolean;
  holeCards?: Card[]; // only revealed if this is the player themselves or at showdown
  lastAction?: {
    type: ActionType;
    amount?: number;
  };
}

export interface PublicTableView {
  config: TableConfig;
  stage: GameStage;
  seats: (PublicPlayerView | null)[];
  communityCards: Card[];
  pot: number;
  pots: Pot[];
  currentTurnSeatIndex: number | null;
  dealerSeatIndex: number;
  smallBlindSeatIndex: number;
  bigBlindSeatIndex: number;
  currentHighBet: number;
  minRaiseAmount: number;
  turnTimeRemaining: number;
  handResults?: HandPotResult[];
  spectatorCount: number;
  isHandInProgress: boolean;
  mySeatIndex: number | null;
  myValidActions?: {
    canCheck: boolean;
    canCall: boolean;
    callAmount: number;
    canBet: boolean;
    minBet: number;
    maxBet: number;
    canRaise: boolean;
    minRaise: number;
    maxRaise: number;
    canAllIn: boolean;
    allInAmount: number;
  };
}

