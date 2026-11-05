import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { PokerTable } from '../components/poker/PokerTable';
import { ActionBar } from '../components/poker/ActionBar';
import { ChatDrawer } from '../components/chat/ChatDrawer';
import { ShareRoomModal } from '../components/modals/ShareRoomModal';
import { HandHistoryModal } from '../components/modals/HandHistoryModal';
import { RebuyModal } from '../components/modals/RebuyModal';
import { SettingsModal } from '../components/modals/SettingsModal';
import { AuthModal } from '../components/modals/AuthModal';
import { soundManager } from '../audio/soundManager';
import {
  ArrowLeft,
  Share2,
  History,
  Coins,
  Volume2,
  VolumeX,
  Sliders,
  Play,
  Users,
  Eye,
  LogOut,
  AlertCircle,
} from 'lucide-react';

interface TablePageProps {
  roomId: string;
  onLeave: () => void;
}

export const TablePage: React.FC<TablePageProps> = ({ roomId, onLeave }) => {
  const { user } = useAuth();
  const {
    tableState,
    chatMessages,
    reactions,
    error,
    clearError,
    joinRoom,
    leaveRoom,
    sitAtTable,
    sendAction,
    startGame,
    sendChatMessage,
    sendReaction,
  } = useGame();

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRebuyOpen, setIsRebuyOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  useEffect(() => {
    joinRoom(roomId);
    return () => {
      leaveRoom();
    };
  }, [roomId]);

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) soundManager.playChipSound();
  };

  const handleSitClick = (seatIndex: number) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    sitAtTable(seatIndex);
  };

  const isSeated = tableState?.mySeatIndex !== null && tableState?.mySeatIndex !== undefined;
  const isHost = tableState?.mySeatIndex !== null && tableState?.mySeatIndex !== undefined && tableState?.seats[tableState.mySeatIndex]?.isHost;
  const seatedPlayersCount = tableState ? tableState.seats.filter(s => s !== null).length : 0;
  const canStartHand = tableState && !tableState.isHandInProgress && seatedPlayersCount >= 2;

  return (
    <div className="relative min-h-screen bg-casino-bg text-slate-100 flex flex-col justify-between overflow-x-hidden">
      {/* Top Table Control Bar */}
      <header className="px-3 sm:px-6 py-2.5 bg-black/80 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-2">
        {/* Left: Back & Room Details */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onLeave}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Return to Lobby"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-luxury font-bold text-xs sm:text-base text-amber-300 truncate max-w-[120px] sm:max-w-[220px]">
                {tableState?.config.name || `Table ${roomId}`}
              </h2>
              {tableState?.isHandInProgress && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {tableState.stage}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
              Blinds: ${tableState?.config.smallBlind || 10}/${tableState?.config.bigBlind || 20} • {seatedPlayersCount}/{tableState?.config.maxPlayers || 8} Seated
            </span>
          </div>
        </div>

        {/* Center: Spectator info */}
        {tableState && tableState.spectatorCount > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>{tableState.spectatorCount} Spectating</span>
          </div>
        )}

        {/* Right: Actions (Share, History, Rebuy, Sound, Settings) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Share Invitation Button */}
          <button
            onClick={() => setIsShareOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-gold-glow transition cursor-pointer"
            title="Invite Friends"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite</span>
          </button>

          {/* Hand History */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
            title="Hand History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Rebuy Chips */}
          {isSeated && (
            <button
              onClick={() => setIsRebuyOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
              title="Add Chips / Rebuy"
            >
              <Coins className="w-4 h-4" />
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
            title="Preferences"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Error Alert Bar */}
      {error && (
        <div className="bg-rose-950/90 border-b border-rose-800 px-4 py-2 flex items-center justify-between text-xs text-rose-200 z-30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-rose-400 hover:text-rose-200 font-bold ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Table View Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative p-2 sm:p-4 overflow-hidden">
        {/* Host Start Hand Banner */}
        {canStartHand && (
          <div className="mb-3 z-30 animate-pulse-subtle">
            <button
              onClick={startGame}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold text-xs sm:text-sm uppercase tracking-widest rounded-full shadow-gold-glow border border-amber-300 transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Deal Texas Hold'em Hand</span>
            </button>
          </div>
        )}

        {/* Prompt when waiting for players */}
        {!tableState?.isHandInProgress && seatedPlayersCount < 2 && (
          <div className="mb-3 z-30 bg-black/60 border border-slate-800 rounded-full px-4 py-1.5 text-xs text-slate-400 font-medium">
            Waiting for at least 2 players to sit down to deal cards...
          </div>
        )}

        {/* The Luxury Poker Table */}
        {tableState ? (
          <PokerTable
            tableState={tableState}
            myUserId={user?.id}
            reactions={reactions}
            onSit={handleSitClick}
          />
        ) : (
          <div className="py-24 text-center text-slate-400 text-sm">
            Connecting to Poker Table...
          </div>
        )}
      </main>

      {/* Bottom Sticky Action Bar */}
      <footer className="sticky bottom-0 z-40 w-full">
        {isSeated && tableState && (
          <ActionBar
            validActions={tableState.myValidActions}
            currentHighBet={tableState.currentHighBet}
            bigBlind={tableState.config.bigBlind}
            pot={tableState.pot}
            turnTimeRemaining={tableState.turnTimeRemaining}
            onAction={sendAction}
          />
        )}
      </footer>

      {/* Floating In-Game Chat Drawer */}
      <ChatDrawer
        messages={chatMessages}
        onSendMessage={sendChatMessage}
        onSendReaction={sendReaction}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(prev => !prev)}
      />

      {/* Modals */}
      <ShareRoomModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        tableState={tableState}
      />

      <HandHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        roomId={roomId}
      />

      <RebuyModal
        isOpen={isRebuyOpen}
        onClose={() => setIsRebuyOpen(false)}
        defaultAmount={tableState?.config.startingChips || 2000}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode="guest"
      />
    </div>
  );
};

