// ============================================================================
// Phase 7: Notifications Service
// Service layer for notification management
// ============================================================================

import { supabase } from '../client';

export interface Notification {
  id: number;
  user_id: string;
  type: 'request_approved' | 'request_rejected' | 'request_pending';
  title: string;
  message: string;
  request_type: 'creation' | 'change' | 'status' | null;
  request_id: number | null;
  actor_id: string | null;
  actor_name: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationFilters {
  read?: boolean; // Filter by read/unread
  type?: Notification['type']; // Filter by notification type
  limit?: number; // Limit results
}

// Type-safe helper for notifications table
const notificationsTable = () => (supabase as any).from('notifications');

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Get notifications for current user
 */
export async function getNotifications(
  userId: string,
  filters?: NotificationFilters
): Promise<Notification[]> {
  let query = notificationsTable()
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.read !== undefined) {
    query = query.eq('read', filters.read);
  }
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data as Notification[]) || [];
}

/**
 * Get unread notification count for user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  // Use database function for efficiency
  const { data, error } = await (supabase as any)
    .rpc('get_unread_notification_count', { p_user_id: userId });

  if (error) {
    // Fallback to direct query if function fails
    const { count } = await notificationsTable()
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    return count || 0;
  }

  return data || 0;
}

/**
 * Get single notification by ID
 */
export async function getNotificationById(
  id: number,
  userId: string
): Promise<Notification | null> {
  const { data, error } = await notificationsTable()
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data as Notification;
}

// ============================================================================
// Mutation Operations
// ============================================================================

/**
 * Mark notification as read
 */
export async function markAsRead(id: number, userId: string): Promise<Notification> {
  const { data, error } = await notificationsTable()
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}

/**
 * Mark all notifications as read for user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  // Use database function for efficiency
  const { data, error } = await (supabase as any)
    .rpc('mark_all_notifications_read', { p_user_id: userId });

  if (error) {
    // Fallback to direct update if function fails
    const { data: updated, error: updateError } = await notificationsTable()
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('read', false)
      .select();

    if (updateError) throw updateError;
    return (updated as Notification[])?.length || 0;
  }

  return data || 0;
}

/**
 * Delete notification
 */
export async function deleteNotification(id: number, userId: string): Promise<void> {
  const { error } = await notificationsTable()
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Delete all read notifications for user
 */
export async function deleteAllRead(userId: string): Promise<number> {
  const { data, error } = await notificationsTable()
    .delete()
    .eq('user_id', userId)
    .eq('read', true)
    .select();

  if (error) throw error;
  return (data as Notification[])?.length || 0;
}

// ============================================================================
// Manual Notification Creation (for testing or special cases)
// ============================================================================

/**
 * Create a notification manually (use with caution - usually auto-created by triggers)
 */
export async function createNotification(
  userId: string,
  notification: {
    type: Notification['type'];
    title: string;
    message: string;
    request_type?: 'creation' | 'change' | 'status';
    request_id?: number;
    actor_id?: string;
    actor_name?: string;
  }
): Promise<Notification> {
  const { data, error } = await notificationsTable()
    .insert({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      request_type: notification.request_type || null,
      request_id: notification.request_id || null,
      actor_id: notification.actor_id || null,
      actor_name: notification.actor_name || null,
      read: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get notification badge count (for UI display)
 * Returns count capped at 99 (displays as "99+" in UI)
 */
export async function getNotificationBadgeCount(userId: string): Promise<number> {
  const count = await getUnreadCount(userId);
  return Math.min(count, 99);
}

/**
 * Get recent notifications (last 20)
 */
export async function getRecentNotifications(userId: string): Promise<Notification[]> {
  return getNotifications(userId, { limit: 20 });
}

/**
 * Get unread notifications only
 */
export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  return getNotifications(userId, { read: false });
}

/**
 * Check if user has unread notifications
 */
export async function hasUnreadNotifications(userId: string): Promise<boolean> {
  const count = await getUnreadCount(userId);
  return count > 0;
}

// ============================================================================
// Notification Service Class (for organized exports)
// ============================================================================

export class NotificationsService {
  // Query methods
  static getNotifications = getNotifications;
  static getNotificationById = getNotificationById;
  static getUnreadCount = getUnreadCount;
  static getRecentNotifications = getRecentNotifications;
  static getUnreadNotifications = getUnreadNotifications;
  static hasUnreadNotifications = hasUnreadNotifications;
  static getNotificationBadgeCount = getNotificationBadgeCount;

  // Mutation methods
  static markAsRead = markAsRead;
  static markAllAsRead = markAllAsRead;
  static deleteNotification = deleteNotification;
  static deleteAllRead = deleteAllRead;
  static createNotification = createNotification;
}

