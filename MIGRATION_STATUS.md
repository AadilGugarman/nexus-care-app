# Database Migration Status

## Required Migrations

To ensure all features work correctly, run these SQL migrations in order:

### Phase 6: Public Directory (Required for /directory)
**File:** `phase6-public-directory-schema.sql`

**What it does:**
- Adds `public_visible` column to `doctors` table
- Creates `directory_analytics` table
- Creates indexes and functions

**Run:**
```bash
psql -h [host] -U postgres -d postgres -f phase6-public-directory-schema.sql
```

**Check if needed:**
```sql
-- Check if public_visible column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'doctors' 
AND column_name = 'public_visible';

-- Should return: public_visible
-- If no results: Migration needed
```

---

### Phase 7: Notifications (Required for /notifications)
**File:** `phase7-notifications-schema.sql`

**What it does:**
- Creates `notifications` table
- Creates triggers for auto-notifications
- Creates helper functions

**Run:**
```bash
psql -h [host] -U postgres -d postgres -f phase7-notifications-schema.sql
```

**Check if needed:**
```sql
-- Check if notifications table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'notifications';

-- Should return: notifications
-- If no results: Migration needed
```

---

## Migration Order

1. **Phase 4:** Doctor requests (already done if /admin/reviews works)
2. **Phase 6:** Public directory
3. **Phase 7:** Notifications

## Verification Script

Run this SQL to check all migrations:

```sql
-- Check Phase 4: Request tables
SELECT 'Phase 4' as phase, 
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_creation_requests') as completed;

-- Check Phase 6: Public directory
SELECT 'Phase 6' as phase,
       EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'public_visible') as completed;

-- Check Phase 7: Notifications
SELECT 'Phase 7' as phase,
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') as completed;
```

**Expected output:**
```
 phase   | completed
---------+-----------
 Phase 4 | t
 Phase 6 | t
 Phase 7 | t
```

If any show `f` (false), run that phase's migration.

---

## Troubleshooting

### Error: "column doctors.public_visible does not exist"
**Solution:** Run `phase6-public-directory-schema.sql`

### Error: "relation notifications does not exist"
**Solution:** Run `phase7-notifications-schema.sql`

### Error: "Failed to load directory"
**Solution:** 
1. Check if Phase 6 migration is complete
2. Verify doctors table has data: `SELECT COUNT(*) FROM doctors;`
3. Check browser console for detailed error

---

## Quick Setup (Fresh Database)

If starting fresh, run all migrations in order:

```bash
# Phase 4: Doctor requests
psql -h [host] -U postgres -d postgres -f phase4-doctor-requests-schema.sql

# Phase 6: Public directory
psql -h [host] -U postgres -d postgres -f phase6-public-directory-schema.sql

# Phase 7: Notifications
psql -h [host] -U postgres -d postgres -f phase7-notifications-schema.sql
```

Then verify:
```sql
-- Should return 3 rows, all with completed = t
SELECT 'Phase 4' as phase, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'doctor_creation_requests') as completed
UNION ALL
SELECT 'Phase 6', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'doctors' AND column_name = 'public_visible')
UNION ALL
SELECT 'Phase 7', EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications');
```

---

## Current Issue

The error "Error loading directory: {}" indicates **Phase 6 migration is missing**.

**Fix:**
1. Run `phase6-public-directory-schema.sql`
2. Refresh the browser
3. Directory should load successfully

**After migration, you should see:**
- 674+ doctors in directory
- Search and filter working
- Doctor profiles accessible
