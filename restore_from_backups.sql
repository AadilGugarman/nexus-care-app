-- RESTORE FROM BACKUP TABLES: doctors_backup, route_doctors_backup
-- WARNING: This will REPLACE current data in `doctors` and `route_doctors`.
-- Run in Supabase SQL editor or psql. Ensure backups exist (doctors_backup, route_doctors_backup).


-- --  FOR CREATING BACKUPS
--  CREATE TABLE IF NOT EXISTS doctors_backup AS TABLE doctors WITH DATA;
-- -- CREATE TABLE IF NOT EXISTS route_doctors_backup AS TABLE route_doctors WITH DATA;

BEGIN;

-- Validate backups exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='doctors_backup') THEN
    RAISE EXCEPTION 'doctors_backup table not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='route_doctors_backup') THEN
    RAISE EXCEPTION 'route_doctors_backup table not found';
  END IF;
END$$;

-- Truncate referencing table(s) and target tables
TRUNCATE TABLE route_doctors RESTART IDENTITY CASCADE;
TRUNCATE TABLE doctors RESTART IDENTITY CASCADE;

-- Restore doctors
INSERT INTO doctors
SELECT * FROM doctors_backup;

-- Restore route_doctors
INSERT INTO route_doctors
SELECT * FROM route_doctors_backup;

-- Reset sequences to max(id) (safe for serial PKs; skips UUID PKs)
DO $$
DECLARE seq text;
BEGIN
  seq := pg_get_serial_sequence('doctors','id');
  IF seq IS NOT NULL THEN
    EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(id)::bigint FROM doctors), 1), true)', seq);
  END IF;

  seq := pg_get_serial_sequence('route_doctors','id');
  IF seq IS NOT NULL THEN
    EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(id)::bigint FROM route_doctors), 1), true)', seq);
  END IF;
END$$;

-- Quick verification counts
SELECT 'doctors_count' AS what, COUNT(*) AS cnt FROM doctors;
SELECT 'route_doctors_count' AS what, COUNT(*) AS cnt FROM route_doctors;

COMMIT;
