import React, { useState } from 'react';
import { X, User, Lock, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'guest' | 'login' | 'register';
}

const avatarOptions = ['👑', '♠️', '🦈', '🎲', '💎', '🔥', '🦁', '🚀', '🃏', '🎩', '🦊', '⚡'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'guest',
}) => {
  const { login, register, loginAsGuest } = useAuth();
  const [mode, setMode] = useState<'guest' | 'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('👑');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'guest') {
        await loginAsGuest(displayName || 'Lucky Player');
      } else if (mode === 'login') {
        await login(username, password);
      } else if (mode === 'register') {
        await register(username, displayName || username, password, avatar);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold font-serif-luxury text-amber-300">
              {mode === 'guest' ? 'Play as Guest' : mode === 'login' ? 'Member Login' : 'Create Account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mt-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('guest'); setError(null); }}
            className={`py-2 rounded-lg transition ${
              mode === 'guest' ? 'bg-amber-500 text-black shadow-gold-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Instant Guest
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-2 rounded-lg transition ${
              mode === 'login' ? 'bg-amber-500 text-black shadow-gold-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`py-2 rounded-lg transition ${
              mode === 'register' ? 'bg-amber-500 text-black shadow-gold-glow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'guest' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Table Nickname
              </label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5">
                <User className="w-4 h-4 text-slate-500 mr-2" />
                <input
                  type="text"
                  placeholder="e.g. Shark_99"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {mode !== 'guest' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5">
                <User className="w-4 h-4 text-slate-500 mr-2" />
                <input
                  type="text"
                  placeholder="Enter unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Display Name (shown at tables)
              </label>
              <input
                type="text"
                placeholder="e.g. Maverick"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
              />
            </div>
          )}

          {mode !== 'guest' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5">
                <Lock className="w-4 h-4 text-slate-500 mr-2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-600 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Choose Luxury Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {avatarOptions.map(av => (
                  <button
                    type="button"
                    key={av}
                    onClick={() => setAvatar(av)}
                    className={`text-2xl p-2 rounded-xl border transition ${
                      avatar === av
                        ? 'bg-amber-500/20 border-amber-400 scale-110'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-gold-glow transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isLoading
                ? 'Processing...'
                : mode === 'guest'
                  ? 'Join as Guest ($2,000 Free Chips)'
                  : mode === 'login'
                    ? 'Enter Casino Lounge'
                    : 'Create Account & Claim $2,500'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

