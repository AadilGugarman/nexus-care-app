'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { User, Crown, Briefcase, Loader2 } from 'lucide-react';
import { LogoutButton } from './LogoutButton';

interface UserDisplayProps {
  showLogout?: boolean;
  compact?: boolean;
}

export function UserDisplay({ showLogout = true, compact = false }: UserDisplayProps) {
  const { user, profile, role, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Sign In
        </Link>
        <span className="text-slate-600">•</span>
        <Link
          href="/signup"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  // Compact version (for mobile)
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {profile?.full_name || user.email}
            </div>
          </div>
        </div>
        {showLogout && (
          <LogoutButton variant="ghost" size="icon" showText={false} />
        )}
      </div>
    );
  }

  // Full version (for desktop)
  return (
    <div className="flex items-center gap-3">
      {/* User Avatar */}
      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
        <User className="w-5 h-5 text-blue-500" />
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {profile?.full_name || user.email}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          {role === 'admin' ? (
            <>
              <Crown className="w-3 h-3 text-yellow-500" />
              <span>Admin</span>
            </>
          ) : role === 'mr' ? (
            <>
              <Briefcase className="w-3 h-3 text-blue-500" />
              <span>MR</span>
            </>
          ) : (
            <>
              <User className="w-3 h-3" />
              <span>Public</span>
            </>
          )}
        </div>
      </div>

      {/* Logout Button */}
      {showLogout && (
        <LogoutButton variant="ghost" size="sm" />
      )}
    </div>
  );
}
