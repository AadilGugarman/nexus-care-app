'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { NotificationsService, type Notification } from '@/lib/supabase/services';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowLeft,
  AlertCircle,
  FileText,
  Edit,
  Power
} from 'lucide-react';
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
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
      );
      
      await NotificationsService.markAsRead(id, user.id);
      toast.success('Marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
      loadNotifications();
    }
  }

  async function handleMarkAllAsRead() {
    if (!user?.id) return;

    try {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      
      const count = await NotificationsService.markAllAsRead(user.id);
      toast.success(`Marked ${count} notification${count !== 1 ? 's' : ''} as read`);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
      loadNotifications();
    }
  }

  async function handleDelete(id: number) {
    if (!user?.id) return;

    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await NotificationsService.deleteNotification(id, user.id);
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
      loadNotifications();
    }
  }

  async function handleDeleteAllRead() {
    if (!user?.id) return;
    
    const readCount = notifications.filter(n => n.read).length;
    if (readCount === 0) return;
    
    if (!confirm(`Delete all ${readCount} read notification${readCount !== 1 ? 's' : ''}?`)) return;

    try {
      setNotifications(prev => prev.filter(n => !n.read));
      const count = await NotificationsService.deleteAllRead(user.id);
      toast.success(`Deleted ${count} notification${count !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      toast.error('Failed to delete notifications');
      loadNotifications();
    }
  }

  function getNotificationIcon(type: Notification['type']) {
    switch (type) {
      case 'request_approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'request_rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'request_pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  }

  function getRequestTypeIcon(requestType: Notification['request_type']) {
    switch (requestType) {
      case 'creation':
        return <FileText className="w-4 h-4" />;
      case 'change':
        return <Edit className="w-4 h-4" />;
      case 'status':
        return <Power className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  }

  function getNotificationLink(notification: Notification): string {
    if (role === 'admin' && notification.type === 'request_pending') {
      return '/admin/reviews';
    }
    if (role === 'mr' && notification.request_id) {
      return '/my-requests';
    }
    return role === 'admin' ? '/admin' : '/';
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    const link = getNotificationLink(notification);
    router.push(link);
  }

  function handleBack() {
    if (role === 'admin') {
      router.push('/admin');
    } else if (role === 'mr') {
      router.push('/');
    } else {
      router.back();
    }
  }

  function getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: diffDays < 365 ? undefined : 'numeric',
    });
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-slate-800 rounded-lg animate-pulse"></div>
              <div className="h-8 w-48 bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-24 h-10 bg-slate-700 rounded-lg animate-pulse"></div>
                <div className="w-24 h-10 bg-slate-700 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-800 rounded-lg border border-slate-700 p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-slate-700 rounded w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Notifications</h1>
                {unreadCount > 0 && (
                  <p className="text-sm text-slate-400">
                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                All <span className="ml-1.5 opacity-70">({notifications.length})</span>
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  filter === 'unread'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all duration-200 text-sm font-medium"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark All Read</span>
                </button>
              )}
              {notifications.filter(n => n.read).length > 0 && (
                <button
                  onClick={handleDeleteAllRead}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-200 text-sm font-medium border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete Read</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center shadow-xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-700/50 mb-4">
              <Bell className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {filter === 'unread' ? 'All Caught Up!' : 'No Notifications Yet'}
            </h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              {filter === 'unread' 
                ? "You've read all your notifications. Check back later for updates!"
                : "You'll see notifications here when there are updates to your requests."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`group rounded-xl border p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl ${
                  notification.read
                    ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    : 'bg-slate-800 border-blue-500/50 hover:border-blue-500 ring-2 ring-blue-500/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
                    notification.read ? 'bg-slate-700' : 'bg-slate-700 ring-2 ring-blue-500/30'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-blue-500 text-white rounded-full">
                              NEW
                            </span>
                          )}
                        </div>
                        {notification.request_type && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                            {getRequestTypeIcon(notification.request_type)}
                            <span className="capitalize">{notification.request_type} Request</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {getRelativeTime(notification.created_at)}
                      </span>
                    </div>

                    <p className="text-slate-300 mb-3 leading-relaxed">
                      {notification.message}
                    </p>

                    {notification.actor_name && (
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3 bg-slate-900/50 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>
                          Reviewed by <span className="font-semibold text-slate-300">{notification.actor_name}</span>
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-all duration-200 font-medium"
                        >
                          <Check className="w-4 h-4" />
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all duration-200 font-medium border border-red-500/20"
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
