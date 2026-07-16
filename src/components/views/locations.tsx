'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore, getDoctorDays, doctorMatchesQuery } from '@/lib/store';
import type { DayKey, Doctor } from '@/lib/types';
import { DoctorItem } from '@/components/doctor-item';
import { SearchBar } from '@/components/search-bar';
import { DayAssignmentDialog } from '@/components/day-assignment-dialog';
import { DoctorDetailsDialog } from '@/components/doctor-details-dialog';
import { useDebouncedValue } from '@/lib/hooks';

interface LocationsProps {
  onEditDoctor: (d: Doctor) => void;
}

function LocationsImpl({ onEditDoctor }: LocationsProps) {
  const { state, setDayAssignments, updateDoctor, deleteDoctor } = useStore();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 80);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dayModalDoctor, setDayModalDoctor] = useState<Doctor | null>(null);
  const [detailsDoctor, setDetailsDoctor] = useState<Doctor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const locationGroups = useMemo(() => {
    const map = new Map<string, Doctor[]>();
    for (const d of state.doctors) {
      if (!map.has(d.location)) map.set(d.location, []);
      map.get(d.location)!.push(d);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [state.doctors]);

  const handleDaySave = useCallback(
    async (doctorId: number, days: DayKey[], visitFrequencyDays: number) => {
      try {
        await Promise.all([
          setDayAssignments(doctorId, days),
          updateDoctor(doctorId, { frequencyDays: visitFrequencyDays, visitFrequencyDays })
        ]);
        toast.success('Day assignments updated');
      } catch (error) {
        // Error toast already shown by store
      }
    },
    [setDayAssignments, updateDoctor],
  );

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

  if (debouncedSearch.trim()) {
    const q = debouncedSearch.toLowerCase();
    const results = state.doctors.filter((d) => doctorMatchesQuery(d, q));
    return (
      <div className="space-y-3">
        <div className="sticky top-0 z-20 -mx-4 px-4 pt-2 pb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">
            Doctors
          </h1>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search doctors, locations..."
          />
        </div>
        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 px-1">
          {results.length} result{results.length === 1 ? '' : 's'}
        </div>
        <div className="card-clean overflow-hidden">
          {results.map((d) => (
            <DoctorItem
              key={d.id}
              doctor={d}
              assignedDays={getDoctorDays(state, d.id)}
              onOpenDayModal={() => setDayModalDoctor(d)}
              onEdit={() => onEditDoctor(d)}
              onOpenDetails={() => setDetailsDoctor(d)}
            />
          ))}
          {results.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No doctors found
            </div>
          )}
        </div>

        <DayAssignmentDialog
          open={!!dayModalDoctor}
          onOpenChange={(o) => !o && setDayModalDoctor(null)}
          doctorName={dayModalDoctor?.doctorName ?? ''}
          selectedDays={dayModalDoctor ? getDoctorDays(state, dayModalDoctor.id) : []}
          visitFrequencyDays={dayModalDoctor?.frequencyDays ?? dayModalDoctor?.visitFrequencyDays ?? 30}
          onSave={(days, visitFrequencyDays) =>
            dayModalDoctor && handleDaySave(dayModalDoctor.id, days, visitFrequencyDays)
          }
        />
        <DoctorDetailsDialog
          doctor={detailsDoctor}
          open={!!detailsDoctor}
          onOpenChange={(o) => !o && setDetailsDoctor(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-2">
      <div className="sticky top-0 z-20 -mx-4 px-4 pt-2 pb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">
          Doctors
        </h1>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search doctors, locations..."
        />
      </div>

      <div className="space-y-2">
        {locationGroups.map(([location, docs]) => {
          const isOpen = expanded[location];
          const assignedCount = docs.filter((d) => (state.assignments[d.id] ?? []).length > 0).length;

          return (
            <div key={location} className="card-clean overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded((p) => ({ ...p, [location]: !p[location] }))}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-50 truncate text-sm">
                    {location}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    {docs.length} doctors · {assignedCount} scheduled
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    'h-5 w-5 text-slate-400 transition-transform duration-200 shrink-0',
                    isOpen && 'rotate-90',
                  )}
                />
              </button>

              {isOpen && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  {docs.map((d) => (
                    <DoctorItem
                      key={d.id}
                      doctor={d}
                      assignedDays={getDoctorDays(state, d.id)}
                      onOpenDayModal={() => setDayModalDoctor(d)}
                      onEdit={() => onEditDoctor(d)}
                      onOpenDetails={() => setDetailsDoctor(d)}
                      onDelete={() => handleDelete(d.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <DayAssignmentDialog
        open={!!dayModalDoctor}
        onOpenChange={(o) => !o && setDayModalDoctor(null)}
        doctorName={dayModalDoctor?.doctorName ?? ''}
        selectedDays={dayModalDoctor ? getDoctorDays(state, dayModalDoctor.id) : []}
        visitFrequencyDays={dayModalDoctor?.frequencyDays ?? dayModalDoctor?.visitFrequencyDays ?? 30}
        onSave={(days, visitFrequencyDays) =>
          dayModalDoctor && handleDaySave(dayModalDoctor.id, days, visitFrequencyDays)
        }
      />
      <DoctorDetailsDialog
        doctor={detailsDoctor}
        open={!!detailsDoctor}
        onOpenChange={(o) => !o && setDetailsDoctor(null)}
      />
    </div>
  );
}

export const Locations = memo(LocationsImpl);
