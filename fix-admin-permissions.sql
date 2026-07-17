-- ============================================================================
-- FIX ADMIN DASHBOARD PERMISSIONS
-- ============================================================================
-- Run this in Supabase SQL Editor to fix 403 errors
-- ============================================================================

-- Grant access to directory_analytics table
GRANT ALL ON directory_analytics TO authenticated;
GRANT ALL ON directory_analytics TO anon;
GRANT ALL ON directory_analytics TO postgres;

-- Grant access to RPC functions
GRANT EXECUTE ON FUNCTION get_most_viewed_doctors TO authenticated;
GRANT EXECUTE ON FUNCTION get_most_viewed_doctors TO anon;

-- Grant access to request statistics functions (if they exist)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Verify permissions
SELECT 
    tablename,
    tableowner,
    has_table_privilege('authenticated', schemaname || '.' || tablename, 'SELECT') as can_select,
    has_table_privilege('authenticated', schemaname || '.' || tablename, 'INSERT') as can_insert
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('directory_analytics', 'doctor_creation_requests', 'doctor_change_requests', 'doctor_status_requests');

-- Check function permissions
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%doctor%' OR routine_name LIKE '%request%' OR routine_name LIKE '%view%';
