# Supabase Backend Architecture
## MR Portal + Public Doctor Directory

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Database Schema](#database-schema)
3. [SQL Table Creation Scripts](#sql-table-creation-scripts)
4. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
5. [TypeScript Types](#typescript-types)
6. [Service Layer Architecture](#service-layer-architecture)
7. [Migration Plan from LocalStorage](#migration-plan-from-localstorage)
8. [Future Public Directory Architecture](#future-public-directory-architecture)
9. [Relationships Diagram](#relationships-diagram)

---

## EXECUTIVE SUMMARY

### Architecture Goals
- **Separation of Concerns**: Clear separation between public doctor data and private MR data
- **Multi-tenancy**: Each MR user has isolated routes, assignments, and visit tracking
- **Future-proof**: Ready for public doctor directory without breaking existing functionality
- **Security-first**: RLS policies enforce data access control at database level
- **Zero UI Changes**: Backend migration only, UI remains unchanged

### Core Principles
1. **Public Data**: Doctor master information (name, specialty, hospital, etc.)
2. **Private Data**: User-specific routes, assignments, visits
3. **User Isolation**: Each MR user sees only their own data
4. **Read-Only Public Access**: Future public users have read-only access to doctor directory

---

## DATABASE SCHEMA

### Table Overview

```
profiles (User Accounts)
├── doctors (Public Doctor Directory - Shared Master Data)
│   
user_routes (Private MR Data)
├── route_doctors (Many-to-Many: Routes ↔ Doctors)
│   ├── doctor_day_assignments (Day assignments per user)
│   └── doctor_visits (Visit tracking per user)
│       
deleted_doctors (Soft delete tracking per user)
user_settings (User preferences)
```

### Table Details

#### 1. profiles
**Purpose**: User accounts for MR portal (Authenticated users)
- Links to Supabase Auth
- Stores user metadata
- Future: Can add role (mr, admin, public)

#### 2. doctors
**Purpose**: Shared public doctor master data
- Single source of truth for all doctor information
- Accessible to authenticated MR users AND future public users
- No user-specific data here

#### 3. user_routes
**Purpose**: User-specific custom routes
- Each MR user creates their own routes
- Isolated per user via RLS

#### 4. route_doctors
**Purpose**: Many-to-many mapping between routes and doctors
- Links doctors to user routes
- Tracks order within route
- User-specific via foreign key to user_routes

#### 5. doctor_day_assignments
**Purpose**: User-specific day assignments for doctors
- Each user assigns doctors to days independently
- Supports legacy day-based workflow

#### 6. doctor_visits
**Purpose**: User-specific visit tracking
- Each user tracks their own visits
- Stores last visit date, next due date, frequency
- Isolated per user

#### 7. deleted_doctors
**Purpose**: Soft delete tracking per user
- User can "delete" a doctor from their view
- Doctor remains in master table for others

#### 8. user_settings
**Purpose**: User preferences
- Theme, display settings, etc.

---

## SQL TABLE CREATION SCRIPTS

### 1. Enable UUID Extension

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2. profiles Table

```sql
-- User profiles table (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'mr' CHECK (role IN ('mr', 'admin', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. doctors Table (Public Master Data)

```sql
-- Doctor master table (public directory data)
CREATE TABLE doctors (
  id BIGSERIAL PRIMARY KEY,
  doctor_name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  speciality TEXT,
  qualification TEXT,
  hospital TEXT,
  mobile TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Indexes for search and filtering
CREATE INDEX idx_doctors_location ON doctors(location);
CREATE INDEX idx_doctors_name ON doctors(doctor_name);
CREATE INDEX idx_doctors_speciality ON doctors(speciality);
CREATE INDEX idx_doctors_search ON doctors USING GIN (
  to_tsvector('english', 
    COALESCE(doctor_name, '') || ' ' || 
    COALESCE(location, '') || ' ' || 
    COALESCE(speciality, '') || ' ' || 
    COALESCE(hospital, '')
  )
);

-- Updated at trigger
CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. user_routes Table (Private User Data)

```sql
-- User-specific routes
CREATE TABLE user_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  name TEXT NOT NULL,
  cycle_days INTEGER DEFAULT 15 CHECK (cycle_days > 0),
  completed_at TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_route_name UNIQUE (user_id, location, name)
);

-- Enable RLS
ALTER TABLE user_routes ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_user_routes_user_id ON user_routes(user_id);
CREATE INDEX idx_user_routes_location ON user_routes(location);
CREATE INDEX idx_user_routes_user_location ON user_routes(user_id, location);

-- Updated at trigger
CREATE TRIGGER update_user_routes_updated_at
  BEFORE UPDATE ON user_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 5. route_doctors Table (Route-Doctor Mapping)

```sql
-- Many-to-many mapping: user routes <-> doctors
CREATE TABLE route_doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES user_routes(id) ON DELETE CASCADE,
  doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_route_doctor UNIQUE (route_id, doctor_id)
);

-- Enable RLS
ALTER TABLE route_doctors ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_route_doctors_route_id ON route_doctors(route_id);
CREATE INDEX idx_route_doctors_doctor_id ON route_doctors(doctor_id);
```

### 6. doctor_day_assignments Table (User-specific Day Assignments)

```sql
-- User-specific day assignments for doctors (legacy support)
CREATE TABLE doctor_day_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  day_key TEXT NOT NULL CHECK (day_key IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_doctor_day UNIQUE (user_id, doctor_id, day_key)
);

-- Enable RLS
ALTER TABLE doctor_day_assignments ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_day_assignments_user_id ON doctor_day_assignments(user_id);
CREATE INDEX idx_day_assignments_doctor_id ON doctor_day_assignments(doctor_id);
CREATE INDEX idx_day_assignments_user_location_day ON doctor_day_assignments(user_id, location, day_key);
```

### 7. doctor_visits Table (User-specific Visit Tracking)

```sql
-- User-specific visit tracking for doctors
CREATE TABLE doctor_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  last_visit_date DATE,
  next_due_date DATE,
  frequency_days INTEGER DEFAULT 30 CHECK (frequency_days > 0),
  is_visited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_doctor_visit UNIQUE (user_id, doctor_id)
);

-- Enable RLS
ALTER TABLE doctor_visits ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_doctor_visits_user_id ON doctor_visits(user_id);
CREATE INDEX idx_doctor_visits_doctor_id ON doctor_visits(doctor_id);
CREATE INDEX idx_doctor_visits_user_doctor ON doctor_visits(user_id, doctor_id);
CREATE INDEX idx_doctor_visits_next_due ON doctor_visits(user_id, next_due_date) WHERE next_due_date IS NOT NULL;

-- Updated at trigger
CREATE TRIGGER update_doctor_visits_updated_at
  BEFORE UPDATE ON doctor_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 8. deleted_doctors Table (Soft Delete per User)

```sql
-- Track which doctors each user has "deleted" from their view
CREATE TABLE deleted_doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_deleted_doctor UNIQUE (user_id, doctor_id)
);

-- Enable RLS
ALTER TABLE deleted_doctors ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_deleted_doctors_user_id ON deleted_doctors(user_id);
CREATE INDEX idx_deleted_doctors_doctor_id ON deleted_doctors(doctor_id);
```

### 9. user_settings Table (User Preferences)

```sql
-- User settings and preferences
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Updated at trigger
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## ROW LEVEL SECURITY (RLS) POLICIES

### Profiles Table Policies

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Doctors Table Policies (Public Directory Data)

```sql
-- Authenticated MR users can view all doctors
CREATE POLICY "Authenticated users can view doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (true);

-- Future: Public (unauthenticated) users can view all doctors
CREATE POLICY "Public users can view doctors"
  ON doctors FOR SELECT
  TO anon
  USING (true);

-- Only admins can insert doctors
CREATE POLICY "Admins can insert doctors"
  ON doctors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update doctors
CREATE POLICY "Admins can update doctors"
  ON doctors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete doctors
CREATE POLICY "Admins can delete doctors"
  ON doctors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### User Routes Table Policies

```sql
-- Users can view only their own routes
CREATE POLICY "Users can view own routes"
  ON user_routes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own routes
CREATE POLICY "Users can insert own routes"
  ON user_routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own routes
CREATE POLICY "Users can update own routes"
  ON user_routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own routes
CREATE POLICY "Users can delete own routes"
  ON user_routes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Route Doctors Table Policies

```sql
-- Users can view route_doctors for their own routes
CREATE POLICY "Users can view own route doctors"
  ON route_doctors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_routes
      WHERE user_routes.id = route_doctors.route_id
      AND user_routes.user_id = auth.uid()
    )
  );

-- Users can insert doctors to their own routes
CREATE POLICY "Users can insert doctors to own routes"
  ON route_doctors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_routes
      WHERE user_routes.id = route_id
      AND user_routes.user_id = auth.uid()
    )
  );

-- Users can update doctors in their own routes
CREATE POLICY "Users can update doctors in own routes"
  ON route_doctors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_routes
      WHERE user_routes.id = route_id
      AND user_routes.user_id = auth.uid()
    )
  );

