import React from 'react';

interface DealerButtonProps {
  className?: string;
  type?: 'D' | 'SB' | 'BB';
}

export const DealerButton: React.FC<DealerButtonProps> = ({ className = '', type = 'D' }) => {
  const styles = {
    D: 'bg-white text-black border-slate-400',
    SB: 'bg-blue-600 text-white border-blue-400',
    BB: 'bg-amber-600 text-white border-amber-400',
  }[type];

  return (
    <div
      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border shadow-md flex items-center justify-center font-black text-[9px] sm:text-[10px] select-none tracking-tighter ${styles} ${className}`}
      style={{ boxShadow: '0 2px 5px rgba(0,0,0,0.6)' }}
    >
      {type}
    </div>
  );
};

