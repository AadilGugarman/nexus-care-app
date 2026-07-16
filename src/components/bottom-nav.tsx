'use client';

import { LayoutDashboard, MapPin, Route, CalendarDays, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TabKey } from '@/lib/types';

const tabs: { key: TabKey; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Home', Icon: LayoutDashboard },
  { key: 'locations', label: 'Doctors', Icon: MapPin },
  { key: 'days', label: 'Days', Icon: Calendar },
  { key: 'routes', label: 'Routes', Icon: Route },
  { key: 'today', label: 'Today', Icon: CalendarDays },
];

interface BottomNavProps {
  active: TabKey;
  onChange: (t: TabKey) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 safe-bottom">
      <div className="mx-auto max-w-xl">
        <div className="flex items-stretch justify-between px-1 pt-1.5 pb-1.5">
          {tabs.map(({ key, label, Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange(key)}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1.5 px-1 transition-colors min-w-0',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                <span className={cn('text-[10px] leading-none truncate w-full text-center', isActive ? 'font-bold' : 'font-semibold')}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