-- Users can delete doctors from their own routes
CREATE POLICY "Users can delete doctors from own routes"
  ON route_doctors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_routes
      WHERE user_routes.id = route_id
      AND user_routes.user_id = auth.uid()
    )
  );
```

### Doctor Day Assignments Table Policies

```sql
-- Users can view only their own day assignments
CREATE POLICY "Users can view own day assignments"
  ON doctor_day_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own day assignments
CREATE POLICY "Users can insert own day assignments"
  ON doctor_day_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own day assignments
CREATE POLICY "Users can update own day assignments"
  ON doctor_day_assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own day assignments
CREATE POLICY "Users can delete own day assignments"
  ON doctor_day_assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Doctor Visits Table Policies

```sql
-- Users can view only their own visit records
CREATE POLICY "Users can view own visit records"
  ON doctor_visits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own visit records
CREATE POLICY "Users can insert own visit records"
  ON doctor_visits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own visit records
CREATE POLICY "Users can update own visit records"
  ON doctor_visits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own visit records
CREATE POLICY "Users can delete own visit records"
  ON doctor_visits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### Deleted Doctors Table Policies

```sql
-- Users can view only their own deleted doctor records
CREATE POLICY "Users can view own deleted doctors"
  ON deleted_doctors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own deleted doctor records
