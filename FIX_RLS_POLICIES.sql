-- ============================================================================
-- Fix Row Level Security Policies for Public Directory
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "doctors_public_read" ON doctors;

-- Create new policy that allows public read access to active and public_visible doctors
CREATE POLICY "doctors_public_read" ON doctors
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true AND 
    public_visible = true
  );

-- Verify RLS is enabled on doctors table
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'doctors';
