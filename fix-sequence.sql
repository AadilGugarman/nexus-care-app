-- ============================================================================
-- FIX: Reset doctors ID sequence
-- This fixes the "duplicate key" error by resetting the sequence
-- ============================================================================

-- Check current sequence value
SELECT currval('doctors_id_seq') as current_sequence;

-- Check max ID in doctors table
SELECT MAX(id) as max_doctor_id FROM doctors;

-- Reset sequence to max ID + 1
SELECT setval('doctors_id_seq', (SELECT COALESCE(MAX(id), 0) FROM doctors) + 1, false);

-- Verify new sequence value
SELECT nextval('doctors_id_seq') as next_id_will_be;

-- This should show a number greater than max_doctor_id
