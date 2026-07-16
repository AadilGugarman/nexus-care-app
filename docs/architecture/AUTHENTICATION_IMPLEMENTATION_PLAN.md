# 🔐 Authentication Implementation Plan

**Date:** July 16, 2026  
**Phase:** Authentication & Role System  
**Status:** PLANNING PHASE - DO NOT START CODING YET

---

## 📋 EXECUTIVE SUMMARY

This plan outlines the implementation of Supabase Authentication with role-based access control (RBAC) for the MR Route Planner application. The goal is to secure the application while maintaining the existing user experience and workflows.

**Key Objectives:**
1. Add Supabase Auth for user authentication
2. Implement role-based access (Admin, MR, Public)
3. Protect admin routes
4. Enable session persistence
5. Minimal UI disruption
6. Leverage existing database architecture

---

## 🎯 REQUIREMENTS ANALYSIS

### 1. Roles & Permissions

| Role | Access to /admin | Access to MR App | Access to Public (Future) |
|------|------------------|------------------|---------------------------|
| **Admin** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **MR** | ❌ Forbidden | ✅ Full Access | ✅ Read Only |
| **Public** | ❌ Forbidden | ❌ Forbidden | ✅ Read Only (Future) |

### 2. Current State Analysis

**Existing Architecture:**
- ✅ Profiles table ready (with role column)
- ✅ RLS policies defined (currently disabled)
- ✅ All tables have user_id foreign keys
- ✅ Auth trigger ready (needs to be created)
- ❌ Supabase Auth not enabled
- ❌ No login UI
- ❌ No session management
- ❌ No route protection

**What Works:**
- Database schema is auth-ready
- Services use `requireAuth()` (returns hardcoded user)
- RLS policies are defined (just disabled)
- All foreign keys reference profiles(id)

**What Needs Change:**
- Enable Supabase Auth in project
- Create login/logout UI
- Update `requireAuth()` to use real auth
- Enable RLS policies
- Add route middleware
- Create profile on signup
- Handle session persistence

---

## 🏗️ ARCHITECTURE OVERVIEW

### Current Flow (No Auth)
```
User → App → Supabase (anon key) → Database (RLS disabled)
                ↓
        DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'
```

### Target Flow (With Auth)
```
User → Login → Supabase Auth → JWT Token → Supabase Client
                                    ↓
                            Profile Created (trigger)
                                    ↓
                            Database (RLS enabled)
                                    ↓
                            Filter by auth.uid()
```

---

## 📦 COMPONENTS TO BUILD

### 1. Authentication Infrastructure

#### A. Supabase Configuration
**File:** `src/lib/supabase/client.ts`

**Changes:**
```typescript
// BEFORE (current)
export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function requireAuth(): Promise<string> {
  return DEFAULT_USER_ID; // Hardcoded
}

// AFTER (with auth)
export async function requireAuth(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getProfile() {
  const userId = await requireAuth();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}

export async function getUserRole(): Promise<'admin' | 'mr' | 'public'> {
  const profile = await getProfile();
  return profile?.role || 'mr';
}
```

#### B. Auth Context Provider
**New File:** `src/lib/auth/AuthContext.tsx`

**Purpose:** 
- Manage auth state globally
- Provide user, profile, role
- Handle login/logout
- Session persistence

**Exports:**
```typescript
export interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: 'admin' | 'mr' | 'public' | null;
  loading: boolean;
}

export const AuthProvider: React.FC
export const useAuth: () => AuthState
```

#### C. Protected Route Component
**New File:** `src/components/auth/ProtectedRoute.tsx`

**Purpose:**
- Wrap routes that need auth
- Check user role
- Redirect if unauthorized

**Usage:**
```typescript
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>
```

---

### 2. UI Components

#### A. Login Screen
**New File:** `src/app/login/page.tsx`

**Features:**
- Email + password login
- "Remember me" checkbox
- Error messages
- Loading state
- Redirect after login
- Link to signup (future)

