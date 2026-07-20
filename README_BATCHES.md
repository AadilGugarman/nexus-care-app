Batch import README - how to add doctors safely

Goal

- Provide a short, repeatable workflow to add doctors without duplicates and with consistent location names.

Files

- `canonicalize.sql` — create the `canonicalize_location(text)` helper. Run once per DB.
- `batch_template.sql` — template to import a batch (replace VALUES or use COPY). Uses `canonicalize_location` and deterministic dedup.
- `restore_from_backups.sql` — restore backups (keep this safe).
- `sql_cleanup_note.txt` — note of deleted intermediate scripts.

Recommended workflow

1. Verify backups exist (you already have `doctors_backup`, `route_doctors_backup`).
   - Optionally run `restore_from_backups.sql` to test restore in a dev DB.

2. Create the canonicalize helper (run once):
   - Execute `canonicalize.sql` in Supabase SQL editor or via psql.

3. Prepare your batch file using `batch_template.sql`:
   - Copy `batch_template.sql` to `my_batch_YYYYMMDD.sql`.
   - Replace the VALUES(...) block with your rows or use `COPY` to load CSV into `temp_doctors_batch`.

4. Dry-run (preview) — recommended:
   - Open a transaction and run the batch inside it, then `ROLLBACK`.
   - Example (psql):

```bash
psql <connection-string> -f canonicalize.sql
psql <connection-string> -c "BEGIN;" -f my_batch_YYYYMMDD.sql -c "ROLLBACK;"
```

5. Apply for real:
   - Run the batch without wrapping in ROLLBACK (or `COMMIT` after the `BEGIN`).

6. Verify results:
   - Counts: `SELECT COUNT(*) FROM doctors;`
   - Recent changes: run the summary queries at the end of `batch_template.sql` (they show inserted/updated rows by timestamps)
   - Spot check names and locations: `SELECT * FROM doctors WHERE canonicalize_location(location) = 'Anand' ORDER BY doctor_name LIMIT 50;`

7. If something goes wrong: run `restore_from_backups.sql` to revert to backups.

Tips

- Always run `canonicalize.sql` first to make location matching deterministic.
- Use the dry-run method before applying to production.
- Keep one `restore_from_backups.sql` and always make fresh backups before large imports.
- Keep batch files in a separate folder (e.g., `batches/`) and remove intermediate temp SQL files after successful runs (or archive them).

If you want, I can:

- Add a `batches/` folder and move `sql_cleanup_note.txt` there.
- Create a small PowerShell script to run dry-runs and applies.
