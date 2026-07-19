'use client';

import { memo, useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/hooks';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';

interface LocationBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: string[];
  selectedLocation?: string;
  onSelect: (location: string) => void;
  showDoctorCount?: boolean;
  getDoctorCount?: (location: string) => number;
  title?: string;
  description?: string;
}

function LocationBottomSheetImpl({
  open,
  onOpenChange,
  locations,
  selectedLocation,
  onSelect,
  showDoctorCount = false,
  getDoctorCount,
  title = 'Select Location',
  description,
}: LocationBottomSheetProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 100);

  const filteredLocations = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((loc) => loc.toLowerCase().includes(q));
  }, [locations, debouncedSearch]);

  function handleSelect(location: string) {
    onSelect(location);
    onOpenChange(false);
    setSearch('');
  }

  if (!open) return null;

  return (
    <MobileBottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setSearch('');
      }}
      title={title}
      description={description}
      contentClassName="flex-1 overflow-y-auto"
    >
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search locations..."
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filteredLocations.length === 0 ? (
          <div className="py-12 text-center">
            <MapPin className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              No locations found
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLocations.map((location) => {
              const isSelected = selectedLocation === location;
              const doctorCount =
                showDoctorCount && getDoctorCount ? getDoctorCount(location) : 0;

              return (
                <button
                  key={location}
                  type="button"
                  onClick={() => handleSelect(location)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all',
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-500 dark:border-indigo-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border-2 border-transparent',
                  )}
                >
                  <div
                    className={cn(
                      'h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                      isSelected
                        ? 'bg-indigo-600 dark:bg-indigo-500'
                        : 'bg-slate-100 dark:bg-slate-700',
                    )}
                  >
                    <MapPin
                      className={cn(
                        'h-5 w-5',
                        isSelected
                          ? 'text-white'
                          : 'text-slate-600 dark:text-slate-400',
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'text-base font-bold truncate',
                        isSelected
                          ? 'text-indigo-900 dark:text-indigo-100'
                          : 'text-slate-900 dark:text-slate-50',
                      )}
                    >
                      {location}
                    </div>
                    {showDoctorCount && (
                      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {doctorCount} {doctorCount === 1 ? 'Doctor' : 'Doctors'}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="h-6 w-6 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shrink-0">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </MobileBottomSheet>
  );
}

export const LocationBottomSheet = memo(LocationBottomSheetImpl);