**Design:**
- Full-screen centered card
- Dark theme consistent
- Mobile-first
- Same design language

#### B. Logout Component
**New File:** `src/components/auth/LogoutButton.tsx`

**Features:**
- Icon button in header
- Confirmation dialog
- Clear session
- Redirect to login

**Placement:**
- Main app header (top-right)
- Admin panel header (top-right)

#### C. User Profile Display
**New Component:** In existing headers

**Shows:**
- User name/email
- Role badge
- Dropdown menu (logout)

---

### 3. Route Protection

#### A. Middleware
**New File:** `src/middleware.ts`

**Purpose:**
- Intercept all requests
- Check authentication
- Check role for /admin
- Redirect if needed

**Logic:**
```typescript
if (path.startsWith('/admin')) {
  if (!user) redirect('/login');
  if (role !== 'admin') redirect('/');
}

if (path === '/') {
  if (!user) redirect('/login');
}
```

#### B. App-Level Protection
**Update:** `src/app/layout.tsx`

**Wrap with AuthProvider:**
```typescript
<AuthProvider>
  <SessionCheck />
  {children}
</AuthProvider>
```

---

### 4. Database Changes

#### A. Enable Supabase Auth
**In Supabase Dashboard:**
1. Go to Authentication → Settings
2. Enable Email provider
3. Set Site URL (for redirects)
4. Configure email templates

#### B. Create Profile Trigger
**SQL Script:** `enable-auth.sql`

