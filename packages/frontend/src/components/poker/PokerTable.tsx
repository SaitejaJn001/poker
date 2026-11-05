import React from 'react';
import { Card, EmojiReaction, PublicTableView } from '../../types';
import { Seat } from './Seat';
import { CommunityCards } from './CommunityCards';
import { PotDisplay } from './PotDisplay';
import { HandStrengthBadge } from './HandStrengthBadge';

interface PokerTableProps {
  tableState: PublicTableView;
  myUserId?: string;
  reactions?: EmojiReaction[];
  onSit?: (seatIndex: number) => void;
}

export const PokerTable: React.FC<PokerTableProps> = ({
  tableState,
  myUserId,
  reactions = [],
  onSit,
}) => {
  const {
    seats,
    communityCards,
    pot,
    pots,
    currentTurnSeatIndex,
    dealerSeatIndex,
    smallBlindSeatIndex,
    bigBlindSeatIndex,
    turnTimeRemaining,
    config,
    handResults,
    mySeatIndex,
  } = tableState;

  const totalSeats = config.maxPlayers || 8;

  // Find winning cards from handResults to highlight
  const winningCards: Card[] = [];
  if (handResults) {
    for (const p of handResults) {
      for (const w of p.winners) {
        if (w.bestFiveCards) {
          winningCards.push(...w.bestFiveCards);
        }
      }
    }
  }

  // Get local player's hole cards for the live HandStrengthBadge helper
  const myPlayer = mySeatIndex !== null ? seats[mySeatIndex] : null;
  const myHoleCards = myPlayer?.holeCards;

  // Calculate elliptical seat positions
  // Bottom center is angle PI / 2.
  // If mySeatIndex is set, rotate so mySeat is always at bottom center.
  const referenceSeat = mySeatIndex !== null && mySeatIndex !== undefined ? mySeatIndex : 0;

  const getSeatPosition = (index: number) => {
    // Relative index so referenceSeat is at position 0 (bottom)
    const relativeIndex = (index - referenceSeat + totalSeats) % totalSeats;
    
    // Angle in radians: start at 90 deg (bottom center) and rotate clockwise
    const angle = (Math.PI / 2) + (2 * Math.PI * relativeIndex) / totalSeats;

    // Radii of ellipse (percentages of table container)
    // Mobile adjustments for tighter viewport
    const rx = 41; // 41% width offset from center
    const ry = 36; // 36% height offset from center

    const left = 50 + rx * Math.cos(angle);
    const top = 50 + ry * Math.sin(angle);

    return { left: `${left}%`, top: `${top}%` };
  };

  return (
    <div className="relative w-full max-w-5xl aspect-[16/10] sm:aspect-[16/9] mx-auto flex items-center justify-center p-2 sm:p-6 select-none">
      {/* Outer Luxury Leather Table Rail */}
      <div className="relative w-full h-full rounded-[140px] sm:rounded-[240px] p-4 sm:p-6 bg-gradient-to-b from-[#381e14] via-[#24130d] to-[#140a07] shadow-table-outer border-4 border-[#522f20] flex items-center justify-center">
        {/* Brass Rivet Trim */}
        <div className="absolute inset-1.5 rounded-[136px] sm:rounded-[236px] border border-amber-600/30 pointer-events-none opacity-40"></div>

        {/* Emerald Green Felt Surface */}
        <div className="relative w-full h-full rounded-[120px] sm:rounded-[210px] bg-gradient-to-br from-[#125832] via-[#0d4427] to-[#072414] shadow-felt-inset border-2 border-emerald-900/60 overflow-hidden flex flex-col items-center justify-center">
          {/* Subtle Felt Ring Pattern */}
          <div className="absolute inset-8 rounded-[90px] sm:rounded-[180px] border border-emerald-400/10 pointer-events-none"></div>

          {/* Watermark Logo in Center */}
          <div className="absolute flex flex-col items-center opacity-15 pointer-events-none">
            <span className="text-4xl sm:text-6xl text-amber-300">♠</span>
            <span className="font-serif-luxury font-black text-xs sm:text-sm tracking-widest text-amber-200 uppercase mt-1">
              High Roller Club
            </span>
          </div>

          {/* Center Community Area: Pot Display + Community Cards */}
          <div className="z-10 flex flex-col items-center justify-center gap-2 sm:gap-3">
            <PotDisplay
              totalPot={pot}
              pots={pots}
              handResults={handResults}
            />

            <CommunityCards
              cards={communityCards}
              winningCards={winningCards}
            />

            {/* Hand Strength Helper for Local Player */}
            {myHoleCards && myHoleCards.length === 2 && (
              <HandStrengthBadge
                holeCards={myHoleCards}
                communityCards={communityCards}
              />
            )}
          </div>
        </div>
      </div>

      {/* Seated Players Overlay */}
      {Array.from({ length: totalSeats }).map((_, seatIdx) => {
        const player = seats[seatIdx] ?? null;
        const pos = getSeatPosition(seatIdx);
        const isCurrentTurn = currentTurnSeatIndex === seatIdx;
        const isDealer = dealerSeatIndex === seatIdx;
        const isSmallBlind = smallBlindSeatIndex === seatIdx;
        const isBigBlind = bigBlindSeatIndex === seatIdx;
        const isMe = myUserId !== undefined && player?.id === myUserId;

        return (
          <div
            key={seatIdx}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-20"
            style={{ left: pos.left, top: pos.top }}
          >
            <Seat
              seatIndex={seatIdx}
              player={player}
              isCurrentTurn={isCurrentTurn}
              turnTimeRemaining={turnTimeRemaining}
              totalTurnTime={config.turnTimerSeconds || 30}
              isDealer={isDealer}
              isSmallBlind={isSmallBlind}
              isBigBlind={isBigBlind}
              isMe={isMe}
              winningCards={winningCards}
              reactions={reactions}
              onSit={onSit}
            />
          </div>
        );
      })}
    </div>
  );
};

