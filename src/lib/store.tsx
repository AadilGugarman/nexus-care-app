'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import type { AppState, Assignments, DayKey, Doctor, DoctorVisitInfo, Route, RouteOrder, RouteStatusInfo } from './types';
import { SEED_DOCTORS } from '@/data/doctors';
import {
  DoctorsService,
  RoutesService,
  VisitsService,
  AssignmentsService,
  SettingsService
} from './supabase/services';

const STORAGE_KEY = 'mr-route-planner-v1';

const defaultState: AppState = {
  doctors: [],
  deletedDoctorIds: [],
  assignments: {},
  routeOrder: {},
  routes: [],
  settings: { theme: 'system' },
};

function startOfDayValue(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDaysValue(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeDoctor(d: Doctor): Doctor {
  const frequencyDays = Number.isFinite(d.frequencyDays) && (d.frequencyDays ?? 0) > 0
    ? d.frequencyDays!
    : Number.isFinite(d.visitFrequencyDays) && (d.visitFrequencyDays ?? 0) > 0
      ? d.visitFrequencyDays!
      : 30;
  const lastVisitDate = d.lastVisitDate ?? '';
  const today = startOfDayValue(new Date());

  if (!lastVisitDate) {
    return {
      ...d,
      doctorName: d.doctorName ?? '',
      location: d.location ?? '',
      address: d.address ?? '',
      speciality: d.speciality ?? '',
      qualification: d.qualification ?? '',
      hospital: d.hospital ?? '',
      mobile: d.mobile ?? '',
      lastVisitDate: '',
      nextDueDate: '',
      frequencyDays,
      visitFrequencyDays: frequencyDays,
      daysSinceVisit: null,
      isVisited: false,
    };
  }

  const last = startOfDayValue(new Date(lastVisitDate));
  const nextDue = startOfDayValue(addDaysValue(last, frequencyDays));
  const daysSinceVisit = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  return {
    ...d,
    doctorName: d.doctorName ?? '',
    location: d.location ?? '',
    address: d.address ?? '',
    speciality: d.speciality ?? '',
    qualification: d.qualification ?? '',
    hospital: d.hospital ?? '',
    mobile: d.mobile ?? '',
    lastVisitDate: last.toISOString(),
    nextDueDate: nextDue.toISOString(),
    frequencyDays,
    visitFrequencyDays: frequencyDays,
    daysSinceVisit,
    isVisited: true,
  };
}

function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as AppState;
    return {
      doctors: (parsed.doctors ?? []).map(normalizeDoctor),
      deletedDoctorIds: parsed.deletedDoctorIds ?? [],
      assignments: parsed.assignments ?? {},
      routeOrder: parsed.routeOrder ?? {},
      routes: parsed.routes ?? [],
      settings: { theme: parsed.settings?.theme ?? 'system' },
    };
  } catch {
    return defaultState;
  }
}

