import React, { useState } from 'react';
import { X, Volume2, VolumeX, Sparkles, Sliders, Shield } from 'lucide-react';
import { soundManager } from '../../audio/soundManager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [volume, setVolume] = useState<number>(0.6);

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundManager.playChipSound();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    soundManager.setVolume(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/40 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold font-serif-luxury text-amber-300">
              Audio & Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-3">
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-amber-400" />
              )}
              <div>
                <span className="text-sm font-semibold text-slate-100 block">Game Sound Effects</span>
                <span className="text-xs text-slate-500">Chips, card flips, audio cues</span>
              </div>
            </div>
            <button
              onClick={handleToggleSound}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                isMuted
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-amber-500 text-black border border-amber-300 shadow-gold-glow'
              }`}
            >
              {isMuted ? 'Muted' : 'Enabled'}
            </button>
          </div>

          {/* Volume Slider */}
          {!isMuted && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Master Volume</span>
                <span className="text-amber-400 font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          )}

          {/* Hotkey Guide */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <span className="font-bold text-slate-200 block mb-2">Keyboard Shortcuts</span>
            <div className="grid grid-cols-2 gap-2 text-slate-400">
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-[10px] text-amber-300">Space</kbd>
                <span>Check / Call</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-[10px] text-amber-300">F</kbd>
                <span>Fold Hand</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-[10px] text-amber-300">R</kbd>
                <span>Raise</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-[10px] text-amber-300">A</kbd>
                <span>All-in</span>
              </div>
            </div>
          </div>

          {/* Security & Fair Play Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300/90">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Cryptographically secure Fisher-Yates server deck shuffling. Hole cards are encrypted and strictly hidden from other clients until showdown.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

