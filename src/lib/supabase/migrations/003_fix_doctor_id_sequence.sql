-- ============================================================================
-- Migration 003: Fix Doctor ID Sequence
-- ============================================================================
-- Purpose: Ensure the auto-increment sequence is properly set after seeding
--          with manual IDs to prevent ID conflicts
-- ============================================================================

-- Create a function to reset the doctors ID sequence
-- This ensures new doctors get IDs starting after the highest existing ID
CREATE OR REPLACE FUNCTION reset_doctors_sequence()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_id bigint;
  next_id bigint;
BEGIN
  -- Get the maximum ID currently in the doctors table
  SELECT COALESCE(MAX(id), 0) INTO max_id FROM doctors;
  
  -- Set the sequence to start from max_id + 1
  -- pg_get_serial_sequence gets the sequence name for the id column
  PERFORM setval(
    pg_get_serial_sequence('doctors', 'id'),
    max_id,
    true  -- true means next value will be max_id + 1
  );
  
  -- Return the next ID that will be used
  next_id := max_id + 1;
  
  RAISE NOTICE 'Doctor ID sequence reset. Next ID will be: %', next_id;
  
  RETURN next_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_doctors_sequence() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_doctors_sequence() TO anon;

-- Run the function immediately to fix any existing issues
SELECT reset_doctors_sequence();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this migration, verify the sequence is set correctly:
-- 
-- SELECT last_value FROM doctors_id_seq;
-- 
-- It should return the highest doctor ID in your database.
-- ============================================================================

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To rollback this migration:
-- DROP FUNCTION IF EXISTS reset_doctors_sequence();
-- ============================================================================
