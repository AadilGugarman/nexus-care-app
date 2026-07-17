-- ============================================================================
-- Make User Admin - Quick Script
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
-- Step 2: Promote to admin
-- ============================================================================

UPDATE profiles
SET role = 'admin'
WHERE email = 'john@gmail.com';

-- ============================================================================
-- Step 3: Verify the change
-- ============================================================================

SELECT 
  email,
  role,
  'SUCCESS! User is now admin. User must logout/login to apply changes.' as message
FROM profiles
WHERE email = 'john@gmail.com';

-- ============================================================================
-- Step 4: View all admins (optional)
-- ============================================================================

SELECT 
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
-- 1. User must LOGOUT from the application
-- 2. User must LOGIN again
-- 3. Navigate to /admin to verify access
-- 4. Check /admin/reviews page
-- 5. Check /admin/analytics page
-- ============================================================================
