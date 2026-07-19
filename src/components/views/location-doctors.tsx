'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Filter, X } from 'lucide-react';
import { useStore, getDoctorDays, doctorMatchesQuery } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { useDebouncedValue } from '@/lib/hooks';
import type { Doctor } from '@/lib/types';
import { DoctorItem } from '@/components/doctor-item';
import { SearchBar } from '@/components/search-bar';
import { DoctorDetailsDialog } from '@/components/doctor-details-dialog';
import { FilterBottomSheet } from '@/components/filter-bottom-sheet';

interface LocationDoctorsProps {
  location: string;
  onBack: () => void;
  onEditDoctor: (d: Doctor) => void;
  onSuggestEdit?: (d: Doctor) => void;
  onRequestInactive?: (d: Doctor) => void;
}

type SortBy = 'name' | 'speciality';

function LocationDoctorsImpl({
  location,
  onBack,
  onEditDoctor,
  onSuggestEdit,
  onRequestInactive,
}: LocationDoctorsProps) {
  const { state, updateDoctor, deleteDoctor } = useStore();
  const { role } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 80);
  const [detailsDoctor, setDetailsDoctor] = useState<Doctor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [selectedSpeciality, setSelectedSpeciality] = useState<string>('all');

  const isAdmin = role === 'admin';

  // Get doctors for this location
  const locationDoctors = useMemo(() => {
    return state.doctors.filter((d) => d.location === location);
  }, [state.doctors, location]);

  // Get unique specialities for filter
  const specialities = useMemo(() => {
    const specs = new Set(
      locationDoctors
        .map((d) => d.speciality)
        .filter((s): s is string => s != null && s.trim() !== '')
    );
    return Array.from(specs).sort();
  }, [locationDoctors]);

  // Filter and sort doctors
  const filteredDoctors = useMemo(() => {
    let results = locationDoctors;

    // Apply search
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      results = results.filter((d) => doctorMatchesQuery(d, q));
    }

    // Apply speciality filter
    if (selectedSpeciality !== 'all') {
      results = results.filter((d) => d.speciality === selectedSpeciality);
    }

    // Apply sort
    results = [...results].sort((a, b) => {
      if (sortBy === 'name') {
        return a.doctorName.localeCompare(b.doctorName);
      } else {
        // Sort by speciality, then name
        const specCompare = (a.speciality || '').localeCompare(b.speciality || '');
        return specCompare !== 0 ? specCompare : a.doctorName.localeCompare(b.doctorName);
      }
    });

    return results;
  }, [locationDoctors, debouncedSearch, selectedSpeciality, sortBy]);

  // Stats
  const scheduledCount = useMemo(() => {
    return locationDoctors.filter((d) => (state.assignments[d.id] ?? []).length > 0).length;
  }, [locationDoctors, state.assignments]);

  const handleDelete = useCallback(
    async (id: number) => {
      if (confirmDelete === id) {
        try {
          await deleteDoctor(id);
          toast.success('Doctor deleted');
          setConfirmDelete(null);
        } catch (error) {
          // Error toast already shown by store
        }
      } else {
        setConfirmDelete(id);
        setTimeout(() => setConfirmDelete((cur) => (cur === id ? null : cur)), 3000);
      }
    },
    [confirmDelete, deleteDoctor],
  );

  const handleApplyFilter = useCallback((spec: string, sort: SortBy) => {
    setSelectedSpeciality(spec);
    setSortBy(sort);
    setFilterOpen(false);
  }, []);

  const handleResetFilter = useCallback(() => {
    setSelectedSpeciality('all');
    setSortBy('name');
  }, []);

  const activeFilters = useMemo(() => {
    let count = 0;
    if (selectedSpeciality !== 'all') count++;
    if (sortBy !== 'name') count++;
    return count;
  }, [selectedSpeciality, sortBy]);

  return (
    <div className="space-y-3 pb-2">
      {/* Header */}
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-2 pb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        {/* Back Button + Title */}
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={onBack}
            className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
            aria-label="Back to locations"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 truncate">
              {location}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {locationDoctors.length} doctors · {scheduledCount} scheduled
            </p>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search in this location..."
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="relative h-10 w-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
            aria-label="Filter"
          >
            <Filter className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            {activeFilters > 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                {activeFilters}
              </div>
            )}
          </button>
        </div>

        {/* Active Filters Chips */}
        {activeFilters > 0 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {selectedSpeciality !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedSpeciality('all')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors"
              >
                {selectedSpeciality}
                <X className="h-3 w-3" />
              </button>
            )}
            {sortBy !== 'name' && (
              <button
                type="button"
                onClick={() => setSortBy('name')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors"
              >
                By {sortBy}
                <X className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={handleResetFilter}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      {(debouncedSearch.trim() || activeFilters > 0) && (
        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 px-1">
          {filteredDoctors.length} result{filteredDoctors.length === 1 ? '' : 's'}
        </div>
      )}

      {/* Doctors List */}
      <div className="card-clean overflow-hidden">
        {filteredDoctors.map((d) => (
          <DoctorItem
            key={d.id}
            doctor={d}
            assignedDays={getDoctorDays(state, d.id)}
            onOpenDayModal={() => {}} // No-op: Day assignment moved to Days tab
            onEdit={() => onEditDoctor(d)}
            onSuggestEdit={onSuggestEdit ? () => onSuggestEdit(d) : undefined}
            onRequestInactive={onRequestInactive ? () => onRequestInactive(d) : undefined}
            onOpenDetails={() => setDetailsDoctor(d)}
            onDelete={isAdmin ? () => handleDelete(d.id) : undefined}
            hideDayButton // New prop to hide the day assignment button
          />
        ))}
        {filteredDoctors.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              No doctors found
            </p>
            {(debouncedSearch.trim() || activeFilters > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  handleResetFilter();
                }}
                className="mt-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        specialities={specialities}
        selectedSpeciality={selectedSpeciality}
        sortBy={sortBy}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

      {/* Dialogs - Day Assignment Removed */}
      <DoctorDetailsDialog
        doctor={detailsDoctor}
        open={!!detailsDoctor}
        onOpenChange={(o) => !o && setDetailsDoctor(null)}
      />
    </div>
  );
}

export const LocationDoctors = memo(LocationDoctorsImpl);
