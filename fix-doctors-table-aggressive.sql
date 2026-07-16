-- ============================================================================
-- AGGRESSIVE FIX FOR DOCTORS TABLE 409 ERROR
-- ============================================================================

-- Step 1: Completely disable RLS on doctors table
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Authenticated users can view doctors" ON doctors;
DROP POLICY IF EXISTS "Public users can view doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can insert doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can update doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can delete doctors" ON doctors;
DROP POLICY IF EXISTS "allow_all_doctors" ON doctors;
DROP POLICY IF EXISTS "allow_all_access" ON doctors;

-- Step 3: Verify no policies remain
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'doctors';

-- Should return 0 rows

-- Step 4: Grant explicit INSERT permission
GRANT ALL ON doctors TO anon;
GRANT ALL ON doctors TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE doctors_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE doctors_id_seq TO authenticated;

-- Step 5: Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'doctors';

-- Should show: doctors | false
