"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings as SettingsIcon,
  ArrowLeft,
  Bell,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { NotificationsService } from "@/lib/supabase/services";
import { LogoutConfirmationDialog } from "@/components/auth/LogoutConfirmationDialog";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  backButton?: {
    href?: string;
    label?: string;
  };
  onBack?: () => void;
  showSettings?: boolean;
  onSettingsClick?: () => void;
  showNotifications?: boolean;
  showLogout?: boolean;
  className?: string;
}

export function Header({
  title,
  subtitle,
  backButton,
  onBack,
  showSettings = true,
  onSettingsClick,
  showNotifications = true,
  showLogout = true,
  className,
}: HeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (user?.id && showNotifications) {
      loadUnreadCount();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user?.id, showNotifications]);

  async function loadUnreadCount() {
    if (!user?.id) return;

    try {
      const count = await NotificationsService.getNotificationBadgeCount(
        user.id,
      );
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load notification count:", error);
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await signOut();
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
      alert("Failed to logout. Please try again.");
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 sm:px-5 lg:px-6 py-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {backButton && (
            backButton.href ? (
              <Link
                href={backButton.href}
                className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
              >
                <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
              >
                <ArrowLeft className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </button>
            )
          )}
          <div className="min-w-0">
            {title && (
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && showNotifications && (
            <Link
              href="/notifications"
              className="relative flex items-center justify-center h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-600 rounded-full border-2 border-white dark:border-slate-950">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {showSettings && (
            <button
              type="button"
              onClick={onSettingsClick}
              className="flex items-center justify-center gap-2 h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700"
              aria-label="Settings"
            >
              <SettingsIcon className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-semibold">
                Settings
              </span>
            </button>
          )}

          {user && showLogout && (
            <>
              <button
                type="button"
                onClick={() => setShowLogoutDialog(true)}
                className="flex items-center justify-center gap-2 h-11 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-all border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-500/30"
                aria-label="Logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-semibold">
                  Logout
                </span>
              </button>

              <LogoutConfirmationDialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                onConfirm={handleLogout}
                isLoading={isLoggingOut}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
