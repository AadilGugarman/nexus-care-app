'use client';

import { memo, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Circle, MapPin, Search, X, UserPlus, UserMinus } from 'lucide-react';
import { useStore, getDoctorsForLocationDay, getDoctorVisitInfo, getVisitStatusLabel } from '@/lib/store';
import { DoctorDetailsDialog } from '@/components/doctor-details-dialog';
import { LocationPicker } from '@/components/location-picker';
import { DayDoctorPicker } from '@/components/day-doctor-picker';
import { DAYS, DAY_LABELS, type DayKey, type Doctor } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/hooks';

interface DaysProps {
  onEditDoctor: (d: Doctor) => void;
  onSuggestEdit?: (d: Doctor) => void;
  onRequestInactive?: (d: Doctor) => void;
  onAssignDoctors?: () => void; // Callback for FAB click
}

function DetailDoctorRow({
  doctor,
  onOpenProfile,
  onUnassign,
}: {
  doctor: Doctor;
  onOpenProfile: () => void;
  onUnassign: () => void;
}) {
  const { markDoctorVisited, resetDoctorVisit } = useStore();
  const info = getDoctorVisitInfo(doctor);
  const isVisited = info.isVisited;

  async function toggleVisited(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    try {
      if (isVisited) {
        await resetDoctorVisit(doctor.id);
        toast.success('Visit reset');
      } else {
        await markDoctorVisited(doctor.id);
        toast.success('Visit marked');
      }
    } catch (error) {
      // Error toast already shown by store
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-100 dark:border-slate-700/60 last:border-0 bg-white dark:bg-slate-800">
      <button
        type="button"
        onClick={toggleVisited}
        className={cn(
          'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
          isVisited
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
            : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        )}
        aria-label={isVisited ? 'Reset visit' : 'Mark visited'}
      >
        {isVisited ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      </button>
      <button type="button" onClick={onOpenProfile} className="flex-1 min-w-0 text-left">
        <div className="font-bold text-sm text-slate-900 dark:text-slate-50 truncate">
          {doctor.doctorName}
        </div>
        {doctor.speciality && (
          <div className="mt-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 truncate">
            {doctor.speciality}
          </div>
        )}
        <div className="mt-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
          {getVisitStatusLabel(info)}
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUnassign();
        }}
        className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
        aria-label="Remove from this day"
        title="Remove from this day"
      >
        <UserMinus className="h-4 w-4" />
      </button>
    </div>
  );
}

