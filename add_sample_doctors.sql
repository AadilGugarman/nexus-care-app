-- ============================================================================
-- Add Sample Doctors for Testing
-- This script adds 15 sample doctors to test the public directory
-- ============================================================================

-- STEP 1: Ensure required columns exist
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS public_visible BOOLEAN DEFAULT true;

-- STEP 2: Insert sample doctors
INSERT INTO doctors (
  doctor_name, 
  location, 
  speciality, 
  qualification, 
  hospital, 
  mobile, 
  address,
  is_active,
  public_visible,
  created_at,
  updated_at
) VALUES
  ('Dr. Rajesh Kumar', 'Mumbai', 'Cardiologist', 'MBBS, MD', 'Apollo Hospital', '9876543210', 'Andheri West, Mumbai', true, true, NOW(), NOW()),
  ('Dr. Priya Sharma', 'Delhi', 'Pediatrician', 'MBBS, DCH', 'Max Hospital', '9876543211', 'Saket, Delhi', true, true, NOW(), NOW()),
  ('Dr. Amit Patel', 'Ahmedabad', 'Orthopedic', 'MBBS, MS (Ortho)', 'Sterling Hospital', '9876543212', 'Gurukul, Ahmedabad', true, true, NOW(), NOW()),
  ('Dr. Sneha Reddy', 'Hyderabad', 'Dermatologist', 'MBBS, MD (Derma)', 'Care Hospital', '9876543213', 'Banjara Hills, Hyderabad', true, true, NOW(), NOW()),
  ('Dr. Vijay Singh', 'Bangalore', 'General Physician', 'MBBS', 'Manipal Hospital', '9876543214', 'Whitefield, Bangalore', true, true, NOW(), NOW()),
  ('Dr. Anjali Mehta', 'Pune', 'Gynecologist', 'MBBS, MS (OBG)', 'Ruby Hall Clinic', '9876543215', 'Koregaon Park, Pune', true, true, NOW(), NOW()),
  ('Dr. Suresh Gupta', 'Chennai', 'Neurologist', 'MBBS, DM (Neuro)', 'Apollo Hospital', '9876543216', 'Greams Road, Chennai', true, true, NOW(), NOW()),
  ('Dr. Kavita Joshi', 'Mumbai', 'Ophthalmologist', 'MBBS, MS (Ophthal)', 'Lilavati Hospital', '9876543217', 'Bandra West, Mumbai', true, true, NOW(), NOW()),
  ('Dr. Rahul Verma', 'Delhi', 'ENT Specialist', 'MBBS, MS (ENT)', 'Fortis Hospital', '9876543218', 'Vasant Kunj, Delhi', true, true, NOW(), NOW()),
  ('Dr. Meera Nair', 'Bangalore', 'Cardiologist', 'MBBS, DM (Cardio)', 'Narayana Health', '9876543219', 'Electronic City, Bangalore', true, true, NOW(), NOW()),
  ('Dr. Arun Kumar', 'Ahmedabad', 'General Surgeon', 'MBBS, MS (Surgery)', 'Civil Hospital', '9876543220', 'Ellis Bridge, Ahmedabad', true, true, NOW(), NOW()),
  ('Dr. Pooja Singh', 'Hyderabad', 'Psychiatrist', 'MBBS, MD (Psychiatry)', 'KIMS Hospital', '9876543221', 'Secunderabad', true, true, NOW(), NOW()),
  ('Dr. Sanjay Desai', 'Pune', 'Dentist', 'BDS, MDS', 'Sahyadri Hospital', '9876543222', 'Deccan, Pune', true, true, NOW(), NOW()),
  ('Dr. Lakshmi Iyer', 'Chennai', 'Pediatrician', 'MBBS, MD (Pediatrics)', 'MIOT Hospital', '9876543223', 'Manapakkam, Chennai', true, true, NOW(), NOW()),
  ('Dr. Karthik Reddy', 'Bangalore', 'Orthopedic', 'MBBS, DNB (Ortho)', 'Columbia Asia', '9876543224', 'Hebbal, Bangalore', true, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- STEP 3: Verify results
SELECT 
  '✅ Success!' as status,
  COUNT(*) as total_doctors,
  COUNT(*) FILTER (WHERE public_visible = true) as public_doctors,
  COUNT(DISTINCT location) as cities,
  COUNT(DISTINCT speciality) as specialities
FROM doctors;

-- STEP 4: Show sample by location
SELECT 
  location,
  COUNT(*) as doctor_count
FROM doctors
WHERE public_visible = true
GROUP BY location
ORDER BY doctor_count DESC;
