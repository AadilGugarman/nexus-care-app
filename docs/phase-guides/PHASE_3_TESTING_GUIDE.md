# Phase 3 Testing Guide

## Quick Testing Instructions

### Setup Test Users

Before testing, create two test users in your Supabase dashboard:

#### Create Admin User:
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Email: `admin@test.com`
4. Password: `admin123` (temporary)
5. Click "Add User"
6. Go to SQL Editor and run:
```sql
-- Set admin role
UPDATE profiles 
SET role = 'admin', full_name = 'Admin User'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@test.com');
```

#### Create MR User:
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Email: `mr@test.com`
4. Password: `mr123` (temporary)
5. Click "Add User"
6. Go to SQL Editor and run:
```sql
-- Set mr role
UPDATE profiles 
SET role = 'mr', full_name = 'MR User'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mr@test.com');
```

---

## Test Scenarios

### ✅ Test 1: Admin Full Access
**Expected:** Admin can access everything

1. Start dev server: `npm run dev`
2. Open: http://localhost:3000
3. Click "Sign In" or go to `/login`
4. Login with: `admin@test.com` / `admin123`
5. **Verify:**
   - ✓ Dashboard loads
   - ✓ Settings shows "Administrator" role with 👑 icon
   - ✓ All permissions show green checkmarks
   - ✓ "Access Admin Panel" button is visible
6. Click "Access Admin Panel" or navigate to `/admin`
7. **Verify:**
   - ✓ Admin Dashboard loads (no redirect)
   - ✓ Shows welcome message
   - ✓ Shows 4 cards: Dashboard, Doctor Management, Bulk Import, Data Quality
8. Try all admin routes:
   - `/admin/doctors` - Doctor Management
   - `/admin/import` - Bulk Import
   - `/admin/quality` - Data Quality
9. **Verify:** All load successfully

---

### 🚫 Test 2: MR Access Denied
**Expected:** MR can use main app but blocked from admin

1. Sign out (Settings → Logout)
2. Click "Sign In" or go to `/login`
3. Login with: `mr@test.com` / `mr123`
4. **Verify:**
   - ✓ Dashboard loads
   - ✓ Settings shows "Medical Representative" role with 💼 icon
   - ✓ Main app permissions show green checkmarks
   - ✓ Admin permissions show red X marks
   - ✓ No "Access Admin Panel" button (instead shows help text)
5. Manually navigate to `/admin`
6. **Verify:**
   - ✓ Redirects to `/access-denied`
   - ✓ Shows "Access Denied" page
   - ✓ Required Role: Admin
   - ✓ Your Current Role: MR
   - ✓ Shows user email
   - ✓ 10 second countdown starts
7. Wait 10 seconds
8. **Verify:**
   - ✓ Auto-redirects to dashboard

---

### 👤 Test 3: Public Access (Not Logged In)
**Expected:** Main app works, admin routes require login

1. Sign out (Settings → Logout)
2. **Verify:**
   - ✓ Dashboard still works
   - ✓ Can view doctors
   - ✓ Can create routes
   - ✓ Can add doctors to routes
   - ✓ Can mark visits
3. Go to Settings
4. **Verify:**
   - ✓ Shows "Not Logged In"
   - ✓ Shows "Guest Access" badge
   - ✓ Shows "Sign In" and "Sign Up" buttons
5. Manually navigate to `/admin`
6. **Verify:**
   - ✓ Redirects to `/login?redirectTo=/admin`
   - ✓ Login page shows
7. Do NOT login, go back to `/`
8. **Verify:**
   - ✓ Main app still works normally

---

### 🔄 Test 4: Redirect After Login
**Expected:** User returns to intended page after login

1. Sign out completely
2. Manually navigate to `/admin/doctors`
3. **Verify:**
   - ✓ Redirects to `/login?redirectTo=/admin/doctors`
4. Login as admin: `admin@test.com` / `admin123`
5. **Verify:**
   - ✓ Automatically redirected to `/admin/doctors`
   - ✓ Doctor Management page loads

---

### 🔍 Test 5: Role Debugging Panel
**Expected:** Panel shows accurate permissions

1. Login as admin: `admin@test.com` / `admin123`
2. Go to Settings
3. **Verify Auth Status Panel:**
   - Shows "Logged In"
   - Shows user email
   - Shows "Active Session" badge
   - Shows User ID (UUID)
4. **Verify Role & Access Control Panel:**
   - Shows "👑 Administrator"
   - Shows "Full system access"
   - All 6 permissions show green checkmarks
   - "Access Admin Panel" button visible
5. Logout
6. Login as MR: `mr@test.com` / `mr123`
7. Go to Settings
8. **Verify Role & Access Control Panel:**
   - Shows "💼 Medical Representative"
   - Shows "Standard user access"
   - First 3 permissions green (Main Dashboard, Doctor Management, Routes)
   - Last 3 permissions red (Admin Panel, Bulk Import, Data Quality)
   - Shows help text instead of button

---

## Quick Verification Commands

### Check User Roles in Database:
```sql
SELECT 
  u.email,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

### Verify Profiles Exist:
```sql
SELECT COUNT(*) FROM profiles;
-- Should show at least 2 (admin + mr)
```

### Check RLS Status:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('doctors', 'routes', 'visits', 'assignments', 'profiles');
-- All should show rowsecurity = false
```

---

## Common Issues & Fixes

### Issue: "Email rate limit exceeded"
**Fix:** Users already created manually in dashboard (see Setup section)

### Issue: "Error loading profile"
**Fix:** Run this in SQL Editor:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Issue: Admin redirected to access-denied
**Fix:** Verify role in database:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@test.com');
```

### Issue: Middleware not running
**Fix:** 
1. Stop dev server (Ctrl+C)
2. Delete `.next` folder: `rmdir /s /q .next`
3. Restart: `npm run dev`

### Issue: Cookies not being set
**Fix:** Check browser DevTools:
1. F12 → Application → Cookies
2. Look for: `sb-eypgvkhylfrklwfnhaus-auth-token`
3. If missing, session may not be persisting
4. Try clearing all site data and logging in again

---

## Expected Results Summary

| User Type | Dashboard | Doctors | Routes | /admin | Behavior |
|-----------|-----------|---------|--------|--------|----------|
| Admin | ✅ | ✅ | ✅ | ✅ | Full access |
| MR | ✅ | ✅ | ✅ | ❌ | Redirect to access-denied |
| Public | ✅ | ✅ | ✅ | ❌ | Redirect to login |

---

## Success Criteria

Phase 3 is working correctly if:

- ✅ Admin users can access `/admin` routes
- ✅ MR users see access-denied page on `/admin` routes
- ✅ Public users redirected to login on `/admin` routes
- ✅ Main app works for all user types
- ✅ Role debugging panel shows correct permissions
- ✅ Build passes: `npm run build`
- ✅ No TypeScript errors
- ✅ No console errors (except warning about middleware deprecation)

---

## Next Steps After Testing

Once all tests pass:

1. **Document any issues found**
2. **Decide on Phase 4:** 
   - Option A: Enable RLS (require auth for all features)
   - Option B: Add more admin features (user management, role assignment)
   - Option C: Keep current setup and move to production
3. **Update users:** Change test passwords or create real users
4. **Deploy:** Ready for production deployment

---

## Need Help?

If tests fail or you encounter issues:
1. Check the console for error messages
2. Check browser DevTools → Network tab for failed requests
3. Check Supabase Dashboard → Logs for database errors
4. Review `PHASE_3_RBAC_COMPLETE.md` for architecture details
