# 🔗 Phase 2 Integration Guide: How Login UI Will Work

**Phase 1 Status:** ✅ COMPLETE  
**Phase 2 Status:** ⏳ READY TO BUILD  
**Estimated Time:** 3-4 hours

---

## 🎯 Overview

This guide explains exactly how Phase 2 (Login UI) will integrate with the infrastructure built in Phase 1.

---

## 📦 Phase 2 Components

### 1. Login Screen (`/login`)

**What it does:**
- Displays email/password form
- Uses `AuthService.signIn()` from Phase 1
- Redirects to dashboard on success
- Shows errors on failure

**How it integrates:**
```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth'; // ← Uses Phase 1 service

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Uses AuthService from Phase 1 ✅
    const result = await AuthService.signIn({ email, password });
    
    if (result.success) {
      router.push('/'); // Redirect to app
    } else {
      alert(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

**Result:**
- User signs in → Supabase creates session
- Session saved to localStorage (auto from Phase 1)
- AuthContext detects session (auto from Phase 1)
- Profile loaded (auto from Phase 1)
- User redirected to dashboard

---

### 2. Wrap App with AuthProvider (`layout.tsx`)

**What it does:**
- Initializes auth state on app load
- Listens for auth changes
- Provides auth context to all components

**How it integrates:**
```tsx
import { AuthProvider } from '@/lib/auth'; // ← Uses Phase 1 context

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider> {/* ← Wraps entire app */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

**What happens on load:**
```
1. AuthProvider mounts
2. Checks localStorage for session
3. If session exists → calls supabase.auth.getSession()
4. If valid → loads profile from database
5. Updates state: { user, session, profile, role }
6. All components can now use useAuth()
```

**Result:**
- All pages have access to auth state
- Session persists across page refresh
- No need to manually check auth in each component

---

### 3. User Display in Header

**What it does:**
- Shows logged in user's email/name
- Shows role badge
- Provides logout option

**How it integrates:**
```tsx
'use client';

import { useAuth } from '@/lib/auth'; // ← Uses Phase 1 hook
import { LogoutButton } from '@/components/auth/LogoutButton';

export function Header() {
  const { user, profile, role, loading } = useAuth(); // ← Gets auth state
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) return null; // Or show login button
  
  return (
    <header>
      <div>
        <span>{profile?.full_name || user.email}</span>
        <span>Role: {role}</span>
      </div>
      <LogoutButton />
    </header>
  );
}
```

**Result:**
- Header shows user info
- Updates automatically when user signs in/out
- No manual state management needed

---

### 4. Logout Button Component

**What it does:**
- Signs out user
- Clears session
- Redirects to login

**How it integrates:**
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth'; // ← Uses Phase 1 service

export function LogoutButton() {
  const router = useRouter();
  
  async function handleLogout() {
    // Uses AuthService from Phase 1 ✅
    await AuthService.signOut();
    
    // Session cleared automatically
    // AuthContext updates automatically
    
    router.push('/login');
  }
  
  return <button onClick={handleLogout}>Logout</button>;
}
```

**What happens on logout:**
```
1. User clicks logout
2. AuthService.signOut() called
3. Supabase clears session
4. localStorage cleared
5. AuthContext detects change (via listener)
6. State updates: { user: null, profile: null, ... }
7. User redirected to /login
```

**Result:**
- One-click logout
- Complete session cleanup
- All auth state cleared

---

## 🔄 Complete Flow Diagrams

### Sign In Flow

```
User                     Login Screen              AuthService              Supabase Auth           AuthContext
  │                           │                        │                         │                      │
  │  Enter email/password     │                        │                         │                      │
  ├──────────────────────────>│                        │                         │                      │
  │                           │  signIn(email, pwd)    │                         │                      │
  │                           ├───────────────────────>│                         │                      │
  │                           │                        │  signInWithPassword()   │                      │
  │                           │                        ├────────────────────────>│                      │
  │                           │                        │                         │                      │
  │                           │                        │  Session + JWT          │                      │
  │                           │                        │<────────────────────────┤                      │
  │                           │  { success: true }     │                         │                      │
  │                           │<───────────────────────┤                         │                      │
  │                           │                        │                         │  onAuthStateChange   │
  │                           │                        │                         ├─────────────────────>│
  │                           │                        │                         │                      │
  │                           │                        │                         │  Load profile        │
  │                           │                        │                         │  Update state        │
  │  Redirect to dashboard    │                        │                         │                      │
  │<──────────────────────────┤                        │                         │                      │
  │                           │                        │                         │                      │
```

### Session Persistence Flow

```
Browser Refresh           AuthProvider            localStorage            Supabase              Database
     │                         │                       │                     │                     │
     │  App loads              │                       │                     │                     │
     ├────────────────────────>│                       │                     │                     │
     │                         │  Check session        │                     │                     │
     │                         ├──────────────────────>│                     │                     │
     │                         │  Session data         │                     │                     │
     │                         │<──────────────────────┤                     │                     │
     │                         │  getSession()         │                     │                     │
     │                         ├──────────────────────────────────────────>│                     │
     │                         │  Validate session     │                     │                     │
     │                         │<──────────────────────────────────────────┤                     │
     │                         │  Get profile          │                     │                     │
     │                         ├─────────────────────────────────────────────────────────────────>│
     │                         │  Profile data         │                     │                     │
     │                         │<─────────────────────────────────────────────────────────────────┤
     │  App ready (logged in)  │                       │                     │                     │
     │<────────────────────────┤                       │                     │                     │
```

### Logout Flow

```
User              LogoutButton           AuthService           Supabase           AuthContext           Router
  │                    │                     │                    │                    │                 │
  │  Click logout      │                     │                    │                    │                 │
  ├───────────────────>│                     │                    │                    │                 │
  │                    │  signOut()          │                    │                    │                 │
  │                    ├────────────────────>│                    │                    │                 │
  │                    │                     │  auth.signOut()    │                    │                 │
  │                    │                     ├───────────────────>│                    │                 │
  │                    │                     │                    │  Clear session     │                 │
  │                    │                     │                    │  Clear localStorage│                 │
  │                    │                     │  Done              │                    │                 │
  │                    │                     │<───────────────────┤                    │                 │
  │                    │  { success: true }  │                    │  onAuthStateChange │                 │
  │                    │<────────────────────┤                    ├───────────────────>│                 │
  │                    │                     │                    │                    │  Update state   │
  │                    │                     │                    │                    │  user = null    │
  │                    │  router.push('/login')                   │                    │                 │
  │                    ├─────────────────────────────────────────────────────────────────────────────>│
  │  Show login page   │                     │                    │                    │                 │
  │<───────────────────────────────────────────────────────────────────────────────────────────────────┤
```

---

## 🔌 Integration Points

### Point 1: Login Screen → AuthService

**File:** `src/app/login/page.tsx` (Phase 2)  
**Uses:** `AuthService.signIn()` (Phase 1)

```typescript
import { AuthService } from '@/lib/auth';

const result = await AuthService.signIn({ email, password });
// Returns: { success: true, userId: '...' }
// Or: { success: false, error: 'Invalid credentials' }
```

### Point 2: Root Layout → AuthProvider

**File:** `src/app/layout.tsx` (Phase 2 update)  
**Uses:** `AuthProvider` (Phase 1)

```tsx
import { AuthProvider } from '@/lib/auth';

<AuthProvider>
  {children}
</AuthProvider>
```

### Point 3: Components → useAuth Hook

**Files:** All components (Phase 2)  
**Uses:** `useAuth()` (Phase 1)

```tsx
import { useAuth } from '@/lib/auth';

const { user, profile, role, loading } = useAuth();
```

### Point 4: Logout → AuthService

**File:** `src/components/auth/LogoutButton.tsx` (Phase 2)  
**Uses:** `AuthService.signOut()` (Phase 1)

```typescript
import { AuthService } from '@/lib/auth';

await AuthService.signOut();
```

---

## 🎨 UI Components to Build (Phase 2)

### 1. Login Screen

**Location:** `src/app/login/page.tsx`

**Design:**
- Full-screen centered card
- Dark theme (bg-slate-900)
- Email input
- Password input
- Submit button
- Error message display
- Loading state

**Functionality:**
- Form validation
- Call `AuthService.signIn()`
- Show errors
- Redirect on success

---

### 2. Logout Button

**Location:** `src/components/auth/LogoutButton.tsx`

**Design:**
- Icon button (LogOut from lucide-react)
- Text: "Logout"
- Confirmation dialog
- Loading state

**Functionality:**
- Click → confirm
- Call `AuthService.signOut()`
- Redirect to /login

---

### 3. User Profile Display

**Location:** Update existing headers

**Design:**
- User email or full name
- Role badge (Admin/MR)
- Dropdown menu (future)

**Functionality:**
- Get from `useAuth()`
- Show loading state
- Handle no user

---

## ⚙️ Configuration (Before Phase 2)

### Step 1: Enable Supabase Auth

**In Supabase Dashboard:**
1. Go to Authentication → Settings
2. Enable Email provider
3. Site URL: `http://localhost:3000`
4. Redirect URLs: `http://localhost:3000/**`
5. Disable email confirmation (for testing)

### Step 2: Run SQL Script

**Run `enable-auth.sql`:**
1. Open Supabase SQL Editor
2. Paste script contents
3. Click "Run"
4. Verify success message

### Step 3: Create Test User

**Via Supabase Dashboard:**
- Email: `admin@test.com`
- Password: `admin123`
- User Metadata:
  ```json
  {
    "full_name": "Test Admin",
    "role": "admin"
  }
  ```

**Via Auth API (alternative):**
```typescript
await AuthService.signUp({
  email: 'admin@test.com',
  password: 'admin123',
  fullName: 'Test Admin',
  role: 'admin'
});
```

---

## 🧪 Testing Plan (Phase 2)

### Test 1: Sign In
1. Go to http://localhost:3000/login
2. Enter: `admin@test.com` / `admin123`
3. Click "Sign In"
4. **Expected:** Redirected to /
5. **Expected:** Header shows "Test Admin" and "Admin" role

### Test 2: Session Persistence
1. Sign in (as above)
2. Refresh browser (F5)
3. **Expected:** Still logged in
4. **Expected:** No redirect to login

### Test 3: Sign Out
1. Click "Logout" button
2. Confirm
3. **Expected:** Redirected to /login
4. **Expected:** Session cleared

### Test 4: Invalid Credentials
1. Go to /login
2. Enter: `wrong@test.com` / `wrongpassword`
3. **Expected:** Error: "Invalid email or password"
4. **Expected:** Stay on login screen

### Test 5: Backward Compatibility
1. Comment out AuthProvider wrapper
2. App should still work with DEFAULT_USER_ID
3. **Expected:** All features functional
4. **Expected:** No user display

---

## 📋 Phase 2 Checklist

### Prerequisites
- [ ] Supabase Auth enabled in dashboard
- [ ] `enable-auth.sql` executed successfully
- [ ] Test user created
- [ ] Verified profile created in database

### Components to Build
- [ ] Create `src/app/login/page.tsx`
- [ ] Create `src/components/auth/LogoutButton.tsx`
- [ ] Update `src/app/layout.tsx` (wrap with AuthProvider)
- [ ] Update main app header (add user display)
- [ ] Update admin header (add user display)

### Testing
- [ ] Test sign in with valid credentials
- [ ] Test sign in with invalid credentials
- [ ] Test session persistence (refresh)
- [ ] Test sign out
- [ ] Test role display
- [ ] Verify backward compatibility still works

### Documentation
- [ ] Update README with auth instructions
- [ ] Document test user credentials
- [ ] Add troubleshooting section

---

## 🚦 Phase 2 vs Phase 3

### Phase 2: Login UI (Optional Login)

**What changes:**
- ✅ Login screen available
- ✅ Users can sign in
- ✅ Session persists
- ✅ User info displayed
- ❌ Login NOT required
- ❌ Routes NOT protected
- ❌ App still works without login

**Use case:**
- Soft launch of auth
- Test authentication
- Allow both logged-in and default usage

---

### Phase 3: Route Protection (Required Login)

**What changes:**
- ✅ Login REQUIRED for all routes
- ✅ /admin protected (admin only)
- ✅ Middleware checks auth
- ✅ Unauthorized → redirect to login
- ✅ Role-based access control

**Use case:**
- Production deployment
- Multi-user environment
- Data isolation enforced

---

## 🎯 Success Criteria (Phase 2)

| Feature | Status |
|---------|--------|
| Login screen created | ⏳ TODO |
| Logout button created | ⏳ TODO |
| User display added | ⏳ TODO |
| AuthProvider wrapped | ⏳ TODO |
| Sign in works | ⏳ TODO |
| Sign out works | ⏳ TODO |
| Session persists | ⏳ TODO |
| Profile loads | ⏳ TODO |
| Role displays | ⏳ TODO |
| Build passes | ⏳ TODO |
| Backward compatible | ⏳ TODO |

---

## 💡 Tips for Phase 2

### Keep It Simple
- Start with basic login form
- Add polish later
- Focus on functionality first

### Test As You Go
- Test sign in after building login screen
- Test logout after building button
- Don't wait until everything is done

### Don't Break Existing App
- Keep AuthProvider optional (comment out if needed)
- Verify app works without auth
- Test with DEFAULT_USER_ID

### Security Notes (Phase 2)
- No route protection yet (Phase 3)
- No RLS yet (Phase 4)
- All data still accessible
- Login is optional

---

## 🚀 Ready for Phase 2?

**Check:**
- ✅ Phase 1 complete
- ⏳ Supabase Auth enabled
- ⏳ SQL script executed
- ⏳ Test user created

**Next command:**
```
"Build Phase 2: Login UI"
```

**Or:**
```
"Create login screen at /login with email/password form using AuthService from Phase 1"
```

---

**Phase 1:** ✅ **INFRASTRUCTURE COMPLETE**  
**Phase 2:** ⏳ **READY TO BUILD**  
**Estimated Time:** 3-4 hours

🔗 **All integration points ready. Let's build the UI!**

