export interface Doctor {
  id: number;
  doctorName: string;
  location: string;
  address?: string;
  speciality?: string;
  qualification?: string;
  hospital?: string;
  mobile?: string;
  notes?: string;

  // Centralized visit tracking source on the doctor record
  lastVisitDate?: string; // ISO date string or empty string
  nextDueDate?: string; // ISO date string or empty string
  frequencyDays?: number; // canonical frequency, default 30
  daysSinceVisit?: number | null;
  isVisited?: boolean;

  // Backward compatibility for older LocalStorage data
  visitFrequencyDays?: number;
}

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export const DAYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

// assignments: map of doctorId -> set of days assigned
export type Assignments = Record<number, DayKey[]>;

// routeOrder: map of `${location}:${day}` -> ordered array of doctorIds
export type RouteOrder = Record<string, number[]>;

// Custom Route system
export interface Route {
  id: string;
  location: string;
  name: string;
  doctorIds: number[];
  completedAt: string | null; // ISO date string
  cycleDays: number; // default 15
  order: number;
}

export interface AppState {
  doctors: Doctor[];
  deletedDoctorIds: number[];
  assignments: Assignments;
  routeOrder: RouteOrder;
  routes: Route[];
  settings: {
    theme: 'light' | 'dark' | 'system';
  };
}

export type TabKey = 'dashboard' | 'locations' | 'days' | 'routes' | 'today' | 'settings';

export type RouteStatus = 'active' | 'completed' | 'due' | 'overdue';

export interface RouteStatusInfo {
  status: RouteStatus;
  daysRemaining: number;
  nextDueDate: Date | null;
  completedDate: Date | null;
}

export type VisitStatus = 'not-due' | 'due-soon' | 'due-today' | 'overdue' | 'never-visited';

export interface DoctorVisitInfo {
  status: VisitStatus;
  lastVisitDate: Date | null;
  nextDueDate: Date | null;
  daysSinceLastVisit: number | null;
  daysUntilDue: number | null;
  frequencyDays: number;
  isVisited: boolean;
}
