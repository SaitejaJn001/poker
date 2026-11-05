import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { CreateRoomModal } from '../components/modals/CreateRoomModal';
import { AuthModal } from '../components/modals/AuthModal';
import { SettingsModal } from '../components/modals/SettingsModal';
import { soundManager } from '../audio/soundManager';
import {
  Trophy,
  Users,
  Plus,
  Play,
  Volume2,
  VolumeX,
  Sliders,
  LogIn,
  LogOut,
  Coins,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface ActiveRoom {
  id: string;
  name: string;
  playersCount: number;
  maxPlayers: number;
  smallBlind: number;
  bigBlind: number;
  isHandInProgress: boolean;
  hasPassword: boolean;
}

interface LobbyPageProps {
  onJoinRoom: (roomId: string) => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({ onJoinRoom }) => {
  const { user, logout, topUpChips } = useAuth();
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'guest' | 'login' | 'register'>('guest');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const fetchRooms = () => {
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => {
        if (data.rooms) setActiveRooms(data.rooms);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) soundManager.playChipSound();
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onJoinRoom(joinCode.trim());
  };

  const handleQuickPlay = () => {
    if (activeRooms.length > 0) {
      onJoinRoom(activeRooms[0].id);
    } else {
      setIsCreateModalOpen(true);
    }
  };

  const winRate = user && user.gamesPlayed > 0 
    ? Math.round((user.gamesWon / user.gamesPlayed) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-casino-bg text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="px-4 sm:px-8 py-4 border-b border-slate-800/80 bg-black/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-2xl shadow-gold-glow">
            ♠
          </div>
          <div>
            <h1 className="font-serif-luxury font-black text-lg sm:text-xl tracking-wider text-amber-300 leading-tight">
              HIGH ROLLER
            </h1>
            <span className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold block">
              Multiplayer Texas Hold'em
            </span>
          </div>
        </div>

        {/* User Stats & Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 transition cursor-pointer"
            title="Settings"
          >
            <Sliders className="w-5 h-5" />
          </button>

          {user ? (
            <div className="flex items-center gap-3 bg-slate-950/80 border border-amber-500/30 rounded-2xl px-3 py-1.5 shadow-lg">
              <span className="text-2xl">{user.avatar}</span>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-slate-100">{user.displayName}</span>
                <span className="text-xs font-semibold text-amber-400">${user.chips.toLocaleString()}</span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition ml-1"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setAuthMode('guest'); setIsAuthModalOpen(true); }}
              className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black px-4 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-gold-glow transition cursor-pointer flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Join / Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Hero & Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-12 space-y-10">
        {/* Hero Section */}
        <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-br from-[#121622] via-[#0d1017] to-black border border-amber-500/30 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-xl space-y-4 text-center lg:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Real-Time Multiplayer Poker with Friends</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black font-serif-luxury text-slate-100 tracking-tight leading-tight">
              Texas Hold'em <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">Luxury Lounge</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Create a private poker table, invite friends with shareable links, and play together in real-time from anywhere in the world. Authentic casino physics, side pots, turn timers, and rich 3D card animations.
            </p>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button
                onClick={() => {
                  if (!user) {
                    setAuthMode('guest');
                    setIsAuthModalOpen(true);
                  } else {
                    setIsCreateModalOpen(true);
                  }
                }}
                className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black px-6 py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-wider shadow-gold-glow transition active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Create Private Table</span>
              </button>

              <button
                onClick={handleQuickPlay}
                className="bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide transition active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-amber-400" />
                <span>Play Now</span>
              </button>
            </div>
          </div>

          {/* Quick Join by Code Card */}
          <div className="w-full max-w-sm bg-black/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md z-10">
            <h3 className="font-serif-luxury font-bold text-base text-amber-300 mb-1">
              Have an Invitation Code?
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your friend's room ID or paste the link to join instantly.
            </p>

            <form onSubmit={handleJoinByCode} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. room-ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!joinCode.trim()}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Enter Table</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* User Stats Card (if logged in) */}
        {user && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Bankroll</span>
                <span className="text-base sm:text-lg font-black text-amber-300 block">
                  ${user.chips.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Games Won</span>
                <span className="text-base sm:text-lg font-black text-blue-300 block">
                  {user.gamesWon} / {user.gamesPlayed}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Win Rate</span>
                <span className="text-base sm:text-lg font-black text-emerald-300 block">
                  {winRate}%
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-semibold">Biggest Pot</span>
                <span className="text-base sm:text-lg font-black text-purple-300 block">
                  ${user.biggestPotWon.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Active Poker Tables Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="font-serif-luxury font-bold text-xl text-slate-100">
                Active Poker Tables
              </h3>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Private Table</span>
            </button>
          </div>

          {activeRooms.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 text-center space-y-3">
              <div className="text-3xl">♠️</div>
              <p className="text-sm text-slate-400">No active tables right now.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-amber-500 text-black px-4 py-2 rounded-xl font-bold text-xs uppercase"
              >
                Create the First Table
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRooms.map(room => (
                <div
                  key={room.id}
                  className="p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-amber-500/50 shadow-xl transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-base text-slate-100 group-hover:text-amber-300 transition">
                        {room.name}
                      </h4>
                      {room.isHandInProgress ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse">
                          LIVE HAND
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          WAITING
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Blinds: ${room.smallBlind}/${room.bigBlind}</span>
                      <span>•</span>
                      <span>{room.playersCount} of {room.maxPlayers} Players</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500">
                      ID: {room.id}
                    </span>
                    <button
                      onClick={() => onJoinRoom(room.id)}
                      className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wide transition shadow-sm cursor-pointer"
                    >
                      Join Table
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500">
        <p>♠️ High Roller Poker • Texas Hold'em Multiplayer for Friends • Server Authoritative Game Engine</p>
      </footer>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRoomCreated={(id) => onJoinRoom(id)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