CREATE POLICY "Users can insert own deleted doctors"
  ON deleted_doctors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own deleted doctor records (restore)
CREATE POLICY "Users can delete own deleted doctors"
  ON deleted_doctors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### User Settings Table Policies

```sql
-- Users can view only their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
```

---

## TYPESCRIPT TYPES

### Database Types

```typescript
// src/lib/supabase/database.types.ts

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

export interface Profile {
  id: string; // UUID
  email: string;
  full_name: string | null;
  role: 'mr' | 'admin' | 'public';
  created_at: string;
  updated_at: string;
}

export interface ProfileInsert {
  id: string;
  email: string;
  full_name?: string | null;
  role?: 'mr' | 'admin' | 'public';
}

export interface ProfileUpdate {
  email?: string;
  full_name?: string | null;
  role?: 'mr' | 'admin' | 'public';
}
```

```typescript
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
  created_at: string;
  updated_at: string;
}

export interface DoctorInsert {
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
}

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
```

```typescript
export interface RouteDoctor {
  id: string; // UUID
  route_id: string; // UUID
  doctor_id: number; // BIGINT
  order_index: number;
  created_at: string;
}

export interface RouteDoctorInsert {
  route_id: string;
  doctor_id: number;
  order_index?: number;
}

export interface RouteDoctorUpdate {
  order_index?: number;
}

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
  user_id: string;
  doctor_id: number;
  location: string;
  day_key: DayKey;
  order_index?: number;
}

export interface DoctorDayAssignmentUpdate {
  order_index?: number;
}

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
```

```typescript
export interface DeletedDoctor {
  id: string; // UUID
  user_id: string; // UUID
  doctor_id: number; // BIGINT
  deleted_at: string;
}

export interface DeletedDoctorInsert {
  user_id: string;
  doctor_id: number;
}

export interface DeletedDoctorUpdate {
  // Typically no updates needed
}

export interface UserSettings {
  id: string; // UUID
  user_id: string; // UUID
  theme: 'light' | 'dark' | 'system';
  settings_json: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserSettingsInsert {
  user_id: string;
  theme?: 'light' | 'dark' | 'system';
  settings_json?: Record<string, any>;
}

export interface UserSettingsUpdate {
  theme?: 'light' | 'dark' | 'system';
  settings_json?: Record<string, any>;
}

// Re-export existing types
export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
```

### Application Types (Client-Side)

```typescript
// src/lib/supabase/types.ts

import type { DoctorRow, DoctorVisit, UserRoute } from './database.types';

// Extended Doctor type with user-specific data
export interface Doctor extends DoctorRow {
  // Visit tracking (from doctor_visits table)
  lastVisitDate?: string;
  nextDueDate?: string;
  frequencyDays?: number;
  daysSinceVisit?: number | null;
  isVisited?: boolean;
  
  // Day assignments (from doctor_day_assignments table)
  assignedDays?: DayKey[];
  
  // Route membership (from route_doctors table)
  routeNames?: string[];
}

// Route with doctors
export interface RouteWithDoctors extends UserRoute {
  doctors: Doctor[];
}
```

---

## SERVICE LAYER ARCHITECTURE

### Directory Structure

```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Supabase client initialization
│   │   ├── database.types.ts      # Generated database types
│   │   ├── types.ts               # Application types
│   │   └── services/
│   │       ├── doctors.service.ts
│   │       ├── routes.service.ts
│   │       ├── visits.service.ts
│   │       ├── assignments.service.ts
│   │       └── settings.service.ts
│   ├── store.tsx                  # React Context (modified to use services)
│   └── types.ts                   # Existing types (for compatibility)
```

### 1. Supabase Client

```typescript
// src/lib/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionUrl: true,
  },
});

// Helper to get current user ID
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Helper to require authentication
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Authentication required');
  }
  return userId;
}
```

### 2. Doctors Service

