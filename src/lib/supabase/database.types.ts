// Database Types - Generated from Supabase Schema
// This file defines the TypeScript types for all database tables

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      doctors: {
        Row: DoctorRow;
        Insert: DoctorInsert;
        Update: DoctorUpdate;
      };
      user_routes: {
        Row: UserRoute;
        Insert: UserRouteInsert;
        Update: UserRouteUpdate;
      };
      route_doctors: {
        Row: RouteDoctor;
        Insert: RouteDoctorInsert;
        Update: RouteDoctorUpdate;
      };
      doctor_day_assignments: {
        Row: DoctorDayAssignment;
        Insert: DoctorDayAssignmentInsert;
        Update: DoctorDayAssignmentUpdate;
      };
      doctor_visits: {
        Row: DoctorVisit;
        Insert: DoctorVisitInsert;
        Update: DoctorVisitUpdate;
      };
      deleted_doctors: {
        Row: DeletedDoctor;
        Insert: DeletedDoctorInsert;
        Update: DeletedDoctorUpdate;
      };
      user_settings: {
        Row: UserSettings;
        Insert: UserSettingsInsert;
        Update: UserSettingsUpdate;
      };
    };
  };
}

// Profile (User Account)
export interface Profile {
  id: string; // UUID
  email: string;
  full_name: string | null;
  role: 'mr' | 'admin' | 'public';
  status: 'pending' | 'active' | 'disabled' | 'suspended'; // Added in Phase 10
  territory: string[]; // Added in Phase 10 - Array of locations
  phone_number: string | null; // Added in Phase 10
  notes: string | null; // Added in Phase 10
  last_login: string | null; // Added in Phase 10
  is_deleted: boolean; // Added in Phase 10
  deleted_at: string | null; // Added in Phase 10
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id?: string;
  email: string;
  full_name?: string | null;
  role?: 'mr' | 'admin' | 'public';
  status?: 'pending' | 'active' | 'disabled' | 'suspended';
  territory?: string[];
  phone_number?: string | null;
  notes?: string | null;
}

export interface ProfileUpdate {
  email?: string;
  full_name?: string | null;
  role?: 'mr' | 'admin' | 'public';
  status?: 'pending' | 'active' | 'disabled' | 'suspended';
  territory?: string[];
  phone_number?: string | null;
  notes?: string | null;
  last_login?: string | null;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

// Doctor (Public Master Data)
export interface DoctorRow {
  id: number; // BIGSERIAL
  doctor_name: string;
  location: string;
  address: string | null;
  speciality: string | null;
  qualification: string | null;
  hospital: string | null;
  mobile: string | null;
  notes: string | null;
  is_active: boolean; // Added in Phase 4
  public_visible: boolean; // Added in Phase 6
  created_at: string;
  updated_at: string;
}

export interface DoctorInsert {
  id?: number;
  doctor_name: string;
  location: string;
  address?: string | null;
  speciality?: string | null;
  qualification?: string | null;
  hospital?: string | null;
  mobile?: string | null;
  notes?: string | null;
}

export interface DoctorUpdate {
  doctor_name?: string;
  location?: string;
  address?: string | null;
  speciality?: string | null;
  qualification?: string | null;
  hospital?: string | null;
  mobile?: string | null;
  notes?: string | null;
  is_active?: boolean; // Added in Phase 4
  public_visible?: boolean; // Added in Phase 6
}

// User Route
export interface UserRoute {
  id: string; // UUID
  user_id: string; // UUID
  location: string;
  name: string;
  cycle_days: number;
  completed_at: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface UserRouteInsert {
  id?: string;
  user_id: string;
  location: string;
  name: string;
  cycle_days?: number;
  completed_at?: string | null;
  order_index?: number;
}

export interface UserRouteUpdate {
  location?: string;
  name?: string;
  cycle_days?: number;
  completed_at?: string | null;
  order_index?: number;
}

// Route Doctor (Many-to-Many Mapping)
export interface RouteDoctor {
  id: string; // UUID
  route_id: string; // UUID
  doctor_id: number; // BIGINT
  order_index: number;
  created_at: string;
}

export interface RouteDoctorInsert {
  id?: string;
  route_id: string;
  doctor_id: number;
  order_index?: number;
}

export interface RouteDoctorUpdate {
  order_index?: number;
}

// Doctor Day Assignment
export interface DoctorDayAssignment {
  id: string; // UUID
  user_id: string; // UUID
  doctor_id: number; // BIGINT
  location: string;
  day_key: DayKey;
  order_index: number;
  created_at: string;
}

export interface DoctorDayAssignmentInsert {
  id?: string;
  user_id: string;
  doctor_id: number;
  location: string;
  day_key: DayKey;
  order_index?: number;
}

export interface DoctorDayAssignmentUpdate {
  order_index?: number;
}

// Doctor Visit
export interface DoctorVisit {
  id: string; // UUID
  user_id: string; // UUID
  doctor_id: number; // BIGINT
  last_visit_date: string | null; // DATE
  next_due_date: string | null; // DATE
  frequency_days: number;
  is_visited: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorVisitInsert {
  id?: string;
  user_id: string;
  doctor_id: number;
  last_visit_date?: string | null;
  next_due_date?: string | null;
  frequency_days?: number;
  is_visited?: boolean;
}

export interface DoctorVisitUpdate {
  last_visit_date?: string | null;
  next_due_date?: string | null;
  frequency_days?: number;
  is_visited?: boolean;
}

// Deleted Doctor
export interface DeletedDoctor {
  id: string; // UUID
  user_id: string; // UUID
  doctor_id: number; // BIGINT
  deleted_at: string;
}

export interface DeletedDoctorInsert {
  id?: string;
  user_id: string;
  doctor_id: number;
}

export interface DeletedDoctorUpdate {
  // No updates typically needed
}

// User Settings
export interface UserSettings {
  id: string; // UUID
  user_id: string; // UUID
  theme: 'light' | 'dark' | 'system';
  settings_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsInsert {
  id?: string;
  user_id: string;
  theme?: 'light' | 'dark' | 'system';
  settings_json?: Record<string, any>;
}

export interface UserSettingsUpdate {
  theme?: 'light' | 'dark' | 'system';
  settings_json?: Record<string, any>;
}

// Day Key Type
export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
