-- ============================================================================
-- Phase 6: Public Doctor Directory - Database Schema
-- Adds public visibility controls and analytics tracking
-- ============================================================================

-- Add public visibility column to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS public_visible BOOLEAN DEFAULT true;

-- Add index for public queries (public_visible only)
CREATE INDEX IF NOT EXISTS idx_doctors_public_visible 
ON doctors(public_visible) 
WHERE public_visible = true;

-- Add index for location filtering (already exists but recreate for safety)
CREATE INDEX IF NOT EXISTS idx_doctors_location_public 
ON doctors(location) 
WHERE public_visible = true;

-- Add index for speciality filtering
CREATE INDEX IF NOT EXISTS idx_doctors_speciality_public 
ON doctors(speciality) 
WHERE public_visible = true;

-- ============================================================================
-- Directory Analytics Table
-- Tracks public directory views and doctor profile views
-- ============================================================================

CREATE TABLE IF NOT EXISTS directory_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event tracking
  event_type TEXT NOT NULL, -- 'directory_view' | 'doctor_profile_view'
  doctor_id BIGINT REFERENCES doctors(id) ON DELETE CASCADE, -- NULL for directory views
  
  -- Metadata
  user_agent TEXT,
  referrer TEXT,
  ip_address INET, -- Can be NULL for privacy
  
  -- Location data (if available)
  country TEXT,
  city TEXT,
  
  -- Timestamps
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (event_type IN ('directory_view', 'doctor_profile_view'))
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_directory_analytics_event 
ON directory_analytics(event_type, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_directory_analytics_doctor 
ON directory_analytics(doctor_id, viewed_at DESC) 
WHERE doctor_id IS NOT NULL;

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_directory_analytics_date 
ON directory_analytics(viewed_at DESC);

-- ============================================================================
-- Analytics Aggregation View (for performance)
-- Pre-aggregated daily statistics
-- ============================================================================

CREATE OR REPLACE VIEW directory_analytics_daily AS
SELECT 
  DATE(viewed_at) as date,
  event_type,
  doctor_id,
  COUNT(*) as view_count
FROM directory_analytics
GROUP BY DATE(viewed_at), event_type, doctor_id;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get public doctor count
CREATE OR REPLACE FUNCTION get_public_doctor_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM doctors 
    WHERE public_visible = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get total directory views
CREATE OR REPLACE FUNCTION get_directory_views(days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM directory_analytics 
    WHERE event_type = 'directory_view'
    AND viewed_at >= NOW() - (days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get total profile views
CREATE OR REPLACE FUNCTION get_profile_views(days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM directory_analytics 
    WHERE event_type = 'doctor_profile_view'
    AND viewed_at >= NOW() - (days || ' days')::INTERVAL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get most viewed doctors
CREATE OR REPLACE FUNCTION get_most_viewed_doctors(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  doctor_id BIGINT,
  doctor_name TEXT,
  speciality TEXT,
  location TEXT,
  view_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.doctor_name,
    d.speciality,
    d.location,
    COUNT(da.id) as view_count
  FROM doctors d
  INNER JOIN directory_analytics da ON da.doctor_id = d.id
  WHERE da.event_type = 'doctor_profile_view'
  AND da.viewed_at >= NOW() - INTERVAL '30 days'
  GROUP BY d.id, d.doctor_name, d.speciality, d.location
  ORDER BY view_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Update existing doctors to be publicly visible by default
-- ============================================================================

-- Set all doctors as publicly visible by default
UPDATE doctors 
SET public_visible = true 
WHERE public_visible IS NULL;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Check public visibility distribution
SELECT 
  public_visible,
  COUNT(*) as count
FROM doctors
GROUP BY public_visible
ORDER BY public_visible DESC;

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('doctors', 'directory_analytics')
ORDER BY tablename, indexname;

-- Test analytics functions
SELECT 
  'Public Doctors' as metric,
  get_public_doctor_count() as value
UNION ALL
SELECT 
  'Directory Views (30d)',
  get_directory_views(30)
UNION ALL
SELECT 
  'Profile Views (30d)',
  get_profile_views(30);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN doctors.public_visible IS 
'Controls whether doctor appears in public directory. Admin-controlled.';

COMMENT ON TABLE directory_analytics IS 
'Tracks public directory and doctor profile page views for analytics.';

COMMENT ON COLUMN directory_analytics.event_type IS 
'Type of view: directory_view (list page) or doctor_profile_view (detail page).';

COMMENT ON COLUMN directory_analytics.ip_address IS 
'Optional IP address for analytics. Can be NULL for privacy compliance.';

-- ============================================================================
-- Phase 6 Schema Complete
-- ============================================================================

-- Summary
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Phase 6: Public Directory Schema - COMPLETE';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '  - doctors.public_visible column';
  RAISE NOTICE '  - 3 performance indexes on doctors';
  RAISE NOTICE '  - directory_analytics table';
  RAISE NOTICE '  - 3 analytics indexes';
  RAISE NOTICE '  - 4 helper functions';
  RAISE NOTICE '  - 1 aggregation view';
  RAISE NOTICE '=================================================';
END $$;
