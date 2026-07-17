'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { NotificationsService } from '@/lib/supabase/services';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user?.id]);

  async function loadUnreadCount() {
    if (!user?.id) return;
    
    try {
      const count = await NotificationsService.getNotificationBadgeCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load notification count:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!user || loading) {
    return null;
  }

  return (
    <Link
      href="/notifications"
      className="relative p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
