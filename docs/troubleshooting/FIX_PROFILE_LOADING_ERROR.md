# 🔧 Fix "Error Loading Profile" Issue

**Error:** "Error loading profile: {}"  
**Symptom:** Account created successfully but profile not loading  
**Cause:** RLS (Row Level Security) is blocking profile access  
**Solution:** Run SQL script to fix permissions (30 seconds)

---

## ✅ Quick Fix (30 Seconds)

### Step 1: Open Supabase SQL Editor
```
1. Supabase Dashboard
2. Click "SQL Editor" in left sidebar
3. Click "New query"
```

### Step 2: Run This Script
```sql
-- Disable RLS on profiles table (simplest fix)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
```

### Step 3: Click "Run"
```
Click the "Run" button (or press Ctrl+Enter)
Should see: "Success. No rows returned"
```

### Step 4: Test
```
1. Go to your app: http://localhost:3000
2. If already logged in, refresh page
3. Check Dashboard - profile should load now! ✅
4. No more "Error loading profile" messages ✅
```

---

## 📋 Alternative: Run Complete Script

If you want more details, run the complete script:

1. Open `fix-profiles-access.sql` from your project
2. Copy entire contents
3. Paste in Supabase SQL Editor
4. Click "Run"
5. Check for success message

---

## 🧪 Verify It's Fixed

### Test 1: Sign In
```
1. Go to: http://localhost:3000/login
2. Sign in with your credentials
3. Should redirect to /
4. Dashboard Auth Header should show:
   - Your name ✅
   - Your email ✅
   - Role badge (Admin/MR) ✅
   - No errors in console ✅
```

### Test 2: Check Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Should NOT see:
   ❌ "Error loading profile"
4. Should be clean! ✅
```

### Test 3: Settings Page
```
1. Navigate to Settings tab
2. Auth Status Panel should show:
   - "Logged In" ✅
   - Your full name ✅
   - Your email ✅
   - Your role ✅
   - User ID ✅
   - No errors ✅
```

### Test 4: Refresh Works
```
1. Refresh browser (F5)
2. Should still be logged in ✅
3. Profile still loads ✅
4. No console errors ✅
```

---

## 🔍 What Was Wrong

### The Problem:
```
RLS (Row Level Security) was enabled on profiles table
→ Blocking authenticated users from reading profiles
→ Profile query failed
→ Console error: "Error loading profile"
→ Auth worked but profile didn't load
```

### The Fix:
```
Disabled RLS on profiles table
→ Authenticated users can now read profiles
→ Profile query succeeds
→ No more errors
→ Everything works! ✅
```

---

## 📊 Before vs After

### ❌ Before Fix:

```
Sign In
  → User authenticated ✅
  → Session created ✅
  → Profile query runs
  → RLS blocks access ❌
  → Error: "Error loading profile"
  → Auth Header shows: "Loading..."
  → Settings shows: incomplete data
```

### ✅ After Fix:

```
Sign In
  → User authenticated ✅
  → Session created ✅
  → Profile query runs ✅
  → RLS allows access ✅
  → Profile loads ✅
  → Auth Header shows: Full profile
  → Settings shows: All user data
  → Everything works! 🎉
```

---

## 🎯 Long-term Solution (Production)

For production, you'll want RLS enabled with proper policies:

### Run This Instead:
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow reading all profiles
CREATE POLICY "profiles_read" 
ON profiles FOR SELECT 
TO authenticated
USING (true);

-- Allow users to update only their own profile
CREATE POLICY "profiles_update" 
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
```

**But for now:** Just disable RLS for simplicity during development.

---

## 🆘 Troubleshooting

### Issue: Script fails to run

**Error:** "permission denied"

**Solution:**
- Make sure you're using Supabase SQL Editor (has admin permissions)
- Don't use psql or other tools
- Must be run as project owner

---

### Issue: Still getting error after running script

**Check:**
```sql
-- Verify RLS is disabled
SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles';
-- Should return: false (f)
```

**If still true (t):**
```sql
-- Force disable
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

---

### Issue: Profile shows but some fields missing

**Check profile data:**
```sql
SELECT * FROM profiles WHERE email = 'your-email@example.com';
```

**If profile missing:**
```sql
-- Create it manually
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '<user-id-from-auth.users>',
  'your-email@example.com',
  'Your Name',
  'mr'
);
```

**Get user ID:**
```sql
SELECT id FROM auth.users WHERE email = 'your-email@example.com';
```

---

### Issue: "Error loading profile" gone but profile not showing

**Check AuthContext state:**

In browser console:
```javascript
// Check if user is loaded
const { data } = await supabase.auth.getUser();
console.log('User:', data.user);

// Check if profile exists
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', data.user.id)
  .single();
console.log('Profile:', profile);
```

---

## ✅ Success Checklist

After running fix:

- [ ] SQL script ran successfully
- [ ] RLS disabled (or policies added)
- [ ] Signed in to app
- [ ] Dashboard Auth Header shows profile
- [ ] Settings shows "Logged In" with details
- [ ] No "Error loading profile" in console
- [ ] Refresh works (profile persists)
- [ ] All user info displays correctly

---

## 🎉 Final Verification

### Complete Test Flow:

```bash
# 1. Run SQL fix
Supabase Dashboard → SQL Editor → Run fix script

# 2. Test sign in
http://localhost:3000/login
Sign in with your credentials

# 3. Check Dashboard
Should show:
- Auth Header with your profile ✅
- Name, email, role badge ✅
- No console errors ✅

# 4. Check Settings
Should show:
- "Logged In" status ✅
- Full user details ✅
- Active session ✅

# 5. Refresh browser
Should still show everything ✅

# 6. Test logout
Should redirect to login ✅
App should still work ✅

All working? Phase 2 is 100% complete! 🎊
```

---

## 📝 Quick Reference

### The One-Line Fix:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Verify It Worked:
```sql
SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles';
-- Should return: false (f)
```

### Test Profile Access:
```sql
SELECT * FROM profiles LIMIT 5;
-- Should return rows without error
```

---

**⏱️ Time to Fix: 30 seconds**  
**Complexity: Very Easy**  
**Result: Profile loading works perfectly!**

🚀 **Run the fix now and test!**

