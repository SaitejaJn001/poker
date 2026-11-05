import React, { useState, useEffect } from 'react';
import { Card, EmojiReaction, PublicTableView } from '../../types';
import { Seat, BetPlacement } from './Seat';
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

  // Responsive mobile portrait detection
  const [isMobilePortrait, setIsMobilePortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640 && window.innerHeight >= window.innerWidth;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobilePortrait(window.innerWidth < 640 && window.innerHeight >= window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

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
  // Bottom center is angle PI / 2 (90 deg).
  // If mySeatIndex is set, rotate so mySeat is always placed at bottom center.
  const referenceSeat = mySeatIndex !== null && mySeatIndex !== undefined ? mySeatIndex : 0;

  const getSeatPositionInfo = (index: number) => {
    // Relative index so referenceSeat is at position 0 (bottom)
    const relativeIndex = (index - referenceSeat + totalSeats) % totalSeats;
    
    // Angle in radians: start at 90 deg (bottom center) and rotate clockwise
    const angle = (Math.PI / 2) + (2 * Math.PI * relativeIndex) / totalSeats;

    // Radii of ellipse (percentages of table container)
    // Mobile Portrait: tall stadium oval (narrower X, taller Y)
    // Desktop / Landscape: wide horizontal oval (wider X, shorter Y)
    const rx = isMobilePortrait ? 36 : 41;
    const ry = isMobilePortrait ? 41 : 36;

    const left = 50 + rx * Math.cos(angle);
    const top = 50 + ry * Math.sin(angle);

    // Determine smart bet chip direction towards center (50%, 50%)
    let betPlacement: BetPlacement = 'top';
    if (top < 38) {
      betPlacement = 'bottom'; // Top players push chips down
    } else if (top > 62) {
      betPlacement = 'top'; // Bottom players push chips up
    } else if (left < 40) {
      betPlacement = 'right'; // Left players push chips right
    } else if (left > 60) {
      betPlacement = 'left'; // Right players push chips left
    }

    return {
      left: `${left}%`,
      top: `${top}%`,
      betPlacement,
    };
  };

  return (
    <div
      className={`relative w-full mx-auto flex items-center justify-center p-1 sm:p-4 select-none ${
        isMobilePortrait
          ? 'max-w-[360px] h-[500px] max-h-[66vh]'
          : 'max-w-5xl aspect-[16/9]'
      }`}
    >
      {/* Outer Luxury Leather Table Rail */}
      <div
        className={`relative w-full h-full p-2.5 sm:p-5 bg-gradient-to-b from-[#381e14] via-[#24130d] to-[#140a07] shadow-table-outer border-2 sm:border-4 border-[#522f20] flex items-center justify-center ${
          isMobilePortrait ? 'rounded-[140px]' : 'rounded-[160px] sm:rounded-[240px]'
        }`}
      >
        {/* Brass Rivet Trim */}
        <div
          className={`absolute inset-1 border border-amber-600/30 pointer-events-none opacity-40 ${
            isMobilePortrait ? 'rounded-[136px]' : 'rounded-[156px] sm:rounded-[236px]'
          }`}
        ></div>

        {/* Emerald Green Felt Surface */}
        <div
          className={`relative w-full h-full bg-gradient-to-br from-[#125832] via-[#0d4427] to-[#072414] shadow-felt-inset border border-emerald-900/60 overflow-hidden flex flex-col items-center justify-center ${
            isMobilePortrait ? 'rounded-[126px]' : 'rounded-[146px] sm:rounded-[210px]'
          }`}
        >
          {/* Subtle Felt Ring Pattern */}
          <div
            className={`absolute inset-4 sm:inset-8 border border-emerald-400/10 pointer-events-none ${
              isMobilePortrait ? 'rounded-[110px]' : 'rounded-[130px] sm:rounded-[180px]'
            }`}
          ></div>

          {/* Watermark Logo in Center */}
          <div className="absolute flex flex-col items-center opacity-10 pointer-events-none">
            <span className="text-3xl sm:text-5xl text-amber-300">♠</span>
            <span className="font-serif-luxury font-black text-[9px] sm:text-xs tracking-widest text-amber-200 uppercase mt-0.5">
              High Roller Club
            </span>
          </div>

          {/* Center Community Area: Pot Display + Community Cards */}
          <div className="z-10 flex flex-col items-center justify-center gap-1.5 sm:gap-2.5">
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
        const posInfo = getSeatPositionInfo(seatIdx);
        const isCurrentTurn = currentTurnSeatIndex === seatIdx;
        const isDealer = dealerSeatIndex === seatIdx;
        const isSmallBlind = smallBlindSeatIndex === seatIdx;
        const isBigBlind = bigBlindSeatIndex === seatIdx;
        const isMe = myUserId !== undefined && player?.id === myUserId;

        return (
          <div
            key={seatIdx}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 z-20 pointer-events-auto"
            style={{ left: posInfo.left, top: posInfo.top }}
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
              betPlacement={posInfo.betPlacement}
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
