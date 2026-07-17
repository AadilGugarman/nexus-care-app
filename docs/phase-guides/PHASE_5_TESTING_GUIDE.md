# Phase 5 Testing Guide: Multi-MR Data Ownership

**Purpose:** Verify data isolation between MRs and admin analytics functionality

---

## Prerequisites

### Test Users Required

Create 3 test users in Supabase:

1. **MR User A**
   ```
   Email: mr-alice@test.com
   Password: test123456
   Role: mr
   Full Name: Alice Anderson
   ```

2. **MR User B**
   ```
   Email: mr-bob@test.com
   Password: test123456
   Role: mr
   Full Name: Bob Brown
   ```

3. **Admin User**
   ```
   Email: admin@test.com
   Password: test123456
   Role: admin
   Full Name: Admin User
   ```

### Create Test Users (SQL)

```sql
-- Create profiles (if not exist)
INSERT INTO profiles (id, email, full_name, role)
VALUES
  (gen_random_uuid(), 'mr-alice@test.com', 'Alice Anderson', 'mr'),
  (gen_random_uuid(), 'mr-bob@test.com', 'Bob Brown', 'mr'),
  (gen_random_uuid(), 'admin@test.com', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;
```

Then create auth users in Supabase Dashboard > Authentication.

---

## Test Suite 1: Data Isolation Between MRs

### Test 1.1: Routes Are Isolated

**As Alice (MR-A):**
1. Login as `mr-alice@test.com`
2. Navigate to Routes tab
3. Create route:
   - Name: "Mumbai Morning Route"
   - Location: "Mumbai"
4. Add 3 doctors to the route
5. Mark 2 doctors as visited
6. Note the route ID (from URL if visible)

**As Bob (MR-B):**
1. Logout from Alice's account
2. Login as `mr-bob@test.com`
3. Navigate to Routes tab
4. ✅ **VERIFY:** Should NOT see "Mumbai Morning Route"
5. Create route:
   - Name: "Mumbai Evening Route"
   - Location: "Mumbai"
6. Add 5 different doctors to the route
7. Mark 3 doctors as visited

**Verification:**
- Alice sees only "Mumbai Morning Route"
- Bob sees only "Mumbai Evening Route"
- Both routes can have same location
- Doctor lists are identical (shared)

---

### Test 1.2: Visit Tracking Is Isolated

**Setup:** Both MRs will track visits for same doctor

**As Alice:**
1. Login as Alice
2. Navigate to Locations tab
3. Find doctor "Dr. Rajesh Kumar" (or any doctor)
4. Click visit tracking button (circle icon)
5. Mark as visited ✓
6. ✅ **VERIFY:** Icon turns green (visited)

**As Bob:**
1. Logout from Alice
2. Login as Bob
3. Navigate to Locations tab
4. Find same doctor "Dr. Rajesh Kumar"
5. ✅ **VERIFY:** Visit icon is grey (not visited)
6. Click visit tracking button
7. Mark as visited ✓
8. ✅ **VERIFY:** Icon turns green for Bob

