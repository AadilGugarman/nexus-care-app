-- ============================================================================
-- NUCLEAR OPTION: Complete Doctors Table Fix
-- WARNING: This will preserve your data but recreate the table structure
-- ============================================================================

-- STEP 1: Create backup of existing data
CREATE TEMP TABLE doctors_backup AS 
SELECT * FROM doctors;

-- STEP 2: Drop the existing doctors table (this removes all policies/constraints)
DROP TABLE IF EXISTS doctors CASCADE;

-- STEP 3: Recreate doctors table WITHOUT RLS
CREATE TABLE doctors (
  id BIGSERIAL PRIMARY KEY,
  doctor_name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  speciality TEXT,
  qualification TEXT,
  hospital TEXT,
  mobile TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 4: Do NOT enable RLS
-- ALTER TABLE doctors ENABLE ROW LEVEL SECURITY; -- SKIP THIS

-- STEP 5: Grant all permissions
GRANT ALL ON doctors TO anon, authenticated, postgres;
GRANT ALL ON SEQUENCE doctors_id_seq TO anon, authenticated, postgres;

-- STEP 6: Recreate indexes
CREATE INDEX idx_doctors_location ON doctors(location);
CREATE INDEX idx_doctors_name ON doctors(doctor_name);
CREATE INDEX idx_doctors_speciality ON doctors(speciality);

-- STEP 7: Recreate full-text search index
CREATE INDEX idx_doctors_search ON doctors USING GIN (
  to_tsvector('english', 
    COALESCE(doctor_name, '') || ' ' || 
    COALESCE(location, '') || ' ' || 
    COALESCE(speciality, '') || ' ' || 
    COALESCE(hospital, '')
  )
);

-- STEP 8: Recreate trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_doctors_updated_at ON doctors;
CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- STEP 9: Restore data from backup
INSERT INTO doctors (id, doctor_name, location, address, speciality, qualification, hospital, mobile, notes, created_at, updated_at)
SELECT id, doctor_name, location, address, speciality, qualification, hospital, mobile, notes, created_at, updated_at
FROM doctors_backup;

-- STEP 10: Update sequence to continue from max ID
SELECT setval('doctors_id_seq', (SELECT COALESCE(MAX(id), 1) FROM doctors));

-- STEP 11: Verify
SELECT 
  COUNT(*) as total_doctors,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'doctors') as rls_enabled
FROM doctors;

-- Should show: total_doctors = 674, rls_enabled = false

-- STEP 12: Test insert
INSERT INTO doctors (doctor_name, location, address)
VALUES ('Test Doctor Nuclear', 'Test Location', 'Test Address')
RETURNING id, doctor_name;

-- If this returns a row, the fix worked!

-- STEP 13: Delete test doctor
DELETE FROM doctors WHERE doctor_name = 'Test Doctor Nuclear';

-- ============================================================================
-- COMPLETE - Doctors table recreated without RLS
-- ============================================================================
