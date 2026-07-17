-- ============================================================================
-- Revert Admin to MR - Quick Script
-- ============================================================================

-- INSTRUCTIONS:
-- 1. Replace 'john@gmail.com' with the user's email address
-- 2. Run this script in Supabase SQL Editor
-- 3. User must logout and login again to see changes

-- ============================================================================
-- Step 1: Check current role
-- ============================================================================

SELECT 
  email,
  role,
  full_name,
  created_at
FROM profiles
WHERE email = 'john@gmail.com';

-- ============================================================================
-- Step 2: Revert to MR
-- ============================================================================

UPDATE profiles
SET role = 'mr'
WHERE email = 'john@gmail.com';

-- ============================================================================
-- Step 3: Verify the change
-- ============================================================================

SELECT 
  email,
  role,
  'SUCCESS! User is now MR. User must logout/login to apply changes.' as message
FROM profiles
WHERE email = 'john@gmail.com';

-- ============================================================================
-- Step 4: View all MRs (optional)
-- ============================================================================

SELECT 
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE role = 'mr'
ORDER BY created_at DESC;

-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
-- 1. User must LOGOUT from the application
-- 2. User must LOGIN again
-- 3. /admin pages will no longer be accessible
-- 4. MR features will be available
-- ============================================================================
