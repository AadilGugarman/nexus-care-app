-- batch_template.sql
-- Metadata (edit):
-- Author: your-name
-- Date: YYYY-MM-DD
-- Purpose: Safe, idempotent batch import of doctors from VALUES or CSV.
-- Instructions: 1) Run `canonicalize.sql` once to create the helper function. 2) Replace the VALUES(...) block below with your rows or use COPY/STDIN to populate `temp_doctors_batch`.
-- Dry-run tip: Wrap the whole file in a transaction and ROLLBACK to preview changes.

-- Create temp table with incoming rows
CREATE TEMP TABLE temp_doctors_batch (
  doctor_name text,
  location text,
  speciality text,
  qualification text,
  hospital text,
  mobile text,
  address text
);

-- Populate: replace the VALUES below or use COPY FROM STDIN
INSERT INTO temp_doctors_batch (doctor_name, location, speciality, qualification, hospital, mobile, address)
VALUES
  -- ('Dr. Name','Location','Speciality','Qualification','Hospital','Mobile','Address'),
  ('Example Doctor','Anand','Physician','MBBS',NULL,NULL,'Sample address');

-- Deduplicate input deterministically: prefer rows with non-null fields
CREATE TEMP TABLE temp_doctors_batch_dedup AS
SELECT DISTINCT ON (lower(trim(doctor_name)), canonical_loc)
  doctor_name,
  canonical_loc AS location,
  speciality,
  qualification,
  hospital,
  mobile,
  address
FROM (
  SELECT td.*, canonicalize_location(td.location) AS canonical_loc
  FROM temp_doctors_batch td
) s
ORDER BY lower(trim(doctor_name)), canonical_loc,
  (speciality IS NULL), (qualification IS NULL), (hospital IS NULL), (mobile IS NULL), (address IS NULL);

-- INSERT new doctors only when not already present (ignoring soft-deleted rows)
INSERT INTO doctors (
  doctor_name, location, speciality, qualification, hospital, mobile, address, is_active, public_visible
)
SELECT
  trim(td.doctor_name),
  td.location,
  td.speciality,
  td.qualification,
  td.hospital,
  td.mobile,
  td.address,
  true, true
FROM temp_doctors_batch_dedup td
WHERE NULLIF(trim(td.doctor_name), '') IS NOT NULL
  AND NULLIF(trim(td.location), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM doctors d
    WHERE lower(trim(d.doctor_name)) = lower(trim(td.doctor_name))
      AND canonicalize_location(d.location) = canonicalize_location(td.location)
      AND NOT EXISTS (SELECT 1 FROM deleted_doctors dd WHERE dd.doctor_id = d.id)
  );

-- UPDATE existing doctors: fill only null/empty target fields
UPDATE doctors d
SET
  speciality = COALESCE(NULLIF(d.speciality, ''), td.speciality),
  qualification = COALESCE(NULLIF(d.qualification, ''), td.qualification),
  hospital = COALESCE(NULLIF(d.hospital, ''), td.hospital),
  mobile = COALESCE(NULLIF(d.mobile, ''), td.mobile),
  address = COALESCE(NULLIF(d.address, ''), td.address),
  updated_at = NOW()
FROM temp_doctors_batch_dedup td
WHERE lower(trim(d.doctor_name)) = lower(trim(td.doctor_name))
  AND canonicalize_location(d.location) = canonicalize_location(td.location)
  AND NOT EXISTS (SELECT 1 FROM deleted_doctors dd WHERE dd.doctor_id = d.id);

-- Summary (run after apply)
SELECT 'batch_preview' AS stage, COUNT(*) AS rows_in_input FROM temp_doctors_batch;
SELECT 'deduped_input' AS stage, COUNT(*) AS rows FROM temp_doctors_batch_dedup;

-- Cleanup
DROP TABLE IF EXISTS temp_doctors_batch_dedup;
DROP TABLE IF EXISTS temp_doctors_batch;
