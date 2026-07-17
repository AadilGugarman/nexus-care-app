# Phase 5 Quick Start Guide

**Goal:** Get Phase 5 Multi-MR features running in 10 minutes

---

## Prerequisites

✅ Phase 1-4 complete  
✅ Application running (`npm run dev`)  
✅ Supabase configured  
✅ Build passing

---

## Step 1: Verify Build (2 minutes)

```bash
npm run build
```

**Expected:**
```
✓ Compiled successfully
✓ Finished TypeScript in ~6s
Route: /admin/analytics ← Should see this
Exit Code: 0
```

✅ **If passing:** Continue to Step 2  
❌ **If failing:** Check SESSION_SUMMARY_PHASE_5.md troubleshooting

---

## Step 2: Create Test Users (3 minutes)

### Create Admin User

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Email: `admin@test.com`
4. Password: `test123456`
5. Confirm email: ✓ (auto-confirm)
6. Click "Save"

### Set Admin Role

Go to SQL Editor and run:

```sql
-- Set admin role
UPDATE profiles 
SET role = 'admin', full_name = 'Admin User'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@test.com'
);
```

### Create 2 MR Users

Repeat the user creation process for:

**MR User A:**
- Email: `mr-alice@test.com`
- Password: `test123456`

**MR User B:**
- Email: `mr-bob@test.com`
- Password: `test123456`

### Set MR Roles

```sql
-- Set MR roles
UPDATE profiles 
SET role = 'mr', full_name = 'Alice Anderson'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'mr-alice@test.com'
);

UPDATE profiles 
SET role = 'mr', full_name = 'Bob Brown'
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'mr-bob@test.com'
);
```

✅ **Verify:** 3 users created (1 admin, 2 MRs)

---

## Step 3: Create Test Data (3 minutes)

### As Alice (MR-A)

1. Login: `http://localhost:3000/login`
   - Email: `mr-alice@test.com`
   - Password: `test123456`

2. Create Route:
   - Navigate to Routes tab
   - Click "Create Route"
   - Name: "Mumbai Morning Route"
   - Location: "Mumbai"
   - Save

3. Add Doctors:
   - Add 3-5 doctors to the route

4. Mark Visits:
   - Go to Locations tab
   - Mark 2 doctors as visited (green checkmark)

5. Logout

### As Bob (MR-B)

1. Login: `mr-bob@test.com`

2. Create Route:
   - Name: "Mumbai Evening Route"
   - Location: "Mumbai"
   - Save

3. Add Doctors:
   - Add 4-6 different doctors

4. Mark Visits:
   - Mark 3 doctors as visited

5. Logout

✅ **Verify:** 
- Alice has 1 route with 3-5 doctors
- Bob has 1 route with 4-6 doctors

---

## Step 4: Test Admin Analytics (2 minutes)

### Login as Admin

1. Go to `http://localhost:3000/login`
2. Email: `admin@test.com`
3. Password: `test123456`

### View Analytics

1. Navigate to: `http://localhost:3000/admin/analytics`

2. **Overview Tab** - Verify:
   - ✅ Total MRs: 2
   - ✅ Active MRs: 2
   - ✅ Total Routes: 2
   - ✅ Total Visits: 5 (Alice:2 + Bob:3)
   - ✅ Top MRs section shows Alice and Bob

3. **Users Tab** - Verify:
   - ✅ Table shows 2 rows
   - ✅ Alice Anderson with her stats
   - ✅ Bob Brown with his stats
   - ✅ Route counts visible
   - ✅ Visit counts visible

4. **Routes Tab** - Verify:
   - ✅ Table shows 2 rows
   - ✅ Mumbai Morning Route (Owner: Alice Anderson)
   - ✅ Mumbai Evening Route (Owner: Bob Brown)
   - ✅ Doctor counts correct
   - ✅ Status shows "Active"

✅ **Success!** All analytics working

---

## Step 5: Test Data Isolation (2 minutes)

### Login as Alice

1. Logout from admin
2. Login as `mr-alice@test.com`
3. Navigate to Routes tab

**Verify:**
- ✅ Only see "Mumbai Morning Route"
- ❌ Do NOT see "Mumbai Evening Route"

### Login as Bob

1. Logout from Alice
2. Login as `mr-bob@test.com`
3. Navigate to Routes tab

**Verify:**
- ✅ Only see "Mumbai Evening Route"
- ❌ Do NOT see "Mumbai Morning Route"

### Check Same Doctor Status

1. As Alice: Find a doctor, mark as visited
2. As Bob: Find SAME doctor
   - ✅ Should NOT show as visited for Bob
   - ✅ Independent visit tracking confirmed

✅ **Data isolation working!**

---

## Verification Checklist

- [ ] Build passes without errors
- [ ] 3 test users created (1 admin, 2 MRs)
- [ ] Alice created route with doctors
- [ ] Bob created route with doctors
- [ ] Admin can access `/admin/analytics`
- [ ] Analytics Overview tab shows correct stats
- [ ] Analytics Users tab shows both MRs
- [ ] Analytics Routes tab shows both routes
- [ ] Alice only sees her own routes
- [ ] Bob only sees his own routes
- [ ] Visit tracking is independent per MR
- [ ] Doctors list is same for both MRs

---

## Troubleshooting

### Analytics Page Shows "0 MRs"

**Cause:** No users with role='mr'

**Fix:**
```sql
SELECT email, role FROM profiles;
-- Verify roles are set correctly

UPDATE profiles SET role = 'mr' 
WHERE email IN ('mr-alice@test.com', 'mr-bob@test.com');
```

---

### MR Can See Other MR's Routes

**Cause:** Service not filtering correctly

**Fix:**
1. Check browser console for errors
2. Verify user is logged in
3. Hard refresh (Ctrl+F5)
4. Check `requireAuth()` is working

---

### Analytics Page Won't Load

**Cause:** Missing analytics service

**Fix:**
```bash
# Verify file exists
ls src/lib/supabase/services/analytics.service.ts

# Rebuild
npm run build
```

---

### "Access Denied" for Admin

**Cause:** Role not set correctly

**Fix:**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@test.com';
```

Logout and login again.

---

## What's Next?

### Full Testing

See `docs/phase-guides/PHASE_5_TESTING_GUIDE.md` for:
- 6 comprehensive test suites
- 20+ test scenarios
- Edge case testing
- Performance testing

### Deployment

See `PROJECT_STATUS_PHASE_5.md` for:
- Production deployment checklist
- Environment setup
- Performance optimization
- Security considerations

### Documentation

See `docs/phase-guides/PHASE_5_MULTI_MR_IMPLEMENTATION.md` for:
- Complete architecture
- Service implementation details
- Future RLS migration
- Performance optimization

---

## Quick Commands

```bash
# Build
npm run build

# Dev server
npm run dev

# Type check
npx tsc --noEmit

# Access app
http://localhost:3000

# Access admin
http://localhost:3000/admin

# Access analytics
http://localhost:3000/admin/analytics
```

---

## Success!

If all checkboxes are marked, Phase 5 is working correctly!

**Next Steps:**
1. Explore all three analytics tabs
2. Create more test data
3. Test edge cases
4. Prepare for deployment

---

**Phase 5 Quick Start Complete!** ✅

For questions, see:
- `PHASE_5_COMPLETE.md` - Phase summary
- `SESSION_SUMMARY_PHASE_5.md` - Implementation details
- `PROJECT_STATUS_PHASE_5.md` - Full project status
- `docs/phase-guides/PHASE_5_TESTING_GUIDE.md` - Comprehensive testing