```typescript
// src/lib/supabase/services/doctors.service.ts

import { supabase, requireAuth } from '../client';
import type { DoctorRow, DoctorInsert, DoctorUpdate } from '../database.types';

export class DoctorsService {
  // Get all doctors (excluding user's deleted doctors)
  static async getAllDoctors(): Promise<DoctorRow[]> {
    const userId = await requireAuth();
    
    // Get user's deleted doctor IDs
    const { data: deletedDoctors } = await supabase
      .from('deleted_doctors')
      .select('doctor_id')
      .eq('user_id', userId);
    
    const deletedIds = deletedDoctors?.map(d => d.doctor_id) ?? [];
    
    // Get all doctors except deleted ones
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .not('id', 'in', `(${deletedIds.length > 0 ? deletedIds.join(',') : '0'})`)
      .order('doctor_name');
    
    if (error) throw error;
    return data ?? [];
  }

  // Get doctors by location
  static async getDoctorsByLocation(location: string): Promise<DoctorRow[]> {
    const userId = await requireAuth();
    
    const { data: deletedDoctors } = await supabase
      .from('deleted_doctors')
      .select('doctor_id')
      .eq('user_id', userId);
    
    const deletedIds = deletedDoctors?.map(d => d.doctor_id) ?? [];
    
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('location', location)
      .not('id', 'in', `(${deletedIds.length > 0 ? deletedIds.join(',') : '0'})`)
      .order('doctor_name');
    
    if (error) throw error;
    return data ?? [];
  }

  // Get doctor by ID
  static async getDoctorById(id: number): Promise<DoctorRow | null> {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Add new doctor (admin only)
  static async addDoctor(doctor: DoctorInsert): Promise<DoctorRow> {
    const { data, error } = await supabase
      .from('doctors')
      .insert(doctor)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Update doctor (admin only)
  static async updateDoctor(id: number, update: DoctorUpdate): Promise<DoctorRow> {
    const { data, error } = await supabase
      .from('doctors')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Soft delete doctor (user-specific)
  static async deleteDoctor(doctorId: number): Promise<void> {
    const userId = await requireAuth();
    
    const { error } = await supabase
      .from('deleted_doctors')
      .insert({ user_id: userId, doctor_id: doctorId });
    
    if (error) throw error;
  }

  // Restore deleted doctor
  static async restoreDoctor(doctorId: number): Promise<void> {
    const userId = await requireAuth();
    
    const { error } = await supabase
      .from('deleted_doctors')
      .delete()
      .eq('user_id', userId)
      .eq('doctor_id', doctorId);
    
    if (error) throw error;
  }

  // Search doctors
  static async searchDoctors(query: string): Promise<DoctorRow[]> {
    const userId = await requireAuth();
    
    const { data: deletedDoctors } = await supabase
      .from('deleted_doctors')
      .select('doctor_id')
      .eq('user_id', userId);
    
    const deletedIds = deletedDoctors?.map(d => d.doctor_id) ?? [];
    
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .or(`doctor_name.ilike.%${query}%,location.ilike.%${query}%,speciality.ilike.%${query}%,hospital.ilike.%${query}%`)
      .not('id', 'in', `(${deletedIds.length > 0 ? deletedIds.join(',') : '0'})`)
      .order('doctor_name');
    
    if (error) throw error;
    return data ?? [];
  }
}
```

### 3. Routes Service

```typescript
// src/lib/supabase/services/routes.service.ts

import { supabase, requireAuth } from '../client';
import type { UserRoute, UserRouteInsert, UserRouteUpdate, RouteDoctor, RouteDoctorInsert } from '../database.types';

export class RoutesService {
  // Get all routes for current user
  static async getAllRoutes(): Promise<UserRoute[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('user_routes')
      .select('*')
      .eq('user_id', userId)
      .order('order_index');
    
    if (error) throw error;
    return data ?? [];
  }

  // Get routes by location
  static async getRoutesByLocation(location: string): Promise<UserRoute[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('user_routes')
      .select('*')
      .eq('user_id', userId)
      .eq('location', location)
      .order('order_index');
    
    if (error) throw error;
    return data ?? [];
  }

  // Create new route
  static async createRoute(route: Omit<UserRouteInsert, 'user_id'>): Promise<UserRoute> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('user_routes')
      .insert({ ...route, user_id: userId })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Update route
  static async updateRoute(routeId: string, update: UserRouteUpdate): Promise<UserRoute> {
    await requireAuth();
    
    const { data, error } = await supabase
      .from('user_routes')
      .update(update)
      .eq('id', routeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete route
  static async deleteRoute(routeId: string): Promise<void> {
    await requireAuth();
    
    const { error } = await supabase
      .from('user_routes')
      .delete()
      .eq('id', routeId);
    
    if (error) throw error;
  }

  // Complete route
  static async completeRoute(routeId: string): Promise<UserRoute> {
    return this.updateRoute(routeId, { completed_at: new Date().toISOString() });
  }

  // Uncomplete route
  static async uncompleteRoute(routeId: string): Promise<UserRoute> {
    return this.updateRoute(routeId, { completed_at: null });
  }

  // Get doctors in route
  static async getRouteDoctors(routeId: string): Promise<number[]> {
    await requireAuth();
    
    const { data, error } = await supabase
      .from('route_doctors')
      .select('doctor_id')
      .eq('route_id', routeId)
      .order('order_index');
    
    if (error) throw error;
    return data?.map(rd => rd.doctor_id) ?? [];
  }

  // Add doctor to route
  static async addDoctorToRoute(routeId: string, doctorId: number, orderIndex?: number): Promise<RouteDoctor> {
    await requireAuth();
    
    const { data, error } = await supabase
      .from('route_doctors')
      .insert({ 
        route_id: routeId, 
        doctor_id: doctorId,
        order_index: orderIndex ?? 0
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Remove doctor from route
  static async removeDoctorFromRoute(routeId: string, doctorId: number): Promise<void> {
    await requireAuth();
    
    const { error } = await supabase
      .from('route_doctors')
      .delete()
      .eq('route_id', routeId)
      .eq('doctor_id', doctorId);
    
    if (error) throw error;
  }

  // Reorder doctors in route
  static async reorderDoctorsInRoute(routeId: string, orderedDoctorIds: number[]): Promise<void> {
    await requireAuth();
    
    // Update order_index for each doctor
    const updates = orderedDoctorIds.map((doctorId, index) =>
      supabase
        .from('route_doctors')
        .update({ order_index: index })
        .eq('route_id', routeId)
        .eq('doctor_id', doctorId)
    );
    
    await Promise.all(updates);
  }

  // Reorder routes within a location
  static async reorderRoutes(location: string, orderedRouteIds: string[]): Promise<void> {
    await requireAuth();
    
    const updates = orderedRouteIds.map((routeId, index) =>
      supabase
        .from('user_routes')
        .update({ order_index: index })
        .eq('id', routeId)
    );
    
    await Promise.all(updates);
  }
}
```

