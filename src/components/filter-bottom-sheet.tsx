'use client';

import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialities: string[];
  selectedSpeciality: string;
  sortBy: 'name' | 'speciality';
  onApply: (speciality: string, sortBy: 'name' | 'speciality') => void;
  onReset: () => void;
}

export function FilterBottomSheet({
  open,
  onOpenChange,
  specialities,
  selectedSpeciality,
  sortBy,
  onApply,
  onReset,
}: FilterBottomSheetProps) {
  const [localSpeciality, setLocalSpeciality] = useState(selectedSpeciality);
  const [localSortBy, setLocalSortBy] = useState(sortBy);

  // Sync local state when props change
  useEffect(() => {
    if (open) {
      setLocalSpeciality(selectedSpeciality);
      setLocalSortBy(sortBy);
    }
  }, [open, selectedSpeciality, sortBy]);

  const handleApply = () => {
    onApply(localSpeciality, localSortBy);
  };

  const handleReset = () => {
    setLocalSpeciality('all');
    setLocalSortBy('name');
    onReset();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Filters</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Speciality Filter */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3">
                Speciality
              </h3>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setLocalSpeciality('all')}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all',
                    localSpeciality === 'all'
                      ? 'bg-indigo-100 dark:bg-indigo-500/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      localSpeciality === 'all'
                        ? 'text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-700 dark:text-slate-300',
                    )}
                  >
                    All Specialities
                  </span>
                  {localSpeciality === 'all' && (
                    <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
                {specialities.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setLocalSpeciality(spec)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all',
                      localSpeciality === spec
                        ? 'bg-indigo-100 dark:bg-indigo-500/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                    )}
                  >
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        localSpeciality === spec
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-300',
                      )}
                    >
                      {spec}
                    </span>
                    {localSpeciality === spec && (
                      <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3">
                Sort By
              </h3>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setLocalSortBy('name')}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all',
                    localSortBy === 'name'
                      ? 'bg-indigo-100 dark:bg-indigo-500/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      localSortBy === 'name'
                        ? 'text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-700 dark:text-slate-300',
                    )}
                  >
                    Doctor Name (A-Z)
                  </span>
                  {localSortBy === 'name' && (
                    <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLocalSortBy('speciality')}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all',
                    localSortBy === 'speciality'
                      ? 'bg-indigo-100 dark:bg-indigo-500/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      localSortBy === 'speciality'
                        ? 'text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-700 dark:text-slate-300',
                    )}
                  >
                    Speciality
                  </span>
                  {localSortBy === 'speciality' && (
                    <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 h-12 rounded-xl bg-indigo-600 font-bold text-sm text-white hover:bg-indigo-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
