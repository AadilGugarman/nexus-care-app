# 🔧 Authentication Setup Troubleshooting

**Issue:** Permission errors when setting up authentication  
**Date:** July 16, 2026

---

## ❌ Common Error

```
ERROR: 42501: must be owner of relation users
```

**Cause:** The `auth.users` table is owned by Supabase's authentication system and requires elevated permissions to create triggers.

---

## ✅ Solution: Use Supabase SQL Editor

### Method 1: Via Supabase Dashboard (Recommended)

**Steps:**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Navigate to: **SQL Editor** (left sidebar)

2. **Create New Query**
   - Click **"New query"** button
   - Or click the **"+"** icon

3. **Paste SQL Script**
   - Open `enable-auth.sql` from your project
   - Copy entire contents
   - Paste into SQL Editor

4. **Run Script**
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for execution to complete

5. **Verify Success**
   - Check for success messages:
     ```
     ✅ Function handle_new_user() created successfully
     ✅ Trigger on_auth_user_created created successfully
     ```
   - Check for errors (should be none)

**Why This Works:**
- Supabase SQL Editor runs with elevated permissions
- Has access to `auth` schema
- Can create triggers on `auth.users` table

---

## ✅ Verification Steps

### Step 1: Check Function Exists

Run this query in SQL Editor:

```sql
SELECT 
  proname AS function_name,
  prosecdef AS security_definer
FROM pg_proc
WHERE proname = 'handle_new_user';
```

**Expected Result:**
```
function_name      | security_definer
-------------------|-----------------
handle_new_user    | t (true)
```

---

### Step 2: Check Trigger Exists

Run this query:

```sql
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

**Expected Result:**
```
trigger_name           | table_name  | enabled
-----------------------|-------------|--------
on_auth_user_created   | auth.users  | O (origin enabled)
```

---

### Step 3: Test Profile Creation

**Option A: Create Test User via Dashboard**

1. Go to: **Authentication → Users** in Supabase Dashboard
2. Click **"Add User"**
3. Fill in:
   - Email: `test@example.com`
   - Password: `test123`
   - User Metadata:
     ```json
     {
       "full_name": "Test User",
       "role": "mr"
     }
     ```
4. Click **"Create user"**

**Option B: Via Signup Screen**

1. Go to `http://localhost:3000/signup`
2. Fill in form
3. Submit

**Verify Profile Created:**

Run this query:

```sql
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email = 'test@example.com';
```

**Expected Result:**
```
id                  | email              | full_name  | role | created_at
--------------------|--------------------|-----------|----|------------------
abc123-uuid-here    | test@example.com   | Test User  | mr  | 2026-07-16 ...
```

---

## 🚫 What NOT to Do

### ❌ Don't Use psql CLI Directly

```bash
# This will fail with permission error
psql -h xxx.supabase.co -U postgres -f enable-auth.sql
```

**Why:** Your postgres user doesn't have access to `auth` schema.

---

### ❌ Don't Try to Modify auth.users Directly

```sql
-- This will fail
ALTER TABLE auth.users ADD COLUMN custom_field TEXT;
```

**Why:** `auth.users` is managed by Supabase and protected.

---

### ❌ Don't Use Anon/Service Keys in Code

```typescript
// Don't try to create trigger from application code
const { error } = await supabase.rpc('create_trigger');
```

**Why:** Application keys don't have admin permissions.

---

## 🔍 Troubleshooting Other Issues

### Issue: Function Created But Trigger Failed

**Symptom:**
```
✅ Function created
❌ Trigger not found
```

**Solution:**

1. Check if trigger creation was logged:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. If not found, manually create trigger:
   ```sql
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW
     EXECUTE FUNCTION public.handle_new_user();
   ```

3. Run in Supabase SQL Editor (has proper permissions)

---

### Issue: Profile Not Created After Signup

**Possible Causes:**

1. **Trigger not active**
   - Verify trigger exists (see Step 2 above)
   - Check trigger is enabled: `tgenabled = 'O'`

2. **Function has error**
   - Check logs in Supabase Dashboard
   - Go to: **Logs** → **Function Logs**
   - Look for errors related to `handle_new_user`