### 4. Visits Service

```typescript
// src/lib/supabase/services/visits.service.ts

import { supabase, requireAuth } from '../client';
import type { DoctorVisit, DoctorVisitInsert, DoctorVisitUpdate } from '../database.types';

export class VisitsService {
  // Get all visit records for current user
  static async getAllVisits(): Promise<DoctorVisit[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_visits')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data ?? [];
  }

  // Get visit record for specific doctor
  static async getVisitForDoctor(doctorId: number): Promise<DoctorVisit | null> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_visits')
      .select('*')
      .eq('user_id', userId)
      .eq('doctor_id', doctorId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Mark doctor as visited
  static async markDoctorVisited(doctorId: number, frequencyDays: number = 30): Promise<DoctorVisit> {
    const userId = await requireAuth();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + frequencyDays);
    const nextDue = nextDueDate.toISOString().split('T')[0];

    // Upsert visit record
    const { data, error } = await supabase
      .from('doctor_visits')
      .upsert({
        user_id: userId,
        doctor_id: doctorId,
        last_visit_date: today,
        next_due_date: nextDue,
        frequency_days: frequencyDays,
        is_visited: true,
      }, {
        onConflict: 'user_id,doctor_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Reset visit record
  static async resetDoctorVisit(doctorId: number): Promise<void> {
    const userId = await requireAuth();
    
    const { error } = await supabase
      .from('doctor_visits')
      .delete()
      .eq('user_id', userId)
      .eq('doctor_id', doctorId);
    
    if (error) throw error;
  }

  // Update visit record
  static async updateVisit(doctorId: number, update: DoctorVisitUpdate): Promise<DoctorVisit> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_visits')
      .update(update)
      .eq('user_id', userId)
      .eq('doctor_id', doctorId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Get visits due today
  static async getVisitsDueToday(): Promise<DoctorVisit[]> {
    const userId = await requireAuth();
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('doctor_visits')
      .select('*')
      .eq('user_id', userId)
      .lte('next_due_date', today)
      .order('next_due_date');
    
    if (error) throw error;
    return data ?? [];
  }

  // Get overdue visits
  static async getOverdueVisits(): Promise<DoctorVisit[]> {
    const userId = await requireAuth();
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('doctor_visits')
      .select('*')
      .eq('user_id', userId)
      .lt('next_due_date', today)
      .order('next_due_date');
    
    if (error) throw error;
    return data ?? [];
  }
}
```

### 5. Assignments Service

```typescript
// src/lib/supabase/services/assignments.service.ts

import { supabase, requireAuth } from '../client';
import type { DoctorDayAssignment, DoctorDayAssignmentInsert } from '../database.types';
import type { DayKey } from '../types';

export class AssignmentsService {
  // Get all day assignments for current user
  static async getAllAssignments(): Promise<DoctorDayAssignment[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_day_assignments')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data ?? [];
  }

  // Get assignments for specific doctor
  static async getAssignmentsForDoctor(doctorId: number): Promise<DayKey[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_day_assignments')
      .select('day_key')
      .eq('user_id', userId)
      .eq('doctor_id', doctorId);
    
    if (error) throw error;
    return data?.map(a => a.day_key as DayKey) ?? [];
  }

  // Get doctors for location and day
  static async getDoctorsForLocationDay(location: string, day: DayKey): Promise<number[]> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('doctor_day_assignments')
      .select('doctor_id')
      .eq('user_id', userId)
      .eq('location', location)
      .eq('day_key', day)
      .order('order_index');
    
    if (error) throw error;
    return data?.map(a => a.doctor_id) ?? [];
  }

  // Set day assignments for doctor
  static async setDayAssignments(doctorId: number, location: string, days: DayKey[]): Promise<void> {
    const userId = await requireAuth();
    
    // Delete existing assignments
    await supabase
      .from('doctor_day_assignments')
      .delete()
      .eq('user_id', userId)
      .eq('doctor_id', doctorId);
    
    // Insert new assignments
    if (days.length > 0) {
      const assignments: DoctorDayAssignmentInsert[] = days.map((day, index) => ({
        user_id: userId,
        doctor_id: doctorId,
        location,
        day_key: day,
        order_index: index,
      }));
      
      const { error } = await supabase
        .from('doctor_day_assignments')
        .insert(assignments);
      
      if (error) throw error;
    }
  }

  // Toggle single day assignment
  static async toggleDayAssignment(doctorId: number, location: string, day: DayKey): Promise<void> {
    const userId = await requireAuth();
    
    // Check if assignment exists
    const { data: existing } = await supabase
      .from('doctor_day_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('doctor_id', doctorId)
      .eq('day_key', day)
      .maybeSingle();
    
    if (existing) {
      // Remove assignment
      await supabase
        .from('doctor_day_assignments')
        .delete()
        .eq('id', existing.id);
    } else {
      // Add assignment
      await supabase
        .from('doctor_day_assignments')
        .insert({
          user_id: userId,
          doctor_id: doctorId,
          location,
          day_key: day,
          order_index: 0,
        });
    }
  }

  // Reorder doctors for location and day
  static async reorderLocationDay(location: string, day: DayKey, orderedDoctorIds: number[]): Promise<void> {
    const userId = await requireAuth();
    
    const updates = orderedDoctorIds.map((doctorId, index) =>
      supabase
        .from('doctor_day_assignments')
        .update({ order_index: index })
        .eq('user_id', userId)
        .eq('location', location)
        .eq('day_key', day)
        .eq('doctor_id', doctorId)
    );
    
    await Promise.all(updates);
  }
}
```

