-- ============================================================================
-- FIX RLS AND PERMISSIONS FOR NO-AUTH MODE
-- Run this in Supabase SQL Editor to fix 409 Conflict errors
-- ============================================================================
-- 
-- PROBLEM: 409 Conflict when adding doctors
-- CAUSE: RLS policies blocking anon user, admin-only insert policy
-- SOLUTION: Disable RLS for single-user mode, grant anon permissions
--
-- ============================================================================

-- ============================================================================
-- STEP 1: DISABLE RLS ON ALL TABLES (Single-User Mode)
-- ============================================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE route_doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_day_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: FIX DOCTORS TABLE - Remove Admin-Only Policies
-- ============================================================================

-- Drop all restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view doctors" ON doctors;
DROP POLICY IF EXISTS "Public users can view doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can insert doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can update doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can delete doctors" ON doctors;
DROP POLICY IF EXISTS "allow_all_doctors" ON doctors;

-- Create open access policy for anon and authenticated users
CREATE POLICY "allow_all_access" 
  ON doctors 
  FOR ALL 
  TO anon, authenticated
  USING (true) 
  WITH CHECK (true);

-- ============================================================================
-- STEP 3: GRANT PERMISSIONS TO ANON ROLE (CRITICAL!)
-- ============================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- STEP 4: CREATE DEFAULT USER (if not exists)
-- ============================================================================

INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'default@local.app',
  'Default User',
  'mr'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 5: VERIFICATION - Check RLS Status
-- ============================================================================

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'doctors', 
    'user_routes', 
    'route_doctors', 
    'doctor_day_assignments',
    'doctor_visits',
    'deleted_doctors',
    'user_settings',
    'profiles'
  )
ORDER BY tablename;

-- Expected: All tables should show rls_enabled = false (except doctors = true with open policy)

-- ============================================================================
-- COMPLETE - Refresh your app and try adding a doctor again!
-- ============================================================================