**As Alice (again):**
1. Switch back to Alice's account
2. Check Dr. Rajesh Kumar
3. ✅ **VERIFY:** Still shows visited (Alice's state preserved)

**Result:** Same doctor, independent visit tracking per MR

---

### Test 1.3: Day Assignments Are Isolated

**As Alice:**
1. Login as Alice
2. Find Dr. Priya Sharma in Locations
3. Click calendar icon (assign days)
4. Select: Monday, Wednesday, Friday
5. Save
6. Navigate to Days tab
7. Click Monday
8. ✅ **VERIFY:** Dr. Priya Sharma appears in Monday list

**As Bob:**
1. Login as Bob
2. Navigate to Days tab
3. Click Monday
4. ✅ **VERIFY:** Dr. Priya Sharma does NOT appear
5. Go back to Locations
6. Find Dr. Priya Sharma
7. Assign days: Tuesday, Thursday
8. Navigate to Days → Tuesday
9. ✅ **VERIFY:** Dr. Priya Sharma appears in Bob's Tuesday list
10. Check Monday
11. ✅ **VERIFY:** Dr. Priya Sharma NOT in Bob's Monday list

**Result:** Day assignments are per-MR, independent schedules

---

### Test 1.4: Doctors Are Shared

**As Alice:**
1. Login as Alice
2. Navigate to Locations tab
3. Count total doctors (e.g., 674)
4. Note doctor names and details

**As Bob:**
1. Login as Bob
2. Navigate to Locations tab
3. ✅ **VERIFY:** Same doctor count (674)
4. ✅ **VERIFY:** Same doctor names and details
5. Search for specific doctor Alice saw
6. ✅ **VERIFY:** Present with identical information

**As Admin:**
1. Login as admin
2. Navigate to `/admin/doctors`
3. Edit a doctor's information (e.g., update mobile number)
4. Save changes

**As Alice and Bob:**
1. Refresh Locations tab
2. ✅ **VERIFY:** Both see updated doctor information immediately
3. ✅ **VERIFY:** Changes reflect for both MRs

**Result:** Doctor master data is shared and consistent

---

## Test Suite 2: Admin Analytics

### Test 2.1: System Overview

**Setup:** Ensure Alice and Bob have created data (from Test Suite 1)

**As Admin:**
1. Login as admin user
2. Navigate to `/admin/analytics`
3. Default tab should be "Overview"

**Verify Overview Statistics:**
- ✅ **Total MRs**: Should show at least 2 (Alice + Bob)
- ✅ **Active MRs**: Should show 2 (both active recently)
- ✅ **Total Routes**: Should show at least 2 (Mumbai Morning + Mumbai Evening)
- ✅ **Total Visits**: Should show combined visits from both MRs
- ✅ **Active Doctors**: Should show 674 (or total active count)

**Verify Top MRs Section:**
- ✅ Should list Alice and Bob
- ✅ Each should show their route count
- ✅ Each should show their visit count
- ✅ Each should show their assigned doctor count

---

### Test 2.2: Users Analytics Tab

**As Admin:**
1. Stay on `/admin/analytics`
2. Click "MR Users" tab

**Verify Users Table:**
- ✅ Shows at least 2 rows (Alice, Bob)
- ✅ Each row shows:
  - Full name and email
  - Routes: Total count, active count
  - Visits: Visited count, total tracked
  - Assigned: Count of doctors with day assignments
  - Last Activity: Recent date
  - Joined: Account creation date

**Verify Alice's Row:**
- Routes: Should show 1 (Mumbai Morning Route)
- Active Routes: Should show 1 (not completed)
- Visits: Should show visited doctor count from Test 1.2
- Assigned: Should show count from Test 1.3 (if any)

**Verify Bob's Row:**
- Routes: Should show 1 (Mumbai Evening Route)
- Statistics should match Bob's activity

---

### Test 2.3: Routes Analytics Tab

**As Admin:**
1. Stay on `/admin/analytics`
2. Click "All Routes" tab

**Verify Routes Table:**
- ✅ Shows at least 2 rows (both routes)
- ✅ Mumbai Morning Route row shows:
  - Route Name: "Mumbai Morning Route"
  - Location: "Mumbai"
  - Owner: Alice Anderson (mr-alice@test.com)
  - Doctors: 3 (count from Test 1.1)
  - Cycle Days: Default value
  - Status: Active
  - Created: Recent date
- ✅ Mumbai Evening Route row shows:
  - Owner: Bob Brown (mr-bob@test.com)
  - Doctors: 5 (count from Test 1.1)
  - Status: Active

**Test Route Completion:**
1. As Bob, complete "Mumbai Evening Route"
2. As Admin, refresh analytics
3. ✅ **VERIFY:** Route status changes to "Completed"
4. ✅ **VERIFY:** Overview shows updated active route count

---

## Test Suite 3: Data Operations

### Test 3.1: Route Doctor Management

**As Alice:**
1. Create new route "Delhi Route"
2. Add 10 doctors
3. Remove 2 doctors
4. Reorder remaining doctors
5. Complete route

**As Bob:**
1. Check Routes tab
2. ✅ **VERIFY:** Does NOT see "Delhi Route"

**As Admin:**
1. Check Analytics → Routes tab
2. ✅ **VERIFY:** Sees "Delhi Route" with owner=Alice
3. ✅ **VERIFY:** Shows 8 doctors (10 added - 2 removed)
4. ✅ **VERIFY:** Status shows "Completed"

---

### Test 3.2: Bulk Visit Tracking

**As Alice:**
1. Mark 10 different doctors as visited
2. Note the doctors marked

**As Bob:**
1. Check same 10 doctors
2. ✅ **VERIFY:** All 10 show as not visited (grey icon)
3. Mark 5 of the same doctors as visited

**As Admin:**
1. Analytics → Users tab
2. Check Alice's row
3. ✅ **VERIFY:** Visited doctor count = 10 (+ any from previous tests)
4. Check Bob's row
5. ✅ **VERIFY:** Visited doctor count = 5 (+ any from previous tests)

---

### Test 3.3: Cross-Location Operations

**As Alice:**
1. Create routes in 3 different locations:
   - Mumbai Central Route (5 doctors)
   - Delhi Route (8 doctors)
   - Bangalore Route (6 doctors)
2. Complete Mumbai Central Route

**As Bob:**
1. Create routes in 2 locations:
   - Mumbai West Route (7 doctors)
   - Delhi NCR Route (9 doctors)

**As Admin:**
1. Analytics → Routes tab
2. ✅ **VERIFY:** All 5 routes visible
3. ✅ **VERIFY:** Each route shows correct owner
4. ✅ **VERIFY:** Mumbai has 2 routes (1 from Alice, 1 from Bob)
5. ✅ **VERIFY:** Delhi has 2 routes (1 from Alice, 1 from Bob)
6. ✅ **VERIFY:** Bangalore has 1 route (Alice only)
7. ✅ **VERIFY:** Only Mumbai Central Route shows as completed

---

## Test Suite 4: Edge Cases

### Test 4.1: Empty User

**Setup:** Create new MR user with no activity

1. Create new test user `mr-charlie@test.com`
2. Don't create any routes/visits

**As Admin:**
1. Navigate to Analytics → Users tab
2. ✅ **VERIFY:** Charlie appears in list
3. ✅ **VERIFY:** All counts show 0
4. ✅ **VERIFY:** Last Activity shows "Never"

---

### Test 4.2: Same Doctor, Multiple Routes

**As Alice:**
1. Create "Route A"
2. Add Dr. Sharma
3. Create "Route B"
4. Add same Dr. Sharma
5. Note: Dr. Sharma in 2 routes

**As Admin:**
1. This feature (doctor usage across routes) is not in current analytics
2. ✅ **VERIFY:** Both routes show in analytics
3. ✅ **NOTE:** Doctor usage statistics could be future enhancement

---

### Test 4.3: Rapid Updates

**As Alice:**
1. Quickly create 5 routes
2. Quickly delete 3 routes
3. Quickly complete 1 route

**As Admin:**
1. Click Refresh button
2. ✅ **VERIFY:** Statistics update correctly
3. ✅ **VERIFY:** Alice shows 2 active routes (5 created - 3 deleted, 1 completed)

---

## Test Suite 5: Performance

### Test 5.1: Large Dataset

**Setup:** Create more test data

**As Alice:**
1. Create 20 routes
2. Add 5-10 doctors to each
3. Mark 50+ doctors as visited

**As Bob:**
1. Create 15 routes
2. Add 8-12 doctors to each
3. Mark 40+ doctors as visited

**As Admin:**
1. Navigate to Analytics
2. ✅ **VERIFY:** Page loads within 3 seconds
3. ✅ **VERIFY:** All tabs work smoothly
4. ✅ **VERIFY:** Statistics are accurate

---

### Test 5.2: Refresh Performance

**As Admin:**
1. On Analytics page
2. Click Refresh button 5 times rapidly
3. ✅ **VERIFY:** No errors
4. ✅ **VERIFY:** UI doesn't break
5. ✅ **VERIFY:** Data stays consistent

---

## Test Suite 6: Error Handling

### Test 6.1: Network Error Simulation

1. Open Dev Tools → Network tab
2. Set to Offline mode
3. As Admin, navigate to Analytics
4. ✅ **VERIFY:** Error message displays
5. ✅ **VERIFY:** Retry button appears
6. Set back to Online
7. Click Retry button
8. ✅ **VERIFY:** Data loads successfully

---

### Test 6.2: Invalid User Access

**As MR Alice:**
1. Try to navigate directly to `/admin/analytics`
2. ✅ **VERIFY:** Redirected to `/access-denied`
3. ✅ **VERIFY:** Cannot access admin analytics

**As Public (not logged in):**
1. Try to navigate to `/admin/analytics`
2. ✅ **VERIFY:** Redirected to login or access denied
3. ✅ **VERIFY:** Cannot access without authentication

---

## Expected Results Summary

### Data Isolation ✓
- MR A cannot see MR B's routes
- MR A cannot see MR B's visits
- MR A cannot see MR B's day assignments
- Each MR has independent tracking for same doctors

### Doctor Master Data ✓
- All MRs see same doctor list
- Admin changes reflect for all MRs
- Doctor count identical across all MRs

### Admin Analytics ✓
- Admin sees all MRs' data
- System statistics are aggregated correctly
- User table shows per-MR statistics
- Routes table shows all routes with owners
- Refresh updates data accurately

### Security ✓
- MRs cannot access analytics
- Public cannot access admin panel
- Middleware protects admin routes

### Performance ✓
- Analytics loads within 3 seconds
- Refresh works smoothly
- No UI lag with moderate dataset (20-30 routes per MR)

---

## Troubleshooting

### Issue: Analytics shows 0 MRs

**Cause:** No users with role='mr' in database

**Fix:**
```sql
-- Check profiles table
SELECT * FROM profiles WHERE role = 'mr';

-- Update existing user to MR
UPDATE profiles SET role = 'mr' WHERE email = 'mr-alice@test.com';
```

---

### Issue: MR sees another MR's data

**Cause:** Service not filtering by user_id correctly

**Fix:**
1. Check if user_id is being passed correctly
2. Verify `requireAuth()` is working
3. Check browser console for errors
4. Verify services are using latest code

---

### Issue: Analytics shows wrong statistics

**Cause:** Cached data or query issue

**Fix:**
1. Click Refresh button
2. Hard refresh browser (Ctrl+F5)
3. Check browser console for errors
4. Verify database data directly:

```sql
-- Check actual route counts
SELECT user_id, COUNT(*) as route_count
FROM user_routes
GROUP BY user_id;

-- Check actual visit counts
SELECT user_id, COUNT(*) as visit_count
FROM doctor_visits
WHERE is_visited = true
GROUP BY user_id;
```

---

### Issue: Cannot create test users

**Cause:** Supabase Auth configuration

**Fix:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Email provider
3. Disable email confirmation (for testing)
4. Set password minimum length to 6
5. Retry creating users

---

## Test Completion Checklist

- [ ] Created 3 test users (2 MRs + 1 Admin)
- [ ] Test Suite 1: All data isolation tests pass
- [ ] Test Suite 2: All admin analytics tests pass
- [ ] Test Suite 3: All data operation tests pass
- [ ] Test Suite 4: All edge case tests pass
- [ ] Test Suite 5: Performance acceptable
- [ ] Test Suite 6: Error handling works
- [ ] No console errors observed
- [ ] Build passes (`npm run build`)
- [ ] All Expected Results verified

---

## Sign-Off

**Tester Name:** _______________  
**Date:** _______________  
**Status:** ☐ All Pass ☐ Issues Found  
**Notes:**

---

**Phase 5 Testing Complete!** ✅
