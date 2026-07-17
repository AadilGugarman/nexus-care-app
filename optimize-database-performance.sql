-- ============================================================================
-- DATABASE PERFORMANCE OPTIMIZATION - SAFE VERSION
-- ============================================================================
-- Run this in Supabase SQL Editor to speed up ALL queries
-- Only creates indexes for tables that exist
-- ============================================================================

-- 1. Add indexes on frequently queried columns (SAFE)
-- ============================================================================

-- Doctors table indexes (CRITICAL - Most used table)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctors') THEN
        CREATE INDEX IF NOT EXISTS idx_doctors_location ON doctors(location);
        CREATE INDEX IF NOT EXISTS idx_doctors_speciality ON doctors(speciality);
        CREATE INDEX IF NOT EXISTS idx_doctors_created_at ON doctors(created_at DESC);
        
        -- Only if column exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'public_visible') THEN
            CREATE INDEX IF NOT EXISTS idx_doctors_public_visible ON doctors(public_visible);
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'is_active') THEN
            CREATE INDEX IF NOT EXISTS idx_doctors_is_active ON doctors(is_active);
        END IF;
        
        RAISE NOTICE 'Doctors table indexes created';
    END IF;
END $$;

-- Visits table indexes (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visits') THEN
        CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON visits(doctor_id);
        CREATE INDEX IF NOT EXISTS idx_visits_user_id ON visits(user_id);
        CREATE INDEX IF NOT EXISTS idx_visits_visit_date ON visits(visit_date DESC);
        CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
        RAISE NOTICE 'Visits table indexes created';
    END IF;
END $$;

-- Routes table indexes (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes') THEN
        CREATE INDEX IF NOT EXISTS idx_routes_user_id ON routes(user_id);
        CREATE INDEX IF NOT EXISTS idx_routes_location ON routes(location);
        RAISE NOTICE 'Routes table indexes created';
    END IF;
END $$;

-- Doctor Days table indexes (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_days') THEN
        CREATE INDEX IF NOT EXISTS idx_doctor_days_doctor_id ON doctor_days(doctor_id);
        CREATE INDEX IF NOT EXISTS idx_doctor_days_user_id ON doctor_days(user_id);
        CREATE INDEX IF NOT EXISTS idx_doctor_days_day_of_week ON doctor_days(day_of_week);
        RAISE NOTICE 'Doctor days table indexes created';
    END IF;
END $$;

-- Profiles table indexes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
        CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
        RAISE NOTICE 'Profiles table indexes created';
    END IF;
END $$;

-- Request tables indexes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_creation_requests') THEN
        CREATE INDEX IF NOT EXISTS idx_creation_requests_status ON doctor_creation_requests(status);
        CREATE INDEX IF NOT EXISTS idx_creation_requests_requested_by ON doctor_creation_requests(requested_by);
        RAISE NOTICE 'Doctor creation requests indexes created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_change_requests') THEN
        CREATE INDEX IF NOT EXISTS idx_change_requests_status ON doctor_change_requests(status);
        CREATE INDEX IF NOT EXISTS idx_change_requests_doctor_id ON doctor_change_requests(doctor_id);
        RAISE NOTICE 'Doctor change requests indexes created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_status_requests') THEN
        CREATE INDEX IF NOT EXISTS idx_status_requests_status ON doctor_status_requests(status);
        CREATE INDEX IF NOT EXISTS idx_status_requests_doctor_id ON doctor_status_requests(doctor_id);
        RAISE NOTICE 'Doctor status requests indexes created';
    END IF;
END $$;

-- Directory analytics indexes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'directory_analytics') THEN
        CREATE INDEX IF NOT EXISTS idx_directory_analytics_doctor_id ON directory_analytics(doctor_id);
        CREATE INDEX IF NOT EXISTS idx_directory_analytics_event_type ON directory_analytics(event_type);
        CREATE INDEX IF NOT EXISTS idx_directory_analytics_viewed_at ON directory_analytics(viewed_at DESC);
        RAISE NOTICE 'Directory analytics indexes created';
    END IF;
