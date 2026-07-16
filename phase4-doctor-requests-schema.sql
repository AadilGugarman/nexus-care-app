-- ============================================================================
-- Phase 4: Doctor Contribution & Approval System
-- Database Schema for Request Tables
-- ============================================================================

-- ============================================================================
-- 1. Doctor Creation Requests
-- MRs can submit new doctor data for admin approval
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_creation_requests (
  id SERIAL PRIMARY KEY,
  
  -- Request metadata
  requested_by UUID NOT NULL REFERENCES profiles(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  
  -- Proposed doctor data (matching actual doctors table structure)
  name TEXT NOT NULL,                    -- maps to doctor_name
  location TEXT,                         -- maps to location
  address TEXT,                          -- maps to address
  speciality TEXT,                       -- maps to speciality (not specialty!)
  qualification TEXT,                    -- maps to qualification
  hospital TEXT,                         -- maps to hospital (not hospital_affiliation!)
  mobile TEXT,                           -- maps to mobile (not contact_number!)
  notes TEXT,                            -- maps to notes
  
  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Result tracking
  created_doctor_id INTEGER REFERENCES doctors(id) ON DELETE SET NULL
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_doctor_creation_requests_status ON doctor_creation_requests(status);
CREATE INDEX IF NOT EXISTS idx_doctor_creation_requests_requested_by ON doctor_creation_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_doctor_creation_requests_created_at ON doctor_creation_requests(created_at DESC);

-- ============================================================================
-- 2. Doctor Update Requests
-- MRs can suggest edits to existing doctors
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_change_requests (
  id SERIAL PRIMARY KEY,
  
  -- Request metadata
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  
  -- Changed fields tracking (JSON object with field: {old, new} structure)
  changes JSONB NOT NULL,
  
  -- Example changes structure:
  -- {
  --   "specialty": {"old": "Cardiologist", "new": "Cardiac Surgeon"},
  --   "contact_number": {"old": "123-456", "new": "789-012"}
  -- }
  
  -- MR's reason for change
  change_reason TEXT,
  
  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_doctor_change_requests_doctor_id ON doctor_change_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_change_requests_status ON doctor_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_doctor_change_requests_requested_by ON doctor_change_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_doctor_change_requests_created_at ON doctor_change_requests(created_at DESC);

-- ============================================================================
-- 3. Doctor Inactive Status Requests
-- MRs can request to mark doctors as inactive (soft delete)
-- ============================================================================

CREATE TABLE IF NOT EXISTS doctor_status_requests (
  id SERIAL PRIMARY KEY,
  
  -- Request metadata
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  
  -- Request details
  request_type TEXT NOT NULL CHECK (request_type IN ('mark_inactive', 'mark_active')),
  reason TEXT NOT NULL,
  
  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_doctor_status_requests_doctor_id ON doctor_status_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_status_requests_status ON doctor_status_requests(status);
CREATE INDEX IF NOT EXISTS idx_doctor_status_requests_requested_by ON doctor_status_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_doctor_status_requests_created_at ON doctor_status_requests(created_at DESC);

-- ============================================================================
-- Add is_active column to doctors table if not exists
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'doctors' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE doctors ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    CREATE INDEX idx_doctors_is_active ON doctors(is_active);
  END IF;
END $$;

-- ============================================================================
-- Triggers for updated_at timestamp
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each request table
DROP TRIGGER IF EXISTS update_doctor_creation_requests_updated_at ON doctor_creation_requests;
CREATE TRIGGER update_doctor_creation_requests_updated_at
  BEFORE UPDATE ON doctor_creation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_change_requests_updated_at ON doctor_change_requests;
CREATE TRIGGER update_doctor_change_requests_updated_at
  BEFORE UPDATE ON doctor_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_doctor_status_requests_updated_at ON doctor_status_requests;
CREATE TRIGGER update_doctor_status_requests_updated_at
  BEFORE UPDATE ON doctor_status_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE doctor_creation_requests IS 'Stores requests from MRs to create new doctors in the master database';
COMMENT ON TABLE doctor_change_requests IS 'Stores requests from MRs to update existing doctor information';
COMMENT ON TABLE doctor_status_requests IS 'Stores requests from MRs to change doctor active/inactive status';

COMMENT ON COLUMN doctor_change_requests.changes IS 'JSON object storing field changes with old and new values';
COMMENT ON COLUMN doctor_creation_requests.created_doctor_id IS 'References the doctor record created if request was approved';

-- ============================================================================
-- RLS Policies (DISABLED for Phase 4)
-- ============================================================================

-- Disable RLS as per requirements
ALTER TABLE doctor_creation_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_change_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_status_requests DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'doctor_creation_requests',
  'doctor_change_requests', 
  'doctor_status_requests'
)
ORDER BY table_name;

-- Check is_active column added to doctors
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'doctors' AND column_name = 'is_active';
