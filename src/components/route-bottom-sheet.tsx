'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import { X, MapPin, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/hooks';

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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={handleCancel}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {isEditing ? 'Rename Route' : 'Create Route'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEditing ? 'Update the route name' : 'Create a new route for your visits'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Route Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-50 block">
                Route Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Route 1"
                autoFocus
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Location Selection (only for new routes) */}
            {!initialLocation && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-50 block">
                    Location
                  </label>
                  
                  {/* Selected Location Display */}
                  {location && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-200 dark:border-indigo-500/30">
                      <div className="h-10 w-10 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-indigo-900 dark:text-indigo-100 truncate">
                          {location}
                        </div>
                        {doctorCount > 0 && (
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                            {doctorCount} {doctorCount === 1 ? 'Doctor' : 'Doctors'}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setLocation('')}
                        className="h-8 w-8 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 flex items-center justify-center transition-colors"
                        aria-label="Clear location"
                      >
                        <X className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </button>
                    </div>
                  )}

                  {/* Search */}
                  {!location && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search locations..."
                        className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* Locations List */}
                {!location && (
                  <div className="space-y-1 max-h-[300px] overflow-y-auto -mx-2 px-2">
                    {filteredLocations.length === 0 ? (
                      <div className="py-8 text-center">
                        <MapPin className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                          No locations found
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          Try a different search term
                        </p>
                      </div>
                    ) : (
                      filteredLocations.map((loc) => {
                        const count = getDoctorCount ? getDoctorCount(loc) : 0;
                        
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => {
                              setLocation(loc);
                              setSearch('');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                          >
                            <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                              <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">
                                {loc}
                              </div>
                              {count > 0 && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                  {count} {count === 1 ? 'Doctor' : 'Doctors'}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 dark:border-slate-700 px-5 py-4 safe-bottom">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
          </div>
        </div>
      </div>
    </>
  );
}

export const RouteBottomSheet = memo(RouteBottomSheetImpl);
