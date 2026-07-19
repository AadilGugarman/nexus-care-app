'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { SearchBar } from '@/components/search-bar';
import { useStore, doctorMatchesQuery } from '@/lib/store';
import { Check, Calendar, MapPin, Filter, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/hooks';
import type { DayKey, Doctor } from '@/lib/types';
import { DAY_LABELS } from '@/lib/types';

interface DayDoctorPickerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  day: DayKey;
}

interface FilterState {
  speciality: string;
  qualification: string;
  hospital: string;
}

function DayDoctorPickerImpl({ open, onOpenChange, day }: DayDoctorPickerProps) {
  const { state, setDayAssignments } = useStore();
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 100);
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    speciality: '',
    qualification: '',
    hospital: '',
  });

  // Get doctors currently assigned to this day
  const originalDoctorIds = useMemo(() => {
    return state.doctors
      .filter((d) => (state.assignments[d.id] ?? []).includes(day))
      .map((d) => d.id);
  }, [state.doctors, state.assignments, day]);

  // Get all locations
  const allLocations = useMemo(() => {
    const locations = Array.from(new Set(state.doctors.map((d) => d.location))).sort();
    return locations;
  }, [state.doctors]);

  useEffect(() => {
    if (open) {
      setPending(new Set(originalDoctorIds));
      setSearch('');
      setSelectedLocation('');
      setFilters({ speciality: '', qualification: '', hospital: '' });
    }
  }, [open, originalDoctorIds]);

  // Get doctors for selected location only
  const locationDoctors = useMemo(() => {
    if (!selectedLocation) return [];
    return state.doctors
      .filter((d) => d.location === selectedLocation)
      .sort((a, b) => a.doctorName.localeCompare(b.doctorName));
  }, [state.doctors, selectedLocation]);

  // Get filter options from location doctors
  const filterOptions = useMemo(() => {
    const specialities = new Set<string>();
    const qualifications = new Set<string>();
    const hospitals = new Set<string>();

    locationDoctors.forEach((d) => {
      if (d.speciality) specialities.add(d.speciality);
      if (d.qualification) qualifications.add(d.qualification);
      if (d.hospital) hospitals.add(d.hospital);
    });

    return {
      specialities: Array.from(specialities).sort(),
      qualifications: Array.from(qualifications).sort(),
      hospitals: Array.from(hospitals).sort(),
    };
  }, [locationDoctors]);

  // Apply filters and search
  const filteredDoctors = useMemo(() => {
    let results = locationDoctors;

    // Apply filters
    if (filters.speciality) {
      results = results.filter((d) => d.speciality === filters.speciality);
    }
    if (filters.qualification) {
      results = results.filter((d) => d.qualification === filters.qualification);
    }
    if (filters.hospital) {
      results = results.filter((d) => d.hospital === filters.hospital);
    }

    // Apply search
    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      results = results.filter((d) => doctorMatchesQuery(d, q));
    }

    return results;
  }, [locationDoctors, filters, debouncedSearch]);

  const originalSet = useMemo(() => new Set(originalDoctorIds), [originalDoctorIds]);
  const selectedCount = pending.size;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.speciality) count++;
    if (filters.qualification) count++;
    if (filters.hospital) count++;
    return count;
  }, [filters]);

  function toggleDoctor(doctorId: number) {
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(doctorId)) next.delete(doctorId);
      else next.add(doctorId);
      return next;
    });
  }

  function handleResetFilters() {
    setFilters({ speciality: '', qualification: '', hospital: '' });
  }

  function handleApplyFilters(newFilters: FilterState) {
    setFilters(newFilters);
    setFilterOpen(false);
  }

  async function handleSave() {
    try {
      const next = new Set(pending);
      const original = new Set(originalDoctorIds);
      const promises = [];

      // For each doctor, update their day assignments
      for (const doctorId of new Set([...next, ...original])) {
        const doctor = state.doctors.find((d) => d.id === doctorId);
        if (!doctor) continue;

        const currentDays = state.assignments[doctorId] ?? [];
        const shouldHaveDay = next.has(doctorId);
        const hasDay = currentDays.includes(day);

        if (shouldHaveDay && !hasDay) {
          // Add day
          promises.push(setDayAssignments(doctorId, [...currentDays, day]));
        } else if (!shouldHaveDay && hasDay) {
          // Remove day
          promises.push(setDayAssignments(doctorId, currentDays.filter((d) => d !== day)));
        }
      }

      await Promise.all(promises);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update day assignments:', error);
    }
  }

  function handleCancel() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col p-0 overflow-hidden max-w-md">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle>Assign Doctors to {DAY_LABELS[day]}</DialogTitle>
          <DialogDescription className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Select location, then choose doctors
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Location Selection */}
        {!selectedLocation ? (
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mb-3">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-50 block mb-2">
                Choose Location
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Select a location to see its doctors
              </p>
            </div>
            
            <div className="space-y-2">
              {allLocations.map((location) => {
                const doctorCount = state.doctors.filter((d) => d.location === location).length;
                const assignedCount = state.doctors.filter(
                  (d) => d.location === location && (state.assignments[d.id] ?? []).includes(day)
                ).length;
                
                return (
                  <button
                    key={location}
                    type="button"
                    onClick={() => setSelectedLocation(location)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all text-left"
                  >
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">
                        {location}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {doctorCount} doctors
                        {assignedCount > 0 && ` · ${assignedCount} assigned`}
                      </div>
                    </div>
                    <ChevronDown className="h-5 w-5 -rotate-90 text-slate-400" />
                  </button>
                );
              })}
            </div>

            {allLocations.length === 0 && (
              <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                No locations found. Add doctors first.
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Step 2: Doctor Selection */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 space-y-3">
              {/* Back to location + Filter */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLocation('');
                    setSearch('');
                    setFilters({ speciality: '', qualification: '', hospital: '' });
                  }}
                  className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  ← Change Location
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setFilterOpen(true)}
                  className="relative h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                  aria-label="Filter"
                >
                  <Filter className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  {activeFilterCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </div>
                  )}
                </button>
              </div>

              {/* Location Info */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                  {selectedLocation}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({filteredDoctors.length} doctors)
                </span>
              </div>

              {/* Search */}
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search doctors..."
              />

              {/* Active Filter Chips */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {filters.speciality && (
                    <button
                      type="button"
                      onClick={() => setFilters((f) => ({ ...f, speciality: '' }))}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500/30"
                    >
                      {filters.speciality}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {filters.qualification && (
                    <button
                      type="button"
                      onClick={() => setFilters((f) => ({ ...f, qualification: '' }))}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500/30"
                    >
                      {filters.qualification}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {filters.hospital && (
                    <button
                      type="button"
                      onClick={() => setFilters((f) => ({ ...f, hospital: '' }))}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500/30"
                    >
                      {filters.hospital}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Doctors List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
              {filteredDoctors.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    No doctors found
                  </p>
                  {(debouncedSearch || activeFilterCount > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        handleResetFilters();
                      }}
                      className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                    >
                      Clear search and filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredDoctors.map((d) => {
                    const isSelected = pending.has(d.id);
                    const wasOriginal = originalSet.has(d.id);
                    
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => toggleDoctor(d.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent',
                        )}
                      >
                        <div
                          className={cn(
                            'h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors',
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800',
                          )}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">
                            {d.doctorName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                            {d.speciality || 'No speciality'}
                          </div>
                          {wasOriginal && (
                            <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                              Currently assigned
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 safe-bottom">
          <div className="flex items-center gap-2">
            {selectedLocation && (
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                <span className="text-indigo-600 dark:text-indigo-400">{selectedCount}</span> selected
              </div>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleCancel}
              className="h-11 px-4 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            {selectedLocation && (
              <button
                type="button"
                onClick={handleSave}
                className="h-11 px-5 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Save
              </button>
            )}
          </div>
        </div>

        {/* Filter Bottom Sheet */}
        {selectedLocation && (
          <DayFilterBottomSheet
            open={filterOpen}
            onOpenChange={setFilterOpen}
            filters={filters}
            options={filterOptions}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Filter Bottom Sheet Component
interface DayFilterBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  options: {
    specialities: string[];
    qualifications: string[];
    hospitals: string[];
  };
  onApply: (filters: FilterState) => void;
  onReset: () => void;
}

function DayFilterBottomSheet({
  open,
  onOpenChange,
  filters,
  options,
  onApply,
  onReset,
}: DayFilterBottomSheetProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Filters</h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center"
            >
              <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Speciality */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-2">
                Speciality
              </h3>
              <select
                value={localFilters.speciality}
                onChange={(e) => setLocalFilters((f) => ({ ...f, speciality: e.target.value }))}
                className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-semibold"
              >
                <option value="">All Specialities</option>
                {options.specialities.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Qualification */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-2">
                Qualification
              </h3>
              <select
                value={localFilters.qualification}
                onChange={(e) => setLocalFilters((f) => ({ ...f, qualification: e.target.value }))}
                className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-semibold"
              >
                <option value="">All Qualifications</option>
                {options.qualifications.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            {/* Hospital */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-2">
                Hospital
              </h3>
              <select
                value={localFilters.hospital}
                onChange={(e) => setLocalFilters((f) => ({ ...f, hospital: e.target.value }))}
                className="w-full h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-semibold"
              >
                <option value="">All Hospitals</option>
                {options.hospitals.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setLocalFilters({ speciality: '', qualification: '', hospital: '' });
                onReset();
                onOpenChange(false);
              }}
              className="flex-1 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => onApply(localFilters)}
              className="flex-1 h-12 rounded-xl bg-indigo-600 font-bold text-sm text-white hover:bg-indigo-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export const DayDoctorPicker = memo(DayDoctorPickerImpl);
