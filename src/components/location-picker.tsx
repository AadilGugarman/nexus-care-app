'use client';

import { memo, useMemo, useState } from 'react';
import { Check, Search, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/hooks';

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  locations: string[];
  selectedLocation: string | null;
  onSelect: (location: string | null) => void;
}

export const LocationPicker = memo(function LocationPicker({
  open,
  onClose,
  locations,
  selectedLocation,
  onSelect,
}: LocationPickerProps) {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 80);

  const filteredLocations = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((loc) => loc.toLowerCase().includes(q));
  }, [locations, debounced]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close location picker"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-xl rounded-t-2xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-2xl animate-slide-up max-h-[82vh] flex flex-col">
        <div className="px-4 pt-3 pb-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">Select Location</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Location..."
              className="h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto min-h-0 px-2 py-2">
          {filteredLocations.map((location) => {
            const selected = selectedLocation === location;
            return (
              <button
                key={location}
                type="button"
                onClick={() => onSelect(location)}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className={cn(
                  'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  selected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-600',
                )}>
                  {selected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                </div>
                <div className="flex-1 font-bold text-sm text-slate-900 dark:text-slate-50">{location}</div>
              </button>
            );
          })}
          {filteredLocations.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No locations found
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
