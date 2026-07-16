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
import { Check, Route as RouteIcon, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/lib/hooks';

interface RouteDoctorPickerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  routeId: string;
}

function RouteDoctorPickerImpl({ open, onOpenChange, routeId }: RouteDoctorPickerProps) {
  const { state, addDoctorToRoute, removeDoctorFromRoute } = useStore();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 100);
  const [pending, setPending] = useState<Set<number>>(new Set());

  const route = state.routes.find((r) => r.id === routeId);

  useEffect(() => {
    if (open && route) {
      setPending(new Set(route.doctorIds));
      setSearch('');
    }
  }, [open, route]);

  const allLocationDoctors = useMemo(() => {
    if (!route) return [];
    return state.doctors
      .filter((d) => d.location === route.location)
      .sort((a, b) => a.doctorName.localeCompare(b.doctorName));
  }, [state.doctors, route]);

  const filteredDoctors = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return allLocationDoctors;
    return allLocationDoctors.filter((d) => doctorMatchesQuery(d, q));
  }, [allLocationDoctors, debouncedSearch]);

  const originalSet = useMemo(
    () => new Set(route?.doctorIds ?? []),
    [route?.doctorIds],
  );

  const selectedCount = pending.size;

  if (!route) return null;

  function toggleDoctor(doctorId: number) {
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(doctorId)) next.delete(doctorId);
      else next.add(doctorId);
      return next;
    });
  }

  async function handleSave() {
    if (!route) return;
    try {
      const next = new Set(pending);
      const original = new Set(route.doctorIds);
      const addPromises = [];
      const removePromises = [];
      
      for (const id of next) {
        if (!original.has(id)) addPromises.push(addDoctorToRoute(route.id, id));
      }
      for (const id of original) {
        if (!next.has(id)) removePromises.push(removeDoctorFromRoute(route.id, id));
      }
      
      await Promise.all([...addPromises, ...removePromises]);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update route doctors:', error);
    }
  }

  function handleCancel() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex flex-col p-0 overflow-hidden max-w-md">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 dark:border-slate-700">
          <DialogTitle>Add Doctors</DialogTitle>
          <DialogDescription className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {route.location} · {route.name}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search doctors..."
          />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-2 min-h-0">
          {filteredDoctors.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No doctors found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredDoctors.map((d) => {
                const isSelected = pending.has(d.id);
                const isInRoute = originalSet.has(d.id);
                const otherRoutes = state.routes.filter(
                  (r) => r.id !== route.id && r.doctorIds.includes(d.id) && r.location === route.location,
                );
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
                      {(isInRoute || otherRoutes.length > 0) && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 flex items-center gap-1 flex-wrap">
                          {isInRoute && (
                            <span className="inline-flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-bold">
                              <RouteIcon className="h-3 w-3" />
                              In this route
                            </span>
                          )}
                          {otherRoutes.length > 0 && (
                            <>
                              {isInRoute && otherRoutes.length > 0 && <span>·</span>}
                              {otherRoutes.slice(0, 2).map((r) => (
                                <span
                                  key={r.id}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                                >
                                  {r.name}
                                </span>
                              ))}
                              {otherRoutes.length > 2 && (
                                <span className="text-slate-500">+{otherRoutes.length - 2}</span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 safe-bottom">
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
              <span className="text-indigo-600 dark:text-indigo-400">{selectedCount}</span> selected
            </div>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleCancel}
              className="h-11 px-4 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-11 px-5 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const RouteDoctorPicker = memo(RouteDoctorPickerImpl);
