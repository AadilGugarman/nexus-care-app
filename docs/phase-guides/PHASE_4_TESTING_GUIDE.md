# Phase 4: Doctor Contribution & Approval System - Testing Guide

## Overview

Phase 4 adds a request/approval workflow where MRs can submit doctor changes for admin approval instead of directly modifying master data.

---

## Setup Instructions

### Step 1: Run the Database Schema

Run the SQL script to create the three new request tables:

```bash
# Open Supabase SQL Editor and run:
phase4-doctor-requests-schema.sql
```

This creates:
- `doctor_creation_requests` - New doctor submissions
- `doctor_change_requests` - Updates to existing doctors  
- `doctor_status_requests` - Active/inactive status changes
- Adds `is_active` column to `doctors` table

**Verify tables created:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%request%'
ORDER BY table_name;

-- Should show:
-- doctor_change_requests
-- doctor_creation_requests
-- doctor_status_requests
```

---

## Test Scenarios

### ✅ Test 1: Admin Reviews Page (No Requests Yet)

**Expected:** Empty state showing zero pending requests

1. Start dev server: `npm run dev`
2. Login as admin: `admin@test.com`
3. Navigate to `/admin/reviews`
4. **Verify:**
   - ✓ Page loads successfully
   - ✓ Statistics show: 0 Pending Review, 0 New Doctors, 0 Updates, 0 Status Changes
   - ✓ Three tabs visible: "New Doctors", "Updates", "Status Changes"
   - ✓ Filter buttons: All, Pending, Approved, Rejected
   - ✓ Empty state message: "No pending requests found"

---

### ✅ Test 2: MR Submits New Doctor Request

**Expected:** MR can submit, but cannot directly create doctor

1. Login as MR: `mr@test.com`
2. **Manually test the form component:**
   - The form components are ready in `src/components/doctor-requests/DoctorRequestForms.tsx`
   - For now, test via database insert:

```sql
-- Insert test request as MR user
INSERT INTO doctor_creation_requests (
  name,
  location,
  speciality,
  qualification,
  hospital,
  mobile,
  address,
  notes,
  requested_by,
  status
) VALUES (
  'Dr. Test Kumar',
  'Mumbai',
  'Cardiologist',
  'MD, MBBS',
  'City Hospital',
  '+91 98765 43210',
  '123 Medical Plaza',
  'Test doctor from MR',
  (SELECT id FROM auth.users WHERE email = 'mr@test.com'),
  'pending'
);
```

3. **Verify in Admin Panel:**
   - Login as admin
   - Go to `/admin/reviews`
   - **Should see:**
     - ✓ Statistics: 1 Pending Review, 1 New Doctor
     - ✓ Request card showing:
       - Status badge: PENDING (yellow)
       - Doctor name: Dr. Test Kumar
       - Requested by: MR User
       - Timestamp
     - ✓ Click expand (chevron down)
     - ✓ Shows all doctor details (name, location, specialty, etc.)
     - ✓ Two action buttons: "Approve" (green) and "Reject" (red)

---

### ✅ Test 3: Admin Approves New Doctor Request

**Expected:** Doctor created in master database, request marked approved

1. Stay logged in as admin at `/admin/reviews`
2. Find the pending "Dr. Test Kumar" request
3. Expand the request card
4. Click "Approve" button
5. **Modal appears:**
   - Title: "Approve Request"
   - Admin Notes field (optional)
   - "Approve" button (green)
   - "Cancel" button
6. Add notes: "Approved - verified details"
7. Click "Approve"
8. **Verify:**
   - ✓ Request disappears from pending list
   - ✓ Statistics updated: 0 Pending, 1 Approved (in "Approved" filter)
   - ✓ Doctor created in database

```sql
-- Verify doctor created
SELECT * FROM doctors 
WHERE doctor_name = 'Dr. Test Kumar';

-- Verify request marked approved
SELECT status, reviewed_by, admin_notes, created_doctor_id
FROM doctor_creation_requests
WHERE name = 'Dr. Test Kumar';
```

9. Go to `/admin/doctors` or main doctors list
10. **Verify:** Dr. Test Kumar appears in the list

---

### ✅ Test 4: Admin Rejects New Doctor Request

**Expected:** Doctor NOT created, request marked rejected with notes

1. Insert another test request:

```sql
INSERT INTO doctor_creation_requests (
  name,
  location,
  requested_by,
  status
) VALUES (
  'Dr. Invalid Name',
  'Unknown Location',
  (SELECT id FROM auth.users WHERE email = 'mr@test.com'),
  'pending'
);
```

2. Login as admin, go to `/admin/reviews`
3. Find "Dr. Invalid Name" request
4. Click "Reject" button
5. **Modal appears** - Admin Notes required for rejection
6. Add notes: "Rejected - incomplete information"
7. Click "Reject"
8. **Verify:**
   - ✓ Request disappears from pending
   - ✓ Statistics: 0 Pending, 1 Rejected
   - ✓ Switch to "Rejected" filter
   - ✓ Request shows with red REJECTED badge
   - ✓ Admin notes visible
   - ✓ Doctor NOT created in database

```sql
-- Verify NOT created
SELECT COUNT(*) FROM doctors WHERE doctor_name = 'Dr. Invalid Name';
-- Should return 0