END $$;

-- Notifications indexes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
        RAISE NOTICE 'Notifications indexes created';
    END IF;
END $$;

-- 2. Analyze existing tables to update statistics
-- ============================================================================
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE 'ANALYZE ' || quote_ident(tbl);
        RAISE NOTICE 'Analyzed table: %', tbl;
    END LOOP;
END $$;

-- 3. Create materialized view for dashboard stats (only if tables exist)
-- ============================================================================
DO $$
BEGIN
    -- Drop existing view if it exists
    DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_stats CASCADE;
    
    -- Create new materialized view
    EXECUTE '
    CREATE MATERIALIZED VIEW mv_dashboard_stats AS
    SELECT 
        (SELECT COUNT(*) FROM doctors) as total_doctors,
        (SELECT COUNT(DISTINCT location) FROM doctors) as total_locations,
        ' || 
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes') 
             THEN '(SELECT COUNT(*) FROM routes)'
             ELSE '0'
        END || ' as total_routes,
        ' ||
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visits') 
             THEN '(SELECT COUNT(*) FROM visits)'
             ELSE '0'
        END || ' as total_visits,
        (SELECT COUNT(*) FROM doctors WHERE public_visible = true) as public_doctors,
        ' ||
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_creation_requests') 
             THEN '(SELECT COUNT(*) FROM doctor_creation_requests WHERE status = ''pending'')'
             ELSE '0'
        END || ' as pending_creation,
        ' ||
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_change_requests') 
             THEN '(SELECT COUNT(*) FROM doctor_change_requests WHERE status = ''pending'')'
             ELSE '0'
        END || ' as pending_changes,
        ' ||
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_status_requests') 
             THEN '(SELECT COUNT(*) FROM doctor_status_requests WHERE status = ''pending'')'
             ELSE '0'
        END || ' as pending_status
    ';
    
    -- Create index
    CREATE UNIQUE INDEX idx_mv_dashboard_stats ON mv_dashboard_stats ((1));
    
    RAISE NOTICE 'Materialized view created successfully';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create materialized view: %', SQLERRM;
END $$;

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not refresh materialized view: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 4. Create optimized function for public directory
-- ============================================================================
CREATE OR REPLACE FUNCTION get_public_directory(
    p_location TEXT DEFAULT NULL,
    p_speciality TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_limit INT DEFAULT 50,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id INT,
    doctor_name TEXT,
    location TEXT,
    speciality TEXT,
    qualification TEXT,
    hospital TEXT,
    mobile TEXT,
    address TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.doctor_name,
        d.location,
        d.speciality,
        d.qualification,
        d.hospital,
        d.mobile,
        d.address
    FROM doctors d
    WHERE d.public_visible = true
    AND (p_location IS NULL OR d.location = p_location)
    AND (p_speciality IS NULL OR d.speciality = p_speciality)
    AND (p_search IS NULL OR d.doctor_name ILIKE '%' || p_search || '%')
    ORDER BY d.doctor_name
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Grant permissions on new functions
-- ============================================================================
GRANT EXECUTE ON FUNCTION refresh_dashboard_stats TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_public_directory TO authenticated, anon;
GRANT SELECT ON mv_dashboard_stats TO authenticated, anon;

-- 6. Initial refresh of materialized view
-- ============================================================================
DO $$
BEGIN
    PERFORM refresh_dashboard_stats();
    RAISE NOTICE 'Materialized view refreshed successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not refresh view: %', SQLERRM;
END $$;

-- 7. Show created indexes
-- ============================================================================
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('doctors', 'profiles', 'doctor_creation_requests', 
                  'doctor_change_requests', 'doctor_status_requests', 
                  'directory_analytics', 'notifications')
ORDER BY tablename, indexname;

-- Success message
SELECT 'Database optimized! Indexes created for existing tables.' as status,
       COUNT(*) as indexes_created
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';
