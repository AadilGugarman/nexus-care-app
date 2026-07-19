-- ============================================================================
-- Migration 004: Prevent Manual ID Assignment (Optional)
-- ============================================================================
-- Purpose: Ensure all new doctors get auto-generated sequential IDs
--          This prevents future gaps from being created
-- ============================================================================

-- Create a trigger to prevent manual ID insertion
-- This ensures the sequence is always used
CREATE OR REPLACE FUNCTION prevent_manual_doctor_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If an ID is manually provided in INSERT
  IF TG_OP = 'INSERT' AND NEW.id IS NOT NULL THEN
    RAISE EXCEPTION 'Manual doctor ID assignment is not allowed. IDs are auto-generated.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Commented out by default - only enable if you want to enforce auto IDs
-- DROP TRIGGER IF EXISTS trigger_prevent_manual_doctor_id ON doctors;
-- CREATE TRIGGER trigger_prevent_manual_doctor_id
--   BEFORE INSERT ON doctors
--   FOR EACH ROW
--   EXECUTE FUNCTION prevent_manual_doctor_id();

-- ============================================================================
-- NOTE: This trigger is DISABLED by default
-- ============================================================================
-- Uncomment the CREATE TRIGGER lines above to enable strict auto-ID mode
-- 
-- WARNING: This will prevent seeding with predefined IDs!
-- Only enable this AFTER your initial seed is complete.
-- ============================================================================

-- ============================================================================
-- ALTERNATIVE: Just document the practice
-- ============================================================================
-- Keep using auto-generated IDs going forward
-- The gaps from seed data are fine and don't affect performance
-- ============================================================================