-- Verify marked rejected
SELECT status, admin_notes FROM doctor_creation_requests
WHERE name = 'Dr. Invalid Name';
-- status = 'rejected', admin_notes = 'Rejected - incomplete information'
```

---

### ✅ Test 5: MR Submits Doctor Update Request

**Expected:** MR can suggest changes, but cannot directly modify

1. Pick an existing doctor from database:

```sql
SELECT id, doctor_name, speciality, hospital 
FROM doctors 
WHERE is_active = true 
LIMIT 1;
```

2. Insert change request:

```sql
-- Example: Change specialty and hospital
INSERT INTO doctor_change_requests (
  doctor_id,
  changes,
  change_reason,
  requested_by,
  status
) VALUES (
  1, -- Use actual doctor ID from query above
  '{
    "speciality": {"old": "Cardiologist", "new": "Cardiac Surgeon"},
    "hospital": {"old": "City Hospital", "new": "Metro Medical Center"}
  }'::jsonb,
  'Doctor changed specialization and moved to new hospital',
  (SELECT id FROM auth.users WHERE email = 'mr@test.com'),
  'pending'
);
```

3. Login as admin, go to `/admin/reviews`
4. Click "Updates" tab
5. **Verify:**
   - ✓ Shows 1 pending update request
   - ✓ Displays doctor name
   - ✓ Expand shows:
     - Change reason
     - Old vs New values (red strikethrough → green)
     - Field names (Speciality, Hospital)

---

### ✅ Test 6: Admin Approves Update Request

**Expected:** Changes applied to doctor record

1. In `/admin/reviews` → Updates tab
2. Find the pending change request
3. Review the proposed changes
4. Click "Approve"
5. Add notes (optional): "Verified with doctor directly"
6. Click "Approve"
7. **Verify:**
   - ✓ Request marked approved
   - ✓ Doctor record updated in database

```sql
-- Verify changes applied
SELECT doctor_name, speciality, hospital 
FROM doctors 
WHERE id = 1; -- Use actual ID

-- Should show NEW values (Cardiac Surgeon, Metro Medical Center)

-- Verify request approved
SELECT status, admin_notes FROM doctor_change_requests
WHERE doctor_id = 1;
```

---

### ✅ Test 7: MR Submits Inactive Status Request

**Expected:** MR can request doctor be marked inactive

1. Insert status change request:

```sql
INSERT INTO doctor_status_requests (
  doctor_id,
  request_type,
  reason,
  requested_by,
  status
) VALUES (
  1, -- Use actual doctor ID
  'mark_inactive',
  'Doctor has retired from practice',
  (SELECT id FROM auth.users WHERE email = 'mr@test.com'),
  'pending'
);
```

2. Login as admin, go to `/admin/reviews`
3. Click "Status Changes" tab
4. **Verify:**
   - ✓ Shows 1 pending status request
   - ✓ Displays:
     - Doctor name
     - Request type: "Mark as Inactive"
     - Current status: Active (green)
     - Reason text

---

### ✅ Test 8: Admin Approves Status Change

**Expected:** Doctor marked as inactive

1. In "Status Changes" tab
2. Find pending request
3. Click "Approve"
4. Add notes: "Confirmed retirement"
5. Click "Approve"
6. **Verify:**
   - ✓ Doctor `is_active` set to false

```sql
SELECT doctor_name, is_active 
FROM doctors 
WHERE id = 1;
-- is_active should be false

SELECT status FROM doctor_status_requests
WHERE doctor_id = 1;
-- status = 'approved'
```

---

### ✅ Test 9: Filter and Statistics

**Expected:** All filters and counts work correctly

1. Create multiple requests of each type (use SQL inserts above)
2. Approve some, reject some, leave some pending
3. In `/admin/reviews`:
   - ✓ Statistics show correct counts
   - ✓ "All" filter shows all requests
   - ✓ "Pending" filter shows only pending
   - ✓ "Approved" filter shows only approved
   - ✓ "Rejected" filter shows only rejected
4. Go to main `/admin` dashboard
5. **Verify:**
   - ✓ Yellow alert banner shows if pending > 0
   - ✓ Click banner navigates to `/admin/reviews`
   - ✓ Shows breakdown: X new doctors, Y updates, Z status changes

---

### ✅ Test 10: Role-Based Access

**Expected:** Only admins can access reviews page

1. Logout
2. Login as MR: `mr@test.com`
3. Try to navigate to `/admin/reviews`
4. **Verify:**
   - ✓ Redirected to `/access-denied`
   - ✓ Shows "Admin" required, current role "MR"
5. Go to main dashboard `/`
6. **Verify:**
   - ✓ MR can still view all doctors
   - ✓ MR can still create routes
   - ✓ Main app works normally

---

## Database Verification Queries

### Check All Pending Requests
```sql
SELECT 'creation' as type, COUNT(*) as pending
FROM doctor_creation_requests WHERE status = 'pending'
UNION ALL
SELECT 'change', COUNT(*)
FROM doctor_change_requests WHERE status = 'pending'
UNION ALL
SELECT 'status', COUNT(*)
FROM doctor_status_requests WHERE status = 'pending';
```

### View All Requests with Details
```sql
-- Creation requests
SELECT 
  dcr.id,
  dcr.name,
  dcr.status,
  p.full_name as requester,
  dcr.created_at
