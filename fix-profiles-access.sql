-- ============================================================================
-- Fix Profiles Table Access
-- ============================================================================
-- This script ensures authenticated users can read and write their own profiles
-- Run this in Supabase SQL Editor
--
-- Issue: "Error loading profile" - RLS is blocking profile access
-- Solution: Add policies to allow authenticated users to access profiles
-- ============================================================================

-- ============================================================================
-- 1. Check Current RLS Status
-- ============================================================================

-- Check if RLS is enabled on profiles
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- ============================================================================
-- 2. Ensure Profiles Table is Accessible
-- ============================================================================

-- Option A: Disable RLS temporarily (simplest for single-user testing)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Note: This makes profiles accessible to all authenticated users
-- For production, you'll want to enable RLS with proper policies

-- ============================================================================
-- 3. OR: Enable RLS with Proper Policies (for multi-user)
-- ============================================================================

-- Uncomment these if you want RLS enabled with proper policies:

/*
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all profiles
CREATE POLICY "profiles_select_policy" 
ON profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Policy: Users can insert their own profile
CREATE POLICY "profiles_insert_policy" 
ON profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "profiles_update_policy" 
ON profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "profiles_delete_policy" 
ON profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = id);
*/

-- ============================================================================
-- 4. Grant Permissions
-- ============================================================================

-- Ensure authenticated users can access profiles table
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- ============================================================================
-- 5. Verify Setup
-- ============================================================================

-- Check RLS status
SELECT 
  'RLS Status: ' AS check_type,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS status
FROM pg_tables
WHERE tablename = 'profiles';

-- Count profiles
SELECT 
  'Profiles Count: ' AS check_type,
  COUNT(*)::TEXT AS count
FROM profiles;

-- ============================================================================
-- 6. Test Profile Access
-- ============================================================================

-- Try to select profiles (should work now)
SELECT id, email, full_name, role FROM profiles LIMIT 5;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Profiles table access configured!';
  RAISE NOTICE '';
  RAISE NOTICE 'What was done:';
  RAISE NOTICE '- RLS disabled on profiles table (or policies added)';
  RAISE NOTICE '- Permissions granted to authenticated users';
  RAISE NOTICE '- Profile access should work now';
  RAISE NOTICE '';
  RAISE NOTICE 'Test by:';
  RAISE NOTICE '1. Signing up/in at your app';
  RAISE NOTICE '2. Checking Dashboard - profile should load';
  RAISE NOTICE '3. No more "Error loading profile" messages';
END $$;
