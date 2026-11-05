import React from 'react';
import { Card, EmojiReaction, PublicPlayerView } from '../../types';
import { CardView } from './CardView';
import { ChipsStack } from './ChipsStack';
import { DealerButton } from './DealerButton';
import { Plus } from 'lucide-react';

export type BetPlacement = 'top' | 'bottom' | 'left' | 'right';

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
  betPlacement?: BetPlacement;
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
  betPlacement = 'top',
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
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border border-dashed border-emerald-600/40 hover:border-amber-400/80 bg-black/50 hover:bg-black/80 flex flex-col items-center justify-center text-emerald-400/70 hover:text-amber-300 transition-all duration-200 group cursor-pointer shadow-md hover:scale-105"
        >
          <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5 transition-transform group-hover:rotate-90" />
          <span className="text-[8px] sm:text-[9px] font-bold tracking-tight">SIT</span>
        </button>
      </div>
    );
  }

  const isFolded = player.status === 'FOLDED';
  const isAllIn = player.status === 'ALL_IN';
  const isDisconnected = !player.isConnected;

  // Scalable Turn Timer SVG parameters
  const progressPercent = Math.max(0, Math.min(100, (turnTimeRemaining / totalTurnTime) * 100));
  const radius = 28;
  const circumference = 2 * Math.PI * radius; // ~175.93
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Active reactions for this seat
  const seatReactions = reactions.filter(
    r => r.seatIndex === seatIndex || r.playerId === player.id
  );

  // Bet position classes directing chips towards center of the table
  const betPlacementClasses: Record<BetPlacement, string> = {
    bottom: 'absolute -bottom-8 sm:-bottom-9 left-1/2 -translate-x-1/2',
    top: isMe 
      ? 'absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2' 
      : 'absolute -top-7 sm:-top-8 left-1/2 -translate-x-1/2',
    left: 'absolute top-1/2 -translate-y-1/2 -left-14 sm:-left-16',
    right: 'absolute top-1/2 -translate-y-1/2 -right-14 sm:-right-16',
  };

  return (
    <div className={`relative flex flex-col items-center select-none transition-all duration-300 ${isFolded ? 'opacity-40 grayscale-[0.8]' : ''}`}>
      {/* Floating Reaction Emojis */}
      {seatReactions.map(r => (
        <div
          key={r.timestamp}
          className="absolute -top-10 sm:-top-14 text-2xl sm:text-3xl animate-float-up pointer-events-none z-50 drop-shadow-md"
        >
          {r.emoji}
        </div>
      ))}

      {/* Button Markers */}
      <div className="absolute -top-2.5 -right-2 flex items-center gap-0.5 z-20">
        {isDealer && <DealerButton type="D" />}
        {isSmallBlind && <DealerButton type="SB" />}
        {isBigBlind && <DealerButton type="BB" />}
      </div>

      {/* Hole Cards */}
      {player.hasCards && (
        <div className={`flex items-center -space-x-3 sm:-space-x-4 ${isMe ? 'mb-[-10px] sm:mb-[-14px]' : 'mb-[-6px] sm:mb-[-10px]'} z-10 transition-transform duration-200 hover:-translate-y-1`}>
          {player.holeCards && player.holeCards.length === 2 ? (
            <>
              <div className="transform -rotate-6 transition-transform">
                <CardView
                  card={player.holeCards[0]}
                  size={isMe ? 'md' : 'xs'}
                  highlight={winningCards.some(w => w.rank === player.holeCards?.[0].rank && w.suit === player.holeCards?.[0].suit)}
                />
              </div>
              <div className="transform rotate-6 transition-transform">
                <CardView
                  card={player.holeCards[1]}
                  size={isMe ? 'md' : 'xs'}
                  highlight={winningCards.some(w => w.rank === player.holeCards?.[1].rank && w.suit === player.holeCards?.[1].suit)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="transform -rotate-6">
                <CardView faceDown={true} size="xs" />
              </div>
              <div className="transform rotate-6">
                <CardView faceDown={true} size="xs" />
              </div>
            </>
          )}
        </div>
      )}

      {/* Avatar & Timer Container */}
      <div className="relative w-11 h-11 sm:w-16 sm:h-16 flex items-center justify-center">
        {/* Turn Timer Ring */}
        {isCurrentTurn && (
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none z-10" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="rgba(230, 200, 117, 0.25)"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="32"
              cy="32"
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
          className={`w-9 h-9 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-2xl bg-gradient-to-br from-slate-900 to-black border-2 shadow-xl transition-all ${
            isMe ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-slate-700'
          } ${isCurrentTurn ? 'scale-105 shadow-gold-glow ring-2 ring-amber-400' : ''}`}
        >
          {player.avatar || '👤'}

          {/* Connection Dot */}
          <span
            className={`absolute bottom-0 right-0.5 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border border-black ${
              isDisconnected ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
            }`}
            title={isDisconnected ? 'Disconnected' : 'Online'}
          />
        </div>
      </div>

      {/* Player Info Box */}
      <div className="mt-0.5 flex flex-col items-center bg-black/85 border border-slate-700/60 rounded px-1.5 sm:px-2 py-0.5 min-w-[62px] sm:min-w-[88px] shadow-md backdrop-blur-md z-10">
        <span className="text-[9px] sm:text-[11px] font-bold text-slate-100 truncate max-w-[64px] sm:max-w-[88px]">
          {player.name} {isMe && '(You)'}
        </span>
        <span className="text-[8px] sm:text-[10px] font-semibold text-amber-400 leading-tight">
          ${player.chips.toLocaleString()}
        </span>
      </div>

      {/* Action Status Pill */}
      {player.lastAction && !isFolded && (
        <div className="absolute -bottom-4 sm:-bottom-5 bg-gradient-to-r from-amber-600 to-yellow-600 text-black text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shadow-md z-20 border border-amber-300">
          {player.lastAction.type} {player.lastAction.amount ? `$${player.lastAction.amount}` : ''}
        </div>
      )}

      {isFolded && (
        <div className="absolute -bottom-4 sm:-bottom-5 bg-neutral-800 text-neutral-400 text-[8px] sm:text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full z-20 border border-neutral-700">
          FOLD
        </div>
      )}

      {isAllIn && (
        <div className="absolute -bottom-4 sm:-bottom-5 bg-red-600 text-white text-[8px] sm:text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full z-20 animate-pulse border border-red-400 shadow-sm">
          ALL IN
        </div>
      )}

      {/* Current Bet on Table - positioned smartly towards table center */}
      {player.currentBet > 0 && (
        <div className={`${betPlacementClasses[betPlacement]} bg-black/85 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-500/40 shadow-lg z-20 whitespace-nowrap`}>
          <ChipsStack amount={player.currentBet} size="sm" showLabel={true} />
        </div>
      )}
    </div>
  );
};