function saveState(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function buildInitialState(): AppState {
  return {
    doctors: SEED_DOCTORS.map((d) => normalizeDoctor({ ...d })),
    deletedDoctorIds: [],
    assignments: {},
    routeOrder: {},
    routes: [],
    settings: { theme: 'system' },
  };
}

function generateRouteId(): string {
  return `route-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface StoreContextValue {
  state: AppState;
  isLoaded: boolean;
  error: string | null;
  // Doctor CRUD
  addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor>;
  updateDoctor: (id: number, patch: Partial<Omit<Doctor, 'id'>>) => Promise<void>;
  deleteDoctor: (id: number) => Promise<void>;
  markDoctorVisited: (id: number) => Promise<void>;
  resetDoctorVisit: (id: number) => Promise<void>;
  // Day Assignments (legacy)
  toggleDayAssignment: (doctorId: number, day: DayKey) => Promise<void>;
  setDayAssignments: (doctorId: number, days: DayKey[]) => Promise<void>;
  // Legacy route ordering
  reorderRoute: (location: string, day: DayKey, orderedIds: number[]) => Promise<void>;
  // Route Management (NEW)
  createRoute: (location: string, name: string) => Promise<Route>;
  updateRoute: (id: string, patch: Partial<Omit<Route, 'id'>>) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;
  reorderRoutes: (location: string, orderedIds: string[]) => Promise<void>;
  addDoctorToRoute: (routeId: string, doctorId: number) => Promise<void>;
  removeDoctorFromRoute: (routeId: string, doctorId: number) => Promise<void>;
  reorderDoctorsInRoute: (routeId: string, orderedIds: number[]) => Promise<void>;
  completeRoute: (routeId: string) => Promise<void>;
  uncompleteRoute: (routeId: string) => Promise<void>;
  // Reset / backup
  resetToSeed: () => void;
  importState: (next: AppState) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase on mount
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        setError(null);
        
        // Load all data in parallel
        const [dbDoctors, dbRoutes, dbVisits, dbAssignments, dbSettings] = await Promise.all([
          DoctorsService.getAllDoctors(),
          RoutesService.getAllRoutes(),
          VisitsService.getAllVisits(),
          AssignmentsService.getAssignmentsGrouped(),
          SettingsService.getSettings()
        ]);

        // Convert database format to app format
        const doctors: Doctor[] = dbDoctors.map(dbDoc => {
          const visit = dbVisits.find(v => v.doctor_id === dbDoc.id);
          const doctor: Doctor = {
            id: dbDoc.id,
            doctorName: dbDoc.doctor_name,
            location: dbDoc.location,
            address: dbDoc.address || '',
            speciality: dbDoc.speciality || '',
            qualification: dbDoc.qualification || '',
            hospital: dbDoc.hospital || '',
            mobile: dbDoc.mobile || '',
            notes: dbDoc.notes || '',
            lastVisitDate: visit?.last_visit_date || '',
            nextDueDate: visit?.next_due_date || '',
            frequencyDays: visit?.frequency_days || 30,
            isVisited: visit?.is_visited || false,
            daysSinceVisit: null, // Will be calculated
          };
          return normalizeDoctor(doctor);
        });

        // Convert routes
        const routes: Route[] = await Promise.all(
          dbRoutes.map(async (dbRoute) => {
            const doctorIds = await RoutesService.getRouteDoctorIds(dbRoute.id);
            return {
              id: dbRoute.id,
              location: dbRoute.location,
              name: dbRoute.name,
              doctorIds,
              completedAt: dbRoute.completed_at,
              cycleDays: dbRoute.cycle_days,
              order: dbRoute.order_index,
            };
          })
        );

        // Convert assignments to old format
        const assignments: Assignments = {};
        Object.entries(dbAssignments).forEach(([location, dayMap]) => {
          Object.entries(dayMap).forEach(([day, doctorIds]) => {
            doctorIds.forEach(doctorId => {
              if (!assignments[doctorId]) {
                assignments[doctorId] = [];
              }
              if (!assignments[doctorId].includes(day as DayKey)) {
                assignments[doctorId].push(day as DayKey);
              }
            });
          });
        });

        // Build route order (for backward compatibility)
        const routeOrder: RouteOrder = {};
        for (const route of routes) {
          routeOrder[route.id] = route.doctorIds;
        }

        setState({
          doctors,
          routes,
          assignments,
          routeOrder,
          deletedDoctorIds: [], // Managed in database now
          settings: {
            theme: dbSettings?.theme || 'system'
          }
        });

        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load from Supabase:', err);
        toast.error('Failed to connect to database. Using offline mode.');
        
        // Fallback to LocalStorage if Supabase fails
        const existing = loadState();
        if (existing.doctors && existing.doctors.length > 0) {
          setState(existing);
          setIsLoaded(true);
        } else {
          // Last resort: use seed data
          const initial = buildInitialState();
          setState(initial);
          setIsLoaded(true);
        }
      }
    }

    loadFromSupabase();
  }, []);

  // Backup to LocalStorage (optional - for offline fallback)
  useEffect(() => {
    if (isLoaded && !error) {
      saveState(state);
    }
  }, [state, isLoaded, error]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const theme = state.settings.theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', shouldBeDark);
  }, [state.settings.theme]);

  const addDoctor = useCallback(async (doctor: Omit<Doctor, 'id'>): Promise<Doctor> => {
    try {
      // Save to Supabase
      const dbDoctor = await DoctorsService.addDoctor({
        doctor_name: doctor.doctorName,
        location: doctor.location,
        address: doctor.address || null,
        speciality: doctor.speciality || null,
        qualification: doctor.qualification || null,
        hospital: doctor.hospital || null,
        mobile: doctor.mobile || null,
        notes: doctor.notes || null,
      });

      // Convert to app format
      const newDoctor: Doctor = normalizeDoctor({
        id: dbDoctor.id,
        doctorName: dbDoctor.doctor_name,
        location: dbDoctor.location,
        address: dbDoctor.address || '',
        speciality: dbDoctor.speciality || '',
        qualification: dbDoctor.qualification || '',
        hospital: dbDoctor.hospital || '',
        mobile: dbDoctor.mobile || '',
        notes: dbDoctor.notes || '',
      });

      setState((s) => ({
        ...s,
        doctors: [...s.doctors, newDoctor],
      }));

      return newDoctor;
    } catch (err) {
      toast.error('Failed to add doctor. Please try again.');
      throw err;
    }
  }, []);

  const updateDoctor = useCallback(async (id: number, patch: Partial<Omit<Doctor, 'id'>>) => {
    try {
      // Update in Supabase
      const dbUpdate: any = {};
      if (patch.doctorName !== undefined) dbUpdate.doctor_name = patch.doctorName;
      if (patch.location !== undefined) dbUpdate.location = patch.location;
      if (patch.address !== undefined) dbUpdate.address = patch.address || null;
      if (patch.speciality !== undefined) dbUpdate.speciality = patch.speciality || null;
      if (patch.qualification !== undefined) dbUpdate.qualification = patch.qualification || null;
      if (patch.hospital !== undefined) dbUpdate.hospital = patch.hospital || null;
      if (patch.mobile !== undefined) dbUpdate.mobile = patch.mobile || null;
      if (patch.notes !== undefined) dbUpdate.notes = patch.notes || null;

      if (Object.keys(dbUpdate).length > 0) {
        await DoctorsService.updateDoctor(id, dbUpdate);
      }

      // Update local state
      setState((s) => ({
        ...s,
        doctors: s.doctors.map((d) => (d.id === id ? normalizeDoctor({ ...d, ...patch }) : d)),
      }));
    } catch (err) {
      toast.error('Failed to update doctor. Please try again.');
      throw err;
    }
  }, []);

  const markDoctorVisited = useCallback(async (id: number) => {
    try {
      const doctor = state.doctors.find(d => d.id === id);
      const frequencyDays = doctor?.frequencyDays || 30;
      
      // Save to Supabase
      await VisitsService.markDoctorVisited(id, frequencyDays);

      // Update local state
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setState((s) => ({
        ...s,
        doctors: s.doctors.map((d) =>
          d.id === id
            ? normalizeDoctor({ ...d, lastVisitDate: today.toISOString(), isVisited: true })
            : d,
        ),
      }));
    } catch (err) {
      toast.error('Failed to mark visit. Please try again.');
      throw err;
    }
  }, [state.doctors]);

  const resetDoctorVisit = useCallback(async (id: number) => {
    try {
      // Delete from Supabase
      await VisitsService.resetDoctorVisit(id);

      // Update local state
      setState((s) => ({
        ...s,
        doctors: s.doctors.map((d) =>
          d.id === id
            ? normalizeDoctor({ ...d, lastVisitDate: '', nextDueDate: '', daysSinceVisit: null, isVisited: false })
            : d,
        ),
      }));
    } catch (err) {
      toast.error('Failed to reset visit. Please try again.');
      throw err;
    }
  }, []);

  const deleteDoctor = useCallback(async (id: number) => {
    try {
      // Soft delete in Supabase
      await DoctorsService.deleteDoctor(id);

      // Update local state
      setState((s) => {
        const assignments: Assignments = {};
        for (const [didStr, days] of Object.entries(s.assignments)) {
          const did = Number(didStr);
          if (did !== id) assignments[did] = days;
        }
        const routeOrder: RouteOrder = {};
        for (const [key, ids] of Object.entries(s.routeOrder)) {
          routeOrder[key] = ids.filter((x) => x !== id);
        }
        const routes = s.routes.map((r) => ({
          ...r,
          doctorIds: r.doctorIds.filter((x) => x !== id),
        }));
        return {
          ...s,
          doctors: s.doctors.filter((d) => d.id !== id),
          assignments,
          routeOrder,
          routes,
        };
      });
    } catch (err) {
      toast.error('Failed to delete doctor. Please try again.');
      throw err;
    }
  }, []);

  const setDayAssignments = useCallback(async (doctorId: number, days: DayKey[]) => {
    try {
      const doctor = state.doctors.find(d => d.id === doctorId);
      if (!doctor) return;

      // Save to Supabase
      await AssignmentsService.setDayAssignments(doctorId, doctor.location, days);

      // Update local state
      setState((s) => {
        const assignments = { ...s.assignments };
        if (days.length === 0) {
          delete assignments[doctorId];
        } else {
          assignments[doctorId] = [...days];
        }
        const routeOrder = { ...s.routeOrder };
        for (const [key, ids] of Object.entries(routeOrder)) {
          const [, d] = key.split(':');
          if (days.includes(d as DayKey)) continue;
          routeOrder[key] = ids.filter((x) => x !== doctorId);
        }
        for (const day of days) {
          const key = `${doctor.location}:${day}`;
          const cur = routeOrder[key] ?? [];
          if (!cur.includes(doctorId)) {
            routeOrder[key] = [...cur, doctorId];
          }
        }
        return { ...s, assignments, routeOrder };
      });
    } catch (err) {
      toast.error('Failed to update day assignments. Please try again.');
      throw err;
    }
  }, [state.doctors]);

  const toggleDayAssignment = useCallback(
    async (doctorId: number, day: DayKey) => {
      try {
        const doctor = state.doctors.find(d => d.id === doctorId);
        if (!doctor) return;

        // Toggle in Supabase
        await AssignmentsService.toggleDayAssignment(doctorId, doctor.location, day);

        // Update local state
        setState((s) => {
          const currentDays = s.assignments[doctorId] ?? [];
          const has = currentDays.includes(day);
          const nextDays = has ? currentDays.filter((d) => d !== day) : [...currentDays, day];
          const assignments = { ...s.assignments };
          if (nextDays.length === 0) {
            delete assignments[doctorId];
          } else {
            assignments[doctorId] = nextDays;
          }
          const routeOrder = { ...s.routeOrder };
          const key = `${doctor.location}:${day}`;
          if (has) {
            const cur = routeOrder[key] ?? [];
            routeOrder[key] = cur.filter((x) => x !== doctorId);
          } else {
            const cur = routeOrder[key] ?? [];
            if (!cur.includes(doctorId)) routeOrder[key] = [...cur, doctorId];
          }
          return { ...s, assignments, routeOrder };
        });
      } catch (err) {
        toast.error('Failed to update day assignment. Please try again.');
        throw err;
      }
    },
    [state.doctors],
  );

  const reorderRoute = useCallback(async (location: string, day: DayKey, orderedIds: number[]) => {
    try {
      // Save to Supabase
      await AssignmentsService.reorderLocationDay(location, day, orderedIds);

      // Update local state
      setState((s) => {
        const key = `${location}:${day}`;
        return { ...s, routeOrder: { ...s.routeOrder, [key]: orderedIds } };
      });
    } catch (err) {
      toast.error('Failed to reorder. Please try again.');
      throw err;
    }
  }, []);

  // ========== ROUTE MANAGEMENT ==========

  const createRoute = useCallback(async (location: string, name: string): Promise<Route> => {
    try {
      // Save to Supabase
      const dbRoute = await RoutesService.createRoute({
        location,
        name: name.trim() || 'New Route',
        cycle_days: 15,
        order_index: Date.now()
      });

      const route: Route = {
        id: dbRoute.id,
        location: dbRoute.location,
        name: dbRoute.name,
        doctorIds: [],
        completedAt: dbRoute.completed_at,
        cycleDays: dbRoute.cycle_days,
        order: dbRoute.order_index,
      };

      setState((s) => ({ ...s, routes: [...s.routes, route] }));
      return route;
    } catch (err) {
      toast.error('Failed to create route. Please try again.');
      throw err;
    }
  }, []);

  const updateRoute = useCallback(async (id: string, patch: Partial<Omit<Route, 'id'>>) => {
    try {
      const dbUpdate: any = {};
      if (patch.name !== undefined) dbUpdate.name = patch.name;
      if (patch.location !== undefined) dbUpdate.location = patch.location;
      if (patch.cycleDays !== undefined) dbUpdate.cycle_days = patch.cycleDays;
      if (patch.completedAt !== undefined) dbUpdate.completed_at = patch.completedAt;
      if (patch.order !== undefined) dbUpdate.order_index = patch.order;

      if (Object.keys(dbUpdate).length > 0) {
        await RoutesService.updateRoute(id, dbUpdate);
      }

      setState((s) => ({
        ...s,
        routes: s.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }));
    } catch (err) {
      toast.error('Failed to update route. Please try again.');
      throw err;
    }
  }, []);

  const deleteRoute = useCallback(async (id: string) => {
    try {
      await RoutesService.deleteRoute(id);

      setState((s) => {
        const routeOrder = { ...s.routeOrder };
        delete routeOrder[id];
        return {
          ...s,
          routes: s.routes.filter((r) => r.id !== id),
          routeOrder,
        };
      });
    } catch (err) {
      toast.error('Failed to delete route. Please try again.');
      throw err;
    }
  }, []);

  const reorderRoutes = useCallback(async (location: string, orderedIds: string[]) => {
    try {
      await RoutesService.reorderRoutes(location, orderedIds);

      setState((s) => {
        const locationRoutes = s.routes.filter((r) => r.location === location);
        const otherRoutes = s.routes.filter((r) => r.location !== location);
        const idToRoute = new Map(locationRoutes.map((r) => [r.id, r]));
        const reordered = orderedIds.map((id) => idToRoute.get(id)).filter(Boolean) as Route[];
        const updated = reordered.map((r, idx) => ({ ...r, order: idx }));
        return { ...s, routes: [...otherRoutes, ...updated] };
      });
    } catch (err) {
      toast.error('Failed to reorder routes. Please try again.');
      throw err;
    }
  }, []);

  const addDoctorToRoute = useCallback(async (routeId: string, doctorId: number) => {
    try {
      await RoutesService.addDoctorToRoute(routeId, doctorId);

      setState((s) => ({
        ...s,
        routes: s.routes.map((r) =>
          r.id === routeId && !r.doctorIds.includes(doctorId)
            ? { ...r, doctorIds: [...r.doctorIds, doctorId] }
            : r,
        ),
      }));
    } catch (err) {
      toast.error('Failed to add doctor to route. Please try again.');
      throw err;
    }
  }, []);

  const removeDoctorFromRoute = useCallback(async (routeId: string, doctorId: number) => {
    try {
      await RoutesService.removeDoctorFromRoute(routeId, doctorId);

      setState((s) => ({
        ...s,
        routes: s.routes.map((r) =>
          r.id === routeId ? { ...r, doctorIds: r.doctorIds.filter((id) => id !== doctorId) } : r,
        ),
        routeOrder: {
          ...s.routeOrder,
          [routeId]: (s.routeOrder[routeId] ?? []).filter((id) => id !== doctorId),
        },
      }));
    } catch (err) {
      toast.error('Failed to remove doctor from route. Please try again.');
      throw err;
    }
  }, []);

  const reorderDoctorsInRoute = useCallback(async (routeId: string, orderedIds: number[]) => {
    try {
      await RoutesService.reorderDoctorsInRoute(routeId, orderedIds);

      setState((s) => ({
        ...s,
        routeOrder: { ...s.routeOrder, [routeId]: orderedIds },
      }));
    } catch (err) {
      toast.error('Failed to reorder doctors. Please try again.');
      throw err;
    }
  }, []);

  const completeRoute = useCallback(async (routeId: string) => {
    try {
      await RoutesService.completeRoute(routeId);

      setState((s) => ({
        ...s,
        routes: s.routes.map((r) =>
          r.id === routeId ? { ...r, completedAt: new Date().toISOString() } : r,
        ),
      }));
    } catch (err) {
      toast.error('Failed to complete route. Please try again.');
      throw err;
    }
  }, []);

  const uncompleteRoute = useCallback(async (routeId: string) => {
    try {
      await RoutesService.uncompleteRoute(routeId);

      setState((s) => ({
        ...s,
        routes: s.routes.map((r) =>
          r.id === routeId ? { ...r, completedAt: null } : r,
        ),
      }));
    } catch (err) {
      toast.error('Failed to uncomplete route. Please try again.');
      throw err;
    }
  }, []);

  const resetToSeed = useCallback(() => {
    const initial = buildInitialState();
    setState(initial);
  }, []);

  const importState = useCallback((next: AppState) => {
    setState({
      doctors: (next.doctors ?? []).map(normalizeDoctor),
      deletedDoctorIds: next.deletedDoctorIds ?? [],
      assignments: next.assignments ?? {},
      routeOrder: next.routeOrder ?? {},
      routes: next.routes ?? [],
      settings: { theme: next.settings?.theme ?? 'system' },
    });
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      isLoaded,
      error,
      addDoctor,
      updateDoctor,
      deleteDoctor,
      markDoctorVisited,
      resetDoctorVisit,
      toggleDayAssignment,
      setDayAssignments,
      reorderRoute,
      createRoute,
      updateRoute,
      deleteRoute,
      reorderRoutes,
      addDoctorToRoute,
      removeDoctorFromRoute,
      reorderDoctorsInRoute,
      completeRoute,
      uncompleteRoute,
      resetToSeed,
      importState,
    }),
    [
      state,
      isLoaded,
      error,
      addDoctor,
      updateDoctor,
      deleteDoctor,
      markDoctorVisited,
      resetDoctorVisit,
      toggleDayAssignment,
      setDayAssignments,
      reorderRoute,
      createRoute,
      updateRoute,
      deleteRoute,
      reorderRoutes,
      addDoctorToRoute,
      removeDoctorFromRoute,
      reorderDoctorsInRoute,
      completeRoute,
      uncompleteRoute,
      resetToSeed,
      importState,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

// Helper selectors
export function getDoctorDays(state: AppState, doctorId: number): DayKey[] {
  return state.assignments[doctorId] ?? [];
}

export function getDoctorsForLocationDay(
  state: AppState,
  location: string,
  day: DayKey,
): Doctor[] {
  const key = `${location}:${day}`;
  const order = state.routeOrder[key];
  const assigned = state.doctors.filter(
    (d) => d.location === location && (state.assignments[d.id] ?? []).includes(day),
  );
  if (!order) return assigned;
  const byId = new Map(assigned.map((d) => [d.id, d]));
  const ordered: Doctor[] = [];
  for (const id of order) {
    const d = byId.get(id);
    if (d) {
      ordered.push(d);
      byId.delete(id);
    }
  }
  for (const d of byId.values()) ordered.push(d);
  return ordered;
}

export function getUnassignedDoctorsForLocation(state: AppState, location: string): Doctor[] {
  return state.doctors.filter(
    (d) => d.location === location && (state.assignments[d.id] ?? []).length === 0,
  );
}

export function getDoctorRouteNames(state: AppState, doctorId: number, location?: string): string[] {
  return state.routes
    .filter((r) => r.doctorIds.includes(doctorId))
    .filter((r) => !location || r.location === location)
    .map((r) => r.name);
}

export function doctorMatchesQuery(doctor: Doctor, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    doctor.doctorName,
    doctor.location,
    doctor.address,
    doctor.speciality,
    doctor.qualification,
    doctor.hospital,
    doctor.mobile,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getDoctorVisitInfo(doctor: Doctor): DoctorVisitInfo {
  const frequencyDays = Number.isFinite(doctor.frequencyDays) && (doctor.frequencyDays ?? 0) > 0
    ? doctor.frequencyDays!
    : Number.isFinite(doctor.visitFrequencyDays) && (doctor.visitFrequencyDays ?? 0) > 0
      ? doctor.visitFrequencyDays!
      : 30;
  const today = startOfDay(new Date());
  const isVisited = !!doctor.isVisited && !!doctor.lastVisitDate;

  if (!isVisited || !doctor.lastVisitDate) {
    return {
      status: 'never-visited',
      lastVisitDate: null,
      nextDueDate: null,
      daysSinceLastVisit: null,
      daysUntilDue: null,
      frequencyDays,
      isVisited: false,
    };
  }

  const lastVisitDate = startOfDay(new Date(doctor.lastVisitDate));
  const nextDueDate = startOfDay(addDays(lastVisitDate, frequencyDays));
  const daysSinceLastVisit = Math.floor((today.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const status = daysUntilDue < 0
    ? 'overdue'
    : daysUntilDue === 0
      ? 'due-today'
      : daysUntilDue <= 3
        ? 'due-soon'
        : 'not-due';

  return {
    status,
    lastVisitDate,
    nextDueDate,
    daysSinceLastVisit,
    daysUntilDue,
    frequencyDays,
    isVisited: true,
  };
}

export function formatShortDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getVisitStatusLabel(info: DoctorVisitInfo): string {
  if (info.status === 'never-visited') return '⚪ Never Visited';
  if (info.status === 'overdue') return `🔴 Overdue by ${Math.abs(info.daysUntilDue ?? 0)} Days`;
  if (info.status === 'due-today') return '🟡 Due Today';
  if (info.status === 'due-soon') return `🟡 Due in ${info.daysUntilDue} Days`;
  return `🟢 Due in ${info.daysUntilDue} Days`;
}

export function getVisitDashboardStats(state: AppState) {
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);
  const withInfo = state.doctors.map((doctor) => ({ doctor, info: getDoctorVisitInfo(doctor) }));
  const dueToday = withInfo.filter(({ info }) => info.status === 'due-today');
  const overdue = withInfo.filter(({ info }) => info.status === 'overdue');
  const dueThisWeek = withInfo.filter(({ info }) => {
    if (!info.nextDueDate) return false;
    return info.nextDueDate.getTime() >= today.getTime() && info.nextDueDate.getTime() <= weekEnd.getTime();
  });
  const recentlyVisited = withInfo
    .filter(({ info }) => info.lastVisitDate && (info.daysSinceLastVisit ?? 999) <= 7)
    .sort((a, b) => (a.info.daysSinceLastVisit ?? 999) - (b.info.daysSinceLastVisit ?? 999));
  const upcoming = withInfo
    .filter(({ info }) => info.status === 'not-due' || info.status === 'due-soon')
    .sort((a, b) => (a.info.daysUntilDue ?? 9999) - (b.info.daysUntilDue ?? 9999));
  return { dueToday, overdue, dueThisWeek, recentlyVisited, upcoming };
}

// Route helpers
export function getRouteStatusInfo(route: Route): RouteStatusInfo {
  if (!route.completedAt) {
    return { status: 'active', daysRemaining: Infinity, nextDueDate: null, completedDate: null };
  }
  const completed = new Date(route.completedAt);
  const nextDue = new Date(completed);
  nextDue.setDate(nextDue.getDate() + route.cycleDays);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  nextDue.setHours(0, 0, 0, 0);
  const diffTime = nextDue.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: 'overdue', daysRemaining, nextDueDate: nextDue, completedDate: completed };
  }
  if (daysRemaining === 0) {
    return { status: 'due', daysRemaining, nextDueDate: nextDue, completedDate: completed };
  }
  return { status: 'completed', daysRemaining, nextDueDate: nextDue, completedDate: completed };
}

export function getRoutesForLocation(state: AppState, location: string): Route[] {
  return state.routes
    .filter((r) => r.location === location)
    .sort((a, b) => a.order - b.order);
}

export function getDoctorsInRoute(state: AppState, routeId: string): Doctor[] {
  const route = state.routes.find((r) => r.id === routeId);
  if (!route) return [];
  const order = state.routeOrder[routeId] ?? [];
  const doctors = state.doctors.filter((d) => route.doctorIds.includes(d.id));
  const byId = new Map(doctors.map((d) => [d.id, d]));
  const ordered: Doctor[] = [];
  for (const id of order) {
    const d = byId.get(id);
    if (d) {
      ordered.push(d);
      byId.delete(id);
    }
  }
  for (const d of byId.values()) ordered.push(d);
  return ordered;
}

export function getAllRouteStats(state: AppState) {
  const infos = state.routes.map((r) => getRouteStatusInfo(r));
  const total = state.routes.length;
  const dueToday = infos.filter((i) => i.status === 'due').length;
  const overdue = infos.filter((i) => i.status === 'overdue').length;
  const upcoming = infos.filter((i) => i.status === 'completed' && i.daysRemaining > 0).length;
  const active = infos.filter((i) => i.status === 'active').length;
  const recentlyCompleted = state.routes.filter((r) => {
    if (!r.completedAt) return false;
    const days = Math.floor((Date.now() - new Date(r.completedAt).getTime()) / (1000 * 60 * 60 * 24));
    return days <= 7;
  }).length;
  return { total, dueToday, overdue, upcoming, active, recentlyCompleted };
}
