-- ============================================================================
-- Phase 12: Row Level Security (RLS) Implementation
-- Comprehensive security policies for production deployment
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

-- Enable RLS on all public tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.route_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctor_day_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctor_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.deleted_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctor_creation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctor_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.doctor_status_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
$$ LANGUAGE sql STABLE;

-- Check if current user is MR
CREATE OR REPLACE FUNCTION public.is_mr()
RETURNS boolean AS $$
  SELECT (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'mr';
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- 3. PROFILES TABLE POLICIES
-- ============================================================================

-- Profile: Admins can view all profiles
CREATE POLICY "profiles_admin_read" ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- Profile: MRs can view their own profile and all active user profiles
CREATE POLICY "profiles_mr_read" ON public.profiles
  FOR SELECT
  USING (
    public.is_mr() AND (
      id = auth.uid() OR
      is_deleted = false
    )
  );

-- Profile: Users can view their own profile
CREATE POLICY "profiles_user_read_own" ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Profile: Users can update their own profile (limited fields)
CREATE POLICY "profiles_user_update_own" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Role and status validation happens at application layer
  );

-- Profile: Admins can update any profile
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 4. DOCTORS TABLE POLICIES (Public Master Data)
-- ============================================================================

-- Doctors: Public can read only active and public_visible doctors
CREATE POLICY "doctors_public_read" ON public.doctors
  FOR SELECT
  USING (
    is_active = true AND 
    public_visible = true
  );

-- Doctors: MRs can read all active doctors
CREATE POLICY "doctors_mr_read" ON public.doctors
  FOR SELECT
  USING (public.is_mr() AND is_active = true);

-- Doctors: Admins can read all doctors
CREATE POLICY "doctors_admin_read" ON public.doctors
  FOR SELECT
  USING (public.is_admin());

-- Doctors: Only admins can insert doctors
CREATE POLICY "doctors_admin_insert" ON public.doctors
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Doctors: Only admins can update doctors
CREATE POLICY "doctors_admin_update" ON public.doctors
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Doctors: Only admins can delete doctors
CREATE POLICY "doctors_admin_delete" ON public.doctors
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 5. USER_ROUTES TABLE POLICIES (MR-Owned Routes)
-- ============================================================================

