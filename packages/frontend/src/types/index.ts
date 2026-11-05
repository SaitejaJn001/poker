export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  suit: Suit;
  rank: Rank;
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
  holeCards?: Card[];
  lastAction?: {
    type: ActionType;
    amount?: number;
  };
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

export interface TableConfig {
  id: string;
  name: string;
  maxPlayers: number;
  startingChips: number;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  turnTimerSeconds: number;
  allowSpectators: boolean;
  password?: string;
  autoStart: boolean;
}

export interface PublicTableView {
  config: TableConfig;
  stage: GameStage;
  seats: (PublicPlayerView | null)[];
  communityCards: Card[];
  pot: number;
  pots: { amount: number; eligiblePlayerIds: string[] }[];
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

export interface ChatMessage {
  id: string;
  userId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
}

export interface EmojiReaction {
  id: string;
  playerId: string;
  seatIndex: number | null;
  emoji: string;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  chips: number;
  gamesPlayed: number;
  gamesWon: number;
  chipsWon: number;
  biggestPotWon: number;
  isGuest: boolean;
  createdAt: number;
}

