-- ============================================================================
-- Migration 001: Add Missing Columns & Functions
-- Fixes production errors for Phase 10 & doctor requests features
-- ============================================================================

-- 1. Add missing columns to profiles table (soft delete support)
ALTER TABLE IF EXISTS public.profiles
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone DEFAULT NULL;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_deleted ON public.profiles(is_deleted);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);

-- 2. Add review_history column to doctor_creation_requests
ALTER TABLE IF EXISTS public.doctor_creation_requests
ADD COLUMN IF NOT EXISTS review_history jsonb DEFAULT '[]'::jsonb;

-- Add review_history to doctor_change_requests
ALTER TABLE IF EXISTS public.doctor_change_requests
ADD COLUMN IF NOT EXISTS review_history jsonb DEFAULT '[]'::jsonb;

-- Add review_history to doctor_status_requests
ALTER TABLE IF EXISTS public.doctor_status_requests
ADD COLUMN IF NOT EXISTS review_history jsonb DEFAULT '[]'::jsonb;

-- 3. Create RPC function for refreshing user activity stats
CREATE OR REPLACE FUNCTION public.refresh_user_activity_stats()
RETURNS void
LANGUAGE sql
AS $$
  -- This is a placeholder. In production, implement materialized view refresh here.
  -- For now, this allows the function call to succeed without error.
$$;

-- 4. Add RPC helper functions for user management
CREATE OR REPLACE FUNCTION public.soft_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET is_deleted = true, deleted_at = now()
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET is_deleted = false, deleted_at = NULL
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_last_login(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = now()
  WHERE id = p_user_id;
END;
$$;

-- 5. Create indexes for request history queries
CREATE INDEX IF NOT EXISTS idx_doctor_creation_requests_review_history 
ON public.doctor_creation_requests USING gin(review_history);

CREATE INDEX IF NOT EXISTS idx_doctor_change_requests_review_history 
ON public.doctor_change_requests USING gin(review_history);

CREATE INDEX IF NOT EXISTS idx_doctor_status_requests_review_history 
ON public.doctor_status_requests USING gin(review_history);

-- ============================================================================
-- Optional: Create materialized view for user activity stats
-- Uncomment if you want better performance for the admin users page
-- ============================================================================
/*
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_activity_stats AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.role,
  p.status,
  p.territory,
  p.last_login,
  p.created_at as join_date,
  
  -- Doctor contributions
  COALESCE(dcr_count.count, 0) as doctors_added,
  0 as doctors_edited,
  
  -- Request statistics
  COALESCE(dcr_pending.count, 0) as pending_creation_requests,
  COALESCE(dcr_approved.count, 0) as approved_creation_requests,
  COALESCE(dcr_rejected.count, 0) as rejected_creation_requests,
  COALESCE(dcr_count.count, 0) as total_creation_requests,
  
  COALESCE(dchr_pending.count, 0) as pending_change_requests,
  COALESCE(dchr_approved.count, 0) as approved_change_requests,
  COALESCE(dchr_rejected.count, 0) as rejected_change_requests,
  COALESCE(dchr_count.count, 0) as total_change_requests,
  
  COALESCE(dsr_pending.count, 0) as pending_status_requests,
  COALESCE(dsr_approved.count, 0) as approved_status_requests,
  COALESCE(dsr_rejected.count, 0) as rejected_status_requests,
  COALESCE(dsr_count.count, 0) as total_status_requests,
  
  -- Totals
  COALESCE(dcr_count.count, 0) + COALESCE(dchr_count.count, 0) + COALESCE(dsr_count.count, 0) as total_requests,
  COALESCE(dcr_pending.count, 0) + COALESCE(dchr_pending.count, 0) + COALESCE(dsr_pending.count, 0) as total_pending_requests,
  COALESCE(dcr_approved.count, 0) + COALESCE(dchr_approved.count, 0) + COALESCE(dsr_approved.count, 0) as total_approved_requests,
  COALESCE(dcr_rejected.count, 0) + COALESCE(dchr_rejected.count, 0) + COALESCE(dsr_rejected.count, 0) as total_rejected_requests,
  
  -- Visits
  0 as total_visits,
  0 as visits_this_month
FROM public.profiles p
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_creation_requests GROUP BY requested_by) dcr_count ON p.id = dcr_count.requested_by
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_creation_requests WHERE status = 'pending' GROUP BY requested_by) dcr_pending ON p.id = dcr_pending.requested_by
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_creation_requests WHERE status = 'approved' GROUP BY requested_by) dcr_approved ON p.id = dcr_approved.requested_by
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_creation_requests WHERE status = 'rejected' GROUP BY requested_by) dcr_rejected ON p.id = dcr_rejected.requested_by
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_change_requests GROUP BY requested_by) dchr_count ON p.id = dchr_count.requested_by
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_change_requests WHERE status = 'pending' GROUP BY requested_by) dchr_pending ON p.id = dchr_pending.requested_by
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_change_requests WHERE status = 'approved' GROUP BY requested_by) dchr_approved ON p.id = dchr_approved.requested_by
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_change_requests WHERE status = 'rejected' GROUP BY requested_by) dchr_rejected ON p.id = dchr_rejected.requested_by
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_status_requests GROUP BY requested_by) dsr_count ON p.id = dsr_count.requested_by
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_status_requests WHERE status = 'pending' GROUP BY requested_by) dsr_pending ON p.id = dsr_pending.requested_by
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_status_requests WHERE status = 'approved' GROUP BY requested_by) dsr_approved ON p.id = dsr_approved.requested_by
LEFT JOIN (SELECT requested_by, COUNT(*) as count FROM public.doctor_status_requests WHERE status = 'rejected' GROUP BY requested_by) dsr_rejected ON p.id = dsr_rejected.requested_by
WHERE p.is_deleted = false;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_stats_user_id ON public.user_activity_stats(user_id);
*/
