-- ============================================================================
-- SUPABASE DATABASE SCHEMA
-- MR Portal + Public Doctor Directory
-- ============================================================================
-- 
-- IMPORTANT: Execute this script in Supabase SQL Editor
-- This will create all tables, indexes, RLS policies, and triggers
--
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'mr' CHECK (role IN ('mr', 'admin', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================================
-- 2. DOCTORS TABLE (Public Master Data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctors (
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

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_doctors_location ON doctors(location);
CREATE INDEX IF NOT EXISTS idx_doctors_name ON doctors(doctor_name);
CREATE INDEX IF NOT EXISTS idx_doctors_speciality ON doctors(speciality);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_doctors_search ON doctors USING GIN (
  to_tsvector('english', 
    COALESCE(doctor_name, '') || ' ' || 
    COALESCE(location, '') || ' ' || 
    COALESCE(speciality, '') || ' ' || 
    COALESCE(hospital, '')
  )
);

-- ============================================================================
-- 3. USER ROUTES TABLE (Private User Data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_routes (
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

ALTER TABLE user_routes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_routes_user_id ON user_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_routes_location ON user_routes(location);
CREATE INDEX IF NOT EXISTS idx_user_routes_user_location ON user_routes(user_id, location);

-- ============================================================================
-- 4. ROUTE DOCTORS TABLE (Route-Doctor Mapping)
-- ============================================================================

CREATE TABLE IF NOT EXISTS route_doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID NOT NULL REFERENCES user_routes(id) ON DELETE CASCADE,
  doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_route_doctor UNIQUE (route_id, doctor_id)
);

ALTER TABLE route_doctors ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_route_doctors_route_id ON route_doctors(route_id);
CREATE INDEX IF NOT EXISTS idx_route_doctors_doctor_id ON route_doctors(doctor_id);

-- ============================================================================
-- 5. DOCTOR DAY ASSIGNMENTS TABLE (User-specific Day Assignments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_day_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  day_key TEXT NOT NULL CHECK (day_key IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_doctor_day UNIQUE (user_id, doctor_id, day_key)
);

ALTER TABLE doctor_day_assignments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_day_assignments_user_id ON doctor_day_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_day_assignments_doctor_id ON doctor_day_assignments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_day_assignments_user_location_day ON doctor_day_assignments(user_id, location, day_key);

-- ============================================================================
-- 6. DOCTOR VISITS TABLE (User-specific Visit Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_visits (
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

ALTER TABLE doctor_visits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_doctor_visits_user_id ON doctor_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_visits_doctor_id ON doctor_visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_visits_user_doctor ON doctor_visits(user_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_visits_next_due ON doctor_visits(user_id, next_due_date) WHERE next_due_date IS NOT NULL;

-- ============================================================================
-- 7. DELETED DOCTORS TABLE (Soft Delete per User)
-- ============================================================================

CREATE TABLE IF NOT EXISTS deleted_doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_deleted_doctor UNIQUE (user_id, doctor_id)
);

ALTER TABLE deleted_doctors ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_deleted_doctors_user_id ON deleted_doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_doctors_doctor_id ON deleted_doctors(doctor_id);

-- ============================================================================
-- 8. USER SETTINGS TABLE (User Preferences)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ============================================================================
-- TRIGGERS - Updated At Timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at column
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_routes_updated_at ON user_routes;
CREATE TRIGGER update_user_routes_updated_at
  BEFORE UPDATE ON user_routes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_visits_updated_at ON doctor_visits;
CREATE TRIGGER update_doctor_visits_updated_at
  BEFORE UPDATE ON doctor_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PROFILES TABLE POLICIES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- DOCTORS TABLE POLICIES (Public Directory Data)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can view doctors" ON doctors;
CREATE POLICY "Authenticated users can view doctors"
  ON doctors FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Public users can view doctors" ON doctors;
CREATE POLICY "Public users can view doctors"
  ON doctors FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Admins can insert doctors" ON doctors;
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

DROP POLICY IF EXISTS "Admins can update doctors" ON doctors;
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

DROP POLICY IF EXISTS "Admins can delete doctors" ON doctors;
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

-- ----------------------------------------------------------------------------
-- USER ROUTES TABLE POLICIES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own routes" ON user_routes;
CREATE POLICY "Users can view own routes"
  ON user_routes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own routes" ON user_routes;
CREATE POLICY "Users can insert own routes"
  ON user_routes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own routes" ON user_routes;
CREATE POLICY "Users can update own routes"
  ON user_routes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own routes" ON user_routes;
CREATE POLICY "Users can delete own routes"
  ON user_routes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- ROUTE DOCTORS TABLE POLICIES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own route doctors" ON route_doctors;
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

DROP POLICY IF EXISTS "Users can insert doctors to own routes" ON route_doctors;
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

DROP POLICY IF EXISTS "Users can update doctors in own routes" ON route_doctors;
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

DROP POLICY IF EXISTS "Users can delete doctors from own routes" ON route_doctors;
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

-- ----------------------------------------------------------------------------
-- DOCTOR DAY ASSIGNMENTS TABLE POLICIES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own day assignments" ON doctor_day_assignments;
CREATE POLICY "Users can view own day assignments"
  ON doctor_day_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own day assignments" ON doctor_day_assignments;
CREATE POLICY "Users can insert own day assignments"
  ON doctor_day_assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own day assignments" ON doctor_day_assignments;
CREATE POLICY "Users can update own day assignments"
  ON doctor_day_assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own day assignments" ON doctor_day_assignments;
CREATE POLICY "Users can delete own day assignments"
  ON doctor_day_assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- DOCTOR VISITS TABLE POLICIES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own visit records" ON doctor_visits;
CREATE POLICY "Users can view own visit records"
  ON doctor_visits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own visit records" ON doctor_visits;
CREATE POLICY "Users can insert own visit records"
  ON doctor_visits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own visit records" ON doctor_visits;
CREATE POLICY "Users can update own visit records"
  ON doctor_visits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own visit records" ON doctor_visits;
CREATE POLICY "Users can delete own visit records"
  ON doctor_visits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- DELETED DOCTORS TABLE POLICIES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own deleted doctors" ON deleted_doctors;
CREATE POLICY "Users can view own deleted doctors"
  ON deleted_doctors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own deleted doctors" ON deleted_doctors;
CREATE POLICY "Users can insert own deleted doctors"
  ON deleted_doctors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own deleted doctors" ON deleted_doctors;
CREATE POLICY "Users can delete own deleted doctors"
  ON deleted_doctors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- USER SETTINGS TABLE POLICIES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- HELPFUL VIEWS (Optional)
-- ============================================================================

-- View: Active Routes (not completed or due/overdue)
CREATE OR REPLACE VIEW active_routes_view AS
SELECT 
  ur.*,
  CASE 
    WHEN ur.completed_at IS NULL THEN 'active'
    WHEN CURRENT_DATE >= (ur.completed_at::date + ur.cycle_days) THEN 'overdue'
    WHEN CURRENT_DATE = (ur.completed_at::date + ur.cycle_days) THEN 'due'
    ELSE 'completed'
  END AS status,
  (ur.completed_at::date + ur.cycle_days) - CURRENT_DATE AS days_remaining
FROM user_routes ur;

-- View: Doctors with visit status (per user)
CREATE OR REPLACE VIEW doctors_with_visits_view AS
SELECT 
  d.*,
  dv.user_id,
  dv.last_visit_date,
  dv.next_due_date,
  dv.frequency_days,
  dv.is_visited,
  CASE 
    WHEN dv.next_due_date IS NULL THEN 'never-visited'
    WHEN CURRENT_DATE > dv.next_due_date THEN 'overdue'
    WHEN CURRENT_DATE = dv.next_due_date THEN 'due-today'
    WHEN CURRENT_DATE >= dv.next_due_date - 3 THEN 'due-soon'
    ELSE 'not-due'
  END AS visit_status,
  CURRENT_DATE - dv.last_visit_date AS days_since_visit,
  dv.next_due_date - CURRENT_DATE AS days_until_due
FROM doctors d
LEFT JOIN doctor_visits dv ON d.id = dv.doctor_id;

-- ============================================================================
-- SEED DATA - Sample Admin User
-- ============================================================================
-- NOTE: You need to manually create the auth.users entry via Supabase Auth
-- Then insert into profiles with role='admin'

-- Example (replace with actual user ID after signup):
-- INSERT INTO profiles (id, email, full_name, role)
-- VALUES ('YOUR-AUTH-USER-ID', 'admin@example.com', 'Admin User', 'admin');

-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================================

-- Next steps:
-- 1. Verify all tables are created
-- 2. Verify RLS is enabled on all tables
-- 3. Test policies with a test user
-- 4. Import doctor master data
-- 5. Create first MR user and test functionality
