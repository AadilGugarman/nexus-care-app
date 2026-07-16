-- ============================================================================
-- DIAGNOSE DOCTORS TABLE - Find what's causing 409
-- ============================================================================

-- 1. Check RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'doctors';

-- 2. Check all policies on doctors table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'doctors';

-- 3. Check constraints
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'doctors'::regclass;

-- 4. Check triggers
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'doctors';

-- 5. Check permissions for anon role
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'doctors'
  AND grantee IN ('anon', 'authenticated', 'postgres');

-- 6. Check sequence permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.usage_privileges
WHERE object_schema = 'public'
  AND object_name = 'doctors_id_seq'
  AND grantee IN ('anon', 'authenticated', 'postgres');

-- 7. Try a test insert as anon (this will fail if there's an issue)
-- SET ROLE anon;
-- INSERT INTO doctors (doctor_name, location) VALUES ('Test Doctor', 'Test Location');
-- RESET ROLE;