### 6. Settings Service

```typescript
// src/lib/supabase/services/settings.service.ts

import { supabase, requireAuth } from '../client';
import type { UserSettings, UserSettingsInsert, UserSettingsUpdate } from '../database.types';

export class SettingsService {
  // Get user settings
  static async getSettings(): Promise<UserSettings | null> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Create or update settings
  static async upsertSettings(settings: Omit<UserSettingsInsert, 'user_id'>): Promise<UserSettings> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        ...settings,
        user_id: userId,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Update theme
  static async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<UserSettings> {
    return this.upsertSettings({ theme });
  }
}
```

---

## MIGRATION PLAN FROM LOCALSTORAGE

### Phase 1: Setup Supabase Infrastructure (Day 1-2)

1. **Create Supabase Project**
   - Sign up at supabase.com
   - Create new project
   - Save project URL and anon key

2. **Run SQL Scripts**
   - Execute all table creation scripts in Supabase SQL Editor
   - Execute all RLS policy scripts
   - Verify tables and policies are created

3. **Seed Doctor Master Data**
   ```sql
   -- Import existing doctor data to doctors table
   -- Use the SEED_DOCTORS data from doctors.ts
   ```

4. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js
   ```

5. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Phase 2: Implement Service Layer (Day 3-4)

1. **Create Service Files**
   - Implement all service classes
   - Add error handling
   - Add TypeScript types

2. **Test Services**
   - Create test user
   - Test CRUD operations
   - Verify RLS policies work

### Phase 3: Migrate Store to Use Services (Day 5-7)

1. **Add Supabase Context**
   ```typescript
   // src/lib/supabase/supabase-provider.tsx
   'use client';
   
   import { createContext, useContext, useEffect, useState } from 'react';
   import { supabase } from './client';
   import type { User } from '@supabase/supabase-js';
   
   interface SupabaseContext {
     user: User | null;
     loading: boolean;
   }
   
   const Context = createContext<SupabaseContext>({ user: null, loading: true });
   
   export function SupabaseProvider({ children }: { children: React.ReactNode }) {
     const [user, setUser] = useState<User | null>(null);
     const [loading, setLoading] = useState(true);
   
     useEffect(() => {
       supabase.auth.getSession().then(({ data: { session } }) => {
         setUser(session?.user ?? null);
         setLoading(false);
       });
   
       const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
         setUser(session?.user ?? null);
       });
   
       return () => subscription.unsubscribe();
     }, []);
   
     return <Context.Provider value={{ user, loading }}>{children}</Context.Provider>;
   }
   
   export const useSupabase = () => useContext(Context);
   ```

2. **Modify Store Provider**
   - Replace localStorage calls with service calls
   - Keep the same API surface for components
   - No component changes needed

3. **Data Migration Utility**
   ```typescript
   // src/lib/supabase/migrate-data.ts
   
   import { supabase } from './client';
   import { DoctorsService } from './services/doctors.service';
   import { RoutesService } from './services/routes.service';
   import { VisitsService } from './services/visits.service';
   import { AssignmentsService } from './services/assignments.service';
   import { SettingsService } from './services/settings.service';
   import type { AppState } from '../types';
   
   const STORAGE_KEY = 'mr-route-planner-v1';
   
   export async function migrateLocalStorageToSupabase(): Promise<void> {
     // 1. Check if user is authenticated
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error('User must be authenticated');
   
     // 2. Load LocalStorage data
     const raw = localStorage.getItem(STORAGE_KEY);
     if (!raw) {
       console.log('No LocalStorage data to migrate');
       return;
     }
   
     const localData: AppState = JSON.parse(raw);
     console.log('Migrating data for user:', user.email);
   
     try {
       // 3. Migrate doctors master data (if new doctors exist)
       console.log('Checking doctors...');
       for (const doctor of localData.doctors) {
         // Check if doctor exists in master table
         const existing = await DoctorsService.getDoctorById(doctor.id);
         if (!existing) {
           // Add to master table
           await DoctorsService.addDoctor({
             doctor_name: doctor.doctorName,
             location: doctor.location,
             address: doctor.address,
             speciality: doctor.speciality,
             qualification: doctor.qualification,
             hospital: doctor.hospital,
             mobile: doctor.mobile,
             notes: doctor.notes,
           });
         }
       }
   
       // 4. Migrate visit tracking
       console.log('Migrating visit tracking...');
       for (const doctor of localData.doctors) {
         if (doctor.lastVisitDate || doctor.isVisited) {
           await VisitsService.markDoctorVisited(
             doctor.id,
             doctor.frequencyDays || doctor.visitFrequencyDays || 30
           );
         }
       }
   
       // 5. Migrate day assignments
       console.log('Migrating day assignments...');
       for (const [doctorIdStr, days] of Object.entries(localData.assignments)) {
         const doctorId = Number(doctorIdStr);
         const doctor = localData.doctors.find(d => d.id === doctorId);
         if (doctor && days.length > 0) {
           await AssignmentsService.setDayAssignments(doctorId, doctor.location, days);
         }
       }
   
       // 6. Migrate routes
       console.log('Migrating routes...');
       for (const route of localData.routes) {
         const newRoute = await RoutesService.createRoute({
           location: route.location,
           name: route.name,
           cycle_days: route.cycleDays,
           completed_at: route.completedAt,
           order_index: route.order,
         });
   
         // Add doctors to route
         for (let i = 0; i < route.doctorIds.length; i++) {
           await RoutesService.addDoctorToRoute(newRoute.id, route.doctorIds[i], i);
         }
       }
   
       // 7. Migrate deleted doctors
       console.log('Migrating deleted doctors...');
       for (const doctorId of localData.deletedDoctorIds) {
         await DoctorsService.deleteDoctor(doctorId);
       }
   
       // 8. Migrate settings
       console.log('Migrating settings...');
       await SettingsService.updateTheme(localData.settings.theme);
   
       console.log('Migration completed successfully!');
       
       // 9. Backup LocalStorage data
       localStorage.setItem(`${STORAGE_KEY}-backup`, raw);
       
       // 10. Clear LocalStorage (optional - can be done manually)
       // localStorage.removeItem(STORAGE_KEY);
       
     } catch (error) {
       console.error('Migration failed:', error);
       throw error;
     }
   }
   ```

### Phase 4: Add Authentication (Day 8-10)

1. **Create Auth Pages**
   ```typescript
   // src/app/login/page.tsx - Simple email/password login
   // src/app/signup/page.tsx - User registration
   ```

2. **Protected Routes**
   ```typescript
   // src/components/auth-guard.tsx
   'use client';
   
   import { useSupabase } from '@/lib/supabase/supabase-provider';
   import { useRouter } from 'next/navigation';
   import { useEffect } from 'react';
   
   export function AuthGuard({ children }: { children: React.ReactNode }) {
     const { user, loading } = useSupabase();
     const router = useRouter();
   
     useEffect(() => {
       if (!loading && !user) {
         router.push('/login');
       }
     }, [user, loading, router]);
   
     if (loading) return <div>Loading...</div>;
     if (!user) return null;
   
     return <>{children}</>;
   }
   ```

3. **Update Root Layout**
   ```typescript
   // Wrap app with SupabaseProvider and AuthGuard
   ```

### Phase 5: Testing & Rollout (Day 11-14)

1. **Test All Features**
   - Create test accounts
   - Test all CRUD operations
   - Test route management
   - Test visit tracking
   - Test day assignments
   - Test data isolation (multi-user)

2. **Migration Testing**
   - Test migration script with sample data
   - Verify data integrity
   - Test rollback if needed

3. **Gradual Rollout**
   - Deploy to staging
   - Migrate test users
   - Collect feedback
   - Fix issues
   - Deploy to production

### Phase 6: Deprecate LocalStorage (Day 15+)

1. **Monitor Usage**
   - Track Supabase usage
   - Monitor errors
   - Collect user feedback

2. **Remove LocalStorage Code**
   - After 30 days of stable operation
   - Keep migration utility for late adopters

---

## FUTURE PUBLIC DIRECTORY ARCHITECTURE

### Public Directory Features

```typescript
// src/app/directory/page.tsx - Public doctor directory
// No authentication required
// Read-only access to doctors table
```

### Public API Endpoints

```typescript
// src/app/api/public/doctors/route.ts

