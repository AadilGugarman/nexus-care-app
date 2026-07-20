'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { MapPin, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/hooks';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';

interface RouteBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialLocation?: string;
  locations: string[];
  onSubmit: (data: { name: string; location: string }) => void;
  getDoctorCount?: (location: string) => number;
}

function RouteBottomSheetImpl({
  open,
  onOpenChange,
  initialName,
  initialLocation,
  locations,
  onSubmit,
  getDoctorCount,
}: RouteBottomSheetProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 100);

  const isEditing = !!initialName;

  useEffect(() => {
    if (open) {
      setName(initialName ?? '');
      setLocation(initialLocation ?? '');
      setSearch('');
    }
  }, [open, initialName, initialLocation]);

  const filteredLocations = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((loc) => loc.toLowerCase().includes(q));
  }, [locations, debouncedSearch]);

  function handleSubmit() {
    if (!name.trim() || !location.trim()) return;
    onSubmit({ name: name.trim(), location: location.trim() });
    onOpenChange(false);
  }

  function handleCancel() {
    onOpenChange(false);
  }

  const canSubmit = name.trim() && location.trim();
  const doctorCount = location && getDoctorCount ? getDoctorCount(location) : 0;

  if (!open) return null;

  return (
    <MobileBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Rename Route' : 'Create Route'}
      description={
        isEditing
          ? 'Update the route name.'
          : 'Create a route and choose its location in one step.'
      }
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'flex-1 h-12 rounded-xl font-bold text-sm text-white transition-all',
              canSubmit
                ? 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed',
            )}
          >
            {isEditing ? 'Save' : 'Create'}
          </button>
        </div>
      }
    >
      <div className="space-y-5 px-5 py-4">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-900 dark:text-slate-50">
            Route Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Route 1"
            autoFocus
            className="h-13 w-full rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
          />
        </div>

        {!initialLocation && (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-900 dark:text-slate-50">
                Select Location
              </label>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Tap a location below to assign this route.
              </p>
            </div>

            <div
              className={cn(
                'flex items-center gap-3 rounded-2xl border px-4 py-3',
                location
                  ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10'
                  : 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-800/50',
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-xl shrink-0',
                  location
                    ? 'bg-indigo-600 dark:bg-indigo-500'
                    : 'bg-slate-200 dark:bg-slate-700',
                )}
              >
                <MapPin
                  className={cn(
                    'h-5 w-5',
                    location ? 'text-white' : 'text-slate-500 dark:text-slate-400',
                  )}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    'truncate text-sm font-bold',
                    location
                      ? 'text-indigo-900 dark:text-indigo-100'
                      : 'text-slate-600 dark:text-slate-300',
                  )}
                >
                  {location || 'No location selected'}
                </div>
                {location && doctorCount > 0 && (
                  <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {doctorCount} {doctorCount === 1 ? 'Doctor' : 'Doctors'} available
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search location"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
              />
            </div>

            <div className="-mx-1 max-h-[42vh] space-y-1 overflow-y-auto px-1">
              {filteredLocations.length === 0 ? (
                <div className="py-10 text-center">
                  <MapPin className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    No locations found
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Try a different search term
                  </p>
                </div>
              ) : (
                filteredLocations.map((loc) => {
                  const count = getDoctorCount ? getDoctorCount(loc) : 0;
                  const isSelected = location === loc;

                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left transition-all',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-500/10'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-xl shrink-0',
                          isSelected
                            ? 'bg-indigo-600 dark:bg-indigo-500'
                            : 'bg-slate-100 dark:bg-slate-800',
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
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            'truncate text-sm font-bold',
                            isSelected
                              ? 'text-indigo-900 dark:text-indigo-100'
                              : 'text-slate-900 dark:text-slate-50',
                          )}
                        >
                          {loc}
                        </div>
                        <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                          {count} {count === 1 ? 'Doctor' : 'Doctors'}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-500">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </MobileBottomSheet>
  );
}

export const RouteBottomSheet = memo(RouteBottomSheetImpl);
