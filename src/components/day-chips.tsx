'use client';

import { cn } from '@/lib/utils';
import { DAYS, DAY_LABELS, type DayKey } from '@/lib/types';

interface DayChipsProps {
  selected: DayKey[];
  onToggle: (day: DayKey) => void;
  size?: 'sm' | 'md';
}

const ORDER: DayKey[] = [...DAYS];

export function DayChips({ selected, onToggle, size = 'sm' }: DayChipsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ORDER.map((d) => {
        const isSelected = selected.includes(d);
        return (
          <button
            key={d}
            type="button"
            onClick={() => onToggle(d)}
            className={cn(
              'rounded-full font-medium transition-all active:scale-95',
              size === 'sm' ? 'text-[11px] px-2.5 py-1' : 'text-sm px-3.5 py-1.5',
              isSelected
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
            )}
            title={DAY_LABELS[d]}
          >
            {DAY_LABELS[d].slice(0, 3)}
          </button>
        );
      })}
    </div>
  );
}