```sql
-- Automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'mr')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### C. Enable RLS Policies
**SQL Script:** `enable-rls.sql`

```sql
-- Re-enable RLS on all tables (currently disabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_day_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Doctors table: Allow all authenticated users to read
-- Only admins can write
DROP POLICY IF EXISTS "allow_all_access" ON doctors;

CREATE POLICY "authenticated_users_read_doctors" 
  ON doctors FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "admins_write_doctors" 
  ON doctors FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

#### D. Migrate Default User Data
**SQL Script:** `migrate-default-user.sql`

```sql
-- Move data from default user to first real user
-- Run this after first admin signs up

-- Variables (replace with actual values)
DO $$
DECLARE
  default_user_id UUID := '00000000-0000-0000-0000-000000000001';
  new_admin_id UUID := '<FIRST_ADMIN_USER_ID>';
BEGIN
  -- Update user_routes
  UPDATE user_routes
  SET user_id = new_admin_id
  WHERE user_id = default_user_id;

  -- Update doctor_day_assignments
  UPDATE doctor_day_assignments
  SET user_id = new_admin_id
  WHERE user_id = default_user_id;

  -- Update doctor_visits
  UPDATE doctor_visits
  SET user_id = new_admin_id
  WHERE user_id = default_user_id;

  -- Update deleted_doctors
  UPDATE deleted_doctors
  SET user_id = new_admin_id
  WHERE user_id = default_user_id;

  -- Update user_settings
  UPDATE user_settings
  SET user_id = new_admin_id
  WHERE user_id = default_user_id;

  -- Delete default profile
  DELETE FROM profiles WHERE id = default_user_id;
END $$;
```

---

## 📝 IMPLEMENTATION STEPS

### Phase 1: Infrastructure Setup (No UI Changes)

#### Step 1.1: Enable Supabase Auth
- [ ] Go to Supabase Dashboard
- [ ] Enable Email Authentication
- [ ] Configure Site URL: `http://localhost:3000`
- [ ] Set redirect URLs
- [ ] Customize email templates (optional)

#### Step 1.2: Database Changes
- [ ] Run `enable-auth.sql` (create trigger)
- [ ] Keep RLS disabled for now (enable in Phase 3)
- [ ] Verify trigger works (test signup)

#### Step 1.3: Update Supabase Client
- [ ] Update `src/lib/supabase/client.ts`
- [ ] Implement real `requireAuth()`
- [ ] Add `getProfile()`
- [ ] Add `getUserRole()`
- [ ] Keep backward compatibility

**Testing:**
- Create test user manually in Supabase
- Verify trigger creates profile
- Test `requireAuth()` returns real user ID

---

### Phase 2: Authentication UI

#### Step 2.1: Create Auth Context
- [ ] Create `src/lib/auth/AuthContext.tsx`
- [ ] Implement `AuthProvider`
- [ ] Implement `useAuth` hook
- [ ] Handle session persistence
- [ ] Listen to auth state changes

#### Step 2.2: Build Login Screen
- [ ] Create `src/app/login/page.tsx`
- [ ] Email/password form
- [ ] Error handling
- [ ] Loading states
- [ ] Remember me
- [ ] Redirect logic

#### Step 2.3: Add Logout
- [ ] Create `src/components/auth/LogoutButton.tsx`
- [ ] Add to main app header
- [ ] Add to admin header
- [ ] Clear session on logout

#### Step 2.4: User Profile Display
- [ ] Show user info in header
- [ ] Show role badge
- [ ] Dropdown menu

**Testing:**
- Login with test user
- Check session persists on refresh
- Logout and verify redirect
- Check profile displays correctly

---

### Phase 3: Route Protection

#### Step 3.1: Create Middleware
- [ ] Create `src/middleware.ts`
- [ ] Protect `/admin` routes
- [ ] Protect main app `/`
- [ ] Allow `/login` publicly
- [ ] Redirect logic

#### Step 3.2: Add Protected Route Component
- [ ] Create `src/components/auth/ProtectedRoute.tsx`
- [ ] Check authentication
- [ ] Check role
- [ ] Show loading state
- [ ] Redirect if unauthorized

#### Step 3.3: Wrap Admin Routes
- [ ] Update `src/app/admin/layout.tsx`
- [ ] Wrap in `<ProtectedRoute requiredRole="admin">`
- [ ] Show "Access Denied" for MR users

#### Step 3.4: Wrap Main App
- [ ] Update `src/app/layout.tsx`
- [ ] Wrap in `<AuthProvider>`
- [ ] Add session check component
- [ ] Redirect to login if not authenticated

**Testing:**
- Try accessing /admin as MR user (should redirect)
- Try accessing / without login (should redirect)
- Login as admin (should access both)
- Login as MR (should access only main app)

---

### Phase 4: Enable RLS & Data Isolation

#### Step 4.1: Enable RLS Policies
- [ ] Run `enable-rls.sql`
- [ ] Test each table's policies
- [ ] Verify users see only their data

#### Step 4.2: Update Services
- [ ] Verify all services use `requireAuth()`
- [ ] Remove hardcoded DEFAULT_USER_ID
- [ ] Test CRUD operations with real auth

#### Step 4.3: Migrate Default User Data
- [ ] Create first admin account
- [ ] Run `migrate-default-user.sql`
- [ ] Verify all data transferred
- [ ] Delete default profile

**Testing:**
- Create 2 test users
- Verify each sees only their routes/visits
- Verify both see same doctors (shared)
- Admin can modify doctors, MR cannot

---

### Phase 5: Polish & Edge Cases

#### Step 5.1: Session Management
- [ ] Handle session expiry
- [ ] Refresh tokens automatically
- [ ] Show "Session expired" message
- [ ] Auto-redirect to login

#### Step 5.2: Error Handling
- [ ] Handle auth errors gracefully
- [ ] Show user-friendly messages
- [ ] Log technical errors
- [ ] Provide retry options

#### Step 5.3: Loading States
- [ ] Show loading during auth check
- [ ] Skeleton screens for protected pages
- [ ] Prevent flash of wrong content

#### Step 5.4: Edge Cases
- [ ] Handle no internet connection
- [ ] Handle Supabase downtime
- [ ] Handle invalid tokens
- [ ] Handle role changes

**Testing:**
- Simulate session expiry
- Simulate network errors
- Test all error scenarios
- Verify UX is smooth

---

## 🎨 UI/UX SPECIFICATIONS

### Login Screen Design

```
┌─────────────────────────────────────┐
│                                     │
│         🔐 MR Route Planner         │
│                                     │
│    ┌─────────────────────────┐    │
│    │                         │    │
│    │  Email                  │    │
│    │  [email@example.com]    │    │
│    │                         │    │
│    │  Password               │    │
│    │  [••••••••••••]        │    │
│    │                         │    │
│    │  ☐ Remember me          │    │
│    │                         │    │
│    │  [    Login    ]        │    │
│    │                         │    │
│    │  Forgot password?       │    │
│    │                         │    │
│    └─────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Colors:**
- Background: `bg-slate-900`
- Card: `bg-slate-800 border-slate-700`
- Inputs: `bg-slate-700 border-slate-600`
- Button: `bg-blue-600 hover:bg-blue-700`

### User Menu (Header)

```
┌─────────────────────────────┐
│  MR Route Planner    [👤▼] │
└─────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │ John Doe         │
              │ john@example.com │
              │ 🔵 Admin         │
              ├──────────────────┤
              │ 🚪 Logout        │
              └──────────────────┘
```

### Access Denied Screen

```
┌─────────────────────────────────────┐
│                                     │
│            ⛔ Access Denied          │
│                                     │
│  You don't have permission to      │
│  access this page.                 │
│                                     │
│  Your role: MR                     │
│  Required: Admin                   │
│                                     │
│  [  Back to Dashboard  ]           │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔄 SERVICE UPDATES

### services/doctors.service.ts
**Current:**
```typescript
static async getAllDoctors(): Promise<DoctorRow[]> {
  // In single-user mode, skip auth check
  const { data, error } = await doctorsTable()
    .select('*')
    .order('doctor_name');
  
  if (error) throw error;
  return data ?? [];
}
```

**After Auth:**
```typescript
static async getAllDoctors(): Promise<DoctorRow[]> {
  // Verify authenticated (RLS handles filtering)
  await requireAuth();
  
  const { data, error } = await doctorsTable()
    .select('*')
    .order('doctor_name');
  
  if (error) throw error;
  return data ?? [];
}
```

### All Other Services
**Change:** Uncomment `requireAuth()` calls that were added but commented out

**No Logic Changes:** RLS policies handle data filtering automatically

---

## 🧪 TESTING STRATEGY

### Unit Tests (Future)
- [ ] Test `requireAuth()` with valid token
- [ ] Test `requireAuth()` with invalid token
- [ ] Test `getUserRole()` returns correct role
- [ ] Test `getProfile()` returns profile

### Integration Tests
- [ ] Test login flow end-to-end
- [ ] Test logout flow
- [ ] Test session persistence
- [ ] Test role-based access

### Manual Testing Checklist

#### As Admin:
- [ ] Can login
- [ ] Can access /
- [ ] Can access /admin
- [ ] Can see all doctors
- [ ] Can edit doctors
- [ ] Can import doctors
- [ ] Can logout

#### As MR:
- [ ] Can login
- [ ] Can access /
- [ ] Cannot access /admin (redirected)
- [ ] Can see all doctors
- [ ] Cannot edit doctors in admin (no access)
- [ ] Can create own routes
- [ ] Can see only own routes
- [ ] Can logout

#### Session:
- [ ] Login persists on refresh
- [ ] Login persists on browser close (if "remember me")
- [ ] Session expires after timeout
- [ ] Logout clears session
- [ ] Cannot access protected routes after logout

---

## 🚨 RISKS & MITIGATION

### Risk 1: Data Loss During Migration
**Risk:** Moving data from default user to real user could fail

**Mitigation:**
- Backup database before migration
- Test migration script on staging
- Run migration in transaction
- Verify data after migration
- Keep default user data temporarily

### Risk 2: RLS Locks Out Users
**Risk:** Enabling RLS could prevent access to existing data

**Mitigation:**
- Test RLS policies before enabling
- Enable table-by-table
- Have rollback script ready
- Monitor logs after enabling
- Gradual rollout

### Risk 3: Session Issues
**Risk:** Users get logged out unexpectedly

**Mitigation:**
- Set reasonable session timeout (7 days)
- Implement auto-refresh
- Handle expired sessions gracefully
- Show clear error messages
- Allow easy re-login

### Risk 4: Breaking Existing Workflows
**Risk:** Auth changes break current functionality

**Mitigation:**
- Extensive testing before deploy
- Maintain backward compatibility during transition
- Deploy to staging first
- Rollback plan ready
- Monitor error logs

---

## 📊 IMPLEMENTATION TIMELINE

### Phase 1: Infrastructure (2-3 hours)
- Enable Supabase Auth: 30 min
- Database changes: 1 hour
- Update client: 1 hour

### Phase 2: Authentication UI (3-4 hours)
- Auth Context: 1 hour
- Login screen: 1 hour
- Logout: 30 min
- User display: 1 hour

### Phase 3: Route Protection (2-3 hours)
- Middleware: 1 hour
- Protected routes: 1 hour
- Wrap layouts: 30 min

### Phase 4: Enable RLS (2-3 hours)
- Enable policies: 1 hour
- Update services: 30 min
- Data migration: 1 hour

### Phase 5: Polish (2-3 hours)
- Session management: 1 hour
- Error handling: 1 hour
- Edge cases: 30 min

**Total Estimated Time:** 11-16 hours

**Recommended Approach:** Implement over 2-3 days with testing between phases

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

Before starting implementation, verify:

- [ ] **Supabase project has auth enabled**
- [ ] **Email provider configured in Supabase**
- [ ] **Site URL set correctly**
- [ ] **Database backup taken**
- [ ] **Test users created for testing**
- [ ] **Understanding of RLS policies**
- [ ] **Rollback plan prepared**
- [ ] **Staging environment available** (optional)

---

## 📚 REFERENCE DOCUMENTATION

### Supabase Docs
- Authentication: https://supabase.com/docs/guides/auth
- RLS Policies: https://supabase.com/docs/guides/auth/row-level-security
- Auth Helpers: https://supabase.com/docs/guides/auth/auth-helpers/nextjs

### Files to Create
1. `src/lib/auth/AuthContext.tsx`
2. `src/components/auth/ProtectedRoute.tsx`
3. `src/components/auth/LogoutButton.tsx`
4. `src/app/login/page.tsx`
5. `src/middleware.ts`
6. `enable-auth.sql`
7. `enable-rls.sql`
8. `migrate-default-user.sql`

### Files to Update
1. `src/lib/supabase/client.ts`
2. `src/app/layout.tsx`
3. `src/app/admin/layout.tsx`
4. All service files (uncomment `requireAuth()`)

---

## ✅ SUCCESS CRITERIA

Authentication implementation is successful when:

1. ✅ Users must login to access app
2. ✅ Session persists across browser refresh
3. ✅ Admin users can access /admin
4. ✅ MR users cannot access /admin
5. ✅ Each user sees only their own data (routes, visits)
6. ✅ All users see shared doctors
7. ✅ Logout works and clears session
8. ✅ No existing workflows broken
9. ✅ UI remains consistent
10. ✅ Performance not degraded

---

## 🎯 APPROVAL REQUIRED

**Before proceeding with implementation, confirm:**

1. ✅ Plan reviewed and understood
2. ✅ Timeline acceptable
3. ✅ Risks acceptable
4. ✅ Ready to enable Supabase Auth
5. ✅ Ready to change RLS settings
6. ✅ Backup plan in place

**Status:** ⏸️ AWAITING APPROVAL TO PROCEED

---

**Plan Created:** July 16, 2026  
**Next Step:** Review plan and get approval before coding  
**Estimated Completion:** 2-3 days after approval

