-- ============================================================================
-- FIX ADMIN REVIEWS PAGE - COMPLETE FIX
-- ============================================================================
-- Run this in Supabase SQL Editor to fix all review page errors
-- ============================================================================

-- 1. Grant permissions on all tables
GRANT ALL ON directory_analytics TO authenticated, anon, postgres;
GRANT ALL ON doctor_creation_requests TO authenticated, anon, postgres;
GRANT ALL ON doctor_change_requests TO authenticated, anon, postgres;
GRANT ALL ON doctor_status_requests TO authenticated, anon, postgres;

-- 2. Grant permissions on all RPC functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 3. Check if foreign key constraints exist properly
-- For doctor_change_requests
DO $$
BEGIN
    -- Check if the foreign key exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'doctor_change_requests_doctor_id_fkey'
        AND table_name = 'doctor_change_requests'
    ) THEN
        -- Add foreign key if it doesn't exist
        ALTER TABLE doctor_change_requests 
        ADD CONSTRAINT doctor_change_requests_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES doctors(id);
    END IF;
END $$;

-- For doctor_status_requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'doctor_status_requests_doctor_id_fkey'
        AND table_name = 'doctor_status_requests'
    ) THEN
        ALTER TABLE doctor_status_requests 
        ADD CONSTRAINT doctor_status_requests_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES doctors(id);
    END IF;
END $$;

-- 4. Verify doctors table has correct columns
-- Check and add doctor_name if it doesn't exist (it should exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' AND column_name = 'doctor_name'
    ) THEN
        -- If doctor_name doesn't exist but 'name' does, rename it
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'doctors' AND column_name = 'name'
        ) THEN
            ALTER TABLE doctors RENAME COLUMN name TO doctor_name;
        END IF;
    END IF;
END $$;

-- 5. Check is_active column exists in doctors table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'doctors' AND column_name = 'is_active'
    ) THEN
        -- Add is_active column if it doesn't exist
        ALTER TABLE doctors ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Update existing records
        UPDATE doctors SET is_active = true WHERE is_active IS NULL;
    END IF;
END $$;

-- 6. Verify table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('doctors', 'doctor_creation_requests', 'doctor_change_requests', 'doctor_status_requests')
AND column_name IN ('id', 'doctor_name', 'name', 'doctor_id', 'is_active')
ORDER BY table_name, ordinal_position;

-- 7. Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('doctor_change_requests', 'doctor_status_requests');

-- 8. Grant final permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Success message
SELECT 'All permissions granted and tables verified!' as status;