function DaysImpl({ onEditDoctor, onSuggestEdit, onRequestInactive, onAssignDoctors }: DaysProps) {
  const { state, setDayAssignments } = useStore();
  const [activeDay, setActiveDay] = useState<DayKey>(() => {
    const jsDay = new Date().getDay();
    const map: (DayKey | null)[] = [null, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', null];
    const t = map[jsDay];
    return t ?? 'monday';
  });
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailLocation, setDetailLocation] = useState<string | null>(null);
  const [selectedSpeciality, setSelectedSpeciality] = useState<string | null>(null);
  const [profileDoctor, setProfileDoctor] = useState<Doctor | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Call onAssignDoctors when picker should open
  useEffect(() => {
    if (onAssignDoctors) {
      (window as any).__openDaysPicker = () => setPickerOpen(true);
    }
    return () => {
      if ((window as any).__openDaysPicker) {
        delete (window as any).__openDaysPicker;
      }
    };
  }, [onAssignDoctors]);

  useEffect(() => {
    setSelectedSpeciality(null);
  }, [activeDay, detailLocation]);

  const handleUnassign = async (doctor: Doctor) => {
    try {
      // Get current assignments for this doctor
      const currentDays = state.assignments[doctor.id] ?? [];
      // Remove the active day from assignments
      const newDays = currentDays.filter(d => d !== activeDay);
      
      await setDayAssignments(doctor.id, newDays);
      
      toast.success(`${doctor.doctorName} removed from ${DAY_LABELS[activeDay]}`);
    } catch (error) {
      // Error toast already shown by store
    }
  };

  const dayCounts: Record<DayKey, number> = useMemo(() => {
    const result = {} as Record<DayKey, number>;
    for (const day of DAYS) {
      result[day] = state.doctors.filter((d) => (state.assignments[d.id] ?? []).includes(day)).length;
    }
    return result;
  }, [state]);

  const allLocationCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const doctor of state.doctors) {
      if ((state.assignments[doctor.id] ?? []).includes(activeDay)) {
        map.set(doctor.location, (map.get(doctor.location) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([location, count]) => ({ location, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => a.location.localeCompare(b.location));
  }, [state.doctors, state.assignments, activeDay]);

  const data = useMemo(() => {
    const locs = new Set<string>();
    for (const d of state.doctors) {
      if ((state.assignments[d.id] ?? []).includes(activeDay)) {
        if (!selectedLocation || d.location === selectedLocation) {
          locs.add(d.location);
        }
      }
    }
    const byLocation = Array.from(locs)
      .sort((a, b) => a.localeCompare(b))
      .map((loc) => ({
        location: loc,
        doctors: getDoctorsForLocationDay(state, loc, activeDay).filter(
          (d) => !selectedLocation || d.location === selectedLocation,
        ),
      }))
      .filter((item) => item.doctors.length > 0);
    return { byLocation };
  }, [state, activeDay, selectedLocation]);

  const detailDoctorsAll = useMemo(() => {
    if (!detailLocation) return [];
    return getDoctorsForLocationDay(state, detailLocation, activeDay);
  }, [state, detailLocation, activeDay]);

  const specialities = useMemo(() => {
    return Array.from(new Set(detailDoctorsAll.map((doctor) => doctor.speciality?.trim()).filter(Boolean) as string[]))
      .sort((a, b) => a.localeCompare(b));
  }, [detailDoctorsAll]);

  const detailDoctors = useMemo(() => {
    if (!selectedSpeciality) return detailDoctorsAll;
    return detailDoctorsAll.filter((doctor) => doctor.speciality === selectedSpeciality);
  }, [detailDoctorsAll, selectedSpeciality]);

  const totalDoctors = data.byLocation.reduce((s, l) => s + l.doctors.length, 0);
  const totalLocations = data.byLocation.length;

  return (
    <div className="space-y-3 pb-2">
      <div className="grid grid-cols-6 gap-1 pb-1">
        {DAYS.map((d) => {
          const isActive = activeDay === d;
          const count = dayCounts[d];
          return (
            <button
              key={d}
              type="button"
              onClick={() => setActiveDay(d)}
              className={cn(
                'h-8 min-w-0 rounded-md px-1 flex items-center justify-center gap-0.5 text-[11px] font-bold transition-colors border leading-none',
                isActive
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700',
              )}
            >
              <span>{DAY_LABELS[d].slice(0, 3)}</span>
              <span
                className={cn(
                  'text-[9px] font-bold rounded-full px-1 min-w-[14px] h-3.5 leading-[14px] text-center',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {detailLocation ? (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDetailLocation(null)}
              className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
              aria-label="Back to locations"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {DAY_LABELS[activeDay]}
              </div>
              <div className="font-bold text-lg text-slate-900 dark:text-slate-50 truncate">
                {detailLocation}
              </div>
            </div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {detailDoctors.length} Doctor{detailDoctors.length === 1 ? '' : 's'}
            </div>
          </div>

          {specialities.length > 0 && (
            <select
              value={selectedSpeciality ?? ''}
              onChange={(event) => setSelectedSpeciality(event.target.value || null)}
              className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-bold text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Specialities</option>
              {specialities.map((speciality) => (
                <option key={speciality} value={speciality}>{speciality}</option>
              ))}
            </select>
          )}

          <div className="card-clean overflow-hidden">
            {detailDoctors.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400 px-4">
                No doctors match this speciality filter.
              </div>
            ) : (
              detailDoctors.map((doctor) => (
                <DetailDoctorRow
                  key={doctor.id}
                  doctor={doctor}
                  onOpenProfile={() => setProfileDoctor(doctor)}
                  onUnassign={() => handleUnassign(doctor)}
                />
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="card-clean px-3 py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-1 min-w-0 text-sm font-bold text-slate-900 dark:text-slate-50 truncate">
                {DAY_LABELS[activeDay]} <span className="text-slate-400 dark:text-slate-500">•</span> {totalDoctors} Doctor{totalDoctors === 1 ? '' : 's'} <span className="text-slate-400 dark:text-slate-500">•</span> {totalLocations} Location{totalLocations === 1 ? '' : 's'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-md text-sm font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors"
            >
              <MapPin className="h-3.5 w-3.5" />
              {selectedLocation ?? 'All Locations'}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {totalDoctors === 0 ? (
            <div className="card-clean py-12 text-center text-sm text-slate-500 dark:text-slate-400 px-6">
              No locations with doctors assigned to {DAY_LABELS[activeDay]}
              {selectedLocation ? ` in ${selectedLocation}` : ''}.
              <div className="mt-1 text-xs font-semibold">Assign days from the Doctors tab.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {data.byLocation.map(({ location, doctors }) => (
                <button
                  key={location}
                  type="button"
                  onClick={() => setDetailLocation(location)}
                  className="w-full card-clean px-3 py-3 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 dark:text-slate-50 truncate text-sm">{location}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      {doctors.length} Doctor{doctors.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <LocationPicker
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        locations={allLocationCounts.map(i => i.location)}
        selectedLocation={selectedLocation}
        onSelect={(location) => {
          setSelectedLocation(location);
          setDetailLocation(null);
          setFilterOpen(false);
        }}
      />
      <DayDoctorPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        day={activeDay}
      />
      <DoctorDetailsDialog
        doctor={profileDoctor}
        open={!!profileDoctor}
        onOpenChange={(open) => !open && setProfileDoctor(null)}
      />
    </div>
  );
}

export const Days = memo(DaysImpl);
