# 🧪 Phase 2 Testing Guide

**Phase:** Authentication UI  
**Status:** Ready to Test  
**Date:** July 16, 2026

---

## 🚀 Quick Start

### 1. Start Development Server

```bash
cd "c:\New folder"
npm run dev
```

Wait for: `Ready on http://localhost:3000`

---

## ✅ Test Checklist

### Test 1: App Without Login ✅

**Goal:** Verify app still works without authentication

**Steps:**
1. Open browser in incognito/private mode
2. Go to `http://localhost:3000`
3. Navigate through all tabs (Dashboard, Locations, Days, Routes, Today, Settings)
4. Try creating a doctor
5. Try editing a doctor
6. Go to Settings tab
7. Check auth status panel

**Expected Results:**
- ✅ App loads normally
- ✅ All 674 doctors visible
- ✅ Can create/edit doctors
- ✅ All features work
- ✅ Settings shows "Not Logged In"
- ✅ "Sign In" / "Sign Up" buttons visible

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 2: Login Screen ✅

**Goal:** Verify login page displays correctly

**Steps:**
1. Go to `http://localhost:3000/login`
2. Check page layout
3. Check "Forgot password?" link
4. Check "Create Account" link
5. Check "Continue without signing in" link
6. Try submitting empty form
7. Try entering invalid email format

**Expected Results:**
- ✅ Page loads with dark theme
- ✅ Form has email and password fields
- ✅ All links work
- ✅ Validation works
- ✅ Error messages show for invalid input

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 3: Signup Screen ✅

**Goal:** Verify signup page displays correctly

**Steps:**
1. Go to `http://localhost:3000/signup`
2. Check page layout
3. Try submitting empty form
4. Try mismatched passwords
5. Try password < 6 characters
6. Check "Already have an account?" link
7. Check "Continue without signing in" link

**Expected Results:**
- ✅ Page loads with all fields
- ✅ Validation works correctly
- ✅ Error messages display
- ✅ Links work
- ✅ Form validates before submit

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 4: Forgot Password Screen ✅

**Goal:** Verify forgot password page displays

**Steps:**
1. Go to `http://localhost:3000/forgot-password`
2. Check page layout
3. Try submitting empty form
4. Try invalid email format
5. Check "Back to Login" link

**Expected Results:**
- ✅ Page loads correctly
- ✅ Email field works
- ✅ Validation works
- ✅ Back link works

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 5: Navigation Between Auth Pages ✅

**Goal:** Verify all links between auth pages work

**Steps:**
1. Start at `/login`
2. Click "Create Account" → should go to `/signup`
3. Click "Already have an account?" → should go to `/login`
4. Click "Forgot?" → should go to `/forgot-password`
5. Click "Back to Login" → should go to `/login`
6. Click "Continue without signing in" → should go to `/`

**Expected Results:**
- ✅ All navigation links work
- ✅ No broken links
- ✅ Redirects work correctly

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 6: Auth Status Panel (Not Logged In) ✅

**Goal:** Verify auth status shows correctly when not logged in

**Steps:**
1. Clear browser data (or use incognito)
2. Go to `http://localhost:3000`
3. Navigate to Settings tab
4. Scroll to "Authentication Status" section
5. Check status display
6. Check buttons

**Expected Results:**
- ✅ Shows "Not Logged In"
- ✅ Shows "Using default user mode"
- ✅ Shows "Guest Access" badge
- ✅ "Sign In" button visible
- ✅ "Sign Up" button visible
- ✅ Buttons work (navigate to auth pages)

**Status:** ⬜ Pass / ⬜ Fail

---

## 🔐 Advanced Tests (Requires Supabase Auth Enabled)

### Test 7: Sign Up Flow (Requires Setup) 🔧

**Prerequisites:**
- Supabase Auth enabled
- `enable-auth.sql` executed
- Email provider configured

**Steps:**
1. Go to `/signup`
2. Enter:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Password: "test123"
   - Confirm Password: "test123"
3. Submit form
4. Wait for success screen
5. Wait for auto-redirect to `/login`
6. Check Supabase Dashboard → Authentication → Users
7. Check profiles table in database

**Expected Results:**
- ✅ Success screen shows
- ✅ Auto-redirects to `/login` after 2 seconds
- ✅ User created in auth.users
- ✅ Profile created in profiles table
- ✅ Profile has correct data (name, email, role='mr')

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Yet Tested

---

### Test 8: Sign In Flow (Requires Test User) 🔧

**Prerequisites:**
- Test user created (from Test 7)
- OR admin user created manually

**Steps:**
1. Go to `/login`
2. Enter test credentials:
   - Email: "test@example.com"
   - Password: "test123"
3. Submit form
4. Check redirect
5. Go to Settings
6. Check auth status panel

