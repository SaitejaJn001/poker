import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (roomId: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated,
}) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [startingChips, setStartingChips] = useState(2000);
  const [smallBlind, setSmallBlind] = useState(10);
  const [bigBlind, setBigBlind] = useState(20);
  const [turnTimerSeconds, setTurnTimerSeconds] = useState(30);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to create a private room');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name || 'High Roller Room',
          maxPlayers,
          startingChips,
          smallBlind,
          bigBlind,
          minBuyIn: Math.floor(startingChips / 2),
          maxBuyIn: startingChips * 2,
          turnTimerSeconds,
          allowSpectators,
          password: password.trim() || undefined,
          autoStart: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      onRoomCreated(data.roomId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-serif-luxury text-amber-300">
              Create Private Poker Room
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Room Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Room Name
            </label>
            <input
              type="text"
              placeholder="e.g. Royal VIP Lounge"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Grid Settings: Max Players & Starting Chips */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Max Players (2 - 9)
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <option key={n} value={n}>{n} Players</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Starting Chips
              </label>
              <select
                value={startingChips}
                onChange={(e) => setStartingChips(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              >
                <option value={1000}>$1,000</option>
                <option value={2000}>$2,000 (Standard)</option>
                <option value={5000}>$5,000 (Deep Stack)</option>
                <option value={10000}>$10,000 (High Roller)</option>
              </select>
            </div>
          </div>

          {/* Blinds: Small & Big */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Small Blind ($)
              </label>
              <input
                type="number"
                min={1}
                value={smallBlind}
                onChange={(e) => {
                  const sb = Number(e.target.value);
                  setSmallBlind(sb);
                  setBigBlind(sb * 2);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Big Blind ($)
              </label>
              <input
                type="number"
                min={2}
                value={bigBlind}
                onChange={(e) => setBigBlind(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Turn Timer */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Turn Action Timer
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map(seconds => (
                <button
                  type="button"
                  key={seconds}
                  onClick={() => setTurnTimerSeconds(seconds)}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    turnTimerSeconds === seconds
                      ? 'bg-amber-500 text-black border-amber-300 shadow-gold-glow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {seconds} Seconds {seconds === 15 ? '(Blitz)' : seconds === 30 ? '(Normal)' : '(Deep)'}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Room Password (Optional)
            </label>
            <input
              type="password"
              placeholder="Leave blank for open friends link"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Spectator Mode Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-slate-800/80">
            <div>
              <span className="text-xs font-semibold text-slate-200">Allow Spectators</span>
              <p className="text-[11px] text-slate-500">Unseated players can watch games</p>
            </div>
            <input
              type="checkbox"
              checked={allowSpectators}
              onChange={(e) => setAllowSpectators(e.target.checked)}
              className="w-4 h-4 accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-gold-glow transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Creating Room...' : 'Create Private Table & Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

