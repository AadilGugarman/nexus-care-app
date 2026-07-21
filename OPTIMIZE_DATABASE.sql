-- ============================================================================
-- Database Optimization for Super Fast Loading
-- ============================================================================

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_doctors_public_active 
  ON doctors(public_visible, is_active) 
  WHERE public_visible = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_doctors_location 
  ON doctors(location) 
  WHERE public_visible = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_doctors_speciality 
  ON doctors(speciality) 
  WHERE public_visible = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_doctors_name 
  ON doctors(doctor_name) 
  WHERE public_visible = true AND is_active = true;

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_doctors_location_speciality 
  ON doctors(location, speciality) 
  WHERE public_visible = true AND is_active = true;

-- Analyze table to update statistics for query planner
ANALYZE doctors;

-- Verify indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'doctors'
ORDER BY indexname;