**Expected Results:**
- ✅ Redirects to `/` (home page)
- ✅ Settings shows "Logged In"
- ✅ Shows user's full name
- ✅ Shows user's email
- ✅ Shows user's role (💼 MR)
- ✅ Shows user ID
- ✅ Logout button visible
- ✅ "Active Session" badge shown

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Yet Tested

---

### Test 9: Session Persistence (Requires Login) 🔧

**Prerequisites:**
- Signed in (from Test 8)

**Steps:**
1. Sign in (if not already)
2. Go to Settings, confirm "Logged In"
3. Refresh browser (F5 or Ctrl+R)
4. Wait for page to load
5. Go to Settings again
6. Check auth status

**Expected Results:**
- ✅ Page reloads successfully
- ✅ Still shows "Logged In"
- ✅ User info still displayed
- ✅ No redirect to login
- ✅ Session persisted

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Yet Tested

---

### Test 10: Logout Flow (Requires Login) 🔧

**Prerequisites:**
- Signed in

**Steps:**
1. Sign in (if not already)
2. Go to Settings
3. Click "Logout" button
4. Confirm in dialog
5. Wait for redirect
6. Check current page
7. Go back to `/` (if not there)
8. Go to Settings
9. Check auth status

**Expected Results:**
- ✅ Confirmation dialog shows
- ✅ Redirects to `/login`
- ✅ Session cleared
- ✅ Can navigate to `/`
- ✅ Settings shows "Not Logged In"
- ✅ "Sign In" / "Sign Up" buttons visible
- ✅ App still works (uses DEFAULT_USER_ID)

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Yet Tested

---

### Test 11: Invalid Credentials (Requires Setup) 🔧

**Prerequisites:**
- Supabase Auth enabled

**Steps:**
1. Go to `/login`
2. Enter wrong credentials:
   - Email: "wrong@example.com"
   - Password: "wrongpassword"
3. Submit form
4. Check error message

**Expected Results:**
- ✅ Error message shows
- ✅ Error is user-friendly (e.g., "Invalid email or password")
- ✅ Stays on login page
- ✅ Form fields remain editable

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Yet Tested

---

### Test 12: Forgot Password Flow (Requires Setup) 🔧

**Prerequisites:**
- Supabase Auth enabled
- Email provider configured

**Steps:**
1. Go to `/forgot-password`
2. Enter: "test@example.com"
3. Submit form
4. Check success screen
5. Check email inbox (or Supabase logs)

**Expected Results:**
- ✅ Success screen shows
- ✅ Shows "Check Your Email"
- ✅ Shows entered email
- ✅ "Back to Login" button works
- ✅ Password reset email sent (check logs)

**Status:** ⬜ Pass / ⬜ Fail / ⬜ Not Yet Tested

---

## 🎨 Visual/UX Tests

### Test 13: Dark Theme Consistency ✅

**Goal:** Verify all auth pages match app's dark theme

**Steps:**
1. Visit `/login`, `/signup`, `/forgot-password`
2. Check colors match:
   - Background: Dark slate
   - Cards: Darker slate with border
   - Text: White/light gray
   - Buttons: Blue primary
3. Compare with main app theme

**Expected Results:**
- ✅ All pages use dark theme
- ✅ Colors consistent with app
- ✅ No light theme elements
- ✅ Good contrast ratios

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 14: Mobile Responsive ✅

**Goal:** Verify auth pages work on mobile

**Steps:**
1. Open DevTools (F12)
2. Toggle device toolbar (mobile view)
3. Visit `/login`, `/signup`, `/forgot-password`
4. Try different screen sizes:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
5. Check form usability
6. Check buttons are touch-friendly

**Expected Results:**
- ✅ Pages fit screen width
- ✅ No horizontal scroll
- ✅ Forms are usable
- ✅ Buttons are large enough
- ✅ Text is readable
- ✅ Layout adapts to screen size

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 15: Loading States ✅

**Goal:** Verify loading indicators work

**Steps:**
1. Go to `/login`
2. Enter valid credentials (if have them)
3. Click "Sign In"
4. Observe button during submission
5. Repeat for `/signup` and `/forgot-password`

**Expected Results:**
- ✅ Button shows loading spinner
- ✅ Button text changes (e.g., "Signing in...")
- ✅ Button is disabled during loading
- ✅ Form is disabled during loading
- ✅ Loading state clears after response

**Status:** ⬜ Pass / ⬜ Fail

---

## 🐛 Edge Case Tests

### Test 16: Double Submit Prevention ✅

**Goal:** Verify form can't be submitted twice

**Steps:**
1. Go to `/login`
2. Enter credentials
3. Click "Sign In"
4. Immediately click again (multiple times)
5. Check if multiple requests sent

**Expected Results:**
- ✅ Only one request sent
- ✅ Button disabled after first click
- ✅ No duplicate submissions

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 17: Browser Back Button ✅

**Goal:** Verify navigation works with browser back/forward

