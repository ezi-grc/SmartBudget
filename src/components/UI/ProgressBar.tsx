import React from 'react';

interface ProgressBarProps {
  value: number; // current value
  max: number; // max value (limit)
  showLabel?: boolean;
  currency?: string;
  height?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  showLabel = true,
  currency = '$',
  height = 'md',
}) => {
  const percentage = max > 0 ? Math.min(Math.round((value / max) * 100), 999) : 0;
  
  // Define status level
  let status: 'safe' | 'near-limit' | 'exceeded' = 'safe';
  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= 70) {
    status = 'near-limit';
  }

  const statusColors = {
    safe: 'bg-emerald-500 shadow-sm shadow-emerald-500/10',
    'near-limit': 'bg-amber-500 shadow-sm shadow-amber-500/10',
    exceeded: 'bg-rose-500 shadow-sm shadow-rose-500/10',
  };

  const statusTextColors = {
    safe: 'text-emerald-600 dark:text-emerald-400',
    'near-limit': 'text-amber-600 dark:text-amber-400',
    exceeded: 'text-rose-600 dark:text-rose-400',
  };

  const statusBgColors = {
    safe: 'bg-emerald-50 dark:bg-emerald-950/20',
    'near-limit': 'bg-amber-50 dark:bg-amber-950/20',
    exceeded: 'bg-rose-50 dark:bg-rose-950/20',
  };

  const barHeights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const getStatusLabel = () => {
    if (status === 'exceeded') return 'Exceeded';
    if (status === 'near-limit') return 'Near Limit';
    return 'Safe';
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs mb-1.5">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {currency}{value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} of {currency}{max.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <div className="flex gap-2 items-center">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${statusBgColors[status]} ${statusTextColors[status]}`}>
              {getStatusLabel()}
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {percentage}%
            </span>
          </div>
        </div>
      )}
      
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${barHeights[height]}`}>
        <div
          className={`${statusColors[status]} h-full rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};
