# Admin Access Setup & Verification

## Current System Overview

### Authentication System ✅
- **Table:** `profiles`
- **Role Column:** `role` (TEXT)
- **Valid Roles:** 'mr', 'admin', 'public'
- **Default Role:** 'mr'
- **Role Retrieved:** From `profiles` table on login

### Profiles Table Structure
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'mr' CHECK (role IN ('mr', 'admin', 'public')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 SQL Queries for User Management

### 1. View All Users and Their Roles
```sql
-- View all users with their roles
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  au.email_confirmed_at,
  au.last_sign_in_at
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC;
```

### 2. View Specific User by Email
```sql
-- Replace 'john@gmail.com' with your email
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email = 'john@gmail.com';
```

### 3. Count Users by Role
```sql
SELECT 
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;
```

---

## 🔑 Admin Promotion Queries

### Make a User Admin (By Email)
```sql
-- Replace 'john@gmail.com' with the user's email
UPDATE profiles
SET role = 'admin'
WHERE email = 'john@gmail.com';

-- Verify the change
SELECT email, role FROM profiles WHERE email = 'john@gmail.com';
```

### Make a User Admin (By User ID)
```sql
-- Replace with the actual UUID
UPDATE profiles
SET role = 'admin'
WHERE id = 'USER_UUID_HERE';

-- Verify the change
SELECT email, role FROM profiles WHERE id = 'USER_UUID_HERE';
```

---

## ⬇️ Revert Admin to MR

### Revert Admin Back to MR (By Email)
```sql
-- Replace 'john@gmail.com' with the user's email
UPDATE profiles
SET role = 'mr'
WHERE email = 'john@gmail.com';

-- Verify the change
SELECT email, role FROM profiles WHERE email = 'john@gmail.com';
```

### Revert Admin Back to MR (By User ID)
```sql
-- Replace with the actual UUID
UPDATE profiles
SET role = 'mr'
WHERE id = 'USER_UUID_HERE';

-- Verify the change
SELECT email, role FROM profiles WHERE id = 'USER_UUID_HERE';
```

---

## 🚀 Step-by-Step: Make YOUR Account Admin

### Current Logged-In User
You are logged in as: **john@gmail.com**

### Step 1: Promote Your Account to Admin

**In Supabase SQL Editor:**

```sql
-- Make john@gmail.com an admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'john@gmail.com';

-- Verify it worked
SELECT email, role, full_name FROM profiles WHERE email = 'john@gmail.com';
```

**Expected Output:**
```
email           | role  | full_name
----------------|-------|----------
john@gmail.com  | admin | John
```

### Step 2: Logout and Login

1. **In your app, click Logout** (or sign out button)
2. **Sign in again** with:
   - Email: `john@gmail.com`
   - Password: `your_password`

**Why?** The role is cached in the AuthContext. Logging out clears the cache, and logging in loads the new role from the database.

### Step 3: Verify Admin Access

After logging back in, check console:
```
Auth state changed: SIGNED_IN john@gmail.com
```

Then test these URLs:

#### Test 1: Admin Dashboard
Navigate to: `http://localhost:3000/admin`
- ✅ Should load successfully
- ✅ Should see "Admin Dashboard" heading
- ✅ Should see admin navigation

#### Test 2: Reviews Page
Navigate to: `http://localhost:3000/admin/reviews`
- ✅ Should load successfully
- ✅ Should see "Pending Requests" section
- ✅ Should be able to approve/reject requests

#### Test 3: Analytics Page
Navigate to: `http://localhost:3000/admin/analytics`
- ✅ Should load successfully
- ✅ Should see analytics charts
- ✅ Should see system metrics

---

## ✅ Admin Access Verification Checklist

Run through this checklist after promoting to admin:

### Pre-Login Check
- [ ] Run SQL query to set `role = 'admin'` for your email
- [ ] Verify with SELECT query that role is 'admin'

### Login Process
- [ ] Logout from current session
- [ ] Login again with your credentials
- [ ] Check browser console for "Auth state changed: SIGNED_IN"
- [ ] No errors in console related to profiles

### Navigation Check
- [ ] Bottom navigation shows "Admin" tab (mobile)
- [ ] Admin menu item visible in navigation
- [ ] Can click on Admin menu item

### Admin Dashboard Access
- [ ] Navigate to `/admin`
- [ ] Page loads without errors
- [ ] See "Admin Dashboard" heading
- [ ] See statistics cards
- [ ] See navigation menu

### Admin Reviews Access
- [ ] Navigate to `/admin/reviews`
- [ ] Page loads without errors
- [ ] See "Pending Requests" section
- [ ] Can view request details
- [ ] Can see approve/reject buttons
- [ ] Can filter by request type

### Admin Analytics Access
- [ ] Navigate to `/admin/analytics`
- [ ] Page loads without errors
- [ ] See analytics charts
- [ ] See system statistics
- [ ] See MR performance data

### Role-Based Features
- [ ] Can directly create doctors (without request)
- [ ] Can directly edit doctors (without request)
- [ ] Can directly delete doctors
- [ ] Can bulk import doctors
- [ ] Can manage doctor visibility
- [ ] Can view all MR data

---

## 🔍 Troubleshooting

### Issue: Still see MR role after promotion

**Cause:** Role is cached in browser session

**Solution:**
1. Make sure SQL UPDATE ran successfully
2. **Logout completely** (click logout button)
3. **Close browser tab** (optional but helps)
4. **Open new tab** and login again
5. Role should now be 'admin'

**Verify with SQL:**
```sql
-- Check current role in database
SELECT email, role FROM profiles WHERE email = 'john@gmail.com';
-- Should show: admin
```

### Issue: Can't access /admin pages

**Possible Causes:**

1. **Role not updated:**
   ```sql
   -- Check role in database
   SELECT email, role FROM profiles WHERE email = 'john@gmail.com';
   ```

2. **Not logged out/in:**
   - Must logout and login after role change

3. **Role check logic issue:**
   - Check browser console for errors
   - Look for "Access denied" or role-related errors

### Issue: Role shows 'admin' but can't access admin features

**Check:**
```sql
-- Verify role is exactly 'admin' (not 'Admin' or ' admin ')
SELECT email, role, length(role), role = 'admin' as is_admin
FROM profiles 
WHERE email = 'john@gmail.com';
```

**Expected:**
```
email           | role  | length | is_admin
----------------|-------|--------|----------
john@gmail.com  | admin | 5      | t
```

If `is_admin` is `f` (false), role value is incorrect.

**Fix:**
```sql
UPDATE profiles
SET role = 'admin'  -- Exact lowercase 'admin'
WHERE email = 'john@gmail.com';
```

---

## 📋 Quick Reference Commands

### Check Your Current Role
```sql
SELECT email, role 
FROM profiles 
WHERE email = 'john@gmail.com';
```

### Make Yourself Admin
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'john@gmail.com';
```

### Revert to MR
```sql
UPDATE profiles 
SET role = 'mr' 
WHERE email = 'john@gmail.com';
```

### Check All Admins
```sql
SELECT email, full_name, role 
FROM profiles 
WHERE role = 'admin'
ORDER BY created_at;
```

### Check All MRs
```sql
SELECT email, full_name, role 
FROM profiles 
WHERE role = 'mr'
ORDER BY created_at;
```

---

## 🎯 Complete Step-by-Step Process

### For john@gmail.com to Become Admin:

**1. Open Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Project: `eypgvkhylfrklwfnhaus`
   - Click: SQL Editor

**2. Run This Query:**
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'john@gmail.com';

SELECT email, role FROM profiles WHERE email = 'john@gmail.com';
```

**3. Expected Result:**
```
email           | role
----------------|------
john@gmail.com  | admin
```

**4. In Your App:**
   - Click "Logout" or "Sign Out"
   - Wait for logout to complete
   - Click "Sign In"
   - Enter email: `john@gmail.com`
   - Enter password
   - Click "Sign In"

**5. Verify Access:**
   - Navigate to: `http://localhost:3000/admin`
   - Should see Admin Dashboard ✅
   - Navigate to: `http://localhost:3000/admin/reviews`
   - Should see Reviews page ✅
   - Navigate to: `http://localhost:3000/admin/analytics`
   - Should see Analytics page ✅

**6. Check Navigation:**
   - Should see "Admin" menu item in navigation
   - Should have access to all admin features

---

## ⚠️ Important Notes

### DO NOT:
- ❌ Enable RLS (row level security)
- ❌ Modify authentication logic
- ❌ Change existing workflows
- ❌ Remove DEFAULT_USER_ID
- ❌ Modify doctor approval system
- ❌ Change visit tracking logic

### SAFE TO DO:
- ✅ Update role in profiles table
- ✅ Create new admin users
- ✅ Revert admins to MR
- ✅ Check user roles
- ✅ View profiles table

### Role Change Best Practice:
1. **Always verify** with SELECT before UPDATE
2. **Always logout/login** after role change
3. **Always test** admin access after promotion
4. **Keep at least one admin** for system access

---

## 🔐 Security Notes

### Role Values:
- Must be **exact lowercase**: 'admin', 'mr', 'public'
- No extra spaces
- No capitalization
- Enforced by CHECK constraint

### Role Hierarchy:
- **admin**: Full system access
- **mr**: Operational access (field operations)
- **public**: Read-only directory access

### Current System:
- ✅ Role-based navigation
- ✅ Role-based access control
- ✅ Role stored in profiles table
- ✅ Role loaded on login
- ✅ Role cached in AuthContext
- ❌ RLS not enabled (by design)

---

## ✅ Success Criteria

You successfully have admin access when:

1. ✅ SQL query shows `role = 'admin'`
2. ✅ Logged out and back in
3. ✅ Can access `/admin` page
4. ✅ Can access `/admin/reviews` page
5. ✅ Can access `/admin/analytics` page
6. ✅ See "Admin" in navigation menu
7. ✅ Can directly edit/create doctors
8. ✅ Can approve/reject requests
9. ✅ Can view all system data
10. ✅ No access denied errors

---

## 📝 Summary

**To make john@gmail.com an admin RIGHT NOW:**

```sql
-- 1. Run this in Supabase SQL Editor
UPDATE profiles SET role = 'admin' WHERE email = 'john@gmail.com';
SELECT email, role FROM profiles WHERE email = 'john@gmail.com';

-- 2. Logout from app
-- 3. Login again
-- 4. Navigate to /admin
-- 5. Success! ✅
```

**That's it!** 🎉
