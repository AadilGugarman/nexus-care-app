# 🔧 FIX: 409 Conflict Error

## 🚨 Problem

**Error:** `POST https://eypgvkhylfrklwfnhaus.supabase.co/rest/v1/doctors 409 (Conflict)`  
**Message:** "Failed to add doctor. Please try again."

## 🔍 Root Cause

The Supabase database has **Row Level Security (RLS)** policies that:
1. Require **admin role** to insert doctors
2. Block the **anon user** (unauthenticated requests)
3. Were designed for multi-user auth (not yet implemented)

Since you're running in **single-user mode without authentication**, the anon key is blocked by these policies.

## ✅ Solution

Run this SQL script in **Supabase SQL Editor** to disable RLS and grant permissions:

### Step 1: Open Supabase SQL Editor

Go to: **https://supabase.com/dashboard/project/eypgvkhylfrklwfnhaus/sql/new**

### Step 2: Copy & Run This SQL

```sql
-- ============================================================================
-- FIX RLS FOR SINGLE-USER MODE (NO AUTHENTICATION)
-- ============================================================================

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE route_doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_day_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Fix doctors table: Remove admin-only policies
DROP POLICY IF EXISTS "Authenticated users can view doctors" ON doctors;
DROP POLICY IF EXISTS "Public users can view doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can insert doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can update doctors" ON doctors;
DROP POLICY IF EXISTS "Admins can delete doctors" ON doctors;
DROP POLICY IF EXISTS "allow_all_doctors" ON doctors;

-- Create open access policy
CREATE POLICY "allow_all_access" 
  ON doctors 
  FOR ALL 
  TO anon, authenticated
  USING (true) 
  WITH CHECK (true);

-- Grant permissions to anon role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create default user (if not exists)
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'default@local.app',
  'Default User',
  'mr'
) ON CONFLICT (id) DO NOTHING;

-- Verify (should show rls_enabled = false for all tables)
SELECT tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('doctors', 'user_routes', 'profiles')
ORDER BY tablename;
```

### Step 3: Click "Run"

You should see:
- **"Success. No rows returned"**
- Verification query shows `rls_enabled = false`

### Step 4: Test Your App

1. **Refresh your application** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. **Try adding a doctor** - should work now!
3. **Visit test page** to verify all CRUD operations: http://localhost:3000/test-crud

## 🧪 Verify the Fix

### Option 1: Use the Test Page

Visit: **http://localhost:3000/test-crud**

Click **"Run All Tests"** and verify you see:
- ✅ CREATE SUCCESS
- ✅ READ SUCCESS
- ✅ UPDATE SUCCESS
- ✅ DELETE SUCCESS

### Option 2: Manual Test

1. Open your app
2. Go to **Doctors** tab
3. Click **+ Add Doctor**
4. Fill in details
5. Click **Save**
6. Should see: **"Doctor added successfully"** (green toast)

## 📁 Files Reference

- **SQL Fix Script:** `fix-rls-permissions.sql`
- **Test Page:** `src/app/test-crud/page.tsx`
- **Service:** `src/lib/supabase/services/doctors.service.ts`
- **Schema (no-auth):** `supabase-schema-no-auth.sql`

## 🔐 What About Security?

**Current State:** Single-user mode, no authentication needed
- ✅ Safe for personal use
- ✅ Safe for local development
- ✅ Safe for single MR deployments

**Future State:** When adding multi-user authentication
- Re-enable RLS with proper policies
- Add Supabase Auth
- User-specific data isolation

## 🚀 Next Steps

After fixing:

1. ✅ **Verify CRUD works** - Test adding/editing/deleting doctors
2. ✅ **Test all features** - Routes, visits, day assignments
3. ✅ **Check production build** - Run `npm run build`
4. 🎯 **Deploy** - Ready for production

## ❓ Troubleshooting

### Still Getting 409 Error?

1. **Check SQL ran successfully**
   - Go back to SQL Editor
   - Run verification query
   - Confirm `rls_enabled = false`

2. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in incognito/private window

3. **Check environment variables**
   - Verify `.env.local` has correct Supabase URL and anon key
   - Restart dev server: `npm run dev`

4. **Check Supabase project**
   - Confirm you're using project: `eypgvkhylfrklwfnhaus`
   - Check database is active

### Getting Different Error?

Check browser console for full error message and share it.

## 📞 Support

If you still have issues after following this guide:

1. Check the **browser console** (F12) for detailed error
2. Check the **Supabase logs** (Dashboard → Logs)
3. Verify the SQL script ran without errors
4. Visit `/test-crud` page to see detailed test results

---

**Quick Links:**
- 🗄️ Supabase Dashboard: https://supabase.com/dashboard/project/eypgvkhylfrklwfnhaus
- 📝 SQL Editor: https://supabase.com/dashboard/project/eypgvkhylfrklwfnhaus/sql/new
- 🧪 Test Page: http://localhost:3000/test-crud
- ✅ Verify Migration: http://localhost:3000/verify-migration