**Steps:**
1. Go to `/login`
2. Click "Create Account" → `/signup`
3. Click browser back button
4. Should be at `/login`
5. Click browser forward button
6. Should be at `/signup`

**Expected Results:**
- ✅ Browser back/forward work
- ✅ Page state maintained
- ✅ No errors in console

**Status:** ⬜ Pass / ⬜ Fail

---

### Test 18: Direct URL Access ✅

**Goal:** Verify auth pages accessible via direct URL

**Steps:**
1. Open new tab
2. Directly go to:
   - `http://localhost:3000/login`
   - `http://localhost:3000/signup`
   - `http://localhost:3000/forgot-password`
3. Check each loads correctly

**Expected Results:**
- ✅ All pages load correctly
- ✅ No 404 errors
- ✅ Pages are functional

**Status:** ⬜ Pass / ⬜ Fail

---

## 📊 Test Results Summary

### Basic Tests (No Auth Required)
- [ ] Test 1: App Without Login
- [ ] Test 2: Login Screen
- [ ] Test 3: Signup Screen
- [ ] Test 4: Forgot Password Screen
- [ ] Test 5: Navigation
- [ ] Test 6: Auth Status Panel

**Status:** ___ / 6 passed

### Advanced Tests (Requires Supabase Auth)
- [ ] Test 7: Sign Up Flow
- [ ] Test 8: Sign In Flow
- [ ] Test 9: Session Persistence
- [ ] Test 10: Logout Flow
- [ ] Test 11: Invalid Credentials
- [ ] Test 12: Forgot Password Flow

**Status:** ___ / 6 passed

### Visual/UX Tests
- [ ] Test 13: Dark Theme
- [ ] Test 14: Mobile Responsive
- [ ] Test 15: Loading States

**Status:** ___ / 3 passed

### Edge Cases
- [ ] Test 16: Double Submit
- [ ] Test 17: Browser Navigation
- [ ] Test 18: Direct URL Access

**Status:** ___ / 3 passed

---

## 🔧 Setup Required for Advanced Tests

### Step 1: Enable Supabase Auth

1. Go to Supabase Dashboard
2. Navigate to: Authentication → Settings
3. Enable "Email" provider
4. Set Site URL: `http://localhost:3000`
5. Set Redirect URLs: `http://localhost:3000/**`
6. Disable "Confirm email" (for testing)
7. Save changes

### Step 2: Run SQL Script

1. Go to Supabase Dashboard
2. Navigate to: SQL Editor
3. Click "New query"
4. Open `enable-auth.sql` from project
5. Copy and paste entire contents
6. Click "Run"
7. Verify success message

### Step 3: Create Test User (Optional)

**Method 1: Via Signup Screen (Recommended)**
1. Go to `http://localhost:3000/signup`
2. Fill form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "test123"
3. Submit
4. Use these credentials for testing

**Method 2: Via Supabase Dashboard**
1. Go to: Authentication → Users
2. Click "Add User"
3. Enter:
   - Email: `admin@test.com`
   - Password: `admin123`
   - User Metadata:
     ```json
     {
       "full_name": "Test Admin",
       "role": "admin"
     }
     ```
4. Click "Create user"

---

## 🎯 Success Criteria

**Phase 2 is successful if:**

### Basic Functionality
- ✅ All auth pages load without errors
- ✅ All navigation links work
- ✅ Forms validate input correctly
- ✅ App works without login (backward compatibility)
- ✅ Auth status panel shows correct state

### With Auth Enabled
- ✅ Sign up creates user and profile
- ✅ Sign in authenticates and creates session
- ✅ Session persists across refresh
- ✅ Logout clears session and redirects
- ✅ App still works after logout

### Visual/UX
- ✅ Dark theme consistent across all pages
- ✅ Mobile responsive
- ✅ Loading states work
- ✅ Error messages display correctly

---

## 📝 Notes

### Known Limitations
1. **Email verification disabled** - For testing convenience
2. **RLS not enabled** - All data accessible to everyone
3. **No route protection** - Login not required
4. **DEFAULT_USER_ID fallback** - App works without auth

### These are EXPECTED
- App works without login ✅
- Logged in and logged out users see same data ✅
- No admin role enforcement ✅
- All routes accessible ✅

---

## 🚀 Quick Test Commands

### Build
```bash
npm run build
```

### Dev Server
```bash
npm run dev
```

### TypeScript Check
```bash
npx tsc --noEmit
```

---

## 📞 Troubleshooting

### Issue: "Failed to sign in"
**Solution:** Check if Supabase Auth is enabled and credentials are correct

### Issue: "Profile not created"
**Solution:** Verify `enable-auth.sql` was run successfully

### Issue: "Session not persisting"
**Solution:** Check browser localStorage (should have supabase session data)

### Issue: "App broken after adding auth"
**Solution:** Verify DEFAULT_USER_ID fallback is working (check console logs)

---

**Ready to test Phase 2! Start with basic tests (no auth required) first.** ✅

