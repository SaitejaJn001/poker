import React from 'react';

interface ChipsStackProps {
  amount: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ChipsStack: React.FC<ChipsStackProps> = ({
  amount,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  if (amount <= 0) return null;

  // Breakdown amount into chip denominations
  const denominations = [
    { value: 1000, color: 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 border-amber-600 text-black', label: '1K' },
    { value: 500, color: 'bg-gradient-to-r from-purple-700 to-indigo-800 border-purple-400 text-white', label: '500' },
    { value: 100, color: 'bg-gradient-to-r from-neutral-900 via-neutral-800 to-black border-amber-400 text-amber-300', label: '100' },
    { value: 25, color: 'bg-gradient-to-r from-emerald-600 to-green-700 border-emerald-300 text-white', label: '25' },
    { value: 5, color: 'bg-gradient-to-r from-red-600 to-rose-700 border-red-300 text-white', label: '5' },
    { value: 1, color: 'bg-gradient-to-r from-slate-200 to-slate-400 border-slate-500 text-slate-800', label: '1' },
  ];

  let remaining = amount;
  const chipList: Array<{ color: string; label: string }> = [];

  for (const denom of denominations) {
    const count = Math.min(3, Math.floor(remaining / denom.value));
    for (let i = 0; i < count; i++) {
      chipList.push({ color: denom.color, label: denom.label });
      if (chipList.length >= 6) break;
    }
    remaining %= denom.value;
    if (chipList.length >= 6) break;
  }

  if (chipList.length === 0) {
    chipList.push({ color: denominations[denominations.length - 1].color, label: '1' });
  }

  const chipSize = {
    sm: 'w-4 h-4 text-[8px]',
    md: 'w-6 h-6 text-[10px]',
    lg: 'w-7 h-7 text-xs',
  }[size];

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* 3D Stack */}
      <div className="relative flex flex-col items-center">
        {chipList.slice(0, 4).map((chip, idx) => (
          <div
            key={idx}
            className={`rounded-full border shadow-sm flex items-center justify-center font-bold select-none ${chip.color} ${chipSize}`}
            style={{
              marginTop: idx === 0 ? 0 : '-12px',
              zIndex: idx,
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }}
          >
            {idx === chipList.length - 1 || idx === 3 ? '' : ''}
          </div>
        ))}
      </div>

      {/* Numerical Badge */}
      {showLabel && (
        <span className="font-semibold text-xs sm:text-sm text-amber-300 drop-shadow-md bg-black/60 px-2 py-0.5 rounded-full border border-amber-500/30">
          ${amount.toLocaleString()}
        </span>
      )}
    </div>
  );
};