import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');
  const speciality = searchParams.get('speciality');
  const query = searchParams.get('q');

  let queryBuilder = supabase
    .from('doctors')
    .select('id, doctor_name, location, speciality, qualification, hospital, address, mobile')
    .order('doctor_name');

  if (location) {
    queryBuilder = queryBuilder.eq('location', location);
  }

  if (speciality) {
    queryBuilder = queryBuilder.eq('speciality', speciality);
  }

  if (query) {
    queryBuilder = queryBuilder.or(
      `doctor_name.ilike.%${query}%,speciality.ilike.%${query}%,hospital.ilike.%${query}%`
    );
  }

  const { data, error } = await queryBuilder;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ doctors: data });
}
```

### Public Directory UI

```typescript
// Features for public users:
// - Search doctors by name, location, speciality
// - Filter by location
// - Filter by speciality
// - View doctor details (public fields only)
// - No visit tracking
// - No route management
// - No day assignments
```

### Security Considerations

1. **Rate Limiting**
   - Implement rate limiting for public API
   - Prevent scraping

2. **Data Exposure**
   - Only expose public-safe fields
   - No private MR data visible

3. **Privacy**
   - Consider adding opt-in/opt-out for doctors
   - Add privacy policy
   - GDPR compliance

---

## RELATIONSHIPS DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE ARCHITECTURE                            │
│                    MR Portal + Public Directory                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                           USER ACCOUNTS                                   │
├──────────────────────────────────────────────────────────────────────────┤
│  auth.users (Supabase Auth)                                              │
│      │                                                                    │
│      └──> profiles (id, email, role, created_at)                         │
│               │                                                           │
│               │ user_id (FK)                                              │
│               ├──────────────────────────────────────────┐               │
│               │                                          │               │
│               ▼                                          ▼               │
│       user_settings                            user_routes               │
│       (theme, prefs)                           (id, name, location)      │
│                                                         │                │
│                                                         │ route_id (FK)  │
│                                                         ▼                │
│                                               route_doctors              │
│                                               (route ↔ doctor mapping)   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      PUBLIC MASTER DATA (Shared)                         │
├──────────────────────────────────────────────────────────────────────────┤
│                            doctors                                       │
│                 (id, name, location, speciality, etc.)                   │
│                              │                                           │
│        ┌─────────────────────┼─────────────────────┐                   │
│        │                     │                     │                    │
│        │ doctor_id (FK)      │                     │                    │
│        ▼                     ▼                     ▼                    │
│  route_doctors      doctor_day_assignments   doctor_visits              │
│  (Many-to-Many)     (User-specific days)    (User visit tracking)       │
│                                                                          │
│  Accessible by:                                                          │
│  - Authenticated MR users (read/write via services)                     │
│  - Public users (read-only via RLS)                                     │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      PRIVATE USER DATA (Isolated)                        │
├──────────────────────────────────────────────────────────────────────────┤
│  All tables have user_id FK + RLS policies                               │
│                                                                          │
│  user_routes                 - User's custom routes                     │
│  route_doctors               - Doctors in user's routes                 │
│  doctor_day_assignments      - User's day assignments                   │
│  doctor_visits               - User's visit tracking                    │
│  deleted_doctors             - User's deleted doctors                   │
│  user_settings               - User's preferences                       │
│                                                                          │
│  Each user sees ONLY their own data via RLS                             │
└──────────────────────────────────────────────────────────────────────────┘
```