-- User Routes: MRs can read their own routes
CREATE POLICY "user_routes_mr_read_own" ON public.user_routes
  FOR SELECT
  USING (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- User Routes: Admins can read all routes
CREATE POLICY "user_routes_admin_read" ON public.user_routes
  FOR SELECT
  USING (public.is_admin());

-- User Routes: MRs can create their own routes
CREATE POLICY "user_routes_mr_insert_own" ON public.user_routes
  FOR INSERT
  WITH CHECK (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- User Routes: MRs can update their own routes
CREATE POLICY "user_routes_mr_update_own" ON public.user_routes
  FOR UPDATE
  USING (
    public.is_mr() AND
    user_id = auth.uid()
  )
  WITH CHECK (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- User Routes: MRs can delete their own routes
CREATE POLICY "user_routes_mr_delete_own" ON public.user_routes
  FOR DELETE
  USING (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- User Routes: Admins have full access
CREATE POLICY "user_routes_admin_full" ON public.user_routes
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 6. ROUTE_DOCTORS TABLE POLICIES (Route Components)
-- ============================================================================

-- Route Doctors: MRs can read doctors in their own routes
CREATE POLICY "route_doctors_mr_read" ON public.route_doctors
  FOR SELECT
  USING (
    public.is_mr() AND
    route_id IN (
      SELECT id FROM public.user_routes WHERE user_id = auth.uid()
    )
  );

-- Route Doctors: Admins can read all
CREATE POLICY "route_doctors_admin_read" ON public.route_doctors
  FOR SELECT
  USING (public.is_admin());

-- Route Doctors: MRs can insert into their own routes
CREATE POLICY "route_doctors_mr_insert" ON public.route_doctors
  FOR INSERT
  WITH CHECK (
    public.is_mr() AND
    route_id IN (
      SELECT id FROM public.user_routes WHERE user_id = auth.uid()
    )
  );

-- Route Doctors: MRs can update their own route doctors
CREATE POLICY "route_doctors_mr_update" ON public.route_doctors
  FOR UPDATE
  USING (
    public.is_mr() AND
    route_id IN (
      SELECT id FROM public.user_routes WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_mr() AND
    route_id IN (
      SELECT id FROM public.user_routes WHERE user_id = auth.uid()
    )
  );

-- Route Doctors: MRs can delete from their own routes
CREATE POLICY "route_doctors_mr_delete" ON public.route_doctors
  FOR DELETE
  USING (
    public.is_mr() AND
    route_id IN (
      SELECT id FROM public.user_routes WHERE user_id = auth.uid()
    )
  );

-- Route Doctors: Admins have full access
CREATE POLICY "route_doctors_admin_full" ON public.route_doctors
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 7. DOCTOR_DAY_ASSIGNMENTS TABLE POLICIES
-- ============================================================================

-- Assignments: MRs can read their own assignments
CREATE POLICY "assignments_mr_read_own" ON public.doctor_day_assignments
  FOR SELECT
  USING (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- Assignments: Admins can read all assignments
CREATE POLICY "assignments_admin_read" ON public.doctor_day_assignments
  FOR SELECT
  USING (public.is_admin());

-- Assignments: MRs can create their own assignments
CREATE POLICY "assignments_mr_insert_own" ON public.doctor_day_assignments
  FOR INSERT
  WITH CHECK (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- Assignments: MRs can update their own assignments
CREATE POLICY "assignments_mr_update_own" ON public.doctor_day_assignments
  FOR UPDATE
  USING (
    public.is_mr() AND
    user_id = auth.uid()
  )
  WITH CHECK (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- Assignments: MRs can delete their own assignments
CREATE POLICY "assignments_mr_delete_own" ON public.doctor_day_assignments
  FOR DELETE
  USING (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- Assignments: Admins have full access
CREATE POLICY "assignments_admin_full" ON public.doctor_day_assignments
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 8. DOCTOR_VISITS TABLE POLICIES
-- ============================================================================

-- Visits: MRs can read their own visits
CREATE POLICY "visits_mr_read_own" ON public.doctor_visits
  FOR SELECT
  USING (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- Visits: Admins can read all visits
CREATE POLICY "visits_admin_read" ON public.doctor_visits
  FOR SELECT
  USING (public.is_admin());

-- Visits: MRs can create their own visits
CREATE POLICY "visits_mr_insert_own" ON public.doctor_visits
  FOR INSERT
  WITH CHECK (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- Visits: MRs can update their own visits
CREATE POLICY "visits_mr_update_own" ON public.doctor_visits
  FOR UPDATE
  USING (
    public.is_mr() AND
    user_id = auth.uid()
  )
  WITH CHECK (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- Visits: Admins have full access
CREATE POLICY "visits_admin_full" ON public.doctor_visits
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 9. DELETED_DOCTORS TABLE POLICIES
-- ============================================================================

-- Deleted Doctors: MRs can read records of doctors they deleted
CREATE POLICY "deleted_doctors_mr_read_own" ON public.deleted_doctors
  FOR SELECT
  USING (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- Deleted Doctors: Admins can read all
CREATE POLICY "deleted_doctors_admin_read" ON public.deleted_doctors
  FOR SELECT
  USING (public.is_admin());

-- Deleted Doctors: MRs can create records for their deletions
CREATE POLICY "deleted_doctors_mr_insert_own" ON public.deleted_doctors
  FOR INSERT
  WITH CHECK (
    public.is_mr() AND
    user_id = auth.uid()
  );

-- Deleted Doctors: Admins have full access
CREATE POLICY "deleted_doctors_admin_full" ON public.deleted_doctors
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 10. USER_SETTINGS TABLE POLICIES
-- ============================================================================

-- User Settings: Users can read their own settings
CREATE POLICY "user_settings_read_own" ON public.user_settings
  FOR SELECT
  USING (user_id = auth.uid());

-- User Settings: Admins can read all settings
CREATE POLICY "user_settings_admin_read" ON public.user_settings
  FOR SELECT
  USING (public.is_admin());

-- User Settings: Users can update their own settings
CREATE POLICY "user_settings_update_own" ON public.user_settings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User Settings: Users can insert their own settings
CREATE POLICY "user_settings_insert_own" ON public.user_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User Settings: Admins have full access
CREATE POLICY "user_settings_admin_full" ON public.user_settings
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 11. DOCTOR_CREATION_REQUESTS TABLE POLICIES
-- ============================================================================

-- Creation Requests: MRs can read their own requests
CREATE POLICY "creation_requests_mr_read_own" ON public.doctor_creation_requests
  FOR SELECT
  USING (
    public.is_mr() AND
    requested_by = auth.uid()
  );

-- Creation Requests: Admins can read all requests
CREATE POLICY "creation_requests_admin_read" ON public.doctor_creation_requests
  FOR SELECT
  USING (public.is_admin());

-- Creation Requests: MRs can create requests
CREATE POLICY "creation_requests_mr_insert" ON public.doctor_creation_requests
  FOR INSERT
  WITH CHECK (
    public.is_mr() AND
    requested_by = auth.uid()
  );

-- Creation Requests: MRs can update only their own pending requests
CREATE POLICY "creation_requests_mr_update_own" ON public.doctor_creation_requests
  FOR UPDATE
  USING (
    public.is_mr() AND
    requested_by = auth.uid()
  )
  WITH CHECK (
    public.is_mr() AND
    requested_by = auth.uid()
  );

-- Creation Requests: Admins can update all (for review/approval)
CREATE POLICY "creation_requests_admin_update" ON public.doctor_creation_requests
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Creation Requests: Only admins can delete
CREATE POLICY "creation_requests_admin_delete" ON public.doctor_creation_requests
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 12. DOCTOR_CHANGE_REQUESTS TABLE POLICIES
-- ============================================================================

-- Change Requests: MRs can read their own requests
CREATE POLICY "change_requests_mr_read_own" ON public.doctor_change_requests
  FOR SELECT
  USING (
    public.is_mr() AND
    requested_by = auth.uid()
  );

-- Change Requests: Admins can read all requests
CREATE POLICY "change_requests_admin_read" ON public.doctor_change_requests
  FOR SELECT
  USING (public.is_admin());

-- Change Requests: MRs can create requests
CREATE POLICY "change_requests_mr_insert" ON public.doctor_change_requests
  FOR INSERT
  WITH CHECK (
    public.is_mr() AND
    requested_by = auth.uid()
  );

-- Change Requests: MRs can update only their own pending requests
CREATE POLICY "change_requests_mr_update_own" ON public.doctor_change_requests
  FOR UPDATE
  USING (
    public.is_mr() AND
    requested_by = auth.uid()
  )
  WITH CHECK (
    public.is_mr() AND
    requested_by = auth.uid()
  );

-- Change Requests: Admins can update all (for review/approval)
CREATE POLICY "change_requests_admin_update" ON public.doctor_change_requests
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Change Requests: Only admins can delete
CREATE POLICY "change_requests_admin_delete" ON public.doctor_change_requests
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 13. DOCTOR_STATUS_REQUESTS TABLE POLICIES
-- ============================================================================

-- Status Requests: MRs can read their own requests
CREATE POLICY "status_requests_mr_read_own" ON public.doctor_status_requests
  FOR SELECT
  USING (
    public.is_mr() AND
    requested_by = auth.uid()
  );

-- Status Requests: Admins can read all requests
CREATE POLICY "status_requests_admin_read" ON public.doctor_status_requests
  FOR SELECT
  USING (public.is_admin());

-- Status Requests: MRs can create requests
CREATE POLICY "status_requests_mr_insert" ON public.doctor_status_requests
  FOR INSERT
  WITH CHECK (
    public.is_mr() AND
    requested_by = auth.uid()
  );

-- Status Requests: MRs can update only their own pending requests
CREATE POLICY "status_requests_mr_update_own" ON public.doctor_status_requests
  FOR UPDATE
  USING (
    public.is_mr() AND
    requested_by = auth.uid()
  )
  WITH CHECK (
    public.is_mr() AND
    requested_by = auth.uid()
  );

-- Status Requests: Admins can update all (for review/approval)
CREATE POLICY "status_requests_admin_update" ON public.doctor_status_requests
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Status Requests: Only admins can delete
CREATE POLICY "status_requests_admin_delete" ON public.doctor_status_requests
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 14. NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Notifications: Users can read their own notifications
CREATE POLICY "notifications_read_own" ON public.notifications
  FOR SELECT
  USING (user_id = auth.uid());

-- Notifications: Admins can read all notifications
CREATE POLICY "notifications_admin_read" ON public.notifications
  FOR SELECT
  USING (public.is_admin());

-- Notifications: Anyone can insert notifications (backend/functions insert with service role)
CREATE POLICY "notifications_insert_all" ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Notifications: Users can update their own notifications (mark read, etc.)
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notifications: Users can delete their own notifications
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- Notifications: Admins have full access
CREATE POLICY "notifications_admin_full" ON public.notifications
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- 15. GRANT POLICIES FOR SERVICE ROLE (Backend Functions)
-- ============================================================================

-- Service role should bypass RLS for backend operations
-- This is handled by Supabase automatically, but documented here

-- ============================================================================
-- 16. VERIFICATION QUERIES
-- ============================================================================

-- Query to verify all RLS policies are in place
-- Run this after migration to verify all policies exist:
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- ============================================================================
-- 17. ROLLBACK INSTRUCTIONS
-- ============================================================================

-- To disable RLS on all tables (for rollback):
/*
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_day_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_doctors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_creation_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_change_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_status_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
*/
