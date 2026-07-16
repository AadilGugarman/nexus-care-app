-- ============================================================================
-- Enable Authentication Infrastructure
-- ============================================================================
-- This script sets up the automatic profile creation trigger for new users
-- Run this AFTER enabling Supabase Auth in your project dashboard
--
-- What this does:
-- 1. Creates a function that automatically creates a profile when a user signs up
-- 2. Creates a trigger that runs this function on every new auth.users insert
-- 3. Profiles inherit email, name, and role from signup metadata
--
-- Prerequisites:
-- - Supabase Auth must be enabled in project dashboard
-- - Email provider must be configured
-- - profiles table must exist (already exists in your schema)
--
-- IMPORTANT: This script must be run as the postgres/supabase_admin user
-- Run in Supabase SQL Editor (it runs with proper permissions automatically)
-- ============================================================================

-- ============================================================================
-- 1. Create Profile Creation Function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new profile for the user
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mr')::TEXT,
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates a profile record when a new user signs up via Supabase Auth';

-- ============================================================================
-- 2. Create Trigger on auth.users
-- ============================================================================
-- Note: This requires admin privileges which the SQL Editor has by default

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
-- This will work in Supabase SQL Editor because it runs with elevated permissions
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Trigger that creates a profile when a new user signs up';

-- ============================================================================
-- 3. Grant Permissions
-- ============================================================================
-- Ensure the function can be executed by the service role

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

-- ============================================================================
-- 4. Verify Setup
-- ============================================================================

-- Check if function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) THEN
    RAISE NOTICE '✅ Function handle_new_user() created successfully';
  ELSE
    RAISE WARNING '❌ Function handle_new_user() not found';
  END IF;
END $$;

-- Check if trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created created successfully';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created not found';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Authentication infrastructure enabled successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Enable Supabase Auth in project dashboard';
  RAISE NOTICE '2. Configure Email provider settings';
  RAISE NOTICE '3. Test by creating a user via signup';
  RAISE NOTICE '4. Verify profile is created in profiles table';
  RAISE NOTICE '';
  RAISE NOTICE 'Notes:';
  RAISE NOTICE '- Default role: mr (medical representative)';
  RAISE NOTICE '- Set role during signup via metadata: { role: "admin" }';
  RAISE NOTICE '- RLS is still disabled (will enable in Phase 4)';
END $$;