FROM doctor_creation_requests dcr
LEFT JOIN profiles p ON dcr.requested_by = p.id
ORDER BY dcr.created_at DESC;

-- Change requests
SELECT 
  dcr.id,
  d.doctor_name,
  dcr.changes,
  dcr.status,
  p.full_name as requester
FROM doctor_change_requests dcr
JOIN doctors d ON dcr.doctor_id = d.id
LEFT JOIN profiles p ON dcr.requested_by = p.id
ORDER BY dcr.created_at DESC;

-- Status requests
SELECT 
  dsr.id,
  d.doctor_name,
  dsr.request_type,
  dsr.reason,
  dsr.status
FROM doctor_status_requests dsr
JOIN doctors d ON dsr.doctor_id = d.id
ORDER BY dsr.created_at DESC;
```

---

## Success Criteria

Phase 4 is working correctly if:

- ✅ All three request tables exist in database
- ✅ Admin can view requests at `/admin/reviews`
- ✅ Statistics show correct counts
- ✅ Filters work (All, Pending, Approved, Rejected)
- ✅ Admin can approve/reject with notes
- ✅ Approved creation requests → doctors created
- ✅ Approved change requests → doctors updated
- ✅ Approved status requests → is_active changed
- ✅ Rejected requests → no changes to doctors
- ✅ MR users blocked from `/admin/reviews` (403)
- ✅ Main MR app still works without changes
- ✅ Build passes: `npm run build`

---

## Known Limitations

### Phase 4 Current State:
- ✅ Database schema created
- ✅ TypeScript types defined
- ✅ Service layer complete
- ✅ Admin review UI complete
- ⚠️ **MR request forms NOT integrated yet** (components exist but not wired to UI)

### What Works:
- Admin can review and approve/reject requests
- Requests can be created via SQL for testing
- All approval workflows functional

### What's Missing:
- MR-facing UI for submitting requests
- Integration of request forms into main doctor management
- "Request Edit" button on doctor cards
- "Request New Doctor" button
- "Request Inactive" button

---

## Next Steps (Future Enhancement)

To complete Phase 4, add MR-facing UI:

1. **Add "Request New Doctor" button** to main doctors page
2. **Add "Suggest Edit" button** to each doctor card
3. **Add "Request Inactive" option** to doctor actions menu
4. Wire up the existing form components:
   - `NewDoctorRequestForm`
   - `EditDoctorRequestForm`
   - `DoctorStatusRequestForm`

---

## Troubleshooting

### Issue: Tables don't exist error
**Solution:** Run `phase4-doctor-requests-schema.sql` in Supabase SQL Editor

### Issue: "Column 'is_active' doesn't exist"
**Solution:** Run the ALTER TABLE command from the schema file:
```sql
ALTER TABLE doctors ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
```

### Issue: Can't insert requests - foreign key error
**Solution:** Ensure users exist in auth.users and profiles tables

### Issue: Reviews page shows zero requests but you inserted some
**Solution:** Check request status - they must be 'pending' to show in default filter

---

## Files Created in Phase 4

### Database:
- `phase4-doctor-requests-schema.sql` - Database schema

### Types:
- `src/lib/types/doctor-requests.types.ts` - TypeScript types

### Services:
- `src/lib/supabase/services/doctor-requests.service.ts` - Request CRUD operations

### UI Components:
- `src/app/admin/reviews/page.tsx` - Admin review page
- `src/components/doctor-requests/DoctorRequestForms.tsx` - MR request forms (not integrated yet)

### Updated Files:
- `src/app/admin/layout.tsx` - Added Reviews link
- `src/app/admin/page.tsx` - Added pending requests banner
- `src/lib/supabase/database.types.ts` - Added is_active to DoctorRow

---

## Summary

Phase 4 establishes the request/approval workflow infrastructure:

**Admin Experience:**
- Review all pending requests in one place
- Approve/reject with notes
- Track request history
- Filter by status

**MR Experience (when forms integrated):**
- Submit new doctors for approval
- Suggest edits to existing doctors
- Request status changes
- Track request status

**Data Integrity:**
- Master data only changed by admins
- All changes tracked and auditable
- MRs can contribute without direct edit access
