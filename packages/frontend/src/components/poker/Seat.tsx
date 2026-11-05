import React from 'react';
import { Card, EmojiReaction, PublicPlayerView } from '../../types';
import { CardView } from './CardView';
import { ChipsStack } from './ChipsStack';
import { DealerButton } from './DealerButton';
import { Plus } from 'lucide-react';

interface SeatProps {
  seatIndex: number;
  player: PublicPlayerView | null;
  isCurrentTurn: boolean;
  turnTimeRemaining?: number;
  totalTurnTime?: number;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  isMe: boolean;
  winningCards?: Card[];
  reactions?: EmojiReaction[];
  onSit?: (seatIndex: number) => void;
}

export const Seat: React.FC<SeatProps> = ({
  seatIndex,
  player,
  isCurrentTurn,
  turnTimeRemaining = 30,
  totalTurnTime = 30,
  isDealer,
  isSmallBlind,
  isBigBlind,
  isMe,
  winningCards = [],
  reactions = [],
  onSit,
}) => {
  // Empty Seat
  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center">
        <button
          onClick={() => onSit && onSit(seatIndex)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-emerald-600/40 hover:border-amber-400/80 bg-black/40 hover:bg-black/70 flex flex-col items-center justify-center text-emerald-400/60 hover:text-amber-300 transition-all duration-200 group cursor-pointer shadow-lg hover:scale-105"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:rotate-90" />
          <span className="text-[9px] font-bold tracking-tight">SIT</span>
        </button>
      </div>
    );
  }

  const isFolded = player.status === 'FOLDED';
  const isAllIn = player.status === 'ALL_IN';
  const isDisconnected = !player.isConnected;

  // Turn Timer calculation
  const progressPercent = Math.max(0, Math.min(100, (turnTimeRemaining / totalTurnTime) * 100));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Active reactions for this seat
  const seatReactions = reactions.filter(
    r => r.seatIndex === seatIndex || r.playerId === player.id
  );

  return (
    <div className={`relative flex flex-col items-center select-none transition-all duration-300 ${isFolded ? 'opacity-50 grayscale-[0.6]' : ''}`}>
      {/* Floating Reaction Emojis */}
      {seatReactions.map(r => (
        <div
          key={r.timestamp}
          className="absolute -top-12 sm:-top-16 text-3xl sm:text-4xl animate-float-up pointer-events-none z-50 drop-shadow-lg"
        >
          {r.emoji}
        </div>
      ))}

      {/* Button Markers */}
      <div className="absolute -top-3 -right-2 flex items-center gap-1 z-20">
        {isDealer && <DealerButton type="D" />}
        {isSmallBlind && <DealerButton type="SB" />}
        {isBigBlind && <DealerButton type="BB" />}
      </div>

      {/* Hole Cards */}
      {player.hasCards && (
        <div className="flex items-center -space-x-4 mb-[-14px] z-10 transition-transform duration-200 hover:-translate-y-2">
          {player.holeCards && player.holeCards.length === 2 ? (
            <>
              <div className="transform -rotate-6 transition-transform">
                <CardView
                  card={player.holeCards[0]}
                  size={isMe ? 'md' : 'sm'}
                  highlight={winningCards.some(w => w.rank === player.holeCards?.[0].rank && w.suit === player.holeCards?.[0].suit)}
                />
              </div>
              <div className="transform rotate-6 transition-transform">
                <CardView
                  card={player.holeCards[1]}
                  size={isMe ? 'md' : 'sm'}
                  highlight={winningCards.some(w => w.rank === player.holeCards?.[1].rank && w.suit === player.holeCards?.[1].suit)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="transform -rotate-6">
                <CardView faceDown={true} size="sm" />
              </div>
              <div className="transform rotate-6">
                <CardView faceDown={true} size="sm" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Avatar & Timer SVG Container */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
        {/* Animated Turn Timer Ring */}
        {isCurrentTurn && (
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="rgba(230, 200, 117, 0.2)"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke={turnTimeRemaining <= 5 ? '#ef4444' : '#e6c875'}
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear shadow-gold-glow"
            />
          </svg>
        )}

        {/* Avatar Circle */}
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl bg-gradient-to-br from-slate-900 to-black border-2 shadow-2xl transition-all ${
            isMe ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-700'
          } ${isCurrentTurn ? 'scale-105 shadow-gold-glow ring-2 ring-amber-400' : ''}`}
        >
          {player.avatar || '👤'}

          {/* Connection Indicator */}
          <span
            className={`absolute bottom-0 right-1 w-3.5 h-3.5 rounded-full border-2 border-black ${
              isDisconnected ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
            }`}
            title={isDisconnected ? 'Disconnected' : 'Online'}
          />
        </div>
      </div>

      {/* Player Info Box */}
      <div className="mt-1 flex flex-col items-center bg-black/85 border border-slate-700/60 rounded-lg px-2.5 py-1 min-w-[76px] sm:min-w-[96px] shadow-lg backdrop-blur-md z-10">
        <span className="text-[11px] sm:text-xs font-bold text-slate-100 truncate max-w-[80px] sm:max-w-[100px]">
          {player.name} {isMe && '(You)'}
        </span>
        <span className="text-[10px] sm:text-xs font-semibold text-amber-400 tracking-tight">
          ${player.chips.toLocaleString()}
        </span>
      </div>

      {/* Action Status Pill */}
      {player.lastAction && !isFolded && (
        <div className="absolute -bottom-5 bg-gradient-to-r from-amber-600 to-yellow-600 text-black text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md z-20 border border-amber-300">
          {player.lastAction.type} {player.lastAction.amount ? `$${player.lastAction.amount}` : ''}
        </div>
      )}

      {isFolded && (
        <div className="absolute -bottom-5 bg-neutral-800 text-neutral-400 text-[9px] sm:text-[10px] font-bold uppercase px-2 py-0.5 rounded-full z-20 border border-neutral-700">
          FOLD
        </div>
      )}

      {isAllIn && (
        <div className="absolute -bottom-5 bg-red-600 text-white text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full z-20 animate-pulse border border-red-400 shadow-md">
          ALL IN
        </div>
      )}

      {/* Current Bet on Table */}
      {player.currentBet > 0 && (
        <div className="absolute -top-7 sm:-top-8 bg-black/80 px-2 py-0.5 rounded-full border border-amber-500/40 shadow-lg z-20">
          <ChipsStack amount={player.currentBet} size="sm" showLabel={true} />
        </div>
      )}
    </div>
  );
};