### Entity Relationships

```
profiles (1) ──────< (N) user_routes
profiles (1) ──────< (N) doctor_day_assignments
profiles (1) ──────< (N) doctor_visits
profiles (1) ──────< (N) deleted_doctors
profiles (1) ────── (1) user_settings

doctors (1) ──────< (N) route_doctors
doctors (1) ──────< (N) doctor_day_assignments
doctors (1) ──────< (N) doctor_visits
doctors (1) ──────< (N) deleted_doctors

user_routes (1) ──────< (N) route_doctors
```

---

## KEY BENEFITS OF THIS ARCHITECTURE

### 1. Data Separation
✅ Public doctor data in shared `doctors` table  
✅ Private MR data isolated per user  
✅ Clear boundaries between public and private data

### 2. Multi-tenancy
✅ Each MR user has isolated routes, assignments, visits  
✅ Users cannot see each other's data  
✅ RLS enforces data access at database level

### 3. Scalability
✅ Ready for thousands of users  
✅ Efficient queries with proper indexes  
✅ Can add caching layer later

### 4. Security
✅ Row Level Security (RLS) on all tables  
✅ Authentication via Supabase Auth  
✅ API secured with JWT tokens

### 5. Future-proof
✅ Public directory ready to launch  
✅ Can add admin panel easily  
✅ Can add mobile app later  
✅ Can add analytics and reporting

### 6. Zero UI Changes
✅ Service layer abstracts backend  
✅ Store API remains the same  
✅ Components unchanged  
✅ User experience identical

---

## MIGRATION SAFETY

### How Current App Migrates Safely

1. **Parallel Operation**
   - Keep LocalStorage working during migration
   - New features use Supabase
   - Old data migrated in background

2. **Backup First**
   - LocalStorage data backed up before migration
   - Can rollback if issues occur

3. **Gradual Rollout**
   - Test with single user first
   - Migrate users in batches
   - Monitor for issues

4. **No Breaking Changes**
   - Store API stays the same
   - Components don't change
   - Navigation unchanged
   - Workflows unchanged

5. **Data Integrity**
   - Migration script validates data
   - Checks for conflicts
   - Preserves all relationships

6. **Fallback Plan**
   - Keep LocalStorage backup for 30 days
   - Can restore if needed
   - Rollback script available

---

## NEXT STEPS

1. **Review this architecture document**
2. **Create Supabase project**
3. **Run SQL scripts in Supabase SQL Editor**
4. **Install dependencies**
5. **Implement service layer**
6. **Test with sample data**
7. **Implement migration script**
8. **Add authentication**
9. **Test thoroughly**
10. **Deploy to production**

---

## SUPPORT & MAINTENANCE

### Monitoring
- Set up Supabase dashboard monitoring
- Track API usage
- Monitor error rates
- Set up alerts for issues

### Backup
- Supabase automatic backups
- Export data periodically
- Keep LocalStorage backup for 30 days

### Performance
- Use Supabase dashboard to monitor query performance
- Add indexes as needed
- Optimize slow queries

### Security
- Regular security audits
- Keep dependencies updated
- Monitor for suspicious activity
- Regular RLS policy reviews

---

**END OF ARCHITECTURE DOCUMENT**