3. **profiles table issue**
   - Verify profiles table exists:
     ```sql
     SELECT * FROM profiles LIMIT 1;
     ```
   - Check if user can insert:
     ```sql
     INSERT INTO profiles (id, email, full_name, role)
     VALUES (
       '00000000-0000-0000-0000-000000000002',
       'test2@example.com',
       'Test User 2',
       'mr'
     );
     ```

**Fix:**

If manual insert works but trigger doesn't:

```sql
-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

### Issue: "relation profiles does not exist"

**Symptom:**
```
ERROR: relation "profiles" does not exist
```

**Solution:**

1. Check if profiles table exists:
   ```sql
   SELECT tablename 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename = 'profiles';
   ```

2. If not found, create it:
   ```sql
   CREATE TABLE profiles (
     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
     email TEXT NOT NULL,
     full_name TEXT,
     role TEXT NOT NULL DEFAULT 'mr' CHECK (role IN ('admin', 'mr', 'public')),
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. Or run your main schema file (`supabase-schema.sql`)

---

### Issue: "insufficient privilege" when creating function

**Symptom:**
```
ERROR: permission denied to create function
```

**Solution:**

- You must use **Supabase SQL Editor**
- Cannot use regular postgres user
- Cannot run from application code
- Only SQL Editor has required permissions

---

## ✅ Correct Setup Checklist

Before testing signup:

- [ ] Supabase Auth enabled in dashboard
- [ ] Email provider enabled
- [ ] Site URL configured (`http://localhost:3000`)
- [ ] `enable-auth.sql` run in **SQL Editor**
- [ ] Function `handle_new_user()` exists (verified)
- [ ] Trigger `on_auth_user_created` exists (verified)
- [ ] `profiles` table exists
- [ ] Test user creation (via dashboard or signup)
- [ ] Profile created automatically (verified)

---

## 📝 Quick Test Script

Run this in Supabase SQL Editor to verify everything:

```sql
-- 1. Check function
SELECT 
  'Function: ' || proname AS check_result,
  CASE WHEN prosecdef THEN '✅ Security Definer' ELSE '❌ Not Secure' END AS security
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 2. Check trigger
SELECT 
  'Trigger: ' || tgname AS check_result,
  CASE WHEN tgenabled = 'O' THEN '✅ Enabled' ELSE '❌ Disabled' END AS status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 3. Check profiles table
SELECT 
  'Profiles Table: ' AS check_result,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'profiles'
  ) THEN '✅ Exists' ELSE '❌ Missing' END AS status;

-- 4. Count existing profiles
SELECT 
  'Profiles Count: ' AS check_result,
  COUNT(*)::TEXT || ' profiles' AS count
FROM profiles;
```

**Expected Output:**
```
check_result                        | security/status/count
------------------------------------|---------------------
Function: handle_new_user           | ✅ Security Definer
Trigger: on_auth_user_created       | ✅ Enabled
Profiles Table:                     | ✅ Exists
Profiles Count:                     | 1 profiles (or more)
```

---

## 🎯 Summary

### The Correct Way

1. ✅ Open **Supabase SQL Editor**
2. ✅ Paste `enable-auth.sql` contents
3. ✅ Click **"Run"**
4. ✅ Verify success messages
5. ✅ Test by creating a user
6. ✅ Verify profile created

### Common Mistakes

❌ Running via psql CLI with regular user  
❌ Trying to modify auth.users directly  
❌ Using application code to create trigger  
❌ Not using Supabase SQL Editor  

---

## 📞 Still Having Issues?

### Check Supabase Logs

1. Go to **Dashboard → Logs**
2. Select **Function Logs**
3. Look for errors related to `handle_new_user`

### Check Auth Logs

1. Go to **Dashboard → Logs**
2. Select **Auth Logs**
3. Check for signup events
4. See if trigger fired

### Manual Profile Creation Test

If trigger not working, test manual creation:

```sql
-- Create a test profile manually
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  gen_random_uuid(),
  'manual@test.com',
  'Manual Test',
  'mr'
);

-- If this works, issue is with trigger
-- If this fails, issue is with profiles table/permissions
```

---

**✅ Once setup is complete, Phase 2 authentication will work perfectly!**

