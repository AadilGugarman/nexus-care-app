'use client';

import { memo, useMemo } from 'react';
import { ChevronRight, MapPin } from 'lucide-react';
import { useStore } from '@/lib/store';

interface LocationsListProps {
  onSelectLocation: (location: string) => void;
}

function LocationsListImpl({ onSelectLocation }: LocationsListProps) {
  const { state } = useStore();

  const locationStats = useMemo(() => {
    const map = new Map<string, { total: number; scheduled: number }>();
    
    for (const d of state.doctors) {
      if (!map.has(d.location)) {
        map.set(d.location, { total: 0, scheduled: 0 });
      }
      const stats = map.get(d.location)!;
      stats.total++;
      if ((state.assignments[d.id] ?? []).length > 0) {
        stats.scheduled++;
      }
    }
    
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([location, stats]) => ({ location, ...stats }));
  }, [state.doctors, state.assignments]);

  return (
    <div className="space-y-3 pb-2">
      {/* Header */}
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-2 pb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Locations
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {locationStats.length} locations · {state.doctors.length} total doctors
        </p>
      </div>

      {/* Locations List */}
      <div className="space-y-2">
        {locationStats.map(({ location, total, scheduled }) => (
          <button
            key={location}
            type="button"
            onClick={() => onSelectLocation(location)}
            className="w-full card-clean hover:shadow-md transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-4 p-4">
              {/* Icon */}
              <div className="h-12 w-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-500/30 transition-colors">
                <MapPin className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 text-left">
                <div className="font-bold text-lg text-slate-900 dark:text-slate-50 truncate">
                  {location}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {total} {total === 1 ? 'Doctor' : 'Doctors'}
                  {scheduled > 0 && ` · ${scheduled} Scheduled`}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="h-6 w-6 text-slate-400 shrink-0 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            </div>
          </button>
        ))}

        {locationStats.length === 0 && (
          <div className="card-clean py-16 text-center">
            <MapPin className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              No locations yet
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Add doctors to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export const LocationsList = memo(LocationsListImpl);
