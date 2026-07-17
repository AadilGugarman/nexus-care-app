-- ============================================================================
-- Phase 7: Notifications & Approval Tracking
-- Database Schema for Notification System
-- ============================================================================

-- ============================================================================
-- 1. Notifications Table
-- Stores notifications for users about request status changes
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL CHECK (type IN (
    'request_approved',
    'request_rejected',
    'request_pending'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related request reference (for navigation)
  request_type TEXT CHECK (request_type IN ('creation', 'change', 'status')),
  request_id INTEGER,
  
  -- Actor (who triggered the notification, e.g., admin who approved)
  actor_id UUID REFERENCES profiles(id),
  actor_name TEXT,
  
  -- Status
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Audit trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ============================================================================
-- Function: Create Notification
-- Helper function to create notifications
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_request_type TEXT DEFAULT NULL,
  p_request_id INTEGER DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_actor_name TEXT DEFAULT NULL
) RETURNS notifications AS $$
DECLARE
  v_notification notifications;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    request_type,
    request_id,
    actor_id,
    actor_name
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_request_type,
    p_request_id,
    p_actor_id,
    p_actor_name
  )
  RETURNING * INTO v_notification;
  
  RETURN v_notification;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Mark Notification as Read
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE id = p_notification_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Mark All Notifications as Read for User
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET read = TRUE, read_at = NOW()
  WHERE user_id = p_user_id AND read = FALSE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Get Unread Notification Count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = p_user_id AND read = FALSE;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function: Clean Old Read Notifications
-- Delete read notifications older than 30 days
-- ============================================================================

CREATE OR REPLACE FUNCTION clean_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE read = TRUE 
  AND read_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger: Auto-create notification on request approval/rejection
-- Automatically create notification when request status changes
-- ============================================================================

-- Function for creation requests
CREATE OR REPLACE FUNCTION notify_creation_request_status()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
BEGIN
  -- Only notify on status change to approved or rejected
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
    
    IF NEW.status = 'approved' THEN
      v_type := 'request_approved';
      v_title := 'Doctor Creation Request Approved';
      v_message := 'Your request to add doctor "' || NEW.name || '" has been approved.';
    ELSE
      v_type := 'request_rejected';
      v_title := 'Doctor Creation Request Rejected';
      v_message := 'Your request to add doctor "' || NEW.name || '" has been rejected.';
      
      IF NEW.admin_notes IS NOT NULL THEN
        v_message := v_message || ' Reason: ' || NEW.admin_notes;
      END IF;
    END IF;
    
    -- Create notification
    PERFORM create_notification(
      p_user_id := NEW.requested_by,
      p_type := v_type,
      p_title := v_title,
      p_message := v_message,
      p_request_type := 'creation',
      p_request_id := NEW.id,
      p_actor_id := NEW.reviewed_by,
      p_actor_name := (SELECT full_name FROM profiles WHERE id = NEW.reviewed_by)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for change requests
CREATE OR REPLACE FUNCTION notify_change_request_status()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
  v_doctor_name TEXT;
BEGIN
  -- Only notify on status change to approved or rejected
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
    
    -- Get doctor name
    SELECT doctor_name INTO v_doctor_name 
    FROM doctors 
    WHERE id = NEW.doctor_id;
    
    IF NEW.status = 'approved' THEN
      v_type := 'request_approved';
      v_title := 'Doctor Update Request Approved';
      v_message := 'Your changes to doctor "' || COALESCE(v_doctor_name, 'Unknown') || '" have been approved.';
    ELSE
      v_type := 'request_rejected';
      v_title := 'Doctor Update Request Rejected';
      v_message := 'Your changes to doctor "' || COALESCE(v_doctor_name, 'Unknown') || '" have been rejected.';
      
      IF NEW.admin_notes IS NOT NULL THEN
        v_message := v_message || ' Reason: ' || NEW.admin_notes;
      END IF;
    END IF;
    
    -- Create notification
    PERFORM create_notification(
      p_user_id := NEW.requested_by,
      p_type := v_type,
      p_title := v_title,
      p_message := v_message,
      p_request_type := 'change',
      p_request_id := NEW.id,
      p_actor_id := NEW.reviewed_by,
      p_actor_name := (SELECT full_name FROM profiles WHERE id = NEW.reviewed_by)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for status requests
CREATE OR REPLACE FUNCTION notify_status_request_status()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_type TEXT;
  v_doctor_name TEXT;
  v_action TEXT;
BEGIN
  -- Only notify on status change to approved or rejected
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
    
    -- Get doctor name and action
    SELECT doctor_name INTO v_doctor_name 
    FROM doctors 
    WHERE id = NEW.doctor_id;
    
    v_action := CASE 
      WHEN NEW.request_type = 'mark_inactive' THEN 'mark as inactive'
      ELSE 'mark as active'
    END;
    
    IF NEW.status = 'approved' THEN
      v_type := 'request_approved';
      v_title := 'Doctor Status Request Approved';
      v_message := 'Your request to ' || v_action || ' doctor "' || COALESCE(v_doctor_name, 'Unknown') || '" has been approved.';
    ELSE
      v_type := 'request_rejected';
      v_title := 'Doctor Status Request Rejected';
      v_message := 'Your request to ' || v_action || ' doctor "' || COALESCE(v_doctor_name, 'Unknown') || '" has been rejected.';
      
      IF NEW.admin_notes IS NOT NULL THEN
        v_message := v_message || ' Reason: ' || NEW.admin_notes;
      END IF;
    END IF;
    
    -- Create notification
    PERFORM create_notification(
      p_user_id := NEW.requested_by,
      p_type := v_type,
      p_title := v_title,
      p_message := v_message,
      p_request_type := 'status',
      p_request_id := NEW.id,
      p_actor_id := NEW.reviewed_by,
      p_actor_name := (SELECT full_name FROM profiles WHERE id = NEW.reviewed_by)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers: Attach notification functions to request tables
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_notify_creation_request ON doctor_creation_requests;
DROP TRIGGER IF EXISTS trigger_notify_change_request ON doctor_change_requests;
DROP TRIGGER IF EXISTS trigger_notify_status_request ON doctor_status_requests;

-- Create triggers
CREATE TRIGGER trigger_notify_creation_request
  AFTER UPDATE ON doctor_creation_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_creation_request_status();

CREATE TRIGGER trigger_notify_change_request
  AFTER UPDATE ON doctor_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_change_request_status();

CREATE TRIGGER trigger_notify_status_request
  AFTER UPDATE ON doctor_status_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_status_request_status();

-- ============================================================================
-- RLS Policies (DISABLED for Phase 7)
-- ============================================================================

-- Disable RLS as per requirements
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE notifications IS 'Stores notifications for users about request approvals and rejections';
COMMENT ON COLUMN notifications.type IS 'Type of notification: request_approved, request_rejected, request_pending';
COMMENT ON COLUMN notifications.request_type IS 'Type of related request: creation, change, status';
COMMENT ON COLUMN notifications.actor_id IS 'User who triggered the notification (e.g., admin who approved)';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read by the user';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify table created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'notifications';

-- Verify indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'notifications';

-- Verify functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%';

-- Verify triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%notify%';

