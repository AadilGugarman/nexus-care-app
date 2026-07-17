-- ============================================================================
-- Phase 6: Public Doctor Directory - Fixed for Your Database
-- This version removes all references to is_active column
-- ============================================================================

-- Add public visibility column to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS public_visible BOOLEAN DEFAULT true;

-- Add index for public queries
CREATE INDEX IF NOT EXISTS idx_doctors_public_visible 
ON doctors(public_visible) 
WHERE public_visible = true;

-- Add index for location filtering
CREATE INDEX IF NOT EXISTS idx_doctors_location_public 
ON doctors(location) 
WHERE public_visible = true;

-- Add index for speciality filtering
CREATE INDEX IF NOT EXISTS idx_doctors_speciality_public 
ON doctors(speciality) 
WHERE public_visible = true;

-- ============================================================================
-- Directory Analytics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS directory_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  doctor_id BIGINT REFERENCES doctors(id) ON DELETE CASCADE,
  user_agent TEXT,
  referrer TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (event_type IN ('directory_view', 'doctor_profile_view'))
);

CREATE INDEX IF NOT EXISTS idx_directory_analytics_event 
ON directory_analytics(event_type, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_directory_analytics_doctor 
ON directory_analytics(doctor_id, viewed_at DESC) 
WHERE doctor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_directory_analytics_date 
ON directory_analytics(viewed_at DESC);

-- ============================================================================
-- Helper Functions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_public_doctor_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM doctors WHERE public_visible = true);
END;
$$ LANGUAGE plpgsql STABLE;

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

-- ============================================================================
-- Update existing doctors
-- ============================================================================

UPDATE doctors 
SET public_visible = true 
WHERE public_visible IS NULL;

-- ============================================================================
-- Verification
-- ============================================================================

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
  RAISE NOTICE '  - 3 helper functions';
  RAISE NOTICE '=================================================';
END $$;
