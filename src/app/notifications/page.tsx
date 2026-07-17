'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { NotificationsService, type Notification } from '@/lib/supabase/services';
import { Bell, Check, CheckCheck, Trash2, X, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadNotifications();
  }, [user, filter]);

  async function loadNotifications() {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = filter === 'unread'
        ? await NotificationsService.getUnreadNotifications(user.id)
        : await NotificationsService.getRecentNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id: number) {
    if (!user?.id) return;

    try {
      await NotificationsService.markAsRead(id, user.id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
      );
      toast.success('Marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  }

  async function handleMarkAllAsRead() {
    if (!user?.id) return;

    try {
      const count = await NotificationsService.markAllAsRead(user.id);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      toast.success(`Marked ${count} notifications as read`);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  }

  async function handleDelete(id: number) {
    if (!user?.id) return;

    try {
      await NotificationsService.deleteNotification(id, user.id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  }

  async function handleDeleteAllRead() {
    if (!user?.id) return;
    if (!confirm('Delete all read notifications?')) return;

    try {
      const count = await NotificationsService.deleteAllRead(user.id);
      setNotifications(prev => prev.filter(n => !n.read));
      toast.success(`Deleted ${count} notifications`);
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      toast.error('Failed to delete notifications');
    }
  }

  function getNotificationIcon(type: Notification['type']) {
    switch (type) {
      case 'request_approved':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'request_rejected':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'request_pending':
        return <Clock className="w-6 h-6 text-yellow-600" />;
    }
  }

  function getNotificationColor(type: Notification['type']) {
    switch (type) {
      case 'request_approved':
        return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10';
      case 'request_rejected':
        return 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10';
      case 'request_pending':
        return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10';
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-slate-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Notifications
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Track the status of your doctor requests
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                  filter === 'unread'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark All Read
                </button>
              )}
              {notifications.filter(n => n.read).length > 0 && (
                <button
                  onClick={handleDeleteAllRead}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <Bell className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`rounded-lg border p-4 transition-all ${
                  notification.read
                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-70'
                    : `${getNotificationColor(notification.type)} border-2`
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(notification.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 mb-3">
                      {notification.message}
                    </p>

                    {notification.actor_name && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        Reviewed by: <span className="font-medium">{notification.actor_name}</span>
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
